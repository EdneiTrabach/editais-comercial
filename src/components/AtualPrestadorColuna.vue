<template>
  <div class="empresa-vencedora-coluna">
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
  async setup(props, ctx) {
    console.log('=== INICIALIZANDO COMPONENTE AtualPrestadorColuna ===');
    console.log('Processo recebido:', props.processo);
    
    // Use o composable normalmente
    const {
      processoId,
      selectedEmpresa,
      numeroContrato,
      valorFinal,
      dataAssinatura,
      observacoes,
      empresas,
      isEditing,
      empresaNome,
      startEdit,
      cancelEdit
    } = useEmpresaVencedora(props, ctx.emit, 'empresa_atual_prestadora')
    
    console.log('Dados iniciais do composable:', {
      processoId: processoId.value,
      selectedEmpresa: selectedEmpresa.value,
      isEditing: isEditing.value
    });

    // Dados que serão exibidos na célula
    const dadosAtualPrestador = ref(null)
    
    // Mostrar logs quando dadosAtualPrestador mudar
    watch(dadosAtualPrestador, (newValue) => {
      console.log('dadosAtualPrestador atualizado:', newValue);
    });
    
    // Simplifique o computed para garantir que ele retorne um valor válido
    const dadosExibicao = computed(() => {
      // Durante a edição, use os valores do form
      if (isEditing.value) {
        return {
          nome: selectedEmpresa.value || '',
          contrato: numeroContrato.value || ''
        };
      }
      
      // Fora da edição, use os dados carregados do banco
      if (dadosAtualPrestador.value) {
        return {
          nome: dadosAtualPrestador.value.empresa_id || '',
          contrato: dadosAtualPrestador.value.numero_contrato || ''
        };
      }
      
      // Se não há dados, retorne objeto vazio
      return { nome: '', contrato: '' };
    })

    // Função para carregar os dados específicos do atual prestador
    const carregarDadosAtualPrestador = async () => {
      console.log('Iniciando carregarDadosAtualPrestador para processo_id:', props.processo.id);
      try {
        const { data, error } = await supabase
          .from('processos_empresa_atual_prestadora')
          .select('*')
          .eq('processo_id', props.processo.id)
          .single();

        console.log('DADOS DO ATUAL PRESTADOR CARREGADOS:', {
          processo_id: props.processo.id,
          data,
          error
        });
          
        console.log('Resposta do banco:', { data, error });  
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro na consulta:', error);
          throw error;
        }
        
        console.log('[DEBUG] Dados do atual prestador:', data);
        dadosAtualPrestador.value = data || null;
        
        // Inicializar os campos do formulário com os valores do banco
        if (data) {
          console.log('Atualizando campos do formulário com:', {
            empresa_id: data.empresa_id,
            numero_contrato: data.numero_contrato
          });
          
          selectedEmpresa.value = data.empresa_id || '';
          numeroContrato.value = data.numero_contrato || '';
        } else {
          console.log('Nenhum dado encontrado para este processo');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do atual prestador:', error);
      }
    }

    // Recarregar quando o processo mudar
    watch(() => props.processo.id, (newId, oldId) => {
      console.log(`ID do processo alterado de ${oldId} para ${newId}, recarregando dados`);
      carregarDadosAtualPrestador();
    });

    // Carregar os dados ao montar o componente
    onMounted(() => {
      console.log('Componente montado, carregando dados');
      carregarDadosAtualPrestador();
    })

    const saveAtualPrestador = async () => {
      console.log('Iniciando salvamento com dados:', {
        selectedEmpresa: selectedEmpresa.value,
        numeroContrato: numeroContrato.value
      });
      
      try {
        const empresaId = selectedEmpresa.value || null;

        const { data: { user } } = await supabase.auth.getUser()
        const payload = {
          processo_id: props.processo.id,
          empresa_id: empresaId,
          numero_contrato: numeroContrato.value || null,
          valor_final: valorFinal.value || null,
          data_assinatura: dataAssinatura.value || null,
          observacoes: observacoes.value || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        }

        console.log('Enviando payload:', payload);

        const { data, error } = await supabase
          .from('processos_empresa_atual_prestadora')
          .upsert(payload, { onConflict: 'processo_id' })
          .select();

        console.log('Resposta do upsert:', { data, error });
        
        if (error) throw error;
        
        // Recarregar dados após salvar
        console.log('Salvamento bem-sucedido, recarregando dados');
        await carregarDadosAtualPrestador();
        
        ctx.emit('update');
        isEditing.value = false;
      } catch (error) {
        console.error('Erro ao salvar atual prestador:', error);
        alert('Erro ao salvar atual prestador: ' + (error.message || error));
      }
    }

    return {
      processoId,
      selectedEmpresa,
      numeroContrato,
      valorFinal,
      dataAssinatura,
      observacoes,
      empresas,
      isEditing,
      empresaNome,
      startEdit,
      cancelEdit,
      saveAtualPrestador,
      dadosExibicao,
      carregarDadosAtualPrestador
    }
  }
}
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