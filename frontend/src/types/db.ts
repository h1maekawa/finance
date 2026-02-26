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

export type BankAccount = {
  id: string
  household_id: string
  institution_name: string
  balance: number
  sort_order: number
}

export type InvestmentAsset = {
  id: string
  household_id: string
  asset_type: string
  name: string
  amount: number
  ticker: string | null
  quantity: number
  avg_cost: number | null
  take_profit_price: number | null
  notify_take_profit: boolean
  last_notified_at: string | null
  sort_order: number
}

export type UserNotificationChannel = {
  id: string
  user_id: string
  provider: 'line'
  line_user_id: string
  is_active: boolean
}

export type Stock = {
  id: string
  user_id: string
  symbol: string
  account_type: string
  shares: number
  average_price: number
  current_price: number
  evaluation_amount: number
  profit_loss: number
  profit_loss_rate: number
  updated_at: string
}
