import { ref } from 'vue'

export function useDateValidation() {
  const dateError = ref('')
  const timeError = ref('')

  // Definição dos feriados apenas com dia e mês
  const holidays = [
    { day: 1, month: 1 },    // Ano Novo
    { day: 12, month: 2 },   // Carnaval
    { day: 13, month: 2 },   // Carnaval
    { day: 29, month: 3 },   // Sexta-feira Santa (aproximado, pois é móvel)
    { day: 21, month: 4 },   // Tiradentes
    { day: 1, month: 5 },    // Dia do Trabalho
    { day: 20, month: 6 },   // Corpus Christi (aproximado, pois é móvel)
    { day: 7, month: 9 },    // Independência
    { day: 12, month: 10 },  // Nossa Senhora
    { day: 2, month: 11 },   // Finados
    { day: 15, month: 11 },  // Proclamação da República
    { day: 25, month: 12 }   // Natal
  ]

  const isWeekend = (date) => {
    const day = new Date(date).getDay()
    return day === 0 || day === 6 // 0 é domingo, 6 é sábado
  }

  const isHoliday = (date) => {
    const d = new Date(date)
    const day = d.getDate()
    const month = d.getMonth() + 1 // getMonth() retorna 0-11

    return holidays.some(holiday =>
      holiday.day === day && holiday.month === month
    )
  }

  const isBusinessDay = (date) => {
    // Garante que estamos trabalhando com um objeto Date
    const dateObj = new Date(date)

    // Verifica se é final de semana
    if (isWeekend(dateObj)) {
      return false
    }

    // Verifica se é feriado
    return !isHoliday(dateObj)
  }

  // Função para encontrar o próximo dia útil
  const getNextBusinessDay = (date) => {
    let nextDate = new Date(date)
    do {
      nextDate.setDate(nextDate.getDate() + 1)
    } while (!isBusinessDay(nextDate.toISOString().split('T')[0]))
    return nextDate.toISOString().split('T')[0]
  }

  // Validação de data
  const validateDate = (dateString) => {
    if (!dateString) return false

    const selectedDate = new Date(dateString + 'T00:00:00') // Adiciona horário para evitar problemas de timezone
    const today = new Date()
    const minDate = new Date(today)
    minDate.setDate(today.getDate() + 1)

    const maxDate = new Date(today)
    maxDate.setMonth(today.getMonth() + 12)

    dateError.value = ''

    // 1. Primeira verificação: é dia útil?
    if (!isBusinessDay(selectedDate)) {
      const nextBusinessDay = getNextBusinessDay(selectedDate)
      dateError.value = `Esta data não é um dia útil (feriado ou fim de semana). Próximo dia útil disponível: ${new Date(nextBusinessDay).toLocaleDateString('pt-BR')}`
      return false
    }

    // 2. Verifica se a data é anterior ao dia seguinte
    if (selectedDate < minDate) {
      dateError.value = `A data deve ser posterior a ${minDate.toLocaleDateString('pt-BR')}`
      return false
    }

    // 3. Verifica se a data é posterior a 12 meses
    if (selectedDate > maxDate) {
      dateError.value = `A data não pode ser posterior a ${maxDate.toLocaleDateString('pt-BR')}`
      return false
    }

    return true
  }

  // Validação de horário
  const validateTime = (timeString) => {
    if (!timeString) return false

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
