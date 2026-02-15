export type TransactionKind = 'income' | 'expense'

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  default_household_id: string | null
}

export type Household = {
  id: string
  name: string
  owner_user_id: string
}

export type Category = {
  id: string
  household_id: string
  name: string
  kind: TransactionKind
  color: string | null
  icon: string | null
  sort_order: number
}

export type Transaction = {
  id: string
  household_id: string
  user_id: string
  category_id: string
  kind: TransactionKind
  amount: number
  transaction_date: string
  note: string | null
}
