/**
 * Utilitários de manipulação de strings para o TASS
 */

/**
 * Converte um texto para o formato slug (ideal para branches e URLs)
 * Ex: "Nova Tarefa de Teste!" -> "nova-tarefa-de-teste"
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .normalize('NFD')                   // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')    // Remove os acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')               // Troca espaços por -
    .replace(/[^\w-]+/g, '')            // Remove caracteres não alfanuméricos (exceto hífen)
    .replace(/--+/g, '-')              // Evita múltiplos hífens seguidos
    .replace(/^-+|-+$/g, '');           // Remove hífens no início e no fim
};

/**
 * Formata o nome da branch preservando maiúsculas e minúsculas.
 * Apenas converte espaços em hífens e limpa caracteres inválidos para o Git.
 * Ex: "Sprint 01: Refactor UI" -> "Sprint-01-Refactor-UI"
 */
export const gitBranchSlug = (text) => {
  if (!text) return '';

  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    // Remove acentos
    .trim()
    .replace(/\s+/g, '-')               // Espaços para hífens
    .replace(new RegExp('[^\\w\\d\\-/.]', 'g'), '')       // Remove caracteres inválidos para branch (mantém /, . e -)
    .replace(/--+/g, '-')               // Evita múltiplos hífens
    .replace(/^-+|-+$/g, '');           // Remove hífens nas extremidades
};
