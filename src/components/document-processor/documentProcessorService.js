/**
 * Verifica o status do servidor
 * @returns {Promise<Object>} Status do servidor
 */
export async function checkServerStatus() {
  try {
    console.log("Verificando status do servidor Docling...");
    
    // Adicionar um timestamp para evitar cache
    const response = await fetch(`/api/docling/health?_t=${Date.now()}`);
    
    if (!response.ok) {
      const errorMsg = `Erro ${response.status}: ${response.statusText}`;
      console.error("Erro ao verificar status:", errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    console.log("Status do servidor:", data);
    
    return data;
  } catch (error) {
    console.error("Erro ao verificar status do servidor:", error);
    return { 
      status: "error", 
      docling_available: false,
      error_message: error.message
    };
  }
}

/**
 * Valida o arquivo antes do envio
 * 
 * @param {File} file - O arquivo para validar
 * @throws {Error} - Se o arquivo for inválido
 */
function validateFile(file) {
  // Verificar tamanho máximo (20MB)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("O arquivo é muito grande. O tamanho máximo é 20MB.");
  }
  
  // Verificar tipos permitidos
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/html',
    'image/jpeg',
    'image/png'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipo de arquivo não suportado. Use PDF, DOCX, XLSX, HTML, JPG ou PNG.");
  }
}

/**
 * Obtém mensagem de erro detalhada da resposta
 * 
 * @param {Response} response - Resposta da API
 * @returns {Promise<string>} - Mensagem de erro
 */
async function getErrorMessage(response) {
  const contentType = response.headers.get("content-type");
  
  if (contentType && contentType.includes("application/json")) {
    const errorData = await response.json();
    return errorData.error || `Erro ${response.status}: ${response.statusText}`;
  } else {
    const errorText = await response.text();
    return `Erro ${response.status}: ${errorText.substring(0, 200)}`;
  }
}

/**
 * Processa um documento enviando-o para o serviço backend
 * 
 * @param {File} file - O arquivo a ser processado
 * @param {Object} options - Opções de processamento
 * @returns {Promise<Object>} - Resultado do processamento
 * @throws {Error} - Erro durante o processamento
 */
export async function processDocument(file, options = {}) {
  console.log("Iniciando processamento do arquivo:", file.name);
  
  try {
    // Verificar se o servidor está online
    const healthData = await checkServerStatus();
    console.log("Servidor de processamento está online:", healthData);
    
    if (!healthData.docling_available) {
      throw new Error("Biblioteca Docling não está disponível no servidor. Verifique a instalação.");
    }
    
    // Validar arquivo
    validateFile(file);
    
    // Preparar FormData para envio
    const formData = new FormData();
    formData.append("file", file);
    
    // Adicionar opções se fornecidas
    if (Object.keys(options).length > 0) {
      formData.append("options", JSON.stringify({
        enableOcr: options.enableOcr === undefined ? true : options.enableOcr,
        forceOcr: options.forceOcr === undefined ? false : options.forceOcr,
        includeImages: options.includeImages === undefined ? true : options.includeImages,
        includeTables: options.includeTables === undefined ? true : options.includeTables
      }));
    }
    
    console.log("Enviando requisição para API local com opções:", options);
    
    // Enviar a requisição com um timeout de 60 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch("/api/docling/process", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log("Status da resposta:", response.status);
      
      if (!response.ok) {
        const errorMsg = await getErrorMessage(response);
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      console.log("Documento processado com sucesso");
      return result;
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error("Timeout: o servidor demorou muito para responder. Tente novamente ou use um arquivo menor.");
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Erro ao processar documento:", error);
    
    // Melhorar mensagem de erro para ser mais específica e útil
    if (error.message.includes('Failed to fetch') || !navigator.onLine) {
      throw new Error("Não foi possível conectar ao servidor de processamento. Verifique sua conexão com a internet e se o servidor Python está rodando.");
    }
    throw error;
  }
}