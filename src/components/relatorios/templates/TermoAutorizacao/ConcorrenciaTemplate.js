/**
 * Gera a seção de concorrência
 * @param {Object} processo - Dados do processo
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} HTML da seção de concorrência
 */
export function gerarConcorrencia(processo, timestamp) {
  console.log('Dados do processo completo para debug:', processo);
  
  // Obter dados do atual prestador - diretamente da tabela relacionada
  let empresaAtualNome = '';
  let empresaAtualContrato = '';
  
  // 1. Verificar se existe o objeto _empresa_atual_prestadora (vindo da tabela relacionada)
  if (processo._empresa_atual_prestadora) {
    // Se empresa_id não for um UUID válido, é o próprio nome da empresa
    const empresa_id = processo._empresa_atual_prestadora.empresa_id || '';
    
    // Se o empresa_id não for um UUID válido, consideramos que é o próprio nome da empresa
    if (!isUUID(empresa_id)) {
      empresaAtualNome = empresa_id;
    } else {
      // Aqui você teria que buscar o nome da empresa pelo ID, mas como não temos acesso ao banco
      // vamos usar o ID como nome por enquanto (isso seria ajustado na implementação real)
      empresaAtualNome = empresa_id;
    }
    
    empresaAtualContrato = processo._empresa_atual_prestadora.numero_contrato || '';
    
    console.log('Dados encontrados em _empresa_atual_prestadora:', {
      nome: empresaAtualNome,
      contrato: empresaAtualContrato
    });
  } 
  // 2. Se não existir, verificar no formato antigo
  else if (processo.empresa_atual_prestadora) {
    try {
      if (typeof processo.empresa_atual_prestadora === 'string') {
        if (processo.empresa_atual_prestadora.startsWith('{')) {
          // Tentar parsear como JSON
          const dados = JSON.parse(processo.empresa_atual_prestadora);
          empresaAtualNome = dados.empresa_nome || dados.nomeEmpresa || dados.empresa_id || '';
          empresaAtualContrato = dados.numero_contrato || dados.numeroContrato || '';
        } else {
          // É apenas uma string com o nome
          empresaAtualNome = processo.empresa_atual_prestadora;
        }
      } else if (typeof processo.empresa_atual_prestadora === 'object') {
        // É um objeto JavaScript
        empresaAtualNome = processo.empresa_atual_prestadora.empresa_nome || 
                        processo.empresa_atual_prestadora.nomeEmpresa ||
                        processo.empresa_atual_prestadora.empresa_id || '';
        empresaAtualContrato = processo.empresa_atual_prestadora.numero_contrato || 
                             processo.empresa_atual_prestadora.numeroContrato || '';
      }
      
      console.log('Dados encontrados em empresa_atual_prestadora:', {
        nome: empresaAtualNome,
        contrato: empresaAtualContrato
      });
    } catch (e) {
      console.error('Erro ao processar empresa_atual_prestadora:', e);
    }
  }
  
  // Log para diagnóstico
  console.log('Dados finais do prestador atual:', {
    nome: empresaAtualNome,
    contrato: empresaAtualContrato
  });
  
  // IDs únicos para os elementos
  const valorConcorrenteId = `valor-concorrente-input-${timestamp}`;
  const concorrenteNomeId = `concorrente-nome-input-${timestamp}`;
  const habitantesId = `habitantes-input-${timestamp}`;
  
  // Obter distâncias formatadas (se disponíveis)
  let distanciasTexto = '';
  
  if (processo._distancias && processo._distancias.length > 0) {
    distanciasTexto = processo._distancias.map(d => {
      if (d.texto_completo) return d.texto_completo;
      return `${d.distancia_km} km${d.ponto_referencia_cidade ? ` de ${d.ponto_referencia_cidade}/${d.ponto_referencia_uf}` : ''}`;
    }).join(', ');
  } else if (processo.distancia_km) {
    distanciasTexto = `${processo.distancia_km} km${processo.ponto_referencia_cidade ? 
      ` de ${processo.ponto_referencia_cidade}/${processo.ponto_referencia_uf}` : ''}`;
  }
  
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
            value="${empresaAtualNome}"
          />
          ${empresaAtualContrato ? 
            `<div style="font-size: 0.9em; color: #555; margin-top: 5px;">Contrato: ${empresaAtualContrato}</div>` 
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