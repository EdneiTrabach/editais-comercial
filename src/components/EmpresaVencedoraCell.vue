<template>
  <div class="empresa-vencedora-cell" @click="editar">
    <div v-if="empresaData" class="empresa-vencedora-info">
      <div class="empresa-vencedora-nome">{{ empresaData.nomeEmpresa }}</div>
      
      <div v-if="empresaData.cnpj" class="empresa-vencedora-item">
        <span class="empresa-vencedora-label">CNPJ:</span>
        <span class="empresa-vencedora-value">{{ empresaData.cnpj }}</span>
      </div>
      
      <div v-if="empresaData.numeroContrato" class="empresa-vencedora-item">
        <span class="empresa-vencedora-label">Contrato:</span>
        <span class="empresa-vencedora-value">{{ empresaData.numeroContrato }}</span>
      </div>
      
      <div v-if="empresaData.valorFinal" class="empresa-vencedora-item">
        <span class="empresa-vencedora-label">Valor:</span>
        <span class="empresa-vencedora-value">{{ empresaData.valorFinal }}</span>
      </div>
      
      <div v-if="empresaData.dataAssinatura" class="empresa-vencedora-item">
        <span class="empresa-vencedora-label">Assinado em:</span>
        <span class="empresa-vencedora-value">{{ formatDate(empresaData.dataAssinatura) }}</span>
      </div>
      
      <button @click.stop="editar" class="empresa-vencedora-edit-btn">
        <img src="@/assets/images/icons/edit.svg" alt="Editar" />
      </button>
    </div>
    
    <div v-else class="empty-empresa-vencedora">
      <div class="add-empresa-vencedora">+</div>
      <div>Adicionar empresa vencedora</div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'EmpresaVencedoraCell',
  props: {
    valor: {
      type: [String, Object],
      default: null
    },
    processoId: {
      type: String,
      required: true
    }
  },
  
  setup(props, { emit }) {
    const empresaData = computed(() => {
      if (!props.valor) return null;
      
      try {
        return typeof props.valor === 'object' ? props.valor : JSON.parse(props.valor);
      } catch (e) {
        // Se não for JSON válido, retornar objeto com apenas o nome
        return { nomeEmpresa: props.valor };
      }
    });
    
    const editar = () => {
      console.log('Emitindo evento editar para processo ID:', props.processoId);
      emit('editar', {
        processoId: props.processoId,
        dadosAtuais: props.valor
      });
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    };
    
    return {
      empresaData,
      editar,
      formatDate
    };
  }
};
</script>

<style>
.empresa-vencedora-cell {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}
.empresa-vencedora-nome {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  margin-bottom: 4px;
}

.empresa-vencedora-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.empresa-vencedora-label {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 500;
  min-width: 60px;
}

.empresa-vencedora-value {
  font-size: 0.8rem;
  color: #1e293b;
}

.empresa-vencedora-edit-btn {
  position: absolute;
  top: 5px;
  right: 2px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.empresa-vencedora-edit-btn:hover {
  opacity: 1;
}

.empresa-vencedora-edit-btn img {
  width: 14px;
  height: 14px;
}

.empty-empresa-vencedora {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  padding: 8px;
  transition: all 0.2s;
  margin: 4px;
}

.empty-empresa-vencedora:hover {
  background-color: #f8fafc;
  color: #475569;
}

.add-empresa-vencedora {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 2px;
}
</style>