import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useInlineEditing() {
  const editingNames = ref({})
  const editingDepts = ref({})
  const editingData = ref({})
  
  // Limpar estado de edição
  const clearEditingState = () => {
    editingNames.value = {}
    editingDepts.value = {}
  }
  
  // Iniciar edição de nome
  const startEditingName = (responsavel) => {
    clearEditingState()
    
    // Configurar dados de edição
    if (!editingData.value[responsavel.id]) {
      editingData.value[responsavel.id] = { ...responsavel }
    }
    
    editingNames.value[responsavel.id] = true
  }
  
  // Iniciar edição de departamento
  const startEditingDept = (responsavel) => {
    clearEditingState()
    
    // Configurar dados de edição
    if (!editingData.value[responsavel.id]) {
      editingData.value[responsavel.id] = { ...responsavel }
    }
    
    editingDepts.value[responsavel.id] = true
  }
  
  // Atualizar nome
  const updateName = async (responsavel, newName) => {
    try {
      if (responsavel.nome === newName || !newName.trim()) {
        editingNames.value[responsavel.id] = false
        return { success: false, noChange: true }
      }
      
      const { error } = await supabase
        .from('responsaveis_processos')
        .update({
          nome: newName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', responsavel.id)
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar nome:', error)
      return { success: false, error: error.message }
    } finally {
      editingNames.value[responsavel.id] = false
    }
  }
  
  // Atualizar departamento
  const updateDepartment = async (responsavel, newDept) => {
    try {
      if (responsavel.departamento === newDept) {
        editingDepts.value[responsavel.id] = false
        return { success: false, noChange: true }
      }
      
      const { error } = await supabase
        .from('responsaveis_processos')
        .update({
          departamento: newDept.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', responsavel.id)
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error)
      return { success: false, error: error.message }
    } finally {
      editingDepts.value[responsavel.id] = false
    }
  }
  
  return {
    editingNames,
    editingDepts,
    editingData,
    startEditingName,
    startEditingDept,
    updateName,
    updateDepartment
  }
}