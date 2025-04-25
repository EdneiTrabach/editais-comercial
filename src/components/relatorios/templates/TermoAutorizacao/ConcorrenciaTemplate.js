/**
 * Gera a seção de concorrência
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML da seção de concorrência
 */
export function gerarConcorrencia(processo, timestamp) {
  // Verificar todos os dados possíveis do processo para debug
  console.log('Dados do processo completo:', processo);

  // Obter dados do prestador atual
  let empresaAtualNome = '';
  let empresaAtualContrato = '';
  
  // Se existir a propriedade _empresa_atual_prestadora (adicionada via join)
  if (processo._empresa_atual_prestadora) {
    const dadosAtualPrestadora = processo._empresa_atual_prestadora;
    
    // Verificar por ordem de prioridade os campos possíveis para o nome da empresa
    if (dadosAtualPrestadora.empresa_nome) {
      empresaAtualNome = dadosAtualPrestadora.empresa_nome;
    } else if (dadosAtualPrestadora.empresa_id && !isUUID(dadosAtualPrestadora.empresa_id)) {
      // Se empresa_id não for um UUID, provavelmente é um nome de empresa
      empresaAtualNome = dadosAtualPrestadora.empresa_id;
    } else if (dadosAtualPrestadora.empresa_id && processo._empresas && processo._empresas[dadosAtualPrestadora.empresa_id]) {
      empresaAtualNome = processo._empresas[dadosAtualPrestadora.empresa_id].nome || '';
    }
    
    empresaAtualContrato = dadosAtualPrestadora.numero_contrato || '';
  } 
  // Usar o formato legado se existir
  else if (processo.empresa_atual_prestadora) {
    const empresaAtualData = processo.empresa_atual_prestadora;
    
    // Extrair dados da empresa atual prestadora
    if (typeof empresaAtualData === 'string' && empresaAtualData.includes('{')) {
      try {
        const parsedData = JSON.parse(empresaAtualData);
        empresaAtualNome = parsedData.empresa_nome || parsedData.nomeEmpresa || '';
        empresaAtualContrato = parsedData.numero_contrato || parsedData.numeroContrato || '';
      } catch (e) {
        empresaAtualNome = empresaAtualData;
      }
    } else if (typeof empresaAtualData === 'object') {
      empresaAtualNome = empresaAtualData.empresa_nome || empresaAtualData.nomeEmpresa || '';
      empresaAtualContrato = empresaAtualData.numero_contrato || empresaAtualData.numeroContrato || '';
    } else if (typeof empresaAtualData === 'string') {
      empresaAtualNome = empresaAtualData;
    }
  }

  // Verificar se também existe campo específico para nome e contrato
  if (!empresaAtualNome && processo.empresa_atual_prestadora_nome) {
    empresaAtualNome = processo.empresa_atual_prestadora_nome;
  }
  
  if (!empresaAtualContrato && processo.empresa_atual_prestadora_contrato) {
    empresaAtualContrato = processo.empresa_atual_prestadora_contrato;
  }
  
  // Log para debug
  console.log('Dados do prestador atual extraídos:', { 
    empresaAtualNome, 
    empresaAtualContrato 
  });
  
  // Obter dados da empresa vencedora
  let empresaVencedoraNome = '';
  let empresaVencedoraContrato = '';
  
  // Verificar se existe empresa vencedora e extrair informações
  if (processo.empresa_vencedora) {
    try {
      // Tentar como JSON (formato novo)
      if (typeof processo.empresa_vencedora === 'string' && processo.empresa_vencedora.includes('{')) {
        const dadosEmpresa = JSON.parse(processo.empresa_vencedora);
        empresaVencedoraNome = dadosEmpresa.nomeEmpresa || dadosEmpresa.empresa_nome || '';
        empresaVencedoraContrato = dadosEmpresa.numeroContrato || dadosEmpresa.numero_contrato || '';
      } else {
        // Formato antigo ou direto como string
        empresaVencedoraNome = processo.empresa_vencedora;
      }
    } catch (e) {
      // Se falhar ao parsear como JSON, usar o valor como string
      empresaVencedoraNome = processo.empresa_vencedora;
    }
  }
  
  // Priorizar dados da empresa atual, já que é o que queremos mostrar neste campo
  const concorrenteNome = empresaAtualNome || empresaVencedoraNome || '';
  const concorrenteContrato = empresaAtualContrato || empresaVencedoraContrato || '';
  
  // Obter distâncias formatadas (se disponíveis)
  let distanciasTexto = '';
  
  if (processo._distancias && processo._distancias.length > 0) {
    // Se tiver múltiplas distâncias no formato novo
    distanciasTexto = processo._distancias.map(d => {
      if (d.texto_completo) return d.texto_completo;
      return `${d.distancia_km} km${d.ponto_referencia_cidade ? ` de ${d.ponto_referencia_cidade}/${d.ponto_referencia_uf}` : ''}`;
    }).join(', ');
  } else if (processo.distancia_km) {
    // Se tiver apenas uma distância no formato antigo
    distanciasTexto = `${processo.distancia_km} km${processo.ponto_referencia_cidade ? 
      ` de ${processo.ponto_referencia_cidade}/${processo.ponto_referencia_uf}` : ''}`;
  }
  
  // IDs únicos para os elementos
  const valorConcorrenteId = `valor-concorrente-input-${timestamp}`;
  const concorrenteNomeId = `concorrente-nome-input-${timestamp}`;
  const habitantesId = `habitantes-input-${timestamp}`;
  
  // Debug para verificar os valores
  console.log('Dados para concorrente final:', {
    empresaAtualNome,
    empresaAtualContrato,
    concorrenteNome,
    concorrenteContrato
  });
  
  // Script para formatação monetária (semelhante ao ValoresTemplate)
  const scriptInicializador = `
    <script>
      // Função para formatar valor monetário
      window.formatarValorConcorrente_${timestamp} = function(input) {
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
      
      // Função para formatar número de habitantes
      window.formatarHabitantes_${timestamp} = function(input) {
        // Remove todos os caracteres não numéricos
        let valor = input.value.replace(/\D/g, '');
        
        // Formata com separadores de milhar
        if (valor) {
          valor = parseInt(valor).toLocaleString('pt-BR');
        }
        
        input.value = valor;
      };
    </script>
  `;
  
  return `
    ${scriptInicializador}
    <h3 style="margin-bottom: 20px;">5. CONCORRÊNCIA</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>5.1 Valor atual do concorrente:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">
          <div style="position: relative; width: 200px;">
            <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #495057;">R$</span>
            <input 
              type="text" 
              id="${valorConcorrenteId}" 
              style="width: 100%; padding: 8px 8px 8px 30px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; font-size: inherit;"
              placeholder="0,00"
              onkeypress="return (window.event.charCode >= 48 && window.event.charCode <= 57) || window.event.charCode === 44"
              oninput="window.formatarValorConcorrente_${timestamp}(this)"
              value="${processo.valor_atual_concorrente || ''}"
            />
          </div>
        </td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>5.2 Nome do concorrente/Assessoria:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">
          <input 
            type="text" 
            id="${concorrenteNomeId}" 
            style="width: 98%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; font-size: inherit;"
            placeholder="Digite o nome do concorrente..."
            value="${concorrenteNome}"
          />
          ${concorrenteContrato ? 
            `<div style="font-size: 0.9em; color: #555; margin-top: 5px;">Contrato: ${concorrenteContrato}</div>` 
            : ''}
        </td>
      </tr>
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>5.3 Distância das filiais e habitantes:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">
          <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
            <div style="width: 100%;">
              ${distanciasTexto ? 
                `<div style="padding: 8px; border: 1px solid #e9ecef; border-radius: 4px; background-color: #f8f9fa;">
                   ${distanciasTexto}
                 </div>` 
                : 
                `<input 
                  type="text" 
                  style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; font-size: inherit;"
                  placeholder="Digite as distâncias..."
                />`
              }
            </div>
            <div style="position: relative; width: 200px;">
              <input 
                type="text" 
                id="${habitantesId}" 
                style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; font-size: inherit;"
                placeholder="Número de habitantes"
                onkeypress="return (window.event.charCode >= 48 && window.event.charCode <= 57)"
                oninput="window.formatarHabitantes_${timestamp}(this)"
              />
              <span style="position: absolute; right: -85px; top: 50%; transform: translateY(-50%); color: #495057;">Habitantes</span>
            </div>
          </div>
        </td>
      </tr>
    </table>
  `;
}

// Função auxiliar para verificar se uma string é um UUID válido
function isUUID(str) {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}