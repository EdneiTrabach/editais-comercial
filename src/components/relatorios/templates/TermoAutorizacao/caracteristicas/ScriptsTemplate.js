/**
 * Gera os scripts de interatividade para os componentes
 * @param {Number} timestamp - Timestamp para IDs únicos
 * @returns {String} Script HTML
 */
export function gerarScriptsTemplate(timestamp) {
  const esclarecimentosSimId = `esclarecimentos-sim-${timestamp}`;
  const esclarecimentosNaoId = `esclarecimentos-nao-${timestamp}`;
  const esclarecimentosContainerId = `esclarecimentos-container-${timestamp}`;
  
  const visitaSimId = `visita-sim-${timestamp}`;
  const visitaNaoId = `visita-nao-${timestamp}`;
  
  const docsSimId = `docs-sim-${timestamp}`;
  const docsNaoId = `docs-nao-${timestamp}`;
  
  const julgamentoSimId = `julgamento-sim-${timestamp}`;
  const julgamentoNaoId = `julgamento-nao-${timestamp}`;
  
  return `
    <script>
      (function() {
        // Função para inicializar todos os componentes
        function inicializarComponentes() {
          console.log('Inicializando componentes do relatório...');
          
          // Pedidos de Esclarecimentos
          inicializarEsclarecimentos();
          
          // Outros componentes
          inicializarVisita();
          inicializarDocumentos();
          inicializarJulgamento();
        }
        
        // Função para inicializar componentes de esclarecimentos
        function inicializarEsclarecimentos() {
          const esclarecimentosSimRadio = document.getElementById('${esclarecimentosSimId}');
          const esclarecimentosNaoRadio = document.getElementById('${esclarecimentosNaoId}');
          const esclarecimentosContainer = document.getElementById('${esclarecimentosContainerId}');
          
          console.log('Buscando elementos: ', 
            '${esclarecimentosSimId}', 
            '${esclarecimentosNaoId}', 
            '${esclarecimentosContainerId}');
            
          console.log('Elementos encontrados: ', 
            esclarecimentosSimRadio ? 'Sim' : 'Não', 
            esclarecimentosNaoRadio ? 'Sim' : 'Não', 
            esclarecimentosContainer ? 'Sim' : 'Não');
          
          if (esclarecimentosSimRadio && esclarecimentosNaoRadio && esclarecimentosContainer) {
            console.log('Configurando eventos para esclarecimentos');
            
            // Função para mostrar/esconder o campo de texto
            function toggleEsclarecimentosText() {
              if (esclarecimentosSimRadio.checked) {
                esclarecimentosContainer.style.display = 'block';
                console.log('Mostrando textarea de esclarecimentos');
              } else {
                esclarecimentosContainer.style.display = 'none';
                console.log('Escondendo textarea de esclarecimentos');
              }
            }
            
            // Adiciona os event listeners
            esclarecimentosSimRadio.addEventListener('click', function() {
              this.checked = true;
              if (esclarecimentosNaoRadio) esclarecimentosNaoRadio.checked = false;
              toggleEsclarecimentosText();
              console.log('Radio SIM clicado');
            });
            
            esclarecimentosNaoRadio.addEventListener('click', function() {
              this.checked = true;
              if (esclarecimentosSimRadio) esclarecimentosSimRadio.checked = false;
              toggleEsclarecimentosText();
              console.log('Radio NÃO clicado');
            });
            
            // Inicializa o estado
            toggleEsclarecimentosText();
          } else {
            console.error('Elementos de esclarecimentos não encontrados');
          }
        }
        
        // Função para inicializar visita antes da licitação
        function inicializarVisita() {
          const visitaSimRadio = document.getElementById('${visitaSimId}');
          const visitaNaoRadio = document.getElementById('${visitaNaoId}');
          
          if (visitaSimRadio && visitaNaoRadio) {
            visitaSimRadio.addEventListener('click', function() {
              this.checked = true;
              if (visitaNaoRadio) visitaNaoRadio.checked = false;
            });
            
            visitaNaoRadio.addEventListener('click', function() {
              this.checked = true;
              if (visitaSimRadio) visitaSimRadio.checked = false;
            });
          }
        }
        
        // Função para inicializar incluir documentos com preço
        function inicializarDocumentos() {
          const docsSimRadio = document.getElementById('${docsSimId}');
          const docsNaoRadio = document.getElementById('${docsNaoId}');
          
          if (docsSimRadio && docsNaoRadio) {
            docsSimRadio.addEventListener('click', function() {
              this.checked = true;
              if (docsNaoRadio) docsNaoRadio.checked = false;
            });
            
            docsNaoRadio.addEventListener('click', function() {
              this.checked = true;
              if (docsSimRadio) docsSimRadio.checked = false;
            });
          }
        }
        
        // Função para inicializar julgamento por lances
        function inicializarJulgamento() {
          const julgamentoSimRadio = document.getElementById('${julgamentoSimId}');
          const julgamentoNaoRadio = document.getElementById('${julgamentoNaoId}');
          
          if (julgamentoSimRadio && julgamentoNaoRadio) {
            julgamentoSimRadio.addEventListener('click', function() {
              this.checked = true;
              if (julgamentoNaoRadio) julgamentoNaoRadio.checked = false;
            });
            
            julgamentoNaoRadio.addEventListener('click', function() {
              this.checked = true;
              if (julgamentoSimRadio) julgamentoSimRadio.checked = false;
            });
          }
        }
        
        // Tenta inicializar os componentes assim que possível
        setTimeout(inicializarComponentes, 100);
        
        // Se a primeira tentativa falhar, tenta novamente com um intervalo maior
        setTimeout(inicializarComponentes, 500);
        
        // Uma última tentativa com intervalo ainda maior
        setTimeout(inicializarComponentes, 1000);
      })();
    </script>
  `;
}