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
        :empresas="store.getEmpresas()"
        :isLoading="store.getIsLoading()"
        :loadError="store.getLoadError() || ''"
        @edit="editarEmpresa"
        @delete="prepararExclusao"
      />

      <!-- Modal de formulário -->
      <EmpresaForm
        v-if="store.getShowModal()"
        :formData="store.getFormData()"
        :isEditing="store.getIsEditing()"
        :editingId="store.getEditingId()"
        @submit="salvarEmpresa"
        @cancel="resetarFormulario"
        @update:cnpjError="cnpjError = $event"
      />

      <!-- Modal de confirmação de exclusão -->
      <EmpresaDeleteDialog
        v-if="store.getShowDeleteDialog() && store.getEmpresaToDelete()"
        :empresa="store.getEmpresaToDelete()"
        @confirm="confirmarExclusao"
        @cancel="fecharModalDelete"
      />

      <!-- Toast notifications -->
      <EmpresaToast
        v-if="store.getShowToast()"
        :message="store.getToastMessage()"
        :type="store.getToastType()"
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
    
    // Métodos wrapper para os métodos do store
    const recarregarDados = () => {
      store.fetchEmpresas()
    }
    
    const abrirModalNovo = () => {
      store.resetForm()
      store.showModal.value = true
    }
    
    const editarEmpresa = (empresa) => {
      store.editEmpresa(empresa)
    }
    
    const prepararExclusao = (empresa) => {
      store.prepararExclusao(empresa)
    }
    
    const confirmarExclusao = () => {
      store.confirmarExclusao()
    }
    
    const fecharModalDelete = () => {
      console.log('Fechando modal de exclusão via componente pai')
      store.hideDeleteDialog()
    }
    
    const salvarEmpresa = () => {
      store.salvarEmpresa()
    }
    
    const resetarFormulario = () => {
      store.resetForm()
    }
    
    // Usar o composable de conexão
    useConnectionManager(recarregarDados)
    
    onMounted(() => {
      console.log('Componente montado, carregando empresas...')
      // Reinicializar o store para garantir estado limpo
      store.initialize()
      // Carregar dados após inicialização
      setTimeout(() => {
        recarregarDados()
      }, 100)
    })
    
    return {
      store,
      isSidebarExpanded,
      cnpjError,
      handleSidebarToggle,
      recarregarDados,
      abrirModalNovo,
      editarEmpresa,
      prepararExclusao,
      confirmarExclusao,
      fecharModalDelete,
      salvarEmpresa,
      resetarFormulario
    }
  }
}
</script>

<style src="./css/EmpresasView.css"></style>