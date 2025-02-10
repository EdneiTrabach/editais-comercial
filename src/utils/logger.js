// src/utils/logger.ts
import { supabase } from '@/config/supabase';
export const logSystemAction = async (action, details) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('system_logs').insert({
            action,
            details,
            user_id: user?.id
        });
    }
    catch (error) {
        console.error('Erro ao registrar log:', error);
    }
};
