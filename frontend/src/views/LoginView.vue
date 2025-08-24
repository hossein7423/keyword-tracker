<template>
  <div class="login-container">
    <div class="login-box">
      <h1>ورود به سیستم</h1>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="username">نام کاربری</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="input-group">
          <label for="password">رمز عبور</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? 'در حال ورود...' : 'ورود' }}
        </button>
      </form>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.post('/users/login', {
      username: username.value,
      password: password.value,
    });
    if (response.data.token) {
      authStore.setToken(response.data.token);
      await authStore.fetchUser(); // دریافت اطلاعات کاربر پس از ورود
      router.push('/dashboard');
    }
  } catch (error) {
    errorMessage.value = 'نام کاربری یا رمز عبور اشتباه است.';
    console.error('Login failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f2f5; }
.login-box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; text-align: center; }
h1 { margin-bottom: 1.5rem; color: #333; }
.input-group { margin-bottom: 1.25rem; text-align: right; }
label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 600; }
input { width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.login-button { width: 100%; padding: 0.75rem; border: none; border-radius: 4px; background-color: #007bff; color: white; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
.login-button:hover { background-color: #0056b3; }
.login-button:disabled { background-color: #a0c7e4; cursor: not-allowed; }
.error-message { margin-top: 1rem; color: #d93025; }
</style>