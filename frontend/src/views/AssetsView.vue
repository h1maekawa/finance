import { useEmailImport } from '@/composables/useEmailImport'
import { triggerGmailImportOnGas } from '@/services/sheetsService'

const { currentHouseholdId } = useHousehold()
const { state, totalAssets, update, fetchAssets } = useAssetBreakdown(() => currentHouseholdId.value)
const { importing, triggerGmailImport } = useEmailImport(() => currentHouseholdId.value)

const syncLoading = ref(false)

async function handleFullSync() {
  syncLoading.value = true
  try {
    // 1. Trigger Gmail + Supabase sync (Card notifications)
    await triggerGmailImport()
    
    // 2. Trigger GAS sync (Investment Spreadsheet)
    await triggerGmailImportOnGas()
    
    // 3. Refresh domestic asset state
    await fetchAssets()
    
    alert('すべてのデータの同期が完了しました。')
  } catch (e) {
    console.error('Full Sync Error:', e)
    alert('一部の同期に失敗しました。')
  } finally {
    syncLoading.value = false
  }
}

const rows = computed(() => [
  { key: 'stocks', label: '個別株', auto: true },
  { key: 'funds', label: '投資信託', auto: true },
  { key: 'cash', label: '現金', auto: false },
  { key: 'account', label: '口座', auto: false },
] as const)

function onInput(key: 'stocks' | 'funds' | 'cash' | 'account', value: string) {
  const parsed = Number(value)
  void update({ [key]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0 })
}
</script>

<template>
  <main class="assets-view space-y-8 pb-32">
    <section class="space-y-1">
      <p class="text-premium-label">資産概況</p>
      <div class="flex items-center justify-between">
        <h1 class="text-premium-headline text-3xl">現預貯金・資産</h1>
        <button 
          @click="handleFullSync"
          :disabled="syncLoading || importing"
          class="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
        >
          <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': syncLoading || importing }">sync</span>
          {{ syncLoading || importing ? '同期中...' : 'Gmail同期' }}
        </button>
      </div>
    </section>

    <section class="card-premium">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-premium-headline text-xl">資産内訳</h2>
        <span class="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Manual & Auto</span>
      </div>
      
      <div class="space-y-4">
        <div v-for="row in rows" :key="row.key" class="space-y-1.5">
          <div class="flex items-center justify-between px-1">
            <span class="text-sm font-bold text-on-surface-variant flex items-center gap-1.5">
              {{ row.label }}
              <span v-if="row.auto" class="material-symbols-outlined text-[14px] text-primary" title="投資データから自動算出">auto_awesome</span>
            </span>
            <span v-if="row.auto" class="text-[10px] text-primary font-bold opacity-60">自動更新</span>
          </div>
          <div class="relative group">
            <input
              :value="state[row.key]"
              type="number"
              min="0"
              step="1"
              :readonly="row.auto"
              @input="onInput(row.key, ($event.target as HTMLInputElement).value)"
              :class="['w-full h-14 px-5 rounded-2xl bg-surface-container text-lg font-bold outline-none transition-all border-2', row.auto ? 'border-transparent opacity-80 cursor-not-allowed' : 'border-transparent focus:border-primary/30 group-hover:bg-surface-container-high']"
            />
            <span class="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">円</span>
          </div>
        </div>
      </div>
    </section>

    <section class="card-premium bg-primary text-on-primary">
      <p class="text-on-primary/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Assets</p>
      <h2 class="text-on-primary/70 text-sm font-bold mb-2">総資産額</h2>
      <div class="flex items-baseline gap-2">
        <p class="text-4xl font-black">{{ totalAssets.toLocaleString() }}</p>
        <p class="text-xl font-bold opacity-80">円</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.assets-view {
  animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
