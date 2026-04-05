<script setup lang="ts">
// 予算設定
</script>

<template>
  <div class="space-y-6 pb-4">
    <!-- Hero Section: Monthly Budget -->
    <section class="mb-10 text-center space-y-2 mt-4">
      <span class="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">月間予算目標</span>
      <div class="flex flex-col items-center">
        <h1 class="text-[3.5rem] font-extrabold text-primary leading-none tracking-tight font-headline">¥420,000</h1>
        <p class="text-on-surface-variant mt-2 font-medium font-body">2024年5月</p>
      </div>

      <div class="mt-8 relative overflow-hidden bg-surface-container-low rounded-3xl p-6 shadow-sm border border-outline-variant/10 text-left">
        <div class="flex justify-between items-end mb-4">
          <div>
            <span class="block text-[10px] uppercase font-bold text-outline tracking-wider font-label">支出合計</span>
            <span class="text-2xl font-bold text-on-surface font-headline">¥284,050</span>
          </div>
          <div class="text-right">
            <span class="block text-[10px] uppercase font-bold text-outline tracking-wider font-label">残り</span>
            <span class="text-2xl font-bold text-secondary font-headline">¥135,950</span>
          </div>
        </div>
        <!-- Master Progress Bar -->
        <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style="width: 68%;"></div>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-xs font-semibold text-on-surface-variant">68% の予算を使用済み</span>
          <button class="text-xs font-bold text-primary flex items-center gap-1 active:scale-95 transition-transform">
            目標を調整 <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Threshold Settings -->
    <section class="mb-10">
      <div class="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/10">
        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-tertiary">notifications_active</span>
          <h2 class="text-lg font-bold font-headline">アラート設定</h2>
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-surface rounded-2xl">
            <div class="flex flex-col">
              <span class="text-sm font-bold">予算超過の予兆</span>
              <span class="text-xs text-on-surface-variant">カテゴリー予算の80%に達したら通知</span>
            </div>
            <!-- Custom Toggle On -->
            <div class="w-12 h-6 bg-primary rounded-full relative flex items-center px-1 cursor-pointer">
              <div class="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
            </div>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-surface rounded-2xl">
            <div class="flex flex-col">
              <span class="text-sm font-bold">1日の上限</span>
              <span class="text-xs text-on-surface-variant">1日の支出が ¥10,000 を超えたらアラート</span>
            </div>
            <!-- Custom Toggle Off -->
            <div class="w-12 h-6 bg-surface-container-highest rounded-full relative flex items-center px-1 cursor-pointer">
              <div class="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Budget Categories -->
    <section class="space-y-6">
      <div class="flex items-center justify-between mb-4 px-2">
        <h2 class="text-xl font-bold tracking-tight font-headline">カテゴリー</h2>
        <button class="flex items-center">
            <span class="material-symbols-outlined text-on-surface-variant">sort</span>
        </button>
      </div>

      <!-- Category Card: Needs -->
      <div class="group">
        <div class="flex justify-between items-start mb-2 px-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-primary-fixed flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary-fixed-variant">home</span>
            </div>
            <div>
              <h3 class="font-bold text-on-surface font-headline">住居・固定費</h3>
              <span class="text-xs text-on-surface-variant">¥180,000 / ¥200,000</span>
            </div>
          </div>
          <button class="p-2 rounded-xl bg-surface-container-low hover:bg-primary-fixed transition-colors">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div class="bg-surface-container-low rounded-3xl p-4 transition-all duration-300 group-hover:bg-surface-container shadow-sm">
          <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" style="width: 90%;"></div>
          </div>
          <div class="flex justify-between mt-3 px-1">
            <span class="text-[10px] font-bold uppercase text-outline tracking-wider">ステータス: 良好</span>
            <span class="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">残り: ¥20,000</span>
          </div>
        </div>
      </div>

      <!-- Category Card: Wants -->
      <div class="group">
        <div class="flex justify-between items-start mb-2 px-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-tertiary-fixed flex items-center justify-center">
              <span class="material-symbols-outlined text-tertiary">restaurant</span>
            </div>
            <div>
              <h3 class="font-bold text-on-surface font-headline">外食・レジャー</h3>
              <span class="text-xs text-tertiary">¥75,000 / ¥60,000</span>
            </div>
          </div>
          <button class="p-2 rounded-xl bg-surface-container-low hover:bg-tertiary-fixed transition-colors">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div class="bg-surface-container-low rounded-3xl p-4 transition-all duration-300 group-hover:bg-surface-container shadow-sm border border-tertiary-fixed">
          <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div class="h-full bg-tertiary rounded-full transition-all" style="width: 100%;"></div>
          </div>
          <div class="flex justify-between mt-3 px-1">
            <span class="text-[10px] font-bold uppercase text-tertiary tracking-wider">アラート: 予算超過</span>
            <span class="text-[10px] font-bold uppercase text-tertiary tracking-wider">-¥15,000</span>
          </div>
        </div>
      </div>

      <!-- Category Card: Savings -->
      <div class="group">
        <div class="flex justify-between items-start mb-2 px-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-primary-fixed flex items-center justify-center">
              <span class="material-symbols-outlined text-primary">savings</span>
            </div>
            <div>
              <h3 class="font-bold text-on-surface font-headline">将来の貯蓄</h3>
              <span class="text-xs text-on-surface-variant">¥0 / ¥80,000</span>
            </div>
          </div>
          <button class="p-2 rounded-xl bg-surface-container-low hover:bg-primary-fixed transition-colors">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <div class="bg-surface-container-low rounded-3xl p-4 transition-all duration-300 group-hover:bg-surface-container shadow-sm">
          <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div class="h-full bg-primary-container rounded-full" style="width: 0%;"></div>
          </div>
          <div class="flex justify-between mt-3 px-1">
            <span class="text-[10px] font-bold uppercase text-outline tracking-wider">ステータス: 未着手</span>
            <span class="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">目標: ¥80,000</span>
          </div>
        </div>
      </div>
    </section>

    <!-- New Category Action -->
    <button class="w-full mt-10 mb-6 flex items-center justify-center gap-3 py-5 rounded-full border-2 border-dashed border-outline-variant hover:bg-surface-container transition-all text-on-surface-variant font-bold shadow-sm active:scale-95">
      <span class="material-symbols-outlined">add</span>
      新しいカテゴリーを追加
    </button>
  </div>
</template>
