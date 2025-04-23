<template>
  <div class="table-container">
    <table class="empresa-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>CNPJ</th>
          <th>Razão Social</th>
          <th>Contato</th>
          <th>Telefone</th>
          <th>Email</th>
          <th class="color-column">Cor</th>
          <th class="actions-column">Ações</th>
        </tr>
      </thead>
      <tbody v-if="!isLoading && empresas.length > 0">
        <tr v-for="empresa in empresas" :key="empresa.id">
          <td>{{ empresa.nome }}</td>
          <td>{{ formatCNPJ(empresa.cnpj) }}</td>
          <td>{{ empresa.razao_social }}</td>
          <td>{{ empresa.contato || '-' }}</td>
          <td>{{ formatTelefone(empresa.telefone) }}</td>
          <td>{{ empresa.email || '-' }}</td>
          <td class="color-column">
            <ColorCell :color="empresa.color || '#FFFFFF'" />
          </td>
          <td class="actions-column">
            <AcoesCell 
              :empresa="empresa" 
              @edit="$emit('edit', empresa)" 
              @delete="$emit('delete', empresa)" 
            />
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="isLoading">
        <tr>
          <td colspan="8" class="loading-cell">
            <div class="loading-indicator">Carregando...</div>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="8" class="empty-table">
            Nenhuma empresa cadastrada.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { formatCNPJ } from '../functions/formatacao';
import ColorCell from './ColorCell.vue';
import AcoesCell from './AcoesCell.vue';

export default {
  name: 'EmpresaTable',
  components: {
    ColorCell,
    AcoesCell
  },
  props: {
    empresas: {
      type: Array,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    loadError: {
      type: String,
      default: null
    }
  },
  emits: ['edit', 'delete'],
  methods: {
    formatCNPJ(cnpj) {
      return formatCNPJ(cnpj);
    },
    formatTelefone(telefone) {
      if (!telefone) return '-';
      
      // Remove caracteres não numéricos
      const numeroLimpo = telefone.replace(/\D/g, '');
      
      if (numeroLimpo.length === 11) {
        // Celular: (XX) 9XXXX-XXXX
        return numeroLimpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (numeroLimpo.length === 10) {
        // Fixo: (XX) XXXX-XXXX
        return numeroLimpo.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
      }
      
      return telefone;
    }
  }
};
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

.empresa-table {
  width: 100%;
  border-collapse: collapse;
}

.empresa-table th,
.empresa-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.empresa-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.empresa-table tbody tr:hover {
  background-color: #f9fafb;
}

.color-column {
  width: 120px;
  text-align: center;
}

.actions-column {
  width: 100px;
  text-align: center;
}

.loading-cell {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-table {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}
</style>