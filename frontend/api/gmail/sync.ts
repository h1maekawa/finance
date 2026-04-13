import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '../lib/auth'
import { parseEmailBody } from '../lib/parser'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  let userId: string | null = null

  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    userId = (req.query.userId as string) || null
    if (!userId) {
      return res.status(400).json({ error: 'userId query param required for cron calls' })
    }
  } else {
    try {
      const payload = await authenticateRequest(authHeader)
      userId = payload.sub as string
    } catch (err: any) {
      console.error('Auth error:', err.message)
      return res.status(401).json({ error: err.message || 'Unauthorized' })
    }
  }

  // Fetch Sync Filters for this user
  const { data: filters } = await supabase
    .from('gmail_sync_filters')
    .select('sender_email, subject_filter')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Fetch Gmail token
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('gmail_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (tokenErr || !tokenRow) {
    return res.status(404).json({ error: 'Gmail token not found.' })
  }

  let accessToken = tokenRow.access_token
  const expired = new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000
  if (expired && tokenRow.refresh_token) {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token)
    accessToken = refreshed.access_token
    await supabase.from('gmail_tokens').update({
      access_token: accessToken,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('user_id', userId)
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single()

  if (!member) return res.status(404).json({ error: 'No household found' })
  const householdId = member.household_id

  // Build Gmail Search Query
  let query = ''
  if (filters && filters.length > 0) {
    query = filters.map(f => {
      let q = `from:${f.sender_email}`
      if (f.subject_filter) q += ` subject:${f.subject_filter}`
      return `(${q})`
    }).join(' OR ')
  } else {
    // Legacy fallback
    query = '(from:statement@vpass.ne.jp subject:ご利用のお知らせ) OR (from:info@mail.rakuten-card.co.jp subject:カード利用のお知らせ)'
  }
  query += ' newer_than:7d'

  const msgRes = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const msgJson = await msgRes.json() as { messages?: { id: string }[] }

  if (!msgJson.messages?.length) {
    return res.status(200).json({ count: 0, results: [] })
  }

  const { data: defaultCat } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('name', '食費') // Changed default to '食費' as it's common for store notifications
    .single()

  const results: any[] = []
  for (const msg of msgJson.messages) {
    try {
      const { data: existing } = await supabase
        .from('email_import_logs')
        .select('id, status')
        .eq('gmail_message_id', msg.id)
        .maybeSingle()
      
      if (existing && existing.status === 'imported') continue

      const detailRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const detail = await detailRes.json() as any
      const subject = detail.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || ''
      let body = ''
      if (detail.payload?.parts) {
        body = detail.payload.parts
          .map((p: any) => (p.body?.data ? Buffer.from(p.body.data, 'base64url').toString('utf-8') : ''))
          .join('')
      } else if (detail.payload?.body?.data) {
        body = Buffer.from(detail.payload.body.data, 'base64url').toString('utf-8')
      }

      const parsed = parseEmailBody(subject, body)

      if (!parsed) {
        await supabase.from('email_import_logs').upsert({
          household_id: householdId,
          user_id: userId,
          gmail_message_id: msg.id,
          card_type: 'unknown',
          transaction_date: new Date().toISOString().split('T')[0],
          store_name: '解析失敗',
          amount: 0,
          status: 'error',
          raw_subject: subject
        }, { onConflict: 'gmail_message_id' })
        continue
      }

      // De-duplicate check
      const { data: duplicateTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('household_id', householdId)
        .eq('amount', parsed.amount)
        .eq('transaction_date', parsed.date.split(' ')[0])
        .ilike('note', `%${parsed.merchant}%`)
        .maybeSingle()

      if (duplicateTx) {
          await supabase.from('email_import_logs').upsert({
            household_id: householdId,
            user_id: userId,
            gmail_message_id: msg.id,
            card_type: parsed.card_type,
            transaction_date: parsed.date.split(' ')[0],
            store_name: parsed.merchant,
            amount: parsed.amount,
            status: 'skipped',
            raw_subject: subject
          }, { onConflict: 'gmail_message_id' })
          continue
      }

      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .insert({
          household_id: householdId,
          user_id: userId,
          category_id: defaultCat?.id || null,
          kind: 'expense',
          amount: parsed.amount,
          transaction_date: parsed.date.split(' ')[0],
          note: `[Auto] ${parsed.merchant}`,
        })
        .select()
        .single()

      if (!txErr) {
        await supabase.from('email_import_logs').upsert({
          household_id: householdId,
          user_id: userId,
          gmail_message_id: msg.id,
          card_type: parsed.card_type,
          transaction_date: parsed.date.split(' ')[0],
          store_name: parsed.merchant,
          amount: parsed.amount,
          category_id: defaultCat?.id || null,
          transaction_id: txData.id,
          status: 'imported',
          raw_subject: subject
        }, { onConflict: 'gmail_message_id' })
        results.push({ id: msg.id, status: 'success' })
      }
    } catch (e) {
      console.error(`Error processing ${msg.id}:`, e)
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
