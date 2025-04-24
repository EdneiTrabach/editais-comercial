import { formatarMoeda } from '@/utils/formatadores';
import { gerarAtendimentoTemplate } from './caracteristicas/AtendimentoTemplate';

/**
 * Gera a seção de valores do edital
 * @param {Object} processo - Dados do processo
 * @param {Array} analisesItens - Dados de análise já carregados do banco
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML da seção de valores
 */
export function gerarValores(processo, analisesItens = [], timestamp) {
  // Adicionar logs para depuração
  console.log('ValoresTemplate - Processo recebido:', processo);
  console.log('ValoresTemplate - Análises recebidas:', analisesItens);
  
  const { valor_estimado } = processo || {};
  const valorFormatado = formatarMoeda(valor_estimado);
  
  const valorPropostaInputId = `valor-proposta-input-${timestamp}`;
  const valoresContainerId = `valores-container-${timestamp}`;
  const addLoteButtonId = `add-lote-button-${timestamp}`;
  const valorTotalId = `valor-total-${timestamp}`;
  
  // Verificar se analisesItens é um array válido
  if (!Array.isArray(analisesItens)) {
    console.error('ValoresTemplate - analisesItens não é um array:', analisesItens);
    analisesItens = [];
  }
  
  console.log('ValoresTemplate - Passando para AtendimentoTemplate:', {
    processo,
    analisesItens: analisesItens,
    timestamp
  });
  
  // Obter componente de atendimento
  const atendimentoComponent = gerarAtendimentoTemplate(processo, analisesItens, timestamp);
  
  // Funções inicializadoras que serão executadas no início do HTML
  const scriptInicializador = `
    <script>
      // Define as funções com nomes únicos no escopo global (window) imediatamente
      
      // Função para formatar valor monetário
      window.formatarValorMonetario_${timestamp} = function(input) {
        // Remove todos os caracteres não numéricos exceto vírgula
        let valor = input.value.replace(/[^0-9,]/g, '');
        
        // Garante apenas uma vírgula
        const partes = valor.split(',');
        if (partes.length > 2) {
          valor = partes[0] + ',' + partes.slice(1).join('');
        }
        
        // Limita a 2 casas decimais
        if (partes.length > 1 && partes[1].length > 2) {
          valor = partes[0] + ',' + partes[1].substring(0, 2);
        }
        
        input.value = valor;
      };
      
      // Função para adicionar novo campo de lote
      window.adicionarCampoLote_${timestamp} = function(containerId, totalId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const loteId = 'lote-' + Date.now();
        const divLote = document.createElement('div');
        divLote.style.display = 'flex';
        divLote.style.alignItems = 'center';
        divLote.style.gap = '8px';
        divLote.id = loteId;
        
        divLote.innerHTML = \`
          <div style="width: 80px;">
            <input 
              type="text" 
              placeholder="Lote" 
              style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: inherit;"
            />
          </div>
          <div style="position: relative; width: 200px;">
            <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #495057;">R$</span>
            <input 
              type="text" 
              style="width: 100%; padding: 8px 8px 8px 30px; border: 1px solid #ced4da; border-radius: 4px; font-size: inherit;"
              placeholder="0,00"
              onkeypress="return (window.event.charCode >= 48 && window.event.charCode <= 57) || window.event.charCode === 44"
              oninput="window.formatarValorMonetario_${timestamp}(this)"
              onblur="window.calcularTotalValores_${timestamp}('\${containerId}', '\${totalId}')"
            />
          </div>
          <button 
            style="background-color: #dc3545; color: white; border: none; border-radius: 4px; padding: 8px; cursor: pointer; font-size: 14px;"
            onclick="window.removerCampoLote_${timestamp}('\${loteId}', '\${containerId}', '\${totalId}')"
          >
            ✕
          </button>
        \`;
        
        container.appendChild(divLote);
        
        // Mostrar o elemento de total quando houver pelo menos um lote
        document.getElementById(totalId).style.display = 'block';
      };
      
      // Função para remover campo de lote
      window.removerCampoLote_${timestamp} = function(loteId, containerId, totalId) {
        const loteElement = document.getElementById(loteId);
        if (loteElement) {
          loteElement.remove();
          window.calcularTotalValores_${timestamp}(containerId, totalId);
          
          // Verificar se ainda existem lotes
          const container = document.getElementById(containerId);
          if (container.children.length === 0) {
            document.getElementById(totalId).style.display = 'none';
          }
        }
      };
      
      // Função para calcular o total dos valores
      window.calcularTotalValores_${timestamp} = function(containerId, totalId) {
        const container = document.getElementById(containerId);
        const valorPrincipal = document.getElementById("${valorPropostaInputId}");
        let total = 0;
        
        // Adicionar valor principal
        if (valorPrincipal && valorPrincipal.value) {
          const valorPrincipalNumerico = parseFloat(valorPrincipal.value.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
          total += valorPrincipalNumerico;
        }
        
        // Adicionar valores dos lotes
        if (container) {
          const inputs = container.querySelectorAll('div > div > input[type="text"]');
          for (let i = 0; i < inputs.length; i++) {
            if (i % 2 === 1 && inputs[i].value) { // Pegar apenas os inputs de valor (segundo input em cada lote)
              const valor = parseFloat(inputs[i].value.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
              total += valor;
            }
          }
        }
        
        // Atualizar exibição do total
        const totalElement = document.getElementById(totalId);
        if (totalElement) {
          const totalFormatado = total.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
          totalElement.querySelector('span').textContent = totalFormatado;
          
          // Verificar se deve exibir o total
          if (total > 0 && container.children.length > 0) {
            totalElement.style.display = 'block';
          } else if (container.children.length === 0) {
            totalElement.style.display = 'none';
          }
        }
      };
      
      ${atendimentoComponent.scriptInicializador.replace('<script>', '').replace('</script>', '')}
    </script>
  `;
  
  return `
    ${scriptInicializador}
    <h3 style="margin-bottom: 20px;">3. DADOS DE VALORES DO EDITAL</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Valor Estimado no Edital:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${valorFormatado}</td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>Valor da nossa proposta:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">
          <div style="display: flex; flex-direction: column; width: 100%; gap: 10px;">
            <!-- Campo de valor principal -->
            <div style="display: flex; align-items: center;">
              <div style="position: relative; width: 200px;">
                <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #495057;">R$</span>
                <input 
                  type="text" 
                  id="${valorPropostaInputId}" 
                  style="width: 100%; padding: 8px 8px 8px 30px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; font-size: inherit;"
                  placeholder="0,00"
                  onkeypress="return (window.event.charCode >= 48 && window.event.charCode <= 57) || window.event.charCode === 44"
                  oninput="window.formatarValorMonetario_${timestamp}(this)"
                  onblur="window.calcularTotalValores_${timestamp}('${valoresContainerId}', '${valorTotalId}')"
                />
              </div>
            </div>
            
            <!-- Container para valores adicionais por lote -->
            <div id="${valoresContainerId}" style="display: flex; flex-direction: column; gap: 8px;">
              <!-- Aqui serão adicionados os campos de lote dinamicamente -->
            </div>
            
            <!-- Exibição do valor total -->
            <div style="margin-top: 5px; font-weight: bold; display: none;" id="${valorTotalId}">
              Total: R$ <span>0,00</span>
            </div>
          </div>
        </td>
      </tr>
      ${atendimentoComponent.html}
    </table>
    
    <!-- Script para carregar biblioteca Chart.js necessária para o gráfico -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
    
    <script>
      // Adicionar event listener quando o documento estiver pronto
      document.addEventListener('DOMContentLoaded', function() {
        // Adicionar event listener para o campo principal
        const inputPrincipal = document.getElementById("${valorPropostaInputId}");
        if (inputPrincipal) {
          inputPrincipal.addEventListener('blur', function() {
            window.calcularTotalValores_${timestamp}('${valoresContainerId}', '${valorTotalId}');
          });
        }
        
        ${atendimentoComponent.scriptCarregamento}
      });
    </script>
  `;
}