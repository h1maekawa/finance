<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAccounts } from '@/composables/useAccounts'
import { useHousehold } from '@/composables/useHousehold'
import { useCreditCards } from '@/composables/useCreditCards'
import { useSecuritiesAccounts } from '@/composables/useSecuritiesAccounts'

const router = useRouter()
const { currentHouseholdId } = useHousehold()
const { accounts, addAccount, deleteAccount } = useAccounts(() => currentHouseholdId.value)
const { creditCards, addCreditCard, deleteCreditCard } = useCreditCards(() => currentHouseholdId.value)
const {
  securitiesAccounts,
  addSecuritiesAccount,
  deleteSecuritiesAccount,
} = useSecuritiesAccounts(() => currentHouseholdId.value)

const currentStep = ref(1) // 1: Bank, 2: Cards, 3: Securities, 4: Done

// Step 1: Bank
const newBankName = ref('')
const newBankBalance = ref<number | undefined>(undefined)
const bankErrorMessage = ref('')
const bankNameCandidates = ['三井住友銀行', '三菱UFJ銀行', 'みずほ銀行', 'りそな銀行', '楽天銀行', '住信SBIネット銀行', 'PayPay銀行', 'ゆうちょ銀行', 'イオン銀行', 'SBI新生銀行']

const filteredBankCandidates = computed(() => {
  const keyword = newBankName.value.trim().toLowerCase()
  if (!keyword) return bankNameCandidates.slice(0, 6)
  return bankNameCandidates.filter(n => n.toLowerCase().includes(keyword)).slice(0, 6)
})

async function handleAddBank() {
  bankErrorMessage.value = ''
  if (!newBankName.value.trim()) return
  try {
    await addAccount(newBankName.value, newBankBalance.value ?? 0)
    newBankName.value = ''
    newBankBalance.value = undefined
  } catch (e) {
    bankErrorMessage.value = '登録に失敗しました'
  }
}

// Step 2: Cards
const newCardName = ref('')
const cardErrorMessage = ref('')
const cardNameCandidates = ['楽天カード', '三井住友カード（NL）', 'JCBカード W', 'エポスカード', 'PayPayカード', 'dカード', 'イオンカード', '交通系IC（Suica/PASMO）', 'PayPay', '楽天ペイ']

const filteredCardCandidates = computed(() => {
  const keyword = newCardName.value.trim().toLowerCase()
  if (!keyword) return cardNameCandidates.slice(0, 6)
  return cardNameCandidates.filter(n => n.toLowerCase().includes(keyword)).slice(0, 6)
})

async function handleAddCard() {
  cardErrorMessage.value = ''
  if (!newCardName.value.trim()) return
  try {
    await addCreditCard({ card_name: newCardName.value, is_active: true })
    newCardName.value = ''
  } catch (e) {
    cardErrorMessage.value = '登録に失敗しました'
  }
}

// Step 3: Securities
const newBroker = ref('')
const newSecName = ref('')
const newTax = ref<'nisa_growth' | 'nisa_tsumitate' | 'specified' | 'general'>('specified')
const secErrorMessage = ref('')
const secBrokerCandidates = ['楽天証券', 'SBI証券', 'マネックス証券', '松井証券', 'auカブコム証券', '野村證券']

const filteredSecCandidates = computed(() => {
  const keyword = newBroker.value.trim().toLowerCase()
  if (!keyword) return secBrokerCandidates.slice(0, 6)
  return secBrokerCandidates.filter(n => n.toLowerCase().includes(keyword)).slice(0, 6)
})

async function handleAddSec() {
  secErrorMessage.value = ''
  if (!newBroker.value.trim() || !newSecName.value.trim()) return
  try {
    await addSecuritiesAccount({
      broker_name: newBroker.value,
      account_name: newSecName.value,
      tax_category: newTax.value,
      is_active: true
    })
    newBroker.value = ''
    newSecName.value = ''
    newTax.value = 'specified'
  } catch (e) {
    secErrorMessage.value = '登録に失敗しました'
  }
}

