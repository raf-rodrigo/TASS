import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs/promises';
import crypto from 'crypto';
import { exec } from 'child_process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { database } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5176;
const JWT_SECRET = process.env.JWT_SECRET || 'tass_default_super_secret_key_12345';

// Configuração de CORS Restrita a Origens de Desenvolvimento Local e do Servidor
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/
];

app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  let corsOptions = {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

app.use(express.json());

// Middleware de Log Detalhado
app.use((req, res, next) => {
  console.log(`[TASS] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  next();
});

// --- API DE AUTENTICAÇÃO PÚBLICA ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }
    if (username.length < 3 || password.length < 4) {
      return res.status(400).json({ error: 'Usuário mínimo de 3 caracteres, senha de 4.' });
    }
    const user = await database.createUser(username, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }
    const user = await database.findUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Usuário ou senha incorretos.' });
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Usuário ou senha incorretos.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware de Autenticação JWT para rotas privadas
function authenticateToken(req, res, next) {
  // Ignora caminhos que não fazem parte da API (estáticos e arquivos frontend)
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
}

app.use(authenticateToken);

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user });
});

// --- API ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.5', port: PORT });
});

// --- Users API ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await database.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sprints API ---
app.get('/api/sprints', async (req, res) => {
  try {
    const filterUserId = req.query.userId || null;
    const sprints = await database.getSprints(req.user.id, filterUserId);
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sprints', async (req, res) => {
  try {
    const sprint = await database.saveSprint(req.user.id, req.body);
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sprints/:id', async (req, res) => {
  try {
    await database.deleteSprint(req.user.id, Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tasks API ---
app.get('/api/tasks', async (req, res) => {
  try {
    const filterUserId = req.query.userId || null;
    const tasks = await database.getTasks(req.user.id, filterUserId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = await database.saveTask(req.user.id, req.body);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/batch', async (req, res) => {
  try {
    await database.saveTasksBatch(req.user.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await database.saveTask(req.user.id, { ...req.body, id: Number(req.params.id) });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await database.deleteTask(req.user.id, Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings API ---
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await database.getSettings(req.user.id);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    let { key, value } = req.body;
    
    // Tratamento caso o payload venha com o objeto do Dexie aninhado { key, value: { key, value } }
    if (value && typeof value === 'object' && value.key !== undefined && value.value !== undefined) {
      key = value.key;
      value = value.value;
    }
    
    if (!key) {
      return res.status(400).json({ error: 'A chave da configuração é obrigatória.' });
    }

    const setting = await database.saveSetting(req.user.id, key, value);
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Notes API ---
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await database.getNotes(req.user.id);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const note = await database.saveNote(req.user.id, req.body);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const note = await database.saveNote(req.user.id, { ...req.body, id: Number(req.params.id) });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await database.deleteNote(req.user.id, Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Radios API ---
app.get('/api/radios', async (req, res) => {
  try {
    const radios = await database.getRadios(req.user.id);
    res.json(radios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/radios', async (req, res) => {
  try {
    const radio = await database.saveRadio(req.user.id, req.body);
    res.json(radio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/radios/:id', async (req, res) => {
  try {
    await database.deleteRadio(req.user.id, Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Task Styles API ---
app.get('/api/task-styles', async (req, res) => {
  try {
    const styles = await database.getTaskStyles(req.user.id);
    res.json(styles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/task-styles', async (req, res) => {
  try {
    await database.saveTaskStyles(req.user.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Migration Import API ---
app.post('/api/migration/import', async (req, res) => {
  try {
    await database.importAllData(req.user.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Terminal Executor Endpoint
app.post('/api/terminal/execute', (req, res) => {
  if (req.headers['x-tass-client'] !== 'true') {
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }

  const { command, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Comando não fornecido.' });
  }

  const targetCwd = cwd || __dirname;
  const separator = '___PWD_SEPARATOR___';
  const isWin = process.platform === 'win32';
  const wrappedCommand = isWin
    ? `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${command}\nWrite-Output "${separator}"\n(Get-Item .).FullName`
    : `${command}\necho "${separator}"\npwd`;

  const shellOption = isWin ? 'powershell.exe' : '/bin/bash';

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

app.get('/api/terminal/info', (req, res) => {
  if (req.headers['x-tass-client'] !== 'true') {
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }
  res.json({ cwd: __dirname });
});

// --- ESTÁTICOS ---
app.use('/wallpapers', express.static(path.join(__dirname, 'public', 'wallpapers')));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) res.status(404).send('API TASS 5176');
  });
});

app.listen(PORT, () => {
  console.log('\x1b[35m%s\x1b[0m', `[TASS] VERSÃO 1.1.0 (MULTIUSER) - BACKEND ATIVO EM: http://127.0.0.1:${PORT}`);
});
