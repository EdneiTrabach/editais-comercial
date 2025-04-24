/**
 * Gera o componente de percentual de atendimento com dados de análise
 * @param {Object} processo - Dados do processo
 * @param {Array} analisesItens - Dados de análise já carregados do banco
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {Object} HTML e scripts do componente
 */
export function gerarAtendimentoTemplate(processo, analisesItens = [], timestamp) {
  // Adicionar logs para depuração
  console.log('AtendimentoTemplate - Processo recebido:', processo);
  console.log('AtendimentoTemplate - Análises recebidas:', analisesItens);
  
  const atendimentoContainerId = `atendimento-container-${timestamp}`;
  const graficoAtendimentoId = `grafico-atendimento-${timestamp}`;
  
  // Garantir que analisesItens seja um array válido
  const itens = Array.isArray(analisesItens) ? analisesItens : [];
  console.log('AtendimentoTemplate - Itens após validação:', itens);
  
  // Carregar dados das análises de itens do processo atual (dados "mockados" para teste)
  // Esses são dados de exemplo baseados nos dados mostrados na tela de análises
  // Se os dados reais não estiverem chegando, usamos estes
  const dadosMock = [
    {
      sistema_nome_personalizado: "SEM SISTEMAS PARA MOSTRAR",
      total_itens: 0,
      nao_atendidos: 0,
      percentual_minimo: 0,
      sistemas: { nome: "SEM SISTEMAS PARA MOSTRAR" },
      obrigatorio: false
    }
  ];
  
  // Usar os dados reais se disponíveis, caso contrário usar dados de exemplo
  const dadosParaUsar = itens.length > 0 ? itens : 
    (processo && processo.id ? dadosMock : []);
  
  console.log('AtendimentoTemplate - Dados que serão usados:', dadosParaUsar);
  
  // Processar dados de atendimento
  let totalGeral = 0;
  let atendimentoGeral = 0;
  const sistemasNomes = [];
  const percentuais = [];
  
  // Processar os dados de análise
  dadosParaUsar.forEach(item => {
    const totalItens = item.total_itens || 0;
    const naoAtendidos = item.nao_atendidos || 0;
    const atendidos = totalItens - naoAtendidos;
    const percentual = totalItens > 0 ? Math.round((atendidos / totalItens) * 100) : 0;
    
    const nomeSistema = item.sistema_nome_personalizado || 
                       (item.sistemas ? item.sistemas.nome : 'Sistema');
    
    sistemasNomes.push(nomeSistema);
    percentuais.push(percentual);
    
    totalGeral += totalItens;
    atendimentoGeral += atendidos;
  });
  
  // Calcular percentual geral
  const percentualGeral = totalGeral > 0 ? Math.round((atendimentoGeral / totalGeral) * 100) : 0;
  
  console.log('AtendimentoTemplate - Totais calculados:', { 
    totalGeral, 
    atendimentoGeral, 
    percentualGeral,
    sistemasNomes,
    percentuais
  });
  
  // Gerar HTML para a tabela
  let tabelaHtml = '';
  
  if (dadosParaUsar.length === 0) {
    tabelaHtml = '<p style="font-style: italic; color: #6c757d;">Não há dados de análise disponíveis para este processo.</p>';
  } else {
    tabelaHtml = `
      <div style="max-height: 300px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Sistema</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Total Itens</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Não Atendidos</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #dee2e6;">% Atendimento</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Adicionar linhas para cada sistema
    dadosParaUsar.forEach(item => {
      const totalItens = item.total_itens || 0;
      const naoAtendidos = item.nao_atendidos || 0;
      const atendidos = totalItens - naoAtendidos;
      const percentual = totalItens > 0 ? Math.round((atendidos / totalItens) * 100) : 0;
      const percentualMinimo = item.percentual_minimo || 22;
      const atende = percentual >= percentualMinimo;
      
      const nomeSistema = item.sistema_nome_personalizado || 
                         (item.sistemas ? item.sistemas.nome : 'Sistema');
      
      const corStatus = atende ? '#28a745' : '#dc3545';
      const textoStatus = atende ? 'Atende' : 'Não Atende';
      
      tabelaHtml += `
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 8px; text-align: left;">${nomeSistema}</td>
          <td style="padding: 8px; text-align: center;">${totalItens}</td>
          <td style="padding: 8px; text-align: center;">${naoAtendidos}</td>
          <td style="padding: 8px; text-align: center; font-weight: bold;">${percentual}%</td>
          <td style="padding: 8px; text-align: center;">
            <span style="padding: 2px 8px; border-radius: 4px; background-color: ${corStatus}; color: white;">${textoStatus}</span>
          </td>
        </tr>
      `;
    });
    
    // Adicionar linha de total
    tabelaHtml += `
        <tr style="background-color: #f8f9fa; font-weight: bold;">
          <td style="padding: 8px; text-align: left;">TOTAL GERAL</td>
          <td style="padding: 8px; text-align: center;">${totalGeral}</td>
          <td style="padding: 8px; text-align: center;">${totalGeral - atendimentoGeral}</td>
          <td style="padding: 8px; text-align: center;">${percentualGeral}%</td>
          <td style="padding: 8px; text-align: center;"></td>
        </tr>
      </tbody>
    </table>
    </div>
    `;
  }
  
  const scriptInicializador = `
    <script>
      // Função para criar gráfico de atendimento
      window.criarGraficoAtendimento_${timestamp} = function() {
        console.log('Iniciando criação do gráfico com dados:', {
          sistemasNomes: ${JSON.stringify(sistemasNomes)},
          percentuais: ${JSON.stringify(percentuais)}
        });
        
        const sistemasNomes = ${JSON.stringify(sistemasNomes)};
        const percentuais = ${JSON.stringify(percentuais)};
        const graficoContainerId = "${graficoAtendimentoId}";
        
        // Se não houver dados, exibir mensagem
        if (!sistemasNomes.length) {
          document.getElementById(graficoContainerId).innerHTML = 
            '<p style="font-style: italic; color: #6c757d;">Não há dados para exibir no gráfico.</p>';
          return;
        }
        
        // Verificar se a biblioteca Chart está disponível
        if (typeof Chart === 'undefined') {
          console.error('Chart.js não está disponível');
          document.getElementById(graficoContainerId).innerHTML = 
            '<p style="font-style: italic; color: #dc3545;">Erro: biblioteca Chart.js não carregada.</p>';
          return;
        }
        
        // Preparar canvas para o gráfico
        const graficoContainer = document.getElementById(graficoContainerId);
        if (!graficoContainer) {
          console.error('Container do gráfico não encontrado:', graficoContainerId);
          return;
        }
        
        graficoContainer.innerHTML = '<canvas id="grafico-atendimento-canvas-${timestamp}" style="width: 100%; max-height: 250px;"></canvas>';
        
        // Cores para as barras (gradiente de verde para vermelho com base no percentual)
        const cores = percentuais.map(p => {
          if (p >= 90) return 'rgba(40, 167, 69, 0.8)';      // Verde forte
          else if (p >= 75) return 'rgba(92, 184, 92, 0.8)';  // Verde médio
          else if (p >= 60) return 'rgba(240, 173, 78, 0.8)'; // Amarelo
          else if (p >= 40) return 'rgba(217, 83, 79, 0.7)';  // Laranja
          else return 'rgba(220, 53, 69, 0.8)';               // Vermelho
        });
        
        try {
          // Criar o gráfico
          const canvasEl = document.getElementById('grafico-atendimento-canvas-${timestamp}');
          if (!canvasEl) {
            console.error('Elemento canvas não encontrado');
            return;
          }
          
          const ctx = canvasEl.getContext('2d');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: sistemasNomes,
              datasets: [{
                label: '% de Atendimento',
                data: percentuais,
                backgroundColor: cores,
                borderColor: cores.map(c => c.replace('0.8', '1')),
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.raw + '%';
                    }
                  }
                }
              }
            }
          });
          
          console.log('Gráfico criado com sucesso!');
        } catch (error) {
          console.error('Erro ao criar gráfico:', error);
          graficoContainer.innerHTML = 
            '<p style="font-style: italic; color: #dc3545;">Erro ao criar o gráfico: ' + error.message + '</p>';
        }
      };
    </script>
  `;

  return {
    html: `
      <tr>
        <td style="width:40%; padding:8px; border-bottom:1px solid #ddd;"><strong>% que atendemos:</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd;">
          <!-- Container para tabela de atendimento -->
          <div id="${atendimentoContainerId}">
            ${tabelaHtml}
          </div>
          
          <!-- Container para gráfico de atendimento -->
          <div id="${graficoAtendimentoId}" style="width: 100%; margin-top: 15px;">
            <!-- O gráfico será inserido aqui -->
          </div>
        </td>
      </tr>
    `,
    scriptInicializador,
    scriptCarregamento: `
      // Carregar gráfico de atendimento
      console.log('Tentando carregar o gráfico de atendimento');
      if (window.criarGraficoAtendimento_${timestamp}) {
        window.criarGraficoAtendimento_${timestamp}();
      } else {
        console.error('Função criarGraficoAtendimento_${timestamp} não está definida!');
      }
    `
  };
}