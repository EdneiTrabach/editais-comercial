import { gerarModeloRelatorio as gerarTermoAutorizacao } from '@/components/relatorios/templates/TermoAutorizacao';

/**
 * Gera o modelo HTML para o relatório baseado nos dados do processo
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML formatado para o relatório
 */
export async function gerarModeloRelatorio(processo) {
  // Agora apenas chama o componente modularizado
  return gerarTermoAutorizacao(processo);
}