<template>
  <div class="header-section">
    <h1>Análise de Sistemas</h1>
    <div class="header-actions">
      <div class="acoes-principais" v-if="step === 2">
        <button 
          @click="$emit('salvar-analises')" 
          class="btn-salvar"
          :disabled="!temAlteracoesPendentes || loading"
        >
          <i class="fas fa-save"></i>
          Salvar Análises
        </button>
        
        <div class="dropdown-exportar">
          <button class="btn-exportar">
            <i class="fas fa-file-export"></i>
            Exportar
          </button>
          <div class="dropdown-content">
            <!-- Opções de exportação para relatório de dados -->
            <button @click="$emit('exportar-excel', 'dados')">
              <i class="fas fa-file-excel"></i> Excel (Relatório)
            </button>
            <button @click="$emit('exportar-pdf', 'dados')">
              <i class="fas fa-file-pdf"></i> PDF (Relatório)
            </button>
            
            <!-- Submenu para Dashboard com opções de visualização e exportação -->
            <div class="dropdown-item with-submenu">
              <button>
                <i class="fas fa-chart-bar"></i> Dashboard
              </button>
              <div class="submenu">
                <!-- Opções de visualização de dashboards -->
                <button @click="$emit('abrir-dashboard', 'bar')">
                  <i class="fas fa-chart-bar"></i> Gráfico de Barras
                </button>
                <button @click="$emit('abrir-dashboard', 'pie')">
                  <i class="fas fa-chart-pie"></i> Gráfico de Pizza
                </button>
                <button @click="$emit('abrir-dashboard', 'line')">
                  <i class="fas fa-chart-line"></i> Gráfico de Linha
                </button>
                <div class="separador"></div>
                
                <!-- Opção para abrir dashboard completo -->
                <button @click="$emit('abrir-dashboard', 'pagina')">
                  <i class="fas fa-external-link-alt"></i> Dashboard Completo
                </button>
                <div class="separador"></div>
                
                <!-- Opções de exportação específicas do Dashboard -->
                <div class="exportar-dashboard-cabecalho">
                  Exportar Dashboard:
                </div>
                <button @click="$emit('exportar-dashboard', 'excel')">
                  <i class="fas fa-file-excel"></i> Dashboard para Excel
                </button>
                <button @click="$emit('exportar-dashboard', 'pdf')">
                  <i class="fas fa-file-pdf"></i> Dashboard para PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="navigation-actions">
        <button 
          v-if="step > 0" 
          @click="$emit('voltar')" 
          class="btn-voltar"
        >
          Voltar
        </button>
        <button 
          v-if="step < 2" 
          @click="$emit('avancar')" 
          class="btn-avancar"
          :disabled="!podeAvancar"
        >
          Avançar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnaliseHeader',
  props: {
    step: {
      type: Number,
      required: true
    },
    temAlteracoesPendentes: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    podeAvancar: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'salvar-analises', 
    'exportar-excel', 
    'exportar-pdf', 
    'abrir-dashboard',
    'exportar-dashboard',
    'voltar', 
    'avancar'
  ]
}
</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.header-section h1 {
  font-size: 1.8rem;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.acoes-principais {
  display: flex;
  gap: 1rem;
}

.navigation-actions {
  display: flex;
  gap: 1rem;
}

.btn-voltar,
.btn-avancar,
.btn-salvar,
.btn-exportar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-voltar {
  background: #f1f5f9;
  color: #475569;
  border: none;
}

.btn-avancar {
  background: #2563eb;
  color: white;
  border: none;
}

.btn-salvar {
  background: #2563eb;
  color: white;
  border: none;
}

.btn-exportar {
  background: #059669;
  color: white;
  border: none;
}

/* Hover states */
.btn-voltar:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.btn-avancar:hover:not(:disabled),
.btn-salvar:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-exportar:hover {
  background: #047857;
  transform: translateY(-1px);
}

/* Estado desabilitado */
.btn-avancar:disabled,
.btn-salvar:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.dropdown-exportar {
  position: relative;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: none;
  z-index: 100;
  min-width: 180px;
}

.dropdown-exportar:hover .dropdown-content {
  display: block;
}

.dropdown-content button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  white-space: nowrap;
  text-align: left;
}

.dropdown-content button:hover {
  background: #f8fafc;
}

/* Estilos para submenu */
.dropdown-item {
  position: relative;
}

.with-submenu {
  position: relative;
}

.with-submenu > button {
  position: relative;
}

.with-submenu > button::after {
  content: "›";
  position: absolute;
  right: 10px;
  font-size: 1.2rem;
}

.submenu {
  position: absolute;
  top: 0;
  left: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: none;
  min-width: 180px;
  z-index: 101;
}

.with-submenu:hover .submenu {
  display: block;
}

.separador {
  height: 1px;
  background-color: #e2e8f0;
  margin: 5px 10px;
}

.exportar-dashboard-cabecalho {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background-color: #f1f5f9;
  border-radius: 4px;
  margin: 0 0.5rem;
}
</style>
