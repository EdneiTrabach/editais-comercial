import { ref } from 'vue'

export function useDateValidation() {
  const dateError = ref('')
  const timeError = ref('')

  // Definição dos feriados apenas com dia e mês
  const holidays = [
    { day: 1, month: 1 },    // Ano Novo
    // { day: 12, month: 2 },   // Carnaval
    // { day: 13, month: 2 },   // Carnaval
    // { day: 29, month: 3 },   // Sexta-feira Santa (aproximado, pois é móvel)
    { day: 21, month: 4 },   // Tiradentes
    { day: 1, month: 5 },    // Dia do Trabalho
    // { day: 20, month: 6 },   // Corpus Christi (aproximado, pois é móvel)
    { day: 7, month: 9 },    // Independência
    { day: 12, month: 10 },  // Nossa Senhora
    { day: 2, month: 11 },   // Finados
    { day: 15, month: 11 },  // Proclamação da República
    { day: 25, month: 12 }   // Natal
  ]

  const isWeekend = (date) => {
    const day = date.getDay()
    return day === 0 || day === 6 // 0 é domingo, 6 é sábado
  }

  const isHoliday = (date) => {
    const day = date.getDate()
    const month = date.getMonth() + 1 // getMonth() retorna 0-11

    return holidays.some(holiday =>
      holiday.day === day && holiday.month === month
    )
  }

  const isBusinessDay = (date) => {
    // Verificamos diretamente se é fim de semana ou feriado
    return !isWeekend(date) && !isHoliday(date)
  }

  // Função para encontrar o próximo dia útil
  const getNextBusinessDay = (date) => {
    let nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    while (!isBusinessDay(nextDate)) {
      nextDate.setDate(nextDate.getDate() + 1)
    }
    
    return nextDate
  }

  // Validação de data - recebe a string no formato yyyy-mm-dd
  const validateDate = (dateString) => {
    if (!dateString) {
      dateError.value = 'A data é obrigatória'
      return false
    }

    try {
      // Cria a data no formato correto - evitando problemas de timezone
      const [year, month, day] = dateString.split('-').map(Number)
      const selectedDate = new Date(year, month - 1, day, 12, 0, 0) // Meio-dia para evitar problemas de fuso

      const today = new Date()
      today.setHours(0, 0, 0, 0) // Normaliza para início do dia
      
      const minDate = new Date(today)
      minDate.setDate(today.getDate() + 1) // No mínimo amanhã
      minDate.setHours(0, 0, 0, 0)

      const maxDate = new Date(today)
      maxDate.setMonth(today.getMonth() + 12) // Máximo 12 meses
      maxDate.setHours(23, 59, 59, 999)

      dateError.value = ''

      // 1. Primeira verificação: é dia útil?
      if (!isBusinessDay(selectedDate)) {
        const nextBusinessDay = getNextBusinessDay(selectedDate)
        const formattedDate = `${nextBusinessDay.getDate().toString().padStart(2, '0')}/${(nextBusinessDay.getMonth() + 1).toString().padStart(2, '0')}/${nextBusinessDay.getFullYear()}`
        
        dateError.value = `Esta data não é um dia útil (feriado ou fim de semana). Próximo dia útil disponível: ${formattedDate}`
        return false
      }

      // 2. Verifica se a data é anterior ao dia seguinte
      if (selectedDate < minDate) {
        const formattedDate = `${minDate.getDate().toString().padStart(2, '0')}/${(minDate.getMonth() + 1).toString().padStart(2, '0')}/${minDate.getFullYear()}`
        dateError.value = `A data deve ser posterior a ${formattedDate}`
        return false
      }

      // 3. Verifica se a data é posterior a 12 meses
      if (selectedDate > maxDate) {
        const formattedDate = `${maxDate.getDate().toString().padStart(2, '0')}/${(maxDate.getMonth() + 1).toString().padStart(2, '0')}/${maxDate.getFullYear()}`
        dateError.value = `A data não pode ser posterior a ${formattedDate}`
        return false
      }

      return true
    } catch (error) {
      console.error('Erro na validação de data:', error)
      dateError.value = 'Formato de data inválido'
      return false
    }
  }

  // Validação de horário
  const validateTime = (timeString) => {
    if (!timeString) {
      timeError.value = 'O horário é obrigatório'
      return false
    }

    try {
      const [hours, minutes] = timeString.split(':').map(Number)
      const time = hours * 60 + minutes // Converte para minutos
      const minTime = 8 * 60  // 08:00
      const maxTime = 18 * 60 // 18:00

      if (time < minTime || time > maxTime) {
        timeError.value = 'O horário deve estar entre 08:00 e 18:00'
        return false
      }

      timeError.value = ''
      return true
    } catch (error) {
      console.error('Erro na validação de horário:', error)
      timeError.value = 'Formato de horário inválido'
      return false
    }
  }

  return {
    dateError,
    timeError,
    isBusinessDay,
    getNextBusinessDay,
    validateDate,
    validateTime
  }
}
