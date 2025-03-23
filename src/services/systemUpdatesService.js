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
 * Cria uma nova atualização do sistema (apenas para administradores)
 */
export async function createUpdate(updateData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, message: 'Usuário não autenticado' };
    
    // Verificar se o usuário é admin (opcional)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('Erro ao verificar papel do usuário, prosseguindo sem verificação');
    } else if (profile && profile.role !== 'admin') {
      return { success: false, message: 'Somente administradores podem criar atualizações' };
    }
    
    const { data, error } = await supabase
      .from('system_updates')
      .insert({
        ...updateData,
        created_by: user.id
      })
      .select();
    
    if (error) throw error;
    
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro ao criar atualização do sistema:', error);
    return { success: false, message: error.message };
  }
}