import { notificationService } from './notificationService';

const CLIENT_ID = '852004924790-groj6mfjrak697vv3ntmeeajk4ineuv3.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';
const FOLDER_NAME = 'TASS Backups';

let tokenClient = null;
let accessToken = null;
let authChangeCallback = null;

export const googleDriveService = {
  /**
   * Inicializa o cliente GIS (Google Identity Services)
   * Carrega o script dinamicamente se ainda não estiver presente
   */
  async init(onAuthChange) {
    authChangeCallback = onAuthChange;
    
    // 1. Garante que o script do Google esteja carregado
    await this._loadGoogleScript();

    // 2. Configura o cliente de token
    return new Promise((resolve) => {
      this._setupTokenClient(resolve);
    });
  },

  /**
   * Injeta o script do Google no documento dinamicamente
   */
  _loadGoogleScript() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }

      // Evita carregar múltiplos scripts se chamado simultaneamente
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
      callback: (response) => {
        if (response.error) {
          notificationService.toast('Falha na autenticação com o Google', 'error');
          return;
        }
        accessToken = response.access_token;
        
        // Persiste o token e a expiração (expires_in vem em segundos)
        const expiryTime = Date.now() + (response.expires_in * 1000);
        localStorage.setItem('tass_google_access_token', accessToken);
        localStorage.setItem('tass_google_token_expiry', expiryTime.toString());

        if (authChangeCallback) authChangeCallback(true);
        resolve(accessToken);
      },
    });

    // Tenta recuperar sessão existente do localStorage
    const savedToken = localStorage.getItem('tass_google_access_token');
    const expiry = localStorage.getItem('tass_google_token_expiry');

    if (savedToken && expiry) {
      const isExpired = Date.now() > parseInt(expiry);
      if (!isExpired) {
        accessToken = savedToken;
        if (authChangeCallback) authChangeCallback(true);
      } else {
        this.clearSession();
      }
    }

    resolve();
  },

  /**
   * Solicita um token de acesso ao usuário
   */
  async login() {
    if (!tokenClient) await this.init();
    tokenClient.requestAccessToken({ prompt: 'consent' });
  },

  /**
   * Limpa os dados de sessão localmente
   */
  clearSession() {
    accessToken = null;
    localStorage.removeItem('tass_google_access_token');
    localStorage.removeItem('tass_google_token_expiry');
    if (authChangeCallback) authChangeCallback(false);
  },

  /**
   * Faz logout e revoga o acesso
   */
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
   * Encontra ou cria a pasta de backups no Drive
   */
  async getOrCreateFolder() {
    if (!accessToken) throw new Error('Não autenticado');

    // 1. Procurar a pasta
    const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();

    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // 2. Criar se não existir
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
    const folder = await createResponse.json();
    return folder.id;
  },

  /**
   * Faz upload de um backup para o Drive
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
      notificationService.alert('Erro no Backup', 'Não foi possível salvar no Google Drive.', 'error');
      return false;
    }
  },

  /**
   * Lista arquivos de backup na pasta do Drive
   */
  async listBackups() {
    try {
      if (!accessToken) throw new Error('Não autenticado');
      const folderId = await this.getOrCreateFolder();

      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
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

  /**
   * Baixa o conteúdo de um arquivo de backup
   */
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
      notificationService.alert('Erro na Restauração', 'Não foi possível baixar o backup do Google Drive.', 'error');
      return null;
    }
  },

  /**
   * Exclui um arquivo de backup do Drive
   */
  async deleteBackup(fileId) {
    try {
      if (!accessToken) throw new Error('Não autenticado');

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) throw new Error('Falha na exclusão');

      notificationService.toast('Backup removido do Google Drive!', 'success');
      return true;
    } catch (error) {
      console.error('Google Drive Delete Error:', error);
      notificationService.alert('Erro na Exclusão', 'Não foi possível remover o arquivo da nuvem.', 'error');
      return false;
    }
  },

  isAuthenticated() {
    return !!accessToken;
  }
};
