<template>
  <div class="planilha-container">
    <div class="header-planilha">
      <h2>Readequação da Proposta</h2>
      <button @click="voltarPlanilha" class="btn-voltar">
        <i class="fas fa-arrow-left"></i> 
        Voltar
      </button>
    </div>

    <div class="ajuste-container">
      <div class="campo-ajuste">
        <label>Percentual de Ajuste (%)</label>
        <div class="input-percentual-container">
          <input 
            type="text" 
            v-model="percentualAjuste"
            placeholder="Ex: -9,8 ou +7,6"
            class="input-percentual"
            @input="handlePercentualChange"
          >
          <span class="percentual-hint">Use - para desconto ou + para aumento</span>
        </div>
      </div>

      <div class="info-valores">
        <div class="valor-info">
          <span>Valor Original:</span>
          <strong>{{ formatarMoeda(totalOriginal) }}</strong>
        </div>
        <div class="valor-info">
          <span>Novo Valor:</span>
          <strong class="valor-readequado">{{ formatarMoeda(totalReadequado) }}</strong>
        </div>
        <div class="valor-info" v-if="valorEstimado">
          <span>Valor Estimado:</span>
          <strong>{{ formatarMoeda(valorEstimado) }}</strong>
        </div>
      </div>
    </div>

    <div class="table-container resizable">
      <table class="planilha-valores">
        <thead>
          <tr>
            <th>Item</th>
            <th>Descrição</th>
            <th class="hidden">Categoria</th>
            <th>Marca/Fabricante</th>
            <th>Quantidade</th>
            <th>Valor Original</th>
            <th>Valor Readequado</th>
            <th>Total Readequado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itensReadequados" :key="item.id">
            <td>{{ item.nome }}</td>
            <td>{{ item.descricao }}</td>
            <td class="hidden">{{ item.categoria }}</td>
            <td>{{ item.marca }}</td>
            <td>{{ item.quantidade }}</td>
            <td>{{ formatarMoeda(item.valorUnitarioOriginal) }}</td>
            <td class="valor-readequado">{{ formatarMoeda(item.valorUnitario) }}</td>
            <td class="valor-readequado">{{ formatarMoeda(item.total) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="total-label">Total Geral:</td>
            <td>{{ formatarMoeda(totalOriginal) }}</td>
            <td colspan="2" class="valor-readequado">{{ formatarMoeda(totalReadequado) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="acoes-planilha">
      <button @click="aplicarReadequacao" class="btn-aplicar" :disabled="!percentualDesconto">
        <i class="fas fa-check"></i> 
        Aplicar Readequação
      </button>
      <button @click="exportarReadequacao" class="btn-exportar">
        <i class="fas fa-file-excel"></i> 
        Exportar Readequação
      </button>
    </div>
  </div>
</template>

<script src="./PlanilhaValoresReadequada.js"></script>
<style src="./PlanilhaValoresReadequada.css" scoped></style>