import { useToast } from './useToast'

export function usePublicationHandler(publicacaoText, processarPublicacao, closeImportModal, formData) {
  const { showToast } = useToast()

  // Função para processar uma publicação
  const handleProcessPublication = async () => {
    if (!publicacaoText.value) {
      showToast('Insira o texto da publicação', 'warning')
      return
    }
    
    try {
      const result = await processarPublicacao(formData.value)
      
      if (result.success) {
        Object.assign(formData.value, result.data)
        
        showToast(result.fromCache 
          ? 'Dados recuperados do cache com sucesso!'
          : 'Processamento concluído com sucesso!', 'success')
        
        setTimeout(() => closeImportModal(), 1500)
      } else {
        showToast('Erro ao processar publicação', 'error')
      }
    } catch (error) {
      console.error('Erro ao processar publicação:', error)
      showToast('Erro ao processar publicação', 'error')
    }
  }

  return {
    handleProcessPublication
  }
}