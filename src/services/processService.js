import { supabase } from '@/lib/supabase';

/**
 * Busca processos com base nos filtros aplicados
 * @param {Object} params - Parâmetros para filtragem
 * @returns {Promise<Object>} - Retorna os dados dos processos e total
 */
export const getProcesses = async (params) => {
  try {
    const {
      startDate,
      endDate,
      status,
      modalidade,
      numeroProcesso,
      orgao,
      representanteId,
      empresaId,
      responsavelId,
      sistemasAtivos,
      uf,
      valorMin,
      valorMax,
      sortBy,
      page = 1,
      limit = 10
    } = params;

    console.log("Parâmetros de busca:", JSON.stringify(params, null, 2));

    // Configuração inicial da query com relacionamentos
    let query = supabase
      .from('processos') // Verifica se este é o nome correto da tabela
      .select(`
        *,
        representante:representante_id(*),
        empresa:empresa_id(*),
        responsavel:responsavel_id(*)
      `, { count: 'exact' });

    // Aplicar filtros se fornecidos
    if (startDate) {
      query = query.gte('data_pregao', startDate);
    }
    
    if (endDate) {
      query = query.lte('data_pregao', endDate);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (modalidade) {
      query = query.eq('modalidade', modalidade);
    }
    
    if (numeroProcesso) {
      query = query.ilike('numero_processo', `%${numeroProcesso}%`);
    }
    
    if (orgao) {
      query = query.ilike('orgao', `%${orgao}%`);
    }

    if (uf) {
      query = query.eq('estado', uf);
    }
    
    // Ajuste no filtro de representante - pode ser nome ou ID
    if (representanteId) {
      const isNumeric = !isNaN(Number(representanteId));
      if (isNumeric) {
        query = query.eq('representante_id', representanteId);
      } else {
        // Se não for ID, busca pelo nome através da relação
        query = query.eq('representante.nome', representanteId);
      }
    }
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId);
    }
    
    if (valorMin && !isNaN(Number(valorMin))) {
      query = query.gte('valor_estimado', Number(valorMin));
    }
    
    if (valorMax && !isNaN(Number(valorMax))) {
      query = query.lte('valor_estimado', Number(valorMax));
    }
    
    // Filtro para sistemas ativos (array de IDs)
    if (sistemasAtivos && sistemasAtivos.length > 0) {
      // Usando o operador de sobreposição para verificar se qualquer sistema no filtro
      // está presente nos sistemas_ativos do processo
      query = query.overlaps('sistemas_ativos', sistemasAtivos);
    }

    // Aplicar ordenação
    if (sortBy) {
      switch (sortBy) {
        case 'date_desc':
          query = query.order('data_pregao', { ascending: false });
          break;
        case 'date_asc':
          query = query.order('data_pregao', { ascending: true });
          break;
        case 'value_desc':
          query = query.order('valor_estimado', { ascending: false });
          break;
        case 'value_asc':
          query = query.order('valor_estimado', { ascending: true });
          break;
        default:
          query = query.order('data_pregao', { ascending: false });
      }
    } else {
      // Ordenação padrão
      query = query.order('data_pregao', { ascending: false });
    }

    // Aplicar paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);

    // Executar a consulta
    const { data, error, count } = await query;

    if (error) {
      console.error("Erro na consulta Supabase:", error);
      throw new Error(error.message);
    }

    console.log(`Encontrados ${count || 0} processos`);
    if (data && data.length > 0) {
      console.log("Amostra do primeiro resultado:", JSON.stringify(data[0], null, 2));
    }

    return {
      data: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    throw error;
  }
};

/**
 * Busca representantes para filtros
 * @returns {Promise<Array>} Lista de representantes
 */
export const getRepresentantes = async () => {
  try {
    // Verifique o nome correto da tabela
    const { data, error } = await supabase
      .from('representantes')
      .select('id, nome')
      .order('nome');
      
    if (error) {
      console.error("Erro ao buscar representantes:", error);
      throw error;
    }
    
    console.log(`Encontrados ${data?.length || 0} representantes`);
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar representantes:', error);
    throw error;
  }
};

