import { ref } from 'vue';

export function useIAAnalyzer() {
  const processando = ref(false);
  const erro = ref(null);
  
  /**
   * Analisa um texto de publicação contratual
   * @param {string} texto - Texto da publicação
   * @param {Array} sistemas - Lista de sistemas disponíveis
   * @param {Array} empresas - Lista de empresas cadastradas
   * @returns {Object} Resultado da análise
   */
  const analisarTexto = async (texto, sistemas, empresas) => {
    if (!texto || texto.trim().length < 50) {
      return null;
    }
    
    try {
      processando.value = true;
      erro.value = null;
      
      // Normalizar o texto para facilitar a busca
      const textoNormalizado = texto.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      // Extrair possível empresa vencedora
      const empresaVencedora = extrairEmpresaVencedora(textoNormalizado, empresas);
      
      // Extrair número do contrato
      const numeroContrato = extrairNumeroContrato(textoNormalizado);
      
      // Extrair sistemas mencionados
      const sistemasIds = extrairSistemasMencionados(textoNormalizado, sistemas);
      
      return {
        empresa_vencedora: empresaVencedora,
        numero_contrato: numeroContrato,
        sistemas_ids: sistemasIds
      };
    } catch (error) {
      console.error('Erro na análise de texto:', error);
      erro.value = error;
      return null;
    } finally {
      processando.value = false;
    }
  };
  
  /**
   * Extrai informações da empresa vencedora do texto
   */
  const extrairEmpresaVencedora = (texto, empresas) => {
    // Padrões de texto que podem indicar a empresa vencedora
    const padroes = [
      /empresa (vencedora|adjudicada|contratada)[:\s]+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /adjudicado[:\s]+(a|para|à)?\s+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /contratada[:\s]+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /vencedor[:\s]+(.*?)(?=[\.,;]|\s{2}|$)/i,
      /homologado[:\s]+(a|para|à)?\s+(.*?)(?=[\.,;]|\s{2}|$)/i
    ];
    
    // Tentar extrair o nome da empresa usando os padrões
    let possiveisEmpresas = [];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[2]) {
        possiveisEmpresas.push(match[2].trim());
      }
    }
    
    // Procurar por CNPJ no texto
    const padraoCNPJ = /cnpj[:\s]*(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\.\s]?\d{4}[\-\.\s]?\d{2})/i;
    const matchCNPJ = texto.match(padraoCNPJ);
    let cnpjEncontrado = null;
    
    if (matchCNPJ && matchCNPJ[1]) {
      // Limpar formatação do CNPJ
      cnpjEncontrado = matchCNPJ[1].replace(/[^\d]/g, '');
    }
    
    // Buscar correspondência entre empresas cadastradas e texto extraído
    if (cnpjEncontrado) {
      const empresa = empresas.find(e => {
        const cnpjLimpo = e.cnpj ? e.cnpj.replace(/[^\d]/g, '') : '';
        return cnpjLimpo === cnpjEncontrado;
      });
      
      if (empresa) return empresa.id;
    }
    
    // Se não encontrou por CNPJ, tenta por nome
    for (const nomeEmpresa of possiveisEmpresas) {
      const empresa = empresas.find(e => {
        const nome = e.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nome.includes(nomeEmpresa) || nomeEmpresa.includes(nome);
      });
      
      if (empresa) return empresa.id;
    }
    
    return null;
  };
  
  /**
   * Extrai o número do contrato do texto
   */
  const extrairNumeroContrato = (texto) => {
    // Padrões comuns para números de contrato
    const padroes = [
      /contrato n[º°\.ºo]([\s\.:]*)(\d+[\/-]?\d*[\/-]?\d*)/i,
      /numero do contrato[:\s]+(\d+[\/-]?\d*[\/-]?\d*)/i,
      /contrato[:\s]+(\d+[\/-]?\d*[\/-]?\d*)/i,
      /contrato de (prestacao|fornecimento)[\s\w]+ n[º°\.ºo]([\s\.:]*)(\d+[\/-]?\d*[\/-]?\d*)/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[2]) {
        return match[2].trim();
      } else if (match && match[3]) {
        return match[3].trim();
      } else if (match && match[1] && /\d/.test(match[1])) {
        return match[1].trim();
      }
    }
    
    return null;
  };
  
  /**
   * Extrai menções a sistemas cadastrados no texto
   */
  const extrairSistemasMencionados = (texto, sistemas) => {
    const sistemasEncontrados = [];
    
    sistemas.forEach(sistema => {
      // Normalizar nome do sistema
      const nomeNormalizado = sistema.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      // Criar variações de busca para o nome do sistema
      const variacoes = [
        nomeNormalizado,
        // Remover "sistema" ou "software" do início do nome
        nomeNormalizado.replace(/^(sistema|software)[\s\-_]+/i, ''),
        // Buscar por sigla (se tiver espaços)
        nomeNormalizado.split(/\s+/).map(palavra => palavra[0]).join('')
      ];
      
      // Verificar se alguma variação está presente no texto
      const encontrado = variacoes.some(variacao => 
        texto.includes(variacao) && variacao.length > 2 // Evitar falsos positivos com siglas curtas
      );
      
      if (encontrado && !sistemasEncontrados.includes(sistema.id)) {
        sistemasEncontrados.push(sistema.id);
      }
    });
    
    return sistemasEncontrados;
  };
  
  // Expor funções e estados
  return {
    processando,
    erro,
    analisarTexto
  };
}