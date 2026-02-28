<script setup lang="ts">
defineProps<{ title: string; accountLabel?: string }>()
</script>

<template>
  <header class="mobile-header">
    <h1>{{ title }}</h1>
    <p v-if="accountLabel" class="mobile-header__account">ログイン中: {{ accountLabel }}</p>
  </header>
</template>

<style scoped>
.mobile-header__account {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  text-align: center;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
