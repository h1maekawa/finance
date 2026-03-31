<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { sessionStore } from '@/stores/session'

const router = useRouter()
const isLoggedIn = computed(() => !!sessionStore.user)

function goToSignup() {
  void router.push(isLoggedIn.value ? '/dashboard' : '/signup')
}

function goToLogin() {
  void router.push(isLoggedIn.value ? '/dashboard' : '/login')
}
</script>

<template>
  <div class="landing-page">
    <section class="landing-hero">
      <div class="landing-hero__badge">家計簿 × Gmail自動取込 × 資産管理</div>
      <div class="landing-hero__grid">
        <div class="landing-hero__content">
          <p class="landing-hero__eyebrow">お金の見える化を、最初の一歩からやさしく。</p>
          <h1 class="landing-hero__title">
            支出も資産も目標も、
            <span>ひとつの画面で管理できる</span>
            スマート家計アプリ
          </h1>
          <p class="landing-hero__description">
            Gmailの利用明細取込、口座・証券口座の登録、毎月の収支確認、貯蓄目標の管理まで。
            「何ができるアプリか」が最初に伝わるよう、はじめての方にもわかりやすい導線に整理しました。
          </p>
          <div class="landing-hero__actions">
            <button class="landing-hero__primary" @click="goToSignup">無料ではじめる</button>
            <button class="landing-hero__secondary" @click="goToLogin">ログイン</button>
          </div>
          <ul class="landing-hero__points">
            <li>収支・口座・投資をまとめて管理</li>
            <li>クレジット利用をGmailから自動で取り込み</li>
            <li>今日使える金額や目標進捗をすぐ確認</li>
          </ul>
        </div>

        <div class="landing-hero__panel">
          <div class="landing-preview-card landing-preview-card--main">
            <p class="landing-preview-card__label">ダッシュボードでわかること</p>
            <div class="landing-preview-card__stat">
              <span>総資産</span>
              <strong>¥4,280,000</strong>
            </div>
            <div class="landing-preview-card__grid">
              <div>
                <span>今月の収入</span>
                <strong>¥420,000</strong>
              </div>
              <div>
                <span>今月の支出</span>
                <strong>¥178,000</strong>
              </div>
              <div>
                <span>今日使える金額</span>
                <strong>¥8,000</strong>
              </div>
              <div>
                <span>投資残高</span>
                <strong>¥1,920,000</strong>
              </div>
            </div>
          </div>
          <div class="landing-preview-card">
            <p class="landing-preview-card__label">こんな人におすすめ</p>
            <ul class="landing-preview-card__list">
              <li>ひとり暮らしで毎月の支出を整えたい人</li>
              <li>家族・夫婦で資産全体を見える化したい人</li>
              <li>現金・口座・投資を一緒に管理したい人</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="landing-section">
      <div class="landing-section__head">
        <p class="landing-section__eyebrow">できること</p>
        <h2>3つの利用シーンで、価値が伝わるLPに改善</h2>
      </div>
      <div class="landing-persona-grid">
        <article class="landing-persona-card">
          <div class="landing-persona-card__icon">👩</div>
          <h3>ひとり暮らしの方</h3>
          <p>毎月の固定費・カード支出・残高をまとめて確認。無駄遣いを減らしやすくなります。</p>
        </article>
        <article class="landing-persona-card">
          <div class="landing-persona-card__icon">👨‍👩‍👧</div>
          <h3>家族・夫婦で管理したい方</h3>
          <p>家計全体の見える化に向いています。口座や支出の全体像を共通で把握できます。</p>
        </article>
        <article class="landing-persona-card">
          <div class="landing-persona-card__icon">📈</div>
          <h3>投資も一緒に見たい方</h3>
          <p>銀行口座だけでなく証券口座や個別株も記録でき、資産形成の進捗を追えます。</p>
        </article>
      </div>
    </section>

    <section class="landing-section landing-section--alt">
      <div class="landing-section__head">
        <p class="landing-section__eyebrow">主な機能</p>
        <h2>初回訪問時に迷わない、機能説明の整理</h2>
      </div>
      <div class="landing-feature-grid">
        <article class="landing-feature-card">
          <h3>Gmail自動取込</h3>
          <p>クレジットカード利用メールを読み取り、支出登録の手間を減らします。</p>
        </article>
        <article class="landing-feature-card">
          <h3>口座・決済手段の登録</h3>
          <p>銀行口座、クレジットカード、電子マネー、QR決済をまとめて登録できます。</p>
        </article>
        <article class="landing-feature-card">
          <h3>証券口座・個別株管理</h3>
          <p>投資残高を家計と同じ画面で確認し、資産全体を把握できます。</p>
        </article>
        <article class="landing-feature-card">
          <h3>日次の予算感覚</h3>
          <p>今月の残り日数から、今日使ってよい金額の目安を表示します。</p>
        </article>
        <article class="landing-feature-card">
          <h3>目標管理</h3>
          <p>目標金額や目標年を設定し、資産形成の進捗を可視化できます。</p>
        </article>
        <article class="landing-feature-card">
          <h3>ダッシュボード可視化</h3>
          <p>総資産、収入、支出、口座残高、投資残高をひと目で確認できます。</p>
        </article>
      </div>
    </section>

    <section class="landing-cta">
      <div>
        <p class="landing-section__eyebrow">はじめる</p>
        <h2>まずは無料で会員登録して、初期設定を進めましょう</h2>
        <p>登録後は、口座・決済手段・証券口座の初期設定画面へ進める構成にすると、離脱を減らしやすくなります。</p>
      </div>
      <div class="landing-cta__actions">
        <button class="landing-hero__primary" @click="goToSignup">会員登録へ進む</button>
        <button class="landing-hero__secondary" @click="goToLogin">すでに登録済みの方はこちら</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.2), transparent 28%),
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.18), transparent 22%),
    linear-gradient(180deg, #f8fbff 0%, #ffffff 52%, #f7f7fe 100%);
  color: #111827;
}

