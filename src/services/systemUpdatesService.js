import { supabase } from '@/lib/supabase';

/**
 * Busca atualizações do sistema que o usuário ainda não leu
 */
export async function getUnreadUpdates() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, message: 'Usuário não autenticado' };
    
    // Buscar atualizações não lidas pelo usuário
    const { data, error } = await supabase
      .from('system_updates')
      .select('*')
      .order('release_date', { ascending: false });
    
    if (error) throw error;
    
    // Buscar atualizações já lidas pelo usuário
    const { data: readUpdates, error: readError } = await supabase
      .from('system_update_reads')
      .select('update_id')
      .eq('user_id', user.id);
    
    if (readError) throw readError;
    
    // Filtrar apenas as não lidas
    const readIds = new Set(readUpdates.map(item => item.update_id));
    const unreadUpdates = data.filter(update => !readIds.has(update.id));
    
    return { success: true, data: unreadUpdates };
  } catch (error) {
    console.error('Erro ao buscar atualizações do sistema:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Marca uma atualização como lida pelo usuário atual
 */
export async function markUpdateAsRead(updateId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, message: 'Usuário não autenticado' };
    
    const { error } = await supabase
      .from('system_update_reads')
      .insert({
        user_id: user.id,
        update_id: updateId,
        read_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar atualização como lida:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Carrega as atualizações do sistema
 */
export async function loadSystemUpdates() {
  try {
    const { data, error } = await supabase
      .from("system_updates")
      .select("*")
      .order("release_date", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao carregar atualizações do sistema:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Cria uma nova atualização do sistema
 */
export async function createUpdate(updateData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Adicionar o usuário atual como criador
    const fullUpdateData = {
      ...updateData,
      created_by: user?.id || null,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from("system_updates")
      .insert([fullUpdateData])
      .select();
    
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro ao criar atualização do sistema:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Atualiza uma atualização existente
 */
export async function updateSystemUpdate(id, updateData) {
  try {
    const { data, error } = await supabase
      .from("system_updates")
      .update(updateData)
      .eq("id", id)
      .select();
    
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro ao atualizar informação do sistema:', error);
    return { success: false, message: error.message };
  }
}