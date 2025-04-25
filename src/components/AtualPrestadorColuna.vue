<template>
  <div class="empresa-vencedora-coluna">
    <div v-if="isEditing" class="editing-mode">
      <div class="edit-container">
        <select v-if="showEmpresaDropdown" v-model="selectedEmpresaId" class="empresa-select" @change="onEmpresaSelected">
          <option value="">-- Selecione uma empresa --</option>
          <option value="custom">Inserir nome da empresa manualmente</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.nome }}
          </option>
        </select>
        
        <!-- Campo de texto para quando a empresa é inserida manualmente -->
        <input 
          v-if="!showEmpresaDropdown || selectedEmpresaId === 'custom'" 
          v-model="selectedEmpresa" 
          class="empresa-input" 
          placeholder="Digite o nome da empresa"
          type="text" 
        />
        
        <input 
          v-model="numeroContrato" 
          class="contrato-input" 
          placeholder="Nº do Contrato" 
          type="text" 
        />
        
        <div class="edit-actions">
          <button @click="saveAtualPrestador" class="btn-save">Salvar</button>
          <button @click="cancelEdit" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
    <div v-else class="display-mode" @click="handleClick">
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
    
    // Usar o composable para gerenciar estado de edição
    const {
      isEditing,
      startEdit,
      cancelEdit
    } = useEmpresaVencedora(props, ctx.emit, 'empresa_atual_prestadora')
    
    // Estado local
    const empresas = ref([]);
    const selectedEmpresa = ref('');
    const selectedEmpresaId = ref(null);
    const showEmpresaDropdown = ref(true);
    const numeroContrato = ref('');
    const valorFinal = ref(null);
    const dataAssinatura = ref(null);
    const observacoes = ref(null);
    
    // Dados que serão exibidos na célula
    const dadosAtualPrestador = ref(null);
    
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
    
    // Função para lidar com cliques (simples ou duplos)
    const handleClick = (event) => {
      // Prevenir que o evento de clique se propague para os handlers da tabela
      event.stopPropagation();
      
      // Iniciar edição apenas em caso de duplo clique
      if (event.detail === 2) {
        startEdit();
      }
    };
    
    // Computed que determina o que será exibido
    const dadosExibicao = computed(() => {
      if (isEditing.value) {
        return {
          nome: getNomeEmpresaSelecionada(),
          contrato: numeroContrato.value || ''
        };
      }
      
      if (dadosAtualPrestador.value) {
        return {
          nome: dadosAtualPrestador.value.empresa_nome || '',
          contrato: dadosAtualPrestador.value.numero_contrato || ''
        };
      }
      
      // Verificar se existe empresa atual no formato antigo
      if (props.processo.empresa_atual_prestadora) {
        try {
          let nomeEmpresa = '';
          let numeroContrato = '';
          
          if (typeof props.processo.empresa_atual_prestadora === 'string') {
            if (props.processo.empresa_atual_prestadora.startsWith('{')) {
              // Tentar parsear como JSON
              const dados = JSON.parse(props.processo.empresa_atual_prestadora);
              nomeEmpresa = dados.empresa_nome || dados.nomeEmpresa || '';
              numeroContrato = dados.numero_contrato || dados.numeroContrato || '';
            } else {
              nomeEmpresa = props.processo.empresa_atual_prestadora;
            }
          } else if (typeof props.processo.empresa_atual_prestadora === 'object') {
            nomeEmpresa = props.processo.empresa_atual_prestadora.empresa_nome || 
                        props.processo.empresa_atual_prestadora.nomeEmpresa || '';
            numeroContrato = props.processo.empresa_atual_prestadora.numero_contrato || 
                           props.processo.empresa_atual_prestadora.numeroContrato || '';
          }
          
          return {
            nome: nomeEmpresa,
            contrato: numeroContrato
          };
        } catch (e) {
          console.error('Erro ao processar empresa_atual_prestadora:', e);
        }
      }
      
      return { nome: '', contrato: '' };
    });
    
    // Função para obter o nome da empresa selecionada
    const getNomeEmpresaSelecionada = () => {
      if (selectedEmpresaId.value && selectedEmpresaId.value !== 'custom') {
        const empresa = empresas.value.find(e => e.id === selectedEmpresaId.value);
        return empresa ? empresa.nome : selectedEmpresa.value;
      }
      return selectedEmpresa.value;
    };
    
    // Função para carregar dados
    const carregarDadosAtualPrestador = async () => {
      if (!props.processo.id) return;
      
      console.log('Carregando dados para processo:', props.processo.id);
      
      try {
        // Primeiro, buscar o registro sem o relacionamento
        const { data, error } = await supabase
          .from('processos_empresa_atual_prestadora')
          .select('*')
          .eq('processo_id', props.processo.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        console.log('Dados carregados:', data);
        
        if (data) {
          dadosAtualPrestador.value = data;
          
          // Verificar se empresa_id é um UUID válido
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (data.empresa_id && uuidRegex.test(data.empresa_id)) {
            // É um UUID válido - buscar o nome da empresa
            selectedEmpresaId.value = data.empresa_id;
            selectedEmpresa.value = ''; // Será preenchido com o nome da empresa abaixo
            showEmpresaDropdown.value = true;
            
            const { data: empresaData, error: empresaError } = await supabase
              .from('empresas')
              .select('nome')
              .eq('id', data.empresa_id)
              .single();
              
            if (!empresaError && empresaData) {
              dadosAtualPrestador.value.empresa_nome = empresaData.nome;
            }
          } else {
            // Não é um UUID válido - usar o valor como nome da empresa
            selectedEmpresaId.value = 'custom';
            selectedEmpresa.value = data.empresa_id || '';
            dadosAtualPrestador.value.empresa_nome = data.empresa_id;
            showEmpresaDropdown.value = false;
          }
          
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
    
    // Evento para quando uma empresa é selecionada do dropdown
    const onEmpresaSelected = (event) => {
      const empresaId = selectedEmpresaId.value;
      
      if (empresaId === 'custom') {
        // Usuário escolheu inserir nome manualmente
        showEmpresaDropdown.value = false;
        selectedEmpresa.value = '';
      } else if (empresaId) {
        // Empresa selecionada do dropdown
        const empresa = empresas.value.find(e => e.id === empresaId);
        selectedEmpresa.value = empresa ? empresa.nome : '';
      }
    };
    
    // Função para salvar
    const saveAtualPrestador = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Determinar o valor para empresa_id
        let empresaId = null;
        let empresaNome = null;
        
        if (selectedEmpresaId.value === 'custom' || !showEmpresaDropdown.value) {
          // Se é personalizado ou o dropdown está oculto, usamos o texto como empresa_id
          if (selectedEmpresa.value) {
            empresaId = selectedEmpresa.value;
            empresaNome = selectedEmpresa.value;
          }
        } else if (selectedEmpresaId.value) {
          // Se é um ID de empresa selecionado do dropdown
          empresaId = selectedEmpresaId.value;
          const empresa = empresas.value.find(e => e.id === empresaId);
          empresaNome = empresa ? empresa.nome : null;
        }
        
        const payload = {
          processo_id: props.processo.id,
          empresa_id: empresaId,
          empresa_nome: empresaNome,
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
    
    // Carregar empresas e dados inicialmente
    onMounted(() => {
      loadEmpresas();
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
      selectedEmpresaId,
      showEmpresaDropdown,
      numeroContrato,
      empresas,
      startEdit,
      cancelEdit,
      saveAtualPrestador,
      handleClick,
      onEmpresaSelected,
      getNomeEmpresaSelecionada
    };
  }
};
</script>

<style scoped>
.empresa-vencedora-coluna {
  width: 100%;
  min-height: 24px;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
}

.display-mode {
  width: 100%;
  cursor: pointer;
}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empresa-nome {
  font-weight: 500;
}

.contrato-numero {
  font-size: 0.9em;
  color: #555;
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
  gap: 8px;
}

.empresa-select,
.empresa-input,
.contrato-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1em;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-save,
.btn-cancel {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-save {
  background-color: #4caf50;
  color: white;
}

.btn-cancel {
  background-color: #f44336;
  color: white;
}
</style>