/**
 * Busca empresas para filtros
 * @returns {Promise<Array>} Lista de empresas
 */
export const getEmpresas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome')
      .order('nome');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    throw error;
  }
};

/**
 * Busca responsáveis para filtros
 * @returns {Promise<Array>} Lista de responsáveis
 */
export const getResponsaveis = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .order('nome');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar responsáveis:', error);
    throw error;
  }
};

/**
 * Busca sistemas para filtros
 * @returns {Promise<Array>} Lista de sistemas
 */
export const getSistemas = async () => {
  try {
    const { data, error } = await supabase
      .from('sistemas')
      .select('id, nome, descricao')
      .order('nome');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error);
    throw error;
  }
};

/**
 * Obtém lista de estados (UFs) brasileiros
 * @returns {Array} Lista de UFs
 */
export const getEstados = () => {
  return [
    { valor: 'AC', label: 'Acre' },
    { valor: 'AL', label: 'Alagoas' },
    { valor: 'AP', label: 'Amapá' },
    { valor: 'AM', label: 'Amazonas' },
    { valor: 'BA', label: 'Bahia' },
    { valor: 'CE', label: 'Ceará' },
    { valor: 'DF', label: 'Distrito Federal' },
    { valor: 'ES', label: 'Espírito Santo' },
    { valor: 'GO', label: 'Goiás' },
    { valor: 'MA', label: 'Maranhão' },
    { valor: 'MT', label: 'Mato Grosso' },
    { valor: 'MS', label: 'Mato Grosso do Sul' },
    { valor: 'MG', label: 'Minas Gerais' },
    { valor: 'PA', label: 'Pará' },
    { valor: 'PB', label: 'Paraíba' },
    { valor: 'PR', label: 'Paraná' },
    { valor: 'PE', label: 'Pernambuco' },
    { valor: 'PI', label: 'Piauí' },
    { valor: 'RJ', label: 'Rio de Janeiro' },
    { valor: 'RN', label: 'Rio Grande do Norte' },
    { valor: 'RS', label: 'Rio Grande do Sul' },
    { valor: 'RO', label: 'Rondônia' },
    { valor: 'RR', label: 'Roraima' },
    { valor: 'SC', label: 'Santa Catarina' },
    { valor: 'SP', label: 'São Paulo' },
    { valor: 'SE', label: 'Sergipe' },
    { valor: 'TO', label: 'Tocantins' }
  ];
};

/**
 * Obtém lista de modalidades de licitação
 * @returns {Array} Lista de modalidades
 */
export const getModalidades = () => {
  return [
    { valor: '', label: 'Todas' },
    { valor: 'pregao_eletronico', label: 'Pregão Eletrônico' },
    { valor: 'pregao_presencial', label: 'Pregão Presencial' },
    { valor: 'concorrencia', label: 'Concorrência' },
    { valor: 'tomada_preco', label: 'Tomada de Preço' },
    { valor: 'convite', label: 'Convite' },
    { valor: 'chamamento_publico', label: 'Chamamento Público' },
    { valor: 'inexigibilidade', label: 'Inexigibilidade' },
    { valor: 'dispensa', label: 'Dispensa' }
  ];
};

/**
 * Obtém lista de status do processo
 * @returns {Array} Lista de status
 */
export const getStatusProcesso = () => {
  return [
    { valor: '', label: 'Todos' },
    { valor: 'aberto', label: 'Aberto' },
    { valor: 'em_analise', label: 'Em Análise' },
    { valor: 'participando', label: 'Participando' },
    { valor: 'vencido', label: 'Vencido' },
    { valor: 'perdido', label: 'Perdido' },
    { valor: 'cancelado', label: 'Cancelado' },
    { valor: 'revogado', label: 'Revogado' },
    { valor: 'suspenso', label: 'Suspenso' },
    { valor: 'nao_participar', label: 'Não Participar' }
  ];
};
