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
      console.log('[DEBUG] Iniciando carregamento de empresas...');
      isLoading.value = true;
      loadError.value = '';
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('[ERROR] Erro ao carregar empresas:', error);
        loadError.value = `Erro ao carregar empresas: ${error.message}`;
        isLoading.value = false;
        return false;
      }
      
      // Limpar dados antigos e adicionar novos
      empresas.value = [];
      empresas.value = data || [];
      console.log(`[DEBUG] Empresas carregadas: ${empresas.value.length}`, empresas.value);
      isLoading.value = false;
      return true;
    } catch (error) {
      console.error('[ERROR] Exceção ao carregar empresas:', error);
      loadError.value = `Erro ao carregar empresas: ${error.message}`;
      isLoading.value = false;
      return false;
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

  // Adicionar logs mais detalhados à função salvarEmpresa
  const salvarEmpresa = async (dadosEmpresa) => {
    try {
      console.log('[DEBUG] Iniciando função salvarEmpresa', { dadosEmpresa });
      
      // Se estiver editando, usar método alternativo
      if (isEditing.value && editingId.value) {
        console.log('[DEBUG] Modo edição detectado, usando updateEmpresaDirectly');
        formData.value = dadosEmpresa; // Certifique-se de atualizar o formData
        return await updateEmpresaDirectly();
      }
      
      // Validar campos obrigatórios
      if (!dadosEmpresa.nome || !dadosEmpresa.cnpj || !dadosEmpresa.razao_social) {
        console.error('[ERROR] Campos obrigatórios não preenchidos');
        showToastMessage('Nome, CNPJ e Razão Social são obrigatórios', 'error');
        return false;
      }
      
      // Remove caracteres não numéricos do CNPJ
      const cnpjLimpo = dadosEmpresa.cnpj.replace(/[^\d]/g, '');
      console.log('[DEBUG] CNPJ limpo para salvar:', cnpjLimpo);
      
      // Verificar se CNPJ já existe
      console.log('[DEBUG] Verificando se CNPJ já existe no banco');
      const { data: existingCnpj, error: cnpjCheckError } = await supabase
        .from('empresas')
        .select('id')
        .eq('cnpj', cnpjLimpo);
      
      if (cnpjCheckError) {
        console.error('[ERROR] Erro ao verificar CNPJ existente:', cnpjCheckError);
        showToastMessage(`Erro ao verificar CNPJ: ${cnpjCheckError.message}`, 'error');
        return false;
      }
          
      if (existingCnpj && existingCnpj.length > 0) {
        console.warn('[WARN] CNPJ já cadastrado:', existingCnpj);
        showToastMessage('CNPJ já cadastrado no sistema', 'error');
        return false;
      }
      
      // Preparar objeto com todos os dados para inserção
      const empresaData = {
        nome: dadosEmpresa.nome,
        cnpj: cnpjLimpo,
        razao_social: dadosEmpresa.razao_social,
        contato: dadosEmpresa.contato || null,
        telefone: dadosEmpresa.telefone || null,
        email: dadosEmpresa.email || null,
        color: dadosEmpresa.color || '#FFFFFF',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('[DEBUG] Dados preparados para inserção:', empresaData);
      
      // Inserir nova empresa
      const { data: insertData, error: insertError } = await supabase
        .from('empresas')
        .insert(empresaData)
        .select();
        
      if (insertError) {
        console.error('[ERROR] Erro ao inserir empresa:', insertError);
        
        if (insertError.code === '23505') {
          showToastMessage('CNPJ já cadastrado no sistema', 'error');
        } else {
          showToastMessage(`Erro ao salvar empresa: ${insertError.message}`, 'error');
        }
        return false;
      }
      
      console.log('[SUCCESS] Empresa cadastrada com sucesso!', insertData);
      showToastMessage('Empresa cadastrada com sucesso!', 'success');
      
      console.log('[DEBUG] Recarregando lista de empresas');
      await fetchEmpresas();
      showModal.value = false;
      resetForm();
      return true;
    } catch (error) {
      console.error('[ERROR] Exceção ao salvar empresa:', error);
      showToastMessage(`Erro ao salvar empresa: ${error.message}`, 'error');
      return false;
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
      console.log('[DEBUG] Usando método alternativo de atualização');
      
      if (!isEditing.value || !editingId.value) {
        console.error('[ERROR] Tentativa de atualizar sem estar em modo de edição');
        return false;
      }
      
      // Validar campos obrigatórios
      if (!formData.value.nome || !formData.value.cnpj || !formData.value.razao_social) {
        console.error('[ERROR] Campos obrigatórios não preenchidos');
        showToastMessage('Nome, CNPJ e Razão Social são obrigatórios', 'error');
        return false;
      }
      
      // Remove caracteres não numéricos do CNPJ do formulário
      const cnpjLimpo = formData.value.cnpj.replace(/[^\d]/g, '');
      console.log('[DEBUG] CNPJ limpo para atualização:', cnpjLimpo);
      
      // Primeiro, recupera a empresa atual para comparar o CNPJ
      console.log('[DEBUG] Buscando dados atuais da empresa ID:', editingId.value);
      const { data: currentEmpresa, error: fetchError } = await supabase
        .from('empresas')
        .select('cnpj')
        .eq('id', editingId.value)
        .single();
        
      if (fetchError) {
        console.error('[ERROR] Erro ao buscar empresa atual:', fetchError);
        throw fetchError;
      }
      
      console.log('[DEBUG] Dados atuais:', currentEmpresa);
      
      // Se o CNPJ mudou, verificar duplicidade
      if (currentEmpresa.cnpj !== cnpjLimpo) {
        console.log('[DEBUG] CNPJ foi alterado, verificando disponibilidade');
        
        // Buscar todas as empresas com este CNPJ 
        const { data: existingWithCnpj, error: cnpjCheckError } = await supabase
          .from('empresas')
          .select('id, cnpj')
          .eq('cnpj', cnpjLimpo);
          
        if (cnpjCheckError) {
          console.error('[ERROR] Erro ao verificar duplicidade de CNPJ:', cnpjCheckError);
          throw cnpjCheckError;
        }
          
        if (existingWithCnpj && existingWithCnpj.length > 0) {
          // Verificar se algum dos resultados não é a empresa atual
          const isDuplicate = existingWithCnpj.some(e => e.id !== editingId.value);
          console.log('[DEBUG] Verificação de duplicidade:', { existingWithCnpj, isDuplicate });
          
          if (isDuplicate) {
            console.warn('[WARN] CNPJ já usado por outra empresa');
            showToastMessage('CNPJ já cadastrado no sistema', 'error');
            return false;
          }
        }
      } else {
        console.log('[DEBUG] CNPJ não foi alterado, continuando');
      }
      
      // Prepara dados para salvar, garantindo que todos os campos são incluídos
      const empresaData = {
        nome: formData.value.nome,
        cnpj: cnpjLimpo,
        razao_social: formData.value.razao_social,
        contato: formData.value.contato || null,
        telefone: formData.value.telefone || null,
        email: formData.value.email || null,
        color: formData.value.color || '#FFFFFF',
        updated_at: new Date().toISOString()
      };
      
      console.log('[DEBUG] Dados para atualizar:', empresaData);
      
      // Atualiza a empresa
      const { data: updateData, error: updateError } = await supabase
        .from('empresas')
        .update(empresaData)
        .eq('id', editingId.value)
        .select();
        
      if (updateError) {
        console.error('[ERROR] Erro na atualização:', updateError);
        showToastMessage(`Erro ao atualizar empresa: ${updateError.message}`, 'error');
        return false;
      }
      
      console.log('[SUCCESS] Empresa atualizada com sucesso', updateData);
      showToastMessage('Empresa atualizada com sucesso!', 'success');
      
      console.log('[DEBUG] Recarregando lista de empresas');
      await fetchEmpresas();
      showModal.value = false;
      resetForm();
      return true;
    } catch (error) {
      console.error('[ERROR] Exceção no método de atualização:', error);
      showToastMessage(`Erro ao atualizar empresa: ${error.message}`, 'error');
      return false;
    }
  };

  return {
    empresas,
    isLoading,
    loadError,
    showModal,
    formData,
    isEditing,
    editingId,
    empresaToDelete,
    showDeleteDialog,
    toastMessage,
    toastType,
    showToast,
    fetchEmpresas,
    salvarEmpresa,  // Esta função deve receber os dados do formulário
    editEmpresa,
    resetForm,
    prepararExclusao,
    confirmarExclusao,
    hideDeleteDialog,
    showToastMessage,
    initialize,
    updateEmpresaDirectly
  };
}