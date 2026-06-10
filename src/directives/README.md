# Diretivas Customizadas (Custom Directives)

Este diretório contém diretivas Vue customizadas para o sistema TASS.

## Filosofia e Regras (MANDATÓRIO)
De acordo com os princípios arquiteturais do TASS:
- **Minimalismo:** Diretivas só devem ser criadas quando componentes ou composables não puderem resolver o problema de forma limpa.
- **Performance:** Diretivas globais que injetam elementos no DOM devem usar o padrão Singleton para evitar poluição visual e lentidão. 
- **Atualização:** Toda nova diretiva criada deve ser obrigatoriamente documentada neste arquivo.

## Diretivas Ativas

### `v-tooltip` (`tooltip.js`)
- **Objetivo:** Fornecer tooltips (dicas de tela) bonitos e com colisão de borda ajustada de forma unificada.
- **Arquitetura:** Usa o padrão Singleton. Em vez de criar um balão de div para cada botão que tem `v-tooltip`, a diretiva cria apenas **um único** elemento `<div id="tass-global-tooltip">` no final do `<body>`. Ao focar em um botão, este elemento único muda de texto e flutua até a coordenada alvo.
- **Suporte Híbrido:** Pode ser usado nativamente via `v-tooltip="Texto"` em componentes Vue, ou suporta detecção delegada para elementos legados/nativos que contenham apenas o atributo `data-tip="Texto"`.
- **Mobile/Touch:** A diretiva é inteligente o suficiente para se auto-desativar caso o dispositivo primário seja Touch (`pointer: coarse`), evitando o bug do "hover fantasma".
