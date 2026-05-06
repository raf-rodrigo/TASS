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
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domínio
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // ou IP
    '(\\:\\d+)?' + // porta
    '(\\/[-a-z\\d%_.~+]*)*' + // caminho
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d%_.~+=&]*)?$', 'i' // fragmento (hífen movido para o final para evitar erro de range)
  );
    
  return !!pattern.test(url);
};

/**
 * Formata uma URL garantindo que ela tenha o protocolo http/https
 */
export const ensureProtocol = (url) => {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};
