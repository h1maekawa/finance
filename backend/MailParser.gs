/**
 * CONFIG: Set your Supabase URL and Key here.
 */
const CONFIG = {
  SUPABASE_URL: 'https://xxxx.supabase.co', // Replace with your Supabase Project URL
  SUPABASE_KEY: 'eyJhbG...',             // Replace with your Supabase anon key
  HOUSEHOLD_ID: 'your-household-uuid',    // Replace with your Household ID
  USER_ID: 'your-firebase-uid'            // Replace with your Firebase UID
};

/**
 * Main parser entry point.
 * Can be run manually for testing or via trigger.
 */
function main() {
  const syncLogs = [];
  const processedMessageIds = getProcessedMessageIds();

  // 1. Search for new payment emails (last 24 hours)
  const threads = GmailApp.search('after:' + (Math.floor(Date.now() / 1000) - 86400) + ' ("利用通知" OR "利用確認" OR "売上確定")');
  
  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      const msgId = message.getId();
      if (processedMessageIds.includes(msgId)) continue;

      const body = message.getPlainBody();
      const subject = message.getSubject();
      const date = message.getDate();
      
      const transaction = parseEmail(subject, body, date);
      
      if (transaction) {
        transaction.external_id = msgId;
        const success = pushToSupabase(transaction);
        if (success) {
          syncLogs.push(transaction);
        }
      }
    }
  }

  console.log(`Sync completed. Imported ${syncLogs.length} transactions.`);
}

/**
 * Parses email content based on templates.
 */
function parseEmail(subject, body, date) {
  // SMBC
  if (body.includes('三井住友カード') || subject.includes('三井住友カード')) {
    const amountMatch = body.match(/利用金額：([\d,]+)円/);
    const storeMatch = body.match(/利用先：(.+)/);
    if (amountMatch && storeMatch) {
      return {
        amount: parseInt(amountMatch[1].replace(/,/g, '')),
        note: storeMatch[1].trim(),
        transaction_date: Utilities.formatDate(date, 'JST', 'yyyy-MM-dd'),
        kind: 'expense'
      };
    }
  }

  // Rakuten
  if (body.includes('楽天カード') || subject.includes('楽天カード')) {
    const amountMatch = body.match(/利用金額 ([\d,]+) 円/);
    const storeMatch = body.match(/利用先 (.+)/);
    if (amountMatch && storeMatch) {
      return {
        amount: parseInt(amountMatch[1].replace(/,/g, '')),
        note: storeMatch[1].trim(),
        transaction_date: Utilities.formatDate(date, 'JST', 'yyyy-MM-dd'),
        kind: 'expense'
      };
    }
  }

  // Generic fallback
  const genericAmount = body.match(/(\d{1,3}(,\d{3})*)円/);
  if (genericAmount) {
    return {
      amount: parseInt(genericAmount[1].replace(/,/g, '')),
      note: 'Gmail取込: ' + subject.substring(0, 20),
      transaction_date: Utilities.formatDate(date, 'JST', 'yyyy-MM-dd'),
      kind: 'expense'
    };
  }

  return null;
}

/**
 * Pushes transaction to Supabase.
 */
function pushToSupabase(tx) {
  const payload = {
    household_id: CONFIG.HOUSEHOLD_ID,
    user_id: CONFIG.USER_ID,
    amount: tx.amount,
    note: tx.note,
    transaction_date: tx.transaction_date,
    kind: tx.kind,
    import_source: 'gmail',
    external_id: tx.external_id
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: CONFIG.SUPABASE_KEY,
      Authorization: 'Bearer ' + CONFIG.SUPABASE_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + '/rest/v1/transactions', options);
  if (response.getResponseCode() === 201) {
    return true;
  } else {
    console.error('Supabase Error:', response.getContentText());
    return false;
  }
}

/**
 * Fetches already processed IDs from Supabase to avoid duplicates.
 */
function getProcessedMessageIds() {
  const options = {
    method: 'get',
    headers: {
      apikey: CONFIG.SUPABASE_KEY,
      Authorization: 'Bearer ' + CONFIG.SUPABASE_KEY
    }
  };
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/transactions?select=external_id&external_id=not.is.null&limit=100`;
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    const data = JSON.parse(response.getContentText());
    return data.map(item => item.external_id);
  }
  return [];
}

/**
 * Test function to run from editor.
 */
function testParser() {
  console.log('Starting test parser...');
  main();
}

/**
 * Setup trigger to run every 5 minutes.
 */
function setupTrigger() {
  ScriptApp.newTrigger('main')
    .timeBased()
    .everyMinutes(5)
    .create();
  console.log('Trigger set to run every 5 minutes.');
}

/**
 * Handles POST requests (e.g. from the frontend manual sync button)
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.action === 'gmailImport') {
      main();
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Sync started' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for simple testing)
 */
function doGet() {
  return ContentService.createTextOutput('MailParser GAS is running.');
}

