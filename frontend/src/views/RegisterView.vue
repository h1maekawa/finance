<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAccounts } from '@/composables/useAccounts'
import { useHousehold } from '@/composables/useHousehold'
import { useCreditCards } from '@/composables/useCreditCards'
import { useSecuritiesAccounts } from '@/composables/useSecuritiesAccounts'

const { currentHouseholdId } = useHousehold()
const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts(() => currentHouseholdId.value)
const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useCreditCards(() => currentHouseholdId.value)
const {
  securitiesAccounts,
  addSecuritiesAccount,
  updateSecuritiesAccount,
  deleteSecuritiesAccount,
} = useSecuritiesAccounts(() => currentHouseholdId.value)

const showAddModal = ref(false)
const showCardModal = ref(false)
const showSecuritiesModal = ref(false)
const newName = ref('')
const newBalance = ref<number | undefined>(undefined)
const cardNameInput = ref('')
const securitiesBrokerInput = ref('')
const securitiesAccountNameInput = ref('')
const securitiesTaxCategoryInput = ref<'nisa_growth' | 'nisa_tsumitate' | 'specified' | 'general'>('specified')
const editingAccountId = ref<string | null>(null)
const editAccountName = ref('')
const editAccountBalance = ref<number>(0)
const editingCardId = ref<string | null>(null)
const editCardName = ref('')
const editingSecuritiesId = ref<string | null>(null)
const editSecuritiesBroker = ref('')
const editSecuritiesName = ref('')
const editSecuritiesTax = ref<'nisa_growth' | 'nisa_tsumitate' | 'specified' | 'general'>('specified')
const errorMessage = ref('')
const cardErrorMessage = ref('')
const securitiesErrorMessage = ref('')

const bankNameCandidates = [
  '三井住友銀行',
  '三菱UFJ銀行',
  'みずほ銀行',
  'りそな銀行',
  '楽天銀行',
  '住信SBIネット銀行',
  'PayPay銀行',
  'ゆうちょ銀行',
  'イオン銀行',
  'SBI新生銀行',
]

const cardNameCandidates = [
  '楽天カード',
  '楽天プレミアムカード',
  '楽天ゴールドカード',
  '三井住友カード（NL）',
  '三井住友カード ゴールド（NL）',
  'JCBカード W',
  'JCBゴールド',
  'エポスカード',
  'イオンカードセレクト',
  'dカード',
  'dカード GOLD',
  'PayPayカード',
  'au PAY カード',
  'セゾンカードインターナショナル',
  '三菱UFJカード',
  'アメリカン・エキスプレス・グリーン',
]

const securitiesBrokerCandidates = [
  '楽天証券',
  'SBI証券',
  'マネックス証券',
  '松井証券',
  'auカブコム証券',
  '野村證券',
  'SMBC日興証券',
  '大和証券',
]

const filteredBankCandidates = computed(() => {
  const keyword = newName.value.trim().toLowerCase()
  if (!keyword) return bankNameCandidates.slice(0, 6)
  return bankNameCandidates
    .filter((name) => name.toLowerCase().includes(keyword))
    .slice(0, 6)
})

function selectBankCandidate(name: string) {
  newName.value = name
}

const filteredCardCandidates = computed(() => {
  const keyword = cardNameInput.value.trim().toLowerCase()
  if (!keyword) return cardNameCandidates.slice(0, 8)
  return cardNameCandidates
    .filter((name) => name.toLowerCase().includes(keyword))
    .slice(0, 8)
})

function selectCardCandidate(name: string) {
  cardNameInput.value = name
}

const filteredSecuritiesBrokerCandidates = computed(() => {
  const keyword = securitiesBrokerInput.value.trim().toLowerCase()
  if (!keyword) return securitiesBrokerCandidates.slice(0, 6)
  return securitiesBrokerCandidates
    .filter((name) => name.toLowerCase().includes(keyword))
    .slice(0, 6)
})

function selectSecuritiesBrokerCandidate(name: string) {
  securitiesBrokerInput.value = name
}

async function handleAdd() {
  errorMessage.value = ''
  if (!newName.value.trim()) {
    errorMessage.value = '金融機関名を入力してください。'
    return
  }

  try {
    await addAccount(newName.value, newBalance.value ?? 0)
    newName.value = ''
    newBalance.value = undefined
    showAddModal.value = false
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登録に失敗しました。'
  }
}

async function handleAddCard() {
  cardErrorMessage.value = ''
  if (!cardNameInput.value.trim()) {
    cardErrorMessage.value = 'カード名を入力してください。'
    return
  }

  try {
    await addCreditCard({
      card_name: cardNameInput.value,
      is_active: true,
    })
    cardNameInput.value = ''
    showCardModal.value = false
  } catch (error) {
    cardErrorMessage.value = error instanceof Error ? error.message : 'カード登録に失敗しました。'
  }
}

