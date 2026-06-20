const encoder = new TextEncoder()
const base64url = (bytes) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function secureRandom(bytes = 32) {
  if (!globalThis.crypto?.getRandomValues) throw new Error('A cryptographically secure random source is required')
  return base64url(globalThis.crypto.getRandomValues(new Uint8Array(bytes)))
}

export const createState = () => secureRandom(32)
export const createNonce = () => secureRandom(32)
export const createVerifier = () => secureRandom(48)

export async function createChallenge(verifier) {
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) throw new Error('Invalid PKCE verifier')
  return base64url(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(verifier))))
}

export function safeEqual(left, right) {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  let difference = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) difference |= (a[index] || 0) ^ (b[index] || 0)
  return difference === 0
}

export async function createAuthorizationTransaction({ authorizationEndpoint, clientId, redirectUri, scopes = ['openid'], now = Date.now() }) {
  const state = createState()
  const nonce = createNonce()
  const verifier = createVerifier()
  const url = new URL(authorizationEndpoint)
  url.search = new URLSearchParams({
    response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
    scope: scopes.join(' '), state, nonce,
    code_challenge: await createChallenge(verifier), code_challenge_method: 'S256',
  }).toString()
  return { url: url.toString(), state, nonce, verifier, redirectUri, createdAt: now, used: false }
}

export function consumeCallback(transaction, callbackUrl, { now = Date.now(), maxAgeMs = 10 * 60 * 1000 } = {}) {
  if (!transaction || transaction.used || now - transaction.createdAt > maxAgeMs) throw new Error('Authorization transaction is missing, expired, or used')
  const params = new URL(callbackUrl).searchParams
  if (!safeEqual(transaction.state, params.get('state') || '')) throw new Error('Authorization state mismatch')
  transaction.used = true
  if (params.has('error')) return { error: params.get('error'), description: params.get('error_description') || '' }
  const code = params.get('code')
  if (!code) throw new Error('Authorization code is missing')
  return { code }
}
