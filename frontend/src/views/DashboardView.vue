<script setup lang="ts">
// ダッシュボード更新版
</script>

<template>
  <div class="space-y-8 pb-4">
    <!-- Welcome Section -->
    <section class="space-y-1">
      <p class="font-label text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest leading-none">おはようございます、サラさん</p>
      <h1 class="text-3xl font-extrabold tracking-tight text-on-surface font-headline">家計の概況</h1>
    </section>

    <!-- Bento Grid Main Content -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Summary Card (Editorial Style) -->
      <div class="bg-surface-container-lowest rounded-[2rem] p-8 space-y-8 transition-all duration-300 shadow-sm border border-outline-variant/10">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <p class="font-label text-[11px] text-on-surface-variant font-medium">今月の残高</p>
            <p class="text-4xl font-extrabold text-primary tracking-tighter leading-none">¥428,050</p>
          </div>
          <div class="bg-secondary-fixed text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-bold">+12%</div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-surface-container-low p-5 rounded-2xl space-y-2">
            <div class="flex items-center gap-2 text-secondary">
              <span class="material-symbols-outlined text-[18px]">arrow_downward</span>
              <span class="text-[11px] font-bold uppercase tracking-wider font-label">収入</span>
            </div>
            <p class="text-xl font-bold text-on-surface">¥750,000</p>
          </div>
          <div class="bg-surface-container-low p-5 rounded-2xl space-y-2">
            <div class="flex items-center gap-2 text-tertiary">
              <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
              <span class="text-[11px] font-bold uppercase tracking-wider font-label">支出</span>
            </div>
            <p class="text-xl font-bold text-on-surface">¥321,900</p>
          </div>
        </div>
      </div>

      <!-- Budget Progress Ring Card -->
      <div class="bg-surface-container-lowest rounded-[2rem] p-8 flex flex-col items-center justify-center space-y-6 shadow-sm border border-outline-variant/10">
        <div class="relative w-40 h-40">
          <svg class="w-full h-full transform -rotate-90">
            <circle class="text-surface-container-high" stroke-width="12" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80"></circle>
            <circle class="text-primary transition-all duration-1000 ease-out" stroke-width="12" stroke-dasharray="440" stroke-dashoffset="154" stroke-linecap="round" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80"></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-extrabold text-on-surface">65%</span>
            <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">使用済み</span>
          </div>
        </div>
        <div class="text-center space-y-1">
          <h3 class="font-bold text-lg font-headline">今月の予算</h3>
          <p class="text-on-surface-variant text-sm font-body">残り12日間で、あと <span class="text-primary font-bold">¥178,100</span> 使えます。</p>
        </div>
      </div>
    </div>

    <!-- Recent Transactions Section -->
    <section class="space-y-6">
      <div class="flex justify-between items-end">
        <h2 class="text-2xl font-bold tracking-tight font-headline">最近の取引</h2>
        <button class="text-primary font-bold text-sm hover:underline transition-all">すべて見る</button>
      </div>

      <div class="space-y-4">
        <!-- Transaction 1 -->
        <div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-sm border border-outline-variant/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary-fixed flex items-center justify-center rounded-2xl">
              <span class="material-symbols-outlined text-on-primary-fixed-variant" style="font-variation-settings: 'FILL' 1;">restaurant</span>
            </div>
            <div>
              <p class="font-bold text-on-surface">ライフ（スーパー）</p>
              <p class="text-xs text-on-surface-variant font-medium">食費・日用品 • 今日</p>
            </div>
          </div>
          <p class="font-bold text-tertiary">-¥8,420</p>
        </div>

        <!-- Transaction 2 -->
        <div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-sm border border-outline-variant/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-secondary-container flex items-center justify-center rounded-2xl">
              <span class="material-symbols-outlined text-on-secondary-container" style="font-variation-settings: 'FILL' 1;">home</span>
            </div>
            <div>
              <p class="font-bold text-on-surface">メトロポリス住宅管理</p>
              <p class="text-xs text-on-surface-variant font-medium">家賃・光熱費 • 10月1日</p>
            </div>
          </div>
          <p class="font-bold text-tertiary">-¥180,000</p>
        </div>

        <!-- Transaction 3 -->
        <div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-sm border border-outline-variant/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-tertiary-fixed flex items-center justify-center rounded-2xl">
              <span class="material-symbols-outlined text-on-tertiary-fixed-variant" style="font-variation-settings: 'FILL' 1;">movie</span>
            </div>
            <div>
              <p class="font-bold text-on-surface">Netflix サブスクリプション</p>
              <p class="text-xs text-on-surface-variant font-medium">エンタメ • 9月28日</p>
            </div>
          </div>
          <p class="font-bold text-tertiary">-¥1,599</p>
        </div>
      </div>
    </section>

    <!-- Floating Action Button (Quick Add) -->
    <router-link to="/entry" class="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-[0_8px_24px_rgba(25,28,29,0.2)] flex items-center justify-center z-40 active:scale-95 transition-transform duration-200">
      <span class="material-symbols-outlined text-3xl">add</span>
    </router-link>
  </div>
</template>
