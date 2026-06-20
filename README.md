# MyDatum Partner Starters

Public, maintained reference applications for integrating **Sign in with MyDatum** through OAuth 2.1
Authorization Code flow and OpenID Connect.

## Choose a starter

| Starter | Client type | Use when |
| --- | --- | --- |
| [React public client](react-public/README.md) | Public + PKCE S256 | Building a low-risk browser application without a client secret |
| [Node.js and Express](node-express/README.md) | Confidential + PKCE S256 | Building a server application or backend-for-frontend in JavaScript |
| [Python and Django](django-server/README.md) | Confidential + PKCE S256 | Building a Python server application with protected sessions |

Each starter includes a working **Sign in with MyDatum** page, exact callback handling, maintained
OIDC libraries, redacted failures, deterministic tests, and environment templates containing
placeholders only.

## Start here

1. Register and provision an application in the MyDatum Partner console.
2. Choose a starter matching the application's public or confidential client type.
3. Follow its README and copy `.env.example` to a local `.env` that is excluded from Git.
4. Register the exact callback used by the starter. `localhost` and `127.0.0.1` are different hosts.
5. Start a fresh sign-in and verify the callback, token validation, account mapping, and local session.

Read the [OAuth + PKCE quickstart](docs/oauth-pkce-quickstart.md),
[integration contract](docs/integration-contract.md), [error guidance](docs/error-guidance.md), and
[production checklist](docs/production-checklist.md) before launch.

## Security boundary

- Public clients never use a client secret.
- Confidential secrets and OAuth tokens stay on the server.
- Use issuer plus opaque pairwise `sub` as the external identity key; never use email as the stable key.
- Request only approved scopes. MyDatum Consent remains the runtime data-sharing authority.
- Never place tokens, codes, verifiers, secrets, cookies, or complete claims in logs, URLs, browser
  persistence, screenshots, analytics, or support content.

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Releases and integrity

Tagged releases publish one source archive per starter plus `SHA256SUMS`. The machine-readable
[catalogue](catalogue.json) records compatibility and source integrity. Verify an archive before use
and retain the starter version in your deployment records.

## License and trademarks

Licensed under the [Apache License 2.0](LICENSE). The license does not grant permission to use
MyDatum names, logos, or trademarks except as required to describe compatibility with MyDatum.
