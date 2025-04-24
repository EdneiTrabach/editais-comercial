import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import HomeView from '../views/HomeView.vue'
import RepresentantesView from '@/views/RepresentantesView.vue'
import PlataformasView from '@/views/PlataformasView.vue'
import ProcessosView from '@/views/ProcessosView.vue'
import RelatoriosView from '@/views/RelatoriosView.vue'
import EmpresasView from '../views/Empresas'
import ConfiguracoesView from '@/views/ConfiguracoesView.vue'
import ResponsaveisAdminView from '../views/ResponsaveisAdminView.vue'
import LancesView from '../views/LancesView.vue'
import PlanilhaValoresReadequada from '@/components/lances/PlanilhaValoresReadequada.vue'
import BackupsView from '@/views/BackupsView.vue'
import RelatoriosParticiparView from '@/views/RelatoriosParticiparView.vue';

const requireAdmin = async (to, from, next) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Verificando permissões para:', user?.email)
    
    if (!user) {
      console.log('Usuário não autenticado')
      next({ path: '/login' })
      return
    }

    // Busca apenas os campos necessários
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Perfil encontrado:', profile)

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      throw error
    }

    if (profile?.role === 'admin') {
      console.log('Acesso permitido - usuário é admin')
      next()
    } else {
      console.log('Acesso negado - usuário não é admin')
      alert(`Acesso negado para ${user.email}. Você não tem permissão de administrador.`)
      next({ path: from.path })
    }
  } catch (error) {
    console.error('Erro na verificação de permissão:', error)
    next({ path: from.path })
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/',
      redirect: '/processos' // Redireciona / para /processos
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/lances',
      name: 'LancesView',
      component: LancesView
    },
    {
      path: '/lances/readequacao',
      name: 'PlanilhaReadequada',
      component: PlanilhaValoresReadequada
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPassword.vue')
    },
    {
      path: '/funcionalidades',
      name: 'funcionalidades',
      component: () => import('../views/FuncionalidadesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/editais/novo',
      name: 'novo-edital',
      component: () => import('../views/EditaisView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/editais',
      name: 'editais',
      component: () => import('../views/EditaisView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/processos',
      name: 'processos',
      component: ProcessosView, // Use o componente diretamente ao invés de importação dinâmica
      meta: { requiresAuth: true }
    },
    {
      path: '/representantes',
      name: 'representantes',
      component: RepresentantesView
    },
    {
      path: '/plataformas',
      name: 'plataformas',
      component: PlataformasView,
      meta: { requiresAuth: true }
    },
    {
      path: '/empresas',
      name: 'empresas',
      component: EmpresasView, // <- CORRIGIDO: no singular
      meta: { requiresAuth: true }
    },
    {
      path: '/relatorios',
      name: 'relatorios',
      component: RelatoriosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/configuracoes',
      name: 'configuracoes',
      component: ConfiguracoesView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true
      },
      beforeEnter: requireAdmin
    },
    {
      path: '/sistemas',
      name: 'sistemas',
      component: () => import('../views/SistemasView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/responsaveis',
      name: 'ResponsaveisAdmin',
      component: ResponsaveisAdminView,
      meta: { 
        requiresAuth: true,
        requiresAdmin: true // Para proteger a rota apenas para admins
      }
    },
    // Adicione esta rota ao seu array de rotas
    {
      path: '/publicacoes-contratuais',
      name: 'publicacoes-contratuais',
      // Atualize para o caminho correto do componente
      component: () => import('../views/PublicacoesContratuais/PublicacoesContratuaisView.vue')
    },
    // Adicione esta rota
    {
      path: '/configuracoes-ia',
      name: 'configuracoes-ia',
      component: () => import('../views/ConfiguracoesIAView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // Adicione a nova rota dentro do array routes
    {
      path: '/backups',
      name: 'backups',
      component: BackupsView,
      meta: { 
        requiresAuth: true,
        requiresAdmin: true 
      },
      beforeEnter: requireAdmin
    },
    // Adicione um catch-all route
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue')
    },
    {
      path: '/planilha-readequada',
      name: 'PlanilhaReadequada',
      component: () => import('@/components/lances/PlanilhaValoresReadequada.vue')
    },
    {
      path: '/analises',
      name: 'Analises',
      component: () => import('@/views/AnalisesView.vue')
    },
    {
      path: '/relatorios-participar',
      name: 'relatorios-participar',
      component: RelatoriosParticiparView,
      meta: { requiresAuth: true }
    },
    
  ]
})

// Middleware de navegação para verificar atualizações
router.beforeEach(async (to, from, next) => {
  // Se a rota for de login ou registro, prosseguir normalmente
  if (to.path === '/login' || to.path === '/register') {
    return next();
  }
  
  // Verificar se existe usuário logado
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return next('/login');
  }
  
  // Verificar atualizações não lidas
  const app = document.querySelector('#app')?.__vue_app__;
  const systemUpdates = app?.provides?.systemUpdates;
  
  if (systemUpdates) {
    await systemUpdates.checkForUpdates();
    
    // Se houver atualizações e o modal não estiver aberto, abri-lo
    if (systemUpdates.unreadUpdates.value.length > 0 && !systemUpdates.showUpdateModal.value) {
      systemUpdates.showUpdateModal.value = true;
    }
  }
  
  next();
});

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  // Simplifica a lógica de redirecionamento
  if (to.path === '/login' && session) {
    next('/processos')
    return
  }

  if (to.meta.requiresAuth && !session) {
    next('/login')
    return
  }

  next()
})

export default router
