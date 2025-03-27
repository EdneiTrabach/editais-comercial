import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useEdicaoCelula() {
  const editingCell = ref({
    id: null,
    field: null,
    value: null
  })
  
  const cancelEdit = () => {
    editingCell.value = {
      id: null,
      field: null,
      value: null
    }
  }
  
  const handleDblClick = async (field, processo, event) => {
    if (editingCell.value.id === processo.id && editingCell.value.field === field) {
      return
    }
    
    const cell = event.target.closest('td')
    const rect = cell.getBoundingClientRect()
    
    // Tratamento especial para campos específicos
    if (field === 'sistemas_ativos') {
      editingCell.value = {
        id: processo.id,
        field,
        value: Array.isArray(processo[field]) ? [...processo[field]] : []
      }
      
      // Nota: A lógica para mostrar o diálogo de sistemas deve ser implementada
      // no componente principal ou em um composable específico
      return
    }
    
    // Comportamento padrão para outros campos
    // Nota: A lógica para mostrar o diálogo de confirmação deve ser implementada
    // no componente principal ou em um composable específico
  }
  
  const handleUpdate = async (processo) => {
    try {
      // Verificar se o campo está em edição
      if (editingCell.value.id !== processo.id) return
      
      // O valor atual e anterior devem ser diferentes para prosseguir
      if (editingCell.value.value === processo[editingCell.value.field]) {
        console.log('Valor não mudou, cancelando atualização')
        cancelEdit()
        return
      }
      
      let updateValue = editingCell.value.value
      
      // Formatação específica por tipo de campo
      switch (editingCell.value.field) {
        case 'data_pregao':
          // Garantir que a data está no formato correto para o banco de dados
          if (typeof updateValue === 'string') {
            if (updateValue.includes('/')) {
              // Converter de DD/MM/YYYY para YYYY-MM-DD
              const [day, month, year] = updateValue.split('/')
              updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            } else if (updateValue.includes('-')) {
              // Já está no formato YYYY-MM-DD, apenas garantir
              const [year, month, day] = updateValue.split('-')
              updateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            }
          }
          break
          
        case 'hora_pregao':
          // Garantir formato HH:mm
          if (typeof updateValue === 'string') {
            const [hours, minutes] = updateValue.split(':')
            updateValue = `${hours.padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'}`
          }
          break
          
        case 'sistemas_ativos':
          // Garantir que é um array
          updateValue = Array.isArray(updateValue) ? updateValue : []
          break
          
        // Outros casos especiais podem ser adicionados aqui
      }
      
      // Verificar se o valor realmente mudou para evitar atualizações desnecessárias
      if (updateValue === processo[editingCell.value.field]) {
        console.log('Valor não mudou, cancelando atualização')
        cancelEdit()
        return
      }
      
      console.log(`Atualizando ${editingCell.value.field} para:`, updateValue)
      
      // Preparar dados para atualização
      const updateData = {
        [editingCell.value.field]: updateValue,
        updated_at: new Date().toISOString()
      }
      
      // Adicionar usuário que está fazendo a alteração, se disponível
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        updateData.updated_by = user.id
      }
      
      // Atualizar no banco de dados
      console.log('Dados para atualização:', updateData)
      
      const { error } = await supabase
        .from('processos')
        .update(updateData)
        .eq('id', processo.id)
      
      if (error) {
        console.error('Erro ao atualizar:', error)
        throw error
      }
      
      // Registrar a alteração no log
      try {
        await logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: editingCell.value.field,
          dados_anteriores: processo[editingCell.value.field],
          dados_novos: updateValue
        })
      } catch (logError) {
        // Se o log falhar, apenas reportar o erro mas continuar
        console.warn('Erro no log de alterações:', logError)
      }
      
      console.log('Atualização concluída com sucesso')
      
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      // Exibir mensagem de erro para o usuário
      alert(`Erro ao atualizar campo: ${error.message || 'Verifique os dados e tente novamente'}`)
    } finally {
      cancelEdit()
    }
  }
  
  // Função auxiliar para registrar ações no log do sistema
  const logSystemAction = async (dados) => {
    try {
      // Verificar se dados essenciais foram fornecidos
      if (!dados || !dados.registro_id) {
        console.warn('Dados de log incompletos')
        return
      }
      
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('Usuário não autenticado para logging')
        return
      }
      
      // Preparar dados com valores padrão para evitar undefined
      const logData = {
        usuario_id: user.id,
        usuario_email: user.email,
        tipo: dados.tipo || 'atualizacao',
        tabela: dados.tabela || 'processos',
        registro_id: dados.registro_id,
        campo_alterado: dados.campo_alterado || 'status',
        dados_anteriores: dados.dados_anteriores || null,
        dados_novos: dados.dados_novos || null,
        data_hora: new Date().toISOString()
      }
      
      // Inserir log no banco de dados
      try {
        const { error } = await supabase
          .from('system_logs')
          .insert(logData)
          
        if (error && error.message && error.message.includes('does not exist')) {
          console.warn('Tabela system_logs não encontrada. Logging desativado.')
        } else if (error) {
          console.warn('Erro ao inserir log (não crítico):', error.message || 'Erro desconhecido')
        }
      } catch (error) {
        console.warn('Erro no sistema de logging (não crítico):', error && error.message ? error.message : 'Erro desconhecido')
      }
    } catch (error) {
      console.warn('Erro no processo de logging (não crítico):', error && error.message ? error.message : 'Erro desconhecido')
    }
  }
  
  return {
    editingCell,
    cancelEdit,
    handleDblClick,
    handleUpdate
  }
}