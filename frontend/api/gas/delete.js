function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env: ${name}`)
  }
  return value
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  try {
    const webAppUrl = requiredEnv('GAS_WEBAPP_URL')
    const secret = requiredEnv('GAS_SECRET')

    const uid = String(req.body?.uid ?? '').trim()
    const symbol = String(req.body?.symbol ?? '').trim().toUpperCase()
    const name = String(req.body?.name ?? '').trim()

    if (!uid || !symbol || !name) {
      return sendJson(res, 400, { error: 'invalid_payload' })
    }

    const gasResponse = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'delete',
        uid,
        symbol,
        name,
        secret,
      }),
    })

    const text = await gasResponse.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }

    if (!gasResponse.ok || json?.error) {
      return sendJson(res, 502, {
        error: json?.error || `gas_error_${gasResponse.status}`,
        detail: json?.raw || text,
      })
    }

    return sendJson(res, 200, json)
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'unknown_error',
    })
  }
}
