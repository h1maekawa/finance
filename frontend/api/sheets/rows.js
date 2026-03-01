const { getSheetsApi, getSheetConfig } = require('./_client')
const { verifyFirebaseTokenFromRequest } = require('./_auth')

function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  try {
    const decoded = await verifyFirebaseTokenFromRequest(req)
    const uid = String(decoded.uid || '')
    if (!uid) {
      return sendJson(res, 401, { error: 'unauthorized' })
    }

    const sheets = await getSheetsApi()
    const { spreadsheetId, sheetName } = getSheetConfig()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:F`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    })

    const rows = (response.data.values ?? [])
      .filter((row) => String(row[5] ?? '') === uid)
      .map((row) => ({
        symbol: String(row[0] ?? ''),
        name: String(row[1] ?? ''),
        quantity: Number(row[2] ?? 0),
        currentPrice: Number(row[3] ?? 0),
        evaluationAmount: Number(row[4] ?? 0),
      }))

    return sendJson(res, 200, { rows })
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'unknown_error',
    })
  }
}
