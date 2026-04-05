<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const transactionType = ref('expense') // 'expense' or 'income'
const amountDisplay = ref('0')

function typeNumber(num: string) {
  if (amountDisplay.value === '0') {
    amountDisplay.value = num
  } else {
    amountDisplay.value += num
  }
}

function backspace() {
  if (amountDisplay.value.length > 1) {
    amountDisplay.value = amountDisplay.value.slice(0, -1)
  } else {
    amountDisplay.value = '0'
  }
}

function close() {
  router.back()
}
</script>

<template>
  <div class="flex-grow pb-8 max-w-md mx-auto w-full">
    <div class="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm flex justify-between items-center px-6 py-4 left-0 right-0">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent font-headline tracking-tight">取引入力</h1>
      </div>
      <button @click="close" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100/50 transition-all duration-300">
        <span class="material-symbols-outlined text-slate-500">close</span>
      </button>
    </div>

    <!-- Transaction Type Toggle -->
    <div class="bg-surface-container-low p-1.5 rounded-full flex mb-8 mt-4">
      <button 
        @click="transactionType = 'expense'"
        :class="['flex-1 py-2.5 rounded-full font-bold text-sm font-headline transition-all', transactionType === 'expense' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container']"
      >
        支出
      </button>
      <button 
        @click="transactionType = 'income'"
        :class="['flex-1 py-2.5 rounded-full font-bold text-sm font-headline transition-all', transactionType === 'income' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container']"
      >
        収入
      </button>
    </div>

    <!-- Amount Display -->
    <section class="mb-10 text-center">
      <label class="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2 font-label">取引金額</label>
      <div class="flex items-center justify-center gap-2">
        <span class="text-3xl font-bold text-on-surface-variant font-headline">¥</span>
        <span class="text-6xl font-extrabold text-primary font-headline tracking-tighter">{{ parseInt(amountDisplay).toLocaleString() }}</span>
      </div>
    </section>

    <!-- Category Grid (Bento Style) -->
    <section class="mb-10">
      <div class="flex justify-between items-end mb-4">
        <h3 class="font-headline font-bold text-lg text-on-surface">カテゴリー</h3>
        <span class="text-primary text-sm font-semibold">すべて見る</span>
      </div>
      <div class="grid grid-cols-4 gap-3">
        <!-- Food -->
        <button class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-transparent shadow-sm active:scale-95 transition-all">
          <div class="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">restaurant</span>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">食費</span>
        </button>
        <!-- Transport -->
        <button class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-transparent shadow-sm active:scale-95 transition-all">
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">directions_car</span>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">交通費</span>
        </button>
        <!-- Shopping -->
        <button class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-transparent shadow-sm active:scale-95 transition-all outline-primary border-primary bg-primary-fixed/10">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">shopping_bag</span>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">買い物</span>
        </button>
        <!-- Health -->
        <button class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-transparent shadow-sm active:scale-95 transition-all">
          <div class="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">medical_services</span>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">健康</span>
        </button>
      </div>
    </section>

    <!-- Form Details -->
    <section class="space-y-4 mb-10">
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">日付</label>
          <div class="flex items-center gap-3 bg-surface-container-highest/50 px-4 py-3 rounded-xl border border-outline-variant/30">
            <span class="material-symbols-outlined text-slate-500 text-sm">calendar_today</span>
            <span class="text-sm font-medium">2023年10月24日</span>
          </div>
        </div>
        <div class="flex-1">
          <label class="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">時刻</label>
          <div class="flex items-center gap-3 bg-surface-container-highest/50 px-4 py-3 rounded-xl border border-outline-variant/30">
            <span class="material-symbols-outlined text-slate-500 text-sm">schedule</span>
            <span class="text-sm font-medium">14:30</span>
          </div>
        </div>
      </div>
      <div>
        <label class="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">メモ（任意）</label>
        <div class="flex items-center gap-3 bg-surface-container-highest/50 px-4 py-3 rounded-xl border border-outline-variant/30">
          <span class="material-symbols-outlined text-slate-500 text-sm">notes</span>
          <input type="text" class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 outline-none" placeholder="同僚とランチ..." />
        </div>
      </div>
    </section>

    <!-- Numeric Keypad -->
    <section class="grid grid-cols-3 gap-y-4 gap-x-8 mb-10">
      <button v-for="num in ['1','2','3','4','5','6','7','8','9','00','0']" :key="num" @click="typeNumber(num)" class="h-16 flex items-center justify-center font-headline text-2xl font-bold text-on-surface hover:bg-surface-container active:bg-surface-container-high rounded-2xl transition-colors">
        {{ num }}
      </button>
      <button @click="backspace" class="h-16 flex items-center justify-center flex-col text-on-surface hover:bg-surface-container active:bg-surface-container-high rounded-2xl transition-colors">
        <span class="material-symbols-outlined">backspace</span>
      </button>
    </section>

    <!-- Primary Action -->
    <button @click="close" class="w-full py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3">
      <span>保存する</span>
      <span class="material-symbols-outlined text-xl">done_all</span>
    </button>
  </div>
</template>
