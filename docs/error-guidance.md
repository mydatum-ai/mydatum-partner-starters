# Partner OAuth error guidance

Partner diagnostics are read-only. They inspect authoritative application configuration and fetch
discovery metadata from the developer's browser only after **Run read-only checks** is selected.
MyDatum does not probe partner callback URLs, initiate authorization silently, or bypass login and
Consent. Include the displayed request ID when contacting support; never include a code, verifier,
token, secret, cookie, or complete claim payload.

| Error | Meaning | Safe action |
| --- | --- | --- |
| `invalid_request` | A required or supported authorization parameter is wrong. | Rebuild the request from discovery and generated Partner configuration. |
| `invalid_client` | Client authentication failed. | Reconcile the client ID and server-held secret; a rotated secret stops working immediately. |
| `unauthorized_client` | The client is disabled or cannot use the requested flow. | Review authoritative Credentials status before retrying. |
| `invalid_grant` | The code is expired, replayed, redirected incorrectly, or does not match PKCE. | Discard the callback and start a completely new authorization transaction. |
| `invalid_scope` | A scope is unsupported or not approved for the client. | Request only the scopes listed by Integration diagnostics. |
| `access_denied` | The user declined login or Consent. | Return control to the user; retry only after another explicit user action. |
| `server_error` / `temporarily_unavailable` | The provider failed or is temporarily unavailable. | Wait, then begin a new transaction and retain only the request ID for support. |

Redirect URIs use exact trust matching. When the supplied redirect is absent or untrusted, MyDatum
returns an error directly instead of redirecting it to an attacker-controlled location. A safe retry
always generates new state, nonce, verifier, challenge, and authorization code; it never replays the
old callback. Credential rotation immediately invalidates the previous confidential secret, while a
disabled client rejects authorization and token exchange until an operator-approved recovery.
