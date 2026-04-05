import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * GET /api/gmail/connect
 * Returns a Google OAuth URL for the user to authorize Gmail readonly access.
 * The client redirects the user to this URL.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`}/api/gmail/callback`

  if (!clientId) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    prompt: 'consent',
    // Pass userId in state so callback can save tokens to the right user
    state: (req.query.userId as string) || '',
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return res.status(200).json({ url })
}
