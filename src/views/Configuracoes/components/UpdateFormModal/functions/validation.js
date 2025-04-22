/**
 * Valida os campos do formulário de atualização
 * @param {Object} formData - Dados do formulário
 * @returns {Object} - Objeto com resultado da validação e mensagens de erro
 */
export function validateUpdateForm(formData) {
  const errors = {};
  
  if (!formData.title || formData.title.trim() === '') {
    errors.title = 'O título é obrigatório';
  }
  
  if (!formData.description || formData.description.trim() === '') {
    errors.description = 'A descrição é obrigatória';
  }
  
  if (formData.version && !isValidVersion(formData.version)) {
    errors.version = 'O formato de versão deve ser X.Y.Z (ex: 1.0.0)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Verifica se o formato da versão é válido
 * @param {String} version - String da versão
 * @returns {Boolean}
 */
function isValidVersion(version) {
  const pattern = /^\d+\.\d+\.\d+$/;
  return pattern.test(version);
}