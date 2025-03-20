/**
 * Utilitário para mapeamento seguro entre nomes e IDs de responsáveis
 */

// Mapear IDs para nomes e vice-versa
export function createResponsaveisMapper(responsaveisArray = []) {
  const nameToIdMap = new Map();
  const idToNameMap = new Map();
  
  // Preencher os mapas
  responsaveisArray.forEach(resp => {
    if (resp.id && resp.nome) {
      nameToIdMap.set(resp.nome.toLowerCase(), resp.id);
      idToNameMap.set(resp.id, resp.nome);
    }
  });
  
  return {
    // Obter ID a partir do nome
    getIdFromName(name) {
      if (!name) return null;
      return nameToIdMap.get(name.toLowerCase()) || null;
    },
    
    // Obter nome a partir do ID
    getNameFromId(id) {
      if (!id) return 'Não atribuído';
      return idToNameMap.get(id) || 'Desconhecido';
    },
    
    // Garantir valor UUID válido (converte nome para ID se necessário)
    ensureValidUuid(value) {
      if (!value) return null;
      
      // Se já for um UUID válido, retorna o mesmo
      if (typeof value === 'string' && 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return value;
      }
      
      // Caso contrário, tenta mapear o nome para ID
      return this.getIdFromName(value) || null;
    },
    
    // Atualiza os mapas com novos dados
    updateMaps(newResponsaveis) {
      newResponsaveis.forEach(resp => {
        if (resp.id && resp.nome) {
          nameToIdMap.set(resp.nome.toLowerCase(), resp.id);
          idToNameMap.set(resp.id, resp.nome);
        }
      });
    }
  };
}