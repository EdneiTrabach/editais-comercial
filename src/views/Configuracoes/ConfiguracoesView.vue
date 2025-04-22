<template>
  <div class="layout-cfg-usuarios">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />
    
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-cfg-usuarios">
        <h1 class="title-cfg-usuarios">Configurações do Sistema</h1>
      </div>

      <!-- Componente da tela inicial com cards de navegação -->
      <home-configuracoes
        v-if="activeTab === 'home'"
        @navigate="activeTab = $event"
        @open-notification="openSendNotificationModal"
        :router="router"
      />

      <!-- Componente de administração de usuários -->
      <admin-usuarios
        v-if="activeTab === 'users'"
        :users="users"
        :currentUser="currentUser"
        :loading="loading"
        @voltar="activeTab = 'home'"
        @add-user="showAddUserModal = true"
        @update-name="handleNameUpdate"
        @update-email="handleEmailUpdate"
        @change-role="handleRoleChange"
        @toggle-status="toggleUserStatus"
        @reset-password="resetPassword"
        @delete-user="deleteUser"
      />

      <!-- Componente de atualizações do sistema -->
      <atualizacoes-sistema
        v-if="activeTab === 'updates'"
        :systemUpdates="systemUpdates"
        :loading="loading"
        @voltar="activeTab = 'home'"
        @add-update="showNewUpdateForm = true"
        @preview-update="previewUpdate"
        @edit-update="editUpdate"
      />
    </div>

    <!-- Componentes de modal -->
    <add-user-modal
      v-if="showAddUserModal"
      :newUser="newUser"
      :loading="loading"
      @close="showAddUserModal = false"
      @add-user="handleAddUser"
    />

    <dialog-confirmacao
      v-if="showConfirmDialog"
      :config="dialogConfig"
      @close="hideConfirmDialog"
    />

    <access-denied-modal
      v-if="showAccessDeniedModal"
      :currentUserEmail="currentUserEmail"
      @redirect="redirectToHome"
    />

    <enviar-notificacao
      v-if="showSendNotificationModal"
      :notificationForm="notificationForm"
      :selectedUserIds="selectedUserIds"
      :users="users"
      :loading="loading"
      @close="showSendNotificationModal = false"
      @send="sendNotification"
      @toggle-all="toggleSelectAllUsers"
      @toggle-user="toggleSelectUser"
    />

    <system-update-modal 
      v-if="previewingUpdate"
      :show="!!previewingUpdate"
      :updates="[previewingUpdate]"
      @close="previewingUpdate = null"
      @mark-read="() => previewingUpdate = null"
    />

    <update-form-modal
      v-if="showNewUpdateForm"
      :updateForm="updateForm"
      :editingUpdate="editingUpdate"
      :loading="loading"
      @close="showNewUpdateForm = false"
      @save="saveUpdate"
    />

    <!-- Toast de feedback -->
    <toast-feedback
      v-if="showToast"
      :config="toastConfig"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import TheSidebar from "@/components/TheSidebar.vue";
import SystemUpdateModal from "@/components/SystemUpdateModal.vue";

// Importar componentes internos
import HomeConfiguracoes from '@/components/configuracoes/HomeConfiguracoes.vue';
import AdminUsuarios from '@/components/configuracoes/AdminUsuarios.vue';
import AtualizacoesSistema from '@/components/configuracoes/AtualizacoesSistema.vue';
import AccessDeniedModal from '@/components/configuracoes/AccessDeniedModal.vue';
import ToastFeedback from '@/components/configuracoes/ToastFeedback.vue';

// Importar componentes locais
import AddUserModal from './components/AddUserModal.vue';
import DialogConfirmacao from './components/DialogConfirmacao.vue';
import EnviarNotificacao from './components/EnviarNotificacao.vue';
import UpdateFormModal from './components/UpdateFormModal.vue';

// Importar serviços
import { useConnectionManager } from "@/composables/useConnectionManager";
import { userService } from './services/userService';
import { notificationService } from './services/notificationService';
import { updateService } from './services/updateService';

// Importar funções auxiliares
import { 
  handleNameUpdate, 
  handleAddUser, 
  handleEmailUpdate,
  handleRoleChange,
  toggleUserStatus,
  deleteUser,
  resetPassword,
  checkAdminAccess,
  debugAccess
} from './functions/userManagement';

import {
  openSendNotificationModal,
  toggleSelectAllUsers,
  toggleSelectUser,
  sendNotification
} from './functions/notifications';

import {
  loadSystemUpdates,
  saveUpdate,
  editUpdate,
  previewUpdate
} from './functions/systemUpdates';

import {
  formatDate,
  formatStatus,
  formatUserDisplay
} from './functions/formatHelpers';

import {
  showToastMessage,
  hideConfirmDialog,
  redirectToHome,
  handleSidebarToggle,
  handleStorage
} from './functions/uiHelpers';

