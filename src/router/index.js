import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import HomeView from '../views/HomeView.vue'
import RepresentantesView from '@/views/RepresentantesView.vue'
import PlataformasView from '@/views/PlataformasView.vue'
import ProcessosView from '../views/ProcessosView.vue' // Importe diretamente
import RelatoriosView from '@/views/RelatoriosView.vue'
import EmpresasView from '../views/EmpresasView.vue'
import ConfiguracoesView from '@/views/ConfiguracoesView.vue'

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
      name: 'Lances',
      component: () => import('@/views/LancesView.vue')
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
    // Adicione um catch-all route
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue')
    }
  ]
})

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
