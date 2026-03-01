import { google } from 'googleapis'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function getSheetConfig() {
  return {
    spreadsheetId: requiredEnv('GOOGLE_SHEETS_SPREADSHEET_ID'),
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || 'investments',
  }
}

async function getSheetsApi() {
  const clientEmail = requiredEnv('GOOGLE_SHEETS_CLIENT_EMAIL')
  const privateKey = requiredEnv('GOOGLE_SHEETS_PRIVATE_KEY').replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const authClient = await auth.getClient()
  return google.sheets({ version: 'v4', auth: authClient })
}

export {
  getSheetsApi,
  getSheetConfig,
}
