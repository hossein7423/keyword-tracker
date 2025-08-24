<template>
  <div class="page-container">
    <header class="header">
      <h1>مدیریت کاربران</h1>
      <router-link to="/dashboard" class="back-link">بازگشت به داشبورد</router-link>
    </header>
    <main class="main-content">
      <div v-if="loading">در حال بارگذاری کاربران...</div>
      <div v-else class="user-list">
        <div v-for="user in users" :key="user.id" class="user-card">
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <span class="role">{{ user.role }}</span>
          </div>
          <div class="permissions" v-if="user.role !== 'admin'">
            <h3>دسترسی وب‌سایت‌ها</h3>
            <div class="website-checkboxes">
              <div v-for="website in allWebsites" :key="website.id" class="checkbox-group">
                <input
                  type="checkbox"
                  :id="`user-${user.id}-website-${website.id}`"
                  :checked="userHasAccess(user, website.id)"
                  @change="togglePermission(user, website.id, $event.target.checked)"
                >
                <label :for="`user-${user.id}-website-${website.id}`">{{ website.name }}</label>
              </div>
            </div>
          </div>
          <div v-else class="admin-note">
            ادمین به تمام وب‌سایت‌ها دسترسی دارد.
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';

const users = ref([]);
const allWebsites = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [usersRes, websitesRes] = await Promise.all([
      api.get('/users'),
      api.get('/websites')
    ]);
    users.value = usersRes.data;
    allWebsites.value = websitesRes.data;
  } catch (error) {
    console.error("Failed to load data:", error);
  } finally {
    loading.value = false;
  }
});

const userHasAccess = (user, websiteId) => {
  return user.Websites.some(w => w.id === websiteId);
};

const togglePermission = async (user, websiteId, hasAccess) => {
  try {
    if (hasAccess) {
      await api.post(`/websites/${websiteId}/assign`, { userId: user.id });
      user.Websites.push(allWebsites.value.find(w => w.id === websiteId));
    } else {
      await api.delete(`/websites/${websiteId}/assign/${user.id}`);
      user.Websites = user.Websites.filter(w => w.id !== websiteId);
    }
  } catch (error) {
    console.error("Failed to update permission:", error);
    alert('خطا در تغییر دسترسی.');
    location.reload();
  }
};
</script>

<style scoped>
.page-container { font-family: sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.back-link { text-decoration: none; color: #007bff; font-weight: bold; }
.main-content { padding: 2rem; }
.user-list { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); }
.user-card { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.user-info { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; }
.username { font-size: 1.2rem; font-weight: bold; }
.role { background: #e9ecef; color: #495057; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.admin-note { color: #6c757d; }
.website-checkboxes { display: flex; flex-direction: column; gap: 0.5rem; }
.checkbox-group { display: flex; align-items: center; }
.checkbox-group input { margin-left: 0.5rem; }
</style>