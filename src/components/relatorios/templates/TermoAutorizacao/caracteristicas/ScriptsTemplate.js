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
        // Este script será executado quando o documento for carregado no editor
        setTimeout(function() {
          console.log('CaracteristicasTemplate: Script carregado');
          
          // Pedidos de Esclarecimentos
          const esclarecimentosSimRadio = document.getElementById('${esclarecimentosSimId}');
          const esclarecimentosNaoRadio = document.getElementById('${esclarecimentosNaoId}');
          const esclarecimentosContainer = document.getElementById('${esclarecimentosContainerId}');
          
          if (esclarecimentosSimRadio && esclarecimentosNaoRadio && esclarecimentosContainer) {
            console.log('CaracteristicasTemplate: Elementos de esclarecimentos encontrados');
            
            // Função para mostrar/esconder o campo de texto
            function toggleEsclarecimentosText() {
              console.log('CaracteristicasTemplate: Toggle texto', esclarecimentosSimRadio.checked);
              esclarecimentosContainer.style.display = esclarecimentosSimRadio.checked ? 'block' : 'none';
            }
            
            // Adiciona os event listeners
            esclarecimentosSimRadio.addEventListener('click', function() {
              console.log('CaracteristicasTemplate: Sim clicado');
              this.checked = true;
              if (esclarecimentosNaoRadio) esclarecimentosNaoRadio.checked = false;
              toggleEsclarecimentosText();
            });
            
            esclarecimentosNaoRadio.addEventListener('click', function() {
              console.log('CaracteristicasTemplate: Não clicado');
              this.checked = true;
              if (esclarecimentosSimRadio) esclarecimentosSimRadio.checked = false;
              toggleEsclarecimentosText();
            });
            
            // Inicializa o estado
            toggleEsclarecimentosText();
          } else {
            console.error('CaracteristicasTemplate: Elementos de esclarecimentos não encontrados');
          }
          
          // Visita antes da Licitação
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
          
          // Incluir documentos com preço
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
          
          // Julgamento por lances
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
        }, 500);
      })();
    </script>
  `;
}