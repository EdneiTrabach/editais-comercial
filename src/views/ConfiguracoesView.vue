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
import { supabase } from "@/lib/supabase";
import TheSidebar from "@/components/TheSidebar.vue";
import { useRouter } from "vue-router";
import { useConnectionManager } from "@/composables/useConnectionManager";
import { SupabaseManager } from "@/lib/supabaseManager";
import { createNotification } from "@/api/notificationsApi";
import SystemUpdateModal from "@/components/SystemUpdateModal.vue";

// Importar componentes internos
import HomeConfiguracoes from './components/configuracoes/HomeConfiguracoes.vue';
import AdminUsuarios from './components/configuracoes/AdminUsuarios.vue';
import AtualizacoesSistema from './components/configuracoes/AtualizacoesSistema.vue';
import AddUserModal from './components/configuracoes/AddUserModal.vue';
import DialogConfirmacao from './components/configuracoes/DialogConfirmacao.vue';
import AccessDeniedModal from './components/configuracoes/AccessDeniedModal.vue';
import EnviarNotificacao from './components/configuracoes/EnviarNotificacao.vue';
import UpdateFormModal from './components/configuracoes/UpdateFormModal.vue';
import ToastFeedback from './components/configuracoes/ToastFeedback.vue';

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

    // Implementação das funções
    const handleNameUpdate = async (user, newName) => {
      if (user.nome === newName) return;

      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome: newName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        user.nome = newName;
        showToastMessage("Nome atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar nome:", error);
        showToastMessage("Erro ao atualizar nome", "error");
      }
    };

    const handleAddUser = async () => {
      try {
        loading.value = true;

        const { data, error } = await supabase.auth.signUp({
          email: newUser.value.email,
          password: newUser.value.password,
          options: {
            data: {
              nome: newUser.value.nome,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              nome: newUser.value.nome,
              role: newUser.value.role,
              status: "ACTIVE",
              created_at: new Date().toISOString(),
            });

          if (profileError) throw profileError;
        }

        showToastMessage("Usuário criado com sucesso!");
        showAddUserModal.value = false;
        await loadUsers();

        newUser.value = {
          email: "",
          password: "",
          nome: "",
          role: "user",
        };
      } catch (error) {
        console.error("Erro ao criar usuário:", error);
        showToastMessage(error.message || "Erro ao criar usuário", "error");
      } finally {
        loading.value = false;
      }
    };

    const loadUsers = async () => {
      try {
        console.log("Iniciando carregamento de usuários...");
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("status", { ascending: true })
          .order("created_at", { ascending: false });

        console.log("Resposta do servidor:", { profilesData, profilesError });

        if (profilesError) throw profilesError;

        users.value = profilesData.map((profile) => ({
          ...profile,
          nome: profile.nome || "",
          email: profile.email || "",
        }));
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        showToastMessage("Erro ao carregar usuários", "error");
      }
    };

    const updateUserRole = async (user) => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ role: user.role })
          .eq("id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Erro ao atualizar função:", error);
      }
    };

    const deleteUser = async (user) => {
      if (user.id === currentUser.value?.id) {
        showToastMessage("Não é possível excluir seu próprio usuário", "error");
        return;
      }

      dialogConfig.value = {
        title: "Confirmar Exclusão",
        message: `Deseja realmente excluir o usuário ${user.email}?`,
        warning: "Esta ação é irreversível!",
        confirmText: "Excluir",
        onConfirm: async () => {
          try {
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                status: "DELETED",
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (profileError) throw profileError;

            await loadUsers();
            showConfirmDialog.value = false;
            showToastMessage("Usuário excluído com sucesso!");
          } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            showToastMessage("Erro ao excluir usuário", "error");
          }
        },
      };
      showConfirmDialog.value = true;
    };

    const toggleUserStatus = async (user) => {
      const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
      const message =
        newStatus === "ACTIVE"
          ? `Deseja ativar o usuário ${user.email}?`
          : `Deseja desativar o usuário ${user.email}?`;

      dialogConfig.value = {
        title: `${newStatus === "ACTIVE" ? "Ativar" : "Desativar"} usuário`,
        message: message,
        confirmText: newStatus === "ACTIVE" ? "Ativar" : "Desativar",
        onConfirm: async () => {
          try {
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (profileError) throw profileError;

            user.status = newStatus;
            showConfirmDialog.value = false;
            showToastMessage(
              `Usuário ${
                newStatus === "ACTIVE" ? "ativado" : "desativado"
              } com sucesso!`
            );
          } catch (error) {
            console.error("Erro ao alterar status:", error);
            showToastMessage("Erro ao alterar status do usuário", "error");
          }
        },
      };

      showConfirmDialog.value = true;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("pt-BR");
    };

    const formatStatus = (status) => {
      const statusMap = {
        ACTIVE: "Ativo",
        DISABLED: "Desativado",
        PENDING: "Pendente",
      };
      return statusMap[status] || status;
    };

    const formatUserDisplay = (user) => {
      return user.status === "DISABLED"
        ? `${user.email} - DESATIVADO`
        : user.email;
    };

    const showToastMessage = (message, type = "success") => {
      toastConfig.value = { message, type };
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 3000);
    };

    const handleRoleChange = (user, newRole) => {
      previousRole.value = user.role;

      dialogConfig.value = {
        title: "Confirmar Alteração",
        message: `Deseja realmente alterar a função do usuário ${
          user.email
        } para ${newRole === "admin" ? "Administrador" : "Usuário"}?`,
        warning: "Esta ação afetará as permissões do usuário no sistema.",
        confirmText: "Confirmar",
        onConfirm: async () => {
          try {
            const { error } = await supabase
              .from("profiles")
              .update({
                role: newRole,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (error) throw error;

            user.role = newRole;
            await loadUsers();
            showConfirmDialog.value = false;
            showToastMessage("Função alterada com sucesso!");
          } catch (error) {
            console.error("Erro ao atualizar função:", error);
            user.role = previousRole.value;
            showToastMessage("Erro ao alterar função do usuário", "error");
          }
        },
        onCancel: () => {
          user.role = previousRole.value;
          showConfirmDialog.value = false;
        },
      };
      showConfirmDialog.value = true;
    };

    const redirectToHome = () => {
      showAccessDeniedModal.value = false;
      router.push("/");
    };

    const checkAdminAccess = async () => {
      try {
        console.log("Verificando acesso admin...");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return false;
        }

        currentUserEmail.value = user.email;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, nome")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar perfil:", error);
          showAccessDeniedModal.value = true;
          return false;
        }

        const adminStatus = profile?.role === "admin";
        isAdmin.value = adminStatus;

        if (!adminStatus) {
          showAccessDeniedModal.value = true;
          return false;
        }

        currentUser.value = user;
        return true;
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        showAccessDeniedModal.value = true;
        return false;
      }
    };

    const debugAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log("Usuário autenticado:", user);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("Perfil do usuário:", profile);
        console.log("Role do usuário:", profile?.role);
        console.log("Role no localStorage:", localStorage.getItem("userRole"));

        return profile?.role === "admin";
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        return false;
      }
    };

    const loadData = async () => {
      try {
        await loadUsers();
      } catch (error) {
        console.error("Erro carregando dados:", error);
      }
    };

    useConnectionManager(loadData);

    const handleEmailUpdate = async (user, newEmail) => {
      if (user.email === newEmail || !newEmail) return;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        showToastMessage("Formato de email inválido", "error");
        await loadUsers();
        return;
      }

      try {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", newEmail)
          .neq("id", user.id)
          .single();

        if (existingUser) {
          showToastMessage("Este email já está em uso", "error");
          await loadUsers();
          return;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            email: newEmail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        user.email = newEmail;
        showToastMessage("Email atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar email:", error);
        showToastMessage("Erro ao atualizar email", "error");
        await loadUsers();
      }
    };

    const resetPassword = async (user) => {
      dialogConfig.value = {
        title: "Confirmar redefinição de senha",
        message: `Deseja enviar um email de redefinição de senha para ${user.email}?`,
        confirmText: "Enviar",
        onConfirm: async () => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(
              user.email,
              {
                redirectTo: `${window.location.origin}/reset-password`,
              }
            );

            if (error) throw error;

            showConfirmDialog.value = false;
            showToastMessage("Email de redefinição enviado com sucesso!");
          } catch (error) {
            console.error("Erro ao enviar redefinição de senha:", error);
            showToastMessage(
              "Erro ao enviar email de redefinição de senha",
              "error"
            );
          }
        },
      };
      showConfirmDialog.value = true;
    };

    const openSendNotificationModal = () => {
      selectedUserIds.value = [];
      notificationForm.value = {
        title: "",
        message: "",
        tipo: "usuario",
        nivel: "medio",
        processo_id: null,
      };
      showSendNotificationModal.value = true;
    };

    const toggleSelectAllUsers = (event) => {
      if (event.target.checked) {
        selectedUserIds.value = users.value
          .filter((user) => user.status === "ACTIVE")
          .map((user) => user.id);
      } else {
        selectedUserIds.value = [];
      }
    };

    const toggleSelectUser = (userId) => {
      const index = selectedUserIds.value.indexOf(userId);
      if (index === -1) {
        selectedUserIds.value.push(userId);
      } else {
        selectedUserIds.value.splice(index, 1);
      }
    };

    const sendNotification = async () => {
      try {
        loading.value = true;

        if (selectedUserIds.value.length === 0) {
          showToastMessage("Selecione pelo menos um usuário", "error");
          return;
        }

        if (!notificationForm.value.title || !notificationForm.value.message) {
          showToastMessage("Preencha todos os campos obrigatórios", "error");
          return;
        }

        const result = await createNotification(
          notificationForm.value,
          selectedUserIds.value
        );

        if (result.success) {
          showToastMessage("Notificação enviada com sucesso!");
          showSendNotificationModal.value = false;
        } else {
          throw new Error(
            result.error?.message || "Erro ao enviar notificação"
          );
        }
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
        showToastMessage("Erro ao enviar notificação", "error");
      } finally {
        loading.value = false;
      }
    };

    const loadSystemUpdates = async () => {
      try {
        const { data, error } = await supabase
          .from("system_updates")
          .select("*")
          .order("release_date", { ascending: false });

        if (error) throw error;
        systemUpdates.value = data || [];
      } catch (error) {
        console.error("Erro ao carregar atualizações:", error);
        showToast("Erro ao carregar atualizações", "error");
      }
    };

    const saveUpdate = async () => {
      try {
        loading.value = true;

        const updateData = {
          ...updateForm.value,
          release_date:
            updateForm.value.release_date || new Date().toISOString(),
        };

        let result;

        if (editingUpdate.value) {
          const { data, error } = await supabase
            .from("system_updates")
            .update(updateData)
            .eq("id", editingUpdate.value.id)
            .select();

          if (error) throw error;
          result = { success: true, data: data[0] };
        } else {
          const { data, error } = await supabase
            .from("system_updates")
            .insert(updateData)
            .select();

          if (error) throw error;
          result = { success: true, data: data[0] };
        }

        if (result.success) {
          showToastMessage("Atualização salva com sucesso!");
          showNewUpdateForm.value = false;
          editingUpdate.value = null;
          await loadSystemUpdates();

          updateForm.value = {
            title: "",
            description: "",
            version: "",
            importance: "media",
            release_date: new Date().toISOString().split("T")[0],
          };
        }
      } catch (error) {
        console.error("Erro ao salvar atualização:", error);
        showToastMessage("Erro ao salvar: " + error.message, "error");
      } finally {
        loading.value = false;
      }
    };

    const editUpdate = (update) => {
      editingUpdate.value = update;
      updateForm.value = { ...update };
      showNewUpdateForm.value = true;
    };

    const previewUpdate = (update) => {
      previewingUpdate.value = update;
    };

    const handleStorage = (event) => {
      if (event.key === "sidebarState") {
        const newValue = event.newValue === "true";
        if (isSidebarExpanded.value !== newValue) {
          console.log("Sincronizando estado do sidebar do localStorage:", newValue);
          isSidebarExpanded.value = newValue;
          
          nextTick(() => {
            const mainContent = document.querySelector(".main-content");
            if (mainContent) {
              if (newValue) {
                mainContent.classList.remove("expanded");
              } else {
                mainContent.classList.add("expanded");
              }
            }
          });
        }
      }
    };

    const handleSidebarToggle = (expanded) => {
      console.log("Sidebar toggle:", expanded);
      
      isSidebarExpanded.value = expanded;
      
      nextTick(() => {
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
          if (expanded) {
            mainContent.classList.remove("expanded");
          } else {
            mainContent.classList.add("expanded");
          }
        }
      });
    };

    const hideConfirmDialog = () => {
      showConfirmDialog.value = false;
    };

    onMounted(() => {
      try {
        const savedState = localStorage.getItem("sidebarState");
        if (savedState !== null) {
          isSidebarExpanded.value = savedState === "true";
        }

        window.addEventListener("storage", handleStorage);
      } catch (error) {
        console.error("Erro ao montar componente:", error);
      }
    });

    onUnmounted(() => {
      try {
        window.removeEventListener("storage", handleStorage);
        
        const channel = SupabaseManager.getSubscription("lances-updates");
        if (channel) {
          supabase.removeChannel(channel);
          SupabaseManager.removeSubscription("lances-updates");
        }
      } catch (error) {
        console.error("Erro ao desmontar componente:", error);
      }
    });

    watch(isSidebarExpanded, (newValue) => {
      console.log("isSidebarExpanded mudou para:", newValue);
    });

    onMounted(async () => {
      try {
        const isAdmin = await debugAccess();
        console.log("Usuário é admin?", isAdmin);

        if (!isAdmin) {
          showAccessDeniedModal.value = true;
          return;
        }

        const hasAccess = await checkAdminAccess();
        console.log("Tem acesso?", hasAccess);

        if (!hasAccess) {
          console.log("Sem acesso, retornando...");
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        currentUser.value = user;
        await loadUsers();
      } catch (error) {
        console.error("Erro no onMounted:", error);
        showToastMessage("Erro ao carregar página", "error");
      }

      const channel = supabase
        .channel("lances-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => loadData()
        )
        .subscribe();

      SupabaseManager.addSubscription("lances-updates", channel);

      await loadSystemUpdates();
    });

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
      
      // Métodos
      handleNameUpdate,
      handleAddUser,
      handleSidebarToggle,
      formatDate,
      formatStatus,
      formatUserDisplay,
      toggleUserStatus,
      deleteUser,
      handleRoleChange,
      hideConfirmDialog,
      redirectToHome,
      handleEmailUpdate,
      resetPassword,
      openSendNotificationModal,
      toggleSelectAllUsers,
      toggleSelectUser,
      sendNotification,
      loadSystemUpdates,
      saveUpdate,
      editUpdate,
      previewUpdate
    };
  },
};
</script>

<style>
/* Estilos globais para a tela de configurações */
@import '../assets/styles/ConfiguracoesView.css';
</style>