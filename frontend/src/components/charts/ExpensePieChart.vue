<script setup lang="ts">
import { Pie } from 'vue-chartjs'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

defineProps<{
  chartData: {
    labels: string[]
    datasets: { data: number[]; backgroundColor: string[] }[]
  }
}>()
</script>

<template>
  <div class="card" style="min-height: 320px;">
    <h3>支出カテゴリ比率</h3>
    <Pie :data="chartData" />
  </div>
</template>
