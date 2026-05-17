<template>
  <div class="lp-root">
    <!-- Hero -->
    <header class="lp-header">
      <nav class="lp-nav">
        <div class="lp-logo">
          <span class="material-symbols-rounded" style="font-size:28px;color:#6366f1">account_balance_wallet</span>
          <span class="lp-logo-text">KakeiboAI</span>
        </div>
        <router-link to="/login" class="lp-btn-outline">ログイン</router-link>
      </nav>

      <div class="lp-hero">
        <div class="lp-badge">🤖 Gmail × AI × Firestore 連携</div>
        <h1 class="lp-title">カードの明細を<br><span class="lp-grad">自動で家計簿へ</span></h1>
        <p class="lp-sub">三井住友・楽天カード・PayPay の決済通知メールを検知し、<br class="br-desktop">Googleが動かすAIが自動分類・リアルタイム記録します。</p>
        <div class="lp-cta-group">
          <router-link to="/login" class="lp-btn-primary" id="lp-start-btn">無料で始める</router-link>
          <a href="#features" class="lp-btn-ghost">機能を見る ↓</a>
        </div>
        <div class="lp-hero-img">
          <div class="phone-mock">
            <div class="phone-screen">
              <div class="mock-header">
                <span style="font-size:11px;color:#94a3b8">5月の収支</span>
                <span style="font-size:22px;font-weight:700;color:#fff">¥ 128,400</span>
              </div>
              <div class="mock-bar">
                <div class="mock-bar-fill" style="width:68%;background:#6366f1"></div>
              </div>
              <div class="mock-items">
                <div class="mock-item" v-for="item in mockItems" :key="item.name">
                  <span class="mock-icon material-symbols-rounded">{{ item.icon }}</span>
                  <div style="flex:1">
                    <div style="font-size:12px;color:#e2e8f0">{{ item.name }}</div>
                    <div style="font-size:10px;color:#64748b">{{ item.date }}</div>
                  </div>
                  <span :style="{ color: item.kind==='expense'?'#f87171':'#34d399', fontSize:'13px', fontWeight:'700' }">
                    {{ item.kind==='expense'?'-':'+'}}¥{{ item.amount.toLocaleString() }}
                  </span>
                  <span v-if="item.auto" class="mock-auto">自動</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Flow -->
    <section class="lp-section" id="features">
      <div class="lp-section-label">仕組み</div>
      <h2 class="lp-section-title">全自動の連携フロー</h2>
      <div class="lp-flow">
        <div class="flow-step" v-for="(step, i) in flowSteps" :key="i">
          <div class="flow-icon">
            <span class="material-symbols-rounded">{{ step.icon }}</span>
          </div>
          <div class="flow-arrow" v-if="i < flowSteps.length-1">→</div>
          <div class="flow-label">{{ step.label }}</div>
          <div class="flow-desc">{{ step.desc }}</div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="lp-section lp-dark-section">
      <div class="lp-section-label">機能</div>
      <h2 class="lp-section-title" style="color:#f1f5f9">主要機能</h2>
      <div class="lp-features">
        <div class="feature-card" v-for="f in features" :key="f.title">
          <span class="material-symbols-rounded feature-icon">{{ f.icon }}</span>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- How to use -->
    <section class="lp-section">
      <div class="lp-section-label">使い方</div>
      <h2 class="lp-section-title">3ステップで設定完了</h2>
      <div class="lp-steps">
        <div class="step-row" v-for="(s, i) in steps" :key="i">
          <div class="step-num">{{ i+1 }}</div>
          <div class="step-content">
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Cards supported -->
    <section class="lp-section lp-dark-section">
      <div class="lp-section-label">対応カード</div>
      <h2 class="lp-section-title" style="color:#f1f5f9">対応している決済手段</h2>
      <div class="lp-cards">
        <div class="card-badge" v-for="c in cards" :key="c">{{ c }}</div>
      </div>
    </section>

    <!-- CTA Bottom -->
    <section class="lp-cta-section">
      <h2 class="lp-cta-title">今すぐ始めよう</h2>
      <p class="lp-cta-sub">Googleアカウントがあれば、5分で自動家計簿が動き出します。</p>
      <router-link to="/login" class="lp-btn-primary lp-btn-large" id="lp-bottom-cta">無料で始める →</router-link>
    </section>

    <!-- Footer -->
    <footer class="lp-footer">
      <span>© 2026 KakeiboAI — Built with Vue 3 + Firebase + GAS</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { watch } from 'vue'

