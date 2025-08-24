<template>
  <div class="dashboard">
    <header class="header">
      <h1>داشبورد</h1>
      <div class="header-actions">
        <router-link v-if="authStore.isAdmin" to="/admin/users" class="nav-link">
          مدیریت کاربران
        </router-link>
        <button @click="logout" class="logout-button">خروج</button>
      </div>
    </header>
    <main class="main-content">
      
      <div v-if="authStore.isAdmin" class="add-website-section">
        <h2>افزودن وب‌سایت جدید</h2>
        <form @submit.prevent="addWebsite" class="add-website-form">
          <input type="text" v-model="newWebsite.name" placeholder="نام وب‌سایت" required>
          <input type="url" v-model="newWebsite.url" placeholder="آدرس (https://example.com)" required>
          <button type="submit" :disabled="isAdding">
            {{ isAdding ? 'درحال افزودن...' : 'افزودن' }}
          </button>
        </form>
        <p v-if="formError" class="error">{{ formError }}</p>
      </div>

      <h2>وب‌سایت‌های من</h2>
      <div v-if="loading" class="loading">در حال بارگذاری...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <ul v-if="websites.length > 0" class="website-list">
        <router-link
          v-for="website in websites"
          :key="website.id"
          :to="`/websites/${website.id}`"
          class="website-item-link"
        >
          <li class="website-item">
            <span>{{ website.name }}</span>
            <span class="website-url">{{ website.url }}</span>
          </li>
        </router-link>
      </ul>
      <p v-else-if="!loading">هیچ وب‌سایتی برای نمایش وجود ندارد.</p>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const authStore = useAuthStore();
const websites = ref([]);
const loading = ref(true);
const error = ref('');
const newWebsite = reactive({ name: '', url: '' });
const isAdding = ref(false);
const formError = ref('');

const fetchWebsites = async () => {
  try {
    loading.value = true;
    const response = await api.get('/users/my-websites');
    websites.value = response.data;
  } catch {
    error.value = 'خطا در دریافت اطلاعات از سرور.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchWebsites);

const addWebsite = async () => {
  isAdding.value = true;
  formError.value = '';
  try {
    const response = await api.post('/websites', newWebsite);
    websites.value.unshift(response.data);
    newWebsite.name = '';
    newWebsite.url = '';
  } catch (err) {
    formError.value = err.response?.data?.error || 'خطا در ثبت وب‌سایت.';
  } finally {
    isAdding.value = false;
  }
};

const logout = () => {
  authStore.clearAuth();
};
</script>

<style scoped>
.dashboard { font-family: sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.header-actions { display: flex; align-items: center; gap: 1rem; }
.nav-link { text-decoration: none; color: #007bff; font-weight: bold; }
.logout-button { padding: 0.5rem 1rem; border: none; border-radius: 4px; background-color: #dc3545; color: white; cursor: pointer; font-weight: bold; }
.main-content { padding: 2rem; }
.add-website-section { background-color: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2rem; }
.add-website-form { display: flex; gap: 1rem; }
.add-website-form input { flex-grow: 1; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
.add-website-form button { padding: 0.75rem 1.5rem; border: none; background-color: #007bff; color: white; cursor: pointer; border-radius: 4px; }
h2 { margin-top: 0; margin-bottom: 1.5rem; }
.website-list { list-style: none; padding: 0; }
.website-item-link { text-decoration: none; color: inherit; display: block; margin-bottom: 0.5rem; }
.website-item { display: flex; justify-content: space-between; padding: 1rem; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; transition: background-color 0.2s; }
.website-item:hover { background-color: #e9ecef; }
.website-url { color: #6c757d; direction: ltr; text-align: left; }
.loading, .error { font-size: 1.2rem; color: #6c757d; }
.error { color: #dc3545; }
</style>