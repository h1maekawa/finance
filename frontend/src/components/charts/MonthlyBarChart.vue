<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

defineProps<{
  chartData: {
    labels: string[]
    datasets: { label: string; data: number[]; backgroundColor: string }[]
  }
}>()
</script>

<template>
  <div class="card" style="min-height: 320px;">
    <h3>月次推移</h3>
    <Bar :data="chartData" />
  </div>
</template>
