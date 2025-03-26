// src/utils/dateFormatter.js
export const formatDateBR = (dateString) => {
  if (!dateString) return '-'
  try {
    const [date] = dateString.split('T')
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}