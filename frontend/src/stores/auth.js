import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('authToken') || null)
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('authToken', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('authToken')
    delete api.defaults.headers.common['Authorization'];
    router.push('/login');
  }

  async function fetchUser() {
    if (token.value) {
      try {
        const response = await api.get('/users/profile')
        user.value = response.data
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        clearAuth()
      }
    }
  }

  return { token, user, isAuthenticated, isAdmin, setToken, clearAuth, fetchUser }
})