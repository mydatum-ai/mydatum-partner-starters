import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeCallback, createAuthorizationTransaction, createChallenge, createNonce, createState, createVerifier, safeEqual } from './pkce.mjs'

test('matches the RFC 7636 S256 vector', async () => {
  assert.equal(await createChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
})

test('generates bounded URL-safe unpredictable transaction values', () => {
  for (const value of [createState(), createNonce(), createVerifier()]) assert.match(value, /^[A-Za-z0-9_-]{43,128}$/)
  assert.notEqual(createState(), createState())
})

test('builds an authorization request with state nonce and PKCE S256', async () => {
  const transaction = await createAuthorizationTransaction({ authorizationEndpoint: 'https://issuer.example/o/authorize', clientId: 'partner-client', redirectUri: 'https://app.example/callback', scopes: ['openid', 'email'], now: 100 })
  const url = new URL(transaction.url)
  assert.equal(url.searchParams.get('response_type'), 'code')
  assert.equal(url.searchParams.get('nonce'), transaction.nonce)
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(url.searchParams.get('scope'), 'openid email')
})

test('consumes matching callback once and rejects mismatch expiry and replay', () => {
  const base = { state: 'expected', nonce: 'nonce', verifier: 'verifier', redirectUri: 'https://app.example/callback', createdAt: 100, used: false }
  assert.deepEqual(consumeCallback({ ...base }, 'https://app.example/callback?code=one&state=expected', { now: 200 }), { code: 'one' })
  assert.throws(() => consumeCallback({ ...base }, 'https://app.example/callback?code=one&state=wrong', { now: 200 }), /state mismatch/)
  assert.throws(() => consumeCallback({ ...base }, 'https://app.example/callback?code=one&state=expected', { now: 700001, maxAgeMs: 600000 }), /expired/)
  const used = { ...base }
  consumeCallback(used, 'https://app.example/callback?error=access_denied&state=expected', { now: 200 })
  assert.throws(() => consumeCallback(used, 'https://app.example/callback?code=two&state=expected', { now: 300 }), /used/)
  assert.equal(safeEqual('same', 'same'), true)
})
