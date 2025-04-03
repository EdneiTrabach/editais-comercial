import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'

export default {
  components: {
    TheSidebar
  },
  setup() {
    const empresas = ref([])
    const showModal = ref(false)
    const isSidebarExpanded = ref(true)
    const cnpjError = ref('')
    const isLoading = ref(false)
    const loadError = ref(null)
    const isEditing = ref(false);
    const editingId = ref(null); 

    const showDeleteDialog = ref(false);
    const empresaToDelete = ref(null);
    const showToast = ref(false);
    const toastMessage = ref('');
    const toastType = ref('success'); // 'success' ou 'error'

    const formData = ref({
      nome: '',
      cnpj: '',
      razao_social: '',
      contato: '',
      telefone: '',
      email: '',
      color: '#FFFFFF' // Valor default para cor
    })

    // Cores predefinidas para seleção rápida
    const predefinedColors = ref([
      '#FFFFFF', '#193155', '#4285F4', '#34A853', '#FBBC05', '#EA4335', 
      '#9C27B0', '#3F51B5', '#00BCD4', '#009688', '#8BC34A', '#FFEB3B', 
      '#FF9800', '#795548', '#607D8B'
    ]);

    const loadEmpresas = async () => {
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
          throw error
        }
        
        // Log detalhado dos dados recebidos
        console.log('[DEBUG] Dados brutos recebidos:', data)
        
        if (Array.isArray(data)) {
          empresas.value = data
          console.log('[DEBUG] Empresas carregadas:', empresas.value.length)
          
          // Log com detalhes da primeira empresa (se existir)
          if (empresas.value.length > 0) {
            console.log('[DEBUG] Primeira empresa:', JSON.stringify(empresas.value[0]))
          }
        } else {
          console.error('[DEBUG] Dados não são um array:', data)
          empresas.value = []
        }
      } catch (error) {
        console.error('[DEBUG] Erro ao carregar empresas:', error)
        loadError.value = 'Falha ao carregar empresas. Por favor, tente novamente.'
      } finally {
        isLoading.value = false
      }
    }

    const handleSubmit = async () => {
      try {
        // Remove caracteres não numéricos do CNPJ
        const cnpjLimpo = formData.value.cnpj.replace(/[^\d]/g, '');
        
        // Se estiver editando, não precisa verificar o próprio CNPJ como duplicado
        if (!isEditing.value) {
          if (!await validateCNPJ()) {
            return;
          }
        } else {
          // Validação de CNPJ para edição (ignora o próprio registro)
          if (!formData.value.cnpj) {
            cnpjError.value = 'CNPJ é obrigatório';
            return false;
          }
          
          if (cnpjLimpo.length !== 14) {
            cnpjError.value = 'CNPJ inválido';
            return false;
          }
          
          // Verifica se o CNPJ existe em outro registro
          const { data } = await supabase
            .from('empresas')
            .select('id')
            .eq('cnpj', cnpjLimpo)
            .neq('id', editingId.value)
            .single();

          if (data) {
            cnpjError.value = 'CNPJ já cadastrado';
            return false;
          }
          
          cnpjError.value = '';
        }

        const empresaData = {
          nome: formData.value.nome,
          cnpj: cnpjLimpo,
          razao_social: formData.value.razao_social,
          contato: formData.value.contato,
          telefone: formData.value.telefone,
          email: formData.value.email,
          color: formData.value.color, // Salva a cor selecionada
          updated_at: new Date().toISOString()
        };

        if (isEditing.value) {
          // Atualizar empresa existente
          const { error } = await supabase
            .from('empresas')
            .update(empresaData)
            .eq('id', editingId.value);

          if (error) throw error;
          showToastMessage('Empresa atualizada com sucesso!');
        } else {
          // Inserir nova empresa
          const { error } = await supabase
            .from('empresas')
            .insert(empresaData);

          if (error) throw error;
          showToastMessage('Empresa cadastrada com sucesso!');
        }

        await loadEmpresas();
        resetForm();
      } catch (error) {
        console.error('Erro ao salvar empresa:', error);
        
        if (error.code === '23505') {
          showToastMessage('CNPJ já cadastrado no sistema', 'error');
        } else {
          showToastMessage('Erro ao salvar empresa. Por favor, tente novamente.', 'error');
        }
      }
    }

    const validateCNPJ = async () => {
      if (!formData.value.cnpj) {
        cnpjError.value = 'CNPJ é obrigatório'
        return false
      }

      // Remove caracteres especiais para validação
      const cnpj = formData.value.cnpj.replace(/[^\d]/g, '')
      
      if (cnpj.length !== 14) {
        cnpjError.value = 'CNPJ inválido'
        return false
      }

      // Consulta SQL equivalente:
      // SELECT id FROM empresas WHERE cnpj = ? LIMIT 1;
      const { data } = await supabase
        .from('empresas')
        .select('id')
        .eq('cnpj', cnpj)
        .single()

      if (data) {
        cnpjError.value = 'CNPJ já cadastrado'
        return false
      }

      cnpjError.value = ''
      return true
    }

    const handleDelete = async (empresa) => {
      try {
        // Primeiro verifica se existem dados vinculados
        const { data: vinculacoes, error: checkError } = await supabase
          .from('empresa_plataforma_dados')
          .select('id')
          .eq('empresa_id', empresa.id);
        
        if (checkError) throw checkError;
        
        // Configura o diálogo de confirmação
        empresaToDelete.value = {
          ...empresa,
          temVinculacoes: vinculacoes && vinculacoes.length > 0,
          qtdVinculacoes: vinculacoes ? vinculacoes.length : 0
        };
        
        // Mostra o diálogo de confirmação
        showDeleteDialog.value = true;
        
      } catch (error) {
        console.error('Erro ao verificar vinculações da empresa:', error);
        showToastMessage('Erro ao verificar vinculações da empresa', 'error');
      }
    }

    const confirmDelete = async () => {
      if (!empresaToDelete.value) return;
      
      try {
        const empresa = empresaToDelete.value;
        
        if (empresa.temVinculacoes) {
          // Exclui primeiro as vinculações
          const { error: deleteVinculacoesError } = await supabase
            .from('empresa_plataforma_dados')
            .delete()
            .eq('empresa_id', empresa.id);
          
          if (deleteVinculacoesError) throw deleteVinculacoesError;
        }

        // Agora exclui a empresa
        const { error } = await supabase
          .from('empresas')
          .delete()
          .eq('id', empresa.id);

        if (error) throw error;
        
        await loadEmpresas();
        showToastMessage('Empresa excluída com sucesso!', 'success');
        hideDeleteDialog();
      } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        showToastMessage(error.message || 'Erro ao excluir empresa', 'error');
        hideDeleteDialog();
      }
    }

    const hideDeleteDialog = () => {
      showDeleteDialog.value = false;
      empresaToDelete.value = null;
    }

    const formatCNPJ = (cnpj) => {
      if (!cnpj) return '-'
      
      // Formata o CNPJ no padrão 00.000.000/0000-00
      cnpj = cnpj.replace(/[^\d]/g, '')
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }

    const formatarCNPJ = (e) => {
      let value = e.target.value.replace(/\D/g, '')
      if (value.length > 14) value = value.substring(0, 14)
      
      // Formato: 00.000.000/0000-00
      if (value.length > 12) {
        formData.value.cnpj = 
          value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
      } else if (value.length > 8) {
        formData.value.cnpj = 
          value.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1.$2.$3/$4")
      } else if (value.length > 5) {
        formData.value.cnpj = 
          value.replace(/^(\d{2})(\d{3})(\d+)$/, "$1.$2.$3")
      } else if (value.length > 2) {
        formData.value.cnpj = 
          value.replace(/^(\d{2})(\d+)$/, "$1.$2")
      } else {
        formData.value.cnpj = value
      }
    }

    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }

    const loadData = async () => {
      await loadEmpresas()
    }

    useConnectionManager(loadData)

    onMounted(() => {
      console.log('Componente montado, carregando empresas...')
      loadEmpresas()
    })

    const debugEmpresas = () => {
      console.log('[DEBUG] Estado do componente:')
      console.log('[DEBUG] isLoading:', isLoading.value)
      console.log('[DEBUG] loadError:', loadError.value)
      console.log('[DEBUG] empresas.length:', empresas.value?.length)
      console.log('[DEBUG] empresas:', JSON.stringify(empresas.value))
      
      supabase
        .from('empresas')
        .select('*')
        .then(response => {
          console.log('[DEBUG] Resposta direta:', response)
        })
        .catch(error => {
          console.error('[DEBUG] Erro na busca direta:', error)
        })
    }

    const editEmpresa = (empresa) => {
      formData.value = {
        nome: empresa.nome,
        cnpj: formatCNPJ(empresa.cnpj),
        razao_social: empresa.razao_social,
        contato: empresa.contato || '',
        telefone: empresa.telefone || '',
        email: empresa.email || '',
        color: empresa.color || '#FFFFFF' // Adiciona a cor da empresa
      };
      editingId.value = empresa.id;
      isEditing.value = true;
      showModal.value = true;
    }

    const resetForm = () => {
      formData.value = {
        nome: '',
        cnpj: '',
        razao_social: '',
        contato: '',
        telefone: '',
        email: '',
        color: '#FFFFFF'
      };
      editingId.value = null;
      isEditing.value = false;
      showModal.value = false;
      cnpjError.value = '';
    }

    const formatarTelefone = (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      if (value.length > 11) value = value.substring(0, 11);
      
      if (value.length > 10) {
        formData.value.telefone = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
      } else if (value.length > 6) {
        formData.value.telefone = value.replace(/^(\d{2})(\d{4})(\d+)$/, "($1) $2-$3");
      } else if (value.length > 2) {
        formData.value.telefone = value.replace(/^(\d{2})(\d+)$/, "($1) $2");
      } else {
        formData.value.telefone = value;
      }
    }

    const showToastMessage = (message, type = 'success') => {
      toastMessage.value = message;
      toastType.value = type;
      showToast.value = true;
      
      setTimeout(() => {
        showToast.value = false;
      }, 3000);
    }

    return {
      empresas,
      showModal,
      isSidebarExpanded,
      formData,
      cnpjError,
      isLoading,
      loadError,
      isEditing,
      loadEmpresas,
      handleSubmit,
      validateCNPJ,
      handleDelete,
      editEmpresa,
      formatCNPJ,
      formatarCNPJ,
      formatarTelefone,
      handleSidebarToggle,
      resetForm,
      debugEmpresas,
      showDeleteDialog,
      empresaToDelete,
      confirmDelete,
      hideDeleteDialog,
      showToast,
      toastMessage,
      toastType,
      predefinedColors // Adicionando as cores predefinidas
    }
  }
}