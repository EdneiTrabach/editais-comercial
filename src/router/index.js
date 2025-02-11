import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import HomeView from '../views/HomeView.vue'
import RepresentantesView from '@/views/RepresentantesView.vue'

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
      component: () => import('../views/ProcessosView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/representantes',
      name: 'representantes',
      component: RepresentantesView
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (to.matched.some(record => record.meta.requiresAuth) && !session) {
    next('/login')
  } else {
    next()
  }
})

export default router
