import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useResponsavelForm() {
  const formData = ref({
    nome: '',
    email: '',
    departamento: '',
    status: 'ACTIVE'
  })
  
  const isEditing = ref(false)
  const editingId = ref(null)
  const loading = ref(false)
  
  // Resetar formulário
  const resetForm = () => {
    formData.value = {
      nome: '',
      email: '',
      departamento: '',
      status: 'ACTIVE'
    }
    isEditing.value = false
    editingId.value = null
  }
  
  // Configurar para edição
  const setupForEditing = (responsavel) => {
    isEditing.value = true
    editingId.value = responsavel.id
    
    formData.value = {
      nome: responsavel.nome || '',
      email: responsavel.email || '',
      departamento: responsavel.departamento || '',
      status: responsavel.status || 'ACTIVE'
    }
  }
  
  // Validar formulário
  const validateForm = () => {
    const errors = []
    
    if (!formData.value.nome.trim()) {
      errors.push('Nome é obrigatório')
    }
    
    if (!isEditing.value && !formData.value.email.trim()) {
      errors.push('Email é obrigatório')
    } else if (!isEditing.value && !/\S+@\S+\.\S+/.test(formData.value.email.trim())) {
      errors.push('Email inválido')
    }
    
    return { valid: errors.length === 0, errors }
  }
  
  // Adicionar novo responsável
  const addResponsavel = async () => {
    try {
      loading.value = true
      
      const { valid, errors } = validateForm()
      if (!valid) {
        return { success: false, errors }
      }
      
      // Verificar se email já existe
      const { data: existingUserResp, error: checkErrorResp } = await supabase
        .from('responsaveis_processos')
        .select('id')
        .eq('email', formData.value.email.trim())
      
      if (checkErrorResp) throw checkErrorResp
      
      if (existingUserResp?.length > 0) {
        return {
          success: false,
          errors: ['Este email já está cadastrado como responsável']
        }
      }
      
      // Verificar se email existe em profiles
      const { data: existingUserProfile, error: checkErrorProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.value.email.trim())
      
      if (checkErrorProfile) throw checkErrorProfile
      
      if (existingUserProfile?.length > 0) {
        return {
          success: false,
          errors: ['Este email já está em uso por outro usuário do sistema']
        }
      }
      
      // Inserir responsável
      const { error } = await supabase
        .rpc('adicionar_responsavel', {
          p_nome: formData.value.nome.trim(),
          p_email: formData.value.email.trim(),
          p_departamento: formData.value.departamento.trim() || null
        })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao adicionar responsável:', error)
      return {
        success: false,
        errors: [error.message || 'Erro ao adicionar responsável']
      }
    } finally {
      loading.value = false
    }
  }
  
  // Atualizar responsável
  const updateResponsavel = async () => {
    try {
      loading.value = true
      
      const { valid, errors } = validateForm()
      if (!valid) {
        return { success: false, errors }
      }
      
      const { error } = await supabase
        .from('responsaveis_processos')
        .update({
          nome: formData.value.nome.trim(),
          departamento: formData.value.departamento.trim() || null,
          status: formData.value.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId.value)
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error)
      return {
        success: false,
        errors: [error.message || 'Erro ao atualizar responsável']
      }
    } finally {
      loading.value = false
    }
  }
  
  // Função para salvar (adicionar ou atualizar)
  const saveResponsavel = async () => {
    return isEditing.value ? updateResponsavel() : addResponsavel()
  }
  
  return {
    formData,
    isEditing,
    editingId,
    loading,
    resetForm,
    setupForEditing,
    saveResponsavel
  }
}