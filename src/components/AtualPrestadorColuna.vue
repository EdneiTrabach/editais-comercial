<template>
  <div class="empresa-vencedora-coluna">
    <!-- Debug info (remover depois) -->
    <div v-if="false" style="color: red; font-size: 10px; text-align: left; margin-bottom: 5px;">
      Dados: {{ JSON.stringify(dadosExibicao) }}
    </div>
    
    <div v-if="isEditing" class="editing-mode">
      <div class="edit-container">
        <input
          v-model="selectedEmpresa"
          class="empresa-select"
          placeholder="Digite o atual prestador..."
          type="text"
        />
        <input v-model="numeroContrato" class="contrato-input" placeholder="Nº do Contrato" type="text" />
        <div class="edit-actions">
          <button @click="saveAtualPrestador" class="btn-save">Salvar</button>
          <button @click="cancelEdit" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
    <div v-else class="display-mode" @dblclick="startEdit">
      <div v-if="dadosExibicao.nome || dadosExibicao.contrato" class="info-container">
        <div v-if="dadosExibicao.nome" class="empresa-nome">
          {{ dadosExibicao.nome }}
        </div>
        <div v-if="dadosExibicao.contrato" class="contrato-numero">
          Contrato: {{ dadosExibicao.contrato }}
        </div>
      </div>
      <span v-else class="sem-empresa">Não definida</span>
    </div>
  </div>
</template>

<script>
import { useEmpresaVencedora } from '@/composables/useEmpresaVencedora'
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'

export default {
  name: 'AtualPrestadorColuna',
  props: { processo: { type: Object, required: true } },
  emits: ['update'],
  setup(props, ctx) {
    console.log('Inicializando AtualPrestadorColuna para processo:', props.processo.id);
    
    // Use apenas o que precisamos do composable
    const {
      isEditing,
      startEdit,
      cancelEdit
    } = useEmpresaVencedora(props, ctx.emit, 'empresa_atual_prestadora')
    
    // Criar nossas próprias refs em vez de usar as do composable
    const selectedEmpresa = ref('');
    const numeroContrato = ref('');
    const valorFinal = ref(null);
    const dataAssinatura = ref(null);
    const observacoes = ref(null);
    
    // Dados que serão exibidos na célula
    const dadosAtualPrestador = ref(null);
    
    // Computed que determina o que será exibido
    const dadosExibicao = computed(() => {
      if (isEditing.value) {
        return {
          nome: selectedEmpresa.value || '',
          contrato: numeroContrato.value || ''
        };
      }
      
      if (dadosAtualPrestador.value) {
        return {
          nome: dadosAtualPrestador.value.empresa_id || '',
          contrato: dadosAtualPrestador.value.numero_contrato || ''
        };
      }
      
      return { nome: '', contrato: '' };
    });
    
    // Função para carregar dados
    const carregarDadosAtualPrestador = async () => {
      if (!props.processo.id) return;
      
      console.log('Carregando dados para processo:', props.processo.id);
      
      try {
        const { data, error } = await supabase
          .from('processos_empresa_atual_prestadora')
          .select('*')
          .eq('processo_id', props.processo.id)
          .single();
        
        console.log('Dados carregados:', data);
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        dadosAtualPrestador.value = data || null;
        
        if (data) {
          selectedEmpresa.value = data.empresa_id || '';
          numeroContrato.value = data.numero_contrato || '';
          valorFinal.value = data.valor_final;
          dataAssinatura.value = data.data_assinatura;
          observacoes.value = data.observacoes;
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        dadosAtualPrestador.value = null;
      }
    };
    
    // Função para salvar
    const saveAtualPrestador = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const payload = {
          processo_id: props.processo.id,
          empresa_id: selectedEmpresa.value || null,
          numero_contrato: numeroContrato.value || null,
          valor_final: valorFinal.value || null,
          data_assinatura: dataAssinatura.value || null,
          observacoes: observacoes.value || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        };
        
        console.log("Salvando payload:", payload);
        
        const { error } = await supabase
          .from('processos_empresa_atual_prestadora')
          .upsert(payload, { onConflict: 'processo_id' });
        
        if (error) throw error;
        
        await carregarDadosAtualPrestador();
        ctx.emit('update');
        isEditing.value = false;
      } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);
      }
    };
    
    // Carregar dados inicialmente
    onMounted(() => {
      carregarDadosAtualPrestador();
    });
    
    // Recarregar quando o processo mudar
    watch(() => props.processo.id, () => {
      carregarDadosAtualPrestador();
    });
    
    return {
      isEditing,
      dadosExibicao,
      selectedEmpresa,
      numeroContrato,
      startEdit,
      cancelEdit,
      saveAtualPrestador
    };
  }
};
</script>

<style scoped>
.empresa-vencedora-coluna {
  width: 100%;
  min-height: 24px;
  padding: 4px;
}

.display-mode {
  cursor: pointer;
  width: 100%;
  text-align: center;
}

.sem-empresa {
  color: #94a3b8;
  font-style: italic;
}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empresa-nome {
  font-weight: 500;
  color: #1e293b;
}

.contrato-numero {
  font-size: 0.8em;
  color: #64748b;
}

.edit-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empresa-select, 
.contrato-input {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.btn-save,
.btn-cancel {
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.btn-save {
  background-color: #3b82f6;
  color: white;
}

.btn-cancel {
  background-color: #e2e8f0;
  color: #64748b;
}
</style>