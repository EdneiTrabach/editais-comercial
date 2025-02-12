// src/utils/sanitize.ts
export const sanitizeHTML = (str: string | null | undefined): string => {
  if (!str) return ''
  
  // Adicionar mais caracteres especiais
  const escape: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  
  return str.replace(/[&<>"'`=\/]/g, match => escape[match])
}