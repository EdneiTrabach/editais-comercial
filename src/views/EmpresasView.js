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

    const formData = ref({
      nome: '',
      cnpj: '',
      razao_social: '',
      contato: '',
      telefone: '',
      email: ''
    })

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
        // Valida o CNPJ antes de enviar
        if (!await validateCNPJ()) {
          return
        }

        // Consulta SQL equivalente:
        // INSERT INTO empresas (nome, cnpj, razao_social, contato, telefone, email, updated_at)
        // VALUES (?, ?, ?, ?, ?, ?, ?);
        const { data, error } = await supabase
          .from('empresas')
          .insert({
            nome: formData.value.nome,
            cnpj: formData.value.cnpj.replace(/[^\d]/g, ''), // Remove caracteres não numéricos
            razao_social: formData.value.razao_social,
            contato: formData.value.contato,
            telefone: formData.value.telefone,
            email: formData.value.email,
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        await loadEmpresas()
        showModal.value = false
        // Reset do formulário
        formData.value = {
          nome: '',
          cnpj: '',
          razao_social: '',
          contato: '',
          telefone: '',
          email: ''
        }
      } catch (error) {
        console.error('Erro ao cadastrar empresa:', error)
        
        // Mensagem de erro mais amigável
        if (error.code === '23505') {
          alert('CNPJ já cadastrado no sistema')
        } else {
          alert('Erro ao cadastrar empresa. Por favor, tente novamente.')
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
      if (!confirm('Confirma a exclusão desta empresa?')) return

      try {
        // Consulta SQL equivalente:
        // DELETE FROM empresas WHERE id = ?;
        const { error } = await supabase
          .from('empresas')
          .delete()
          .eq('id', empresa.id)

        if (error) throw error
        await loadEmpresas()
      } catch (error) {
        console.error('Erro ao excluir empresa:', error)
        alert('Erro ao excluir empresa')
      }
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

    // Função para recarregar dados quando a conexão for restaurada
    const loadData = async () => {
      await loadEmpresas()
    }

    // Usar o composable para gerenciar reconexões
    useConnectionManager(loadData)

    // Carregar dados quando o componente for montado
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
      
      // Tenta fazer uma consulta direta ao Supabase
      console.log('[DEBUG] Tentando busca direta no Supabase...')
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

    // Exponha as variáveis e métodos necessários para o template
    return {
      empresas,
      showModal,
      isSidebarExpanded,
      formData,
      cnpjError,
      isLoading,
      loadError,
      loadEmpresas,
      handleSubmit,
      validateCNPJ,
      handleDelete,
      formatCNPJ,
      formatarCNPJ,
      handleSidebarToggle,
      debugEmpresas  // Adicionada aqui
    }
  }
}