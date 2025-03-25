<template>
  <div class="empresa-vencedora-coluna">
    <!-- Modo de edição -->
    <div v-if="isEditing" class="editing-mode">
      <div class="edit-container">
        <select v-model="selectedEmpresa" class="empresa-select">
          <option value="">Selecione a empresa vencedora...</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.nome }}
          </option>
        </select>
        
        <input 
          v-model="numeroContrato" 
          class="contrato-input" 
          placeholder="Nº do Contrato" 
          type="text"
        />
        
        <div class="edit-actions">
          <button @click="saveChanges" class="btn-save">Salvar</button>
          <button @click="cancelEdit" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
    
    <!-- Modo de visualização -->
    <div v-else class="display-mode" @dblclick="startEdit">
      <div v-if="empresaNome || numeroContrato" class="info-container">
        <div v-if="empresaNome" class="empresa-nome">{{ empresaNome }}</div>
        <div v-if="numeroContrato" class="contrato-numero">Contrato: {{ numeroContrato }}</div>
        <div v-if="dadosAnalise" class="dados-analise">{{ dadosAnalise }}</div>
      </div>
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
    const numeroContrato = ref(props.processo.numero_contrato || '');
    const dadosAnalise = ref('');
    
    // Carregar empresas ao montar o componente
    onMounted(async () => {
      await loadEmpresas();
      // Carregar os dados iniciais do contrato
      if (props.processo.numero_contrato) {
        numeroContrato.value = props.processo.numero_contrato;
      }
      
      // Verificar se há dados de análise automática
      checkDadosAnaliseAutomatica();
    });
    
    // Atualizar seleção quando o processo mudar
    watch(() => props.processo, (newProcesso) => {
      selectedEmpresa.value = newProcesso.empresa_vencedora || '';
      numeroContrato.value = newProcesso.numero_contrato || '';
      checkDadosAnaliseAutomatica();
    });
    
    // Função para verificar dados de análise automática
    const checkDadosAnaliseAutomatica = () => {
      // No futuro, aqui será implementada a lógica para
      // analisar publicações e extrair dados automaticamente
      // Por enquanto, apenas verificamos se já temos dados processados
      if (props.processo.dados_analise_automatica) {
        dadosAnalise.value = props.processo.dados_analise_automatica;
      } else {
        dadosAnalise.value = '';
      }
    };
    
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
    
    // Função para análise automática (a ser implementada futuramente)
    const analisarPublicacoesAutomaticamente = async () => {
      try {
        if (!props.processo.publicacao_original) return;
        
        // Extrair sistemas mencionados no texto
        const sistemasMencionados = await extrairSistemasDoTexto(props.processo.publicacao_original);
        
        if (sistemasMencionados.length > 0) {
          // Atualizar o processo com os sistemas identificados
          await supabase
            .from('processos')
            .update({
              sistemas_implantacao: {
                sistemas_ids: sistemasMencionados,
                informacoes_adicionais: 'Extraído automaticamente'
              }
            })
            .eq('id', props.processo.id);
        }
      } catch (error) {
        console.error('Erro na análise automática:', error);
      }
    };
    
    return {
      empresas,
      isEditing,
      selectedEmpresa,
      numeroContrato,
      dadosAnalise,
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
  text-align: center;
}

.sem-empresa {
  color: #999;
  font-style: italic;
}

.editing-mode {
  width: 100%;
}

.edit-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empresa-select, .contrato-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

.edit-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 6px;
}

.btn-save, .btn-cancel {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-save {
  background-color: #4caf50;
  color: white;
  border: 1px solid #43a047;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.empresa-nome {
  font-weight: bold;
}

.contrato-numero {
  font-size: 0.85em;
  color: #555;
}

.dados-analise {
  font-size: 0.8em;
  color: #4caf50;
  font-style: italic;
}

/* Adicionar estilos para integração com a tabela */
:deep(td) {
  padding: 0 !important;
  vertical-align: middle;
}
</style>