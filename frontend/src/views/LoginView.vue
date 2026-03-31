<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase'

const errorMessage = ref('')
const router = useRouter()
const route = useRoute()
const { signInWithGoogle, loading } = useAuth()

const inviteToken = ref<string | null>(null)

onMounted(() => {
  inviteToken.value = route.query.invite as string || null
})

async function loginWithGoogle() {
  errorMessage.value = ''
  try {
    await signInWithGoogle()

    if (inviteToken.value) {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: inviteToken.value })
      if (!error && data) {
        router.push('/dashboard')
      } else if (error) {
        console.error('Invitation acceptance failed:', error)
        errorMessage.value = '招待の受諾に失敗しました。リンクが無効か期限切れの可能性があります。'
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Google認証に失敗しました'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-layout">
      <section class="login-panel login-panel--highlight">
        <p class="login-panel__eyebrow">おかえりなさい</p>
        <h1 class="login-panel__title">家計・資産・目標を、今日もまとめて確認</h1>
        <p class="login-panel__lead">
          このアプリでは、収支、口座、投資、Gmail明細取込までを一つの体験に集約しています。ログイン後はすぐにダッシュボードへ戻れます。
        </p>
        <div class="login-panel__features">
          <div>
            <strong>📊 ダッシュボード</strong>
            <span>総資産と今月の収支をひと目で確認</span>
          </div>
          <div>
            <strong>📧 Gmail連携</strong>
            <span>カード利用明細の自動取込をサポート</span>
          </div>
          <div>
            <strong>🎯 目標管理</strong>
            <span>資産形成の進捗を日々チェック</span>
          </div>
        </div>
      </section>

      <section class="login-panel login-panel--form">
        <div class="login-card__icon">💰</div>
        <h2 class="login-card__title">ログイン</h2>
        <p class="login-card__subtitle">Googleアカウントで安全にログインできます。</p>

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

        <div class="login-card__note-box">
          <p>新規の方は無料会員登録から開始できます。</p>
          <router-link to="/signup">会員登録へ進む</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(79, 70, 229, 0.14), transparent 28%),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.14), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #f5f7ff 100%);
  padding: 1rem;
}

.login-layout {
  width: min(1080px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 1rem;
}

.login-panel {
  border-radius: 28px;
  padding: 2rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
}

.login-panel--highlight {
  background: linear-gradient(135deg, #111827 0%, #4338ca 58%, #0f766e 100%);
  color: #fff;
}

.login-panel__eyebrow {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.login-panel__title {
  margin-top: 0.8rem;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.15;
}

.login-panel__lead {
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.9;
}

.login-panel__features {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.login-panel__features div {
  padding: 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
}

.login-panel__features strong {
  display: block;
  margin-bottom: 0.3rem;
}

.login-panel__features span {
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.75;
}

.login-panel--form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.login-card__icon {
  font-size: 3rem;
}

.login-card__title {
  margin-top: 0.75rem;
  font-size: 1.8rem;
  font-weight: 900;
}

.login-card__subtitle {
  margin-top: 0.5rem;
  color: #64748b;
  line-height: 1.7;
}

.login-card__google-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 16px;
  background: #4285f4;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
}

.login-card__google-btn:disabled {
  opacity: 0.6;
}

.login-card__error {
  margin-top: 0.9rem;
  color: #dc2626;
}

.login-card__note-box {
  margin-top: 1.2rem;
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  line-height: 1.7;
}

.login-card__note-box a {
  display: inline-block;
  margin-top: 0.3rem;
  color: #4338ca;
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 900px) {
  .login-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 0.75rem;
  }

  .login-panel {
    padding: 1.35rem;
    border-radius: 22px;
  }
}
</style>