function nextStep() {
  if (currentStep.value < 4) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function completeSetup() {
  router.push('/dashboard')
}

const taxCategoryLabel: Record<string, string> = {
  nisa_growth: 'NISA 成長投資枠',
  nisa_tsumitate: 'NISA つみたて枠',
  specified: '特定口座',
  general: '一般口座',
}
</script>

<template>
  <main class="setup-layout">
    <div class="setup-container card">
      <!-- Header / Stepper -->
      <header class="setup-header">
        <h1 class="setup-header__title">初期設定しましょう</h1>
        <p class="setup-header__desc">資産状況を正しく把握するために、まずは主要な口座を登録します。</p>
        
        <nav class="setup-stepper">
          <div :class="['setup-step', { 'setup-step--active': currentStep === 1, 'setup-step--done': currentStep > 1 }]">
            <span class="setup-step__icon">1</span>
            <span class="setup-step__label">銀行口座</span>
          </div>
          <div class="setup-stepper__line"></div>
          <div :class="['setup-step', { 'setup-step--active': currentStep === 2, 'setup-step--done': currentStep > 2 }]">
            <span class="setup-step__icon">2</span>
            <span class="setup-step__label">カード・決済</span>
          </div>
          <div class="setup-stepper__line"></div>
          <div :class="['setup-step', { 'setup-step--active': currentStep === 3, 'setup-step--done': currentStep > 3 }]">
            <span class="setup-step__icon">3</span>
            <span class="setup-step__label">証券口座</span>
          </div>
        </nav>
      </header>

      <div class="setup-content">
        <!-- Step 1: Bank Accounts -->
        <section v-if="currentStep === 1" class="setup-section">
          <h2 class="setup-section__title">銀行口座を登録</h2>
          <p class="setup-section__text">給与振込口座や普段お使いの銀行を登録してください。</p>
          
          <form class="setup-form" @submit.prevent="handleAddBank">
            <div class="setup-form__field">
              <input v-model="newBankName" type="text" placeholder="銀行名（例：三菱UFJ銀行）" class="setup-input" />
              <ul v-if="newBankName && filteredBankCandidates.length" class="setup-suggestions">
                <li v-for="c in filteredBankCandidates" :key="c" @click="newBankName = c">{{ c }}</li>
              </ul>
            </div>
            <div class="setup-form__field">
              <input v-model.number="newBankBalance" type="number" placeholder="現在の残高（円）" class="setup-input" />
            </div>
            <button type="submit" class="setup-btn setup-btn--secondary" :disabled="!newBankName">追加する</button>
            <p v-if="bankErrorMessage" class="setup-error">{{ bankErrorMessage }}</p>
          </form>

          <div v-if="accounts.length" class="setup-list">
            <div v-for="acc in accounts" :key="acc.id" class="setup-list-item">
              <span>{{ acc.institution_name }}</span>
              <div class="setup-list-item__actions">
                <span>{{ acc.balance.toLocaleString() }}円</span>
                <button class="setup-list-item__del" @click="deleteAccount(acc.id)">×</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Step 2: Cards & Payments -->
        <section v-if="currentStep === 2" class="setup-section">
          <h2 class="setup-section__title">決済手段を登録</h2>
          <p class="setup-section__text">よく使うクレジットカードやQR決済、電子マネーを教えてください。</p>
          
          <form class="setup-form" @submit.prevent="handleAddCard">
            <div class="setup-form__field">
              <input v-model="newCardName" type="text" placeholder="名称（例：楽天カード）" class="setup-input" />
              <ul v-if="newCardName && filteredCardCandidates.length" class="setup-suggestions">
                <li v-for="c in filteredCardCandidates" :key="c" @click="newCardName = c">{{ c }}</li>
              </ul>
            </div>
            <button type="submit" class="setup-btn setup-btn--secondary" :disabled="!newCardName">追加する</button>
            <p v-if="cardErrorMessage" class="setup-error">{{ cardErrorMessage }}</p>
          </form>

          <div v-if="creditCards.length" class="setup-list">
            <div v-for="card in creditCards" :key="card.id" class="setup-list-item">
              <span>{{ card.card_name }}</span>
              <button class="setup-list-item__del" @click="deleteCreditCard(card.id)">×</button>
            </div>
          </div>
        </section>

        <!-- Step 3: Securities -->
        <section v-if="currentStep === 3" class="setup-section">
          <h2 class="setup-section__title">証券口座を登録</h2>
          <p class="setup-section__text">NISAや投資信託など、運用している口座があれば登録しましょう。</p>
          
          <form class="setup-form" @submit.prevent="handleAddSec">
            <div class="setup-form__field">
              <input v-model="newBroker" type="text" placeholder="証券会社（例：楽天証券）" class="setup-input" />
              <ul v-if="newBroker && filteredSecCandidates.length" class="setup-suggestions">
                <li v-for="c in filteredSecCandidates" :key="c" @click="newBroker = c">{{ c }}</li>
              </ul>
            </div>
            <div class="setup-form__field">
              <input v-model="newSecName" type="text" placeholder="口座名（例：メイン口座）" class="setup-input" />
            </div>
            <div class="setup-form__field">
              <select v-model="newTax" class="setup-input">
                <option value="specified">特定口座</option>
                <option value="nisa_growth">NISA 成長投資枠</option>
                <option value="nisa_tsumitate">NISA つみたて枠</option>
                <option value="general">一般口座</option>
              </select>
            </div>
            <button type="submit" class="setup-btn setup-btn--secondary" :disabled="!newBroker || !newSecName">追加する</button>
            <p v-if="secErrorMessage" class="setup-error">{{ secErrorMessage }}</p>
          </form>

          <div v-if="securitiesAccounts.length" class="setup-list">
            <div v-for="sec in securitiesAccounts" :key="sec.id" class="setup-list-item">
              <div class="setup-list-item__info">
                <strong>{{ sec.broker_name }}</strong>
                <span>{{ sec.account_name }} ({{ taxCategoryLabel[sec.tax_category] }})</span>
              </div>
              <button class="setup-list-item__del" @click="deleteSecuritiesAccount(sec.id)">×</button>
            </div>
          </div>
        </section>

        <!-- Final Step: Success -->
        <section v-if="currentStep === 4" class="setup-section setup-section--center">
          <div class="setup-success-icon">🎉</div>
          <h2 class="setup-section__title">準備が整いました！</h2>
          <p class="setup-section__text">
            これで初期設定は完了です。<br>
            ダッシュボードであなたの資産状況を確認してみましょう。
          </p>
          <button class="setup-btn setup-btn--primary" @click="completeSetup">ダッシュボードへ進む</button>
        </section>
      </div>

      <!-- Navigation -->
      <footer v-if="currentStep < 4" class="setup-footer">
        <button class="setup-btn setup-btn--text" @click="prevStep" :disabled="currentStep === 1">戻る</button>
        <button class="setup-btn setup-btn--primary" @click="nextStep">
          {{ currentStep === 3 ? '完了画面へ' : '次へ進む' }}
        </button>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.setup-layout {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  background: #f8fafc;
}

.setup-container {
  width: min(640px, 100%);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.setup-header__title {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.setup-header__desc {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.setup-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.setup-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.setup-step__icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: #64748b;
  transition: all 0.3s;
}

.setup-step__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
}

.setup-step--active .setup-step__icon {
  background: #0f766e;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.15);
}

.setup-step--active .setup-step__label {
  color: #0f766e;
}

.setup-step--done .setup-step__icon {
  background: #ccfbf1;
  color: #0f766e;
}

.setup-stepper__line {
  flex: 0.5;
  height: 2px;
  background: #e2e8f0;
  margin-top: -1.2rem;
}

.setup-section--center {
  text-align: center;
  padding: 1rem 0;
}

.setup-section__title {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.setup-section__text {
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.setup-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.setup-form__field {
  position: relative;
}

.setup-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 1rem;
}

.setup-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  z-index: 10;
  list-style: none;
  padding: 0.5rem;
  margin-top: 0.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.setup-suggestions li {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
}

.setup-suggestions li:hover {
  background: #f1f5f9;
}

.setup-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.setup-btn--primary {
  background: #0f766e;
  color: #fff;
}

.setup-btn--secondary {
  background: #f1f5f9;
  color: #0f766e;
}

.setup-btn--text {
  background: transparent;
  color: #64748b;
}

.setup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setup-list {
  display: grid;
  gap: 0.5rem;
}

.setup-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.setup-list-item__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.setup-list-item__info {
  display: flex;
  flex-direction: column;
}

.setup-list-item__info span {
  font-size: 0.8rem;
  color: #64748b;
}

.setup-list-item__del {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
}

.setup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.setup-success-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.setup-error {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: -0.5rem;
}

@media (max-width: 640px) {
  .setup-container {
    padding: 1.5rem;
  }
}
</style>
