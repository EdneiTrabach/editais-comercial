/**
 * Formata uma data para o formato brasileiro
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("pt-BR");
};

/**
 * Formata o status do usuário para exibição
 */
export const formatStatus = (status) => {
  const statusMap = {
    ACTIVE: "Ativo",
    DISABLED: "Desativado",
    PENDING: "Pendente",
    DELETED: "Excluído"
  };
  return statusMap[status] || status;
};

/**
 * Formata a exibição do usuário
 */
export const formatUserDisplay = (user) => {
  return user.status === "DISABLED"
    ? `${user.email} - DESATIVADO`
    : user.email;
};