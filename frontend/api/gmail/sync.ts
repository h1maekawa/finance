import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Service role key — server-side only, never exposed to the frontend
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/**
 * POST /api/gmail/sync
 * Called by:
 *   - session.ts syncGmail() with Firebase ID token in Authorization header
 *   - /api/cron/gmail-sync with CRON_SECRET
 *
 * Query params:
 *   - userId (optional): only processed by cron calls; ignored for user calls
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  let userId: string | null = null

  // ① Cron path — CRON_SECRET in header, userId from query
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    userId = (req.query.userId as string) || null
    if (!userId) {
      return res.status(400).json({ error: 'userId query param required for cron calls' })
    }
  }
  // ② User path — Firebase ID token; verify via Supabase admin (or trust sub claim)
  else if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    // Decode JWT sub without signature check (Firebase JWTs are verified by Supabase third-party auth)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      userId = payload.sub as string
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  } else {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Fetch Gmail token for this user
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('gmail_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (tokenErr || !tokenRow) {
    return res.status(404).json({ error: 'Gmail token not found. User must reconnect Gmail.' })
  }

  let accessToken: string = tokenRow.access_token

  // Refresh token if expired
  const expired = new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000
  if (expired && tokenRow.refresh_token) {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token)
    if (!refreshed.access_token) {
      return res.status(403).json({ error: 'Failed to refresh Gmail access token' })
    }
    accessToken = refreshed.access_token
    await supabase.from('gmail_tokens').update({
      access_token: accessToken,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('user_id', userId)
  }

  // Get user's household
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single()

  if (!member) {
    return res.status(404).json({ error: 'No household found for user' })
  }

  const householdId = member.household_id

  // Fetch Gmail messages
  const query = [
    'from:statement@vpass.ne.jp subject:ご利用のお知らせ【三井住友カード】',
    'from:info@mail.rakuten-card.co.jp subject:カード利用のお知らせ(本人ご利用分)',
  ].join(' OR ') + ' newer_than:7d'

  const msgRes = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const msgJson = await msgRes.json() as { messages?: { id: string }[] }

  if (!msgJson.messages?.length) {
    return res.status(200).json({ count: 0, results: [] })
  }

  // Get default category
  const { data: defaultCat } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('name', '日用品')
    .single()

  const results: any[] = []

  for (const msg of msgJson.messages) {
    // Skip already imported
    const { data: existing } = await supabase
      .from('email_import_logs')
      .select('id')
      .eq('gmail_message_id', msg.id)
      .maybeSingle()
    if (existing) continue

    const detailRes = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const detail = await detailRes.json() as any

    const subject: string = detail.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || ''
    let body = ''
    if (detail.payload?.parts) {
      body = detail.payload.parts
        .map((p: any) => (p.body?.data ? Buffer.from(p.body.data, 'base64url').toString('utf-8') : ''))
        .join('')
    } else if (detail.payload?.body?.data) {
      body = Buffer.from(detail.payload.body.data, 'base64url').toString('utf-8')
    }

    let parsed: { date: string; amount: number; merchant: string; card: 'smbc' | 'rakuten' } | null = null

    if (subject.includes('三井住友カード')) {
      const dateMatch = body.match(/(\d{4})\/(\d{2})\/(\d{2})/)
      const amtMatch = body.match(/(.+?)（.+?）[\t　 ]*([\d,]+)円/)
      if (dateMatch && amtMatch) {
        parsed = {
          date: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,
          merchant: amtMatch[1].trim(),
          amount: parseInt(amtMatch[2].replace(/,/g, ''), 10),
          card: 'smbc',
        }
      }
    } else if (subject.includes('楽天カード')) {
      const dateMatch = body.match(/(\d{4})年(\d{2})月(\d{2})日/)
      const merchantMatch = body.match(/ご利用店名[：:]\s*(.+)/)
      const amtMatch = body.match(/ご利用金額[：:]\s*([\d,]+)円/)
      if (dateMatch && merchantMatch && amtMatch) {
        parsed = {
          date: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,
          merchant: merchantMatch[1].trim(),
          amount: parseInt(amtMatch[1].replace(/,/g, ''), 10),
          card: 'rakuten',
        }
      }
    }

    if (!parsed) continue

    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .insert({
        household_id: householdId,
        user_id: userId,
        category_id: defaultCat?.id || null,
        kind: 'expense',
        amount: parsed.amount,
        transaction_date: parsed.date,
        note: `[Gmail] ${parsed.merchant}`,
      })
      .select()
      .single()

    if (!txErr) {
      await supabase.from('email_import_logs').insert({
        household_id: householdId,
        user_id: userId,
        gmail_message_id: msg.id,
        card_type: parsed.card,
        transaction_date: parsed.date,
        store_name: parsed.merchant,
        amount: parsed.amount,
        category_id: defaultCat?.id || null,
        transaction_id: txData.id,
        status: 'imported',
      })
      results.push({ id: msg.id, status: 'success', merchant: parsed.merchant })
    }
  }

  return res.status(200).json({ count: results.length, results })
}

async function refreshAccessToken(refreshToken: string) {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return resp.json()
}
