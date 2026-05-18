import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs/promises';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5176;

// Configuração de CORS Permissiva
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de Log Detalhado
app.use((req, res, next) => {
  console.log(`[TASS] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('[TASS] Payload Body:', JSON.stringify(req.body).substring(0, 100) + '...');
  }
  next();
});

// --- API ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.5', port: PORT });
});

// Endpoint para importar wallpaper do Google Drive (USANDO HASH)
app.post('/api/drive/import-wallpaper', async (req, res) => {
  const { fileId, fileName, accessToken } = req.body;
  if (!fileId || !fileName || !accessToken) {
    console.error('[TASS] Erro: Dados insuficientes no payload.');
    return res.status(400).json({ error: 'Dados insuficientes.' });
  }

  try {
    console.log(`[TASS] Solicitando arquivo ao Google Drive: ${fileId}`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TASS] Erro Google Drive (${response.status}):`, errorText);
      throw new Error(`Erro no Google Drive: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // --- GERAÇÃO DE HASH PARA NOME FÍSICO ---
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const ext = path.extname(fileName).toLowerCase() || '.jpg';
    const hashedFileName = `${hash}${ext}`;

    const wallpapersDir = path.resolve(__dirname, 'public', 'wallpapers');
    await fs.mkdir(wallpapersDir, { recursive: true });

    const finalPath = path.join(wallpapersDir, hashedFileName);
    
    await fs.writeFile(finalPath, buffer);
    console.log(`[TASS] ARQUIVO SALVO NO DISCO: ${hashedFileName} (Original: ${fileName})`);
    
    res.json({ 
      success: true, 
      url: `/wallpapers/${hashedFileName}`,
      name: fileName,
      hash: hashedFileName 
    });
  } catch (error) {
    console.error('[TASS] Erro fatal no Import:', error.message);
    res.status(500).json({ error: `Falha no download: ${error.message}` });
  }
});

// Endpoint para listar wallpapers locais
app.get('/api/wallpapers', async (req, res) => {
  try {
    const wallpapersDir = path.resolve(__dirname, 'public', 'wallpapers');
    await fs.mkdir(wallpapersDir, { recursive: true });
    const files = await fs.readdir(wallpapersDir);
    const list = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).map(f => ({
      name: f,
      url: `/wallpapers/${f}`,
      isLocal: true
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json([]);
  }
});

// Endpoint para excluir wallpaper físico
app.delete('/api/wallpapers/:name', async (req, res) => {
  try {
    const fileName = decodeURIComponent(req.params.name);
    const wallpapersDir = path.resolve(__dirname, 'public', 'wallpapers');
    const filePath = path.join(wallpapersDir, fileName);

    console.log(`[TASS] Tentativa de exclusão física: ${filePath}`);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`[TASS] Arquivo excluído com sucesso: ${fileName}`);
      res.json({ success: true });
    } catch (e) {
      console.warn(`[TASS] Arquivo não encontrado para exclusão direta: ${fileName}`);
      res.status(404).json({ error: 'Não encontrado' });
    }
  } catch (error) {
    console.error('[TASS] Erro fatal na exclusão:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// --- ESTÁTICOS ---
app.use('/wallpapers', express.static(path.join(__dirname, 'public', 'wallpapers')));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) res.status(404).send('API TASS 5176');
  });
});

app.listen(PORT, () => {
  console.log('\x1b[35m%s\x1b[0m', `[TASS] VERSÃO 1.0.5 - BACKEND ATIVO EM: http://127.0.0.1:${PORT}`);
  console.log('[TASS] CORS permitido para todas as origens.');
});
