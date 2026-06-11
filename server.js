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
const PORT = process.env.PORT || 5176;

// Configuração de CORS Restrita a Origens de Desenvolvimento Local e do Servidor
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/
];

app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  let corsOptions = {
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-TASS-Client']
  };

  if (!origin) {
    corsOptions.origin = true;
  } else {
    const host = req.get('host');
    const isAllowed = allowedOrigins.some(regex => regex.test(origin)) || (host && origin.includes(host));
    if (isAllowed) {
      corsOptions.origin = true;
    } else {
      console.warn(`[TASS] Requisição bloqueada por política CORS de origem não confiável: ${origin}`);
      return callback(new Error('Bloqueado por política CORS do TASS (Origem não confiável)'));
    }
  }
  callback(null, corsOptions);
}));

// Middleware de Autenticação Básica (Basic Auth) para Produção
    app.use((req, res, next) => {
      const expectedPassword = process.env.TASS_PASSWORD;

      // Se a senha não estiver configurada no ambiente (ex: desenvolvimento local), libera o acesso
      if (!expectedPassword) {
        return next();
      }

      const expectedUser = process.env.TASS_USER || 'admin';
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="TASS Secure Area"');
        return res.status(401).send('Autenticação necessária.');
      }

      try {
        const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
        const user = auth[0];
        const pass = auth[1];

        if (user === expectedUser && pass === expectedPassword) {
          return next();
        }
      } catch (err) {
        // Erro ao decodificar as credenciais
      }

      res.setHeader('WWW-Authenticate', 'Basic realm="TASS Secure Area"');
      return res.status(401).send('Credenciais inválidas.');
    });

    
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
