# 🤖 Diretrizes de Atuação da IA (TASS)

Este arquivo define o comportamento esperado da inteligência artificial ao interagir com este repositório.

## 1. Postura Crítica e Consultiva
- **Validação de Práticas:** A IA não deve ser apenas uma executora. Se uma solicitação do usuário violar boas práticas de desenvolvimento (Clean Code, SOLID, DRY), padrões de arquitetura do projeto ou introduzir débitos técnicos desnecessários, a IA **DEVE** alertar o usuário, explicar o motivo e sugerir uma abordagem superior antes de realizar qualquer alteração.
- **Carregamento de Scripts de Terceiros:** É terminantemente **PROIBIDO** o carregamento estático de scripts externos (SDKs, APIs de terceiros como Google, GitLab, etc.) via tag `<script>` no `index.html`. Toda biblioteca externa que não seja instalada via NPM deve ser carregada de forma dinâmica (Lazy Loading) pelo serviço que a utiliza, garantindo performance (TTI) e isolamento de dependências.
- **Praticidade e Eficiência:** Caso uma solução proposta seja excessivamente complexa ou pouco prática para o contexto do projeto, a IA deve propor uma alternativa mais simples e mantível.

## 2. Gestão de Dependências e Ecossistema
- **Sugestão de Pacotes:** Sempre que uma melhoria ou funcionalidade nova puder ser implementada de forma mais robusta, segura ou eficiente através da instalação de um pacote externo (NPM), a IA **DEVE** recomendar o uso desse pacote em vez de uma implementação manual "do zero".
- **Avaliação de Custo/Benefício:** Ao sugerir um pacote, a IA deve justificar brevemente por que aquela dependência é preferível à implementação interna (ex: manutenção, segurança, edge cases tratados).

## 3. Padrões Técnicos e Visuais (Sintetizado do .cursorrules)
- **Política "Zero Hardcoded":** Proibido o uso de valores visuais fixos. Use sempre tokens semânticos (`text-app-*`, `bg-app-*`, `border-app-*`).
- **Componentes Base Obrigatórios:** 
  - Usar `BaseModal.vue` para todos os modais (nunca remover a classe `!p-0`).
  - Usar `AppInput.vue` e `AppTextarea.vue` para formulários.
  - Usar `AppTimePicker.vue` para qualquer seleção ou ajuste de horas/minutos.
- **Geometria (Radius Harmony):** Use `var(--app-card-radius)` para containers e `var(--app-input-radius)` para elementos internos.
- **Glassmorphism:** Utilize a classe `.glass-panel` e as variáveis de opacidade/blur (`--app-card-opacity`, `--app-glass-blur`).
- **UX Premium:** Priorizar micro-interações, feedbacks visuais via `notificationService` (evitar `alert`/`confirm` nativos) e alinhamento óptico.
- **Uso Seguro do @apply:** 
  - Usar `@apply` apenas para tokens e classes padrão (`@apply text-app-main p-4`).
  - **PROIBIDO** usar `@apply` com valores arbitrários complexos entre colchetes `[...]` que contenham espaços ou funções (ex: `shadow-[0_4px_rgba(0,0,0,0.1)]`).
  - **Motivo:** Formatadores de código (Prettier) inserem espaços que quebram a compilação do PostCSS/Tailwind. Nesses casos, use CSS puro ou configure um utilitário no `tailwind.config.js`.

## 4. Inicialização e Contextualização
- **Leitura de Contexto:** Ao iniciar uma nova sessão ou tarefa complexa, a IA deve realizar uma leitura exploratória dos arquivos do projeto (além dos arquivos de regras) para compreender a estrutura atual, as dependências instaladas e a lógica de negócio implementada. Isso garante que as sugestões sejam tecnicamente precisas e contextualizadas.

## 5. Engenharia e Qualidade
- **Cultura de Testes (Mandatório):** Nenhuma funcionalidade nova ou refatoração de lógica (Stores, Services, Utils) é considerada completa sem a atualização ou criação dos testes unitários correspondentes em `*.test.js`.
- **Integridade de Cronômetros:** Ao implementar ajustes manuais de tempo, garantir que a alteração no tempo da sessão (`totalTimeSpent`) seja refletida proporcionalmente no acumulador histórico (`totalWorked`).
- **Validação de Build:** Antes de concluir qualquer tarefa, é obrigatório garantir que a suite de testes (`npm run test`) passe integralmente e que o projeto compile sem erros via `npm run build`.
- **Bug Fixes:** Para correções de bugs, deve-se primeiro criar um teste que reproduza a falha e, após a correção, garantir que o teste passe (Red-Green-Refactor).

## 6. Comunicação e Workflow
- **Idioma:** Todo o raciocínio e comunicação devem ser realizados em **Português**.
- **Fluxo de Eventos:** Seguir o padrão de "Props down, Events up". Modais de ação devem ser disparados pelo `App.vue` através de eventos emitidos pelos componentes filhos (`TaskCard` -> `TaskBoard` -> `App`).
- **Commits:** Sugerir mensagens seguindo o padrão **Conventional Commits** em uma única linha de comando. Importante: a linha não precisa ser curta; ela deve ser tão detalhada quanto necessário para descrever todas as alterações em um único comando `-m`, independentemente do comprimento.
