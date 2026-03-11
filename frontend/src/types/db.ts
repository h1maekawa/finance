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
  credit_card_id: string | null
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

export type CreditCard = {
  id: string
  household_id: string
  card_name: string
  brand: string | null
  last4: string | null
  sort_order: number
  is_active: boolean
}

export type Stock = {
  id: string
  user_id: string
  symbol: string
  type: 'stock' | 'fund'
  name: string
  account_type: string
  quantity: number
  average_price: number
  current_price: number
  evaluation_amount: number
  profit_loss: number
  profit_loss_rate: number
  updated_at: string
}

export type SecuritiesAccount = {
  id: string
  household_id: string
  broker_name: string
  account_name: string
  tax_category: 'nisa_growth' | 'nisa_tsumitate' | 'specified' | 'general'
  is_active: boolean
  sort_order: number
}

export type MonthlySnapshot = {
  id: string
  household_id: string
  target_month: string
  income_total: number
  expense_total: number
  net_total: number
  month_end_assets: number
  memo: string | null
  created_at: string
  updated_at: string
}

export type EmailImportLog = {
  id: string
  household_id: string
  user_id: string
  gmail_message_id: string
  card_type: 'smbc' | 'rakuten'
  transaction_date: string
  store_name: string
  amount: number
  category_id: string | null
  credit_card_id: string | null
  transaction_id: string | null
  status: 'imported' | 'skipped' | 'error'
  raw_subject: string | null
  imported_at: string
}
