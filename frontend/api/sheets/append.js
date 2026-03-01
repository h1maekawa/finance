const { getSheetsApi, getSheetConfig } = require('./_client')
const { verifyFirebaseTokenFromRequest } = require('./_auth')

function sendJson(res, status, payload) {
  res.status(status).json(payload)
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  try {
    const decoded = await verifyFirebaseTokenFromRequest(req)
    const uid = String(decoded.uid || '')
    if (!uid) {
      return sendJson(res, 401, { error: 'unauthorized' })
    }

    const symbol = String(req.body?.symbol ?? '').trim().toUpperCase()
    const name = String(req.body?.name ?? '').trim()
    const quantity = Number(req.body?.quantity ?? 0)

    if (!symbol || !name || !Number.isFinite(quantity) || quantity < 0) {
      return sendJson(res, 400, { error: 'invalid_payload' })
    }

    const sheets = await getSheetsApi()
    const { spreadsheetId, sheetName } = getSheetConfig()

    // A列の最終行を取得して次行を決定
    const colA = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    })

    const currentRows = colA.data.values ?? []
    if (currentRows.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:F1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['銘柄コード', '銘柄名', '保有数', '現在価格', '評価額', 'uid']],
        },
      })
    }
    const nextRow = Math.max(2, currentRows.length + 1)

    const priceFormula = `=GOOGLEFINANCE(A${nextRow},"price")`
    const evalFormula = `=C${nextRow}*D${nextRow}`

    const append = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A${nextRow}:F${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[symbol, name, quantity, priceFormula, evalFormula, uid]],
      },
    })

    return sendJson(res, 200, {
      ok: true,
      updatedRange: append.data.updates?.updatedRange ?? null,
    })
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'unknown_error',
    })
  }
}
