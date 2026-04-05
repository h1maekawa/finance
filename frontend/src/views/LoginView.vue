<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { signInWithGoogle, loading } = useAuth()
const router = useRouter()
const errorMessage = ref('')

async function loginWithGoogle() {
  errorMessage.value = ''
  try {
    await signInWithGoogle()
    await router.push('/dashboard')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'ログインに失敗しました'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4"
    style="background: radial-gradient(circle at top left, rgba(79,70,229,0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(20,184,166,0.14), transparent 28%), linear-gradient(180deg,#f8f9fa 0%,#f5f7ff 100%)">

    <div class="w-full max-w-sm space-y-6">
      <!-- Logo -->
      <div class="text-center">
        <div class="w-16 h-16 bg-primary rounded-[22px] flex items-center justify-center mx-auto shadow-lg">
          <span class="material-symbols-outlined text-3xl text-on-primary" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
        </div>
        <h1 class="text-3xl font-extrabold mt-4 font-headline text-on-background">Finance App</h1>
        <p class="text-on-surface-variant mt-1 text-sm">家計・資産を一元管理</p>
      </div>

      <!-- Card -->
      <div class="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-outline-variant/10 space-y-5">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-on-surface font-headline">ログイン</h2>
          <p class="text-sm text-on-surface-variant">Googleアカウントで安全に続行できます</p>
        </div>

        <button
          id="google-login-btn"
          @click="loginWithGoogle"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#4285f4] text-white rounded-2xl font-bold text-sm active:scale-95 transition-transform duration-200 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="white" fill-opacity=".9"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="white" fill-opacity=".9"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="white" fill-opacity=".9"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="white" fill-opacity=".9"/>
          </svg>
          <span>{{ loading ? 'ログイン中...' : 'Googleでログイン' }}</span>
        </button>

        <p v-if="errorMessage" class="text-error text-sm text-center">{{ errorMessage }}</p>

        <div class="text-center">
          <router-link to="/signup" class="text-primary font-bold text-sm">アカウントをお持ちでない方はこちら</router-link>
        </div>
      </div>

      <p class="text-center text-xs text-on-surface-variant">
        ログインすることで<a href="#" class="text-primary underline">利用規約</a>に同意したものとみなします
      </p>
    </div>
  </div>
</template>
