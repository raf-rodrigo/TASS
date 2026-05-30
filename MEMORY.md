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
- [x] **Refatoração de Inputs (Concluído):** Criação dos componentes base `AppInput.vue` e `AppTextarea.vue` para padronizar bordas, ícones, validações e focus rings.
- [x] **Customização de Texto (Concluído):** Inclusão de seleção dinâmica de cor de texto (Modo Claro vs Escuro) no `TaskModal` com suporte a paletas no `InterfaceMenu`.

## 🎯 Próximos Passos
1.  **Internacionalização (i18n):**
    *   Instalar `vue-i18n@9`.
    *   Criar arquivos de tradução em `src/locales/` (pt.json, en.json).
    *   Migrar strings estáticas para chaves `$t('key')`.
2.  **Performance:** Monitorar o impacto das transições globais em dispositivos com menor poder de processamento.

## 🎨 Padrões de Design
- **Visual:** Glassmorphism 2.0 (Desfoque de 20px, bordas brancas com 10-20% de opacidade).
- **Arredondamento Global:** Sincronizado via variável CSS `--app-card-radius`. Controle centralizado na aba Sistema.
- **Cores:** Indigo-600 (Ações), Amber-500 (Atenção/Notas), Slate/Indigo (Timers sérios).
- **UX:** Todo modal deve ser arrastável pelo cabeçalho. Toasts centralizados no topo com animação de slide vertical.
- **Tooltips:** Utilizar exclusivamente o atributo `data-tip`. Estilo Premium (z-110, fundo dark, borda neon suave, animação de subida).
- **Background Blur:** Para evitar bordas claras, o fundo usa margens fixas de -20px (`-top-[20px]`, etc) em vez de zoom dinâmico.
- **Timers:** Estética "Deep Tech". Pulso de atividade focado no ícone de Stop, não no contador.


## Design System: Vidro Jateado (Glassmorphism) & Contraste Inteligente

Para garantir a legibilidade em interfaces altamente transparentes sem sacrificar a estética, foi implementada uma solução baseada em física de renderização do navegador, evitando códigos complexos de JavaScript ou poluição de regras CSS.

### 1. O Paradigma do Vidro Jateado
Diferente da transparência pura (que apenas reduz a opacidade), o TASS utiliza **Backdrop Filtering**. Isso cria uma superfície onde o texto pode "pousar" com segurança.
*   **Implementação:** `backdrop-filter: blur(12px) saturate(x) brightness(x)`.
*   **Vantagem:** O desfoque "limpa" os detalhes do papel de parede atrás do card, transformando ruído visual em manchas de cor suaves.

### 2. Motor de Contraste Inteligente (Realce de Leitura)
Implementado como um "filtro dinâmico" que se ajusta ao tema e à transparência escolhida pelo usuário.

#### Lógica Centralizada (`useTheme.js`):
O sistema injeta variáveis CSS dinâmicas no `:root` baseadas no estado da configuração `contrastEnhanced`:
*   **Modo Escuro:** Aplica `brightness(0.85)`. Reduz levemente o brilho do que está atrás do vidro para destacar o texto claro.
*   **Modo Claro:** Aplica `brightness(1.05)`. Clareia levemente o fundo para proteger o texto escuro.
*   **Saturação:** Aumenta `saturate(160%)` para separar melhor as formas cromáticas no desfoque.
*   **Sombra de Leitura:** Adiciona uma `text-shadow` ultra sutil (quase invisível) para garantir contorno em fundos "barulhentos".

### 3. Manutenção e Escalabilidade
*   **Variáveis de Design:** Toda a lógica visual consome variáveis CSS (`--app-glass-brightness`, etc).
*   **Localização:** Centralizado em `src/composables/useTheme.js` e consumido globalmente pela classe `.glass-panel` no `src/style.css`.
*   **Independência:** O sistema funciona de forma híbrida com o Tailwind CSS, sem sobrescrever suas classes utilitárias, evitando quebras de layout.

---
*Nota: Esta solução foi adotada para evitar o "Shotgun Surgery" (ter que alterar 20 arquivos para mudar um detalhe visual) e manter o código acessível para desenvolvedores de todos os níveis.*

## 🔄 Reconstrutor de Ambientes Git: Operações Reais vs. Simuladas

Para manter o fluxo Git saudável (`master` -> `hml` -> `dev`) sem afetar os ambientes compartilhados prematuramente, o Reconstrutor Git segue uma arquitetura híbrida de execução:

### 1. Operações Reais (100% Seguras)
*   **Consulta de MRs Ativos:** Chamadas de leitura `GET` na API do GitLab para obter as branches de origem de MRs abertos direcionados ao ambiente de destino.
*   **Verificação de Conflitos (Análise em Memória):** Execução do comando `git merge-tree` no backend para calcular os conflitos de mesclagem na memória do servidor, sem alterar o diretório de trabalho do disco local.
*   **Sinalizadores visuais:** Toda operação real é marcada com a tag `[Real]` e as operações de mock/simulação com `[Simulado]`.

### 2. Operações Simuladas / Críticas
*   **Envio para o Servidor (`git push --force`):** A publicação e reescrita do histórico remoto é a parte mais crítica. Permanece como simulação até que seja implementada uma confirmação dupla obrigatória de segurança.

## 🤖 Diretrizes de IA e Comunicação (MANDATÓRIO)
1. **Idioma de Operação:** Toda a comunicação entre o sistema e o usuário deve ser em **Português (Brasil)**.
2. **Raciocínio Interno:** O processo de pensamento da IA deve ser realizado em Português para manter o alinhamento cultural e técnico.
3. **Padrão de Resposta:** Explicações claras, tom profissional e foco em soluções que mantenham a estética "Premium" do TASS.
