import fs from 'fs';

const filePath = 'c:/Users/sergi/OneDrive/Documentos/TASS/breathe/src/components/GitRebuilder.vue';
const content = fs.readFileSync(filePath, 'utf-8');

const stack = [];
const regex = /<\/?([a-zA-Z0-9:-]+)(?:\s+[^>]*)?>/g;
let match;
let hasError = false;

console.log("Iniciando análise de tags HTML do arquivo completo...");

while ((match = regex.exec(content)) !== null) {
  const fullTag = match[0];
  const tagName = match[1];
  
  if (['input', 'img', 'br', 'hr', 'polyline', 'svg', 'component', 'ArrowUpDown', 'Terminal', 'History', 'RefreshCw', 'Search', 'Check', 'AlertCircle', 'Settings'].includes(tagName)) {
    // Tags auto-fechadas ou componentes externos
    continue;
  }
  
  if (fullTag.startsWith('</')) {
    if (stack.length === 0) {
      console.error(`Erro: Fechamento </${tagName}> sem nenhuma tag correspondente aberta na pilha`);
      hasError = true;
      continue;
    }
    const last = stack.pop();
    if (last !== tagName) {
      console.error(`Erro: Fechamento </${tagName}> não bate com a última tag aberta <${last}>`);
      hasError = true;
    }
  } else if (!fullTag.endsWith('/>') && !fullTag.startsWith('<?') && !fullTag.startsWith('<!--')) {
    // Evita tags auto-fechadas ou comentários
    stack.push(tagName);
  }
}

if (!hasError) {
  console.log("Nenhum erro de balanceamento de tags encontrado no arquivo completo!");
}
console.log("Pilha de tags restantes ao fim:", stack);
