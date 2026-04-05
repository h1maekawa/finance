import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

/**
 * GET /api/gmail/callback
 * OAuth2 callback. Exchanges code for tokens and stores refresh_token in Supabase.
 * Redirects back to /gmail-import on success.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: userId, error: oauthError } = req.query

  if (oauthError) {
    return res.redirect(302, `/gmail-import?error=${encodeURIComponent(String(oauthError))}`)
  }

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or state (userId)' })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`}/api/gmail/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(code),
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json() as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  }

  if (tokens.error || !tokens.access_token) {
    return res.redirect(302, `/gmail-import?error=token_exchange_failed`)
  }

  // Upsert token in Supabase (service role bypasses RLS)
  const { error: dbError } = await supabase.from('gmail_tokens').upsert({
    user_id: String(userId),
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    token_type: 'google',
    scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
  }, { onConflict: 'user_id' })

  if (dbError) {
    console.error('Failed to save gmail token:', dbError)
    return res.redirect(302, `/gmail-import?error=db_error`)
  }

  return res.redirect(302, '/gmail-import?connected=1')
}
