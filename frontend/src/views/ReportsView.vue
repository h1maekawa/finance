<script setup lang="ts">
// レポート・分析
</script>

<template>
  <div class="space-y-8 pb-4">
    <!-- Month Selector Section -->
    <section class="flex items-center justify-between pt-4">
      <div>
        <span class="block font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">表示期間</span>
        <div class="flex items-center gap-2 group cursor-pointer">
          <h1 class="text-2xl font-bold text-on-surface tracking-tight font-headline">2023年 10月</h1>
          <span class="material-symbols-outlined text-primary group-hover:translate-y-1 transition-transform">expand_more</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-fixed transition-colors">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-fixed transition-colors">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>

    <!-- Spending Breakdown (Pie Chart Visual) -->
    <section class="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/10">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-on-surface font-headline">支出の内訳</h2>
          <p class="text-sm text-on-surface-variant font-body">主な支出項目の分析</p>
        </div>
        <div class="bg-secondary-fixed/30 text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">
          家計バランス: 良好
        </div>
      </div>
      
      <div class="flex flex-col md:flex-row items-center gap-8">
        <!-- Abstract Pie Chart Representation -->
        <div class="relative w-48 h-48 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle class="stroke-surface-container" stroke-width="3" fill="transparent" r="15.915" cx="18" cy="18"></circle>
            <!-- Survival (Primary Blue) -->
            <circle class="stroke-primary" stroke-width="3.5" stroke-dasharray="45 100" stroke-dashoffset="0" stroke-linecap="round" fill="transparent" r="15.915" cx="18" cy="18"></circle>
            <!-- Leisure (Secondary Green) -->
            <circle class="stroke-secondary" stroke-width="3.5" stroke-dasharray="25 100" stroke-dashoffset="-45" stroke-linecap="round" fill="transparent" r="15.915" cx="18" cy="18"></circle>
            <!-- Culture (Tertiary Red) -->
            <circle class="stroke-tertiary" stroke-width="3.5" stroke-dasharray="20 100" stroke-dashoffset="-70" stroke-linecap="round" fill="transparent" r="15.915" cx="18" cy="18"></circle>
            <!-- Others -->
            <circle class="stroke-surface-dim" stroke-width="3.5" stroke-dasharray="10 100" stroke-dashoffset="-90" stroke-linecap="round" fill="transparent" r="15.915" cx="18" cy="18"></circle>
          </svg>
          <div class="absolute text-center">
            <span class="block text-xs font-label uppercase tracking-widest text-on-surface-variant">合計</span>
            <span class="block text-xl font-extrabold text-on-surface font-headline">¥2,840</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex-1 space-y-4 w-full">
          <div class="flex justify-between items-center group">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-primary"></div>
              <span class="text-sm font-medium text-on-surface">固定費</span>
            </div>
            <span class="text-sm font-bold text-on-surface">45%</span>
          </div>
          <div class="flex justify-between items-center group">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-secondary"></div>
              <span class="text-sm font-medium text-on-surface">娯楽</span>
            </div>
            <span class="text-sm font-bold text-on-surface">25%</span>
          </div>
          <div class="flex justify-between items-center group">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-tertiary"></div>
              <span class="text-sm font-medium text-on-surface">自己投資</span>
            </div>
            <span class="text-sm font-bold text-on-surface">20%</span>
          </div>
          <div class="flex justify-between items-center group">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-surface-dim"></div>
              <span class="text-sm font-medium text-on-surface">その他</span>
            </div>
            <span class="text-sm font-bold text-on-surface">10%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Monthly Trend (Bar Chart Visual) -->
    <section class="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-on-surface font-headline">月次推移</h2>
          <p class="text-sm text-on-surface-variant font-body">過去6ヶ月の支出分析</p>
        </div>
        <div class="text-right">
          <span class="block text-[10px] uppercase font-label tracking-widest text-on-surface-variant">月平均</span>
          <span class="text-md font-bold text-primary">¥2,450</span>
        </div>
      </div>

      <!-- Chart Bars -->
      <div class="flex items-end justify-between h-40 gap-2 px-2">
        <div class="flex flex-col items-center flex-1 group">
          <div class="w-full bg-primary-fixed-dim/40 rounded-t-lg h-[60%] group-hover:bg-primary/20 transition-colors"></div>
          <span class="mt-3 text-[10px] font-semibold text-on-surface-variant uppercase">5月</span>
        </div>
        <div class="flex flex-col items-center flex-1 group">
          <div class="w-full bg-primary-fixed-dim/40 rounded-t-lg h-[75%] group-hover:bg-primary/20 transition-colors"></div>
          <span class="mt-3 text-[10px] font-semibold text-on-surface-variant uppercase">6月</span>
        </div>
        <div class="flex flex-col items-center flex-1 group">
          <div class="w-full bg-primary-fixed-dim/40 rounded-t-lg h-[50%] group-hover:bg-primary/20 transition-colors"></div>
          <span class="mt-3 text-[10px] font-semibold text-on-surface-variant uppercase">7月</span>
        </div>
        <div class="flex flex-col items-center flex-1 group">
          <div class="w-full bg-primary-fixed-dim/40 rounded-t-lg h-[90%] group-hover:bg-primary/20 transition-colors"></div>
          <span class="mt-3 text-[10px] font-semibold text-on-surface-variant uppercase">8月</span>
        </div>
        <div class="flex flex-col items-center flex-1 group">
          <div class="w-full bg-primary-fixed-dim/40 rounded-t-lg h-[65%] group-hover:bg-primary/20 transition-colors"></div>
          <span class="mt-3 text-[10px] font-semibold text-on-surface-variant uppercase">9月</span>
        </div>
        <!-- Highlighted Active Month -->
        <div class="flex flex-col items-center flex-1 group">
          <div class="w-full bg-gradient-to-t from-primary to-primary-container rounded-t-lg h-[82%] relative">
            <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] py-1 px-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ¥2,840
            </div>
          </div>
          <span class="mt-3 text-[10px] font-bold text-primary uppercase">10月</span>
        </div>
      </div>
    </section>

    <!-- Category Detail List -->
    <section class="space-y-4">
      <h2 class="text-lg font-bold tracking-tight text-on-surface font-headline">カテゴリー詳細</h2>
      <div class="space-y-3">
        <!-- Category Item 1 -->
        <div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary-fixed/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary-fixed-dim" style="font-variation-settings: 'FILL' 1;">restaurant</span>
            </div>
            <div>
              <p class="font-bold text-on-surface">食費・外食</p>
              <p class="text-xs text-on-surface-variant">12件の取引</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-on-surface">¥540.20</p>
            <p class="text-[10px] font-bold text-secondary flex items-center justify-end">
              <span class="material-symbols-outlined text-[12px]">arrow_drop_down</span>
              前月比 4%
            </p>
          </div>
        </div>
        
        <!-- Category Item 2 -->
        <div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-tertiary-fixed/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-tertiary" style="font-variation-settings: 'FILL' 1;">commute</span>
            </div>
            <div>
              <p class="font-bold text-on-surface">交通</p>
              <p class="text-xs text-on-surface-variant">8件の取引</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-on-surface">¥210.00</p>
            <p class="text-[10px] font-bold text-tertiary flex items-center justify-end">
              <span class="material-symbols-outlined text-[12px]">arrow_drop_up</span>
              前月比 12%
            </p>
          </div>
        </div>

        <!-- Category Item 3 -->
        <div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-secondary-fixed/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-on-secondary-container" style="font-variation-settings: 'FILL' 1;">movie</span>
            </div>
            <div>
              <p class="font-bold text-on-surface">エンタメ</p>
              <p class="text-xs text-on-surface-variant">4件の取引</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-on-surface">¥125.50</p>
            <p class="text-[10px] font-bold text-on-surface-variant">安定</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
