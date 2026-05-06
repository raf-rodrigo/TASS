# Project Memory - TASS (Task & Advanced Support System)

## 📅 Last Update: 2026-05-06
## 🚀 Contexto Atual
O TASS consolidou sua arquitetura para um modelo de **Componentes Base** e **Serviços Centralizados**, eliminando a redundância de CSS e lógica espalhada. Em maio de 2026, o sistema passou por um rebranding técnico para tornar-se agnóstico à marca e adotou padrões industriais de localização via `date-fns`.

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
1.  **Versionamento (Commits):**
    *   Sempre que múltiplas alterações forem feitas em uma sessão, a mensagem de commit deve vir em **uma única linha contínua (sem quebras)**, descrevendo as mudanças em sequência.
    *   **Exemplo:** `feat(ui): global refinement | Redesigned timer | Centralized border-radius | Fixed blur edges | Cleaned InterfaceMenu | Updated patterns`
    *   **Meta:** Agilizar o versionamento mantendo a rastreabilidade em linha única.
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
- [x] **Rebranding de Namespace:** Migração global de `tass-` para `app-`.
- [x] **Localização Robusta:** Integração com `date-fns` e tradução profissional para PT-BR.
- [x] **Simplificação de Modais:** Revisão de textos e labels para agilidade (Remoção do termo "Cadastrar").

## 🎯 Próximos Passos
1.  **Internacionalização (i18n):**
    *   Instalar `vue-i18n@9`.
    *   Criar arquivos de tradução em `src/locales/` (pt.json, en.json).
    *   Migrar strings estáticas para chaves `$t('key')`.
2.  **Refatoração de Inputs:** Criar componentes base para inputs (ex: `AppInput.vue`) para padronizar bordas e focus rings.
3.  **Performance:** Monitorar o impacto das transições globais em dispositivos com menor poder de processamento.

## 🎨 Padrões de Design
- **Visual:** Glassmorphism 2.0 (Desfoque de 20px, bordas brancas com 10-20% de opacidade).
- **Arredondamento Global:** Sincronizado via variável CSS `--app-card-radius`. Controle centralizado na aba Sistema.
- **Cores:** Indigo-600 (Ações), Amber-500 (Atenção/Notas), Slate/Indigo (Timers sérios).
- **UX:** Todo modal deve ser arrastável pelo cabeçalho. Toasts centralizados no topo com animação de slide vertical.
- **Tooltips:** Utilizar exclusivamente o atributo `data-tip`. Estilo Premium (z-110, fundo dark, borda neon suave, animação de subida).
- **Background Blur:** Para evitar bordas claras, o fundo usa margens fixas de -20px (`-top-[20px]`, etc) em vez de zoom dinâmico.
- **Timers:** Estética "Deep Tech". Pulso de atividade focado no ícone de Stop, não no contador.
