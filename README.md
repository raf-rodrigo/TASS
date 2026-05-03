# 🚀 TASS - Task & Advanced Support System

O **TASS** é um gerenciador de tarefas avançado, focado em produtividade para desenvolvedores. Ele combina uma interface moderna com funcionalidades robustas de rastreamento de tempo, integração com GitLab e gestão detalhada de fluxos de trabalho.

---

## ✨ Funcionalidades Principais

### 📋 Gestão Avançada de Tarefas
- **CRUD Completo:** Crie, edite, conclua e exclua tarefas de forma intuitiva.
- **Campos Detalhados:** Vá além do título. Adicione estimativa de horas, prioridade, URLs de ambientes (Dev, Homolog, Prod), scripts de banco de dados e observações detalhadas.
- **Organização por Drag & Drop:** Reordene suas tarefas arrastando e soltando para priorizar seu dia.
- **Filtros Inteligentes:** Visualize todas as tarefas, apenas as ativas ou as concluídas através de atalhos rápidos no rodapé.

### ⏱️ Rastreamento de Tempo (Smart Timer)
- **Timer Individual:** Cada tarefa possui seu próprio cronômetro independente.
- **Execução Exclusiva:** Ao iniciar uma tarefa, qualquer outra tarefa em execução é pausada automaticamente, garantindo foco total.
- **Persistência de Sessão:** O timer utiliza o relógio do sistema (`Date.now()`). Se você fechar o navegador ou a aba, o tempo continua sendo contabilizado corretamente ao retornar.
- **Auto-Save:** O estado do timer é salvo automaticamente a cada 10 segundos para evitar perda de dados.

### 🦊 Integração com GitLab
- **Modo Link Mágico:** Gera links rápidos para criação de branches seguindo padrões de nomenclatura.
- **Modo API Automática:** Integra-se diretamente à API do GitLab para criar e gerenciar branches sem sair da ferramenta.
- **Gestão de Branches:** Detecta se uma branch já existe, permitindo abrir diretamente no navegador ou excluí-la via API.
- **Cópia Automática:** Copia o nome da branch formatada para o clipboard ao abrir o link.

### 🎨 Interface e Experiência (UI/UX)
- **Design Moderno:** Interface estilo Glassmorphism com micro-animações fluídas.
- **Modo Escuro/Claro:** Suporte nativo a temas, preservando a saúde visual.
- **Layout Customizável:** Escolha entre visualização em 1 ou 2 colunas.
- **Notificações em Tempo Real:** Feedback visual imediato para todas as ações através de toasts elegantes.

### 🔐 Segurança e Backup
- **Offline-First:** Todos os dados são armazenados localmente no seu navegador via **IndexedDB** (usando Dexie.js). Zero dependência de servidores externos.
- **Backup de Dados:** Exporte todas as suas tarefas para um arquivo JSON e importe-as quando precisar trocar de máquina ou navegador.

---

## 🛠️ Tecnologias Utilizadas

- **[Vue 3](https://vuejs.org/)**: Framework principal com Composition API.
- **[Vite](https://vitejs.dev/)**: Build tool ultra-rápida.
- **[Tailwind CSS](https://tailwindcss.com/)**: Estilização moderna e responsiva.
- **[Pinia](https://pinia.vuejs.org/)**: Gestão de estado global (Stores).
- **[Dexie.js](https://dexie.org/)**: Wrapper para IndexedDB, garantindo persistência robusta.
- **[SweetAlert2](https://sweetalert2.github.io/)**: Biblioteca unificada para modais de confirmação e notificações (toasts).
- **[Lucide Vue Next](https://lucide.dev/)**: Biblioteca de ícones vetoriais modernos.

---

## 📁 Estrutura do Projeto

```text
/src
  ├── db.js                     # Configuração do banco de dados local (Dexie)
  ├── main.js                   # Inicialização do Vue 3
  ├── style.css                 # Design System (Tailwind + Custom Layers)
  ├── App.vue                   # Componente raiz, Timer Global e Layout principal
  ├── components/               # Componentes Vue (.vue)
  │   ├── TaskCard.vue          # Card de tarefa com lógica de timer e ações GitLab
  │   ├── InterfaceMenu.vue     # Menu lateral para customização estética em tempo real
  │   ├── SettingsModal.vue     # Configurações de sistema, integração API e Backups
  │   └── ...                   # Modais de Sprint, Notas e Tarefas
  ├── stores/                   # Estado Global (Pinia)
  │   ├── taskStore.js          # Lógica de tarefas, cronômetro e sprints
  │   └── settingsStore.js      # Persistência de preferências de UI e chaves de API
  ├── services/                 # Serviços de Integração
  │   └── gitlab.js             # Mecânica avançada de fluxo de branches GitLab
  ├── composables/              # Lógica compartilhada (Hooks)
  │   ├── useShortcuts.js       # Atalhos de teclado globais
  │   └── useNotesDrag.js       # Mecânica de arraste e posicionamento
  └── utils/                    # Utilitários
      ├── swal.js               # Wrapper para SweetAlert2 (Toasts/Modals)
      └── notifications.js      # Notificações nativas do navegador e sons
```

---

## 🚀 Como Iniciar

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.

### Instalação
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```

### Desenvolvimento
Inicie o servidor local:
```bash
npm run dev
```
Acesse `http://localhost:5173` no seu navegador.

### Produção
Gere a build otimizada:
```bash
npm run build
```

---

## 📄 Licença

Este projeto é de uso livre. Desenvolvido para facilitar o dia a dia de desenvolvedores que buscam organização e agilidade.
