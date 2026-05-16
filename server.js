import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5175;

app.use(cors());
// Serve os arquivos estáticos da pasta 'dist' (após o npm run build)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback para o roteamento do Vue (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`[TASS] Servidor iniciado em http://localhost:${PORT}`);
});
