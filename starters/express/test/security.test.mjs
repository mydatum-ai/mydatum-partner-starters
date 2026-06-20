import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../src/config.mjs";
import { publicProfile, safeError, validateClaims } from "../src/security.mjs";

const config = loadConfig({
  MYDATUM_ISSUER: "https://auth.staging.mydatum.ai",
  MYDATUM_CLIENT_ID: "client-123",
  MYDATUM_CLIENT_SECRET: "top-secret",
  MYDATUM_REDIRECT_URI: "http://127.0.0.1:3000/auth/callback",
  SESSION_SECRET: "test-session-secret-at-least-32-characters",
});
const transaction = { nonce: "expected-nonce" };
const valid = { iss: "https://auth.staging.mydatum.ai", aud: "client-123", exp: 2000, nonce: "expected-nonce", sub: "opaque-sub" };

test("validates the issuer audience expiry nonce and subject", () => {
  assert.equal(validateClaims(valid, transaction, config, 1000).sub, "opaque-sub");
  for (const change of [
    { iss: "https://attacker.invalid" },
    { aud: "other-client" },
    { exp: 999 },
    { nonce: "wrong" },
    { sub: "" },
  ]) assert.throws(() => validateClaims({ ...valid, ...change }, transaction, config, 1000));
});

test("uses contextual opaque local account keys and optional email", () => {
  const profile = publicProfile(valid, config);
  assert.equal(profile.email, null);
  assert.notEqual(profile.accountKey, publicProfile({ ...valid, sub: "other" }, config).accountKey);
});

test("redacts provider and library failures", () => {
  assert.deepEqual(safeError({ message: "code=secret client_secret=secret" }), { error: "authentication_failed" });
  assert.deepEqual(safeError({ error: "access_denied" }), { error: "access_denied" });
  assert.deepEqual(safeError({ error: "invalid_scope" }), { error: "invalid_scope" });
  assert.deepEqual(safeError({ error: "unauthorized_client" }), { error: "authentication_failed" });
});
