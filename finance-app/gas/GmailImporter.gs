// ================================================================
// GmailImporter.gs
// クレジットカードご利用通知メールを自動取込してSupabaseに保存する
//
// 設定方法：
//   GASのスクリプトプロパティに以下を設定してください
//   SUPABASE_URL      : https://xxxx.supabase.co
//   SUPABASE_ANON_KEY : eyJhbGci...
//   HOUSEHOLD_ID      : Supabaseのhousehold UUID
//   USER_ID           : FirebaseのUID（メール取込を行うユーザーのUID）
//   GAS_SECRET        : 既存と同じシークレットキー
//
// トリガー設定：
//   実行関数: importCreditCardEmails
//   イベントソース: 時間主導型
//   種類: 時間ベースのタイマー（例：1時間おき）
// ================================================================

const SMBC_SENDER = 'statement@vpass.ne.jp'
const SMBC_SUBJECT_KEYWORD = 'ご利用のお知らせ【三井住友カード】'

const RAKUTEN_SENDER = 'info@mail.rakuten-card.co.jp'
const RAKUTEN_SUBJECT_KEYWORD = 'カード利用のお知らせ(本人ご利用分)'

// カテゴリ自動マッピング（店舗名キーワード → カテゴリ名）
const CATEGORY_MAPPING = [
  { keywords: ['スーパー', 'ドンキ', 'マックス', 'イオン', 'コンビニ', 'セブン', 'ファミマ', 'ローソン', 'LOTTERIA', 'ロッテリア', 'マクドナルド', 'すき家', 'モスバーガー', 'サイゼリヤ', '吉野家', 'ガスト', '食品'], category: '食費' },
  { keywords: ['電車', 'バス', '新幹線', 'タクシー', 'JAL', 'ANA', 'SUICA', 'PASMO', 'IC'], category: '交通費' },
  { keywords: ['薬局', 'ドラッグ', 'くすり', '病院', '医院', 'クリニック', '歯科', '調剤'], category: '医療費' },
  { keywords: ['Amazon', '楽天', 'メルカリ', 'ZOZOTOWN', 'ユニクロ', 'GU', '服', 'アパレル'], category: '買物' },
  { keywords: ['ネットフリックス', 'Netflix', 'Spotify', 'Amazon Prime', 'Disney', 'サブスク'], category: 'サブスク' },
  { keywords: ['電気', 'ガス', '水道', '光熱費'], category: '光熱費' },
  { keywords: ['ドコモ', 'au', 'ソフトバンク', '楽天モバイル', 'NTT', '通信', 'インターネット'], category: '通信費' },
  { keywords: ['映画', 'ゲーム', 'カラオケ', 'ボウリング', 'レジャー', '娯楽'], category: '娯楽' },
]

/**
 * メインエントリーポイント（時間トリガーで定期実行）
 */
function importCreditCardEmails() {
  const props = PropertiesService.getScriptProperties()
  const supabaseUrl = props.getProperty('SUPABASE_URL')
  const supabaseAnonKey = props.getProperty('SUPABASE_ANON_KEY')
  const householdId = props.getProperty('HOUSEHOLD_ID')
  const userId = props.getProperty('USER_ID')
  const gasSecret = props.getProperty('GAS_SECRET')

  if (!supabaseUrl || !supabaseAnonKey || !householdId || !userId) {
    Logger.log('ERROR: スクリプトプロパティが未設定です')
    return
  }

  const results = {
    smbc: 0,
    rakuten: 0,
    skipped: 0,
    errors: 0,
  }

  // 三井住友カードメール処理
  const smbcResults = processCardEmails({
    sender: SMBC_SENDER,
    subjectKeyword: SMBC_SUBJECT_KEYWORD,
    cardType: 'smbc',
    parser: parseSmbcEmail,
    supabaseUrl,
    supabaseAnonKey,
    householdId,
    userId,
  })
  results.smbc = smbcResults.imported
  results.skipped += smbcResults.skipped
  results.errors += smbcResults.errors

  // 楽天カードメール処理
  const rakutenResults = processCardEmails({
    sender: RAKUTEN_SENDER,
    subjectKeyword: RAKUTEN_SUBJECT_KEYWORD,
    cardType: 'rakuten',
    parser: parseRakutenEmail,
    supabaseUrl,
    supabaseAnonKey,
    householdId,
    userId,
  })
  results.rakuten = rakutenResults.imported
  results.skipped += rakutenResults.skipped
  results.errors += rakutenResults.errors

  Logger.log(
    `取込完了 - 三井住友: ${results.smbc}件, 楽天: ${results.rakuten}件, スキップ: ${results.skipped}件, エラー: ${results.errors}件`
  )
}

