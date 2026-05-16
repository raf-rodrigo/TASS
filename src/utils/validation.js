/**
 * Utilitários de validação para o TASS
 */

/**
 * Verifica se uma string é uma URL válida
 * Aceita URLs com ou sem protocolo (adiciona http:// se necessário para o teste)
 */
export const isValidUrl = (url) => {
  if (!url) return true; // Campos vazios são válidos (não obrigatórios)
  
  // Regex mais moderno e permissivo para suportar URLs complexas (como as do Odoo/Vision)
  // que contêm pontos e caracteres especiais no fragmento (#) e na query (?)
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocolo opcional
    '(localhost|(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domínio ou localhost
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // ou IP
    '(\\:\\d+)?' + // porta
    '(\\/[-a-z\\d%_.~+]*)*' + // caminho
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d%_.~+=&]*)?$', 'i' // fragmento (hífen movido para o final para evitar erro de range)
  );
    
  return !!pattern.test(url.trim());
};

/**
 * Formata uma URL garantindo que ela tenha o protocolo http/https
 */
export const ensureProtocol = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};
