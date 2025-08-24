<template>
  <div class="page-container">
    <header class="header">
      <h1>مدیریت وب‌سایت: {{ website.name }}</h1>
      <router-link to="/dashboard" class="back-link">بازگشت به داشبورد</router-link>
    </header>
    <main class="main-content">
      
      <div class="input-section">
        <div class="input-card">
          <h3>افزودن تکی</h3>
          <form @submit.prevent="addKeyword" class="add-keyword-form">
            <input type="text" v-model="newKeyword" placeholder="کلیدواژه جدید..." required>
            <button type="submit" :disabled="isAdding">{{ isAdding ? '...' : 'افزودن' }}</button>
          </form>
          <p v-if="formError" class="error">{{ formError }}</p>
        </div>
        <div class="input-card">
          <h3>ورود از فایل اکسل</h3>
          <p class="form-hint">فایل اکسل باید شامل یک ستون از کلیدواژه‌ها باشد.</p>
          <form @submit.prevent="handleFileUpload" class="upload-form">
            <input type="file" @change="handleFileChange" accept=".xlsx, .xls" ref="fileInput">
            <button type="submit" :disabled="!selectedFile || isUploading">
              {{ isUploading ? 'درحال آپلود...' : 'آپلود' }}
            </button>
          </form>
           <p v-if="uploadMessage" :class="{ 'success': !uploadError, 'error': uploadError }">{{ uploadMessage }}</p>
        </div>
      </div>

      <div class="keywords-section">
        <div class="section-header">
          <h2>لیست کلیدواژه‌ها ({{ keywords.length }})</h2>
          <button @click="handleExportToExcel" class="action-btn export-btn">
            خروجی اکسل
          </button>
        </div>
        
        <div v-if="loading" class="loading">در حال بارگذاری...</div>
        <div v-if="error" class="error">{{ error }}</div>
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
                {{ keyword.isChecking ? '...' : 'بررسی' }}
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
import * as XLSX from 'xlsx';

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
const selectedFile = ref(null);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadError = ref(false);
const fileInput = ref(null);

const fetchData = async () => {
  try {
    loading.value = true;
    error.value = '';
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
  chartData.value = { labels: [], datasets: [] };
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

const handleExportToExcel = () => {
  if (keywords.value.length === 0) {
    alert('هیچ کلیدواژه‌ای برای خروجی گرفتن وجود ندارد.');
    return;
  }
  const dataToExport = keywords.value.map(kw => {
    const latestRankHistory = kw.RankHistories && kw.RankHistories.length > 0 ? kw.RankHistories[0] : null;
    const latestRank = latestRankHistory ? (latestRankHistory.rank > 0 ? latestRankHistory.rank : 'یافت نشد') : 'N/A';
    const latestUrl = latestRankHistory ? latestRankHistory.url : 'N/A';
    const lastCheck = kw.lastCheckedAt ? new Date(kw.lastCheckedAt).toLocaleDateString('fa-IR') : 'N/A';
    return {
      'کلیدواژه': kw.text,
      'آخرین رتبه': latestRank,
      'آدرس صفحه': latestUrl,
      'آخرین بررسی': lastCheck,
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Keyword Ranks');
  XLSX.writeFile(workbook, `${website.value.name || 'keywords'}-ranks.xlsx`);
};

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
  uploadMessage.value = '';
  uploadError.value = false;
};

const handleFileUpload = async () => {
  if (!selectedFile.value) return;
  isUploading.value = true;
  uploadMessage.value = '';
  uploadError.value = false;
  const formData = new FormData();
  formData.append('keywordsFile', selectedFile.value);
  try {
    const response = await api.post(`/websites/${websiteId}/keywords/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    uploadMessage.value = response.data.message;
    await fetchData();
  } catch (err) {
    uploadMessage.value = err.response?.data?.error || 'خطا در آپلود فایل.';
    uploadError.value = true;
  } finally {
    isUploading.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    selectedFile.value = null;
  }
};
</script>

<style scoped>
.page-container { font-family: sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.back-link { text-decoration: none; color: #007bff; font-weight: bold; }
.main-content { padding: 2rem; }
.input-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; margin-bottom: 2rem; }
.input-card { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.input-card h3 { margin-top: 0; }
.form-hint { font-size: 0.8rem; color: #6c757d; margin-bottom: 1rem; }
.add-keyword-form { display: flex; }
.add-keyword-form input { flex-grow: 1; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px 0 0 4px; }
.add-keyword-form button { padding: 0.75rem 1rem; border: none; background-color: #28a745; color: white; cursor: pointer; border-radius: 0 4px 4px 0; white-space: nowrap; }
.upload-form { display: flex; flex-wrap: wrap; gap: 1rem; }
.upload-form input[type="file"] { flex-grow: 1; border: 1px solid #ccc; border-radius: 4px; padding: 0.5rem; }
.upload-form button { padding: 0.75rem 1.5rem; border: none; background-color: #0d6efd; color: white; cursor: pointer; border-radius: 4px; }
.success { color: #198754; font-weight: bold; margin-top: 1rem; }
.keywords-section { margin-top: 2rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
.main-actions { display: flex; gap: 1rem; align-items: center; }
.keyword-list { list-style: none; padding: 0; }
.keyword-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 0.5rem; }
.keyword-info { display: flex; flex-direction: column; }
.keyword-text { font-weight: bold; font-size: 1.1rem; }
.keyword-rank { font-size: 0.9rem; color: #6c757d; margin-top: 0.25rem; }
.keyword-actions { display: flex; gap: 0.5rem; }
.action-btn { padding: 0.4rem 0.8rem; border: 1px solid transparent; border-radius: 4px; color: white; cursor: pointer; font-weight: 500; white-space: nowrap; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.export-btn { background-color: #198754; }
.history-btn { background-color: #17a2b8; }
.check-btn { background-color: #007bff; }
.delete-btn { background-color: #dc3545; }
.loading, .error, .no-keywords { padding: 1rem; text-align: center; font-size: 1.2rem; color: #6c757d; }
.error { color: #dc3545; }
.chart-section { margin-top: 3rem; padding: 2rem; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.chart-container { height: 400px; position: relative; }
</style>