/**
 * カード別メール処理の共通処理
 */
function processCardEmails({ sender, subjectKeyword, cardType, parser, supabaseUrl, supabaseAnonKey, householdId, userId }) {
  const stats = { imported: 0, skipped: 0, errors: 0 }

  // 直近7日分のメールを検索（重複はDBで防ぐ）
  const query = `from:${sender} subject:"${subjectKeyword}" newer_than:7d`
  const threads = GmailApp.search(query)

  const processedMonths = new Set()

  for (const thread of threads) {
    const messages = thread.getMessages()
    for (const message of messages) {
      const messageId = message.getId()

      try {
        // 既に取込済みかチェック
        if (isAlreadyImported(messageId, supabaseUrl, supabaseAnonKey)) {
          stats.skipped++
          continue
        }

        const subject = message.getSubject()
        const body = message.getPlainBody()
        const parsed = parser(body)

        if (!parsed) {
          Logger.log(`パース失敗: ${messageId} subject=${subject}`)
          stats.errors++
          continue
        }

        // カテゴリを自動判定
        const categoryName = guessCategory(parsed.storeName)

        // Supabaseからカテゴリ一覧を取得してマッチング
        const categories = fetchCategories(householdId, supabaseUrl, supabaseAnonKey)
        const matchedCategory = categories.find(c => c.name === categoryName && c.kind === 'expense')
        const categoryId = matchedCategory?.id || null

        // クレジットカードIDを取得
        const creditCardId = fetchCreditCardId(cardType, householdId, supabaseUrl, supabaseAnonKey)

        // transactionsテーブルに挿入
        const transactionId = insertTransaction({
          householdId,
          userId,
          categoryId,
          creditCardId,
          amount: parsed.amount,
          transactionDate: parsed.date,
          note: parsed.storeName,
          supabaseUrl,
          supabaseAnonKey,
        })

        // ログを記録
        insertImportLog({
          householdId,
          userId,
          gmailMessageId: messageId,
          cardType,
          transactionDate: parsed.date,
          storeName: parsed.storeName,
          amount: parsed.amount,
          categoryId,
          creditCardId,
          transactionId,
          status: 'imported',
          rawSubject: subject,
          rawBody: body.slice(0, 500),
          supabaseUrl,
          supabaseAnonKey,
        })

        stats.imported++
        Logger.log(`取込成功: ${parsed.storeName} ${parsed.amount}円 (${parsed.date})`)

        // 月次データの更新対象月を記録
        const targetMonth = `${parsed.date.slice(0, 7)}-01`
        processedMonths.add(targetMonth)

      } catch (e) {
        Logger.log(`エラー: ${messageId} - ${e.message}`)
        stats.errors++
      }
    }
  }

  // 取込があった月のみ月次データを再計算して更新
  for (const month of processedMonths) {
    upsertMonthlySnapshot(householdId, month, supabaseUrl, supabaseAnonKey)
  }

  return stats
}

/**
 * 三井住友カードメール本文パーサー
 * フォーマット例：
 *   ご利用日時：2026/03/08 09:45
 *   LOTTERIA（買物）\t390円
 */
