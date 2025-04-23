<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header">
        <h1>Empresas</h1>
        <div class="header-buttons">
          <button class="btn-add" @click="abrirModalNovo">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Nova Empresa
          </button>
        </div>
      </div>
      
      <!-- Tabela de empresas -->
      <EmpresaTable
        :empresas="empresas"
        :isLoading="isLoading"
        :loadError="loadError || ''"
        @edit="editarEmpresa"
        @delete="handleDelete"
      />

      <!-- Modal de formulário -->
      <EmpresaForm 
        v-if="showModalValue" 
        :formData="formDataValue" 
        :isEditing="isEditingValue"
        :editingId="editingIdValue"
        @submit="handleSubmitEmpresa"
        @cancel="hideModal"
        @update:cnpjError="handleCnpjError"
      />

      <!-- Modal de confirmação de exclusão -->
      <EmpresaDeleteDialog
        v-if="showDeleteDialogValue && empresaToDeleteValue"
        :empresa="empresaToDeleteValue"
        @confirm="confirmarExclusao"
        @cancel="fecharModalDelete"
      />

      <!-- Toast notifications -->
      <EmpresaToast
        v-if="showToastValue"
        :message="toastMessageValue"
        :type="toastTypeValue"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { useEmpresasStore } from './composables/useEmpresasStore'
import EmpresaTable from './components/EmpresaTable.vue'
import EmpresaForm from './components/EmpresaForm.vue'
import EmpresaDeleteDialog from './components/EmpresaDeleteDialog.vue'
import EmpresaToast from './components/EmpresaToast.vue'

export default {
  name: 'EmpresasView',
  components: {
    TheSidebar,
    EmpresaTable,
    EmpresaForm,
    EmpresaDeleteDialog,
    EmpresaToast
  },
  setup() {
    const isSidebarExpanded = ref(true)
    const cnpjError = ref('') 
    const store = useEmpresasStore()
    
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }
    
    // Usar o store para acessar todos os métodos e propriedades
    const {
      empresas,
      isLoading,
      loadError,
      showModal,
      formData,
      isEditing,
      editingId,
      empresaToDelete,
      showDeleteDialog,
      toastMessage,
      toastType,
      showToast,
      fetchEmpresas,
      editEmpresa,
      resetForm,
      prepararExclusao,
      confirmarExclusao,
      hideDeleteDialog,
      initialize,
      updateEmpresaDirectly
    } = store;
    
    // Computed properties para usarmos no template
    const showModalValue = computed(() => showModal.value)
    const formDataValue = computed(() => formData.value)
    const isEditingValue = computed(() => isEditing.value)
    const editingIdValue = computed(() => editingId.value)
    const cnpjErrorValue = computed(() => cnpjError.value)
    const showDeleteDialogValue = computed(() => showDeleteDialog.value)
    const empresaToDeleteValue = computed(() => empresaToDelete.value)
    const showToastValue = computed(() => showToast.value)
    const toastMessageValue = computed(() => toastMessage.value)
    const toastTypeValue = computed(() => toastType.value)
    
    // Métodos wrapper para os métodos do store
    const recarregarDados = () => {
      fetchEmpresas()
    }
    
    const abrirModalNovo = () => {
      resetForm()
      showModal.value = true
    }
    
    const editarEmpresa = (empresa) => {
      editEmpresa(empresa)
    }
    
    // Renomeado para handleDelete para evitar duplicação
    const handleDelete = (empresa) => {
      prepararExclusao(empresa)
    }
    
    const fecharModalDelete = () => {
      console.log('Fechando modal de exclusão via componente pai')
      hideDeleteDialog()
    }
    
    const hideModal = () => {
      resetForm()
    }
    
    // Função que recebe os dados do formulário e chama salvarEmpresa do store
    const handleSubmitEmpresa = (formData) => {
      console.log('[DEBUG] Recebido submit do formulário:', formData)
      store.salvarEmpresa(formData)
    }
    
    const handleCnpjError = (error) => {
      console.log('[DEBUG] CNPJ error atualizado:', error)
      cnpjError.value = error
    }
    
    // Usar o composable de conexão
    useConnectionManager(recarregarDados)
    
    onMounted(() => {
      console.log('Componente montado, carregando empresas...')
      initialize()
      
      setTimeout(() => {
        recarregarDados()
      }, 100)
    })

    return {
      // Propriedades reativas
      isSidebarExpanded,
      empresas,
      isLoading,
      loadError,
      showModalValue,
      formDataValue,
      isEditingValue,
      editingIdValue,
      cnpjErrorValue,
      showDeleteDialogValue,
      empresaToDeleteValue,
      showToastValue,
      toastMessageValue,
      toastTypeValue,
      
      // Métodos
      handleSidebarToggle,
      recarregarDados,
      abrirModalNovo,
      editarEmpresa,
      handleDelete,         // Usando o nome renomeado
      confirmarExclusao,    // Este é diretamente do store
      fecharModalDelete,
      hideModal,
      handleSubmitEmpresa,
      handleCnpjError
    }
  }
}
</script>

<style src="./css/EmpresasView.css"></style>