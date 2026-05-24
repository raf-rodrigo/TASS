import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5186;

// Configuração de CORS Restrita a Origens de Desenvolvimento Local do Breathe (Porta 5185)
const allowedOrigins = [
  /^http:\/\/localhost:5185$/,
  /^http:\/\/127\.0\.0\.1:5185$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origem (como ferramentas locais de backend ou carregamento direto)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(regex => regex.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[Breathe] Requisição bloqueada por política CORS de origem não confiável: ${origin}`);
      callback(new Error('Bloqueado por política CORS do Breathe (Origem não confiável)'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Breathe-Client']
}));

app.use(express.json());

// Middleware de Log Detalhado
app.use((req, res, next) => {
  console.log(`[Breathe] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('[Breathe] Payload Body:', JSON.stringify(req.body).substring(0, 100) + '...');
  }
  next();
});

// --- API ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', port: PORT });
});

// Endpoint para executar comandos do Git locais (para uso offline / local)
app.post('/api/terminal/execute', (req, res) => {
  if (req.headers['x-breathe-client'] !== 'true') {
    console.warn(`[Breathe] Requisição de terminal bloqueada: Cabeçalho 'X-Breathe-Client' ausente ou inválido.`);
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }

  const { command, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Comando não fornecido.' });
  }

  // Defesa contra RCE: Apenas aceita comandos estritamente relacionados a Git e listagem
  const allowedCommandsRegex = /^(git\s+([a-zA-Z0-9_\-\.\/\s]+))$/;
  if (!allowedCommandsRegex.test(command.trim())) {
    console.warn(`[Breathe] Comando bloqueado por política de segurança: "${command}"`);
    return res.status(400).json({ error: 'Execução de comando não permitida. Apenas comandos Git seguros são autorizados.' });
  }

  // Defesa contra Path Traversal: Garante que cwd é válido e resolve para um diretório seguro
  let targetCwd = cwd || __dirname;
  try {
    targetCwd = path.resolve(targetCwd);
    // Deve iniciar dentro do workspace do usuário (não pode ir para diretórios arbitrários do sistema)
    if (!targetCwd.toLowerCase().includes('documentos') && !targetCwd.toLowerCase().includes('tass')) {
      console.warn(`[Breathe] CWD fora do workspace bloqueado: "${targetCwd}"`);
      return res.status(403).json({ error: 'Diretório de trabalho não autorizado.' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Diretório de trabalho inválido.' });
  }

  const isWin = process.platform === 'win32';
  const shellOption = isWin ? 'powershell.exe' : '/bin/bash';

  console.log(`[Breathe] Executando: "${command}" em CWD: "${targetCwd}"`);

  exec(command, { cwd: targetCwd, shell: shellOption }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      code: error ? error.code : 0,
      error: error ? error.message : null
    });
  });
});

// Endpoint para obter informações iniciais
app.get('/api/terminal/info', (req, res) => {
  if (req.headers['x-breathe-client'] !== 'true') {
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }
  res.json({ cwd: __dirname });
});

// --- ESTÁTICOS ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) res.status(404).send('API Breathe 5186');
  });
});

app.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `[Breathe] VERSÃO 1.0.0 - BACKEND ATIVO EM: http://127.0.0.1:${PORT}`);
});
