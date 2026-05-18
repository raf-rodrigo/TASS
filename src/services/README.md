# 🛠️ TASS Services & Backend API

Este diretório contém os serviços de lógica de negócio do frontend e a documentação da ponte de comunicação com o servidor local.

## 🏗️ Backend API (`server.js`)

O `server.js` atua como um orquestrador local rodando na porta **5176**. Ele é responsável por tarefas que o navegador não pode realizar sozinho, como manipulação do sistema de arquivos e proxy de download.

### Endpoints Disponíveis:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verifica a saúde e a versão do backend. |
| `GET` | `/api/wallpapers` | Lista os arquivos de imagem presentes na pasta local. |
| `POST` | `/api/drive/import-wallpaper` | Baixa um arquivo do Google Drive, gera um **Hash MD5** e o salva localmente. |
| `DELETE` | `/api/wallpapers/:name` | Remove fisicamente um arquivo da pasta de wallpapers. |

---

## 🧩 Serviços de Frontend (`src/services/`)

### ☁️ `googleDriveService.js`
Gerencia a integração com o Google Identity Services (GIS) e a API do Drive v3.
- **Pasta Central:** Opera exclusivamente na pasta `TASS` (case-insensitive).
- **Escopos:** Utiliza `drive.file` (escrita restrita) e `drive.readonly` (leitura de imagens).
- **Fluxos:** Login/Logout, Backup/Restore de banco de dados e navegação de imagens.

### 💾 `backupService.js`
Orquestra o ciclo de vida dos backups.
- Faz a ponte entre o `taskStore` e o `googleDriveService`.
- Gera blobs JSON formatados para exportação cloud.

### 📢 `notificationService.js`
Sistema unificado de feedback visual do TASS.
- **Alertas:** Modais de aviso críticos.
- **Confirmações:** Diálogos de decisão (ex: "Deseja excluir?").
- **Toasts:** Notificações temporárias de sucesso, erro ou info.
- **Nativo:** Gerencia permissões e disparos de notificações do sistema operacional.

### 🌉 `bridgeService.js`
Gerencia a conexão com o backend (`server.js`).
- **Health Check:** Monitora periodicamente se o servidor na porta **5176** está online.
- **Status Global:** Expõe refs reativas (`isServerOnline`, `serverVersion`) para o restante do app.
- **Polling:** Realiza verificações a cada 10 segundos para feedback em tempo real na interface.

### 🧪 `gitlab.js`
Integração com a API do GitLab.
- Validação de tokens e conexões.
- Automação de criação de branches e Merge Requests vinculados a tarefas.

### 🚀 `taskActionService.js`
Encapsula ações complexas que envolvem múltiplas stores ou modais.
- Manipulação de links, scripts SQL e metadados de tarefas.

### ⏱️ `timerWorker.js`
Service Worker responsável por manter a precisão dos cronômetros.
- Garante que a contagem de tempo continue precisa mesmo quando a aba do navegador está em segundo plano ou suspensa.

---

## 🛡️ Padrões de Segurança
- **Identificadores Únicos:** Arquivos locais são salvos via Hash (MD5) para evitar conflitos de nomes e injeção de caracteres especiais.
- **Isolamento:** O backend opera em porta distinta (5176) para não interferir no ambiente de desenvolvimento do Vite (5175).
- **Lazy Loading:** SDKs de terceiros (como o do Google) são carregados sob demanda apenas quando o serviço é inicializado.
