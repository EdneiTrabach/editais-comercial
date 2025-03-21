import { NOTIFICATION_LEVELS } from '@/api/notificationsApi';

export default {
  name: 'NotificationItem',
  props: {
    notification: {
      type: Object,
      required: true
    }
  },
  emits: ['mark-read', 'resolve'],
  setup(props, { emit }) {
    // Função para obter o ícone apropriado para cada tipo de notificação
    const getIconForType = (tipo) => {
      const iconsMap = {
        'processo': '/icons/pasta.svg',
        'sistema': '/icons/app.svg',
        'usuario': '/icons/cartao-usuario.svg',
        'alerta': '/icons/alerta.svg',
        'prazo': '/icons/relogio.svg',
        'impugnacao': '/icons/documento.svg',
        'default': '/icons/bell.svg'
      };
      
      return iconsMap[tipo] || iconsMap.default;
    };
    
    // Função para formatar o tempo de forma amigável
    const formatTime = (isoString) => {
      if (!isoString) return '';
      
      try {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        // Texto em português
        if (diffSeconds < 60) {
          return 'agora mesmo';
        } else if (diffMinutes < 60) {
          return `há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
        } else if (diffHours < 24) {
          return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        } else if (diffDays < 30) {
          return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
        } else {
          // Formato de data completo para datas mais antigas
          return date.toLocaleDateString('pt-BR', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        return isoString;
      }
    };
    
    // Formatar o nível de prioridade para exibição
    const formatLevel = (level) => {
      const levelMap = {
        [NOTIFICATION_LEVELS.MUITO_ALTO]: 'Muito Alto',
        [NOTIFICATION_LEVELS.ALTO]: 'Alto',
        [NOTIFICATION_LEVELS.MEDIO]: 'Médio',
        [NOTIFICATION_LEVELS.LEVE]: 'Leve'
      };
      
      return levelMap[level] || level;
    };
    
    // Obter classe CSS para o nível
    const getLevelClass = (level) => {
      return `level-${level}`;
    };
    
    // Função para marcar a notificação como lida
    const markAsRead = () => {
      emit('mark-read', props.notification.id);
    };
    
    // Função para abrir o formulário de resolução
    const resolve = () => {
      emit('resolve', props.notification);
    };
    
    return {
      getIconForType,
      formatTime,
      markAsRead,
      resolve,
      formatLevel,
      getLevelClass
    };
  }
}
