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

function requiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} が未設定です。`)
  }
  return value
}

async function getAuthContext() {
  const user = firebaseAuth.currentUser
  if (!user) {
    throw new Error('未ログインです。再ログインしてください。')
  }
  return {
    uid: user.uid,
    webAppUrl: requiredEnv('VITE_GAS_WEBAPP_URL', import.meta.env.VITE_GAS_WEBAPP_URL),
    secret: requiredEnv('VITE_GAS_SECRET', import.meta.env.VITE_GAS_SECRET),
  }
}

export async function appendInvestmentToSheet(payload: AppendPayload): Promise<void> {
  const { uid, webAppUrl, secret } = await getAuthContext()
  const response = await fetch(webAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      ...payload,
      uid,
      secret,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GAS append failed: ${response.status} ${text}`)
  }

  const json = await response.json() as { error?: string }
  if (json.error) {
    throw new Error(`GAS append failed: ${json.error}`)
  }
}

export async function fetchInvestmentRowsFromSheet(): Promise<SheetInvestmentRow[]> {
  const { uid, webAppUrl, secret } = await getAuthContext()
  const params = new URLSearchParams({ uid, secret })
  const response = await fetch(`${webAppUrl}?${params.toString()}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GAS fetch failed: ${response.status} ${text}`)
  }
  const json = (await response.json()) as RowsResponse
  if ((json as { error?: string }).error) {
    throw new Error(`GAS fetch failed: ${(json as { error?: string }).error}`)
  }
  return json.rows ?? []
}
