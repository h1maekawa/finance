const SPREADSHEET_ID = '1Krlbt8jRRgumdn2-RNcjR4MraneVUByUFnwE6BN4yfk'

const STOCK_SHEET_NAME = 'stocks'
const FUND_SHEET_NAME = 'funds'
const APP_SECRET = 'YOUR_LONG_RANDOM_SECRET'
const CARD_IMPORT_UID = 'system'
const TARGET_YEAR_MONTH = '2026-03'
const EXPENSE_HEADERS = ['日時', '金額', '店舗', 'カテゴリ', '支払手段', 'source', 'messageId', 'uid', 'dedupeKey', '作成日時']
const EXPENSE_SHEET_NAMES = {
  rakuten: '個別投資_楽天',
  mitsui: '個別投資_三井住友',
  cash: '個別投資_現金',
  paypay: '個別投資_PayPay'
}

// カード通知を同じスプレッドシート内の別タブに保存
const CARD_SHEET_CONFIGS = [
  {
    cardName: '楽天',
    labelName: '楽天カード',
    from: 'info@mail.rakuten-card.co.jp',
    paymentMethod: 'rakuten',
    sheetName: EXPENSE_SHEET_NAMES.rakuten
  },
  {
    cardName: '三井住友オリーブ',
    labelName: '三井住友オリーブ',
    from: 'statement@vpass.ne.jp',
    paymentMethod: 'mitsui',
    sheetName: EXPENSE_SHEET_NAMES.mitsui
  }
]
const CARD_PROCESSED_LOG_SHEET = '_processed_ids_cards'

// stocks: A..K
// A:銘柄コード B:銘柄名 C:保有株数 D:取得単価 E:現在値 F:前日比 G:前日比(%) H:評価額 I:評価損益 J:評価損益(%) K:uid
// funds:  A..G
// A:銘柄コード B:銘柄名 C:保有口数 D:平均取得価額 E:現在値(手動) F:評価額(手動) G:uid

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID)
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_()
  const sh = ss.getSheetByName(name) || ss.insertSheet(name)
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
  }
  return sh
}

function getStockSheet_() {
  return getOrCreateSheet_(STOCK_SHEET_NAME, [
    '銘柄コード', '銘柄名', '保有株数', '取得単価(平均取得価格)', '現在値', '前日比', '前日比（%）', '評価額', '評価損益', '評価損益(%)', 'uid'
  ])
}

function getFundSheet_() {
  return getOrCreateSheet_(FUND_SHEET_NAME, [
    '銘柄コード', '銘柄名', '保有口数', '平均取得価額', '現在値', '評価額', 'uid'
  ])
}

function getExpenseSheetByMethod_(paymentMethod) {
  const normalized = normalizePaymentMethod_(paymentMethod)
  const sheetName = EXPENSE_SHEET_NAMES[normalized]
  if (!sheetName) return null
  return getOrCreateSheet_(sheetName, EXPENSE_HEADERS)
}

function setStockFormulas_(sh, row) {
  sh.getRange(row, 5).setFormula(`=GOOGLEFINANCE(A${row},"price")*GOOGLEFINANCE("CURRENCY:USDJPY")`)
  sh.getRange(row, 6).setFormula(`=GOOGLEFINANCE(A${row},"change")*GOOGLEFINANCE("CURRENCY:USDJPY")`)
  sh.getRange(row, 7).setFormula(`=GOOGLEFINANCE(A${row},"changepct")/100`)
  sh.getRange(row, 8).setFormula(`=C${row}*E${row}`)
  sh.getRange(row, 9).setFormula(`=H${row}-(C${row}*D${row})`)
  sh.getRange(row, 10).setFormula(`=IFERROR(I${row}/(C${row}*D${row}),0)`)
}

