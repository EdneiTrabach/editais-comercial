<!-- filepath: d:\PROJETOS-EL\editais-comercial\src\components\SistemasImplantacaoSelector.vue -->
<template>
  <div class="sistemas-implantacao-selector">
    <div v-if="loading" class="loading">
      Carregando sistemas...
    </div>
    
    <div v-else>
      <h3>Sistemas a serem implantados</h3>
      
      <div class="sistemas-list">
        <div v-if="sistemasDisponiveis.length === 0" class="no-sistemas">
          Nenhum sistema disponível. Selecione sistemas ativos primeiro.
        </div>
        
        <div v-else class="sistemas-checkboxes">
          <div 
            v-for="sistema in sistemasDisponiveis" 
            :key="sistema.id"
            class="sistema-checkbox-item"
          >
            <label :class="{'sistema-selected': isSistemaSelecionado(sistema.id)}">
              <input 
                type="checkbox"
                :checked="isSistemaSelecionado(sistema.id)"
                @change="toggleSistema(sistema.id)"
              />
              {{ sistema.nome }}
            </label>
          </div>
        </div>
      </div>
      
      <div class="informacoes-adicionais">
        <h4>Informações adicionais</h4>
        <textarea 
          v-model="informacoesAdicionais"
          placeholder="Insira informações adicionais sobre a implantação..."
          rows="3"
        ></textarea>
      </div>
      
      <div class="actions">
        <button @click="salvar" class="btn-save">Salvar</button>
      </div>
    </div>
  </div>
</template>

<style>
.sistemas-implantacao-selector {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  width: 100%;
}

.sistemas-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
}

.sistemas-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.sistema-checkbox-item {
  padding: 6px;
}

.sistema-checkbox-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
}

.sistema-checkbox-item label:hover {
  background-color: #f7fafc;
}

.sistema-selected {
  background-color: #ebf8ff;
  color: #2b6cb0;
}

.informacoes-adicionais textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
  font-family: inherit;
  resize: vertical;
}

.actions {
  margin-top: -10px;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save:hover {
  background-color: #3182ce;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #718096;
}

.no-sistemas {
  padding: 20px;
  text-align: center;
  color: #718096;
}
</style>