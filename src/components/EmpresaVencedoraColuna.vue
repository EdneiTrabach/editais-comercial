<template>
  <div class="empresa-vencedora-coluna">
    <!-- Modo de edição -->
    <div v-if="isEditing" class="editing-mode">
      <select v-model="selectedEmpresa" class="empresa-select" @blur="saveChanges" @keyup.enter="saveChanges" @keyup.esc="cancelEdit">
        <option value="">Selecione a empresa vencedora...</option>
        <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
          {{ empresa.nome }}
        </option>
      </select>
    </div>
    
    <!-- Modo de visualização -->
    <div v-else class="display-mode" @dblclick="startEdit">
      <span v-if="empresaNome">{{ empresaNome }}</span>
      <span v-else class="sem-empresa">Não definida</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'

export default {
  name: 'EmpresaVencedoraColuna',
  
  props: {
    processo: {
      type: Object,
      required: true
    }
  },
  
  emits: ['update'],
  
  setup(props, { emit }) {
    const empresas = ref([]);
    const isEditing = ref(false);
    const selectedEmpresa = ref(props.processo.empresa_vencedora || '');
    
    // Carregar empresas ao montar o componente
    onMounted(async () => {
      await loadEmpresas();
    });
    
    // Atualizar seleção quando o processo mudar
    watch(() => props.processo, (newProcesso) => {
      selectedEmpresa.value = newProcesso.empresa_vencedora || '';
    });
    
    // Buscar nome da empresa pelo ID
    const empresaNome = computed(() => {
      if (!selectedEmpresa.value) return '';
      const empresa = empresas.value.find(e => e.id === selectedEmpresa.value);
      return empresa ? empresa.nome : 'Empresa não encontrada';
    });
    
    // Carregar lista de empresas do banco
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
    
    // Iniciar edição
    const startEdit = () => {
      isEditing.value = true;
    };
    
    // Cancelar edição
    const cancelEdit = () => {
      isEditing.value = false;
      selectedEmpresa.value = props.processo.empresa_vencedora || '';
    };
    
    // Salvar alterações
    const saveChanges = async () => {
      if (selectedEmpresa.value === props.processo.empresa_vencedora) {
        isEditing.value = false;
        return;
      }
      
      try {
        const updateData = {
          empresa_vencedora: selectedEmpresa.value,
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
          campo_alterado: 'empresa_vencedora',
          dados_anteriores: props.processo.empresa_vencedora,
          dados_novos: selectedEmpresa.value
        });
        
        // Emitir evento de atualização para o componente pai
        emit('update', {
          id: props.processo.id,
          field: 'empresa_vencedora',
          value: selectedEmpresa.value
        });
        
      } catch (error) {
        console.error('Erro ao atualizar empresa vencedora:', error);
        alert('Erro ao salvar empresa vencedora');
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
      empresaNome,
      startEdit,
      cancelEdit,
      saveChanges
    };
  }
}
</script>

<style scoped>
.empresa-vencedora-coluna {
  width: 100%;
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 6px;
  box-sizing: border-box;
}

.display-mode {
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center; /* Centralizar como as outras células */
}

.sem-empresa {
  color: #999;
  font-style: italic;
}

.editing-mode {
  width: 100%;
}

.empresa-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

/* Adicionar estilos para integração com a tabela */
:deep(td) {
  padding: 0 !important;
  vertical-align: middle;
}
</style>