import { supabase } from '@/lib/supabase';

/**
 * Inicializa o monitoramento de mudanças de status em processos
 */
export const iniciarMonitoramentoProcessos = () => {
  console.log('Iniciando monitoramento de status de processos');
  
  const channel = supabase.channel('processos-status-changes')
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'processos', filter: 'status=eq.vamos_participar' }, 
      payload => {
        console.log('Processo atualizado para status "vamos_participar":', payload);
        // Aqui você pode implementar alguma lógica adicional se necessário
        registrarProcessoParaRelatorio(payload.new);
      }
    )
    .subscribe();
    
  return channel;
};

/**
 * Registra um processo na tabela de relatórios de participação
 * @param {Object} processo - O processo atualizado
 */
const registrarProcessoParaRelatorio = async (processo) => {
  try {
    if (!processo || !processo.id) return;
    
    console.log(`Sincronizando processo ${processo.id} para relatório de participação`);
    
    // Verificar se o processo já está registrado na tabela de relatórios
    const { data: existente, error: checkError } = await supabase
      .from('relatorios_participacao')
      .select('id')
      .eq('processo_id', processo.id)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    // Se já existe, não precisamos fazer nada
    if (existente) {
      console.log('Processo já registrado no relatório de participação');
      return;
    }
    
    // Registrar o processo na tabela de relatórios de participação
    const { error: insertError } = await supabase
      .from('relatorios_participacao')
      .insert({
        processo_id: processo.id,
        data_registro: new Date().toISOString(),
        status_atual: processo.status,
        observacoes: 'Registrado automaticamente por atualização de status'
      });
      
    if (insertError) throw insertError;
    
    console.log('Processo registrado com sucesso no relatório de participação');
  } catch (error) {
    console.error('Erro ao registrar processo para relatório:', error);
  }
};

/**
 * Verifica e sincroniza os processos que devem aparecer no relatório de participação
 */
export const sincronizarProcessosParticipacao = async () => {
  try {
    console.log('Iniciando sincronização de processos para relatório de participação');
    
    // Buscar todos os processos com status relevantes
    const { data, error } = await supabase
      .from('processos')
      .select('id, status')
      .or('status.eq.vamos_participar,status.eq.ganhamos,status.eq.perdemos');
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log('Nenhum processo encontrado para sincronização');
      return 0;
    }
    
    // Para cada processo, verificar se já está na tabela de relatórios
    let processosAdicionados = 0;
    
    for (const processo of data) {
      const { data: existente, error: checkError } = await supabase
        .from('relatorios_participacao')
        .select('id')
        .eq('processo_id', processo.id)
        .maybeSingle();
        
      if (checkError) {
        console.error(`Erro ao verificar processo ${processo.id}:`, checkError);
        continue;
      }
      
      // Se não existe, adicionar
      if (!existente) {
        const { error: insertError } = await supabase
          .from('relatorios_participacao')
          .insert({
            processo_id: processo.id,
            data_registro: new Date().toISOString(),
            status_atual: processo.status,
            observacoes: 'Registrado automaticamente por sincronização'
          });
          
        if (insertError) {
          console.error(`Erro ao registrar processo ${processo.id}:`, insertError);
        } else {
          processosAdicionados++;
        }
      }
    }
    
    console.log(`Sincronização concluída: ${processosAdicionados} processos adicionados`);
    return processosAdicionados;
  } catch (error) {
    console.error('Erro ao sincronizar processos para participação:', error);
    throw error;
  }
};