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

async function signupWithGoogle() {
  errorMessage.value = ''
  try {
    await signInWithGoogle()
    
    // ログイン成功後、招待トークンがあれば反映
    if (inviteToken.value) {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: inviteToken.value })
      if (!error && data) {
        // 招待受諾に成功した場合はダッシュボードへ（セットアップ不要）
        router.push('/dashboard')
      } else if (error) {
        console.error('Invitation acceptance failed:', error)
        errorMessage.value = '招待の受諾に失敗しました。リンクが無効か期限切れの可能性があります。'
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '会員登録に失敗しました'
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-layout">
      <section class="auth-panel auth-panel--info">
        <div class="auth-panel__badge">無料会員登録</div>
        <h1 class="auth-panel__title">3分で始めるスマート家計管理</h1>
        <p class="auth-panel__lead">
          Googleアカウントで登録すると、ダッシュボード作成・口座登録・Gmail連携の初期設定までスムーズに進められます。
        </p>

        <div class="auth-step-list">
          <article>
            <span>1</span>
            <div>
              <h2>アカウント作成</h2>
              <p>Googleで安全にサインアップ。複雑な入力は不要です。</p>
            </div>
          </article>
          <article>
            <span>2</span>
            <div>
              <h2>初期設定</h2>
              <p>銀行口座・カード・証券口座などを登録して見える化を開始します。</p>
            </div>
          </article>
          <article>
            <span>3</span>
            <div>
              <h2>見える化</h2>
              <p>収支、資産、目標進捗、今日使える金額までひと目で確認できます。</p>
            </div>
          </article>
        </div>
      </section>

      <section class="auth-panel auth-panel--form">
        <p class="auth-panel__eyebrow">新規登録</p>
        <h2 class="auth-panel__form-title">まずは無料で会員登録</h2>
        <p class="auth-panel__form-text">
          現在の実装では Google 認証で登録・ログインを一本化しています。登録完了後にそのままアプリをご利用いただけます。
        </p>

        <button class="auth-google-btn" :disabled="loading" @click="signupWithGoogle">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span>{{ loading ? '登録中...' : 'Googleで無料登録する' }}</span>
        </button>

        <p v-if="errorMessage" class="auth-panel__error">{{ errorMessage }}</p>

        <div class="auth-panel__info-box">
          <h3>登録後にできること</h3>
          <ul>
            <li>ダッシュボードで総資産を確認</li>
            <li>口座・カード・証券口座を初期登録</li>
            <li>Gmail連携で明細の自動取込を設定</li>
          </ul>
        </div>

        <p class="auth-panel__footer">
          すでにアカウントをお持ちですか？
          <router-link to="/login">ログインはこちら</router-link>
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(79, 70, 229, 0.16), transparent 26%),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.16), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #f5f7ff 100%);
  padding: 1rem;
}

.auth-layout {
  width: min(1080px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1rem;
}

.auth-panel {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 28px;
  padding: 2rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.auth-panel--info {
  background: linear-gradient(135deg, #4338ca 0%, #0f766e 100%);
  color: #fff;
}

.auth-panel__badge {
  display: inline-flex;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.8rem;
  font-weight: 700;
}

.auth-panel__title {
  margin-top: 1rem;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.15;
}

.auth-panel__lead,
.auth-panel__form-text,
.auth-panel__footer,
.auth-step-list p,
.auth-panel__info-box li {
  line-height: 1.8;
}

.auth-panel__lead {
  margin-top: 0.9rem;
  color: rgba(255, 255, 255, 0.88);
}

.auth-step-list {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.auth-step-list article {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 0.85rem;
  align-items: start;
  padding: 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
}

.auth-step-list span {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  font-weight: 800;
  font-size: 1rem;
}

.auth-step-list h2,
.auth-panel__form-title {
  font-size: 1.3rem;
}

.auth-panel__eyebrow {
  color: #4f46e5;
  font-size: 0.82rem;
  font-weight: 800;
}

.auth-panel__form-title {
  margin-top: 0.55rem;
}

.auth-google-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem 1.2rem;
  border-radius: 16px;
  background: #111827;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
}

.auth-google-btn:disabled {
  opacity: 0.6;
}

.auth-panel__error {
  margin-top: 0.85rem;
  color: #dc2626;
}

.auth-panel__info-box {
  margin-top: 1.2rem;
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.auth-panel__info-box h3 {
  font-size: 0.98rem;
  margin-bottom: 0.5rem;
}

.auth-panel__info-box ul {
  padding-left: 1rem;
}

.auth-panel__footer {
  margin-top: 1.2rem;
  color: #64748b;
}

.auth-panel__footer a {
  color: #4338ca;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 900px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 0.75rem;
  }

  .auth-panel {
    padding: 1.35rem;
    border-radius: 22px;
  }
}
</style>
