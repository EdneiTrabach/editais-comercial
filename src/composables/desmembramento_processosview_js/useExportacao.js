import { utils, writeFileXLSX } from 'xlsx'

export function useExportacao(processos) {
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const [date] = dateString.split('T')
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
    } catch (error) {
      return '-'
    }
  }
  
  const formatTime = (time) => {
    if (!time) return '-'
    try {
      return time.split(':').slice(0, 2).join(':')
    } catch (error) {
      return '-'
    }
  }
  
  const formatStatus = (status) => {
    const statusMap = {
      'vamos_participar': 'Vamos Participar',
      'em_analise': 'Em Análise',
      'em_andamento': 'Em Andamento',
      'ganhamos': 'Ganhamos',
      'perdemos': 'Perdemos',
      'suspenso': 'Suspenso',
      'revogado': 'Revogado',
      'adiado': 'Adiado',
      'demonstracao': 'Demonstração',
      'cancelado': 'Cancelado',
      'nao_participar': 'Decidido Não Participar'
    }
    return statusMap[status] || status
  }
  
  const formatModalidade = (modalidade) => {
    const modalidades = {
      'pregao_eletronico': 'PE',
      'pregao_presencial': 'PP',
      'credenciamento': 'CR',
      'concorrencia': 'CC',
      'concurso': 'CS',
      'leilao': 'LL',
      'dialogo_competitivo': 'DC',
      'tomada_precos': 'TP',
      'chamamento_publico': 'CP',
      'rdc': 'RDC',
      'rdc_eletronico': 'RDC-E',
      'srp': 'SRP',
      'srp_eletronico': 'SRP-E',
      'srp_internacional': 'SRP-I'
    }
    
    return modalidades[modalidade] || modalidade
  }
  
  const exportToExcel = () => {
    const dataToExport = processos.value.map(processo => ({
      'Data': formatDate(processo.data_pregao),
      'Hora': formatTime(processo.hora_pregao),
      'Número do Processo': processo.numero_processo,
      'Código Análise': processo.codigo_analise || '-',
      'Ano': processo.ano,
      'Órgão': processo.orgao,
      'Modalidade': formatModalidade(processo.modalidade),
      'Tipo': processo.tipo_pregao || '-',
      'Site': processo.site_pregao || '-',
      'Objeto Resumido': processo.objeto_resumido,
      'Status': formatStatus(processo.status)
    }))
    
    const ws = utils.json_to_sheet(dataToExport)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Processos')
    writeFileXLSX(wb, 'processos_licitatorios.xlsx')
  }
  
  return {
    exportToExcel
  }
}