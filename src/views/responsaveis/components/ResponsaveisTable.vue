<template>
  <div class="table-container">
    <table class="excel-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Departamento</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5" class="loading">
            Carregando responsáveis...
          </td>
        </tr>
        <tr v-else-if="!responsaveis.length">
          <td colspan="5" class="empty-table">
            Nenhum responsável cadastrado
          </td>
        </tr>
        <tr v-else v-for="responsavel in responsaveis" :key="responsavel.id">
          <!-- Nome -->
          <td>
            <div v-if="editingNames[responsavel.id]" class="editing-field">
              <input 
                v-model="editingData[responsavel.id].nome"
                class="input"
                ref="nameInput"
                @keyup.enter="emitNameUpdate(responsavel)"
                @blur="emitNameUpdate(responsavel)"
                type="text"
              />
            </div>
            <div v-else class="editable-field" @dblclick="$emit('start-editing-name', responsavel)">
              {{ responsavel.nome || '—' }}
            </div>
          </td>
          
          <!-- Email -->
          <td>{{ responsavel.email || '—' }}</td>
          
          <!-- Departamento -->
          <td>
            <div v-if="editingDepts[responsavel.id]" class="editing-field">
              <input 
                v-model="editingData[responsavel.id].departamento"
                class="input"
                ref="deptInput"
                @keyup.enter="emitDeptUpdate(responsavel)"
                @blur="emitDeptUpdate(responsavel)"
                type="text"
              />
            </div>
            <div v-else class="editable-field" @dblclick="$emit('start-editing-dept', responsavel)">
              {{ responsavel.departamento || '—' }}
            </div>
          </td>
          
          <!-- Status -->
          <td>
            <span :class="'status-badge ' + responsavel.status.toLowerCase()">
              {{ formatStatus(responsavel.status) }}
            </span>
          </td>
          
          <!-- Ações -->
          <td>
            <ResponsavelAcoes 
              :responsavel="responsavel"
              :pode-excluir="!isResponsavelEmUso(responsavel)"
              @edit="$emit('edit', responsavel)"
              @toggle-status="$emit('toggle-status', responsavel)"
              @delete="$emit('delete', responsavel)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ResponsavelAcoes from './ResponsavelAcoes.vue'

export default {
  name: 'ResponsaveisTable',
  components: {
    ResponsavelAcoes
  },
  props: {
    responsaveis: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    editingNames: {
      type: Object,
      required: true
    },
    editingDepts: {
      type: Object,
      required: true
    },
    editingData: {
      type: Object,
      required: true
    },
    isResponsavelEmUso: {
      type: Function,
      required: true
    },
    formatStatus: {
      type: Function,
      required: true
    }
  },
  setup(props, { emit }) {
    // Emitir evento de atualização de nome
    const emitNameUpdate = (responsavel) => {
      if (!props.editingNames[responsavel.id]) return;
      
      emit('update-name', {
        responsavel,
        newName: props.editingData[responsavel.id]?.nome || ''
      });
    };
    
    // Emitir evento de atualização de departamento
    const emitDeptUpdate = (responsavel) => {
      if (!props.editingDepts[responsavel.id]) return;
      
      emit('update-dept', {
        responsavel,
        newDept: props.editingData[responsavel.id]?.departamento || ''
      });
    };
    
    return {
      emitNameUpdate,
      emitDeptUpdate
    };
  },
  emits: ['edit', 'toggle-status', 'delete', 'update-name', 'update-dept', 'start-editing-name', 'start-editing-dept']
}
</script>

<style src="@/assets/styles/components/responsaveis/table.css" scoped></style>