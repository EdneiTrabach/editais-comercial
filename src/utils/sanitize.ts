// src/utils/sanitize.ts
export const sanitizeHTML = (str: string | null | undefined): string => {
  if (!str) return ''
  
  return str.replace(/[&<>"']/g, (match) => {
    const escape: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return escape[match]
  })
}