# Project Memory - TASS (Task & Advanced Support System)

## 📅 Last Update: 2026-05-03
## 🚀 Contexto Atual
O TASS consolidou sua arquitetura para um modelo de **Componentes Base** e **Serviços Centralizados**, eliminando a redundância de CSS e lógica espalhada. O sistema agora é regido por um Design System unificado via Tailwind e componentes modais herdados.

## 🛠 Funcionalidades e Melhorias Arquiteturais (Audit 2026)
1.  **BaseModal & Herança visual:**
    *   Todos os modais (`Task`, `Settings`, `Sprint`) agora utilizam o `BaseModal.vue`.
    *   **Benefício:** Lógica de arraste, transições e visual Glassmorphism centralizados em um único ponto.
2.  **Notification Service (Single Point of Truth):**
    *   Criação do `notificationService.js` que unifica Toasts (Swal), Alertas e Notificações Nativas.
    *   **Proibição:** Chamadas diretas ao `sweetalert2` ou `utils/notifications` em componentes são desencorajadas em favor do serviço.
3.  **Design System & Tailwind:**
    *   Tokens de cores (`indigo`, `amber`, `emerald`) e animações (`scaleIn`, `fadeIn`) movidos para `tailwind.config.js`.
    *   Estilos globais de componentes (`.glass-panel`, `.tass-range`, `.custom-scrollbar`) movidos para `src/style.css`.
4.  **Persistência Segura:**
    *   Implementação de "Plain Object Cloning" no `settingsStore.js` via `JSON.parse(JSON.stringify())` antes de salvar no IndexedDB para evitar `DataCloneError` com Proxies do Vue.

## 🏛️ Diretrizes de Arquitetura (MANDATÓRIO)
Para evitar o retorno à "bagunça" técnica, as seguintes regras devem ser seguidas:

### 1. DRY (Don't Repeat Yourself) - CSS
*   **Nunca** criar blocos `<style scoped>` para visuais genéricos (bordas, sombras, glassmorphism). 
*   Se um estilo for usado em mais de um lugar, ele deve ir para o `style.css` como uma classe utilitária ou componente Tailwind (`@layer components`).

### 2. Lógica de Modais
*   Sempre envolver novos modais com o componente `<BaseModal>`.
*   A lógica de arraste já está inclusa; não tente reinventar o `useModalDrag` localmente.

### 3. Feedback ao Usuário
*   Utilizar exclusivamente o `notificationService`. 
*   Mantenha a interface do serviço consistente para que possamos trocar a biblioteca de UI (ex: sair do SweetAlert para outro) sem tocar nos componentes de negócio.

### 4. Manutenção de Store (Persistence)
*   Sempre que adicionar uma nova configuração no `settingsStore`, lembre-se de incluí-la no mapeamento de `legacyKeys` (se necessário) e garantir que o salvamento passe pela limpeza de Proxies.

## 📌 Progresso Recente
- [x] **Auditoria Técnica:** Identificação e remoção de redundâncias de CSS em `InterfaceMenu`, `TaskCard` e Modais.
- [x] **Unificação de UI:** Criação do `BaseModal` e refatoração completa dos modais do sistema.
- [x] **Centralização de Notificações:** Abstração completa do SweetAlert2 para um serviço.
- [x] **Correção de Bugs Críticos:** Resolvido erro de `DataCloneError` no IndexedDB e erros de importação no NotificationService.

## 🎯 Próximos Passos
1.  **Refatoração de Inputs:** Criar componentes base para inputs (ex: `TassInput.vue`) para padronizar bordas e focus rings.
2.  **Performance:** Monitorar o impacto das transições globais em dispositivos com menor poder de processamento.
3.  **Logs de Debug:** Implementar um logger centralizado que possa ser ativado via settings.

## 🎨 Padrões de Design
- **Visual:** Glassmorphism 2.0 (Desfoque de 20px, bordas brancas com 10-20% de opacidade).
- **Cores:** Indigo-600 (Ações), Amber-500 (Atenção/Notas), Emerald-500 (Sucesso/Sprint).
- **UX:** Todo modal deve ser arrastável pelo cabeçalho para não obstruir a visão das tarefas ao fundo.
