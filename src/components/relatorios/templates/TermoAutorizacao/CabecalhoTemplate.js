import { formatarData } from '@/utils/formatadores';

/**
 * Gera o cabeçalho do Termo de Autorização
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML do cabeçalho
 */
export function gerarCabecalho(processo) {
  // Formatar a data atual para o cabeçalho do documento
  const dataAtual = new Date();
  const dia = dataAtual.getDate();
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mes = meses[dataAtual.getMonth()];
  const ano = dataAtual.getFullYear();
  const dataLocalFormatada = `Domingos Martins-ES, ${dia} de ${mes} de ${ano}`;
  
  return `
    <h1 style="text-align:center; margin-bottom: 20px;">TERMO DE AUTORIZAÇÃO</h1>
    <h2 style="text-align:center; margin-bottom: 30px;">RELATÓRIO DE AVALIAÇÃO DE PARTICIPAÇÃO EM PROCESSO LICITATÓRIO</h2>
    
    <p style="text-align:right; margin-bottom: 30px;">${dataLocalFormatada}</p>
  `;
}