function parseBody_(e) {
  try {
    return JSON.parse(e.postData?.contents || '{}')
  } catch {
    return {}
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e)
    if (String(body.secret || '') !== APP_SECRET) return json({ error: 'unauthorized' })

    const action = String(body.action || 'append')
    const type = String(body.type || '')
    const uid = String(body.uid || '').trim()
    if (!uid) return json({ error: 'uid_required' })

    if (action === 'delete') {
      if (!['stock', 'fund', 'expense'].includes(type)) return json({ error: 'type_invalid' })

      if (type === 'expense') {
        const paymentMethod = normalizePaymentMethod_(String(body.paymentMethod || ''))
        const dedupeKey = String(body.dedupeKey || '').trim()
        const sh = getExpenseSheetByMethod_(paymentMethod)
        if (!sh) return json({ error: 'payment_method_invalid' })

        const values = sh.getDataRange().getValues()
        let deleted = 0
        for (let r = values.length; r >= 2; r -= 1) {
          const row = values[r - 1]
          const rowUid = String(row[7] || '').trim()
          const rowDedupeKey = String(row[8] || '').trim()
          if (rowUid === uid && dedupeKey && rowDedupeKey === dedupeKey) {
            sh.deleteRow(r)
            deleted += 1
            break
          }
        }

        return json({ ok: true, deleted })
      }

      const symbol = String(body.symbol || '').trim().toUpperCase()
      const name = String(body.name || '').trim()
      if (!symbol || !name) return json({ error: 'invalid_payload' })

      const sh = type === 'stock' ? getStockSheet_() : getFundSheet_()
      const values = sh.getDataRange().getValues()
      let deleted = 0

      for (let r = values.length; r >= 2; r -= 1) {
        const row = values[r - 1]
        const rowSymbol = String(row[0] || '').trim().toUpperCase()
        const rowName = String(row[1] || '').trim()
        const rowUid = String((type === 'stock' ? row[10] : row[6]) || '').trim()
        if (rowUid === uid && rowSymbol === symbol && rowName === name) {
          sh.deleteRow(r)
          deleted += 1
          break
        }
      }

      return json({ ok: true, deleted })
    }

    if (!['stock', 'fund', 'expense'].includes(type)) return json({ error: 'type_invalid' })

    if (type === 'expense') {
      const paymentMethod = normalizePaymentMethod_(String(body.paymentMethod || ''))
      const sh = getExpenseSheetByMethod_(paymentMethod)
      if (!sh) return json({ error: 'payment_method_invalid' })

      const date = String(body.date || '').trim() || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
      const amount = Number(body.amount || 0)
      const store = String(body.store || '').trim() || ''
      const category = String(body.category || '').trim() || ''
      const source = String(body.source || 'manual').trim() || 'manual'
      const messageId = String(body.messageId || '').trim()
      const externalKey = String(body.externalKey || '').trim()
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'invalid_payload' })

      const dedupeKey = externalKey || buildExpenseDedupeKey_(uid, paymentMethod, source, messageId, date, amount, store, category)
      if (hasExpenseDedupeKey_(sh, dedupeKey)) {
        return json({ ok: true, duplicated: true, type, paymentMethod, dedupeKey })
      }

      const row = sh.getLastRow() + 1
      sh.getRange(row, 1, 1, 10).setValues([[
        date,
        amount,
        store,
        category,
        paymentMethod,
        source,
        messageId,
        uid,
        dedupeKey,
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
      ]])
      return json({ ok: true, row, type, paymentMethod, dedupeKey })
    }

    const symbol = String(body.symbol || '').trim().toUpperCase()
    const name = String(body.name || '').trim()
    const quantity = Number(body.quantity || 0)
    const averagePrice = Number(body.averagePrice || 0)
    const currentPrice = Number(body.currentPrice || 0)
    const evaluationAmount = Number(body.evaluationAmount || 0)
    if (!symbol || !name || !Number.isFinite(quantity) || quantity < 0) return json({ error: 'invalid_payload' })

    if (type === 'stock') {
      const sh = getStockSheet_()
      const row = sh.getLastRow() + 1
      sh.getRange(row, 1, 1, 11).setValues([[symbol, name, quantity, averagePrice, '', '', '', '', '', '', uid]])
      setStockFormulas_(sh, row)
      return json({ ok: true, row, type })
    }

    const sh = getFundSheet_()
    const row = sh.getLastRow() + 1
    sh.getRange(row, 1, 1, 7).setValues([[
      symbol,
      name,
      quantity,
      averagePrice,
      Number.isFinite(currentPrice) ? currentPrice : 0,
      Number.isFinite(evaluationAmount) ? evaluationAmount : 0,
      uid
    ]])
    return json({ ok: true, row, type })
  } catch (err) {
    return json({ error: String(err) })
  }
}

