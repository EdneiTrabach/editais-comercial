/**
 * Gera a seção de assinaturas
 * @param {Object} processo - Dados do processo
 * @returns {String} HTML da seção de assinaturas
 */
export function gerarAssinaturas(processo) {
  return `
    <div style="margin-top:50px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 45%;">
          <p style="border-top: 1px solid #000; padding-top: 10px; text-align: center;">Suzany Medeiros Leite</p>
          <p style="text-align: center;">Gerente Comercial</p>
        </div>
        <div style="width: 45%;">
          <p style="border-top: 1px solid #000; padding-top: 10px; text-align: center;">Estevão Henrique Holz</p>
          <p style="text-align: center;">CPF: 979.001.257-87</p>
        </div>
      </div>
    </div>
  `;
}