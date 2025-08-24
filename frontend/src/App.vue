<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

// وقتی برنامه برای اولین بار بارگذاری می‌شود، اطلاعات کاربر را دریافت کن
onMounted(() => {
  authStore.fetchUser()
})
</script>

<template>
  <RouterView />
</template>

<style>
/* استایل‌های عمومی */
body {
  margin: 0;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>