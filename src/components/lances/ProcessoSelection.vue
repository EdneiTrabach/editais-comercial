<template>
  <div class="processo-selection">
    <div class="header-section">
      <h2>Selecione o Processo</h2>
      <button class="btn-novo-processo" @click="showNovoProcessoModal = true">
        <i class="fas fa-plus"></i> Criar Novo Processo
      </button>
    </div>

    <div class="processos-grid">
      <div 
        v-for="processo in processos" 
        :key="processo.id"
        class="processo-card"
        :class="{ 'selected': selectedProcesso === processo.id }"
        @click="$emit('select-processo', processo)"
      >
        <h3>{{ processo.numero_processo }}</h3>
        <div class="processo-info">
          <p><strong>Órgão:</strong> {{ processo.orgao }}</p>
          <p><strong>Data:</strong> {{ formatDate(processo.data_pregao) }}</p>
          <p><strong>Hora:</strong> {{ processo.hora_pregao }}</p>
          <p class="objeto">{{ processo.objeto_resumido }}</p>
        </div>
        <div class="processo-status">
          {{ formatStatus(processo.status) }}
        </div>
      </div>
    </div>

    <!-- Modal de Novo Processo -->
    <div v-if="showNovoProcessoModal" class="modal-overlay" @click.self="showNovoProcessoModal = false">
      <div class="modal-content">
        <h3>Novo Processo</h3>
        <form @submit.prevent="criarNovoProcesso">
          <div class="form-group">
            <label>Órgão*</label>
            <input v-model="novoProcesso.orgao" required placeholder="Nome do órgão">
          </div>

          <div class="form-group">
            <label>Data do Pregão*</label>
            <input v-model="novoProcesso.data_pregao" type="date" required>
          </div>

          <div class="form-group">
            <label>Hora do Pregão*</label>
            <input v-model="novoProcesso.hora_pregao" type="time" required>
          </div>

          <div class="form-group">
            <label>Objeto Resumido*</label>
            <textarea 
              v-model="novoProcesso.objeto_resumido" 
              required 
              rows="3"
              placeholder="Breve descrição do objeto"
            ></textarea>
          </div>

          <div class="form-buttons">
            <button type="button" class="btn-cancelar" @click="showNovoProcessoModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-criar" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar Processo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useProcessos } from '@/composables/useProcessos'

const props = defineProps({
  processos: Array,
  selectedProcesso: Number
})

const emit = defineEmits(['select-processo'])
const router = useRouter()
const { formatStatus, formatDate } = useProcessos()

// Estado do modal
const showNovoProcessoModal = ref(false)
const loading = ref(false)
const novoProcesso = ref({
  orgao: '',
  data_pregao: '',
  hora_pregao: '',
  objeto_resumido: '',
  status: 'em_analise'
})

// Função para criar novo processo
const criarNovoProcesso = async () => {
  try {
    loading.value = true

    // Adicionar data de criação e outros campos necessários
    const processoData = {
      ...novoProcesso.value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('processos')
      .insert(processoData)
      .select()
      .single()

    if (error) throw error

    // Fechar modal e emitir evento com o novo processo
    showNovoProcessoModal.value = false
    emit('select-processo', data)

  } catch (error) {
    console.error('Erro ao criar processo:', error)
    alert('Erro ao criar processo. Por favor, tente novamente.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Adicione ao arquivo ProcessoSelection.css ou inline aqui */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-novo-processo {
  background-color: #4299e1;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-novo-processo:hover {
  background-color: #3182ce;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancelar {
  padding: 0.5rem 1rem;
  background-color: #e2e8f0;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.btn-criar {
  padding: 0.5rem 1rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.btn-criar:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}
</style>
