import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authenticateRequest } from '../lib/auth'

/**
 * GAS Proxy Backend (TypeSafe & Authenticated)
 * Forwards requests to Google Apps Script Web App securely,
 * injecting the GAS_SECRET.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const gasUrl = process.env.GAS_WEBAPP_URL
  const gasSecret = process.env.GAS_SECRET

  if (!gasUrl || !gasSecret) {
    return res.status(500).json({ error: 'GAS configuration missing in environment' })
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // --- SECURITY: Authenticate the caller ---
  try {
    const authHeader = req.headers.authorization
    await authenticateRequest(authHeader)
    // If we reach here, the token is valid.
  } catch (error: any) {
    console.warn('Unauthorized GAS Proxy access attempt:', error.message)
    return res.status(401).json({ error: 'Unauthorized: Valid login required' })
  }

  try {
    if (req.method === 'POST') {
      const body = { 
        ...req.body, 
        secret: gasSecret 
      }

      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const text = await response.text()
      try {
        const json = JSON.parse(text)
        return res.status(response.status).json(json)
      } catch {
        return res.status(response.status).send(text)
      }
    } else if (req.method === 'GET') {
      const query = new URLSearchParams(req.query as Record<string, string>)
      query.set('secret', gasSecret)

      const response = await fetch(`${gasUrl}?${query.toString()}`)
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        return res.status(response.status).json(json)
      } catch {
        return res.status(response.status).send(text)
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('GAS Proxy Error:', error)
    return res.status(500).json({ error: 'Proxy communication failed', detail: error.message })
  }
}
