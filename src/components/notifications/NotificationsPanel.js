import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { supabase } from '@/lib/supabase';
import { markNotificationAsRead, resolveNotification } from '@/api/notificationsApi';
import NotificationItem from './NotificationItem.vue';
import ResolveNotificationForm from './ResolveNotificationForm.vue';

export default {
  name: 'NotificationsPanel',
  components: {
    NotificationItem,
    ResolveNotificationForm
  },
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'count-updated'],
  setup(props, { emit }) {
    const notifications = ref([]);
    const loading = ref(true);
    const activeTab = ref('all');
    const showResolveForm = ref(false);
    const selectedNotification = ref(null);

    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.read).length;
    });

    const hasUnread = computed(() => unreadCount.value > 0);

    const filteredNotifications = computed(() => {
      if (activeTab.value === 'unread') {
        return notifications.value.filter(n => !n.read);
      } else if (activeTab.value === 'resolved') {
        return notifications.value.filter(n => n.resolved);
      }
      return notifications.value;
    });

    const loadNotifications = async () => {
      try {
        loading.value = true;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Buscar todas as notificações do usuário com detalhes dos processos
        const { data, error } = await supabase
          .from('notification_recipients')
          .select(`
            id,
            read,
            read_at,
            notification:notification_id (
              id,
              title,
              message,
              created_at,
              resolved,
              resolved_at,
              observation,
              tipo,
              processo:processo_id (
                id,
                numero_processo,
                orgao
              ),
              sender:sender_id (
                id,
                nome,
                email
              ),
              resolver:resolved_by (
                id,
                nome,
                email
              )
            )
          `)
          .eq('user_id', user.id)
          .order('notification(created_at)', { ascending: false });

        if (error) throw error;

        // Transformar os dados para um formato mais fácil de usar
        notifications.value = data.map(item => ({
          id: item.notification.id,
          recipientId: item.id,
          title: item.notification.title,
          message: item.notification.message,
          created_at: item.notification.created_at,
          resolved: item.notification.resolved,
          resolved_at: item.notification.resolved_at,
          observation: item.notification.observation,
          tipo: item.notification.tipo,
          read: item.read,
          read_at: item.read_at,
          processo: item.notification.processo,
          sender: item.notification.sender,
          resolver: item.notification.resolver
        }));

        // Emitir evento com o número de notificações não lidas
        emit('count-updated', unreadCount.value);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        // Para fins de desenvolvimento, criar uma notificação de exemplo se falhar
        notifications.value = [
          {
            id: '1',
            recipientId: '1',
            title: 'Notificação de exemplo',
            message: 'Esta é uma notificação de teste para desenvolvimento.',
            created_at: new Date().toISOString(),
            resolved: false,
            tipo: 'sistema',
            read: false
          }
        ];
      } finally {
        loading.value = false;
      }
    };

    const markAsRead = async (notificationId) => {
      try {
        const notification = notifications.value.find(n => n.id === notificationId);
        if (!notification || notification.read) return;

        const result = await markNotificationAsRead(notification.recipientId);
        
        if (!result.success) throw new Error('Falha ao marcar como lida');

        // Atualizar localmente
        notification.read = true;
        notification.read_at = new Date().toISOString();
        
        // Emitir evento com o novo número de notificações não lidas
        emit('count-updated', unreadCount.value);
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    };

    const markAllAsRead = async () => {
      try {
        const unreadNotifications = notifications.value.filter(n => !n.read);
        if (unreadNotifications.length === 0) return;

        const recipientIds = unreadNotifications.map(n => n.recipientId);
        
        // Atualizar todas as notificações no banco de dados
        // Aqui usamos uma abordagem simples, mas você poderia criar uma função de API para isso
        const { error } = await supabase
          .from('notification_recipients')
          .update({
            read: true,
            read_at: new Date().toISOString()
          })
          .in('id', recipientIds);

        if (error) throw error;

        // Atualizar localmente
        unreadNotifications.forEach(notification => {
          notification.read = true;
          notification.read_at = new Date().toISOString();
        });
        
        // Emitir evento com o novo número de notificações não lidas
        emit('count-updated', 0);
      } catch (error) {
        console.error('Erro ao marcar todas notificações como lidas:', error);
      }
    };

    const openResolveForm = (notification) => {
      selectedNotification.value = notification;
      showResolveForm.value = true;
    };

    const onNotificationResolved = (resolvedNotification) => {
      // Atualizar notificação na lista
      const index = notifications.value.findIndex(n => n.id === resolvedNotification.id);
      if (index !== -1) {
        notifications.value[index] = {
          ...notifications.value[index],
          resolved: true,
          resolved_at: resolvedNotification.resolved_at,
          resolver: resolvedNotification.resolver,
          observation: resolvedNotification.observation
        };
      }
      
      showResolveForm.value = false;
    };

    const close = () => {
      emit('close');
    };

    // Estado para arrastar e redimensionar
    const panel = ref(null);
    const isDragging = ref(false);
    const isResizing = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    const panelPosition = ref({ x: 0, y: 0 });
    const panelSize = ref({ width: 600, height: 500 });

    // Carregar preferências do usuário
    const loadUserPreferences = () => {
      try {
        const savedPosition = localStorage.getItem('notificationPanelPosition');
        const savedSize = localStorage.getItem('notificationPanelSize');
        
        if (savedPosition) {
          panelPosition.value = JSON.parse(savedPosition);
        } else {
          // Posição padrão centralizada
          panelPosition.value = {
            x: Math.max(0, (window.innerWidth - panelSize.value.width) / 2),
            y: Math.max(0, (window.innerHeight - panelSize.value.height) / 2)
          };
        }
        
        if (savedSize) {
          panelSize.value = JSON.parse(savedSize);
        }
      } catch (error) {
        console.error('Erro ao carregar preferências do painel:', error);
      }
    };

    // Salvar preferências do usuário
    const saveUserPreferences = () => {
      try {
        localStorage.setItem('notificationPanelPosition', JSON.stringify(panelPosition.value));
        localStorage.setItem('notificationPanelSize', JSON.stringify(panelSize.value));
      } catch (error) {
        console.error('Erro ao salvar preferências do painel:', error);
      }
    };

    // Estilo computado para o painel
    const panelStyle = computed(() => {
      return {
        left: `${panelPosition.value.x}px`,
        top: `${panelPosition.value.y}px`,
        width: `${panelSize.value.width}px`,
        height: `${panelSize.value.height}px`,
        transform: 'none' // Removemos o transform original
      };
    });

    // Iniciar arrasto
    const startDrag = (event) => {
      const e = event.touches ? event.touches[0] : event;
      isDragging.value = true;
      
      const rect = panel.value.getBoundingClientRect();
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
      
      // Evitar seleção de texto durante arrasto
      document.body.style.userSelect = 'none';
    };

    // Arrastar
    const drag = (event) => {
      if (!isDragging.value) return;
      
      const e = event.touches ? event.touches[0] : event;
      
      // Calcular nova posição
      let newX = e.clientX - dragOffset.value.x;
      let newY = e.clientY - dragOffset.value.y;
      
      // Limitar ao tamanho da janela
      newX = Math.max(0, Math.min(newX, window.innerWidth - panelSize.value.width));
      newY = Math.max(0, Math.min(newY, window.innerHeight - panelSize.value.height));
      
      panelPosition.value = { x: newX, y: newY };
    };

    // Parar arrasto
    const stopDrag = () => {
      isDragging.value = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      
      document.body.style.userSelect = '';
      
      // Salvar preferências após arrastar
      saveUserPreferences();
    };

    // Iniciar redimensionamento
    const startResize = (event) => {
      const e = event.touches ? event.touches[0] : event;
      isResizing.value = true;
      
      const rect = panel.value.getBoundingClientRect();
      dragOffset.value = {
        x: rect.width - (e.clientX - rect.left),
        y: rect.height - (e.clientY - rect.top)
      };
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('touchmove', resize);
      document.addEventListener('mouseup', stopResize);
      document.addEventListener('touchend', stopResize);
      
      document.body.style.userSelect = 'none';
    };

    // Redimensionar
    const resize = (event) => {
      if (!isResizing.value) return;
      
      const e = event.touches ? event.touches[0] : event;
      
      // Calcular novo tamanho
      const newWidth = e.clientX - panelPosition.value.x + dragOffset.value.x;
      const newHeight = e.clientY - panelPosition.value.y + dragOffset.value.y;
      
      // Limitar tamanho mínimo e máximo
      panelSize.value = {
        width: Math.max(300, Math.min(newWidth, window.innerWidth - panelPosition.value.x)),
        height: Math.max(200, Math.min(newHeight, window.innerHeight - panelPosition.value.y))
      };
    };

    // Parar redimensionamento
    const stopResize = () => {
      isResizing.value = false;
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('touchmove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchend', stopResize);
      
      document.body.style.userSelect = '';
      
      // Salvar preferências após redimensionar
      saveUserPreferences();
    };

    // Escutar mudanças em props.show
    watch(() => props.show, (newValue) => {
      if (newValue) {
        loadNotifications();
      }
    });

    // Configurar escuta de atualizações em tempo real
    onMounted(() => {
      // Carregar preferências do usuário ao montar
      loadUserPreferences();
      
      // Carregar notificações quando o componente for montado
      if (props.show) {
        loadNotifications();
      }
      
      // Configurar canal de tempo real para atualizações de notificações
      const channel = supabase.channel('notifications-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notification_recipients' }, 
          () => loadNotifications()
        )
        .subscribe();

      // Limpar o canal quando o componente for desmontado
      return () => {
        supabase.removeChannel(channel);
      };
    });

    onUnmounted(() => {
      // Limpar event listeners
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('touchmove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchend', stopResize);
    });

    return {
      notifications,
      loading,
      activeTab,
      unreadCount,
      hasUnread,
      filteredNotifications,
      showResolveForm,
      selectedNotification,
      markAsRead,
      markAllAsRead,
      openResolveForm,
      onNotificationResolved,
      close,
      panel,
      panelStyle,
      startDrag,
      drag,
      stopDrag,
      startResize,
      resize,
      stopResize
    };
  }
}
