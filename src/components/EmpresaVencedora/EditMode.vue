<template>
  <div class="editing-mode">
    <div class="edit-container">
      <select 
        :value="selectedEmpresa"
        @input="$emit('update:selected-empresa', $event.target.value)"
        class="empresa-select"
      >
        <option value="">Selecione a empresa vencedora...</option>
        <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
          {{ empresa.nome }}
        </option>
      </select>
      
      <input 
        :value="numeroContrato"
        @input="$emit('update:numero-contrato', $event.target.value)"
        class="contrato-input" 
        placeholder="Nº do Contrato" 
        type="text"
      />
      
      <div class="edit-actions">
        <button @click="$emit('save')" class="btn-save">Salvar</button>
        <button @click="$emit('cancel')" class="btn-cancel">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditMode',
  
  props: {
    empresas: {
      type: Array,
      required: true
    },
    selectedEmpresa: {
      type: String,
      default: ''
    },
    numeroContrato: {
      type: String,
      default: ''
    }
  },
  
  emits: [
    'update:selected-empresa',
    'update:numero-contrato',
    'save',
    'cancel'
  ]
}
</script>

<style scoped>
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
</style>