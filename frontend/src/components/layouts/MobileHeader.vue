<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <header class="mobile-header">
    <h1>{{ title }}</h1>
  </header>
</template>
