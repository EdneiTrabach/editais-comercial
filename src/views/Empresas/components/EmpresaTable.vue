<template>
  <div class="table-container">
    <div v-if="isLoading" class="loading-indicator">Carregando empresas...</div>
    <div v-else-if="loadError" class="error-message">{{ loadError }}</div>
    <div v-else-if="empresas.length === 0" class="empty-state">Nenhuma empresa cadastrada</div>
    <table v-else class="excel-table">
      <thead>
        <tr>
          <th>Cor</th>
          <th>Nome Fantasia</th>
          <th>CNPJ</th>
          <th>Razão Social</th>
          <th>Contato</th>
          <th>Telefone</th>
          <th>Email</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="empresa in empresas" :key="empresa.id">
          <td>
            <div class="color-indicator" :style="{ backgroundColor: empresa.color || '#FFFFFF' }"></div>
          </td>
          <td>{{ empresa.nome }}</td>
          <td>{{ formatCNPJ(empresa.cnpj) }}</td>
          <td>{{ empresa.razao_social }}</td>
          <td>{{ empresa.contato || '-' }}</td>
          <td>{{ empresa.telefone || '-' }}</td>
          <td>{{ empresa.email || '-' }}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action edit" @click="$emit('edit', empresa)">
                <img src="/icons/edicao.svg" alt="Editar" class="icon" />
              </button>
              <button class="btn-action delete" @click="$emit('delete', empresa)">
                <img src="/icons/lixeira.svg" alt="Excluir" class="icon" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { formatCNPJ } from '../functions/formatacao';

export default {
  name: 'EmpresaTable',
  props: {
    empresas: {
      type: Array,
      default: () => []
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
  setup() {
    return {
      formatCNPJ
    };
  }
}
</script>