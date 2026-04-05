import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/**
 * GET /api/fetch/dashboard
 * Returns aggregated monthly summary for the given userId.
 * Requires Firebase ID token in Authorization header.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }

  // Extract Firebase UID from JWT sub claim
  let userId: string
  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    userId = payload.sub
    if (!userId) throw new Error('No sub')
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Resolve household
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single()

  if (!member) {
    return res.status(404).json({ error: 'Household not found' })
  }

  const householdId = member.household_id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)

  // Monthly transactions
  const { data: txs } = await supabase
    .from('transactions')
    .select('kind, amount, category_id')
    .eq('household_id', householdId)
    .gte('transaction_date', monthStart)
    .lt('transaction_date', monthEnd)

  const income = (txs || []).filter(t => t.kind === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = (txs || []).filter(t => t.kind === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  // Bank balances
  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('balance')
    .eq('household_id', householdId)

  const totalBalance = (accounts || []).reduce((s, a) => s + Number(a.balance), 0)

  // Category breakdown for expenses
  const catMap = new Map<string, number>()
  for (const tx of (txs || []).filter(t => t.kind === 'expense')) {
    catMap.set(tx.category_id, (catMap.get(tx.category_id) || 0) + Number(tx.amount))
  }
  const categoryBreakdown = [...catMap.entries()].map(([catId, amount]) => ({ catId, amount }))

  return res.status(200).json({
    month: monthStart.slice(0, 7),
    income,
    expense,
    balance: income - expense,
    totalBalance,
    categoryBreakdown,
  })
}
