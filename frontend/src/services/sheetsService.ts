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

type DeletePayload = {
  symbol: string
  name: string
}

type RowsResponse = {
  rows: SheetInvestmentRow[]
}

async function getAuthContext() {
  const user = firebaseAuth.currentUser
  if (!user) {
    throw new Error('未ログインです。再ログインしてください。')
  }
  return {
    uid: user.uid,
  }
}

export async function appendInvestmentToSheet(payload: AppendPayload): Promise<void> {
  const { uid } = await getAuthContext()
  const response = await fetch('/api/gas/append', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      uid,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sheets append failed: ${response.status} ${text}`)
  }

  const json = await response.json() as { error?: string }
  if (json.error) {
    throw new Error(`Sheets append failed: ${json.error}`)
  }
}

export async function fetchInvestmentRowsFromSheet(): Promise<SheetInvestmentRow[]> {
  const { uid } = await getAuthContext()
  const params = new URLSearchParams({ uid })
  const response = await fetch(`/api/gas/rows?${params.toString()}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sheets fetch failed: ${response.status} ${text}`)
  }
  const json = (await response.json()) as RowsResponse
  if ((json as { error?: string }).error) {
    throw new Error(`Sheets fetch failed: ${(json as { error?: string }).error}`)
  }
  return json.rows ?? []
}

export async function deleteInvestmentFromSheet(payload: DeletePayload): Promise<void> {
  const { uid } = await getAuthContext()
  const response = await fetch('/api/gas/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid,
      symbol: payload.symbol,
      name: payload.name,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sheets delete failed: ${response.status} ${text}`)
  }

  const json = await response.json() as { error?: string }
  if (json.error) {
    throw new Error(`Sheets delete failed: ${json.error}`)
  }
}
