<template>
  <Line :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

defineProps({
  chartData: {
    type: Object,
    required: true
  }
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      reverse: true, // رتبه ۱ باید در بالا باشد
      min: 1,
      ticks: {
        stepSize: 1,
        // برای اینکه اعداد اعشاری نمایش داده نشود
        callback: function(value) { if (Number.isInteger(value)) { return value; } },
      },
      title: {
        display: true,
        text: 'رتبه در گوگل'
      }
    },
    x: {
       title: {
        display: true,
        text: 'تاریخ'
      }
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
};
</script>