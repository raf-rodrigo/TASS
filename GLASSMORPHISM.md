# 🧊 TASS Glassmorphism Engine (Efeito de Vidro)

Este documento descreve a arquitetura centralizada do efeito de vidro (Glassmorphism) no sistema TASS. Todas as IAs e desenvolvedores devem seguir estritamente estas regras para garantir que o controle de transparência e desfoque via `Chave Mestra` funcione globalmente sem bugs e respeite a vontade do usuário.

## 1. Como Funciona (A Arquitetura)

O sistema de transparência não utiliza classes utilitárias fixas do Tailwind (como `backdrop-blur-*` ou `bg-white/50`) isoladamente para gerar o efeito de vidro, pois isso quebraria a reatividade global da interface. Em vez disso, o sistema baseia-se em um motor reativo gerenciado por dois pilares:

1. **`settingsStore.js`**: Armazena o estado do sistema, contendo:
   - `globalGlassEnabled` (Booleano): A Chave Mestra. Se desligada, corta o vidro do sistema inteiro.
   - `cardOpacity` (Int): O nível de opacidade de 0 a 100 escolhido pelo usuário.
   - `opacityTargets` (Objeto): Granularização - define quais partes do sistema (Cards, Modais, Barra Inferior, Menu de Contexto, etc.) devem receber transparência.
   - `normalizedCardOpacity`: Um getter que retorna o valor final de opacidade válido (de 0.0 a 1.0) apenas se a chave mestra e o alvo específico estiverem ativos.

2. **`useTheme.js` (O Motor CSS)**: Reage instantaneamente às mudanças do `settingsStore` e injeta Variáveis CSS dinâmicas no `:root` global da aplicação.
   - `--app-glass-blur`: Retorna `20px` se o vidro estiver ativado E a chave mestra estiver ON. Retorna `0px` caso contrário, efetivamente desligando o blur em tempo real.
   - `--app-card-opacity`: Define a transparência real aplicada aos backgrounds dos painéis.

## 2. Como Implementar (O Que Fazer)

Sempre que criar um novo modal, container flutuante, card ou elemento que deva suportar o efeito de vidro elegante do TASS, siga este padrão:

1. **Use as classes base `.glass-panel` ou `.glass-section`**:
   No arquivo `style.css`, essas classes já estão pré-configuradas para ler as variáveis corretas geradas pelo motor.
   ```vue
   <div class="glass-panel">
     <!-- O blur e a opacidade são injetados aqui automaticamente via variáveis CSS -->
   </div>
   ```

2. **Cuidado com Fundos Sólidos (Opaque Backgrounds) Internos**:
   Se você colocar um item (como um botão ou campo de texto) dentro do `.glass-panel` e der a ele um fundo totalmente sólido (ex: `bg-white` ou `bg-slate-900`), esse item funcionará como uma "parede de pixels" e bloqueará a luz do efeito de vidro que passaria por ele.
   - **Recomendado:** Use `bg-transparent` e crie feedbacks visuais de hover sutis (`hover:bg-app-surface` ou `hover:bg-white/10`). 

3. **Injeção via `:style` (Para componentes dinâmicos customizados)**:
   Se precisar de algo muito customizado que não deva usar `.glass-panel`, amarre o desfoque lendo a variável global diretamente:
   ```vue
   <div :style="{ 
     backdropFilter: `blur(var(--app-glass-blur))` 
   }">
   ```

## 3. O Que NUNCA Fazer (Anti-Patterns Proibidos)

❌ **NUNCA use classes Tailwind hardcoded para Blur (ex: `backdrop-blur-sm`, `backdrop-blur-md`, `backdrop-blur-xl`).**
Se você adicionar uma classe estática de blur diretamente no componente, ela sobrescreverá o CSS dinâmico gerado pelo `useTheme.js`. Como resultado, o componente se tornará "rebelde" e o usuário nunca conseguirá desligar o vidro através da Chave Mestra das configurações, resultando em um bug de UI.

❌ **NUNCA use variáveis brutas de loja (ex: `settings.cardOpacity > 0`) para injetar CSS condicional diretamente no template.**
Exemplo de código errado:
```vue
<!-- ERRADO: Ignora a Chave Mestra e os alvos granulares -->
<div :class="settings.cardOpacity > 0 ? 'backdrop-blur-xl' : ''">
```
O correto é delegar o visual à classe `.glass-panel` ou usar a variável computada inteligente da loja: `settings.normalizedCardOpacity < 1.0`, que já leva em consideração todas as regras de hierarquia de transparência do sistema.
