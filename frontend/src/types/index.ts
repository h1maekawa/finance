import type { Timestamp } from 'firebase/firestore'

export type TransactionKind = 'income' | 'expense'

export interface Transaction {
  id: string
  kind: TransactionKind
  amount: number
  category: string
  date: string // YYYY-MM-DD
  note: string | null
  createdAt: Timestamp
  externalId?: string | null
  paymentMethod?: string | null
  cardType?: string | null
}

export interface TransactionInput {
  kind: TransactionKind
  amount: number
  category: string
  date: string
  note: string | null
  externalId?: string | null
  paymentMethod?: string | null
  cardType?: string | null
}

export interface Category {
  id: string
  name: string
  kind: TransactionKind
  icon: string
  order: number
}

export interface CategoryInput {
  name: string
  kind: TransactionKind
  icon: string
  order: number
}

export interface MonthlySummary {
  income: number
  expense: number
  balance: number
}