function parseSmbcEmail(body) {
  try {
    // 日付・時刻を抽出
    const dateMatch = body.match(/ご利用日時[：:]\s*(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/)
    if (!dateMatch) return null
    const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`

    // 店舗名・金額を抽出（タブ区切りまたは改行区切り）
    const storeAmountMatch = body.match(/ご利用日時.*?\n(.+?)[\t　 ]+([0-9,]+)円/)
      || body.match(/([^\n\t]{2,30})\s+([0-9,]+)円/)
    if (!storeAmountMatch) {
      // 別パターン：店舗名（カテゴリ）\t金額
      const altMatch = body.match(/(.+?)（.+?）[\t　 ]*([0-9,]+)円/)
      if (!altMatch) return null
      return {
        date,
        storeName: altMatch[1].trim(),
        amount: parseInt(altMatch[2].replace(/,/g, ''), 10),
      }
    }

    return {
      date,
      storeName: storeAmountMatch[1].trim().replace(/（.*?）/, '').trim(),
      amount: parseInt(storeAmountMatch[2].replace(/,/g, ''), 10),
    }
  } catch (e) {
    Logger.log('SMBC parse error: ' + e.message)
    return null
  }
}

/**
 * 楽天カードメール本文パーサー
 * フォーマット例：
 *   ご利用日：2026年03月08日
 *   ご利用店名：Amazon.co.jp
 *   ご利用金額：3,500円
 */
function parseRakutenEmail(body) {
  try {
    // 日付を抽出
    const dateMatch = body.match(/ご利用日[：:]\s*(\d{4})年(\d{2})月(\d{2})日/)
    if (!dateMatch) return null
    const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`

    // 店舗名を抽出
    const storeMatch = body.match(/ご利用店名[：:]\s*(.+)/)
    if (!storeMatch) return null
    const storeName = storeMatch[1].trim()

    // 金額を抽出
    const amountMatch = body.match(/ご利用金額[：:]\s*([0-9,]+)円/)
    if (!amountMatch) return null
    const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10)

    return { date, storeName, amount }
  } catch (e) {
    Logger.log('Rakuten parse error: ' + e.message)
    return null
  }
}

/**
 * 店舗名からカテゴリを推定
 */
function guessCategory(storeName) {
  for (const mapping of CATEGORY_MAPPING) {
    for (const keyword of mapping.keywords) {
      if (storeName.includes(keyword)) {
        return mapping.category
      }
    }
  }
  return '食費' // デフォルト
}

/**
 * 既に取込済みかGmailMessageIdで確認
 */
function isAlreadyImported(gmailMessageId, supabaseUrl, supabaseAnonKey) {
  const url = `${supabaseUrl}/rest/v1/email_import_logs?gmail_message_id=eq.${encodeURIComponent(gmailMessageId)}&select=id`
  const response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    muteHttpExceptions: true,
  })
  const data = JSON.parse(response.getContentText())
  return Array.isArray(data) && data.length > 0
}

/**
 * カテゴリ一覧を取得
 */
function fetchCategories(householdId, supabaseUrl, supabaseAnonKey) {
  const url = `${supabaseUrl}/rest/v1/categories?household_id=eq.${householdId}&kind=eq.expense&select=id,name`
  const response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    muteHttpExceptions: true,
  })
  return JSON.parse(response.getContentText()) || []
}

/**
 * クレジットカードIDをcard_typeで取得（smbc/rakutenに対応するcard_nameで検索）
 */
function fetchCreditCardId(cardType, householdId, supabaseUrl, supabaseAnonKey) {
  const keywords = cardType === 'smbc'
    ? ['三井住友', 'SMBC', 'Vポイント']
    : ['楽天', 'Rakuten']

  const url = `${supabaseUrl}/rest/v1/credit_cards?household_id=eq.${householdId}&is_active=eq.true&select=id,card_name`
  const response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    muteHttpExceptions: true,
  })
  const cards = JSON.parse(response.getContentText()) || []
  const matched = cards.find(card =>
    keywords.some(kw => card.card_name.includes(kw))
  )
  return matched?.id || null
}

/**
 * transactionsテーブルにINSERT
 */
function insertTransaction({ householdId, userId, categoryId, creditCardId, amount, transactionDate, note, supabaseUrl, supabaseAnonKey }) {
  const url = `${supabaseUrl}/rest/v1/transactions`
  const payload = {
    household_id: householdId,
    user_id: userId,
    category_id: categoryId,
    credit_card_id: creditCardId,
    kind: 'expense',
    amount: amount,
    transaction_date: transactionDate,
    note: note,
  }
  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })
  const data = JSON.parse(response.getContentText())
  return Array.isArray(data) && data.length > 0 ? data[0].id : null
}

/**
 * email_import_logsテーブルにINSERT
 */
function insertImportLog({ householdId, userId, gmailMessageId, cardType, transactionDate, storeName, amount, categoryId, creditCardId, transactionId, status, rawSubject, rawBody, supabaseUrl, supabaseAnonKey }) {
  const url = `${supabaseUrl}/rest/v1/email_import_logs`
  const payload = {
    household_id: householdId,
    user_id: userId,
    gmail_message_id: gmailMessageId,
    card_type: cardType,
    transaction_date: transactionDate,
    store_name: storeName,
    amount: amount,
    category_id: categoryId,
    credit_card_id: creditCardId,
    transaction_id: transactionId,
    status: status,
    raw_subject: rawSubject,
    raw_body: rawBody,
  }
  UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })
}

