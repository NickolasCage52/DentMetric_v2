import { createRouter, createWebHistory } from 'vue-router'
import { isAdminTokenValid } from '@/services/adminApi'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/',
      name: 'main',
      component: () => import('@/App.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'admin-login' && isAdminTokenValid()) {
    return { name: 'admin-dashboard' }
  }
  if (to.matched.some((r) => r.meta.requiresAdminAuth)) {
    if (!isAdminTokenValid()) {
      return { name: 'admin-login' }
    }
  }
})