function doGet(e) {
  try {
    const secret = String(e.parameter.secret || '')
    const uid = String(e.parameter.uid || '').trim()
    const type = String(e.parameter.type || 'all')
    if (secret !== APP_SECRET) return json({ error: 'unauthorized' })
    if (!uid) return json({ error: 'uid_required' })
    if (!['stock', 'fund', 'expense', 'all'].includes(type)) return json({ error: 'type_invalid' })

    const rows = []

    if (type === 'stock' || type === 'all') {
      const sv = getStockSheet_().getDataRange().getValues()
      sv.slice(1).forEach((r) => {
        if (String(r[10] || '').trim() !== uid) return
        rows.push({
          type: 'stock',
          symbol: String(r[0] || ''),
          name: String(r[1] || ''),
          quantity: Number(r[2] || 0),
          currentPriceYen: Number(r[4] || 0),
          previousDiff: Number(r[5] || 0),
          previousDiffRate: Number(r[6] || 0),
          evaluationAmount: Number(r[7] || 0),
          profitLoss: Number(r[8] || 0),
          profitLossRate: Number(r[9] || 0)
        })
      })
    }

    if (type === 'fund' || type === 'all') {
      const fv = getFundSheet_().getDataRange().getValues()
      fv.slice(1).forEach((r) => {
        if (String(r[6] || '').trim() !== uid) return
        rows.push({
          type: 'fund',
          symbol: String(r[0] || ''),
          name: String(r[1] || ''),
          quantity: Number(r[2] || 0),
          currentPriceYen: Number(r[4] || 0),
          evaluationAmount: Number(r[5] || 0)
        })
      })
    }

    if (type === 'expense' || type === 'all') {
      const filterMethod = normalizePaymentMethod_(String(e.parameter.paymentMethod || '')) || ''
      const methods = filterMethod ? [filterMethod] : Object.keys(EXPENSE_SHEET_NAMES)
      methods.forEach((method) => {
        const sh = getExpenseSheetByMethod_(method)
        if (!sh) return
        const values = sh.getDataRange().getValues()
        values.slice(1).forEach((r) => {
          if (String(r[7] || '').trim() !== uid) return
          rows.push({
            type: 'expense',
            paymentMethod: String(r[4] || method),
            date: String(r[0] || ''),
            amount: Number(r[1] || 0),
            store: String(r[2] || ''),
            category: String(r[3] || ''),
            source: String(r[5] || ''),
            messageId: String(r[6] || ''),
            dedupeKey: String(r[8] || '')
          })
        })
      })
    }

    return json({ rows })
  } catch (err) {
    return json({ error: String(err) })
  }
}

function importCardNoticesToInvestmentSpreadsheet() {
  const logSheet = getOrCreateSheet_(CARD_PROCESSED_LOG_SHEET, ['dedupeKey', 'messageId', 'uid', 'cardName', 'processedAt'])
  logSheet.hideSheet()
  const processed = loadProcessedExpenseKeys_(logSheet)

  CARD_SHEET_CONFIGS.forEach((cfg) => {
    const sh = getExpenseSheetByMethod_(cfg.paymentMethod)
    const query = buildMonthlyCardQuery_(cfg)
    const threads = GmailApp.search(query, 0, 100)
    const rows = []
    const logs = []

    threads.forEach((thread) => {
      thread.getMessages().forEach((msg) => {
        if (!msg.isUnread()) return
        const id = msg.getId()
        const dedupeKey = buildExpenseDedupeKey_(CARD_IMPORT_UID, cfg.paymentMethod, 'gmail', id, '', 0, '', '')
        if (processed.has(dedupeKey) || hasExpenseDedupeKey_(sh, dedupeKey)) {
          msg.markRead()
          return
        }

        const body = `${msg.getPlainBody() || ''}\n${msg.getBody() || ''}`
        const amount = extractAmountFromCardBody_(body)
        if (amount === null) {
          msg.markRead()
          return
        }

        rows.push([
          Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
          amount,
          extractMerchantFromCardBody_(body),
          inferCategoryFromCardText_(body),
          cfg.paymentMethod,
          'gmail',
          id,
          CARD_IMPORT_UID,
          dedupeKey,
          Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
        ])
        logs.push([dedupeKey, id, CARD_IMPORT_UID, cfg.cardName, new Date()])
        processed.add(dedupeKey)
        msg.markRead()
      })
    })

    if (rows.length > 0) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, 10).setValues(rows)
    }
    if (logs.length > 0) {
      logSheet.getRange(logSheet.getLastRow() + 1, 1, logs.length, 5).setValues(logs)
    }
  })
}

