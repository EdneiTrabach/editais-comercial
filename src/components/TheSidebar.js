import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { SupabaseManager } from '@/lib/supabaseManager'

export default {
  emits: ['sidebarToggle'],
  
  setup(props, { emit }) {
    const router = useRouter()
    
    // ===== ESTADO DO COMPONENTE =====
    const isAdmin = ref(false)
    const isActive = ref(false)
    const isPinned = ref(false)
    const isDarkMode = ref(false)
    const unreadNotifications = ref(0)
    
    // ===== ROTAS DO MENU =====
    const routes = [
      { path: '/processos', name: 'Processos', icon: '/icons/pasta.svg' },
      { path: '/funcionalidades', name: 'Funcionalidades', icon: '/icons/configuracoes.svg' },
      { path: '/editais', name: 'Novo Processo', icon: '/icons/nova-pasta.svg' },
      { path: '/lances', name: 'Lances', icon: '/icons/calculadora.svg' },
      { path: '/declaracoes', name: 'Declaraçoes', icon: '/icons/edicao.svg' },
      { path: '/sistemas', name: 'Sistemas', icon: '/icons/app.svg' },
      { path: '/dashboard', name: 'Dashboard', icon: '/icons/grafico.svg' },
      { path: '/representantes', name: 'Representantes', icon: '/icons/cartao-usuario.svg' },
      { path: '/plataformas', name: 'Plataformas', icon: '/icons/links.svg' },
      { path: '/empresas', name: 'Empresas', icon: '/icons/empresa.svg' },
      { path: '/relatorios', name: 'Relatórios', icon: '/icons/check.svg' },
      { path: '/configuracoes', name: 'Admin. de Usuários', icon: '/icons/config-usuario.svg' },
      { path: '/responsaveis', name: 'Responsáveis', icon: '/icons/responsavel.svg' }
    ]

    // ===== GERENCIAMENTO DO SIDEBAR =====
    
    // Toggle do sidebar (expandir/recolher)
    const toggleSidebar = () => {
      if (isActive.value) {
        isPinned.value = !isPinned.value
        if (!isPinned.value) {
          isActive.value = false
        }
      } else {
        isActive.value = true
      }
    
      emit('sidebarToggle', isActive.value)
      saveSidebarState()
      adjustMainContent()
    }
    
    // Salvar estado do sidebar no localStorage
    const saveSidebarState = () => {
      localStorage.setItem('sidebarState', isActive.value.toString())
      localStorage.setItem('sidebarPinned', isPinned.value.toString())
    }
    
    // Carregar estado do sidebar do localStorage
    const loadSidebarState = () => {
      isActive.value = localStorage.getItem('sidebarState') === 'true'
      isPinned.value = localStorage.getItem('sidebarPinned') === 'true'
    }

    // Ajustar margens do conteúdo principal
    const adjustMainContent = () => {
      const mainContents = document.querySelectorAll('.main-content')
      mainContents.forEach(content => {
        content.style.marginLeft = (isActive.value || isPinned.value) ? '330px' : '0'
        content.style.transition = 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      })
    }

    // ===== FUNCIONALIDADES DO USUÁRIO =====
    
    // Verificar status de admin
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          isAdmin.value = false
          return false
        }
    
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
    
        isAdmin.value = profile?.role === 'admin'
        localStorage.setItem('userRole', profile?.role || '')
        
        return isAdmin.value
      } catch (error) {
        console.error('Erro ao verificar status admin:', error)
        isAdmin.value = false
        return false
      }
    }

    // Alternar tema claro/escuro
    const toggleDarkMode = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
      localStorage.setItem('theme', isDark ? 'light' : 'dark')
    }

    // Fazer logout do sistema
    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        localStorage.clear()
        await router.push('/login')
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
        alert('Erro ao sair do sistema. Tente novamente.')
      }
    }

    // ===== NOTIFICAÇÕES =====
    
    // Toggle do painel de notificações
    const toggleNotifications = () => {
      console.log('Toggle notifications')
    }
    
    // Verificar notificações não lidas
    const checkNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from('notifications')
            .select('count')
            .eq('user_id', user.id)
            .eq('read', false)
            .single()
    
          if (error) throw error
          unreadNotifications.value = data?.count || 0
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error)
      }
    }
    
    // ===== NAVEGAÇÃO =====
    
    // Verificar acesso à área de administração
    const handleAdminClick = (e) => {
      if (!isAdmin.value) {
        e.preventDefault();
        alert('Você não tem permissão para acessar esta área');
        return;
      }
      
      // Se for admin, permita a navegação seguindo o link normalmente
      // Não precisa fazer nada aqui, pois o router-link navegará automaticamente
    }

    // ===== LISTENERS DE EVENTOS =====
    
    // Gerenciar eventos de clique fora do sidebar
    const setupOutsideClickListener = () => {
      const handleClick = (e) => {
        const sidebar = document.querySelector('.sidebar')
        const trigger = document.querySelector('.sidebar-trigger')
        
        if (sidebar && trigger && 
            !sidebar.contains(e.target) && 
            !trigger.contains(e.target)) {
          if (!isPinned.value) {
            isActive.value = false
            adjustMainContent()
          }
        }
      }
    
      const handleKeydown = (e) => {
        if (e.key === 'Escape' && !isPinned.value) {
          isActive.value = false
          adjustMainContent()
        }
      }
    
      document.addEventListener('click', handleClick)
      document.addEventListener('keydown', handleKeydown)
    
      // Retorna uma função que remove os event listeners
      return () => {
        document.removeEventListener('click', handleClick)
        document.removeEventListener('keydown', handleKeydown)
      }
    }
    
    // ===== LIFECYCLE HOOKS =====
    
    onMounted(async () => {
      // Carregar configurações e estado
      loadSidebarState()
      
      // Carregar tema
      const savedTheme = localStorage.getItem('theme') || 'light'
      document.documentElement.setAttribute('data-theme', savedTheme)
      
      try {
        // Verificar sessão e autenticação
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        
        // Carregar role do usuário do cache primeiro (rápido)
        const cachedRole = localStorage.getItem('userRole')
        if (cachedRole) {
          isAdmin.value = cachedRole === 'admin'
        }
        
        // Verificar status de admin (servidor)
        await checkAdminStatus()
        
        // Verificar notificações
        await checkNotifications()
        
        // Configurar listener para eventos de visibilidade
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            adjustMainContent()
          }
        })
        
        // Aplicar ajustes iniciais
        adjustMainContent()
      } catch (error) {
        console.error('Erro na inicialização do sidebar:', error)
      }
    })
    
    // Configurar listeners de eventos e gerenciar limpeza
    const cleanup = onMounted(() => {
      return setupOutsideClickListener()
    })
    
    // Cleanup na desmontagem
    onUnmounted(() => {
      // Remover event listeners
      if (cleanup && typeof cleanup === 'function') {
        cleanup()
      }
      
      // Remover listener de visibilidade
      document.removeEventListener('visibilitychange', () => {})
      
      // Limpar canais do Supabase se necessário
      
      // Use apenas esta abordagem:
      const channelNames = ['processos-changes', 'editais-updates', 'lances-updates']
      channelNames.forEach(name => {
        const channel = SupabaseManager.getSubscription(name)
        if (channel) {
          supabase.removeChannel(channel)
          SupabaseManager.removeSubscription(name)
        }
      })
    })

    // Observer para mudanças no estado do sidebar
    watch([isActive, isPinned], ([newActive, newPinned]) => {
      localStorage.setItem('sidebarState', newActive.toString())
      localStorage.setItem('sidebarPinned', newPinned.toString())
      adjustMainContent()
    })

    return {
      // Estado
      isAdmin,
      isActive,
      isPinned,
      isDarkMode,
      unreadNotifications,
      routes,
      
      // Métodos
      toggleSidebar,
      adjustMainContent,
      toggleDarkMode,
      handleLogout,
      toggleNotifications,
      checkNotifications,
      handleAdminClick
    }
  }
}