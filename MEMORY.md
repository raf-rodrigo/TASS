# Project Memory - TASS (Task & Advanced Support System)

## 📅 Last Update: 2026-05-02
## 🚀 Contexto Atual
O TASS evoluiu para uma interface de alta performance, focada em personalização extrema (Tipografia e Design) e métricas de tempo em tempo real.

## 🛠 Funcionalidades Implementadas
1.  **Drag & Drop Inteligente:**
    - Reordenamento de tarefas agora funciona **independente de filtros ativos**.
    - A lógica no `taskStore.js` mescla a ordem da lista filtrada com a lista total, preservando a posição das tarefas ocultas.
2.  **Interface Menu (Painel de Ajustes):**
    - **Tipografia:** Biblioteca de 12 fontes premium (Sora, Mulish, Quicksand, Inter, etc) integradas via Google Fonts.
    - **Customização de Notas:** Ajustes de posição (L/R), largura, cor e altura do botão de ativação.
    - **Paleta Clássica:** Cores de post-it otimizadas: Amarelo Canário (#fef9c3), Rosa Especial (#FA6495) e Verde Limão (#a3ff33).
3.  **Métricas de Tempo:**
    - **Sprint Totalizer:** Contador no header que exibe o total de horas/minutos/segundos trabalhados na sprint selecionada.
    - **Messaging System:** Feedback visual via SweetAlert2.
5.  **Sprint Management:** Vínculo automático de tarefas e filtros avançados.
6.  **Refatoração Arquitetural:**
    - Lógica de **Lembrete de Água** e **Atalhos Globais** movida para Composables (`useWaterReminder`, `useShortcuts`), limpando o `App.vue`.

## 📌 Progresso Recente
- [x] **Reordenação Universal:** O sistema agora permite arrastar tarefas sob qualquer filtro, preservando as posições das tarefas ocultas.
- [x] **Validação de Importação:** Implementada verificação de esquema manual (Tasks apenas) para evitar corrupção de banco.
- [x] **Arraste Interativo (Challenge):** Botão de notas agora permite ajuste vertical (fechado) e redimensionamento horizontal (aberto) via arraste direto.
- [x] **Master Reset:** Botão "Todas" consolidado para limpar todos os filtros de uma vez.
- [x] **Arquitetura:** Lógica de interface e interações movida para Composables (`useShortcuts`, `useWaterReminder`, `useNotesDrag`).

## 🎯 Próximos Passos
1. **Performance:** Monitorar performance do `bulkPut` em listas massivas.
2. **Relatórios:** Iniciar exportação de dados por Sprint (PDF/CSV).
3. **Anexos:** Considerar suporte a prints/arquivos vinculados a tasks via Blobs.

## 🎨 Padrões de Design
- **Estilo:** Glassmorphism e minimalismo premium.
- **Tipografia Dinâmica:** Configurável pelo usuário, aplicada globalmente via `settingsStore`.
- **Interação:** Cards com classe `.cursor-grab` para feedback visual de arrasto.
- **Hierarquia:** Configurações de sistema no topo, notas na base.
