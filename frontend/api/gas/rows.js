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
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  try {
    const webAppUrl = requiredEnv('GAS_WEBAPP_URL')
    const secret = requiredEnv('GAS_SECRET')

    const uid = String(req.query?.uid ?? '').trim()
    const type = String(req.query?.type ?? 'all').trim()
    if (!uid) {
      return sendJson(res, 400, { error: 'uid_required' })
    }
    if (!['stock', 'fund', 'all'].includes(type)) {
      return sendJson(res, 400, { error: 'type_invalid' })
    }

    const query = new URLSearchParams({
      uid,
      type,
      secret,
    })
    const gasResponse = await fetch(`${webAppUrl}?${query.toString()}`)

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

    return sendJson(res, 200, {
      rows: Array.isArray(json?.rows) ? json.rows : [],
    })
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'unknown_error',
    })
  }
}
