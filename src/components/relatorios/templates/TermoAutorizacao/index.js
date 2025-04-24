import { gerarCabecalho } from './CabecalhoTemplate';
import { gerarDadosCliente } from './ClienteTemplate';
import { gerarCaracteristicas } from './CaracteristicasTemplate';
import { gerarValores } from './ValoresTemplate';
import { gerarImpedimentos } from './ImpedimentosTemplate';
import { gerarItensImpugnativeis } from './ImpugnacaoTemplate';
import { gerarConcorrencia } from './ConcorrenciaTemplate';
import { gerarInfoAdicionais } from './InfoAdicionaisTemplate';
import { gerarPeriodicidade } from './PeriodicidadeTemplate';
import { gerarDemonstracao } from './DemonstracaoTemplate';
import { gerarMultas } from './MultasTemplate';
import { gerarPrazoImplantacao } from './PrazoImplantacaoTemplate';
import { gerarSistemasImplantar } from './SistemasImplantarTemplate';
import { gerarImplantacaoTreinamento } from './ImplantacaoTreinamentoTemplate';
import { gerarPrazoRecurso } from './PrazoRecursoTemplate';
import { gerarCondicaoReajuste } from './CondicaoReajusteTemplate';
import { gerarParticipacao } from './ParticipacaoTemplate';
import { gerarAssinaturas } from './AssinaturasTemplate';

/**
 * Gera o template completo do Termo de Autorização combinando todos os módulos
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML formatado para o relatório
 */
export async function gerarModeloRelatorio(processo) {
  if (!processo) return '';
  
  // Timestamp único para evitar conflitos de IDs
  const timestamp = Date.now();
  
  // Combina todos os módulos em um único HTML
  return `
    ${gerarCabecalho(processo)}
    
    ${gerarDadosCliente(processo)}
    
    ${gerarCaracteristicas(processo, timestamp)}
    
    ${gerarValores(processo, timestamp)}
    
    ${gerarImpedimentos(processo)}
    
    ${gerarItensImpugnativeis(processo)}
    
    ${gerarConcorrencia(processo)}
    
    ${gerarInfoAdicionais(processo)}
    
    ${gerarPeriodicidade(processo)}
    
    ${gerarDemonstracao(processo)}
    
    ${gerarMultas(processo)}
    
    ${gerarPrazoImplantacao(processo)}
    
    ${gerarSistemasImplantar(processo)}
    
    ${gerarImplantacaoTreinamento(processo)}
    
    ${gerarPrazoRecurso(processo)}
    
    ${gerarCondicaoReajuste(processo)}
    
    ${gerarParticipacao(processo)}
    
    ${gerarAssinaturas(processo)}
  `;
}

export function gerarRelatorio(processo) {
  const timestamp = Date.now();
  
  return `
    ${gerarCabecalho(processo)}
    ${gerarDadosCliente(processo)}
    ${gerarCaracteristicas(processo, timestamp)}
    ${gerarValores(processo, timestamp)}
    ${gerarImpedimentos(processo)}
    ${gerarItensImpugnativeis(processo)}
    ${gerarConcorrencia(processo)}
    ${gerarInfoAdicionais(processo)}
    ${gerarPeriodicidade(processo)}
    ${gerarDemonstracao(processo)}
    ${gerarMultas(processo)}
    ${gerarPrazoImplantacao(processo)}
    ${gerarSistemasImplantar(processo)}
    ${gerarImplantacaoTreinamento(processo)}
    ${gerarPrazoRecurso(processo)}
    ${gerarCondicaoReajuste(processo)}
    ${gerarParticipacao(processo)}
    ${gerarAssinaturas(processo)}
  `;
}