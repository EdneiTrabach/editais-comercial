import { supabase } from "@/lib/supabase";
import { SupabaseManager } from "@/lib/supabaseManager";

/**
 * Gerencia operações relacionadas aos usuários
 */
export const userService = {
  /**
   * Carrega todos os usuários
   */
  async loadUsers() {
    try {
      console.log("Iniciando carregamento de usuários...");
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });

      console.log("Resposta do servidor:", { profilesData, profilesError });

      if (profilesError) throw profilesError;

      return profilesData.map((profile) => ({
        ...profile,
        nome: profile.nome || "",
        email: profile.email || "",
      }));
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      return [];
    }
  },

  /**
   * Obtém o usuário atual
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error);
      return null;
    }
  },

  /**
   * Configura o listener para atualizações de usuários
   */
  setupUserListener(callback) {
    const channel = supabase
      .channel("lances-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => callback()
      )
      .subscribe();

    SupabaseManager.addSubscription("lances-updates", channel);
    return channel;
  },

  /**
   * Remove o listener de atualizações de usuários
   */
  removeUserListener() {
    const channel = SupabaseManager.getSubscription("lances-updates");
    if (channel) {
      supabase.removeChannel(channel);
      SupabaseManager.removeSubscription("lances-updates");
    }
  }
};