.landing-hero,
.landing-section,
.landing-cta {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
}

.landing-hero {
  padding: 2rem 0 3rem;
}

.landing-hero__badge {
  display: inline-flex;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.1);
  color: #4338ca;
  font-size: 0.82rem;
  font-weight: 700;
}

.landing-hero__grid {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  gap: 1.5rem;
  margin-top: 1.25rem;
}

.landing-hero__content,
.landing-hero__panel,
.landing-feature-card,
.landing-persona-card,
.landing-cta {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.landing-hero__content {
  border-radius: 28px;
  padding: 2rem;
}

.landing-hero__eyebrow,
.landing-section__eyebrow {
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.landing-hero__title {
  margin-top: 0.85rem;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.1;
}

.landing-hero__title span {
  display: block;
  color: #0f766e;
}

.landing-hero__description {
  margin-top: 1rem;
  color: #475569;
  line-height: 1.85;
  font-size: 1rem;
}

.landing-hero__actions,
.landing-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.4rem;
}

.landing-hero__primary {
  min-width: 180px;
  padding: 0.95rem 1.35rem;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  font-size: 0.98rem;
  font-weight: 800;
}

.landing-hero__secondary {
  min-width: 180px;
  padding: 0.95rem 1.35rem;
  border-radius: 14px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.98rem;
  font-weight: 700;
}

.landing-hero__points {
  display: grid;
  gap: 0.65rem;
  margin-top: 1.5rem;
  padding-left: 1rem;
  color: #334155;
}

.landing-hero__panel {
  border-radius: 28px;
  padding: 1.25rem;
  display: grid;
  gap: 1rem;
}

.landing-preview-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 1.25rem;
}

.landing-preview-card--main {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
  color: #fff;
  box-shadow: 0 16px 36px rgba(13, 148, 136, 0.24);
}

.landing-preview-card__label {
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0.9;
}

.landing-preview-card__stat {
  margin-top: 0.75rem;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.landing-preview-card__stat strong {
  font-size: 1.9rem;
}

.landing-preview-card__grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.landing-preview-card__grid div,
.landing-preview-card__list li {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 0.9rem;
}

.landing-preview-card__grid span,
.landing-preview-card__list {
  font-size: 0.84rem;
}

.landing-preview-card__grid strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.05rem;
}

.landing-preview-card__list {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.75rem;
  padding-left: 0;
  list-style: none;
  color: #334155;
}

.landing-section {
  padding: 0 0 2rem;
}

.landing-section--alt {
  padding-bottom: 2.4rem;
}

.landing-section__head {
  margin-bottom: 1rem;
}

.landing-section__head h2 {
  margin-top: 0.4rem;
  font-size: clamp(1.5rem, 2.8vw, 2.3rem);
}

.landing-persona-grid,
.landing-feature-grid {
  display: grid;
  gap: 1rem;
}

.landing-persona-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.landing-feature-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.landing-persona-card,
.landing-feature-card {
  border-radius: 24px;
  padding: 1.35rem;
}

.landing-persona-card__icon {
  font-size: 1.8rem;
  margin-bottom: 0.6rem;
}

.landing-persona-card h3,
.landing-feature-card h3 {
  font-size: 1.05rem;
  margin-bottom: 0.55rem;
}

.landing-persona-card p,
.landing-feature-card p,
.landing-cta p {
  color: #475569;
  line-height: 1.75;
}

.landing-cta {
  border-radius: 28px;
  padding: 1.75rem;
  margin-bottom: 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

@media (max-width: 980px) {
  .landing-hero__grid,
  .landing-persona-grid,
  .landing-feature-grid,
  .landing-cta {
    grid-template-columns: 1fr;
    display: grid;
  }

  .landing-cta {
    justify-content: stretch;
  }
}

@media (max-width: 640px) {
  .landing-hero {
    padding-top: 1.25rem;
  }

  .landing-hero,
  .landing-section,
  .landing-cta {
    width: min(100%, calc(100% - 1rem));
  }

  .landing-hero__content,
  .landing-hero__panel,
  .landing-persona-card,
  .landing-feature-card,
  .landing-cta {
    border-radius: 22px;
    padding: 1.25rem;
  }

  .landing-preview-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