function startEditAccount(account: { id: string; institution_name: string; balance: number }) {
  editingAccountId.value = account.id
  editAccountName.value = account.institution_name
  editAccountBalance.value = account.balance
}

function cancelEditAccount() {
  editingAccountId.value = null
}

async function saveEditAccount(id: string) {
  errorMessage.value = ''
  try {
    await updateAccount(id, {
      institution_name: editAccountName.value,
      balance: editAccountBalance.value,
    })
    editingAccountId.value = null
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '口座更新に失敗しました。'
  }
}

async function removeAccount(id: string) {
  errorMessage.value = ''
  if (!confirm('この口座を削除しますか？')) return
  try {
    await deleteAccount(id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '口座削除に失敗しました。'
  }
}

function startEditCard(card: { id: string; card_name: string }) {
  editingCardId.value = card.id
  editCardName.value = card.card_name
}

function cancelEditCard() {
  editingCardId.value = null
}

async function saveEditCard(id: string) {
  cardErrorMessage.value = ''
  if (!editCardName.value.trim()) {
    cardErrorMessage.value = 'カード名を入力してください。'
    return
  }

  try {
    await updateCreditCard(id, { card_name: editCardName.value })
    editingCardId.value = null
  } catch (error) {
    cardErrorMessage.value = error instanceof Error ? error.message : 'カード更新に失敗しました。'
  }
}

async function removeCard(id: string) {
  cardErrorMessage.value = ''
  if (!confirm('このカードを削除しますか？')) return
  try {
    await deleteCreditCard(id)
  } catch (error) {
    cardErrorMessage.value = error instanceof Error ? error.message : 'カード削除に失敗しました。'
  }
}

const taxCategoryLabel: Record<'nisa_growth' | 'nisa_tsumitate' | 'specified' | 'general', string> = {
  nisa_growth: 'NISA 成長投資枠',
  nisa_tsumitate: 'NISA つみたて投資枠',
  specified: '特定口座',
  general: '一般口座',
}

async function handleAddSecuritiesAccount() {
  securitiesErrorMessage.value = ''
  if (!securitiesBrokerInput.value.trim()) {
    securitiesErrorMessage.value = '証券会社名を入力してください。'
    return
  }
  if (!securitiesAccountNameInput.value.trim()) {
    securitiesErrorMessage.value = '口座名を入力してください。'
    return
  }

  try {
    await addSecuritiesAccount({
      broker_name: securitiesBrokerInput.value,
      account_name: securitiesAccountNameInput.value,
      tax_category: securitiesTaxCategoryInput.value,
      is_active: true,
    })
    securitiesBrokerInput.value = ''
    securitiesAccountNameInput.value = ''
    securitiesTaxCategoryInput.value = 'specified'
    showSecuritiesModal.value = false
  } catch (error) {
    securitiesErrorMessage.value = error instanceof Error ? error.message : '証券口座登録に失敗しました。'
  }
}

function startEditSecuritiesAccount(row: { id: string; broker_name: string; account_name: string; tax_category: 'nisa_growth' | 'nisa_tsumitate' | 'specified' | 'general' }) {
  editingSecuritiesId.value = row.id
  editSecuritiesBroker.value = row.broker_name
  editSecuritiesName.value = row.account_name
  editSecuritiesTax.value = row.tax_category
}

function cancelEditSecuritiesAccount() {
  editingSecuritiesId.value = null
}

async function saveEditSecuritiesAccount(id: string) {
  securitiesErrorMessage.value = ''
  try {
    await updateSecuritiesAccount(id, {
      broker_name: editSecuritiesBroker.value,
      account_name: editSecuritiesName.value,
      tax_category: editSecuritiesTax.value,
    })
    editingSecuritiesId.value = null
  } catch (error) {
    securitiesErrorMessage.value = error instanceof Error ? error.message : '証券口座更新に失敗しました。'
  }
}

async function removeSecuritiesAccount(id: string) {
  securitiesErrorMessage.value = ''
  if (!confirm('この証券口座を削除しますか？')) return
  try {
    await deleteSecuritiesAccount(id)
  } catch (error) {
    securitiesErrorMessage.value = error instanceof Error ? error.message : '証券口座削除に失敗しました。'
  }
}
</script>

<template>
  <main class="register-view">
    <section class="card register-view__hero">
      <h2 class="register-view__title">登録</h2>
      <p class="register-view__desc">口座とクレジットカードの新規登録はこちらから行います。</p>
      <div class="register-view__hero-actions">
        <button type="button" class="register-view__btn" @click="showAddModal = true">口座を登録</button>
        <button type="button" class="register-view__btn" @click="showCardModal = true">カードを登録</button>
        <button type="button" class="register-view__btn" @click="showSecuritiesModal = true">証券口座を登録</button>
      </div>
      <p v-if="errorMessage" class="register-view__error">{{ errorMessage }}</p>
      <p v-if="cardErrorMessage" class="register-view__error">{{ cardErrorMessage }}</p>
      <p v-if="securitiesErrorMessage" class="register-view__error">{{ securitiesErrorMessage }}</p>
    </section>

    <section class="card">
      <h3 class="register-view__sub-title">登録済み口座</h3>
      <p v-if="accounts.length === 0" class="register-view__empty">まだ口座が登録されていません</p>
      <ul v-else class="register-view__list">
        <li v-for="account in accounts" :key="account.id" class="register-view__item">
          <template v-if="editingAccountId === account.id">
            <div class="register-view__edit-row">
              <input v-model="editAccountName" type="text" class="register-view__edit-input" />
              <input v-model.number="editAccountBalance" type="number" min="0" step="1" class="register-view__edit-input" />
              <div class="register-view__item-actions">
                <button @click="saveEditAccount(account.id)">保存</button>
                <button class="register-view__close" @click="cancelEditAccount">取消</button>
              </div>
            </div>
          </template>
          <template v-else>
            <span>{{ account.institution_name }}</span>
            <div class="register-view__item-actions">
              <span>{{ account.balance.toLocaleString() }} 円</span>
              <button @click="startEditAccount(account)">編集</button>
              <button style="background: #dc2626;" @click="removeAccount(account.id)">削除</button>
            </div>
          </template>
        </li>
      </ul>
    </section>

    <section class="card">
      <h3 class="register-view__sub-title">登録済みクレジットカード</h3>
      <p v-if="creditCards.length === 0" class="register-view__empty">まだカードが登録されていません</p>
      <ul v-else class="register-view__list">
        <li v-for="card in creditCards" :key="card.id" class="register-view__item">
          <template v-if="editingCardId === card.id">
            <div class="register-view__edit-row">
              <input v-model="editCardName" type="text" class="register-view__edit-input" />
              <div class="register-view__item-actions">
                <button @click="saveEditCard(card.id)">保存</button>
                <button class="register-view__close" @click="cancelEditCard">取消</button>
              </div>
            </div>
          </template>
          <template v-else>
            <span>{{ card.card_name }}</span>
            <div class="register-view__item-actions">
              <button @click="startEditCard(card)">編集</button>
              <button style="background: #dc2626;" @click="removeCard(card.id)">削除</button>
            </div>
          </template>
        </li>
      </ul>
    </section>

    <section class="card">
      <h3 class="register-view__sub-title">登録済み証券口座</h3>
      <p v-if="securitiesAccounts.length === 0" class="register-view__empty">まだ証券口座が登録されていません</p>
      <ul v-else class="register-view__list">
        <li v-for="row in securitiesAccounts" :key="row.id" class="register-view__item">
          <template v-if="editingSecuritiesId === row.id">
            <div class="register-view__edit-row">
              <input v-model="editSecuritiesBroker" type="text" class="register-view__edit-input" />
              <input v-model="editSecuritiesName" type="text" class="register-view__edit-input" />
              <select v-model="editSecuritiesTax" class="register-view__edit-input">
                <option value="nisa_growth">NISA 成長投資枠</option>
                <option value="nisa_tsumitate">NISA つみたて投資枠</option>
                <option value="specified">特定口座</option>
                <option value="general">一般口座</option>
              </select>
              <div class="register-view__item-actions">
                <button @click="saveEditSecuritiesAccount(row.id)">保存</button>
                <button class="register-view__close" @click="cancelEditSecuritiesAccount">取消</button>
              </div>
            </div>
          </template>
          <template v-else>
            <span>{{ row.broker_name }} / {{ row.account_name }} / {{ taxCategoryLabel[row.tax_category] }}</span>
            <div class="register-view__item-actions">
              <button @click="startEditSecuritiesAccount(row)">編集</button>
              <button style="background: #dc2626;" @click="removeSecuritiesAccount(row.id)">削除</button>
            </div>
          </template>
        </li>
      </ul>
    </section>

    <div v-if="showAddModal" class="register-view__modal-overlay" @click.self="showAddModal = false">
      <section class="register-view__modal card">
        <h3 class="register-view__sub-title">口座を追加</h3>
        <form class="register-view__form" @submit.prevent="handleAdd">
          <input
            v-model="newName"
            type="text"
            placeholder="金融機関名（例：三菱UFJ銀行）"
            required
          />
          <ul v-if="filteredBankCandidates.length > 0" class="register-view__suggestions">
            <li
              v-for="candidate in filteredBankCandidates"
              :key="candidate"
              class="register-view__suggestion-item"
              @click="selectBankCandidate(candidate)"
            >
              {{ candidate }}
            </li>
          </ul>
          <input
            v-model.number="newBalance"
            type="number"
            min="0"
            step="1"
            placeholder="残高（円）"
          />
          <div class="register-view__actions">
            <button type="submit">登録する</button>
            <button type="button" class="register-view__close" @click="showAddModal = false">閉じる</button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showCardModal" class="register-view__modal-overlay" @click.self="showCardModal = false">
      <section class="register-view__modal card">
        <h3 class="register-view__sub-title">クレジットカードを追加</h3>
        <form class="register-view__form" @submit.prevent="handleAddCard">
          <input
            v-model="cardNameInput"
            type="text"
            placeholder="カード名（例：楽天カード）"
            required
          />
          <ul v-if="filteredCardCandidates.length > 0" class="register-view__suggestions">
            <li
              v-for="candidate in filteredCardCandidates"
              :key="candidate"
              class="register-view__suggestion-item"
              @click="selectCardCandidate(candidate)"
            >
              {{ candidate }}
            </li>
          </ul>
          <div class="register-view__actions">
            <button type="submit">登録する</button>
            <button type="button" class="register-view__close" @click="showCardModal = false">閉じる</button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="showSecuritiesModal" class="register-view__modal-overlay" @click.self="showSecuritiesModal = false">
      <section class="register-view__modal card">
        <h3 class="register-view__sub-title">証券口座を追加</h3>
        <form class="register-view__form" @submit.prevent="handleAddSecuritiesAccount">
          <input
            v-model="securitiesBrokerInput"
            type="text"
            placeholder="証券会社（例：楽天証券）"
            required
          />
          <ul v-if="filteredSecuritiesBrokerCandidates.length > 0" class="register-view__suggestions">
            <li
              v-for="candidate in filteredSecuritiesBrokerCandidates"
              :key="candidate"
              class="register-view__suggestion-item"
              @click="selectSecuritiesBrokerCandidate(candidate)"
            >
              {{ candidate }}
            </li>
          </ul>
          <input
            v-model="securitiesAccountNameInput"
            type="text"
            placeholder="口座名（例：メイン口座）"
            required
          />
          <select v-model="securitiesTaxCategoryInput">
            <option value="nisa_growth">NISA 成長投資枠</option>
            <option value="nisa_tsumitate">NISA つみたて投資枠</option>
            <option value="specified">特定口座</option>
            <option value="general">一般口座</option>
          </select>
          <div class="register-view__actions">
            <button type="submit">登録する</button>
            <button type="button" class="register-view__close" @click="showSecuritiesModal = false">閉じる</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.register-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.register-view__hero {
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
  color: #fff;
}

.register-view__title {
  margin: 0;
  font-size: 1.1rem;
}

.register-view__desc {
  margin: 0.4rem 0 0.8rem;
  font-size: 0.92rem;
  opacity: 0.95;
}

.register-view__btn {
  background: #ffffff;
  color: #0f766e;
  font-weight: 700;
}

.register-view__hero-actions {
  display: flex;
  gap: 0.5rem;
}

.register-view__error {
  margin: 0.5rem 0 0;
  color: #fecaca;
}

.register-view__sub-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.register-view__empty {
  margin: 0;
  color: #6b7280;
}

.register-view__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.register-view__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  font-weight: 600;
}

.register-view__item-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.register-view__edit-row {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.register-view__edit-input {
  flex: 1;
  min-width: 0;
}

.register-view__modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.register-view__modal {
  width: min(520px, 100%);
}

.register-view__form {
  display: grid;
  gap: 0.5rem;
}

.register-view__actions {
  display: flex;
  gap: 0.5rem;
}

.register-view__close {
  background: #6b7280;
}

.register-view__suggestions {
  list-style: none;
  margin: -0.1rem 0 0;
  padding: 0.2rem;
  border: 1px solid #dbe1ea;
  border-radius: 10px;
  background: #fff;
  max-height: 170px;
  overflow: auto;
}

.register-view__suggestion-item {
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  cursor: pointer;
  color: #1f2937;
}

.register-view__suggestion-item:hover {
  background: #eef2ff;
}
</style>
