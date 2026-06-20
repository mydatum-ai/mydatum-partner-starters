import { createHash, timingSafeEqual } from "node:crypto";

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function localAccountKey(issuer, clientId, subject) {
  return createHash("sha256").update(`${issuer}\0${clientId}\0${subject}`).digest("base64url");
}

export function validateClaims(claims, transaction, config, now = Math.floor(Date.now() / 1000)) {
  if (claims.iss !== config.issuer.href.replace(/\/$/, "")) throw new Error("issuer validation failed");
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(config.clientId)) throw new Error("audience validation failed");
  if (!Number.isFinite(claims.exp) || claims.exp <= now) throw new Error("expiry validation failed");
  if (!safeEqual(claims.nonce || "", transaction.nonce)) throw new Error("nonce validation failed");
  if (!claims.sub) throw new Error("subject validation failed");
  return claims;
}

export function publicProfile(claims, config) {
  return {
    accountKey: localAccountKey(config.issuer.href, config.clientId, claims.sub),
    subject: claims.sub,
    email: claims.email || null,
    emailVerified: claims.email_verified === true,
  };
}

export function safeError(error) {
  const code = error?.code || error?.error || "authentication_failed";
  const allowed = new Set(["access_denied", "invalid_scope", "temporarily_unavailable"]);
  return { error: allowed.has(code) ? code : "authentication_failed" };
}
