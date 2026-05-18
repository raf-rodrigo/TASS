import { notificationService } from './notificationService';

const CLIENT_ID = '852004924790-groj6mfjrak697vv3ntmeeajk4ineuv3.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile';
const FOLDER_NAME = 'TASS';

let tokenClient = null;
let accessToken = null;
let authChangeCallback = null;
let userProfile = null;
let cachedFolderId = null;

export const googleDriveService = {
  /**
   * Inicializa o cliente GIS (Google Identity Services)
   */
  async init(onAuthChange) {
    authChangeCallback = onAuthChange;
    
    await this._loadGoogleScript();

    return new Promise((resolve) => {
      this._setupTokenClient(resolve);
    });
  },

  /**
   * Injeta o script do Google dinamicamente
   */
  _loadGoogleScript() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }

      if (document.getElementById('google-gsi-client')) {
        const checkInterval = setInterval(() => {
          if (typeof google !== 'undefined' && google.accounts) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Google GSI script'));
      document.head.appendChild(script);
    });
  },

  _setupTokenClient(resolve) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error) {
          notificationService.toast('Falha na autenticação com o Google', 'error');
          return;
        }
        accessToken = response.access_token;
        
        const expiryTime = Date.now() + (response.expires_in * 1000);
        localStorage.setItem('tass_google_access_token', accessToken);
        localStorage.setItem('tass_google_token_expiry', expiryTime.toString());

        await this.getUserProfile();
        if (authChangeCallback) authChangeCallback(true, userProfile);
        resolve(accessToken);
      },
    });

    const savedToken = localStorage.getItem('tass_google_access_token');
    const expiry = localStorage.getItem('tass_google_token_expiry');

    if (savedToken && expiry) {
      const isExpired = Date.now() > parseInt(expiry);
      if (!isExpired) {
        accessToken = savedToken;
        this.getUserProfile().then(() => {
          if (authChangeCallback) authChangeCallback(true, userProfile);
        });
      } else {
        this.clearSession();
      }
    }

    resolve();
  },

  /**
   * Busca informações do perfil do usuário
   */
  async getUserProfile() {
    if (!accessToken) return;
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.status === 401 || response.status === 403) {
        this.clearSession();
        return;
      }
      if (!response.ok) throw new Error('Falha ao buscar perfil');
      userProfile = await response.json();
      return userProfile;
    } catch (error) {
      console.error('Google UserInfo Error:', error);
      userProfile = null;
    }
  },

  getProfile() {
    return userProfile;
  },

  async login() {
    if (!tokenClient) await this.init();
    tokenClient.requestAccessToken({ prompt: 'consent' });
  },

  clearSession() {
    accessToken = null;
    userProfile = null;
    cachedFolderId = null;
    localStorage.removeItem('tass_google_access_token');
    localStorage.removeItem('tass_google_token_expiry');
    if (authChangeCallback) authChangeCallback(false, null);
  },

  logout() {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {
        this.clearSession();
        notificationService.toast('Desconectado do Google Drive');
      });
    } else {
      this.clearSession();
    }
  },

  /**
   * Encontra ou cria a pasta 'TASS' no Drive (Case Insensitive)
   */
  async getOrCreateFolder() {
    if (!accessToken) throw new Error('Não autenticado');
    if (cachedFolderId) return cachedFolderId;

    const query = encodeURIComponent(`name contains '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();

    const folder = data.files?.find(f => f.name.toLowerCase() === FOLDER_NAME.toLowerCase());
    
    if (folder) {
      cachedFolderId = folder.id;
      return folder.id;
    }

    console.log('[TASS] Criando pasta centralizada TASS no Drive...');
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    const newFolder = await createResponse.json();
    cachedFolderId = newFolder.id;
    return newFolder.id;
  },

  /**
   * Upload de backup
   */
  async uploadBackup(data) {
    try {
      if (!accessToken) throw new Error('Não autenticado');
      const folderId = await this.getOrCreateFolder();
      
      const filename = `tass_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const metadata = {
        name: filename,
        parents: [folderId],
        mimeType: 'application/json'
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      });

      if (!response.ok) throw new Error('Falha no upload');
      return true;
    } catch (error) {
      console.error('Google Drive Upload Error:', error);
      notificationService.alert('Erro no Backup', 'Não foi possível salvar na pasta TASS.', 'error');
      return false;
    }
  },

  async listBackups() {
    try {
      if (!accessToken) throw new Error('Não autenticado');
      const folderId = await this.getOrCreateFolder();

      const query = encodeURIComponent(`'${folderId}' in parents and name contains 'tass_backup' and trashed = false`);
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id, name, createdTime)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Google Drive List Error:', error);
      return [];
    }
  },

  async downloadBackup(fileId) {
    try {
      if (!accessToken) throw new Error('Não autenticado');
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('Falha no download');
      return await response.json();
    } catch (error) {
      console.error('Google Drive Download Error:', error);
      return null;
    }
  },

  async deleteBackup(fileId) {
    try {
      if (!accessToken) throw new Error('Não autenticado');
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('Falha na exclusão');
      notificationService.toast('Arquivo removido da pasta TASS!', 'success');
      return true;
    } catch (error) {
      console.error('Google Drive Delete Error:', error);
      return false;
    }
  },

  async listImageFiles() {
    try {
      if (!accessToken) throw new Error('Não autenticado');
      const folderId = await this.getOrCreateFolder();
      
      const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, thumbnailLink, mimeType)&pageSize=50`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          this.clearSession();
          notificationService.alert('Acesso Expirado', 'Por favor, conecte-se novamente ao Google Drive.', 'info');
        }
        return [];
      }
      
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Google Drive List Images Error:', error);
      return [];
    }
  },

  async importWallpaper(fileId, fileName) {
    if (!accessToken) throw new Error('Não autenticado');
    try {
      const response = await fetch('http://127.0.0.1:5176/api/drive/import-wallpaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, fileName, accessToken })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha na importação');
      }
      return await response.json();
    } catch (error) {
      console.error('Import Wallpaper Error:', error);
      throw error;
    }
  },

  isAuthenticated() {
    return !!accessToken;
  }
};
