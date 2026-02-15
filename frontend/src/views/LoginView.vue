<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const email = ref('')
const password = ref('')
const name = ref('')
const mode = ref<'login' | 'signup'>('login')
const errorMessage = ref('')
const router = useRouter()

const { signIn, signUp, loading } = useAuth()

async function submit() {
  errorMessage.value = ''
  try {
    if (mode.value === 'login') {
      await signIn(email.value, password.value)
    } else {
      await signUp(email.value, password.value, name.value)
      await signIn(email.value, password.value)
    }
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '認証に失敗しました'
  }
}
</script>

<template>
  <main class="card" style="max-width: 420px; margin: 5rem auto;">
    <h1>{{ mode === 'login' ? 'ログイン' : '新規登録' }}</h1>
    <div class="row" style="flex-direction: column;">
      <input v-if="mode === 'signup'" v-model="name" placeholder="表示名" />
      <input v-model="email" placeholder="Email" type="email" />
      <input v-model="password" placeholder="Password" type="password" />
      <button :disabled="loading" @click="submit">{{ mode === 'login' ? 'ログイン' : '登録' }}</button>
      <a href="#" @click.prevent="mode = mode === 'login' ? 'signup' : 'login'">
        {{ mode === 'login' ? '新規登録へ' : 'ログインへ' }}
      </a>
      <p v-if="errorMessage" style="color: #dc2626">{{ errorMessage }}</p>
    </div>
  </main>
</template>
