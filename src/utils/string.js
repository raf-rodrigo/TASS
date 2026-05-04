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
    .replace(/--+/g, '-');              // Evita múltiplos hífens seguidos
};
