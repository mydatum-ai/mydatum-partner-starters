# MyDatum Partner Starters

Public, maintained reference applications for integrating **Sign in with MyDatum** through OAuth 2.1
Authorization Code flow and OpenID Connect.

## Choose a starter

| Starter | Client type | Use when |
| --- | --- | --- |
| [React public client](starters/react/README.md) | Public + PKCE S256 | Building a low-risk browser application without a client secret |
| [Node.js and Express](starters/express/README.md) | Confidential + PKCE S256 | Building a server application or backend-for-frontend in JavaScript |
| [Python and Django](starters/django/README.md) | Confidential + PKCE S256 | Building a Python server application with protected sessions |

Each starter includes a working **Sign in with MyDatum** page, exact callback handling, maintained
OIDC libraries, redacted failures, deterministic tests, and environment templates containing
placeholders only.

All runnable applications live under [`starters/`](starters/). Each starter is self-contained and
uses conventional framework structure, so adopters can copy it unchanged instead of moving source
files out of repository-specific directories. Repository-wide automation remains at the root.

## Run with Docker Compose

Docker Desktop (or Docker Engine with Compose v2) runs the applications without local language
runtimes. If Node.js 20 or newer is available, create the root environment file and random local
session secrets with:

```sh
node scripts/init-env.mjs
```

Alternatively, copy `.env.example` to `.env` and replace both session-secret placeholders manually.
Add the provisioned client ID and, for a confidential client, client secret for the starter you want
to run. The containers deliberately reject unchanged credential placeholders.

Start one profile:

```sh
docker compose --profile react up --build -d
docker compose --profile node up --build -d
docker compose --profile django up --build -d
```

Open React at `http://127.0.0.1:4173`, Node at `http://127.0.0.1:3000`, or Django at
`http://127.0.0.1:8000`. Container startup proves the local application is healthy; a complete sign-in
also requires a provisioned MyDatum client whose registered callback exactly matches `.env`.
If a port is occupied, change its `*_PORT` value and its redirect URI in `.env`, then register that
exact redirect with MyDatum.

Use `docker compose --profile <name> logs -f` for logs and `docker compose --profile <name> down` to
stop it. Django migrations run automatically and its local SQLite data persists in a named volume;
add `--volumes` to `down` only when you intend to delete that data.

To build, start, probe, and stop one or more profiles in a single check, run:

```sh
node scripts/compose-smoke.mjs node
node scripts/compose-smoke.mjs react node django
```

## Start here

Follow the [end-to-end Partner getting-started guide](docs/getting-started.md). It covers organisation
verification, sandbox registration and approval, choosing and copying a starter, environment
configuration, local sign-in testing, and promotion to a separate production client.

Then read the [OAuth + PKCE quickstart](docs/oauth-pkce-quickstart.md),
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
