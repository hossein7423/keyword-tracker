<template>
  <div class="page-container">
    <header class="header">
      <h1>مدیریت وب‌سایت: {{ website.name }}</h1>
      <router-link to="/dashboard" class="back-link">بازگشت به داشبورد</router-link>
    </header>
    <main class="main-content">
      <div class="keywords-section">
        <div class="section-header">
          <h2>کلیدواژه‌ها</h2>
          <form @submit.prevent="addKeyword" class="add-keyword-form">
            <input type="text" v-model="newKeyword" placeholder="کلیدواژه جدید را وارد کنید..." required>
            <button type="submit" :disabled="isAdding">
              {{ isAdding ? 'درحال افزودن...' : 'افزودن کلیدواژه' }}
            </button>
          </form>
        </div>
        <p v-if="formError" class="error">{{ formError }}</p>

        <div v-if="loading" class="loading">در حال بارگذاری...</div>
        <ul v-if="keywords.length > 0" class="keyword-list">
          <li v-for="keyword in keywords" :key="keyword.id" class="keyword-item">
            <div class="keyword-info">
              <span class="keyword-text">{{ keyword.text }}</span>
              <span class="keyword-rank">
                آخرین رتبه: 
                <strong v-if="keyword.RankHistories && keyword.RankHistories.length > 0">
                  {{ keyword.RankHistories[0].rank > 0 ? keyword.RankHistories[0].rank : 'یافت نشد' }}
                </strong>
                <span v-else>بررسی نشده</span>
              </span>
            </div>
            <div class="keyword-actions">
              <button @click="showHistoryChart(keyword)" class="action-btn history-btn">نمودار</button>
              <button @click="handleCheckRank(keyword)" :disabled="keyword.isChecking" class="action-btn check-btn">
                {{ keyword.isChecking ? '...' : 'بررسی جایگاه' }}
              </button>
              <button @click="handleDeleteKeyword(keyword.id)" class="action-btn delete-btn">حذف</button>
            </div>
          </li>
        </ul>
        <p v-else-if="!loading" class="no-keywords">هنوز کلیدواژه‌ای اضافه نشده است.</p>
      </div>

      <div v-if="selectedKeyword" class="chart-section">
        <h2>نمودار تاریخچه برای: "{{ selectedKeyword.text }}"</h2>
        <div v-if="isChartLoading" class="loading">درحال بارگذاری نمودار...</div>
        <div v-else-if="chartData.labels && chartData.labels.length > 1" class="chart-container">
          <RankHistoryChart :chartData="chartData" />
        </div>
        <p v-else-if="!isChartLoading">برای نمایش نمودار، حداقل به دو رکورد تاریخچه نیاز است.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';
import RankHistoryChart from '../components/RankHistoryChart.vue';

const route = useRoute();
const website = ref({});
const keywords = ref([]);
const newKeyword = ref('');
const loading = ref(true);
const isAdding = ref(false);
const error = ref('');
const formError = ref('');

const selectedKeyword = ref(null);
const isChartLoading = ref(false);
const chartData = ref({ labels: [], datasets: [] });

const websiteId = route.params.id;

const fetchData = async () => {
  try {
    loading.value = true;
    const [websiteRes, keywordsRes] = await Promise.all([
      api.get(`/websites/${websiteId}`),
      api.get(`/websites/${websiteId}/keywords`)
    ]);
    website.value = websiteRes.data;
    keywords.value = keywordsRes.data.map(kw => ({ ...kw, isChecking: false }));
  } catch (err) {
    error.value = 'خطا در دریافت اطلاعات.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

const addKeyword = async () => {
  if (!newKeyword.value.trim()) return;
  isAdding.value = true;
  formError.value = '';
  try {
    const response = await api.post(`/websites/${websiteId}/keywords`, { text: newKeyword.value });
    keywords.value.unshift({ ...response.data, RankHistories: [], isChecking: false });
    newKeyword.value = '';
  } catch (err) {
    formError.value = err.response?.data?.error || 'خطا در افزودن کلیدواژه.';
  } finally {
    isAdding.value = false;
  }
};

const handleDeleteKeyword = async (keywordId) => {
  if (!confirm('آیا از حذف این کلیدواژه مطمئن هستید؟')) return;
  try {
    await api.delete(`/websites/${websiteId}/keywords/${keywordId}`);
    keywords.value = keywords.value.filter(kw => kw.id !== keywordId);
  } catch  {
    alert('خطا در حذف کلیدواژه.');
  }
};

const handleCheckRank = async (keyword) => {
  keyword.isChecking = true;
  try {
    const response = await api.post(`/websites/${websiteId}/keywords/${keyword.id}/check-rank`);
    if (response.data.data) {
      const newRankHistory = response.data.data;
      const keywordToUpdate = keywords.value.find(kw => kw.id === keyword.id);
      if (keywordToUpdate) {
        keywordToUpdate.RankHistories = [newRankHistory];
      }
    }
  } catch (err) {
    alert(err.response?.data?.error || 'خطا در بررسی جایگاه.');
  } finally {
    keyword.isChecking = false;
  }
};

const showHistoryChart = async (keyword) => {
  selectedKeyword.value = keyword;
  isChartLoading.value = true;
  chartData.value = { labels: [], datasets: [] }; // Reset chart
  try {
    const response = await api.get(`/websites/${websiteId}/keywords/${keyword.id}/history`);
    const history = response.data;

    chartData.value = {
      labels: history.map(h => new Date(h.checkDate).toLocaleDateString('fa-IR')),
      datasets: [
        {
          label: 'رتبه در گوگل',
          backgroundColor: '#007bff',
          borderColor: '#007bff',
          data: history.map(h => h.rank > 0 ? h.rank : null),
          tension: 0.1
        }
      ]
    };
  } catch (err) {
    console.error('Failed to load chart data:', err);
    alert('خطا در بارگذاری تاریخچه.');
  } finally {
    isChartLoading.value = false;
  }
};
</script>

<style scoped>
.page-container { font-family: sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.back-link { text-decoration: none; color: #007bff; font-weight: bold; }
.main-content { padding: 2rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
.add-keyword-form { display: flex; }
.add-keyword-form input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px 0 0 4px; min-width: 250px; }
.add-keyword-form button { padding: 0.75rem 1.5rem; border: none; background-color: #28a745; color: white; cursor: pointer; border-radius: 0 4px 4px 0; }
.keyword-list { list-style: none; padding: 0; }
.keyword-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 0.5rem; }
.keyword-info { display: flex; flex-direction: column; }
.keyword-text { font-weight: bold; font-size: 1.1rem; }
.keyword-rank { font-size: 0.9rem; color: #6c757d; margin-top: 0.25rem; }
.keyword-actions { display: flex; gap: 0.5rem; }
.action-btn { padding: 0.4rem 0.8rem; border: 1px solid transparent; border-radius: 4px; color: white; cursor: pointer; font-weight: 500; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.history-btn { background-color: #17a2b8; }
.check-btn { background-color: #007bff; }
.delete-btn { background-color: #dc3545; }
.loading, .error, .no-keywords { padding: 1rem; text-align: center; font-size: 1.2rem; color: #6c757d; }
.error { color: #dc3545; }
.chart-section { margin-top: 3rem; padding: 2rem; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.chart-container { height: 400px; position: relative; }
</style>