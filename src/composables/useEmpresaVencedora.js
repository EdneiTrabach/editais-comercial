import { ref, computed, watch } from 'vue';
import { supabase } from '@/lib/supabase';

export function useEmpresaVencedora(props, emit) {
  const empresas = ref([]);
  const isEditing = ref(false);
  const selectedEmpresa = ref(props.processo.empresa_vencedora || '');
  const numeroContrato = ref(props.processo.numero_contrato || '');
  const dadosAnalise = ref('');
  
  // Computed property para o nome da empresa
  const empresaNome = computed(() => {
    if (!selectedEmpresa.value) return '';
    const empresa = empresas.value.find(e => e.id === selectedEmpresa.value);
    return empresa ? empresa.nome : 'Empresa não encontrada';
  });
  
  // Watch para atualizar os valores quando o processo mudar
  watch(() => props.processo, (newProcesso) => {
    selectedEmpresa.value = newProcesso.empresa_vencedora || '';
    numeroContrato.value = newProcesso.numero_contrato || '';
    checkDadosAnaliseAutomatica();
  });
  
  // Carregar lista de empresas
  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .order('nome');
        
      if (error) throw error;
      empresas.value = data || [];
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };
  
  // Verificar dados de análise automática
  const checkDadosAnaliseAutomatica = () => {
    if (props.processo.dados_analise_automatica) {
      dadosAnalise.value = props.processo.dados_analise_automatica;
    } else {
      dadosAnalise.value = '';
    }
  };
  
  // Iniciar edição
  const startEdit = () => {
    isEditing.value = true;
  };
  
  // Cancelar edição
  const cancelEdit = () => {
    isEditing.value = false;
    selectedEmpresa.value = props.processo.empresa_vencedora || '';
    numeroContrato.value = props.processo.numero_contrato || '';
  };
  
  // Salvar alterações
  const saveChanges = async () => {
    const empresaChanged = selectedEmpresa.value !== props.processo.empresa_vencedora;
    const contratoChanged = numeroContrato.value !== props.processo.numero_contrato;
    
    if (!empresaChanged && !contratoChanged) {
      isEditing.value = false;
      return;
    }
    
    try {
      const updateData = {
        empresa_vencedora: selectedEmpresa.value,
        numero_contrato: numeroContrato.value,
        updated_at: new Date().toISOString()
      };
      
      // Adicionar usuário que está fazendo a alteração
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        updateData.updated_by = user.id;
      }
      
      const { error } = await supabase
        .from('processos')
        .update(updateData)
        .eq('id', props.processo.id);
        
      if (error) throw error;
      
      // Registrar no log do sistema
      await logSystemAction({
        tipo: 'atualizacao',
        tabela: 'processos',
        registro_id: props.processo.id,
        campo_alterado: empresaChanged && contratoChanged 
          ? 'empresa_vencedora e numero_contrato' 
          : empresaChanged 
            ? 'empresa_vencedora' 
            : 'numero_contrato',
        dados_anteriores: JSON.stringify({
          empresa_vencedora: props.processo.empresa_vencedora,
          numero_contrato: props.processo.numero_contrato
        }),
        dados_novos: JSON.stringify({
          empresa_vencedora: selectedEmpresa.value,
          numero_contrato: numeroContrato.value
        })
      });
      
      // Emitir evento de atualização para o componente pai
      emit('update', {
        id: props.processo.id,
        fields: {
          empresa_vencedora: selectedEmpresa.value,
          numero_contrato: numeroContrato.value
        }
      });
      
    } catch (error) {
      console.error('Erro ao atualizar empresa vencedora e contrato:', error);
      alert('Erro ao salvar empresa vencedora e número de contrato');
    } finally {
      isEditing.value = false;
    }
  };
  
  // Função para registrar ação no log
  const logSystemAction = async (dados) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const logData = {
        usuario_id: user.id,
        usuario_email: user.email,
        tipo: dados.tipo || 'atualizacao',
        tabela: dados.tabela || 'processos',
        registro_id: dados.registro_id,
        campo_alterado: dados.campo_alterado,
        dados_anteriores: dados.dados_anteriores,
        dados_novos: dados.dados_novos,
        data_hora: new Date().toISOString()
      };
      
      await supabase.from('system_logs').insert(logData);
    } catch (error) {
      console.warn('Erro no logging (não crítico):', error);
    }
  };
  
  return {
    empresas,
    isEditing,
    selectedEmpresa,
    numeroContrato,
    dadosAnalise,
    empresaNome,
    loadEmpresas,
    checkDadosAnaliseAutomatica,
    startEdit,
    cancelEdit,
    saveChanges
  };
}