const router = useRouter()
const { user, loading } = useAuth()

watch([user, loading], ([u, l]) => {
  if (!l && u) router.push('/home')
})

const mockItems = [
  { name: 'Uber Eats', date: '5/16 自動取込', amount: 1800, kind: 'expense', icon: 'restaurant', auto: true },
  { name: 'ファミリーマート', date: '5/15 自動取込', amount: 450, kind: 'expense', icon: 'shopping_bag', auto: true },
  { name: 'JR東日本', date: '5/15 自動取込', amount: 210, kind: 'expense', icon: 'train', auto: true },
  { name: '給与振込', date: '5/15 手入力', amount: 320000, kind: 'income', icon: 'payments', auto: false },
]

const flowSteps = [
  { icon: 'credit_card', label: 'カード決済', desc: 'お買い物・お食事' },
  { icon: 'mail', label: '通知メール', desc: 'Gmailに届く' },
  { icon: 'smart_toy', label: 'GAS解析', desc: '5分毎に自動検知' },
  { icon: 'database', label: 'Firestore保存', desc: 'クラウドに記録' },
  { icon: 'phone_iphone', label: 'アプリ反映', desc: 'リアルタイム表示' },
]

const features = [
  { icon: 'auto_awesome', title: 'Gmail自動連携', desc: '三井住友・楽天・PayPayの通知メールをGASが5分毎に検知し、手入力不要で記録。' },
  { icon: 'category', title: 'AI自動カテゴリ分類', desc: '「Uber Eats→外食」「JR→交通」のように店舗名から自動でカテゴリを判定。' },
  { icon: 'bolt', title: 'リアルタイム同期', desc: 'FirestoreのonSnapshot機能でデータ書込みの瞬間に画面が自動更新されます。' },
  { icon: 'bar_chart', title: '月別ダッシュボード', desc: '月の収入・支出・残高と円グラフで直感的に家計を把握できます。' },
  { icon: 'edit_note', title: '手入力も可能', desc: '自動連携の対象外の支出も、カスタムテンキーで素早く手入力可能。' },
  { icon: 'lock', title: 'セキュアな設計', desc: 'Firebaseの認証でユーザーデータを完全分離。他人のデータは一切参照不可。' },
]

const steps = [
  { title: 'Googleアカウントでログイン', desc: 'アカウント作成は不要。Googleアカウントがあればすぐに始められます。' },
  { title: 'GASにコードを設定する', desc: 'Google Apps Scriptにプログラムを貼り付け、Firebaseのサービスアカウントキーを設定するだけ。' },
  { title: 'Gmailにフィルタを設定する', desc: 'カード会社からの通知メールに「card-notification」ラベルを自動付与する設定を行えば完了。' },
]

const cards = ['三井住友カード (SMBC)', '楽天カード', 'PayPay', '手動入力（全カード対応）']
</script>

<style scoped>
.lp-root {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
  max-width: 100%;
  overflow-x: hidden;
}

