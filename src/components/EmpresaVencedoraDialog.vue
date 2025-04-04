<template>
  <div class="empresa-vencedora-dialog" v-if="dialogVisible">
    <div class="empresa-vencedora-dialog-overlay" @click="fechar"></div>
    <div class="empresa-vencedora-dialog-content">
      <div class="empresa-vencedora-dialog-header">
        <h3><img src="/icons/company.svg" alt="Empresa" class="header-icon" /> Empresa Vencedora</h3>
        <button class="close-btn" @click="fechar">&times;</button>
      </div>
      
      <div class="empresa-vencedora-dialog-body">
        <div class="form-group">
          <label for="nome-empresa">
            <img src="/icons/building.svg" alt="Empresa" class="input-icon" />
            Nome da Empresa
          </label>
          <input 
            id="nome-empresa" 
            type="text" 
            class="form-control" 
            v-model="formData.nomeEmpresa" 
            placeholder="Nome da empresa vencedora"
          >
        </div>
        
        <div class="form-row">
          <div class="form-group col-md-6">
            <label for="cnpj">
              <img src="/icons/document-id.svg" alt="CNPJ" class="input-icon" />
              CNPJ
            </label>
            <input 
              id="cnpj" 
              type="text" 
              class="form-control" 
              v-model="formData.cnpj" 
              placeholder="00.000.000/0000-00"
            >
          </div>
          
          <div class="form-group col-md-6">
            <label for="contato">
              <img src="/icons/user-profile.svg" alt="Contato" class="input-icon" />
              Contato
            </label>
            <input 
              id="contato" 
              type="text" 
              class="form-control" 
              v-model="formData.contato" 
              placeholder="Nome e telefone do contato"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group col-md-6">
            <label for="numero-contrato">
              <img src="/icons/file-contract.svg" alt="Contrato" class="input-icon" />
              Número do Contrato
            </label>
            <input 
              id="numero-contrato" 
              type="text" 
              class="form-control" 
              v-model="formData.numeroContrato" 
              placeholder="Nº do contrato"
            >
          </div>
          
          <div class="form-group col-md-6">
            <label for="valor-final">
              <img src="/icons/money.svg" alt="Valor" class="input-icon" />
              Valor Final
            </label>
            <div class="valor-input">
              <span class="valor-prefix">R$</span>
              <input 
                id="valor-final" 
                type="text" 
                class="form-control valor-field" 
                v-model="formData.valorFinal" 
                placeholder="0,00"
              >
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="data-assinatura">
            <img src="/icons/calendar.svg" alt="Data" class="input-icon" />
            Data de Assinatura
          </label>
          <input 
            id="data-assinatura" 
            type="date" 
            class="form-control" 
            v-model="formData.dataAssinatura"
          >
        </div>
        
        <div class="form-group">
          <label for="observacoes">
            <img src="/icons/notes.svg" alt="Observações" class="input-icon" />
            Observações
          </label>
          <textarea 
            id="observacoes" 
            class="form-control" 
            v-model="formData.observacoes" 
            rows="3" 
            placeholder="Observações adicionais sobre a empresa ou o contrato"
          ></textarea>
        </div>
      </div>
      
      <div class="empresa-vencedora-dialog-footer">
        <button class="btn-cancelar" @click="fechar">
          <img src="/icons/fechar.svg" alt="Cancelar" class="button-icon" />
          Cancelar
        </button>
        <button class="btn-salvar" @click="salvar" :disabled="loading">
          <img src="/icons/save-fill.svg" alt="Salvar" class="button-icon" />
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import emitter from '@/utils/eventBus';

