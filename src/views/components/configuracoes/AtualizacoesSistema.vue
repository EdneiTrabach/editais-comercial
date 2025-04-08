<template>
  <div>
    <div class="section-header">
      <h2 class="section-title">Atualizações do Sistema</h2>
      <button @click="$emit('add-update')" class="btn-add-cfg-usuarios">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Nova Atualização
      </button>
      <button @click="$emit('voltar')" class="btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Voltar
      </button>
    </div>
    
    <div v-if="systemUpdates.length > 0" class="updates-table">
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Versão</th>
            <th>Data</th>
            <th>Importância</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="update in systemUpdates" :key="update.id">
            <td>{{ update.title }}</td>
            <td>{{ update.version || '-' }}</td>
            <td>{{ formatDate(update.release_date) }}</td>
            <td>{{ formatImportance(update.importance) }}</td>
            <td>
              <button @click="$emit('preview-update', update)" class="btn-small">
                Visualizar
              </button>
              <button @click="$emit('edit-update', update)" class="btn-small">
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else class="no-updates">
      <p>Nenhuma atualização cadastrada.</p>
    </div>

    <div class="atualizacoes-sistema">
      <div v-for="atualizacao in atualizacoes" :key="atualizacao.id" class="atualizacao-item">
        <div class="atualizacao-cabecalho">
          <div class="atualizacao-titulo">{{ atualizacao.titulo }}</div>
          <div class="atualizacao-data">{{ formatarData(atualizacao.data) }}</div>
        </div>
        <!-- Renderiza a descrição com suporte a formatação -->
        <div class="atualizacao-descricao" v-html="formatarDescricao(atualizacao.descricao)"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AtualizacoesSistema',
  props: {
    systemUpdates: Array,
    loading: Boolean,
    atualizacoes: Array
  },
  emits: ['voltar', 'add-update', 'preview-update', 'edit-update'],
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString("pt-BR");
    },
    formatImportance(importance) {
      return importance === 'alta' ? 'Alta' : 
             importance === 'media' ? 'Média' : 'Baixa';
    },
    formatarData(data) {
      return new Date(data).toLocaleDateString("pt-BR");
    },
    formatarDescricao(texto) {
      if (!texto) return '';
      // Converter ** para negrito
      texto = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Converter * para itálico
      texto = texto.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Converter [texto](url) para links
      texto = texto.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      // Converter quebras de linha
      texto = texto.replace(/\n/g, '<br>');
      return texto;
    }
  }
}
</script>

<style scoped>
.updates-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 2rem;
}

.updates-table table {
  width: 100%;
  border-collapse: collapse;
}

.updates-table th,
.updates-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.updates-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #1e293b;
}

.updates-table tr:last-child td {
  border-bottom: none;
}

.updates-table tr:hover {
  background-color: #f8fafc;
}

.btn-small {
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-small:first-child {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.btn-small:first-child:hover {
  background: #dbeafe;
}

.no-updates {
  background: #f9fafb;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  color: #64748b;
}

.atualizacoes-sistema {
  margin-top: 2rem;
}

.atualizacao-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  margin-bottom: 1rem;
}

.atualizacao-cabecalho {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.atualizacao-titulo {
  font-weight: bold;
  color: #1e293b;
}

.atualizacao-data {
  color: #64748b;
}

.atualizacao-descricao {
  color: #1e293b;
  line-height: 1.5;
}

/* Tema escuro */
[data-theme="dark"] .updates-table {
  background: #1e293b;
}

[data-theme="dark"] .updates-table th {
  background: #0f172a;
  color: #f8fafc;
}

[data-theme="dark"] .updates-table th,
[data-theme="dark"] .updates-table td {
  border-color: #2d3748;
}

[data-theme="dark"] .updates-table tr:hover {
  background-color: #334155;
}

[data-theme="dark"] .no-updates {
  background: #1e293b;
  color: #cbd5e1;
}

[data-theme="dark"] .btn-small {
  background: #1e293b;
  border-color: #2d3748;
  color: #e2e8f0;
}

[data-theme="dark"] .btn-small:hover {
  background: #334155;
}

[data-theme="dark"] .btn-small:first-child {
  background: #1e3a8a;
  border-color: #1e40af;
  color: #bfdbfe;
}

[data-theme="dark"] .btn-small:first-child:hover {
  background: #1e40af;
}

[data-theme="dark"] .atualizacao-item {
  background: #1e293b;
  color: #e2e8f0;
}

[data-theme="dark"] .atualizacao-titulo {
  color: #f8fafc;
}

[data-theme="dark"] .atualizacao-data {
  color: #cbd5e1;
}

[data-theme="dark"] .atualizacao-descricao {
  color: #e2e8f0;
}
</style>
