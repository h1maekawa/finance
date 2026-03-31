import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. 有効なトークンを持つユーザーを取得 ( expires_at > now )
    const { data: tokens, error: tokensError } = await supabase
      .from('gmail_tokens')
      .select('user_id')
      .gt('expires_at', new Date().toISOString())

    if (tokensError) throw tokensError

    const results = []
    
    // 2. 各ユーザーのEdge Functionを並列/逐次で呼び出す
    for (const { user_id } of (tokens || [])) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/gmail-import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'x-user-id': user_id
          }
        })
        const result = await response.json()
        results.push({ user_id, status: response.ok ? 'success' : 'failed', result })
      } catch (e) {
        results.push({ user_id, status: 'error', error: e.message })
      }
    }

    return res.status(200).json({ processed: results.length, details: results })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