export default {
  name: 'EmpresaVencedoraDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    processoId: {
      type: String,
      default: null
    },
    dadosAtuais: {
      type: [String, Object],
      default: ''
    }
  },
  setup(props, { emit }) {
    console.log('EmpresaVencedoraDialog setup iniciado', { props });
    
    // Estado local que controla a visibilidade do modal
    const dialogVisible = ref(props.show);
    const localProcessoId = ref(props.processoId);
    const localDadosAtuais = ref(props.dadosAtuais);
    
    const loading = ref(false);
    const formData = reactive({
      nomeEmpresa: '',
      cnpj: '',
      contato: '',
      numeroContrato: '',
      valorFinal: '',
      dataAssinatura: '',
      observacoes: ''
    });

    // Configuração para escutar evento global
    onMounted(() => {
      console.log('EmpresaVencedoraDialog montado', { 
        show: props.show,
        processoId: props.processoId,
        dadosAtuais: props.dadosAtuais
      });
      
      // Escutar evento global para abrir modal
      emitter.on('openEmpresaVencedoraModal', (data) => {
        console.log('✅ Evento global recebido para abrir modal', data);
        dialogVisible.value = true;
        localProcessoId.value = data.processoId;
        localDadosAtuais.value = data.dadosAtuais || '';
        
        nextTick(() => {
          preencherFormulario(data.dadosAtuais || '');
        });
      });
      
      preencherFormulario();
    });
    
    // Sincronizar props.show com estado local
    watch(() => props.show, (newValue) => {
      console.log('EmpresaVencedoraDialog props.show mudou:', newValue);
      dialogVisible.value = newValue;
      if (newValue) {
        preencherFormulario();
      }
    });
    
    watch(() => props.dadosAtuais, () => {
      console.log('EmpresaVencedoraDialog props.dadosAtuais mudou:', props.dadosAtuais);
      localDadosAtuais.value = props.dadosAtuais;
      preencherFormulario();
    });
    
    // Atualizar prop pai quando o estado local mudar
    watch(() => dialogVisible.value, (newValue) => {
      if (!newValue && props.show) {
        emit('fechar');
      }
    });

    // Preencher formulário com dados existentes (se houver)
    const preencherFormulario = (dadosExternos) => {
      const dados = dadosExternos || localDadosAtuais.value || props.dadosAtuais;
      console.log('Preenchendo formulário com dados:', dados);
      
      if (dados) {
        try {
          let dadosParsed;
          if (typeof dados === 'object') {
            dadosParsed = dados;
          } else if (dados && typeof dados === 'string') {
            dadosParsed = JSON.parse(dados);
          } else {
            dadosParsed = {};
          }
          
          console.log('Dados parsados:', dadosParsed);
          
          Object.keys(formData).forEach(key => {
            if (key in dadosParsed) {
              formData[key] = dadosParsed[key];
            }
          });
        } catch (e) {
          console.error('Erro ao parsear dados:', e);
          // Se não for um JSON válido, usar como nome da empresa
          formData.nomeEmpresa = dados;
          formData.cnpj = '';
          formData.contato = '';
          formData.numeroContrato = '';
          formData.valorFinal = '';
          formData.dataAssinatura = '';
          formData.observacoes = '';
        }
      } else {
        // Limpar formulário se não houver dados
        Object.keys(formData).forEach(key => {
          formData[key] = '';
        });
      }
    };

    // Fechar o diálogo
    const fechar = () => {
      console.log('Fechando modal EmpresaVencedoraDialog');
      dialogVisible.value = false;
      emit('fechar');
    };

    // Salvar os dados
    const salvar = () => {
      console.log('Salvando dados da empresa vencedora...');
      loading.value = true;
      
      // Converter para JSON string
      const empresaVencedoraData = JSON.stringify({
        nomeEmpresa: formData.nomeEmpresa,
        cnpj: formData.cnpj,
        contato: formData.contato,
        numeroContrato: formData.numeroContrato,
        valorFinal: formData.valorFinal,
        dataAssinatura: formData.dataAssinatura,
        observacoes: formData.observacoes
      });
      
      console.log('Dados a serem salvos:', {
        processoId: localProcessoId.value || props.processoId,
        empresaVencedora: empresaVencedoraData
      });
      
      emit('salvar', {
        processoId: localProcessoId.value || props.processoId,
        empresaVencedora: empresaVencedoraData
      });
      
      loading.value = false;
      fechar();
    };

    return {
      dialogVisible,
      loading,
      formData,
      fechar,
      salvar
    };
  }
};
</script>

<style>
.empresa-vencedora-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.empresa-vencedora-dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.empresa-vencedora-dialog-content {
  position: relative;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 550px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1051;
  border: 1px solid #e5e7eb;
}

.empresa-vencedora-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.empresa-vencedora-dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.header-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #e2e8f0;
}

.empresa-vencedora-dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  margin: 0 -8px 16px;
}

.col-md-6 {
  flex: 0 0 50%;
  padding: 0 8px;
}

label {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-weight: 500;
  color: #334155;
  font-size: 0.875rem;
}

.input-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  opacity: 0.7;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.925rem;
  transition: all 0.2s ease;
  background-color: #ffffff;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.valor-input {
  position: relative;
  display: flex;
  align-items: center;
}

.valor-prefix {
  position: absolute;
  left: 12px;
  font-weight: 500;
  color: #475569;
}

.valor-field {
  padding-left: 32px;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.empresa-vencedora-dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  gap: 12px;
  background-color: #f8fafc;
  border-radius: 0 0 12px 12px;
}

.btn-cancelar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-cancelar:hover {
  background-color: #e2e8f0;
}

.btn-salvar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  background-color: #3b82f6;
  border: 1px solid #2563eb;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-salvar:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.btn-salvar:active:not(:disabled) {
  transform: translateY(0);
}

.btn-salvar:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.button-icon {
  width: 16px;
  height: 16px;
}
</style>