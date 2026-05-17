<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <span class="material-symbols-rounded">account_balance_wallet</span>
      </div>
      <h1 class="app-title">かけいぼ</h1>
      <p class="app-subtitle">シンプルな家計管理アプリ</p>
    </div>

    <div class="login-card">
      <!-- Tab -->
      <div class="tab-group">
        <button
          class="tab-btn"
          :class="{ active: mode === 'login' }"
          @click="mode = 'login'"
        >ログイン</button>
        <button
          class="tab-btn"
          :class="{ active: mode === 'register' }"
          @click="mode = 'register'"
        >新規登録</button>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label class="form-label">メールアドレス</label>
          <input
            v-model="email"
            type="email"
            required
            class="input-field"
            placeholder="example@email.com"
          />
        </div>
        <div class="form-group">
          <label class="form-label">パスワード</label>
          <input
            v-model="password"
            type="password"
            required
            class="input-field"
            placeholder="6文字以上"
            minlength="6"
          />
        </div>

        <div v-if="error" class="error-msg">
          <span class="material-symbols-rounded">error</span>
          {{ friendlyError(error) }}
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading">処理中...</span>
          <span v-else>{{ mode === 'login' ? 'ログイン' : '新規登録' }}</span>
        </button>
      </form>

      <div class="divider"><span>または</span></div>

      <button class="google-btn" @click="handleGoogle" :disabled="loading">
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Googleでログイン
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { loginWithEmail, registerWithEmail, loginWithGoogle, loading, error, clearError } = useAuth()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  clearError()
  try {
    if (mode.value === 'login') {
      await loginWithEmail(email.value, password.value)
    } else {
      await registerWithEmail(email.value, password.value)
    }
    router.push('/home')
  } catch {}
}

const handleGoogle = async () => {
  clearError()
  try {
    await loginWithGoogle()
    router.push('/home')
  } catch {}
}

const friendlyError = (msg: string) => {
  if (msg.includes('invalid-credential') || msg.includes('wrong-password')) return 'メールアドレスまたはパスワードが間違っています'
  if (msg.includes('email-already-in-use')) return 'このメールアドレスはすでに登録されています'
  if (msg.includes('weak-password')) return 'パスワードは6文字以上にしてください'
  if (msg.includes('popup-closed')) return 'ログインがキャンセルされました'
  return 'エラーが発生しました。もう一度お試しください'
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #1a56db 0%, #0e3fa8 100%);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  color: white;
}

.logo {
  width: 72px;
  height: 72px;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  backdrop-filter: blur(8px);
}

.logo .material-symbols-rounded {
  font-size: 38px;
  color: white;
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.app-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 28px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.tab-group {
  display: flex;
  background: var(--color-bg);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--color-text-muted);
  transition: all 0.2s;
}
.tab-btn.active {
  background: white;
  color: var(--color-primary);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff1f1;
  color: var(--color-expense);
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.error-msg .material-symbols-rounded { font-size: 18px; }

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: var(--color-text-muted);
  font-size: 13px;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  background: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--color-text);
}
.google-btn:hover { background: var(--color-bg); }
.google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.google-icon {
  width: 20px;
  height: 20px;
}
</style>
