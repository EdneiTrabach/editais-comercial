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

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  background: var(--bg-card, white);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-top: 1.5rem;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  color: var(--text-primary, #333);
}

.excel-table thead {
  background-color: var(--bg-header, #f8f9fa);
  font-weight: 600;
  color: var(--text-header, #495057);
}

.excel-table th {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-primary, #dee2e6);
}

.excel-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-light, #f1f1f1);
}

.excel-table tr:hover {
  background-color: var(--bg-hover, #f8f9fa);
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: var(--bg-success-light, #d4edda);
  color: var(--text-success, #155724);
}

.status-badge.inactive {
  background-color: var(--bg-danger-light, #f8d7da);
  color: var(--text-danger, #721c24);
}

.status-badge.pending {
  background-color: var(--bg-warning-light, #fff3cd);
  color: var(--text-warning, #856404);
}

/* Edição inline */
.editable-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.editing-field {
  width: 100%;
}

.input {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-primary, #ced4da);
  width: 100%;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--primary, #193155);
  box-shadow: 0 0 0 2px rgba(25, 49, 85, 0.1);
}

/* Estado de carregamento */
.loading {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted, #6c757d);
  font-size: 1rem;
}

/* Mensagem de tabela vazia */
.empty-table {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted, #6c757d);
  font-style: italic;
}

/* Responsividade */
@media (max-width: 768px) {
  .excel-table thead {
    display: none;
  }
  
  .excel-table tr {
    display: block;
    border-bottom: 1px solid var(--border-primary, #dee2e6);
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;
  }
  
  .excel-table td {
    display: flex;
    text-align: right;
    border-bottom: none;
    padding: 0.5rem;
  }
  
  .excel-table td::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: auto;
  }
}
</style>