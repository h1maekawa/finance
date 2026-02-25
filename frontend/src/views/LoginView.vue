<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const errorMessage = ref('')
const router = useRouter()
const { signInWithGoogle, loading } = useAuth()

async function loginWithGoogle() {
  errorMessage.value = ''
  try {
    await signInWithGoogle()
    await router.push('/')
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Google認証に失敗しました'
  }
}
</script>

<template>
  <main class="card" style="max-width: 420px; margin: 5rem auto;">
    <h1>ログイン</h1>
    <div class="row" style="flex-direction: column;">
      <button :disabled="loading" @click="loginWithGoogle">
        Googleでログイン
      </button>
      <p v-if="errorMessage" style="color: #dc2626">{{ errorMessage }}</p>
    </div>
  </main>
</template>
