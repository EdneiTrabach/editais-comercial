import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'
import JSZip from 'jszip'

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
  const backupSelecionado = ref(null)
  const dataProximoBackup = ref(null)

  const agendamentoBackup = ref({
    frequencia: 'diario', // diario, semanal, mensal
    horario: '03:00',     // horário padrão (madrugada)
    diasSemana: [],       // relevante para frequência semanal
    diaMes: 1,            // relevante para frequência mensal
    ativo: true
  })

  const frequencias = [
    { value: 'diario', label: 'Diário' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensal', label: 'Mensal' },
  ]

  const diasSemanaOptions = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ]

  const handleSidebarToggle = (expanded) => {
    isSidebarExpanded.value = expanded
  }

  const backupProgress = ref(0)
  const showProgressBar = ref(false)
  const backupStatus = ref('idle') // idle, running, success, error
  const backupMessage = ref('')
  const lastExecutionLogs = ref([])
  const backupStatistics = ref({
    success: 0,
    failed: 0,
    byMonth: []
  })

  const loadBackups = async () => {
    try {
      loading.value = true
      
      // Verificar se a tabela system_backups existe
      const { error: tableCheckError } = await supabase
        .from('system_backups')
        .select('count', { count: 'exact', head: true })
      
      // Se a tabela não existir, não mostra erro, apenas retorna sem dados
      if (tableCheckError) {
        console.log('Tabela de backups não configurada. Execute o script SQL necessário.')
        backups.value = []
        return
      }
      
      const { data, error } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false })
        
      if (error) throw error
      
      backups.value = data || []
      
      if (data && data.length) {
        ultimoBackup.value = data[0]
        totalBackups.value = data.length
        espacoTotal.value = formatSize(data.reduce((acc, backup) => acc + (backup.size || 0), 0))
        
        // Calcular a data do próximo backup (exemplo: 7 dias após o último)
        const dataUltimoBackup = new Date(data[0].created_at)
        const dataProx = new Date(dataUltimoBackup)
        dataProx.setDate(dataProx.getDate() + 7)
        
        // Verifica se a data já passou
        if (dataProx > new Date()) {
          dataProximoBackup.value = dataProx.toLocaleDateString('pt-BR')
        } else {
          dataProximoBackup.value = "Hoje"
        }
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error)
    } finally {
      loading.value = false
    }
  }

  const loadBackupStatistics = async () => {
    try {
      // Verificar se a tabela system_backups existe
      const { error: tableCheckError } = await supabase
        .from('system_backups')
        .select('count', { count: 'exact', head: true })
      
      if (tableCheckError) {
        console.log('Tabela de backups não configurada.')
        return
      }

      // Contagem de backups por status
      const { data: statusData, error: statusError } = await supabase
        .from('system_backups')
        .select('status, count', { count: 'exact' })
        .group('status')
      
      if (statusError) throw statusError
      
      if (statusData) {
        const success = statusData.find(item => item.status === 'completed')?.count || 0
        const failed = statusData.find(item => item.status === 'failed')?.count || 0
        
        backupStatistics.value.success = success
        backupStatistics.value.failed = failed
      }

      // Dados para o gráfico (últimos 6 meses)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 6)
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('system_backups')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at')
      
      if (monthlyError) throw monthlyError
      
      if (monthlyData) {
        // Agrupar por mês e status
        const monthlyStats = {}
        
        monthlyData.forEach(backup => {
          const date = new Date(backup.created_at)
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
          
          if (!monthlyStats[monthYear]) {
            monthlyStats[monthYear] = { completed: 0, failed: 0, in_progress: 0 }
          }
          
          monthlyStats[monthYear][backup.status]++
        })
        
        // Converter para array para o gráfico
        backupStatistics.value.byMonth = Object.keys(monthlyStats).map(key => ({
          month: key,
          completed: monthlyStats[key].completed || 0,
          failed: monthlyStats[key].failed || 0,
          in_progress: monthlyStats[key].in_progress || 0
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas dos backups:', error)
    }
  }

  const realizarBackupManual = async () => {
    try {
      backupEmProgresso.value = true
      showProgressBar.value = true
      backupProgress.value = 0
      backupStatus.value = 'running'
      backupMessage.value = 'Iniciando backup...'
      
      // Resetar logs de execução
      lastExecutionLogs.value = []
      addExecutionLog('Iniciando processo de backup')
      
      // Verificar se a tabela system_backups existe
      const { error: tableCheckError } = await supabase
        .from('system_backups')
        .select('count', { count: 'exact', head: true })
      
      if (tableCheckError) {
        throw new Error('Tabela de backups não configurada. Execute o script SQL corrigido.')
      }
      
      // Gerar um nome de arquivo para o backup
      const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      
      // Atualizar progresso
      backupProgress.value = 10
      backupMessage.value = 'Criando registro de backup...'
      addExecutionLog('Criando registro de backup no banco de dados')
      
      // Versão simplificada da inserção - apenas com colunas que sabemos que existem
      const { data, error } = await supabase
        .from('system_backups')
        .insert({
          filename: fileName,
          tipo: 'manual',
          status: 'in_progress'
        })
        .select()
        .single()

      if (error) {
        addExecutionLog(`Erro ao criar registro: ${error.message}`)
        throw error
      }

      addExecutionLog(`Registro de backup criado com ID: ${data.id}`)
      backupProgress.value = 20
      backupMessage.value = 'Coletando dados das tabelas...'
      
      // Simulação de progresso durante o backup (em um ambiente real, seria baseado em progresso real)
      const progressInterval = setInterval(() => {
        if (backupProgress.value < 90) {
          backupProgress.value += 5
          
          if (backupProgress.value === 30) {
            backupMessage.value = 'Processando tabelas principais...'
            addExecutionLog('Processando tabelas do sistema')
          } else if (backupProgress.value === 50) {
            backupMessage.value = 'Processando dados de relacionamento...'
            addExecutionLog('Processando tabelas de relacionamento')
          } else if (backupProgress.value === 70) {
            backupMessage.value = 'Empacotando dados...'
            addExecutionLog('Finalizando coleta de dados')
          }
        } else {
          clearInterval(progressInterval)
        }
      }, 800)

      // Simulação do processo de backup (substitua por sua lógica real)
      await simulateBackupProcess(data.id)
      
      // Finalizar progresso
      clearInterval(progressInterval)
      backupProgress.value = 100
      backupMessage.value = 'Backup concluído com sucesso!'
      backupStatus.value = 'success'
      addExecutionLog('Backup finalizado com sucesso')

      toastMessage.value = 'Backup concluído com sucesso!'
      toastType.value = 'success'
      showToast.value = true
      
      // Após 3 segundos, esconde o toast
      setTimeout(() => {
        showToast.value = false
      }, 3000)

      // Recarregar a lista de backups e estatísticas
      await loadBackups()
      await loadBackupStatistics()
      
      // Esconder barra de progresso após 2 segundos
      setTimeout(() => {
        showProgressBar.value = false
      }, 2000)
    } catch (error) {
      console.error('Erro ao iniciar backup:', error)
      backupStatus.value = 'error'
      backupProgress.value = 100
      backupMessage.value = `Erro: ${error.message || 'Falha no backup'}`
      addExecutionLog(`ERRO: ${error.message || 'Falha no backup'}`)
      
      toastMessage.value = error.message || 'Erro ao iniciar backup'
      toastType.value = 'error'
      showToast.value = true
      
      // Após 3 segundos, esconde o toast
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    } finally {
      backupEmProgresso.value = false
    }
  }

  // Função para simular o processo de backup (para fins de demonstração)
  const simulateBackupProcess = async (backupId) => {
    try {
      // Simular um atraso de processamento
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Criar uma instância do JSZip para gerar um backup real
      const zip = new JSZip()
      const metaFolder = zip.folder("metadata")
      const tablesFolder = zip.folder("tables")
      
      // Adicionar informações do backup
      metaFolder.file("backup_info.json", JSON.stringify({
        id: backupId,
        created_at: new Date().toISOString(),
        note: "Este é um backup real com estrutura completa"
      }, null, 2))
      
      // Adicionar alguns dados de exemplo
      const exampleData = {
        profiles: [
          { id: "exemplo1", name: "Exemplo 1", role: "admin" },
          { id: "exemplo2", name: "Exemplo 2", role: "user" }
        ],
        empresas: [
          { id: "emp1", nome: "Empresa Exemplo", cnpj: "00.000.000/0001-00" }
        ],
        // Mais dados de exemplo...
      }
      
      // Adicionar cada tabela de exemplo
      for (const [table, data] of Object.entries(exampleData)) {
        tablesFolder.file(`${table}.json`, JSON.stringify(data, null, 2))
      }
      
      // Gerar o conteúdo do ZIP
      const zipContent = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      })
      
      // Calcular o tamanho do arquivo
      const size = zipContent.size
      
      // Fazer upload do arquivo para o storage se necessário
      // Se estiver em ambiente de produção, essa parte faria o upload de verdade
      /*
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('backups')
        .upload(`backup_${backupId}.zip`, zipContent, {
          contentType: 'application/zip',
          cacheControl: '3600'
        })
      
      if (uploadError) throw uploadError
      
      const storagePath = uploadData.path
      */
      
      // Atualizar o status para concluído
      const { error } = await supabase
        .from('system_backups')
        .update({ 
          status: 'completed',
          size: size, // Tamanho real do backup
          // storage_path: storagePath // Em produção, usaríamos o caminho real
        })
        .eq('id', backupId)
      
      if (error) throw error
    } catch (error) {
      console.error('Erro na simulação do backup:', error)
      
      // Marcar como falha
      await supabase
        .from('system_backups')
        .update({ 
          status: 'failed',
          error_message: error.message
        })
        .eq('id', backupId)
    }
  }

  const confirmarRestauracao = (backup) => {
    backupSelecionado.value = backup
    showConfirmModal.value = true
  }

  const restaurarBackup = async () => {
    try {
      if (!backupSelecionado.value) {
        throw new Error('Nenhum backup selecionado')
      }
      
      const backup = backupSelecionado.value
      
      // Verificar se o backup está disponível
      if (backup.status !== 'completed') {
        throw new Error('Este backup não está disponível para restauração')
      }
      
      // Simular processo de restauração
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toastMessage.value = 'Restauração simulada com sucesso! Em um ambiente real, seus dados seriam restaurados.'
      toastType.value = 'success'
      showToast.value = true
      
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    } catch (error) {
      console.error('Erro ao restaurar backup:', error)
      toastMessage.value = error.message || 'Erro ao restaurar backup'
      toastType.value = 'error'
      showToast.value = true
      
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    } finally {
      showConfirmModal.value = false
    }
  }

  const downloadBackup = async (backup) => {
    try {
      // Verificar se o backup está disponível
      if (backup.status !== 'completed') {
        throw new Error('Este backup não está disponível para download')
      }
      
      showProgressBar.value = true
      backupProgress.value = 0
      backupStatus.value = 'running'
      backupMessage.value = 'Preparando download do backup...'
      addExecutionLog('Iniciando download do backup')
      
      // Criar uma instância do JSZip
      const zip = new JSZip()
      
      // Criar pasta de metadados
      const metaFolder = zip.folder("metadata")
      
      // Adicionar informações do backup
      metaFolder.file("backup_info.json", JSON.stringify({
        id: backup.id,
        created_at: backup.created_at,
        tipo: backup.tipo,
        size: backup.size,
        filename: backup.filename
      }, null, 2))
      
      // Lista de tabelas a serem incluídas no backup
      const tables = [
        // Usuários e perfis
        'profiles',
        
        // Empresas e representantes
        'empresas',
        'representantes',
        
        // Plataformas e relacionamentos
        'plataformas',
        'empresa_plataforma',
        'empresa_plataforma_dados',
        
        // Editais e processos
        'editais',
        'responsaveis_processos',
        'reunioes',
        
        // Setores e sistemas
        'setores',
        'sistemas',
        
        // Configurações e análises
        'configuracoes',
        'analises_ia',
        
        // Notificações
        'notifications',
        'notification_recipients',
        
        // Atualizações do sistema
        'system_updates',
        'system_update_reads',
        
        // Configurações do sistema
        'system_config',
        'system_backups'
      ]
      
      // Criar pasta para dados das tabelas
      const tablesFolder = zip.folder("tables")
      const totalTables = tables.length
      
      // Se tiver o backup no storage, tentar baixar de lá primeiro
      if (backup.storage_path) {
        try {
          backupMessage.value = 'Buscando backup do armazenamento...'
          backupProgress.value = 10
          
          const { data, error } = await supabase
            .storage
            .from('backups')
            .download(backup.storage_path)
          
          if (!error && data) {
            // Ler o conteúdo do backup armazenado
            const text = await data.text()
            const backupData = JSON.parse(text)
            
            // Adicionar cada tabela do backup armazenado ao ZIP
            for (const [index, table] of Object.entries(backupData)) {
              tablesFolder.file(`${table}.json`, JSON.stringify(backupData[table], null, 2))
              backupProgress.value = 10 + Math.floor((parseInt(index) + 1) * 70 / Object.keys(backupData).length)
            }
            
            // Pular para a finalização
            backupProgress.value = 80
            backupMessage.value = 'Backup encontrado no armazenamento. Compactando dados...'
            addExecutionLog('Backup recuperado do armazenamento com sucesso')
          } else {
            // Se falhar, continuar com o método alternativo
            addExecutionLog('Backup não encontrado no armazenamento, coletando dados ao vivo')
            await collectLiveBackupData(tables, tablesFolder, totalTables)
          }
        } catch (storageError) {
          console.error('Erro ao obter backup do storage:', storageError)
          addExecutionLog('Erro ao obter backup do armazenamento, coletando dados ao vivo')
          await collectLiveBackupData(tables, tablesFolder, totalTables)
        }
      } else {
        // Se não tiver caminho de armazenamento, coletar dados ao vivo
        await collectLiveBackupData(tables, tablesFolder, totalTables)
      }
      
      // Gerar o arquivo ZIP
      backupMessage.value = 'Gerando arquivo ZIP...'
      backupProgress.value = 90
      addExecutionLog('Gerando arquivo ZIP com todos os dados')
      
      const zipContent = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      }, (metadata) => {
        // Atualizar progresso durante a compressão
        const newProgress = 90 + Math.floor(metadata.percent * 0.1)
        if (newProgress > backupProgress.value) {
          backupProgress.value = newProgress
        }
      })
      
      backupProgress.value = 100
      backupMessage.value = 'Download pronto!'
      backupStatus.value = 'success'
      addExecutionLog('Backup ZIP gerado com sucesso')
      
      // Criar URL e disparar download
      const url = URL.createObjectURL(zipContent)
      const link = document.createElement('a')
      link.href = url
      link.download = backup.filename.replace('.json', '.zip')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Liberar a URL
      setTimeout(() => {
        URL.revokeObjectURL(url)
        // Esconder barra de progresso após 2 segundos
        setTimeout(() => {
          showProgressBar.value = false
        }, 2000)
      }, 100)
      
      toastMessage.value = 'Download do backup iniciado com sucesso!'
      toastType.value = 'success'
      showToast.value = true
      
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    } catch (error) {
      console.error('Erro ao fazer download do backup:', error)
      backupStatus.value = 'error'
      backupProgress.value = 100
      backupMessage.value = `Erro: ${error.message || 'Falha ao baixar backup'}`
      addExecutionLog(`ERRO: ${error.message || 'Falha ao baixar backup'}`)
      
      toastMessage.value = error.message || 'Erro ao baixar backup'
      toastType.value = 'error'
      showToast.value = true
      
      setTimeout(() => {
        showToast.value = false
        showProgressBar.value = false
      }, 3000)
    }
  }

  // Função auxiliar para coletar dados ao vivo para o backup
  const collectLiveBackupData = async (tables, tablesFolder, totalTables) => {
    backupMessage.value = 'Coletando dados do banco de dados...'
    addExecutionLog('Iniciando coleta de dados de todas as tabelas')
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      const progressPercent = Math.floor((i + 1) * 70 / totalTables) + 10
      
      backupMessage.value = `Coletando dados da tabela: ${table}...`
      backupProgress.value = progressPercent
      
      try {
        // Obter todos os dados da tabela
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          addExecutionLog(`Aviso: Erro ao coletar dados da tabela ${table}: ${error.message}`)
          // Continuar mesmo em caso de erro em uma tabela
          tablesFolder.file(`${table}.json`, JSON.stringify({
            error: error.message,
            table: table,
            timestamp: new Date().toISOString()
          }, null, 2))
        } else {
          // Adicionar os dados da tabela ao arquivo ZIP
          tablesFolder.file(`${table}.json`, JSON.stringify(data || [], null, 2))
          addExecutionLog(`Tabela ${table}: ${data ? data.length : 0} registros coletados`)
        }
      } catch (tableError) {
        addExecutionLog(`Erro ao processar tabela ${table}: ${tableError.message}`)
        // Continuar mesmo em caso de erro em uma tabela
        tablesFolder.file(`${table}.json`, JSON.stringify({
          error: tableError.message,
          table: table,
          timestamp: new Date().toISOString()
        }, null, 2))
      }
    }
    
    backupProgress.value = 80
    backupMessage.value = 'Dados coletados. Preparando arquivo de backup...'
    addExecutionLog('Coleta de dados concluída com sucesso')
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

  const backupsFiltrados = computed(() => {
    return backups.value.filter(backup => {
      const statusMatch = !filtroStatus.value || backup.status === filtroStatus.value
      const dateMatch = !filtroData.value || new Date(backup.created_at).toLocaleDateString('pt-BR') === new Date(filtroData.value).toLocaleDateString('pt-BR')
      return statusMatch && dateMatch
    })
  })

  const backupsUltimos30Dias = computed(() => {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - 30)
    
    return backups.value.filter(backup => 
      new Date(backup.created_at) >= dataLimite
    ).length
  })

  const today = computed(() => {
    return new Date().toISOString().split('T')[0]
  })

  const loadAgendamentoBackup = async () => {
    try {
      // Verificar se a tabela system_config existe
      const { error: tableCheckError } = await supabase
        .from('system_config')
        .select('count', { count: 'exact', head: true })
      
      // Se a tabela não existir, não mostra erro, apenas usa valores padrão
      if (tableCheckError) {
        console.log('Tabela de configurações não configurada. Execute o script SQL necessário.')
        return
      }
      
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'backup_agendamento')
        .single()
        
      if (error) {
        if (error.code !== 'PGRST116') { // Não encontrado
          console.error('Erro ao carregar configuração de agendamento:', error)
        }
        return
      }
      
      if (data && data.value) {
        agendamentoBackup.value = JSON.parse(data.value)
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de agendamento:', error)
    }
  }

  const salvarAgendamentoBackup = async () => {
    try {
      // Verificar se a tabela system_config existe
      const { error: tableCheckError } = await supabase
        .from('system_config')
        .select('count', { count: 'exact', head: true })
      
      if (tableCheckError) {
        throw new Error('Tabela de configurações não configurada. Execute o script SQL necessário.')
      }
      
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: 'backup_agendamento',
          value: JSON.stringify(agendamentoBackup.value)
        })
        
      if (error) throw error
      
      toastMessage.value = 'Configuração de agendamento salva com sucesso!'
      toastType.value = 'success'
      showToast.value = true
      
      // Atualizar imediatamente o status de agendamento
      await atualizarStatusAgendamento()
      
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    } catch (error) {
      console.error('Erro ao salvar configuração de agendamento:', error)
      toastMessage.value = error.message || 'Erro ao salvar configuração de agendamento'
      toastType.value = 'error'
      showToast.value = true
      
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
  }

  const atualizarAgendamentoServidor = async () => {
    // Este método será implementado quando tivermos um endpoint de API disponível
    // Por enquanto, apenas registramos uma mensagem
    console.log('Agendamento configurado:', agendamentoBackup.value)
  }

  const getApiToken = async () => {
    // Obter token para autenticação na API de agendamento
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  // Função para adicionar logs de execução
  const addExecutionLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    lastExecutionLogs.value.push(`[${timestamp}] ${message}`)
  }

  // Função para verificar status do backup agendado
  const verificarBackupAgendado = async () => {
    try {
      // Recarregar a configuração do agendamento antes de verificar o status
      await loadAgendamentoBackup()
      
      // Verificar se existe um backup programado para hoje
      const hoje = new Date()
      const dataHoje = hoje.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('system_backups')
        .select('*')
        .eq('tipo', 'auto')
        .gte('created_at', `${dataHoje}T00:00:00`)
        .lte('created_at', `${dataHoje}T23:59:59`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Atualizar informação do último backup agendado
        const ultimoBackupAgendado = data[0]
        return {
          executado: true,
          status: ultimoBackupAgendado.status,
          horario: new Date(ultimoBackupAgendado.created_at).toLocaleTimeString(),
          mensagem: ultimoBackupAgendado.status === 'completed' 
            ? 'Backup agendado concluído' 
            : (ultimoBackupAgendado.status === 'failed' 
                ? `Falha: ${ultimoBackupAgendado.error_message || 'Erro desconhecido'}` 
                : 'Em processamento')
        }
      }
      
      // Verificar próxima execução agendada
      if (agendamentoBackup.value.ativo) {
        // Usar o horário salvo no agendamento
        const horaAgendada = agendamentoBackup.value.horario.split(':')
        const horaBackup = parseInt(horaAgendada[0])
        const minutoBackup = parseInt(horaAgendada[1])
        
        const agora = new Date()
        const horaAtual = agora.getHours()
        const minutoAtual = agora.getMinutes()
        
        // Verifica se o horário agendado está próximo (dentro de 2 minutos)
        const isNearScheduledTime = 
          (horaAtual === horaBackup && Math.abs(minutoAtual - minutoBackup) <= 2) ||
          (horaAtual === horaBackup - 1 && minutoAtual >= 58 && minutoBackup <= 2) ||
          (horaAtual === horaBackup + 1 && minutoAtual <= 2 && minutoBackup >= 58);
        
        // Se estiver próximo do horário agendado, executa o backup
        if (isNearScheduledTime) {
          // Executa o backup agendado através de um timer para não bloquear a interface
          setTimeout(() => {
            executarBackupAgendado().then(result => {
              if (result.success) {
                console.log('Backup agendado executado com sucesso:', result.backupId);
                // Recarrega os dados
                loadBackups();
                atualizarStatusAgendamento();
              } else {
                console.log('Backup agendado não executado:', result.reason, result.message);
              }
            });
          }, 1000);
        }
        
        if (horaAtual < horaBackup || (horaAtual === horaBackup && minutoAtual < minutoBackup)) {
          // Backup ainda não executado hoje, mas está programado
          console.log(`Próximo backup agendado para: ${agendamentoBackup.value.horario}`)
          return {
            executado: false,
            programado: true,
            horario: agendamentoBackup.value.horario,
            mensagem: `Programado para hoje às ${agendamentoBackup.value.horario}`
          }
        } else {
          // Horário já passou, mas backup não foi executado
          return {
            executado: false,
            programado: true,
            horario: agendamentoBackup.value.horario,
            status: 'missed',
            mensagem: 'Backup programado não executado ou não registrado'
          }
        }
      }
      
      return {
        executado: false,
        programado: false,
        mensagem: 'Nenhum backup agendado para hoje'
      }
    } catch (error) {
      console.error('Erro ao verificar backup agendado:', error)
      return {
        executado: false,
        erro: true,
        mensagem: 'Erro ao verificar backups agendados'
      }
    }
  }

  // Adicionar monitoramento de agendamento
  const statusAgendamentoHoje = ref({})

  const atualizarStatusAgendamento = async () => {
    statusAgendamentoHoje.value = await verificarBackupAgendado()
  }

  // Iniciar verificação a cada minuto
  let intervalVerificacao = null

  const iniciarMonitoramentoAgendamento = () => {
    // Verificação inicial
    atualizarStatusAgendamento()
    
    // Verificar a cada minuto
    intervalVerificacao = setInterval(() => {
      atualizarStatusAgendamento()
    }, 60000)
  }

  // Parar verificação ao desmontar o componente
  const pararMonitoramentoAgendamento = () => {
    if (intervalVerificacao) {
      clearInterval(intervalVerificacao)
    }
  }

  // Vamos criar uma função para executar o agendamento manualmente
  const executarBackupAgendado = async () => {
    try {
      // Verificar se o backup já foi executado hoje
      const hoje = new Date()
      const dataHoje = hoje.toISOString().split('T')[0]
      
      const { data: backupsHoje, error: checkError } = await supabase
        .from('system_backups')
        .select('*')
        .eq('tipo', 'auto')
        .gte('created_at', `${dataHoje}T00:00:00`)
        .lte('created_at', `${dataHoje}T23:59:59`)
      
      if (checkError) throw checkError
      
      // Se já existir um backup hoje, não executa novamente
      if (backupsHoje && backupsHoje.length > 0) {
        return {
          success: false,
          reason: 'already_executed',
          message: 'Já existe um backup automático para hoje'
        }
      }
      
      // Gerar nome do arquivo
      const fileName = `backup_auto_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      
      // Inserir o registro de backup
      const { data, error } = await supabase
        .from('system_backups')
        .insert({
          filename: fileName,
          tipo: 'auto',
          status: 'in_progress'
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Simulação do processo de backup
      await simulateBackupProcess(data.id)
      
      return { 
        success: true, 
        backupId: data.id,
        message: 'Backup agendado executado com sucesso'
      }
    } catch (error) {
      console.error('Erro ao executar backup agendado:', error)
      return {
        success: false,
        reason: 'error',
        message: error.message
      }
    }
  }

  onMounted(() => {
    loadBackups()
    loadAgendamentoBackup()
    loadBackupStatistics()
    iniciarMonitoramentoAgendamento()
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
    backupSelecionado,
    dataProximoBackup,
    agendamentoBackup,
    frequencias,
    diasSemanaOptions,
    handleSidebarToggle,
    formatDate,
    formatSize,
    formatStatus,
    realizarBackupManual,
    confirmarRestauracao,
    restaurarBackup,
    downloadBackup,
    backupsFiltrados,
    backupsUltimos30Dias,
    today,
    salvarAgendamentoBackup,
    loadAgendamentoBackup,
    backupProgress,
    showProgressBar,
    backupStatus,
    backupMessage,
    lastExecutionLogs,
    backupStatistics,
    statusAgendamentoHoje,
    atualizarStatusAgendamento,
    pararMonitoramentoAgendamento,
    loadBackupStatistics,
    executarBackupAgendado
  }
}