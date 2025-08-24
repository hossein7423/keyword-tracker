import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth';

const routes = [
  { 
    path: '/', 
    redirect: '/login' 
  },
  { 
    path: '/login', 
    name: 'login', 
    component: LoginView 
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true } 
  },
  {
    path: '/websites/:id',
    name: 'website-detail',
    component: () => import('../views/WebsiteDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'user-management',
    component: () => import('../views/UserManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const loggedIn = !!authStore.token;

  // Pinia store ممکن است هنوز بارگذاری نشده باشد، پس باید صبر کنیم
  if (to.meta.requiresAuth && loggedIn && !authStore.user) {
    authStore.fetchUser().then(() => {
      if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/dashboard');
      } else {
        next();
      }
    });
  } else if (to.meta.requiresAuth && !loggedIn) {
    next('/login');
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router