export default {
  components: {
    TheSidebar,
    SystemUpdateModal,
    HomeConfiguracoes,
    AdminUsuarios,
    AtualizacoesSistema,
    AddUserModal,
    DialogConfirmacao,
    AccessDeniedModal,
    EnviarNotificacao,
    UpdateFormModal,
    ToastFeedback
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const users = ref([]);
    const currentUser = ref(null);
    const isSidebarExpanded = ref(true);
    const showAddUserModal = ref(false);
    const showConfirmDialog = ref(false);
    const showAccessDeniedModal = ref(false);
    const dialogConfig = ref({});
    const previousRole = ref(null);
    const showToast = ref(false);
    const toastConfig = ref({
      message: "",
      type: "success",
    });
    const newUser = ref({
      email: "",
      password: "",
      nome: "",
      role: "user",
    });
    const currentUserEmail = ref("");
    const showSendNotificationModal = ref(false);
    const selectedUserIds = ref([]);
    const notificationForm = ref({
      title: "",
      message: "",
      tipo: "usuario",
      nivel: "medio",
      processo_id: null,
    });
    const activeTab = ref("home");
    const systemUpdates = ref([]);
    const showNewUpdateForm = ref(false);
    const previewingUpdate = ref(null);
    const editingUpdate = ref(null);
    const updateForm = ref({
      title: "",
      description: "",
      version: "",
      importance: "media",
      release_date: new Date().toISOString().split("T")[0],
    });
    const isAdmin = ref(true);

    // Função para carregar dados
    const loadData = async () => {
      try {
        users.value = await userService.loadUsers();
      } catch (error) {
        console.error("Erro carregando dados:", error);
      }
    };

    // Usar Connection Manager para recarregar dados
    useConnectionManager(loadData);

    // Métodos de ciclo de vida
    onMounted(async () => {
      try {
        const savedState = localStorage.getItem("sidebarState");
        if (savedState !== null) {
          isSidebarExpanded.value = savedState === "true";
        }

        window.addEventListener("storage", (event) => 
          handleStorage(event, isSidebarExpanded));

        const isAdminUser = await debugAccess();
        console.log("Usuário é admin?", isAdminUser);

        if (!isAdminUser) {
          showAccessDeniedModal.value = true;
          return;
        }

        const hasAccess = await checkAdminAccess(
          currentUserEmail, 
          isAdmin, 
          showAccessDeniedModal
        );
        console.log("Tem acesso?", hasAccess);

        if (!hasAccess) {
          console.log("Sem acesso, retornando...");
          return;
        }

        const user = await userService.getCurrentUser();
        currentUser.value = user;
        await loadData();
      } catch (error) {
        console.error("Erro no onMounted:", error);
        showToastMessage(toastConfig, showToast, "Erro ao carregar página", "error");
      }

      // Configurar listener de atualizações de usuários
      userService.setupUserListener(loadData);

      // Carregar atualizações do sistema
      await updateService.loadSystemUpdates(systemUpdates);
    });

    onUnmounted(() => {
      try {
        window.removeEventListener("storage", handleStorage);
        userService.removeUserListener();
      } catch (error) {
        console.error("Erro ao desmontar componente:", error);
      }
    });

    watch(isSidebarExpanded, (newValue) => {
      console.log("isSidebarExpanded mudou para:", newValue);
    });

    // Retornar refs e métodos
    return {
      // Estado
      loading,
      users,
      currentUser,
      isSidebarExpanded,
      showAddUserModal,
      showConfirmDialog,
      dialogConfig,
      newUser,
      showToast,
      toastConfig,
      showAccessDeniedModal,
      currentUserEmail,
      showSendNotificationModal,
      selectedUserIds,
      notificationForm,
      isAdmin,
      activeTab,
      systemUpdates,
      showNewUpdateForm,
      previewingUpdate,
      editingUpdate,
      updateForm,
      router,
      
      // Métodos de gerenciamento de usuários
      handleNameUpdate: (user, newName) => 
        handleNameUpdate(user, newName, toastConfig, showToast),
      handleAddUser: () => 
        handleAddUser(newUser, loading, showAddUserModal, toastConfig, showToast, loadData),
      handleEmailUpdate: (user, newEmail) => 
        handleEmailUpdate(user, newEmail, toastConfig, showToast, loadData),
      handleRoleChange: (user, newRole) => 
        handleRoleChange(user, newRole, previousRole, dialogConfig, showConfirmDialog, toastConfig, showToast, loadData),
      toggleUserStatus: (user) => 
        toggleUserStatus(user, dialogConfig, showConfirmDialog, toastConfig, showToast),
      deleteUser: (user) => 
        deleteUser(user, currentUser, dialogConfig, showConfirmDialog, toastConfig, showToast, loadData),
      resetPassword: (user) => 
        resetPassword(user, dialogConfig, showConfirmDialog, toastConfig, showToast),
      
      // Métodos de notificação
      openSendNotificationModal: () => 
        openSendNotificationModal(selectedUserIds, notificationForm, showSendNotificationModal),
      toggleSelectAllUsers: (event) => 
        toggleSelectAllUsers(event, users, selectedUserIds),
      toggleSelectUser: (userId) => 
        toggleSelectUser(userId, selectedUserIds),
      sendNotification: () => 
        sendNotification(selectedUserIds, notificationForm, loading, showSendNotificationModal, toastConfig, showToast),
      
      // Métodos de atualizações do sistema
      loadSystemUpdates: () => 
        updateService.loadSystemUpdates(systemUpdates),
      saveUpdate: () => 
        saveUpdate(updateForm, editingUpdate, loading, showNewUpdateForm, toastConfig, showToast, systemUpdates),
      editUpdate: (update) => 
        editUpdate(update, editingUpdate, updateForm, showNewUpdateForm),
      previewUpdate: (update) => 
        previewUpdate(update, previewingUpdate),
      
      // Métodos auxiliares de UI
      handleSidebarToggle: (expanded) => 
        handleSidebarToggle(expanded, isSidebarExpanded),
      hideConfirmDialog: () => 
        hideConfirmDialog(showConfirmDialog),
      redirectToHome: () => 
        redirectToHome(showAccessDeniedModal, router),
      
      // Métodos auxiliares de formatação
      formatDate,
      formatStatus,
      formatUserDisplay
    };
  },
};
</script>

<style>
@import './css/ConfiguracoesView.css';
</style>