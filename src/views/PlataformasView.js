import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import TheSidebar from '@/components/TheSidebar.vue'
import { useConnectionManager } from '@/composables/useConnectionManager'
import { SupabaseManager } from '@/lib/supabaseManager'

export default {
  name: 'PlataformasView',
  components: {
    TheSidebar
  },
  emits: ['sidebarToggle'],
  setup() {
    const isSidebarExpanded = ref(true)
    const showModal = ref(false)
    const editingId = ref(null)
    const plataformas = ref([])
    const formData = ref({
      nome: '',
      url: '',
      detalhes: '',
      data_validade: '',
      observacoes: '',
      empresas: []
    })
    const selectedEmpresa = ref(null)
    const empresasCadastradas = ref([])
    const empresasSelecionadas = ref([])
    const toasts = ref([])
    const showDadosModal = ref(false)
    const editingPlataforma = ref(null)
    const dadosForm = ref({
      login: '',
      senha: '',
      certificado_digital: '',
      data_validade_certificado: '',
      observacoes: ''
    })
    const showDeleteDialog = ref(false);
    const plataformaToDelete = ref(null);

    // As funções existentes continuam aqui...
    const loadPlataformas = async (empresaId = null) => {
      try {
        let query = supabase
          .from('plataformas')
          .select(`
            *,
            empresa_plataforma_dados!left(
              empresa_id,
              login,
              senha,
              data_validade,
              observacoes
            )
          `)
          .order('nome')
    
        if (empresaId) {
          query = query.eq('empresa_plataforma_dados.empresa_id', empresaId)
        }
    
        const { data, error } = await query
    
        if (error) throw error
    
        console.log('Dados retornados:', data) // Debug
    
        plataformas.value = data.map(p => ({
          ...p,
          dados_especificos: p.empresa_plataforma_dados?.find(
            d => d.empresa_id === empresaId
          ) || null
        }))
    
      } catch (error) {
        console.error('Erro ao carregar plataformas:', error)
        showToast('Erro ao carregar plataformas', 'error')
      }
    }

    const loadEmpresas = async () => {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .order('nome')
    
        if (error) throw error
        empresasCadastradas.value = data || []
        console.log('Empresas carregadas:', empresasCadastradas.value)
      } catch (error) {
        console.error('Erro ao carregar empresas:', error)
      }
    }

    const handleEmpresaSelected = async (empresa) => {
      selectedEmpresa.value = empresa
      await loadPlataformas(empresa.id)
    }

    const vincularEmpresaPlataforma = async (plataformaId, empresaId) => {
      try {
        const { error } = await supabase
          .from('empresa_plataforma')
          .insert({
            empresa_id: empresaId,
            plataforma_id: plataformaId
          })
    
        if (error) throw error
      } catch (error) {
        console.error('Erro ao vincular empresa-plataforma:', error)
        throw error
      }
    }

    const desvincularEmpresa = async (plataformaId) => {
      if (!confirm('Deseja desvincular esta plataforma da empresa?')) return
    
      try {
        const { error } = await supabase
          .from('empresa_plataforma')
          .delete()
          .match({
            empresa_id: selectedEmpresa.value.id,
            plataforma_id: plataformaId
          })
    
        if (error) throw error
        await loadPlataformas(selectedEmpresa.value.id)
      } catch (error) {
        console.error('Erro ao desvincular:', error)
        alert('Erro ao desvincular plataforma da empresa')
      }
    }

    const vincularEmpresa = async (plataformaId) => {
      try {
        if (!selectedEmpresa.value) return
    
        const { error } = await supabase
          .from('empresa_plataforma')
          .insert({
            empresa_id: selectedEmpresa.value.id,
            plataforma_id: plataformaId
          })
    
        if (error) throw error
        await loadPlataformas(selectedEmpresa.value.id)
      } catch (error) {
        console.error('Erro ao vincular empresa:', error)
        alert('Erro ao vincular empresa à plataforma')
      }
    }

    const toggleEmpresa = (empresa) => {
      const index = empresasSelecionadas.value.indexOf(empresa.id)
      if (index === -1) {
        empresasSelecionadas.value.push(empresa.id)
        showToast(`Empresa ${empresa.nome} vinculada com sucesso!`, 'success')
      } else {
        empresasSelecionadas.value.splice(index, 1)
        showToast(`Empresa ${empresa.nome} desvinculada!`, 'error')
      }
    }

    const loadVinculacoes = async (plataformaId) => {
      try {
        const { data, error } = await supabase
          .from('empresa_plataforma')
          .select('empresa_id')
          .eq('plataforma_id', plataformaId)
    
        if (error) throw error
        empresasSelecionadas.value = data.map(v => v.empresa_id)
      } catch (error) {
        console.error('Erro ao carregar vinculações:', error)
      }
    }

    const editPlataforma = async (plataforma) => {
      editingId.value = plataforma.id
      
      // Dados básicos da plataforma
      formData.value = {
        nome: plataforma.nome,
        url: plataforma.url
      }
    
      if (selectedEmpresa.value) {
        // Modo edição com empresa específica
        const dadosEspecificos = plataforma.dados_especificos || {}
        formData.value = {
          ...formData.value,
          login: dadosEspecificos.login || '',
          senha: dadosEspecificos.senha || '',
          data_validade: dadosEspecificos.data_validade || '',
          observacoes: dadosEspecificos.observacoes || ''
        }
      } else {
        // Carrega empresas vinculadas
        const { data } = await supabase
          .from('empresa_plataforma_dados')
          .select('empresa_id')
          .eq('plataforma_id', plataforma.id)
    
        empresasSelecionadas.value = data?.map(v => v.empresa_id) || []
      }
    
      showModal.value = true
    }

    const handleSubmit = async () => {
      try {
        // Verificação básica de campos obrigatórios
        if (!formData.value.nome || !formData.value.url) {
          showToast('Nome e URL são obrigatórios', 'error');
          return;
        }
    
        console.log('Iniciando salvamento...', { 
          formData: formData.value, 
          editingId: editingId.value 
        });
        
        // No início do handleSubmit
        console.log('Dados do formulário antes de salvar:', formData.value);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuário não autenticado');
        }
    
        // 1. Salvar dados da plataforma
        const plataformaData = {
          nome: formData.value.nome,
          url: formData.value.url,
          responsavel_id: user.id
        };
    
        let plataformaId = editingId.value;
    
        if (editingId.value) {
          console.log('Atualizando plataforma existente:', editingId.value);
          const { error } = await supabase
            .from('plataformas')
            .update(plataformaData)
            .eq('id', editingId.value);
    
          if (error) throw error;
        } else {
          console.log('Criando nova plataforma');
          const { data, error } = await supabase
            .from('plataformas')
            .insert(plataformaData)
            .select();
    
          if (error) throw error;
          plataformaId = data[0].id;
        }
    
        // 2. Gerenciar vinculações com empresas
        if (!selectedEmpresa.value && empresasSelecionadas.value.length > 0) {
          console.log('Processando vinculações de empresas:', empresasSelecionadas.value);
          
          // Remove vinculações antigas
          await supabase
            .from('empresa_plataforma_dados')
            .delete()
            .eq('plataforma_id', plataformaId);
    
          // Insere novas vinculações
          const vinculacoes = empresasSelecionadas.value.map(empresaId => ({
            empresa_id: empresaId,
            plataforma_id: plataformaId,
            responsavel_id: user.id,
            created_at: new Date().toISOString()
          }));
    
          if (vinculacoes.length > 0) {
            console.log('Inserindo novas vinculações:', vinculacoes);
            const { error: vinculacaoError } = await supabase
              .from('empresa_plataforma_dados')
              .insert(vinculacoes);
    
            if (vinculacaoError) throw vinculacaoError;
          }
        }
    
        // 3. Se tiver empresa selecionada, atualiza dados específicos
        if (selectedEmpresa.value) {
          console.log('Salvando dados específicos para empresa:', selectedEmpresa.value.id);
          const dadosEspecificos = {
            plataforma_id: plataformaId,
            empresa_id: selectedEmpresa.value.id,
            login: formData.value.login || null,
            senha: formData.value.senha || null,
            data_validade: formData.value.data_validade || null,
            observacoes: formData.value.observacoes || null,
            responsavel_id: user.id
          };
    
          const { error } = await supabase
            .from('empresa_plataforma_dados')
            .upsert(dadosEspecificos, {
              onConflict: 'empresa_id,plataforma_id'
            });
    
          if (error) throw error;
        }
    
        await loadPlataformas(selectedEmpresa.value?.id);
        closeModal();
        showToast('Plataforma salva com sucesso!', 'success');
        
        // Antes de fechar o modal
        console.log('Salvamento concluído com sucesso');
      } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast(`Erro ao salvar plataforma: ${error.message}`, 'error');
        
        // No catch
        console.error('Detalhes completos do erro:', {
          message: error.message,
          code: error.code,
          details: error.details,
          stack: error.stack
        });
      }
    };

    const formatCNPJ = (cnpj) => {
      if (!cnpj) return ''
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    }

    const closeModal = () => {
      showModal.value = false
      editingId.value = null
      formData.value = { nome: '', url: '' }
      empresasSelecionadas.value = []
    }

    const showToast = (message, type = 'success') => {
      const id = Date.now()
      toasts.value.push({ id, message, type })
      
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 3000)
    }

    const confirmarExclusao = (plataforma) => {
      plataformaToDelete.value = plataforma;
      showDeleteDialog.value = true;
    };

    const cancelarExclusao = () => {
      showDeleteDialog.value = false;
      plataformaToDelete.value = null;
    };

    const deletePlataforma = async () => {
      try {
        if (!plataformaToDelete.value) return;
        
        const { error } = await supabase
          .from('plataformas')
          .delete()
          .eq('id', plataformaToDelete.value.id);
    
        if (error) throw error;
        
        await loadPlataformas(selectedEmpresa.value?.id);
        showToast('Plataforma excluída com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir plataforma:', error);
        showToast('Erro ao excluir plataforma: ' + error.message, 'error');
      } finally {
        showDeleteDialog.value = false;
        plataformaToDelete.value = null;
      }
    };

    const handleSidebarToggle = (expanded) => {
      isSidebarExpanded.value = expanded
    }

    const truncateUrl = (url) => {
      return url.length > 60 ? url.substring(0, 60) + '...' : url
    }

    const truncateText = (text, length = 60) => {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    }

    const plataformasFiltradas = computed(() => {
      if (!selectedEmpresa.value) {
        return plataformas.value
      }
    
      return plataformas.value.filter(p => {
        return p.dados_especificos?.empresa_id === selectedEmpresa.value.id
      })
    })

    const getEmptyStateMessage = () => {
      if (selectedEmpresa.value) {
        return `Nenhuma plataforma vinculada à empresa ${selectedEmpresa.value.nome}`
      }
      return 'Nenhuma plataforma cadastrada'
    }

    const selectEmpresa = async (empresa) => {
      selectedEmpresa.value = empresa
      await loadPlataformas(empresa.id)
      console.log('Empresa selecionada:', empresa) // Debug
    }

    const clearEmpresaSelection = () => {
      selectedEmpresa.value = null
      loadPlataformas()
    }

    const formatDate = (date) => {
      if (!date) return '-'
      try {
        return new Date(date).toLocaleDateString('pt-BR')
      } catch (error) {
        console.error('Erro ao formatar data:', error)
        return '-'
      }
    }

    const getValidadeClass = (data) => {
      if (!data) return 'validade-indefinida'
    
      const hoje = new Date()
      const validade = new Date(data)
      const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24))
    
      if (diasRestantes < 0) return 'validade-expirada'
      if (diasRestantes <= 30) return 'validade-proxima'
      return 'validade-ok'
    }

    const saveDadosPlataforma = async (dados) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
    
        const dadosToSave = {
          empresa_id: selectedEmpresa.value.id,
          plataforma_id: editingPlataforma.value.id,
          login: dados.login,
          senha: dados.senha,
          data_validade: dados.data_validade,
          observacoes: dados.observacoes,
          responsavel_id: user.id,
          updated_at: new Date().toISOString()
        }
    
        const { error } = await supabase
          .from('empresa_plataforma_dados')
          .upsert(dadosToSave, {
            onConflict: 'empresa_id,plataforma_id'
          })
    
        if (error) throw error
    
        await loadPlataformas(selectedEmpresa.value?.id)
        showToast('Dados salvos com sucesso!')
      } catch (error) {
        console.error('Erro ao salvar:', error)
        showToast('Erro ao salvar dados', 'error')
      }
    }

    const editDadosPlataforma = (plataforma) => {
      editingPlataforma.value = plataforma
      dadosForm.value = {
        login: plataforma.dados_especificos?.login || '',
        senha: plataforma.dados_especificos?.senha || '',
        data_validade: plataforma.dados_especificos?.data_validade || '',
        observacoes: plataforma.dados_especificos?.observacoes || ''
      }
      showDadosModal.value = true
    }

    const closeDadosModal = () => {
      showDadosModal.value = false
      editingPlataforma.value = null
      dadosForm.value = {
        login: '',
        senha: '',
        certificado_digital: '',
        data_validade_certificado: '',
        observacoes: ''
      }
    }

    const handleDadosSubmit = async () => {
      try {
        const dadosToSave = {
          ...dadosForm.value,
          plataforma_id: editingPlataforma.value.id
        }
        await saveDadosPlataforma(dadosToSave)
        closeDadosModal()
      } catch (error) {
        console.error('Erro ao salvar dados específicos:', error)
        showToast('Erro ao salvar dados específicos', 'error')
      }
    }

    const handleEmpresasVinculadas = async (plataformaId) => {
      await supabase
        .from('empresa_plataforma')
        .delete()
        .eq('plataforma_id', plataformaId)
    
      if (empresasSelecionadas.value.length > 0) {
        const vinculacoes = empresasSelecionadas.value.map(empresaId => ({
          empresa_id: empresaId,
          plataforma_id: plataformaId
        }))
    
        await supabase
          .from('empresa_plataforma')
          .insert(vinculacoes)
      }
    }

    const loadData = async () => {
      await loadPlataformas(selectedEmpresa.value?.id)
    }

    useConnectionManager(loadData)

    onMounted(() => {
      loadPlataformas()
      loadEmpresas()
      
      const channel = supabase.channel('plataformas-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'plataformas' }, 
          () => loadData()
        )
        .subscribe()
      
      SupabaseManager.addSubscription('plataformas-updates', channel)
    })

    onUnmounted(() => {
      const channel = SupabaseManager.getSubscription('plataformas-updates')
      if (channel) {
        supabase.removeChannel(channel)
        SupabaseManager.removeSubscription('plataformas-updates')
      }
    })

    return {
      isSidebarExpanded,
      showModal,
      editingId,
      plataformas,
      formData,
      selectedEmpresa,
      empresasCadastradas,
      empresasSelecionadas,
      toasts,
      showDadosModal,
      editingPlataforma,
      dadosForm,
      showDeleteDialog,
      plataformaToDelete,
      loadPlataformas,
      loadEmpresas,
      handleEmpresaSelected,
      vincularEmpresaPlataforma,
      desvincularEmpresa,
      vincularEmpresa,
      toggleEmpresa,
      loadVinculacoes,
      editPlataforma,
      handleSubmit,
      formatCNPJ,
      closeModal,
      showToast,
      confirmarExclusao,
      cancelarExclusao,
      deletePlataforma,
      handleSidebarToggle,
      truncateUrl,
      truncateText,
      plataformasFiltradas,
      getEmptyStateMessage,
      selectEmpresa,
      clearEmpresaSelection,
      formatDate,
      getValidadeClass,
      saveDadosPlataforma,
      editDadosPlataforma,
      closeDadosModal,
      handleDadosSubmit,
      handleEmpresasVinculadas
    }
  }
}