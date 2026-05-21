import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs/promises';
import crypto from 'crypto';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5176;

// Configuração de CORS Restrita a Origens de Desenvolvimento Local
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origem (como ferramentas locais de backend ou carregamento direto)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(regex => regex.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[TASS] Requisição bloqueada por política CORS de origem não confiável: ${origin}`);
      callback(new Error('Bloqueado por política CORS do TASS (Origem não confiável)'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-TASS-Client']
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
    const filePath = path.resolve(wallpapersDir, fileName);

    // Proteção contra Path Traversal: Garante que o caminho resolvido está estritamente dentro de wallpapersDir
    if (!filePath.startsWith(wallpapersDir)) {
      console.warn(`[TASS] Bloqueada tentativa de Path Traversal na exclusão: ${fileName}`);
      return res.status(403).json({ error: 'Acesso negado. Operação não autorizada.' });
    }

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

// Endpoint para executar comandos no terminal do sistema (PowerShell no Windows, Bash no Linux/macOS)
app.post('/api/terminal/execute', (req, res) => {
  if (req.headers['x-tass-client'] !== 'true') {
    console.warn(`[TASS] Requisição de terminal bloqueada: Cabeçalho 'X-TASS-Client' ausente ou inválido.`);
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }

  const { command, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Comando não fornecido.' });
  }

  const targetCwd = cwd || __dirname;
  const separator = '___PWD_SEPARATOR___';
  
  const isWin = process.platform === 'win32';
  
  // Embrulha o comando de acordo com o OS para coletar o novo diretório atualizado
  const wrappedCommand = isWin
    ? `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${command}\nWrite-Output "${separator}"\n(Get-Item .).FullName`
    : `${command}\necho "${separator}"\npwd`;

  const shellOption = isWin ? 'powershell.exe' : '/bin/bash';

  console.log(`[TASS] Executando no Terminal (${isWin ? 'Windows' : 'Linux/Unix'}): "${command}" em CWD: "${targetCwd}"`);

  exec(wrappedCommand, { cwd: targetCwd, shell: shellOption }, (error, stdout, stderr) => {
    let realStdout = stdout || '';
    let nextCwd = targetCwd;

    if (realStdout.includes(separator)) {
      const parts = realStdout.split(separator);
      realStdout = parts[0].trim();
      const pathPart = parts[1] ? parts[1].trim() : '';
      if (pathPart) {
        nextCwd = pathPart;
      }
    }

    res.json({
      stdout: realStdout,
      stderr: stderr || '',
      cwd: nextCwd,
      code: error ? error.code : 0,
      error: error ? error.message : null
    });
  });
});

// Endpoint para obter informações iniciais do terminal
app.get('/api/terminal/info', (req, res) => {
  if (req.headers['x-tass-client'] !== 'true') {
    console.warn(`[TASS] Requisição de informações do terminal bloqueada: Cabeçalho 'X-TASS-Client' ausente ou inválido.`);
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }
  res.json({ cwd: __dirname });
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