function extractAmountFromCardBody_(text) {
  const patterns = [
    /(?:利用金額|ご利用金額|お支払金額|金額)[^\d]{0,20}([0-9][0-9,]*)\s*円/i,
    /([0-9][0-9,]*)\s*円/i
  ]
  for (let i = 0; i < patterns.length; i += 1) {
    const m = text.match(patterns[i])
    if (m && m[1]) return Number(m[1].replace(/,/g, ''))
  }
  return null
}

function extractMerchantFromCardBody_(text) {
  const patterns = [
    /(?:利用店(?:舗)?名?|加盟店(?:名)?|ご利用店名|利用先|ご利用先)[：:\s]*([^\n\r<]+)/i,
    /([A-Za-z0-9\u3040-\u30FF\u4E00-\u9FAF\-\s]+)\s+[0-9][0-9,]*\s*円/
  ]
  for (let i = 0; i < patterns.length; i += 1) {
    const m = text.match(patterns[i])
    if (m && m[1]) return m[1].trim().replace(/\s+/g, ' ')
  }
  return ''
}

function loadProcessedExpenseKeys_(logSheet) {
  const ids = new Set()
  const lastRow = logSheet.getLastRow()
  if (lastRow < 2) return ids
  const values = logSheet.getRange(2, 1, lastRow - 1, 1).getValues()
  values.forEach((row) => {
    if (row[0]) ids.add(String(row[0]))
  })
  return ids
}

function hasExpenseDedupeKey_(sheet, dedupeKey) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return false
  const values = sheet.getRange(2, 9, lastRow - 1, 1).getValues()
  return values.some((row) => String(row[0] || '').trim() === dedupeKey)
}

function buildExpenseDedupeKey_(uid, paymentMethod, source, messageId, date, amount, store, category) {
  if (messageId) return `${uid}:${messageId}`
  return [
    uid,
    paymentMethod,
    source,
    String(date || ''),
    String(amount || ''),
    String(store || '').trim(),
    String(category || '').trim()
  ].join('|')
}

function normalizePaymentMethod_(value) {
  const key = String(value || '').trim().toLowerCase()
  if (['rakuten', '楽天', '楽天カード'].includes(key)) return 'rakuten'
  if (['mitsui', '三井住友', '三井住友カード', '三井住友クレジット'].includes(key)) return 'mitsui'
  if (['cash', '現金'].includes(key)) return 'cash'
  if (['paypay', 'ペイペイ'].includes(key)) return 'paypay'
  return key || ''
}

function inferCategoryFromCardText_(text) {
  if (/スーパー|mart|store|食品/i.test(text)) return '食費'
  if (/電車|バス|高速|交通|jr|taxi/i.test(text)) return '交通'
  if (/薬局|病院|clinic/i.test(text)) return '医療'
  return 'カード支出'
}

function createCardImportTrigger_() {
  const fn = 'importCardNoticesToInvestmentSpreadsheet'
  const exists = ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === fn)
  if (!exists) {
    ScriptApp.newTrigger(fn).timeBased().everyMinutes(15).create()
  }
}

function buildMonthlyCardQuery_(cfg) {
  const { after, before } = getMonthDateRange_(TARGET_YEAR_MONTH)
  return `label:"${cfg.labelName}" from:${cfg.from} is:unread after:${after} before:${before}`
}

function getMonthDateRange_(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map((v) => Number(v))
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)
  return {
    after: Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy/MM/dd'),
    before: Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy/MM/dd')
  }
}
