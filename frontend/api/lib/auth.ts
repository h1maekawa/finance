import { createRemoteJWKSet, jwtVerify } from 'jose'

/**
 * googleapisから公開鍵（JWKS）を取得するためのセット
 */
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com'
const JWKS = createRemoteJWKSet(new URL(GOOGLE_CERTS_URL))

/**
 * Firebase IDトークンを検証し、ペイロードを返すユーティリティ
 */
export async function verifyFirebaseIdToken(token: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not configured in environment variables')
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })

    return payload
  } catch (error) {
    console.error('JWT Verification failed:', error)
    throw new Error('Invalid token')
  }
}

/**
 * HTTPリクエストからBearerトークンを取得して検証するラッパー
 */
export async function authenticateRequest(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No Bearer token provided')
  }
  const token = authHeader.replace('Bearer ', '')
  return await verifyFirebaseIdToken(token)
}
