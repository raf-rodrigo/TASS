# 🧠 A Síndrome do Gênio Solitário

Este documento estabelece as diretrizes de engenharia social e clareza de código para o projeto TASS. O objetivo é evitar a **"Síndrome do Gênio Solitário"** — a prática de escrever código excessivamente complexo, denso ou "esperto" apenas para demonstrar raciocínio abstrato ou economizar algumas linhas, sacrificando a legibilidade e a manutenção colaborativa.

## 1. Nossa Filosofia

No TASS, **a legibilidade é mais importante do que a genialidade sintática.** 
Um código brilhante não é aquele que faz muito em uma única linha usando operadores bitwise ou cinco ternários aninhados. Um código brilhante é aquele que permite que um desenvolvedor júnior sente, leia como se fosse um livro, e consiga dar manutenção imediata sem precisar quebrar a cabeça por horas para entender a lógica original.

A "economia de linhas" nunca deve vir à custa da semântica. Se o ganho de performance for insignificante (microssegundos na renderização do cliente), opte **sempre** pela lógica básica, verbosa e explícita (`if/else`, variáveis bem nomeadas).

## 2. Anti-Patterns Estritamente Proibidos

❌ **Ternários Aninhados e Densos no Template HTML:**
Nunca coloque lógicas matemáticas complexas misturadas com design dentro das tags do Vue. Exemplo proibido:
```vue
<!-- PROIBIDO -->
<div :class="isTrue ? (condition2 ? 'classA' : 'classB') : 'classC' + (condition3 ? 'classD' : '')">
```
✅ **Solução:** Extraia isso para uma `computed property` no `<script setup>` com nomes descritivos.

❌ **Código "Oculto" ou Subentendido:**
Não deduza que a pessoa que vai dar manutenção daqui a 6 meses terá a "base necessária" para fazer deduções sobre seu raciocínio altamente abstrato.

## 3. O Guia do Código Didático

Quando você se deparar com um trecho de lógica que inevitavelmente precise ser complexo (ex: cálculos de drag and drop, mesclagem de objetos aninhados, sincronização de threads), siga a regra do **"Código que pega na mão"**:

- **Mais comentários do que código:** Cada etapa lógica deve ser narrada no idioma nativo do time (Português). Explique **o que** o código está tentando alcançar e **por que** foi feito daquela maneira.
- **Divisão Responsável:** Se uma função passa de 20 linhas de puro raciocínio, divida-a em funções auxiliares onde o nome da função explica o passo.
- **Variáveis Explicativas:** Não hesite em criar constantes intermediárias apenas para nomear uma condição.
  ```javascript
  // Sim:
  const isNightModeActiveAndGlassEnabled = settings.theme === 'dark' && settings.globalGlassEnabled;
  if (isNightModeActiveAndGlassEnabled) { ... }
  ```

Seja claro, seja simples, programe para os outros lerem.
