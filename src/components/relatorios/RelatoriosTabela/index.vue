<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\components\relatorios\RelatoriosTabela\index.vue -->
<template>
  <div class="table-container">
    <div v-if="loading" class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i> Carregando dados...
    </div>

    <div v-else-if="processos.length === 0" class="no-data">
      <i class="fas fa-info-circle"></i>
      Nenhum processo encontrado com os filtros selecionados.
    </div>

    <table v-else class="table table-striped">
      <thead>
        <tr>
          <th>Número do Processo</th>
          <th>Órgão</th>
          <th>Data Pregão</th>
          <th>Status</th>
          <th>Valor Estimado</th>
          <th>Responsável</th>
          <th>Sistemas</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="processo in processos" :key="processo.id" :class="{
          'row-ganhamos': processo.status === 'ganhamos',
          'row-perdemos': processo.status === 'perdemos'
        }">
          <td>{{ processo.numero_processo }}</td>
          <td>{{ processo.orgao }}</td>
          <td>{{ formatarData(processo.data_pregao) }}</td>
          <td>
            <span class="status-badge" :class="`status-${processo.status?.replaceAll('_', '-')}`">
              {{ formatarStatus(processo.status) }}
            </span>
          </td>
          <td>{{ formatarMoeda(processo.valor_estimado) }}</td>
          <td>{{ getResponsavelNome(processo.responsavel_id) }}</td>
          <td>{{ getSistemasNomes(processo.sistemas_ativos) }}</td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm btn-info" @click="$emit('ver-detalhes', processo)">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary" @click="$emit('ir-para-processo', processo)">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script src="./script.js"></script>
<style scoped src="./style.css"></style>