/* Nav */
.lp-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  max-width: 1000px;
  margin: 0 auto;
}
.lp-logo { display: flex; align-items: center; gap: 8px; }
.lp-logo-text { font-size: 20px; font-weight: 700; color: #f1f5f9; }

/* Hero */
.lp-header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); }
.lp-hero {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px 60px;
  text-align: center;
}
.lp-badge {
  display: inline-block;
  background: rgba(99,102,241,0.2);
  border: 1px solid rgba(99,102,241,0.4);
  color: #a5b4fc;
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 13px;
  margin-bottom: 24px;
}
.lp-title {
  font-size: clamp(32px, 6vw, 56px);
  font-weight: 800;
  line-height: 1.2;
  color: #f1f5f9;
  margin-bottom: 20px;
}
.lp-grad {
  background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.lp-sub { font-size: 16px; color: #94a3b8; line-height: 1.8; margin-bottom: 36px; }
.br-desktop { display: none; }
@media(min-width: 640px) { .br-desktop { display: inline; } }

.lp-cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 48px; }

/* Buttons */
.lp-btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 14px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;
  display: inline-block;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 20px rgba(99,102,241,0.4);
}
.lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.5); }
.lp-btn-large { padding: 18px 48px; font-size: 18px; }
.lp-btn-ghost {
  color: #94a3b8;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  text-decoration: none;
  transition: color 0.2s;
}
.lp-btn-ghost:hover { color: #e2e8f0; }
.lp-btn-outline {
  border: 1px solid rgba(99,102,241,0.5);
  color: #a5b4fc;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 14px;
  text-decoration: none;
  transition: background 0.2s;
}
.lp-btn-outline:hover { background: rgba(99,102,241,0.15); }

/* Phone mock */
.lp-hero-img { display: flex; justify-content: center; }
.phone-mock {
  width: 240px;
  background: #1e293b;
  border-radius: 24px;
  padding: 16px;
  border: 1px solid #334155;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.phone-screen { display: flex; flex-direction: column; gap: 12px; }
.mock-header { display: flex; flex-direction: column; gap: 4px; }
.mock-bar { background: #334155; border-radius: 4px; height: 6px; }
.mock-bar-fill { height: 100%; border-radius: 4px; }
.mock-items { display: flex; flex-direction: column; gap: 10px; }
.mock-item { display: flex; align-items: center; gap: 8px; }
.mock-icon { font-size: 18px; color: #6366f1; }
.mock-auto {
  background: rgba(99,102,241,0.2);
  color: #a5b4fc;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Sections */
.lp-section { padding: 80px 24px; max-width: 1000px; margin: 0 auto; }
.lp-dark-section {
  max-width: 100%;
  background: #1e293b;
  padding: 80px 24px;
}
.lp-dark-section > * { max-width: 1000px; margin-left: auto; margin-right: auto; }
.lp-section-label {
  font-size: 12px;
  font-weight: 700;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 12px;
}
.lp-section-title { font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 40px; }
.lp-dark-section .lp-section-label,
.lp-dark-section .lp-section-title { max-width: 1000px; margin-left: auto; margin-right: auto; }

/* Flow */
.lp-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}
.flow-step { text-align: center; flex: 0 0 120px; }
.flow-icon {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 8px;
  color: white;
  font-size: 24px;
}
.flow-arrow { font-size: 24px; color: #334155; margin-top: 16px; align-self: flex-start; flex: 0; }
.flow-label { font-weight: 700; font-size: 14px; color: #1e293b; }
.flow-desc { font-size: 12px; color: #64748b; margin-top: 4px; }

/* Features */
.lp-features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.feature-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 24px;
  transition: border-color 0.2s, transform 0.2s;
}
.feature-card:hover { border-color: #6366f1; transform: translateY(-4px); }
.feature-icon { font-size: 32px; color: #6366f1; margin-bottom: 12px; display: block; }
.feature-card h3 { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
.feature-card p { font-size: 14px; color: #94a3b8; line-height: 1.7; }

/* Steps */
.lp-steps { display: flex; flex-direction: column; gap: 24px; }
.step-row { display: flex; gap: 20px; align-items: flex-start; }
.step-num {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 800; font-size: 18px;
  flex-shrink: 0;
}
.step-content h3 { font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.step-content p { font-size: 14px; color: #64748b; line-height: 1.7; }

/* Cards */
.lp-cards { display: flex; flex-wrap: wrap; gap: 12px; max-width: 1000px; margin: 0 auto; }
.card-badge {
  background: #0f172a;
  border: 1px solid #334155;
  color: #a5b4fc;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
}

/* CTA section */
.lp-cta-section {
  text-align: center;
  padding: 100px 24px;
  background: linear-gradient(135deg, #1e1b4b, #0f172a);
}
.lp-cta-title { font-size: 36px; font-weight: 800; color: #f1f5f9; margin-bottom: 12px; }
.lp-cta-sub { color: #94a3b8; font-size: 16px; margin-bottom: 32px; }

/* Footer */
.lp-footer {
  text-align: center;
  padding: 24px;
  color: #475569;
  font-size: 13px;
  border-top: 1px solid #1e293b;
}
</style>
