import axios from 'axios';
import { supabase } from '@/lib/supabase';
import router from '@/router';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

// Interceptor para adicionar token em todas requisições
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401) {
        supabase.auth.signOut();
        router.push('/login');
    }
    return Promise.reject(error);
});

// Create api object with Supabase methods
const supabaseApi = {
    // Generic CRUD operations
    get: async (table) => {
        const { data, error } = await supabase
            .from(table)
            .select();
        if (error)
            throw error;
        return { data };
    },
    getById: async (table, id) => {
        const { data, error } = await supabase
            .from(table)
            .select()
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return { data };
    },
    post: async (table, payload) => {
        const { data, error } = await supabase
            .from(table)
            .insert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return { data };
    },
    put: async (table, id, payload) => {
        const { data, error } = await supabase
            .from(table)
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return { data };
    },
    delete: async (table, id) => {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return { success: true };
    },
    // Specific endpoints
    certificados: {
        getAll: () => supabaseApi.get('certificados'),
        getById: (id) => supabaseApi.getById('certificados', id),
        create: (data) => supabaseApi.post('certificados', data),
        update: (id, data) => supabaseApi.put('certificados', id, data),
        delete: (id) => supabaseApi.delete('certificados', id),
        emitir: async (id) => {
            const { data, error } = await supabase
                .from('certificados')
                .update({ status: 'emitido', data_emissao: new Date().toISOString() })
                .eq('id', id);
            if (error)
                throw error;
            return { data };
        }
    }
};
export const setorService = {
    async listarSetores() {
        const { data, error } = await supabase
            .from('setores')
            .select('*')
            .order('nome');
        if (error)
            throw error;
        return data;
    },
    async cadastrarSetor(nome) {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            throw new Error('User not authenticated');
        const { data, error } = await supabase
            .from('setores')
            .insert({
            nome,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
};
export const usuariosService = {
    async getAll() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return { data };
    },
    async update(id, userData) {
        const { data, error } = await supabase
            .from('usuarios')
            .update(userData)
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return { data };
    },
    async delete(id) {
        const { data, error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return { data };
    }
};
// Export default api
export default api;
// Export other services
export const certificadosService = { /* ... */};
