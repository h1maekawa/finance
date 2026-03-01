import { firebaseAuth } from '@/lib/firebase'

export type SheetInvestmentRow = {
  symbol: string
  name: string
  quantity: number
  currentPrice: number
  evaluationAmount: number
}

type AppendPayload = {
  symbol: string
  name: string
  quantity: number
}

type RowsResponse = {
  rows: SheetInvestmentRow[]
}

async function buildAuthHeaders() {
  const token = await firebaseAuth.currentUser?.getIdToken(false)
  if (!token) {
    throw new Error('認証トークンを取得できません。再ログインしてください。')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function appendInvestmentToSheet(payload: AppendPayload): Promise<void> {
  const authHeaders = await buildAuthHeaders()
  const response = await fetch('/api/sheets/append', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sheets append failed: ${response.status} ${text}`)
  }
}

export async function fetchInvestmentRowsFromSheet(): Promise<SheetInvestmentRow[]> {
  const authHeaders = await buildAuthHeaders()
  const response = await fetch('/api/sheets/rows', {
    headers: authHeaders,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sheets fetch failed: ${response.status} ${text}`)
  }
  const json = (await response.json()) as RowsResponse
  return json.rows ?? []
}
