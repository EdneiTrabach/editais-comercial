import { ref } from 'vue';
import { resolveNotification, NOTIFICATION_LEVELS } from '@/api/notificationsApi';
import { supabase } from '@/lib/supabase';

export default {
  name: 'ResolveNotificationForm',
  props: {
    notification: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'resolved'],
  setup(props, { emit }) {
    const observation = ref('');
    const loading = ref(false);

    // Fechar o formulário
    const close = () => {
      emit('close');
    };

    // Resolver a notificação
    const handleResolve = async () => {
      try {
        loading.value = true;
        
        // Verificar se o usuário está autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        // Buscar o perfil do usuário para ter acesso ao nome
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Resolver a notificação usando a API
        const result = await resolveNotification(props.notification.id, observation.value);
        
        if (!result.success) {
          throw new Error('Falha ao resolver notificação');
        }

        // Criar objeto com os dados atualizados para emitir de volta
        const resolvedNotification = {
          ...props.notification,
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolver: {
            id: user.id,
            nome: profile.nome,
            email: profile.email
          },
          observation: observation.value
        };

        // Enviar de volta ao componente pai
        emit('resolved', resolvedNotification);
      } catch (error) {
        console.error('Erro ao resolver notificação:', error);
        alert('Erro ao resolver notificação. Tente novamente.');
      } finally {
        loading.value = false;
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

    return {
      observation,
      loading,
      close,
      handleResolve,
      formatLevel,
      getLevelClass
    };
  }
}
