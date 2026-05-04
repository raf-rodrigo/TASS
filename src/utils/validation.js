/**
 * Utilitários de validação para o TASS
 */

/**
 * Verifica se uma string é uma URL válida
 * Aceita URLs com ou sem protocolo (adiciona http:// se necessário para o teste)
 */
export const isValidUrl = (url) => {
  if (!url) return true; // Campos vazios são válidos (não obrigatórios)
  
  const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocolo
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // nome de domínio
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // ou ip (v4)
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // porta e caminho
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    
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
