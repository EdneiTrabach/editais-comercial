import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { supabase } from "@/lib/supabase";
import TheSidebar from "@/components/TheSidebar.vue";
import { useRouter } from "vue-router";
import { useConnectionManager } from "@/composables/useConnectionManager";
import { SupabaseManager } from "@/lib/supabaseManager";
import { createNotification } from "@/api/notificationsApi";
import SystemUpdateModal from "@/components/SystemUpdateModal.vue";

export default {
  components: {
    TheSidebar,
    SystemUpdateModal,
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const users = ref([]);
    const currentUser = ref(null);
    const isSidebarExpanded = ref(true);
    const showAddUserModal = ref(false);
    const showConfirmDialog = ref(false);
    const showAccessDeniedModal = ref(false); // Novo estado para o modal de acesso negado
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
      processo_id: null,
    });
    const activeTab = ref("home"); // Começa na tela inicial com os cards
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
    const isAdmin = ref(true); // Já começa como true pois o acesso à página já verifica se é admin

    // Todas as funções existentes...
    const handleNameUpdate = async (user, newName) => {
      // Seu código existente
      if (user.nome === newName) return;

      try {
        // Atualiza apenas na tabela profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome: newName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Atualiza localmente
        user.nome = newName;
        showToastMessage("Nome atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar nome:", error);
        showToastMessage("Erro ao atualizar nome", "error");
      }
    };

    // Adicionar todas as funções existentes aqui...
    // handleAddUser, loadUsers, updateUserRole, deleteUser, etc.

    // Função para criar novo usuário
    const handleAddUser = async () => {
      try {
        loading.value = true;

        // 1. Criar usuário no Auth
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

        // 2. Criar perfil do usuário
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

        // 3. Feedback e limpeza
        showToastMessage("Usuário criado com sucesso!");
        showAddUserModal.value = false;
        await loadUsers();

        // 4. Resetar form
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
            // Primeiro, desativa o usuário atualizando o status
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                status: "DELETED",
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (profileError) throw profileError;

            // Agora podemos atualizar a UI e fechar o diálogo
            await loadUsers(); // Recarregar usuários
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

    // Substitua a função toggleUserStatus existente por esta versão melhorada:
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
            // Atualizar status na tabela profiles
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (profileError) throw profileError;

            // Atualizar UI
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

    // Modifique a função handleSidebarToggle no ConfiguracoesView.js
    const handleSidebarToggle = (expanded) => {
      console.log("Sidebar toggle:", expanded);
      
      // Definir o valor sem depender do evento
      isSidebarExpanded.value = expanded;
      
      // Aplicar a classe diretamente
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
      previousRole.value = user.role; // Guarda o valor anterior

      dialogConfig.value = {
        title: "Confirmar Alteração",
        message: `Deseja realmente alterar a função do usuário ${
          user.email
        } para ${newRole === "admin" ? "Administrador" : "Usuário"}?`,
        warning: "Esta ação afetará as permissões do usuário no sistema.",
        confirmText: "Confirmar",
        onConfirm: async () => {
          try {
            // Atualizar o role no banco
            const { error } = await supabase
              .from("profiles")
              .update({
                role: newRole,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (error) throw error;

            // Atualiza o usuário local
            user.role = newRole;

            // Atualiza a lista de usuários
            await loadUsers();
            showConfirmDialog.value = false;
            showToastMessage("Função alterada com sucesso!");
          } catch (error) {
            console.error("Erro ao atualizar função:", error);
            user.role = previousRole.value; // Reverte a mudança em caso de erro
            showToastMessage("Erro ao alterar função do usuário", "error");
          }
        },
        onCancel: () => {
          user.role = previousRole.value; // Reverte a mudança se cancelar
          showConfirmDialog.value = false;
        },
      };
      showConfirmDialog.value = true;
    };

    const syncUserData = async (userId, userData) => {
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            ...userData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (profileError) throw profileError;

        return true;
      } catch (error) {
        console.error("Erro ao sincronizar dados:", error);
        return false;
      }
    };

    // Função para redirecionar após fechar o modal
    const redirectToHome = () => {
      showAccessDeniedModal.value = false;
      router.push("/");
    };

    // Modificar a verificação de acesso para exibir o modal em vez de redirecionar imediatamente
    const checkAdminAccess = async () => {
      try {
        console.log("Verificando acesso admin...");

        // 1. Obter usuário atual
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return false;
        }

        // Salvar o email do usuário atual
        currentUserEmail.value = user.email;

        // 2. Buscar perfil do usuário
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

        // 3. Verificar se é admin
        const adminStatus = profile?.role === "admin";
        isAdmin.value = adminStatus; // Atualiza a propriedade reativa

        if (!adminStatus) {
          // IMPORTANTE: Mostrar modal em vez de alert ou console.log
          showAccessDeniedModal.value = true;
          return false;
        }

        // 4. Usuário é admin, continuar
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
        await loadUsers(); // Substitua loadProcessos por loadUsers
      } catch (error) {
        console.error("Erro carregando dados:", error);
      }
    };

    // Use o composable
    useConnectionManager(loadData);

    // Função para atualizar o email do usuário
    const handleEmailUpdate = async (user, newEmail) => {
      if (user.email === newEmail || !newEmail) return;

      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        showToastMessage("Formato de email inválido", "error");
        // Recarrega para reverter a alteração inválida
        await loadUsers();
        return;
      }

      try {
        // Verifica se o email já existe (exceto para o usuário atual)
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", newEmail)
          .neq("id", user.id)
          .single();

        if (existingUser) {
          showToastMessage("Este email já está em uso", "error");
          await loadUsers(); // Reverte alteração
          return;
        }

        // Atualiza o email na tabela profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            email: newEmail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Atualiza localmente
        user.email = newEmail;
        showToastMessage("Email atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar email:", error);
        showToastMessage("Erro ao atualizar email", "error");
        await loadUsers(); // Reverte alteração em caso de erro
      }
    };

    // Função para solicitar redefinição de senha
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
        nivel: "medio", // Nível padrão
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
          // Atualizar existente
          const { data, error } = await supabase
            .from("system_updates")
            .update(updateData)
            .eq("id", editingUpdate.value.id)
            .select();

          if (error) throw error;
          result = { success: true, data: data[0] };
        } else {
          // Criar nova
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

          // Limpar formulário
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

    onMounted(async () => {
      // Seu código existente...
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

      // Adicionar importação do Font Awesome
      const script = document.createElement('script');
      script.setAttribute('src', 'https://kit.fontawesome.com/a076d05399.js');
      script.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(script);
    });

    onMounted(() => {
      // Verificar o estado inicial do sidebar
      const savedState = localStorage.getItem("sidebarState");
      if (savedState !== null) {
        isSidebarExpanded.value = savedState === "true";
      }

      // Adicionar listener para eventos de armazenamento
      const handleStorage = (event) => {
        if (event.key === "sidebarState") {
          const newValue = event.newValue === "true";
          if (isSidebarExpanded.value !== newValue) {
            console.log("Sincronizando estado do sidebar do localStorage:", newValue);
            isSidebarExpanded.value = newValue;
            
            // Aplicar classe CSS correspondente
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
      
      window.addEventListener("storage", handleStorage);
    });

    onUnmounted(() => {
      const channel = SupabaseManager.getSubscription("lances-updates");
      if (channel) {
        supabase.removeChannel(channel);
        SupabaseManager.removeSubscription("lances-updates");
      }

      window.removeEventListener("storage", handleStorage);
    });

    // Adicione este código dentro do setup()
    watch(isSidebarExpanded, (newValue) => {
      console.log("isSidebarExpanded mudou para:", newValue);
      // Não fazer manipulação de DOM aqui
    });

    // Retornar variáveis e funções que serão usadas no template
    return {
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
      handleNameUpdate,
      handleAddUser,
      handleSidebarToggle,
      formatDate,
      formatStatus,
      formatUserDisplay,
      toggleUserStatus,
      deleteUser,
      handleRoleChange,
      hideConfirmDialog: () => {
        showConfirmDialog.value = false;
      },
      showAccessDeniedModal, // Exportar nova ref
      redirectToHome, // Exportar nova função
      currentUserEmail,
      handleEmailUpdate,
      resetPassword,
      showSendNotificationModal,
      selectedUserIds,
      notificationForm,
      openSendNotificationModal,
      toggleSelectAllUsers,
      toggleSelectUser,
      sendNotification,
      isAdmin, // Adicionar isAdmin aqui
      activeTab,
      systemUpdates,
      showNewUpdateForm,
      previewingUpdate,
      editingUpdate,
      updateForm,
      loadSystemUpdates,
      saveUpdate,
      editUpdate,
      previewUpdate,
    };
  },
};
