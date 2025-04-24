/**
 * Gera a seção de dados do cliente com botões de rádio interativos
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de dados do cliente
 */
export function gerarDadosCliente(processo) {
  const { orgao } = processo;

  // ID único para os elementos de rádio
  const clienteId = `cliente-radio-${Date.now()}`;
  const prospectId = `prospect-radio-${Date.now()}`;

  return `
    <div class="container-dados-relatorio" style="display: flex; align-items: center; margin-bottom: 20px;">
      <h3 class="titulo-relatorio" style="margin: 0; margin-right: 15px;">1. DADOS DO CLIENTE/PROSPECT:</h3>
      
      <label class="label-cliente-relatorio" style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer; margin-bottom: 0px; ">
        <input class="radio-cliente-relatorio" type="radio" name="tipo-cliente" id="${clienteId}" style="margin-right: 6px;">
        <strong class="texto-cliente-relatorio">Cliente</strong>
      </label>
      
      <label class="label-prospect-relatorio" style="display: inline-flex; align-items: center; cursor: pointer; margin-bottom: 0px;">
        <input class="radio-prospect-relatorio" type="radio" name="tipo-cliente" id="${prospectId}" style="margin-right: 6px;">
        <strong class="texto-prospect-relatorio">Prospect</strong>
      </label>
      <p class="nome-orgao-relatorio" style="margin-left: 09%; font-size: 20px; "><strong class="label-nome-relatorio">Nome:</strong> ${orgao || ""}</p>
    </div>
    
    
    <script>
      (function() {
        // Este script será executado quando o documento for carregado no editor
        setTimeout(function() {
          const clienteRadio = document.getElementById('${clienteId}');
          const prospectRadio = document.getElementById('${prospectId}');
          
          if (clienteRadio) {
            clienteRadio.addEventListener('click', function() {
              this.checked = true;
              if (prospectRadio) prospectRadio.checked = false;
            });
          }
          
          if (prospectRadio) {
            prospectRadio.addEventListener('click', function() {
              this.checked = true;
              if (clienteRadio) clienteRadio.checked = false;
            });
          }
        }, 500);
      })();
    </script>
  `;
}
