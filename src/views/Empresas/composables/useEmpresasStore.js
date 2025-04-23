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
  
  // Cores predefinidas para seleção rápida
  const predefinedColors = [
    '#FFFFFF', // Branco
    '#193155', // Azul escuro (cor da E&L)
    '#4285F4', // Azul Google
    '#34A853', // Verde Google
    '#FBBC05', // Amarelo Google
    '#EA4335', // Vermelho Google
    '#9C27B0', // Roxo
    '#3F51B5', // Índigo
    '#00BCD4', // Ciano
    '#009688', // Verde-azulado
    '#8BC34A', // Verde claro
    '#FFEB3B', // Amarelo
    '#FF9800', // Laranja
    '#795548', // Marrom
    '#607D8B'  // Azul acinzentado
  ];

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
      console.log('Iniciando salvarEmpresa');
      
      // Se estiver editando, usar método alternativo
      if (isEditing.value && editingId.value) {
        console.log('Usando método alternativo para edição');
        return await updateEmpresaDirectly();
      }
      
      // Código existente para inserção...
      
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      // resto do tratamento de erro...
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

  // Adicione uma função de validação de CNPJ específica para edição

  // Função para validar CNPJ durante a edição (evitando o erro 406)
  const validateCnpjForEdit = async (cnpj, editingId) => {
    console.log('validateCnpjForEdit iniciado com:', { cnpj, editingId });
    
    if (!cnpj) return { isValid: false, message: 'CNPJ é obrigatório' };
    
    // Remove caracteres não numéricos do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    console.log('CNPJ limpo:', cnpjLimpo);
    
    if (cnpjLimpo.length !== 14) {
      return { isValid: false, message: 'CNPJ inválido' };
    }
    
    try {
      // Modificação aqui: buscar primeiro sem condições para verificar disponibilidade
      console.log('Buscando empresas com CNPJ:', cnpjLimpo);
      
      // Abordagem corrigida: primeiro buscar todas as empresas com este CNPJ
      const { data, error } = await supabase
        .from('empresas')
        .select('id, cnpj')
        .eq('cnpj', cnpjLimpo);
        
      if (error) {
        console.error('Erro na consulta de CNPJ:', error);
        throw error;
      }
      
      console.log('Empresas encontradas com este CNPJ:', data);
      
      // Se não encontrou nenhuma, o CNPJ é válido para uso
      if (!data || data.length === 0) {
        console.log('Nenhuma empresa encontrada com este CNPJ, está disponível');
        return { isValid: true, message: '' };
      }
      
      // Se encontrou alguma, verificar se é a própria empresa que está sendo editada
      const cnpjDuplicado = data.some(item => {
        // Garantir que ambos são strings para comparação
        const itemId = String(item.id);
        const currentId = String(editingId);
        console.log(`Comparando: ID encontrado ${itemId} com editingId ${currentId}`);
        return itemId !== currentId;
      });
      
      if (cnpjDuplicado) {
        console.log('CNPJ já está em uso por outra empresa');
        return { isValid: false, message: 'CNPJ já cadastrado para outra empresa' };
      }
      
      console.log('CNPJ é da própria empresa, pode seguir');
      return { isValid: true, message: '' };
    } catch (error) {
      console.error('Erro ao validar CNPJ:', error);
      return { isValid: false, message: `Erro ao validar CNPJ: ${error.message}` };
    }
  };

  // Função alternativa para atualizar empresa diretamente
  const updateEmpresaDirectly = async () => {
    try {
      console.log('Usando método alternativo de atualização');
      
      if (!isEditing.value || !editingId.value) {
        console.error('Tentativa de atualizar sem estar em modo de edição');
        return false;
      }
      
      // Primeiro, recupera a empresa atual para comparar o CNPJ
      const { data: currentEmpresa, error: fetchError } = await supabase
        .from('empresas')
        .select('cnpj')
        .eq('id', editingId.value)
        .single();
        
      if (fetchError) {
        console.error('Erro ao buscar empresa atual:', fetchError);
        throw fetchError;
      }
      
      console.log('Dados atuais:', currentEmpresa);
      
      // Remove caracteres não numéricos do CNPJ do formulário
      const cnpjLimpo = formData.value.cnpj.replace(/[^\d]/g, '');
      
      // Se o CNPJ mudou, verificar duplicidade
      if (currentEmpresa.cnpj !== cnpjLimpo) {
        console.log('CNPJ foi alterado, verificando disponibilidade');
        
        // Buscar todas as empresas com este CNPJ 
        // (a verificação se é da própria empresa será feita em JavaScript)
        const { data: existingWithCnpj } = await supabase
          .from('empresas')
          .select('id, cnpj')
          .eq('cnpj', cnpjLimpo);
          
        if (existingWithCnpj && existingWithCnpj.length > 0) {
          // Verificar se algum dos resultados não é a empresa atual
          const isDuplicate = existingWithCnpj.some(e => e.id !== editingId.value);
          
          if (isDuplicate) {
            console.log('CNPJ já usado por outra empresa');
            showToastMessage('CNPJ já cadastrado no sistema', 'error');
            return false;
          }
        }
      } else {
        console.log('CNPJ não foi alterado, continuando');
      }
      
      // Prepara dados para salvar
      const empresaData = {
        nome: formData.value.nome,
        cnpj: cnpjLimpo,
        razao_social: formData.value.razao_social,
        contato: formData.value.contato,
        telefone: formData.value.telefone,
        email: formData.value.email,
        color: formData.value.color,
        updated_at: new Date().toISOString()
      };
      
      console.log('Dados para atualizar:', empresaData);
      
      // Atualiza a empresa
      const { error: updateError } = await supabase
        .from('empresas')
        .update(empresaData)
        .eq('id', editingId.value);
        
      if (updateError) {
        console.error('Erro na atualização:', updateError);
        throw updateError;
      }
      
      console.log('Empresa atualizada com sucesso');
      showToastMessage('Empresa atualizada com sucesso!');
      
      await fetchEmpresas();
      resetForm();
      return true;
    } catch (error) {
      console.error('Erro no método alternativo:', error);
      showToastMessage(`Erro ao atualizar empresa: ${error.message}`, 'error');
      return false;
    }
  };

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
    initialize,
    validateCnpjForEdit,
    updateEmpresaDirectly,
    predefinedColors
  }
}