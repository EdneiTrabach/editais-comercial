import { gerarObjetoTemplate } from './caracteristicas/ObjetoTemplate';
import { gerarModalidadeTipoTemplate } from './caracteristicas/ModalidadeTipoTemplate';
import { gerarDataHoraLicitacaoTemplate } from './caracteristicas/DataHoraLicitacaoTemplate';
import { gerarNumeroProcessoTemplate } from './caracteristicas/NumeroProcessoTemplate';
import { gerarPrazoVigenciaTemplate } from './caracteristicas/PrazoVigenciaTemplate';
import { gerarPedidosEsclarecimentosTemplate } from './caracteristicas/PedidosEsclarecimentosTemplate';
import { gerarVisitaLicitacaoTemplate } from './caracteristicas/VisitaLicitacaoTemplate';
import { gerarDocumentosPrecoTemplate } from './caracteristicas/DocumentosPrecoTemplate';
import { gerarJulgamentoLancesTemplate } from './caracteristicas/JulgamentoLancesTemplate';
import { gerarBancoDadosTemplate } from './caracteristicas/BancoDadosTemplate';
// Removendo a linha com gerarValorPropostaTemplate que está causando o erro
import { gerarScriptsTemplate } from './caracteristicas/ScriptsTemplate';

/**
 * Gera a seção de características do processo
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML da seção de características
 */
export function gerarCaracteristicas(processo, timestamp) {
  // Timestamp único para evitar conflitos de IDs se não for fornecido
  timestamp = timestamp || Date.now();
  
  return `
    <h3 style="margin-bottom: 20px;">2. CARACTERÍSTICAS DO PROCESSO</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      ${gerarObjetoTemplate(processo)}
      ${gerarModalidadeTipoTemplate(processo)}
      ${gerarDataHoraLicitacaoTemplate(processo)}
      ${gerarNumeroProcessoTemplate(processo)}
      ${gerarPrazoVigenciaTemplate(processo)}
      ${gerarPedidosEsclarecimentosTemplate(processo, timestamp)}
      ${gerarVisitaLicitacaoTemplate(processo, timestamp)}
      ${gerarDocumentosPrecoTemplate(processo, timestamp)}
      ${gerarJulgamentoLancesTemplate(processo, timestamp)}
      ${gerarBancoDadosTemplate(processo, timestamp)}
    </table>
    
    ${gerarScriptsTemplate(timestamp)}
  `;
}