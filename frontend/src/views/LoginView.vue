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
    errorMessage.value = error instanceof Error ? error.message : 'Google認証に失敗しました'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__icon">💰</div>
      <h1 class="login-card__title">家計簿</h1>
      <p class="login-card__subtitle">
        Gmailと連携してクレジット支出を<br>自動記録するスマート家計簿
      </p>

      <div class="login-card__features">
        <div class="login-card__feature">
          <span>📧</span>
          <span>Gmailで自動取込</span>
        </div>
        <div class="login-card__feature">
          <span>🔒</span>
          <span>メールは読み取り専用・安全</span>
        </div>
        <div class="login-card__feature">
          <span>📊</span>
          <span>投資・口座も一括管理</span>
        </div>
      </div>

      <button class="login-card__google-btn" :disabled="loading" @click="loginWithGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        <span>{{ loading ? 'ログイン中...' : 'Googleでログイン' }}</span>
      </button>

      <p v-if="errorMessage" class="login-card__error">{{ errorMessage }}</p>

      <p class="login-card__note">
        ログインすることで、プライバシーポリシーおよび<br>利用規約に同意したものとみなされます。
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0f9ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.login-card {
  background: #fff;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 40px rgba(99, 102, 241, 0.12);
  text-align: center;
}

.login-card__icon { font-size: 3rem; margin-bottom: 0.75rem; }
.login-card__title {
  font-size: 1.75rem;
  font-weight: 900;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}
.login-card__subtitle {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.login-card__features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
  text-align: left;
}

.login-card__feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.87rem;
  color: #374151;
  background: #f9fafb;
  padding: 0.6rem 0.875rem;
  border-radius: 10px;
}

.login-card__google-btn {
  width: 100%;
  padding: 0.875rem;
  background: #4285F4;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  transition: background 0.2s, transform 0.1s;
}
.login-card__google-btn:hover { background: #3367d6; transform: translateY(-1px); }
.login-card__google-btn:disabled { opacity: 0.6; transform: none; }

.login-card__error {
  color: #dc2626;
  font-size: 0.87rem;
  margin-bottom: 0.75rem;
}

.login-card__note {
  font-size: 0.72rem;
  color: #9ca3af;
  line-height: 1.6;
  margin-top: 1rem;
}
</style>
