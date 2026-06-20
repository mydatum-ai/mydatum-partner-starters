# Partner OAuth/OIDC Integration Contract

This is the implementation contract for external Partner applications. Backend source and tests are authoritative when this document and behavior differ.

## Environment model

| Environment | Issuer source | Rule |
| --- | --- | --- |
| Local | `OIDC_ISSUER` in local configuration | Use only local client IDs and redirects. |
| Staging | `https://auth.staging.mydatum.ai` | Use dedicated staging clients and HTTPS redirects. |
| Production | Production `OIDC_ISSUER` | Never reuse staging client IDs, redirects, or secrets. |

Resolve endpoints from `${issuer}/.well-known/openid-configuration`. Do not hard-code authorize, token, UserInfo, or JWKS hosts independently.

## Implemented protocol matrix

| Capability | Current contract | Authority |
| --- | --- | --- |
| Authorization | `GET /o/authorize`, `response_type=code` | `oauth/api.py`, authorize tests |
| Token exchange | `POST /o/token`, `grant_type=authorization_code` | `oauth/api.py`, token-error tests |
| PKCE | Public clients require a challenge; S256 and plain are accepted. Use S256. Confidential clients follow `require_pkce`. | `clients/policy.py`, OAuth tests |
| State | Echoed on success/error when supplied. Client must generate, store, validate, expire, and consume it. | `oauth/api.py` |
| Nonce | Accepted on authorization, bound to the one-time code, and returned in the ID token. | `oauth/api.py`, OAuth flow tests |
| Access token | Opaque bearer token, default 3600-second TTL | `oauth/models.py`, settings, OAuth tests |
| ID token | JWT using configured supported algorithm(s); validate with discovery/JWKS | `oauth/signing.py`, discovery tests |
| Refresh token | Opaque value issued and hashed at rest. A refresh-token grant is not implemented and is not advertised. | `oauth/models.py`, `TokenView`, discovery |
| UserInfo | `GET /o/userinfo` with bearer access token | `oauth/api.py` |
| Logout/revocation | No OIDC end-session or public revocation endpoint is currently advertised. Clear the partner application session; do not invent an endpoint. | URL configuration, discovery |
| Subject | Public or pairwise. External Partner applications should use pairwise and treat `sub` as opaque. | `clients/models.py`, subject tests |
| Redirects | Exact registered URI and environment policy validation | `clients/validators.py`, authorize-error tests |
| Client authentication | Public clients use client ID + PKCE. Confidential clients authenticate at token exchange with a server-held secret. | `TokenView`, client tests |

## Scope and claim matrix

All optional identity claims require an allowed scope and active MyDatum Consent coverage. Absence is valid and must not break sign-in.

| Scope | Possible claims | Notes |
| --- | --- | --- |
| `openid` | Protocol claims, opaque `sub`, `mydatum_claims_ver` | No email, profile, phone, country, or roles. |
| `email` | `email`, `email_verified` | Auth-owned email; Consent enforced. |
| `profile` | `given_name`, `family_name` | Optional profile attributes; Consent enforced. |
| `phone` | `phone_number`, `phone_number_verified` | Current verified phone required for release. |
| `address` | country/address projection supported by the identity contract | Consent enforced. |
| `mydatum.roles` | `roles` | Restricted; do not use as a substitute for partner application authorization. |

UserInfo `sub` must equal the ID-token `sub` for the same issuer, user, and client. Never use email as the external identity key and never correlate pairwise subjects across clients.

## Error contract

- Authorize errors redirect only after the redirect URI is trusted. Missing/untrusted redirects receive JSON errors.
- Token errors are JSON and may include a non-sensitive `request_id`.
- Supported OAuth errors include `invalid_request`, `invalid_scope`, `unauthorized_client`, `access_denied`, `unsupported_response_type`, `unsupported_grant_type`, `invalid_grant`, `invalid_client`, `server_error`, and `temporarily_unavailable`.
- Never retry an authorization code after an uncertain token exchange; reconcile through a fresh authorization transaction.

## Security baseline for references

- Authorization Code only; no implicit or password grant.
- PKCE S256 in every reference.
- Cryptographically random, single-use state and verifier with bounded transaction expiry.
- Confidential secrets and OAuth tokens remain server-side.
- Browser examples contain no secret and do not persist tokens in `localStorage`.
- ID-token validation uses a maintained library and verifies algorithm, signature, issuer, audience, expiry, and nonce.
- Codes, tokens, secrets, verifiers, cookies, raw ID tokens, and user attributes are excluded from logs and screenshots.
- Partner approval makes applications/scopes eligible; MyDatum Consent remains runtime data-sharing authority.

## Known Phase 1 gaps

1. Decide and implement refresh-token rotation/grant before documenting refresh usage.
2. Define logout/revocation endpoints before references advertise federated logout.
