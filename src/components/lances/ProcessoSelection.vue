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

<style src="./ProcessoSelection.css" scoped></style>