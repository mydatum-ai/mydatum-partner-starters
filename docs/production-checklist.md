# Partner production checklist

Complete this checklist independently for every environment. Never reuse a staging client ID,
redirect URI set, secret, session key, or evidence record in production.

## Registration and configuration

- The organisation and application are reviewed, provisioned, and enabled.
- The issuer exactly matches the environment; staging is `https://auth.staging.mydatum.ai`.
- Endpoints come from `/.well-known/openid-configuration` and the returned issuer matches exactly.
- Every redirect is registered and matched exactly. Production web callbacks use HTTPS.
- Every public web browser origin is reviewed, registered exactly, and uses HTTPS in production.
- Public clients have no secret. Confidential secrets exist only in a server secret manager.
- Only required, approved scopes are requested; `openid` is the least-privilege sign-in baseline.
- The selected starter version and catalogue checksum are recorded and remain supported.
- Generated configuration was reviewed before use; confidential placeholders were filled only through
  the deployment secret manager, never in source or a support attachment.

## Protocol and application security

- Authorization Code uses unpredictable, single-use state and nonce plus PKCE S256.
- Callback state is checked before exchange and callback parameters are removed from browser history.
- A maintained OIDC library validates signature, algorithm, issuer, audience, expiry, and nonce.
- UserInfo is optional and, when called, its `sub` must equal the ID-token `sub`.
- Local accounts are keyed by issuer plus opaque pairwise `sub`, never by email or inferred IDs.
- Tokens, codes, verifiers, secrets, cookies, raw ID tokens, and complete claim payloads are absent
  from browser persistence, URLs after callback, logs, analytics, screenshots, and support tickets.
- Confidential login rotates the application session. Logout clears local sessions and server tokens.

## Consent, operations, and release

- `openid`-only smoke proves email, name, phone, profile, address, country, and roles are absent.
- Optional claims appear only after scope approval and the user's runtime MyDatum Consent.
- Denial, invalid state, PKCE failure, replay, malicious redirect, disabled client, and scope escalation
  fail closed with redacted errors.
- Rotation proves the previous confidential secret fails; disable proves authorization/exchange fails.
- Partner, OAuth, and Consent audits reconcile by request/correlation ID without sensitive values.
- Frontend/backend gates, every reference check, migration check, documentation links, lockfiles, and
  secret scan pass for the candidate commit.
- Dedicated smoke clients are disabled or deleted and non-sensitive cleanup evidence is recorded.
- The application—not only Partner's safe launcher—completes callback validation, token validation,
  account linking, session rotation, and local logout in its deployed architecture.

MyDatum currently issues refresh tokens but does not implement or advertise the refresh-token grant.
It also does not advertise public revocation or OIDC end-session endpoints. Do not design production
behavior around those capabilities until discovery and the contract explicitly add them.
