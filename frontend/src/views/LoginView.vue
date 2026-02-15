<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const email = ref('')
const password = ref('')
const displayName = ref('')
const mode = ref<'login' | 'signup'>('login')
const errorMessage = ref('')

const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth()

async function submitEmail() {
  errorMessage.value = ''
  try {
    if (mode.value === 'login') {
      await signInWithEmail(email.value, password.value)
    } else {
      await signUpWithEmail(email.value, password.value, displayName.value)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '認証に失敗しました'
  }
}

async function loginWithGoogle() {
  errorMessage.value = ''
  try {
    await signInWithGoogle()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Google認証に失敗しました'
  }
}
</script>

<template>
  <main class="card" style="max-width: 420px; margin: 5rem auto;">
    <h1>ログイン</h1>
    <div class="row" style="flex-direction: column;">
      <input v-if="mode === 'signup'" v-model="displayName" placeholder="表示名（任意）" />
      <input v-model="email" placeholder="Email" type="email" />
      <input v-model="password" placeholder="Password" type="password" />

      <button :disabled="loading" @click="submitEmail">
        {{ mode === 'login' ? 'メールでログイン' : 'メールで新規登録' }}
      </button>

      <button :disabled="loading" @click="loginWithGoogle">Googleでログイン</button>

      <a href="#" @click.prevent="mode = mode === 'login' ? 'signup' : 'login'">
        {{ mode === 'login' ? '新規登録へ切り替え' : 'ログインへ切り替え' }}
      </a>

      <p v-if="errorMessage" style="color: #dc2626">{{ errorMessage }}</p>
    </div>
  </main>
</template>
