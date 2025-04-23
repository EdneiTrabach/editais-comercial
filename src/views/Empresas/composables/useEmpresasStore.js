import { ref, toRaw, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatCNPJ } from '../functions/formatacao';

export function useEmpresasStore() {
  // Estado
  const empresas = ref([])
  const isLoading = ref(false)
  const loadError = ref(null)
  const showModal = ref(false)
  const showDeleteDialog = ref(false)
  const empresaToDelete = ref(null)
  const isEditing = ref(false)
  const editingId = ref(null)
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastType = ref('success')
  
  // Form data
  const formData = ref({
    nome: '',
    cnpj: '',
    razao_social: '',
    contato: '',
    telefone: '',
    email: '',
    color: '#FFFFFF'
  })
  
  // Getters - retornam valores não-reativos
  const getEmpresas = () => toRaw(empresas.value)
  const getIsLoading = () => isLoading.value
  const getLoadError = () => loadError.value
  const getShowModal = () => showModal.value
  const getShowDeleteDialog = () => showDeleteDialog.value
  const getEmpresaToDelete = () => empresaToDelete.value ? {...toRaw(empresaToDelete.value)} : null
  const getIsEditing = () => isEditing.value
  const getEditingId = () => editingId.value
  const getFormData = () => ({...toRaw(formData.value)})
  const getShowToast = () => showToast.value
  const getToastMessage = () => toastMessage.value
  const getToastType = () => toastType.value
  
  // Carrega as empresas
  const fetchEmpresas = async () => {
    try {
      isLoading.value = true
      loadError.value = null
      
      console.log('[DEBUG] Iniciando carregamento de empresas...')
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome')

      if (error) {
        console.error('[DEBUG] Erro retornado pelo Supabase:', error)
        loadError.value = 'Falha ao carregar empresas. Por favor, tente novamente.'
        return false
      }
      
      if (Array.isArray(data)) {
        empresas.value = data
        console.log('[DEBUG] Empresas carregadas:', empresas.value.length)
      } else {
        console.error('[DEBUG] Dados não são um array:', data)
        empresas.value = []
      }
      
      return true
    } catch (error) {
      console.error('[DEBUG] Erro ao carregar empresas:', error)
      loadError.value = 'Falha ao carregar empresas. Por favor, tente novamente.'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // Editar empresa
  const editEmpresa = (empresa) => {
    formData.value = {
      nome: empresa.nome || '',
      cnpj: formatCNPJ(empresa.cnpj) || '',
      razao_social: empresa.razao_social || '',
      contato: empresa.contato || '',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
      color: empresa.color || '#FFFFFF'
    }
    editingId.value = empresa.id
    isEditing.value = true
    showModal.value = true
  }

  // Preparar exclusão
  const prepararExclusao = async (empresa) => {
    try {
      // Verificar se existem dados vinculados
      const { data: vinculacoes, error: checkError } = await supabase
        .from('empresa_plataforma_dados')
        .select('id')
        .eq('empresa_id', empresa.id)
      
      if (checkError) throw checkError
      
      // Configurar diálogo de confirmação
      empresaToDelete.value = {
        ...empresa,
        temVinculacoes: vinculacoes && vinculacoes.length > 0,
        qtdVinculacoes: vinculacoes ? vinculacoes.length : 0
      }
      
      // Mostrar diálogo
      showDeleteDialog.value = true
    } catch (error) {
      console.error('Erro ao verificar vinculações da empresa:', error)
      showToastMessage('Erro ao verificar vinculações da empresa', 'error')
    }
  }

  // Confirmar exclusão
  const confirmarExclusao = async () => {
    if (!empresaToDelete.value) return
    
    try {
      const empresa = empresaToDelete.value
      
      if (empresa.temVinculacoes) {
        // Excluir primeiro as vinculações
        const { error: deleteVinculacoesError } = await supabase
          .from('empresa_plataforma_dados')
          .delete()
          .eq('empresa_id', empresa.id)
        
        if (deleteVinculacoesError) throw deleteVinculacoesError
      }

      // Agora excluir a empresa
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresa.id)

      if (error) throw error
      
      await fetchEmpresas()
      showToastMessage('Empresa excluída com sucesso!', 'success')
      hideDeleteDialog()
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      showToastMessage(error.message || 'Erro ao excluir empresa', 'error')
      hideDeleteDialog()
    }
  }

  // Salvar empresa (nova ou edição)
  const salvarEmpresa = async () => {
    try {
      // Remove caracteres não numéricos do CNPJ
      const cnpjLimpo = formData.value.cnpj.replace(/[^\d]/g, '')
      
      const empresaData = {
        nome: formData.value.nome,
        cnpj: cnpjLimpo,
        razao_social: formData.value.razao_social,
        contato: formData.value.contato,
        telefone: formData.value.telefone,
        email: formData.value.email,
        color: formData.value.color,
        updated_at: new Date().toISOString()
      }

      if (isEditing.value && editingId.value) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('empresas')
          .update(empresaData)
          .eq('id', editingId.value)

        if (error) throw error
        showToastMessage('Empresa atualizada com sucesso!')
      } else {
        // Inserir nova empresa
        const { error } = await supabase
          .from('empresas')
          .insert(empresaData)

        if (error) throw error
        showToastMessage('Empresa cadastrada com sucesso!')
      }

      await fetchEmpresas()
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar empresa:', error)
      
      if (error.code === '23505') {
        showToastMessage('CNPJ já cadastrado no sistema', 'error')
      } else {
        showToastMessage('Erro ao salvar empresa. Por favor, tente novamente.', 'error')
      }
    }
  }

  // Reset form
  const resetForm = () => {
    formData.value = {
      nome: '',
      cnpj: '',
      razao_social: '',
      contato: '',
      telefone: '',
      email: '',
      color: '#FFFFFF'
    }
    editingId.value = null
    isEditing.value = false
    showModal.value = false
  }

  // Esconder diálogo de exclusão
  const hideDeleteDialog = () => {
    console.log('hideDeleteDialog chamado! Fechando dialog de exclusão');
    showDeleteDialog.value = false;
    empresaToDelete.value = null;
  };

  // Exibir mensagem toast
  const showToastMessage = (message, type = 'success') => {
    toastMessage.value = message
    toastType.value = type
    showToast.value = true
    
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }

  // Função de inicialização para garantir que todos os modais estejam fechados
  const initialize = () => {
    console.log('Inicializando store de empresas...');
    showModal.value = false;
    showDeleteDialog.value = false;
    empresaToDelete.value = null;
    resetForm();
    showToast.value = false;
    
    // Importante: garantindo que formData está limpo
    formData.value = {
      nome: '',
      cnpj: '',
      razao_social: '',
      contato: '',
      telefone: '',
      email: '',
      color: '#FFFFFF'
    };
    
    // Garantir que editingId e isEditing estão resetados
    editingId.value = null;
    isEditing.value = false;
  };

  // Observe quando showDeleteDialog é alterado
  watch(showDeleteDialog, (newValue) => {
    console.log(`showDeleteDialog mudou para: ${newValue}`);
    if (newValue === true) {
      console.trace('showDeleteDialog definido como TRUE. Stack trace:');
    }
  });

  // Chamar initialize ao criar o store
  initialize()

  return {
    // Expose state
    empresas,
    isLoading, 
    loadError,
    showModal,
    showDeleteDialog,
    empresaToDelete,
    isEditing,
    editingId,
    formData,
    showToast,
    toastMessage,
    toastType,
    
    // Expose getters
    getEmpresas,
    getIsLoading,
    getLoadError,
    getShowModal,
    getShowDeleteDialog,
    getEmpresaToDelete,
    getIsEditing,
    getEditingId,
    getFormData,
    getShowToast,
    getToastMessage,
    getToastType,
    
    // Métodos...
    fetchEmpresas,
    salvarEmpresa,
    editEmpresa,
    resetForm,
    prepararExclusao,
    confirmarExclusao,
    hideDeleteDialog,
    initialize
  }
}