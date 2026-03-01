const admin = require('firebase-admin')

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin
  }

  const projectId = requiredEnv('FIREBASE_ADMIN_PROJECT_ID')
  const clientEmail = requiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL')
  const privateKey = requiredEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n')

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
  return admin
}

async function verifyFirebaseTokenFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || typeof authHeader !== 'string') {
    throw new Error('missing_authorization_header')
  }
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('invalid_authorization_header')
  }
  const idToken = authHeader.slice('Bearer '.length).trim()
  if (!idToken) {
    throw new Error('missing_id_token')
  }

  const firebaseAdmin = getFirebaseAdmin()
  const decoded = await firebaseAdmin.auth().verifyIdToken(idToken, true)
  return decoded
}

module.exports = {
  verifyFirebaseTokenFromRequest,
}
