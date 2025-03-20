import { ref, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'

export function useEditableCells(loadProcessosFunction) {
  const editingCell = ref({
    id: null,
    field: null,
    value: null
  })

  const confirmDialog = ref({
    show: false,
    position: {},
    callback: null
  })

  const handleDblClick = async (field, processo, event) => {
    // Já está editando esta célula? Não faça nada
    if (editingCell.value.id === processo.id && editingCell.value.field === field) {
      return
    }

    // Obtém a posição para mostrar o diálogo de confirmação próximo à célula
    const cell = event.target.closest('td')
    const rect = cell.getBoundingClientRect()

    // Configura o diálogo de confirmação
    confirmDialog.value = {
      show: true,
      position: {
        top: `${rect.bottom + 10}px`,
        left: `${rect.left}px`
      },
      callback: () => {
        // Quando confirmado, inicia a edição
        editingCell.value = {
          id: processo.id,
          field,
          value: processo[field]
        }
      }
    }
  }

  const handleConfirmEdit = () => {
    // Executa o callback para iniciar a edição
    confirmDialog.value.callback?.()
    hideConfirmDialog()

    // Foca no campo de entrada após a renderização
    nextTick(() => {
      const input = document.querySelector('.editing-cell input, .editing-cell textarea, .editing-cell select')
      if (input) {
        input.focus()
        if (input.type === 'text') {
          input.selectionStart = input.selectionEnd = input.value.length
        }
      }
    })
  }

  const hideConfirmDialog = () => {
    confirmDialog.value = {
      show: false,
      position: {},
      callback: null
    }
  }

  // Função para registrar log das alterações
  const logSystemAction = async (dados) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
  
      const logData = {
        usuario_id: user.id,
        usuario_email: user.email,
        tipo: dados.tipo,
        tabela: dados.tabela,
        registro_id: dados.registro_id,
        campo_alterado: dados.campo_alterado,
        dados_anteriores: dados.dados_anteriores,
        dados_novos: dados.dados_novos,
        data_hora: new Date().toISOString()
      }
  
      const { error } = await supabase
        .from('system_logs')
        .insert(logData)
  
      if (error) throw error
    } catch (error) {
      console.error('Erro ao registrar log:', error)
    }
  }

  const handleUpdate = async (processo) => {
    try {
      // Modificar esta verificação para permitir strings vazias
      // Verificar apenas se o valor foi alterado em relação ao original
      if (editingCell.value.value === processo[editingCell.value.field]) {
        cancelEdit()
        return
      }

      let updateValue = editingCell.value.value
      const oldValue = processo[editingCell.value.field]
      
      // Formatação específica para alguns tipos de campos
      switch (editingCell.value.field) {
        case 'data_pregao':
          // Se estiver usando formato ISO (ano-mes-dia), mantenha assim
          if (updateValue.includes('-')) {
            // Já está no formato correto
          } else {
            // Convert DD/MM/YYYY para YYYY-MM-DD se necessário
            const [day, month, year] = updateValue.split('/')
            updateValue = `${year}-${month}-${day}`
          }
          break
        case 'hora_pregao':
          // Garante formato HH:mm
          updateValue = updateValue.split(':').slice(0, 2).join(':')
          break
        case 'sistemas_ativos':
          // Garante que é um array
          updateValue = Array.isArray(updateValue) ? updateValue : []
          break
      }

      // Em useEditableCells.js, dentro de handleUpdate
      if (editingCell.value.field === 'sistemas_ativos') {
        // Certifica que estamos lidando com um array
        updateValue = Array.isArray(editingCell.value.value) ? editingCell.value.value : []
      }

      // Prepara dados para atualização
      const updateData = {
        [editingCell.value.field]: updateValue,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }

      // Atualiza no banco de dados
      const { error } = await supabase
        .from('processos')
        .update(updateData)
        .eq('id', processo.id)

      if (error) throw error

      // Log da alteração
      await logSystemAction({
        tipo: 'atualizacao',
        tabela: 'processos', 
        registro_id: processo.id,
        campo_alterado: editingCell.value.field,
        dados_anteriores: oldValue,
        dados_novos: updateValue
      })

      // Após atualização bem-sucedida, adicionar classe temporária para feedback visual
      const cellElement = document.querySelector(`td[data-field="${editingCell.value.field}"][data-id="${processo.id}"]`)
      if (cellElement) {
        cellElement.classList.add('saved-success')
        setTimeout(() => {
          cellElement.classList.remove('saved-success')
        }, 1000)
      }

      // Recarregar processos
      await loadProcessosFunction()

    } catch (error) {
      console.error('Erro ao atualizar:', error)
      // Exibe mensagem de erro para o usuário
      alert('Erro ao atualizar o campo. Por favor, tente novamente.')
    } finally {
      cancelEdit()
    }
  }

  const cancelEdit = () => {
    editingCell.value = {
      id: null,
      field: null,
      value: null
    }
  }

  return {
    editingCell,
    confirmDialog,
    handleDblClick,
    handleConfirmEdit,
    hideConfirmDialog,
    handleUpdate,
    cancelEdit,
    logSystemAction
  }
}