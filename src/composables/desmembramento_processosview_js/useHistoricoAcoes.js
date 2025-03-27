import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useHistoricoAcoes() {
  const undoHistory = ref([])
  const redoHistory = ref([])
  const MAX_HISTORY_SIZE = 50
  
  const handleKeyDown = (event) => {
    // Ctrl+Z para desfazer
    if (event.ctrlKey && event.key === 'z') {
      event.preventDefault()
      undoAction()
    }
    // Ctrl+Y para refazer
    else if (event.ctrlKey && event.key === 'y') {
      event.preventDefault()
      redoAction()
    }
  }
  
  const undoAction = async () => {
    try {
      if (undoHistory.value.length === 0) {
        console.log('Nada para desfazer')
        return
      }
      
      const lastAction = undoHistory.value.pop()
      console.log('Desfazendo ação:', lastAction)
      
      // Adicionar ao histórico de refazer
      redoHistory.value.push({
        id: lastAction.id,
        field: lastAction.field,
        oldValue: lastAction.newValue, // Inverte valores
        newValue: lastAction.oldValue
      })
      
      // Atualizar no banco de dados
      const updateData = {
        [lastAction.field]: lastAction.oldValue,
        updated_at: new Date().toISOString()
      }
      
      // Adicionar usuário que está fazendo a alteração
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        updateData.updated_by = user.id
      }
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('processos')
        .update(updateData)
        .eq('id', lastAction.id)
      
      if (error) throw error
      
      // Registrar no log do sistema
      await logSystemAction({
        tipo: 'desfazer',
        tabela: 'processos',
        registro_id: lastAction.id,
        campo_alterado: lastAction.field,
        dados_anteriores: lastAction.newValue,
        dados_novos: lastAction.oldValue
      })
      
      // Recarregar os dados
      // Nota: Esta parte deve ser implementada no componente principal
      // ou em um composable específico para gerenciamento de processos
      
      // Mostrar mensagem de confirmação
      // Nota: Esta parte deve ser implementada no componente principal
      // ou em um composable específico para notificações
      
    } catch (error) {
      console.error('Erro ao desfazer ação:', error)
    }
  }
  
  const redoAction = async () => {
    try {
      if (redoHistory.value.length === 0) {
        console.log('Nada para refazer')
        return
      }
      
      const nextAction = redoHistory.value.pop()
      console.log('Refazendo ação:', nextAction)
      
      // Adicionar de volta ao histórico de desfazer
      undoHistory.value.push({
        id: nextAction.id,
        field: nextAction.field,
        oldValue: nextAction.newValue, // Inverte valores
        newValue: nextAction.oldValue
      })
      
      // Atualizar no banco de dados
      const updateData = {
        [nextAction.field]: nextAction.oldValue,
        updated_at: new Date().toISOString()
      }
      
      // Adicionar usuário que está fazendo a alteração
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        updateData.updated_by = user.id
      }
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('processos')
        .update(updateData)
        .eq('id', nextAction.id)
      
      if (error) throw error
      
      // Registrar no log do sistema
      await logSystemAction({
        tipo: 'refazer',
        tabela: 'processos',
        registro_id: nextAction.id,
        campo_alterado: nextAction.field,
        dados_anteriores: nextAction.newValue,
        dados_novos: nextAction.oldValue
      })
      
      // Recarregar os dados
      // Nota: Esta parte deve ser implementada no componente principal
      // ou em um composable específico para gerenciamento de processos
      
      // Mostrar mensagem de confirmação
      // Nota: Esta parte deve ser implementada no componente principal
      // ou em um composable específico para notificações
      
    } catch (error) {
      console.error('Erro ao refazer ação:', error)
      alert('Erro ao refazer: ' + (error.message || 'Verifique os dados e tente novamente'))
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
  
  // Função para adicionar uma ação ao histórico
  const addToHistory = (action) => {
    undoHistory.value.push(action)
    
    // Limitar o tamanho do histórico
    if (undoHistory.value.length > MAX_HISTORY_SIZE) {
      undoHistory.value.shift() // Remove o item mais antigo
    }
    
    // Limpar o histórico de refazer sempre que uma nova alteração é feita
    redoHistory.value = []
  }
  
  return {
    undoHistory,
    redoHistory,
    handleKeyDown,
    undoAction,
    redoAction,
    addToHistory
  }
}