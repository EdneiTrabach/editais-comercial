import { supabase } from "@/lib/supabase";

/**
 * Gerencia operações relacionadas às atualizações do sistema
 */
export const updateService = {
  /**
   * Carrega as atualizações do sistema
   */
  async loadSystemUpdates(systemUpdates) {
    try {
      const { data, error } = await supabase
        .from("system_updates")
        .select("*")
        .order("release_date", { ascending: false });

      if (error) throw error;
      
      if (systemUpdates) {
        systemUpdates.value = data || [];
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao carregar atualizações:", error);
      return [];
    }
  },

  /**
   * Salva uma atualização do sistema
   */
  async saveUpdate(updateData, existingUpdateId = null) {
    try {
      if (existingUpdateId) {
        const { data, error } = await supabase
          .from("system_updates")
          .update(updateData)
          .eq("id", existingUpdateId)
          .select();

        if (error) throw error;
        return { success: true, data: data[0] };
      } else {
        const { data, error } = await supabase
          .from("system_updates")
          .insert(updateData)
          .select();

        if (error) throw error;
        return { success: true, data: data[0] };
      }
    } catch (error) {
      console.error("Erro ao salvar atualização:", error);
      return { success: false, error };
    }
  }
};