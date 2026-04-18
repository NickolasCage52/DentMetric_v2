import { createRouter, createWebHistory } from 'vue-router'
import { isAdminTokenValid } from '@/services/adminApi'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/e/:token',
      name: 'client-portal',
      meta: {
        requiresAuth: false,
        requiresGuest: false,
        isPublicPortal: true,
      },
      component: () => import('@/views/portal/ClientPortalView.vue'),
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: 'login',
          name: 'admin-login',
          component: () => import('@/views/admin/AdminLogin.vue'),
        },
        {
          path: '',
          name: 'admin-dashboard',
          meta: { requiresAdminAuth: true },
          component: () => import('@/views/admin/AdminDashboard.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      meta: { requiresGuest: true },
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/',
      name: 'main',
      meta: { requiresAuth: true },
      component: () => import('@/App.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta?.isPublicPortal) {
    return true
  }
  if (to.name === 'admin-login' && isAdminTokenValid()) {
    return { name: 'admin-dashboard' }
  }
  if (to.matched.some((r) => r.meta.requiresAdminAuth)) {
    if (!isAdminTokenValid()) {
      return { name: 'admin-login' }
    }
  }

  if (to.path.startsWith('/admin')) {
    return
  }

  const authStore = useAuthStore()
  if (!authStore.isInitialized) {
    authStore.initialize()
  }

  const isLoggedIn = authStore.isAuthenticated

  if (to.meta.requiresGuest && isLoggedIn) {
    return { path: '/' }
  }
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { path: '/login' }
  }
})
