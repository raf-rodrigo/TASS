# 🛠️ TASS Services

Este diretório contém os serviços de lógica de negócio do frontend e orquestração de integrações. A arquitetura do TASS isola a lógica de integração, regras do negócio e comunicação assíncrona dentro destes arquivos para manter os componentes visuais (`.vue`) enxutos e focados na renderização.

Com a remoção do backend legado (Node.js/Terminal), o TASS agora é uma aplicação **100% Client-Side** (Frontend-only), garantindo maior segurança, leveza e menor consumo de bateria (sem polling contínuo).

---

## 🧩 Serviços de Frontend (`src/services/`)

A pasta `services` abstrai toda a lógica de integrações de API, Web Workers e IndexedDB. Abaixo estão detalhados os serviços ativos no projeto:

### ☁️ `googleDriveService.js`
Gerencia a integração autenticada com o Google Identity Services (GIS) e a API do Drive v3.
- **Pasta Central:** Opera exclusivamente num diretório fixo chamado `TASS` no Google Drive do usuário (case-insensitive).
- **Escopos Restritos:** Utiliza apenas o escopo `drive.file` (leitura/escrita dos backups gerados pelo app) e `userinfo.profile` (para avatar e saudação).
- **Fluxos Principais:** Autenticação (Login/Logout), envio silencioso de backups à nuvem e restauração de snapshots (banco de dados inteiro).

### 💾 `backupService.js`
Orquestra o ciclo de vida da persistência em formato JSON.
- Faz a ponte entre o estado local e local storage (`taskStore`, `settingsStore`, IndexedDB) e o cloud runner (`googleDriveService.js`).
- Serializa e gera blobs JSON (`tass_export_tarefas.json`, `tass_export_sistema.json`) que podem ser salvos localmente pelo usuário (download) ou enviados para o Drive.

### 📢 `notificationService.js`
Sistema unificado de feedback visual da aplicação, integrando-se nativamente com a `notificationStore` e a `modalStore`.
- **Alertas:** Modais centrais para informações críticas (ex: aviso de conflito de branches).
- **Confirmações:** Diálogos binários de decisão (ex: "Deseja realmente excluir a branch?").
- **Prompts:** Entradas de dados limpas para inputs rápidos de texto ou multiline.
- **Toasts:** Notificações flutuantes não-intrusivas (sucesso, erro, info).
- **Nativo (Desktop):** Gerenciamento e requisição de permissões para exibir notificações via API nativa do sistema operacional.

### 🧪 `gitlab.js`
Integração profunda e especializada com a API REST do GitLab para otimizar a esteira de desenvolvimento do usuário.
- **Gestão de Branches:** Automação avançada para verificar, criar ou deletar branches com nomenclatura inteligente derivada das tarefas.
- **Merge Requests (Fluxo Rápido):** Conta com o `analyzeAndMerge`, que faz a comparação entre a branch da tarefa atual e a branch de destino (`dev-06`). Detecta número de arquivos alterados, analisa previamente a existência de conflitos, permite abrir MRs interativos e aplica o merge de forma conclusiva caso autorizado pelo desenvolvedor.
- **Tratamento de Estado Local:** Mantém a sincronia entre links da branch criados no Gitlab e os metadados da tarefa no TASS (banco IndexedDB).

### 🚀 `taskActionService.js`
Encapsula fluxos rápidos e rotineiros que alteram dados específicos das tarefas (Quick Actions).
- Facilita a captura e injeção ágil de URLs (garantindo validação de protocolos HTTP/HTTPS) usando o módulo dinâmico do `notificationService.promptQuickUpdate`.

### ⏱️ `timerWorker.js`
Web Worker essencial responsável por assegurar a exatidão do `Global Pulse` e cronômetros de tempo de trabalho.
- Trabalha em thread secundária para que a contagem dos cronômetros do sistema não congele ou atrase caso o navegador do usuário imponha restrições de energia à aba (Background Throttling).

---

## 🛡️ Padrões de Segurança e Performance

- **Arquitetura Serverless:** Como não há backend próprio ou necessidade de processamento Node.js local, a superfície de ataque é drasticamente reduzida. Não há mais APIs abertas localmente.
- **Otimização (Lazy Load):** SDKs estáticos externos (como o `<script>` da Google API) não são colocados no `index.html`. Em vez disso, são injetados assincronamente pelo serviço apenas no momento em que o usuário demonstra intenção de logar ou utilizar a funcionalidade.
