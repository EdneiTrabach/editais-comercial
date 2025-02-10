<template>
  <div 
    v-if="show" 
    class="modal-backdrop" 
    @click.self="fecharModal"
    @keydown.esc="fecharModal"
  >
    <div 
      class="modal-content" 
      @click.stop
    >
      <h2>Novo Processo Licitatório</h2>
      <form @submit.prevent="handleSubmit" class="form-grid">
        <div class="form-group">
          <label>Número do Processo*</label>
          <div class="processo-input">
            <input 
              v-model="formData.numero" 
              type="text" 
              required
              placeholder="Número"
            />
            <span class="separator">/</span>
            <input 
              v-model="formData.ano" 
              type="number" 
              required
              :min="currentYear"
              :max="currentYear + 1"
              placeholder="Ano"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Órgão*</label>
          <input 
            v-model="formData.orgao" 
            type="text" 
            required
            placeholder="Nome do órgão"
          />
        </div>

        <div class="form-group">
          <label>Data do Pregão*</label>
          <input 
            v-model="formData.data_pregao" 
            type="datetime-local" 
            required
          />
        </div>

        <div class="form-group">
          <label>Modalidade*</label>
          <select v-model="formData.modalidade" required>
            <option value="">Selecione...</option>
            <option value="pregao">Pregão - Art. 28</option>
            <option value="concorrencia">Concorrência - Art. 28</option>
            <option value="concurso">Concurso - Art. 28</option>
            <option value="leilao">Leilão - Art. 28</option>
            <option value="dialogo_competitivo">Diálogo Competitivo - Art. 28</option>
          </select>
        </div>

        <div class="form-group" v-if="formData.modalidade === 'pregao'">
          <label>Tipo de Pregão*</label>
          <select v-model="formData.tipo_pregao" required>
            <option value="">Selecione...</option>
            <option value="presencial">Presencial</option>
            <option value="eletronico">Eletrônico</option>
          </select>
        </div>

        <div class="form-group" v-if="formData.tipo_pregao === 'eletronico'">
          <label>Site do Pregão*</label>
          <input 
            v-model="formData.site_pregao" 
            type="url" 
            placeholder="https://..."
            required
          />
        </div>

        <div class="form-group full-width">
          <label>Objeto Resumido* (máx. 200 caracteres)</label>
          <input 
            v-model="formData.objeto_resumido" 
            type="text"
            maxlength="200"
            required
            placeholder="Breve descrição do objeto"
          />
          <small>{{ formData.objeto_resumido?.length || 0 }}/200</small>
        </div>

        <div class="form-group full-width">
          <label>Objeto Completo*</label>
          <textarea 
            v-model="formData.objeto_completo" 
            rows="4"
            required
            placeholder="Descrição completa do objeto conforme Art. 40"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Responsável</label>
          <input 
            type="text" 
            :value="'(definir)'"
            disabled
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancelar" @click="fecharModal">
            Cancelar
          </button>
          <button type="submit" class="btn-salvar" :disabled="loading">
            {{ loading ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close', 'saved'])

const currentYear = new Date().getFullYear()
const loading = ref(false)

const formData = ref({
  numero: '',
  ano: currentYear,
  orgao: '',
  data_pregao: '',
  modalidade: '',
  tipo_pregao: '',
  site_pregao: '',
  objeto_resumido: '',
  objeto_completo: ''
})

const fecharModal = (event) => {
  // Simplificado para sempre fechar quando clicado fora
  emit('close')
}

const handleSubmit = async () => {
  try {
    loading.value = true
    const { data: { user } } = await supabase.auth.getUser()

    const processo = {
      numero_processo: `${formData.value.numero}/${formData.value.ano}`,
      ano: formData.value.ano,
      orgao: formData.value.orgao,
      data_pregao: formData.value.data_pregao,
      modalidade: formData.value.modalidade,
      tipo_pregao: formData.value.tipo_pregao,
      site_pregao: formData.value.site_pregao,
      objeto_resumido: formData.value.objeto_resumido,
      objeto_completo: formData.value.objeto_completo,
      responsavel: user.id
    }

    const { error } = await supabase
      .from('processos')
      .insert(processo)

    if (error) throw error

    emit('saved')
    fecharModal()
  } catch (error) {
    console.error('Erro:', error)
    alert('Erro ao salvar processo')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(25, 49, 85, 0.6); /* Aumentado opacidade */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
  /* Garantir que o backdrop cubra tudo */
  isolation: isolate;
  pointer-events: all;
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  width: 85%;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(25, 49, 85, 0.15);
  animation: slideIn 0.3s ease;
  position: relative;
  z-index: 10000; /* Aumentado para garantir que fique acima */
}

/* Adicionar animações */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Remover estilos antigos que estavam causando problemas */
.modal-backdrop * {
  pointer-events: auto;
}

.modal-content * {
  pointer-events: auto;
}

/* O resto dos estilos permanece igual */
.form-grid {
  position: relative; /* Adiciona posicionamento relativo */
  z-index: 1; /* Garante que fique acima do backdrop */
  /* Resto dos estilos do form-grid permanece igual */
}

/* Previne interação com elementos abaixo do modal */
.modal-backdrop * {
  pointer-events: auto;
}

/* Ajuste para elementos dentro do modal */
.modal-content * {
  pointer-events: auto;
}

/* O resto dos estilos permanece igual */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

input, select, textarea {
  padding: 0.9rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-family: inherit;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #193155;
  box-shadow: 0 0 0 3px rgba(25, 49, 85, 0.1);
  background: white;
}

.btn-cancelar, .btn-salvar {
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-cancelar {
  background: #e9ecef;
  color: #495057;
}

.btn-cancelar:hover {
  background: #dee2e6;
  transform: translateY(-2px);
}

.btn-salvar {
  background: #193155;
  color: white;
}

.btn-salvar:hover {
  background: #254677;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 49, 85, 0.2);
}

.btn-salvar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

label {
  font-weight: 500;
  color: #193155;
  font-size: 0.95rem;
}

small {
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

textarea {
  resize: vertical;
  min-height: 120px;
}
</style>