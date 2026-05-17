<template>
  <nav class="bottom-nav">
    <RouterLink to="/home" class="nav-item" :class="{ active: route.path === '/home' }">
      <span class="material-symbols-rounded">home</span>
      <span class="nav-label">ホーム</span>
    </RouterLink>
    <RouterLink to="/history" class="nav-item" :class="{ active: route.path === '/history' }">
      <span class="material-symbols-rounded">receipt_long</span>
      <span class="nav-label">履歴</span>
    </RouterLink>
    <RouterLink to="/entry" class="nav-item fab-item">
      <div class="fab">
        <span class="material-symbols-rounded" style="font-size:28px">add</span>
      </div>
    </RouterLink>
    <RouterLink to="/settings" class="nav-item" :class="{ active: route.path === '/settings' }">
      <span class="material-symbols-rounded">settings</span>
      <span class="nav-label">設定</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: var(--bottom-nav-height);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 12px;
  transition: color 0.2s;
  flex: 1;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
}

.fab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-top: -16px;
}
</style>
