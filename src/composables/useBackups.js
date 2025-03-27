import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

export function useBackups() {
  const loading = ref(false)
  const backups = ref([])
  const isSidebarExpanded = ref(true)
  const backupEmProgresso = ref(false)
  const ultimoBackup = ref(null)
  const totalBackups = ref(0)
  const espacoTotal = ref('0 Bytes')
  const filtroStatus = ref('')
  const filtroData = ref('')
  const showConfirmModal = ref(false)
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastType = ref('success')

  const handleSidebarToggle = (expanded) => {
    isSidebarExpanded.value = expanded
  }

  const loadBackups = async () => {
    try {
      loading.value = true
      const { data, error } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false })
        
      if (error) throw error
      backups.value = data
      if (data.length) {
        ultimoBackup.value = data[0]
        totalBackups.value = data.length
        espacoTotal.value = formatSize(data.reduce((acc, backup) => acc + backup.size, 0))
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error)
    } finally {
      loading.value = false
    }
  }

  const realizarBackupManual = async () => {
    try {
      backupEmProgresso.value = true
      
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('backups')
        .insert({
          tipo: 'manual',
          status: 'in_progress',
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

      // Aqui você pode adicionar a lógica real de backup
      // Por exemplo, chamar uma API backend que realiza o backup

      toastMessage.value = 'Backup iniciado com sucesso!'
      toastType.value = 'success'
      showToast.value = true

      // Recarregar a lista de backups
      await loadBackups()
    } catch (error) {
      console.error('Erro ao iniciar backup:', error)
      toastMessage.value = 'Erro ao iniciar backup'
      toastType.value = 'error'
      showToast.value = true
    } finally {
      backupEmProgresso.value = false
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const formatSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Byte'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
  }

  const formatStatus = (status) => {
    const statusMap = {
      'completed': 'Concluído',
      'in_progress': 'Em Andamento',
      'failed': 'Falhou'
    }
    return statusMap[status] || status
  }

  // ... resto das funções ...

  const backupsFiltrados = computed(() => {
    return backups.value.filter(backup => {
      const statusMatch = !filtroStatus.value || backup.status === filtroStatus.value
      const dateMatch = !filtroData.value || new Date(backup.created_at).toLocaleDateString('pt-BR') === new Date(filtroData.value).toLocaleDateString('pt-BR')
      return statusMatch && dateMatch
    })
  })

  const today = computed(() => {
    return new Date().toISOString().split('T')[0]
  })

  onMounted(() => {
    loadBackups()
  })

  return {
    loading,
    backups,
    isSidebarExpanded,
    backupEmProgresso,
    ultimoBackup,
    totalBackups,
    espacoTotal,
    filtroStatus,
    filtroData,
    showConfirmModal,
    showToast,
    toastMessage,
    toastType,
    handleSidebarToggle,
    formatDate,
    formatSize,
    formatStatus,
    realizarBackupManual,
    // ... outras propriedades e métodos
    backupsFiltrados,
    today
  }
}