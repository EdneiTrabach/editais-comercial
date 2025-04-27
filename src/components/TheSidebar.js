import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { getUnreadNotificationsCount } from '@/api/notificationsApi'
import { SupabaseManager } from '@/lib/supabaseManager' // Caminho corrigido
import Shepherd from '../components/Shepherd.vue';
import NotificationsPanel from './notifications/NotificationsPanel.vue'
import NotificationButton from './notifications/NotificationButton.vue'
import '../assets/styles/themes/red-theme.css'
import '../assets/styles/themes/baby-blue-theme.css'
import '../assets/styles/themes/green-theme.css'
import '../assets/styles/themes/purple-theme.css'
import '../assets/styles/themes/yellow-theme.css'
import '../assets/styles/themes/orange-theme.css'
import '../assets/styles/themes/pink-theme.css'
import '../assets/styles/themes/black-theme.css'

export default {
  name: 'TheSidebar',
  components: {
    Shepherd,
    NotificationsPanel,
    NotificationButton
  },
  emits: ['sidebarToggle'],
  
  methods: {
    // Adicione o método logNavigation aqui
    logNavigation() {
      console.log('Navegando para o processador de documentos');
    }
    // ...outros métodos do TheSidebar.js
  },
  
  setup(props, { emit }) {
    const router = useRouter()
    const isTourActive = ref(false)
    
    // ===== ESTADO DO COMPONENTE =====
    const isAdmin = ref(false)
    const isActive = ref(false)
    const isPinned = ref(false)
    const isDarkMode = ref(false)
    const unreadNotifications = ref(0)
    const currentTheme = ref(localStorage.getItem('theme') || 'light')
    const showThemeSelector = ref(false)
    
    // Texto do tooltip para o botão de toggle
    const sidebarTriggerTooltip = computed(() => {
      if (!isActive.value) return 'Abrir menu lateral'
      if (isPinned.value) return 'Desafixar menu (manterá aberto até clicar fora)'
      return 'Fixar menu lateral (impede fechamento automático)'
    })
    
    const tourSteps = [
      {
        id: 'welcome',
        title: 'Bem-vindo ao Editais',
        text: 'Este é um tour guiado para ajudá-lo a navegar pelo sistema. Vamos começar!',
        attachTo: {
          element: '.sidebar-header',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Pular tour',
            action: function() { return this.cancel(); },
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Próximo',
            action: function() { return this.next(); },
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'processos',
        title: 'Processos',
        text: 'Acesse todos os processos de licitação aqui.',
        attachTo: {
          element: '.nav-links li:nth-child(1)',
          on: 'right'
        },
        buttons: [
          {
            text: 'Voltar',
            action: function() { return this.back(); },
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Próximo',
            action: function() { return this.next(); },
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'funcionalidades',
        title: 'Funcionalidades',
        text: 'Veja todas as funcionalidades do sistema nesta seção.',
        attachTo: {
          element: '.nav-links li:nth-child(2)',
          on: 'right'
        },
        buttons: [
          {
            text: 'Voltar',
            action: function() { return this.back(); },
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Próximo',
            action: function() { return this.next(); },
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'theme-toggle',
        title: 'Modo Escuro',
        text: 'Alterne entre o modo claro e escuro para melhor visualização.',
        attachTo: {
          element: '.theme-toggle',
          on: 'right'
        },
        buttons: [
          {
            text: 'Voltar',
            action: function() { return this.back(); },
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Próximo',
            action: function() { return this.next(); },
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'notifications',
        title: 'Notificações',
        text: 'Veja suas notificações do sistema aqui.',
        attachTo: {
          element: '.notifications-btn',
          on: 'right'
        },
        buttons: [
          {
            text: 'Voltar',
            action: function() { return this.back(); },
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Próximo',
            action: function() { return this.next(); },
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'sidebar-trigger',
        title: 'Controle da Barra Lateral',
        text: 'Clique aqui para expandir ou recolher a barra lateral.',
        attachTo: {
          element: '.sidebar-trigger',
          on: 'right'
        },
        buttons: [
          {
            text: 'Voltar',
            action: function() { return this.back(); },
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Próximo',
            action: function() { return this.next(); },
            classes: 'shepherd-button-primary'
          }
        ]
      },
      {
        id: 'sidebar-pin',
        title: 'Fixar Barra Lateral',
        text: 'Quando a barra lateral está aberta, você pode clicar novamente no botão (◀) para fixá-la. Isso a manterá sempre visível, mesmo quando clicar em outras áreas. Quando fixada, o ícone muda para 📌. Clique nele para desafixar.',
        attachTo: {
          element: '.sidebar-trigger',
          on: 'right'
        },
        buttons: [
          {
            text: 'Voltar',
            action: function() { return this.back(); },
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Finalizar',
            action: function() { return this.complete(); },
            classes: 'shepherd-button-primary'
          }
        ]
      }
    ]
    
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

    const navLinks = ref([
      { path: '/processos', name: 'Processos', icon: '/icons/processo.svg' },
      { path: '/editais', name: 'Edital', icon: '/icons/edital.svg' },
      { path: '/analises', name: 'Análises', icon: '/icons/analise.svg' },
      { path: '/documentos', name: 'Documentos', icon: '/icons/documento.svg' },
      { path: '/relatorios-participar', name: 'Relatórios', icon: '/icons/relatorio.svg' },
      { path: '/plataformas', name: 'Plataformas', icon: '/icons/plataforma.svg' },
      { path: '/sistemas', name: 'Sistemas', icon: '/icons/sistema.svg' },
      { path: '/empresas', name: 'Empresas', icon: '/icons/empresa.svg' },
      { path: '/document-processor', name: 'Processador', icon: '/icons/pdf.svg' }, // Nova rota
      { path: '/responsaveis', name: 'Responsáveis', icon: '/icons/responsavel.svg' }
    ])

    // ===== GERENCIAMENTO DO SIDEBAR =====
    
    // Toggle do sidebar (expandir/recolher)
    const toggleSidebar = () => {
      if (isTourActive.value) {
        isActive.value = true;
        isPinned.value = true;
        saveSidebarState();
      } else if (isActive.value) {
        // Se já está ativo, toggle o estado fixado
        isPinned.value = !isPinned.value;
        saveSidebarState();
      } else {
        // Se não está ativo, ativar
        isActive.value = true;
        isPinned.value = true; // Quando ativamos manualmente, já fixa
        saveSidebarState();
      }
      
      // Emitir evento de toggle
      emit('sidebarToggle', isActive.value);
      
      // Ajustar o conteúdo após uma breve espera
      setTimeout(() => {
        adjustMainContent();
      }, 10);
    }
    
    // Salvar estado do sidebar no localStorage
    const saveSidebarState = () => {
      localStorage.setItem('sidebarState', isActive.value.toString())
      localStorage.setItem('sidebarPinned', isPinned.value.toString())
    }
    
    // Carregar estado do sidebar do localStorage
    const loadSidebarState = () => {
      const savedState = localStorage.getItem('sidebarState');
      isActive.value = savedState === 'true';
      isPinned.value = localStorage.getItem('sidebarPinned') === 'true';
      
      // Se não houver estado salvo, começa recolhido
      if (savedState === null) {
        isActive.value = false;
        localStorage.setItem('sidebarState', 'false');
      }
    }

    // Ajustar margens do conteúdo principal
    const adjustMainContent = () => {
      const mainContents = document.querySelectorAll('.main-content')
      mainContents.forEach(content => {
        if (isActive.value) {
          content.style.marginLeft = '280px';
          content.classList.add('expanded');
        } else {
          content.style.marginLeft = '70px';
          content.classList.remove('expanded');
        }
        content.style.transition = 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
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
    const toggleThemeSelector = () => {
      showThemeSelector.value = !showThemeSelector.value
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
    
    // Variáveis para o painel de notificações
    const showNotificationsPanel = ref(false);
    const notificationPanelPosition = ref({ top: 0, right: 0 });

    // Toggle do painel de notificações
    const toggleNotifications = (event) => {
      // Não precisamos mais calcular posição, pois o painel ficará centralizado
      showNotificationsPanel.value = !showNotificationsPanel.value;
    };
    
    // Verificar notificações não lidas
    const checkNotifications = async () => {
      try {
        const count = await getUnreadNotificationsCount();
        unreadNotifications.value = count;
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };
    
    // Atualizar a contagem de notificações
    const updateNotificationsCount = (count) => {
      unreadNotifications.value = count;
      localStorage.setItem('unreadNotificationsCount', count);
      window.dispatchEvent(new CustomEvent('notifications-count-updated', { 
        detail: { count } 
      }));
    };

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
        
        // Não fechar sidebar se tour estiver ativo
        if (isTourActive.value) return;
        
        if (sidebar && trigger && 
            !sidebar.contains(e.target) && 
            !trigger.contains(e.target)) {
          if (!isPinned.value && isActive.value) {
            isActive.value = false
            adjustMainContent()
            
            // Emitir evento quando o sidebar for fechado por click outside
            emit('sidebarToggle', false)
            
            // Salvar o estado
            saveSidebarState()
          }
        }
      }
    
      const handleKeydown = (e) => {
        // Não fechar sidebar com ESC se tour estiver ativo
        if (isTourActive.value) return;
        
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
      currentTheme.value = savedTheme
      isDarkMode.value = savedTheme === 'dark'
      
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
      
      // Escutar evento para abrir painel de notificações
      window.addEventListener('open-notifications-panel', () => {
        showNotificationsPanel.value = true;
      });
      
      // Quando a contagem de notificações mudar, armazenar no localStorage e disparar evento
      watch(unreadNotifications, (newCount) => {
        localStorage.setItem('unreadNotificationsCount', newCount);
        window.dispatchEvent(new CustomEvent('notifications-count-updated', { 
          detail: { count: newCount } 
        }));
      });
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
      
      window.removeEventListener('open-notifications-panel', () => {});
    })

    // Observer para mudanças no estado do sidebar
    watch([isActive, isPinned], ([newActive, newPinned]) => {
      localStorage.setItem('sidebarState', newActive.toString())
      localStorage.setItem('sidebarPinned', newPinned.toString())
      adjustMainContent()
    })

    // Método para iniciar o tour garantindo que a sidebar esteja aberta
    const startTour = function() {
      // Garantir que a sidebar esteja aberta para o tour
      isActive.value = true
      isPinned.value = true
      saveSidebarState()
      adjustMainContent()
      
      // Marcar que o tour está ativo para prevenir fechamento da sidebar
      isTourActive.value = true
      
      // Iniciar o tour após pequeno delay para garantir que a sidebar esteja expandida
      setTimeout(() => {
        if (this.$refs.tourGuide) {
          this.$refs.tourGuide.startTour();
          
          // Adicionar listeners para eventos do tour
          this.$refs.tourGuide.tour.on('complete', () => {
            isTourActive.value = false
          });
          
          this.$refs.tourGuide.tour.on('cancel', () => {
            isTourActive.value = false
          });
        }
      }, 300);
    }

    const setTheme = (theme) => {
      currentTheme.value = theme
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
      showThemeSelector.value = false
      // Atualize também a variável isDarkMode para compatibilidade
      isDarkMode.value = theme === 'dark'
    }

    document.addEventListener('click', (e) => {
      if (showThemeSelector.value && !e.target.closest('.theme-selector')) {
        showThemeSelector.value = false
      }
    })

    return {
      // Estado
      isAdmin,
      isActive,
      isPinned,
      isDarkMode,
      unreadNotifications,
      routes,
      tourSteps,
      isTourActive,
      sidebarTriggerTooltip,
      showNotificationsPanel,
      notificationPanelPosition,
      currentTheme,
      showThemeSelector,
      navLinks,
      
      // Métodos
      toggleSidebar,
      adjustMainContent,
      toggleThemeSelector,
      handleLogout,
      toggleNotifications,
      checkNotifications,
      handleAdminClick,
      startTour,
      updateNotificationsCount,
      setTheme
    }
  }
}