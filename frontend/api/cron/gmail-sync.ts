import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/**
 * POST /api/cron/gmail-sync
 * Scheduled by Vercel Crons (vercel.json). 
 * Iterates all users with valid gmail_tokens and calls /api/gmail/sync for each.
 * 
 * Authorization: Bearer {CRON_SECRET}
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Crons call with GET; also allow POST for manual triggers
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Fetch all users with non-expired Gmail tokens
  const { data: tokens, error } = await supabase
    .from('gmail_tokens')
    .select('user_id')
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Failed to fetch gmail_tokens:', error)
    return res.status(500).json({ error: error.message })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`
  const results: any[] = []

  for (const { user_id } of tokens || []) {
    try {
      const syncRes = await fetch(`${baseUrl}/api/gmail/sync?userId=${user_id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      })
      const json = await syncRes.json()
      results.push({ user_id, status: syncRes.ok ? 'success' : 'failed', ...json })
    } catch (e: any) {
      results.push({ user_id, status: 'error', error: e.message })
    }
  }

  return res.status(200).json({ processed: results.length, results })
}