/**
 * Webアプリとして公開した場合のGETハンドラ（手動実行トリガー用）
 * フロントエンドから /api/gas/gmail-import?uid=xxx&secret=xxx でリクエスト
 */
function doPost(e) {
  const props = PropertiesService.getScriptProperties()
  const gasSecret = props.getProperty('GAS_SECRET')

  let body
  try {
    body = JSON.parse(e.postData.contents)
  } catch {
    return ContentService.createTextOutput(JSON.stringify({ error: 'invalid_json' }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  // 既存のInvestmentApi.gsのdoPost処理を優先（actionが'append'等の場合）
  if (body.action && body.action !== 'gmailImport') {
    // InvestmentApi.gsに委譲（既存処理）
    return handleInvestmentAction(e)
  }

  if (body.secret !== gasSecret) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  if (body.action === 'gmailImport') {
    try {
      importCreditCardEmails()
      return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Gmail取込を実行しました' }))
        .setMimeType(ContentService.MimeType.JSON)
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
        .setMimeType(ContentService.MimeType.JSON)
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'unknown_action' }))
    .setMimeType(ContentService.MimeType.JSON)
}

/**
 * 月次データ（MonthlySnapshot）を再計算して更新
 */
function upsertMonthlySnapshot(householdId, targetMonth, supabaseUrl, supabaseAnonKey) {
  try {
    const startOfMonth = targetMonth
    
    // JSのDateで月末日を計算（指定月の翌月0日目＝当月末日）
    const y = parseInt(startOfMonth.slice(0, 4), 10)
    const m = parseInt(startOfMonth.slice(5, 7), 10)
    const lastDayFunc = new Date(y, m, 0).getDate()
    const endOfMonth = `${y}-${String(m).padStart(2, '0')}-${String(lastDayFunc).padStart(2, '0')}`

    // 1. 指定月のすべてのtransactionsを取得して集計
    const txUrl = `${supabaseUrl}/rest/v1/transactions?household_id=eq.${householdId}&transaction_date=gte.${startOfMonth}&transaction_date=lte.${endOfMonth}&select=kind,amount`
    const txResponse = UrlFetchApp.fetch(txUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      muteHttpExceptions: true
    })
    
    let incomeTotal = 0
    let expenseTotal = 0
    const txData = JSON.parse(txResponse.getContentText()) || []
    
    for (const tx of txData) {
      if (tx.kind === 'income') incomeTotal += Number(tx.amount || 0)
      if (tx.kind === 'expense') expenseTotal += Number(tx.amount || 0)
    }
    const netTotal = incomeTotal - expenseTotal

    // 2. 現在の預金口座残高と証券口座の評価額の合計を取得（月次保存用）
    // （今回は口座残高は現在時点のものを取得します）
    let assetsTotal = 0
    
    // bank_accounts
    const baUrl = `${supabaseUrl}/rest/v1/bank_accounts?household_id=eq.${householdId}&select=balance`
    const baResponse = UrlFetchApp.fetch(baUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      muteHttpExceptions: true
    })
    const baData = JSON.parse(baResponse.getContentText()) || []
    for (const ba of baData) {
      assetsTotal += Number(ba.balance || 0)
    }
    
    // 既存の月次データを取得してメモなどを引き継ぐ
    const msUrl = `${supabaseUrl}/rest/v1/monthly_snapshots?household_id=eq.${householdId}&target_month=eq.${targetMonth}`
    const msResponse = UrlFetchApp.fetch(msUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=representation'
      },
      muteHttpExceptions: true
    })
    const msData = JSON.parse(msResponse.getContentText()) || []
    const existingMemo = msData.length > 0 ? (msData[0].memo || null) : null

    // 3. monthly_snapshots に Upsert
    const upsertUrl = `${supabaseUrl}/rest/v1/monthly_snapshots`
    const payload = {
      household_id: householdId,
      target_month: targetMonth,
      income_total: incomeTotal,
      expense_total: expenseTotal,
      net_total: netTotal,
      month_end_assets: assetsTotal, 
      memo: existingMemo
    }

    UrlFetchApp.fetch(upsertUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    })

    Logger.log(`月次データ更新成功: ${targetMonth} (収入:${incomeTotal}, 支出:${expenseTotal})`)
  } catch (e) {
    Logger.log(`月次データ更新エラー: ${targetMonth} - ${e.message}`)
  }
}

