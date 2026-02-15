import { computed } from 'vue'
import type { Transaction } from '@/types/db'

type Point = { label: string; income: number; expense: number }

export function useMonthlySummary(
  transactions: () => Transaction[],
  categoryNameById?: (categoryId: string) => string,
) {
  const pieData = computed(() => {
    const map = new Map<string, number>()

    for (const tx of transactions()) {
      if (tx.kind !== 'expense') continue
      const key = categoryNameById ? categoryNameById(tx.category_id) : tx.category_id
      map.set(key, (map.get(key) ?? 0) + Number(tx.amount))
    }

    return {
      labels: Array.from(map.keys()),
      datasets: [
        {
          data: Array.from(map.values()),
          backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
        },
      ],
    }
  })

  const barData = computed(() => {
    const monthMap = new Map<string, Point>()

    for (const tx of transactions()) {
      const month = tx.transaction_date.slice(0, 7)
      const existing = monthMap.get(month) ?? { label: month, income: 0, expense: 0 }
      if (tx.kind === 'income') existing.income += Number(tx.amount)
      if (tx.kind === 'expense') existing.expense += Number(tx.amount)
      monthMap.set(month, existing)
    }

    const rows = Array.from(monthMap.values()).sort((a, b) => a.label.localeCompare(b.label))

    return {
      labels: rows.map((r) => r.label),
      datasets: [
        { label: '収入', data: rows.map((r) => r.income), backgroundColor: '#16a34a' },
        { label: '支出', data: rows.map((r) => r.expense), backgroundColor: '#dc2626' },
      ],
    }
  })

  return {
    pieData,
    barData,
  }
}
