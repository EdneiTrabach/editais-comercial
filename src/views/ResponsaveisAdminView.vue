<template>
  <div class="responsaveis-layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <!-- Modal de acesso negado -->
    <div v-if="showAccessDeniedModal" class="dialog-overlay">
      <div class="confirm-dialog">
        <h2 class="dialog-title">Acesso Negado</h2>
        <p class="dialog-message">
          Você não tem permissão para acessar esta página. 
          É necessário ter privilégios de administrador.
        </p>
        <div class="confirm-actions">
          <button @click="redirectToHome" class="btn-confirm">
            Voltar para Home
          </button>
        </div>
      </div>
    </div>
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <!-- Header -->
      <div class="header">
        <h1 class="title">Gestão de Responsáveis</h1>
        <div class="actions">
          <button @click="openAddModal" class="btn-add">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon">
            Adicionar Responsável
          </button>
        </div>
      </div>

      <!-- Tabela de Responsáveis -->
      <ResponsaveisTable
        :responsaveis="responsaveis"
        :loading="loading"
        :editing-names="editingNames"
        :editing-depts="editingDepts"
        :editing-data="editingData"
        :is-responsavel-em-uso="isResponsavelEmUso"
        :format-status="formatStatus"
        @edit="openEditModal"
        @toggle-status="confirmToggleStatus"
        @delete="confirmDelete"
        @update-name="handleNameUpdate"
        @update-dept="handleDeptUpdate"
        @start-editing-name="startEditingName"
        @start-editing-dept="startEditingDept"
      />
    </div>
    
    <!-- Modal Adicionar/Editar Responsável -->
    <ResponsavelForm
      :show="showFormModal"
      :form-data="formData"
      :is-editing="isEditing"
      :loading="operationLoading"
      @close="closeModal"
      @save="handleSaveResponsavel"
    />
    
    <!-- Modal de Confirmação -->
    <div v-if="showConfirmDialog" class="dialog-overlay">
      <div class="confirm-dialog">
        <h2 class="dialog-title">{{ dialogConfig.title }}</h2>
        <p class="dialog-message">{{ dialogConfig.message }}</p>
        <p v-if="dialogConfig.warning" class="warning-text">
          {{ dialogConfig.warning }}
        </p>
        
        <div class="confirm-actions">
          <button 
            class="btn-secondary" 
            @click="showConfirmDialog = false"
          >
            Cancelar
          </button>
          <button 
            :class="dialogConfig.confirmClass === 'danger' ? 'btn-danger' : 'btn-confirm'"
            @click="handleConfirmAction"
          >
            {{ dialogConfig.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast de feedback -->
    <div 
      v-if="showToast" 
      class="toast-container"
    >
      <div :class="['toast', `toast-${toastConfig.type}`]">
        {{ toastConfig.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';

// Componentes
import TheSidebar from '@/components/TheSidebar.vue';
import ResponsaveisTable from '@/components/responsaveis/ResponsaveisTable.vue';
import ResponsavelForm from '@/components/responsaveis/ResponsavelForm.vue';

// Composables
import { useResponsaveisStore } from '@/composables/responsaveis/useResponsaveisStore';
import { useResponsavelForm } from '@/composables/responsaveis/useResponsavelForm';
import { useInlineEditing } from '@/composables/responsaveis/useInlineEditing';
import { useConnectionManager } from '@/composables/useConnectionManager';

export default {
  name: 'ResponsaveisAdminView',
  components: {
    TheSidebar,
    ResponsaveisTable,
    ResponsavelForm
  },
  setup() {
    const router = useRouter();
    const isSidebarExpanded = ref(true);
    const showAccessDeniedModal = ref(false);
    const showFormModal = ref(false);
    const showConfirmDialog = ref(false);
    const dialogConfig = ref({});
    const showToast = ref(false);
    const toastConfig = ref({
      message: '',
      type: 'success'
    });
    const operationLoading = ref(false);
    const pendingAction = ref(null);
    
    // Utiliza os composables
    const { 
      responsaveis,
      loading, 
      loadResponsaveis,
      isResponsavelEmUso,
      toggleResponsavelStatus,
      deleteResponsavel,
      formatStatus,
      setupRealtimeSubscription
    } = useResponsaveisStore();
    
    const { 
      formData,
      isEditing,
      setupForEditing,
      resetForm,
      saveResponsavel
    } = useResponsavelForm();
    
    const {
      editingNames,
      editingDepts,
      editingData,
      startEditingName,
      startEditingDept,
      updateName,
      updateDepartment
    } = useInlineEditing();
    
    // Verificar permissão de admin
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return false;
        }
        
        // Buscar perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        // Verificar se é admin
        const isAdmin = profile?.role === 'admin';
        
        if (!isAdmin) {
          showAccessDeniedModal.value = true;
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        return false;
      }
    };
    
    // Lidar com toggle do sidebar
    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded;
    };
    
    // Redirecionar para home
    const redirectToHome = () => {
      router.push('/processos');
    };
    
    // Funções para manipular modal de formulário
    const openAddModal = () => {
      resetForm();
      showFormModal.value = true;
    };
    
    const openEditModal = (responsavel) => {
      setupForEditing(responsavel);
      showFormModal.value = true;
    };
    
    const closeModal = () => {
      showFormModal.value = false;
      resetForm();
    };
    
    // Função para mostrar toast
    const showToastMessage = (message, type = 'success', duration = 3000) => {
      toastConfig.value = {
        message,
        type
      };
      showToast.value = true;
      
      setTimeout(() => {
        showToast.value = false;
      }, duration);
    };
    
    // Salvar responsável
    const handleSaveResponsavel = async () => {
      operationLoading.value = true;
      
      try {
        const result = await saveResponsavel();
        
        if (result.success) {
          showToastMessage(
            isEditing.value 
              ? 'Responsável atualizado com sucesso!' 
              : 'Responsável adicionado com sucesso!'
          );
          closeModal();
          await loadResponsaveis();
        } else {
          showToastMessage(result.errors[0], 'error');
        }
      } finally {
        operationLoading.value = false;
      }
    };
    
    // Confirmar toggle de status
    const confirmToggleStatus = (responsavel) => {
      const isActivating = responsavel.status !== 'ACTIVE';
      
      dialogConfig.value = {
        title: `Confirmar ${isActivating ? 'Ativação' : 'Inativação'}`,
        message: `Deseja realmente ${isActivating ? 'ativar' : 'inativar'} o responsável ${responsavel.nome}?`,
        confirmText: isActivating ? 'Ativar' : 'Inativar'
      };
      
      pendingAction.value = () => handleToggleStatus(responsavel);
      showConfirmDialog.value = true;
    };
    
    // Executar toggle de status
    const handleToggleStatus = async (responsavel) => {
      operationLoading.value = true;
      
      try {
        const result = await toggleResponsavelStatus(responsavel);
        
        if (result.success) {
          showToastMessage(
            `Responsável ${result.newStatus === 'ACTIVE' ? 'ativado' : 'inativado'} com sucesso!`
          );
          await loadResponsaveis();
        } else {
          showToastMessage('Erro ao alterar status do responsável', 'error');
        }
      } finally {
        operationLoading.value = false;
      }
    };
    
    // Confirmar exclusão
    const confirmDelete = (responsavel) => {
      dialogConfig.value = {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o responsável ${responsavel.nome}?`,
        warning: 'Esta ação não poderá ser desfeita!',
        confirmText: 'Excluir',
        confirmClass: 'danger'
      };
      
      pendingAction.value = () => handleDelete(responsavel);
      showConfirmDialog.value = true;
    };
    
    // Executar exclusão
    const handleDelete = async (responsavel) => {
      operationLoading.value = true;
      
      try {
        const result = await deleteResponsavel(responsavel);
        
        if (result.success) {
          showToastMessage('Responsável excluído com sucesso!');
          await loadResponsaveis();
        } else {
          if (result.type === 'IN_USE') {
            showToastMessage('Este responsável está vinculado a processos e não pode ser excluído.', 'warning');
          } else {
            showToastMessage('Erro ao excluir responsável', 'error');
          }
        }
      } finally {
        operationLoading.value = false;
      }
    };
    
    // Executar ação pendente
    const handleConfirmAction = () => {
      showConfirmDialog.value = false;
      
      if (pendingAction.value) {
        pendingAction.value();
        pendingAction.value = null;
      }
    };
    
    // Atualizar nome (edição inline)
    const handleNameUpdate = async (payload) => {
      operationLoading.value = true;
      
      try {
        const result = await updateName(payload.responsavel, payload.newName);
        
        if (result.success) {
          showToastMessage('Nome atualizado com sucesso!');
          await loadResponsaveis();
        } else if (!result.noChange) {
          showToastMessage('Erro ao atualizar nome', 'error');
        }
      } finally {
        operationLoading.value = false;
      }
    };
    
    // Atualizar departamento (edição inline)
    const handleDeptUpdate = async (payload) => {
      operationLoading.value = true;
      
      try {
        const result = await updateDepartment(payload.responsavel, payload.newDept);
        
        if (result.success) {
          showToastMessage('Departamento atualizado com sucesso!');
          await loadResponsaveis();
        } else if (!result.noChange) {
          showToastMessage('Erro ao atualizar departamento', 'error');
        }
      } finally {
        operationLoading.value = false;
      }
    };
    
    // Usar o composable para gerenciar reconexões
    useConnectionManager(() => loadResponsaveis());
    
    // Lifecycle hooks
    onMounted(async () => {
      const hasAccess = await checkAdminAccess();
      if (hasAccess) {
        await loadResponsaveis();
        
        // Configurar realtime para atualizações de outros usuários
        const unsubscribe = setupRealtimeSubscription();
        
        onUnmounted(() => {
          unsubscribe();
        });
      }
    });
    
    return {
      // Estado
      responsaveis,
      loading,
      operationLoading,
      isSidebarExpanded,
      showFormModal,
      showConfirmDialog,
      dialogConfig,
      showToast,
      toastConfig,
      showAccessDeniedModal,
      
      // Dados de formulário/edição
      formData,
      isEditing,
      editingNames,
      editingDepts,
      editingData,
      
      // Funções
      handleSidebarToggle,
      redirectToHome,
      formatStatus,
      isResponsavelEmUso,
      openAddModal,
      openEditModal,
      closeModal,
      handleSaveResponsavel,
      confirmToggleStatus,
      confirmDelete,
      handleConfirmAction,
      handleNameUpdate,
      handleDeptUpdate,
      startEditingName,
      startEditingDept
    };
  }
};
</script>

<style src="@/assets/styles/components/responsaveis/layout.css" scoped></style>