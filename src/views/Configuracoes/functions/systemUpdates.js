import { supabase } from "@/lib/supabase";
import { showToastMessage } from './uiHelpers';

/**
 * Salva uma nova atualização ou edita uma existente
 */
export const saveUpdate = async (updateForm, editingUpdate, loading, showNewUpdateForm, toastConfig, showToast, systemUpdates) => {
  try {
    loading.value = true;

    const updateData = {
      ...updateForm.value,
      release_date: updateForm.value.release_date || new Date().toISOString(),
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
      showToastMessage(toastConfig, showToast, "Atualização salva com sucesso!");
      showNewUpdateForm.value = false;
      editingUpdate.value = null;

      // Recarregar atualizações
      await loadSystemUpdatesData(systemUpdates);

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
    showToastMessage(toastConfig, showToast, "Erro ao salvar: " + error.message, "error");
  } finally {
    loading.value = false;
  }
};

/**
 * Carrega os dados de atualizações do sistema
 */
export const loadSystemUpdatesData = async (systemUpdates) => {
  try {
    const { data, error } = await supabase
      .from("system_updates")
      .select("*")
      .order("release_date", { ascending: false });

    if (error) throw error;
    systemUpdates.value = data || [];
    return data;
  } catch (error) {
    console.error("Erro ao carregar atualizações:", error);
    return [];
  }
};

/**
 * Edita uma atualização existente
 */
export const editUpdate = (update, editingUpdate, updateForm, showNewUpdateForm) => {
  editingUpdate.value = update;
  updateForm.value = { ...update };
  showNewUpdateForm.value = true;
};

/**
 * Visualiza uma atualização
 */
export const previewUpdate = (update, previewingUpdate) => {
  previewingUpdate.value = update;
};