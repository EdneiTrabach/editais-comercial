import { supabase } from "@/lib/supabase";
import { showToastMessage } from './uiHelpers';

/**
 * Atualiza o nome de um usuário
 */
export const handleNameUpdate = async (user, newName, toastConfig, showToast) => {
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
    showToastMessage(toastConfig, showToast, "Nome atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar nome:", error);
    showToastMessage(toastConfig, showToast, "Erro ao atualizar nome", "error");
  }
};

/**
 * Adiciona um novo usuário
 */
export const handleAddUser = async (newUser, loading, showAddUserModal, toastConfig, showToast, loadUsers) => {
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

    showToastMessage(toastConfig, showToast, "Usuário criado com sucesso!");
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
    showToastMessage(toastConfig, showToast, error.message || "Erro ao criar usuário", "error");
  } finally {
    loading.value = false;
  }
};

/**
 * Atualiza o email de um usuário
 */
export const handleEmailUpdate = async (user, newEmail, toastConfig, showToast, loadUsers) => {
  if (user.email === newEmail || !newEmail) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    showToastMessage(toastConfig, showToast, "Formato de email inválido", "error");
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
      showToastMessage(toastConfig, showToast, "Este email já está em uso", "error");
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
    showToastMessage(toastConfig, showToast, "Email atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar email:", error);
    showToastMessage(toastConfig, showToast, "Erro ao atualizar email", "error");
    await loadUsers();
  }
};

/**
 * Altera a role de um usuário
 */
export const handleRoleChange = (user, newRole, previousRole, dialogConfig, showConfirmDialog, toastConfig, showToast, loadUsers) => {
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
        showToastMessage(toastConfig, showToast, "Função alterada com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar função:", error);
        user.role = previousRole.value;
        showToastMessage(toastConfig, showToast, "Erro ao alterar função do usuário", "error");
      }
    },
    onCancel: () => {
      user.role = previousRole.value;
      showConfirmDialog.value = false;
    },
  };
  showConfirmDialog.value = true;
};

/**
 * Altera o status de um usuário (ativar/desativar)
 */
export const toggleUserStatus = (user, dialogConfig, showConfirmDialog, toastConfig, showToast) => {
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
          toastConfig,
          showToast,
          `Usuário ${newStatus === "ACTIVE" ? "ativado" : "desativado"} com sucesso!`
        );
      } catch (error) {
        console.error("Erro ao alterar status:", error);
        showToastMessage(toastConfig, showToast, "Erro ao alterar status do usuário", "error");
      }
    },
  };

  showConfirmDialog.value = true;
};

/**
 * Exclui um usuário (marca como deletado)
 */
export const deleteUser = (user, currentUser, dialogConfig, showConfirmDialog, toastConfig, showToast, loadUsers) => {
  if (user.id === currentUser.value?.id) {
    showToastMessage(toastConfig, showToast, "Não é possível excluir seu próprio usuário", "error");
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
        showToastMessage(toastConfig, showToast, "Usuário excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        showToastMessage(toastConfig, showToast, "Erro ao excluir usuário", "error");
      }
    },
  };
  showConfirmDialog.value = true;
};

/**
 * Envia email de redefinição de senha
 */
export const resetPassword = (user, dialogConfig, showConfirmDialog, toastConfig, showToast) => {
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
        showToastMessage(toastConfig, showToast, "Email de redefinição enviado com sucesso!");
      } catch (error) {
        console.error("Erro ao enviar redefinição de senha:", error);
        showToastMessage(
          toastConfig, 
          showToast,
          "Erro ao enviar email de redefinição de senha",
          "error"
        );
      }
    },
  };
  showConfirmDialog.value = true;
};

/**
 * Verifica se o usuário tem acesso de administrador
 */
export const checkAdminAccess = async (currentUserEmail, isAdmin, showAccessDeniedModal) => {
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

    return true;
  } catch (error) {
    console.error("Erro ao verificar acesso:", error);
    showAccessDeniedModal.value = true;
    return false;
  }
};

/**
 * Debug de acesso - verifica se o usuário atual é admin
 */
export const debugAccess = async () => {
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