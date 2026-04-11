<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/dashboard', label: 'Home', icon: 'home' },
  { path: '/history', label: 'Logs', icon: 'list_alt' },
  { path: '/reports', label: 'Charts', icon: 'pie_chart' },
  { path: '/budgets', label: 'Plan', icon: 'auto_graph' },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="fixed bottom-8 inset-x-0 flex justify-center z-50 px-6">
    <nav class="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="relative flex items-center justify-center w-14 h-14 transition-all duration-300 group"
      >
        <div v-if="isActive(item.path)" class="absolute inset-0 bg-primary rounded-[1.25rem] shadow-lg shadow-primary/20 animate-in zoom-in duration-300"></div>
        
        <span 
          class="material-symbols-outlined relative z-10 transition-all duration-300" 
          :class="[
            isActive(item.path) ? 'text-on-primary scale-110' : 'text-on-surface-variant group-hover:text-primary'
          ]"
          :style="isActive(item.path) ? `font-variation-settings: 'FILL' 1;` : ''"
        >
          {{ item.icon }}
        </span>

        <!-- Tooltip Label on Hover (Hidden by default for clean look) -->
        <span class="absolute -top-10 px-2 py-1 bg-on-surface text-surface text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
            {{ item.label }}
        </span>
      </router-link>

      <div class="w-px h-8 bg-outline-variant/10 mx-1"></div>

      <router-link 
        to="/entry"
        class="w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-[1.25rem] flex items-center justify-center shadow-md active:scale-90 transition-all duration-300 group"
      >
        <span class="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
@keyframes zoom-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-in {
  animation: zoom-in 0.3s ease-out forwards;
}
</style>
