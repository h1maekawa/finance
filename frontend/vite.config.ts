import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/analytics'],
          supabase: ['@supabase/supabase-js'],
          charts: ['chart.js', 'vue-chartjs'],
          vue: ['vue', 'vue-router'],
        },
      },
    },
  },
})
