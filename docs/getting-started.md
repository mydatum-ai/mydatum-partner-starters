# Build a project with Sign in with MyDatum

This guide takes a new partner from MyDatum registration to a working local application. MyDatum
operates the identity provider, login, Consent, and claims. You operate your application, repository,
accounts, sessions, authorization, hosting, and data handling.

## 1. Register your partner organisation

1. Sign in to the MyDatum Partner console at `https://auth.mydatum.ai/partner`.
2. Register your organisation and complete its legal name, website, and support contact.
3. Submit the organisation for verification.
4. Wait until an authorized MyDatum operator marks it as verified.

Application review and provisioning require a verified organisation. Partner owners and admins manage
provisioning; MyDatum staff perform organisation, application, and scope reviews.

## 2. Create a sandbox application

Create a new application in the verified organisation and select **Sandbox**. Choose an application
type that matches the code you intend to run:

| Your project | Partner client | Starter |
| --- | --- | --- |
| React or another browser-only application | Public client with PKCE; no secret | [`react-public`](../react-public/) |
| Node.js server or backend-for-frontend | Confidential client with PKCE | [`node-express`](../node-express/) |
| Python server application | Confidential client with PKCE | [`django-server`](../django-server/) |

Add the exact local callback used by your project. Scheme, host, port, path, and trailing slash must
match exactly. For example:

```text
http://127.0.0.1:3000/auth/callback
```

`localhost` and `127.0.0.1` are different OAuth hosts. Register the value your application actually
uses; do not alternate between them.

Submit the application for review. After a MyDatum operator approves it, an organisation owner or
admin provisions the OAuth client. Copy the generated client ID. A public client receives no secret.
A confidential client displays its secret once; transfer it directly to a server-side secret manager.

## 3. Request only the scopes you need

Use `openid` as the least-privilege sign-in baseline. Request optional scopes such as `email` only when
your feature requires them, explain the user-facing purpose, and wait for approval. Scope approval
makes data requestable; the user still decides at runtime through MyDatum Consent.

Treat issuer plus the opaque pairwise `sub` claim as the stable external account key. Email is optional
and mutable and must not be used as the account identifier.

## 4. Create your application repository

Clone this repository and copy only the starter matching your client type into your project:

```sh
git clone --depth 1 https://github.com/mydatum-ai/mydatum-partner-starters.git
cp -R mydatum-partner-starters/react-public my-partner-app
cd my-partner-app
git init
```

Replace `react-public` with `node-express` or `django-server` when appropriate. When distributing a
derived starter, retain the Apache-2.0 license and applicable notice from this repository. Do not copy
the original repository's `.git` directory into your application repository.

## 5. Configure both sides with the same values

The callback registered in Partner and the callback configured in your project must be identical.
Use the issuer, client ID, approved scopes, and redirect shown by your application's Integration page.
Do not guess endpoint URLs; the starter resolves them through OIDC discovery.

Public React example:

```env
VITE_MYDATUM_ISSUER=https://auth.mydatum.ai
VITE_MYDATUM_CLIENT_ID=partner-app-replace-me
VITE_MYDATUM_REDIRECT_URI=http://127.0.0.1:4173/auth/callback
VITE_MYDATUM_SCOPES=openid
```

Confidential Node or Django example:

```env
MYDATUM_ISSUER=https://auth.mydatum.ai
MYDATUM_CLIENT_ID=partner-app-replace-me
MYDATUM_CLIENT_SECRET=insert-through-your-server-secret-manager
MYDATUM_REDIRECT_URI=http://127.0.0.1:3000/auth/callback
MYDATUM_SCOPES=openid
```

Copy `.env.example` to `.env`, keep `.env` excluded from Git, and follow the selected starter README
for its session secret and local port settings. Never put a confidential secret in React, browser
source, mobile bundles, committed files, screenshots, logs, or support messages.

## 6. Run and test the complete login

Install dependencies and start the selected starter using its README. Open its landing page and select
**Sign in with MyDatum**. A successful test must prove the complete partner-side flow:

1. The application creates one-time state, nonce, and PKCE values.
2. The browser navigates to MyDatum login and Consent.
3. MyDatum returns to the exact registered callback.
4. The application validates state and exchanges the one-time code.
5. The OIDC library validates signature, issuer, audience, expiry, and nonce.
6. The application links issuer plus `sub` to a local account and creates its own session.

The sandbox launcher in Partner proves authorization and Consent routing, but it deliberately discards
the code. Testing through your actual starter is what proves callback, token, account, and session code.

For every retry, begin a fresh sign-in. Never replay an authorization code. Also test cancellation,
invalid state, expired transactions, redirect mismatch, missing optional claims, and a disabled client.

## 7. Create a separate production application

Do not convert or reuse sandbox credentials for production. In Partner, create and review a separate
**Production** application with its real HTTPS callback. Configure the production deployment with its
own issuer value shown by Partner, client ID, secret, redirect, scopes, and session keys.

Before launch, complete the [production checklist](production-checklist.md). Never reuse sandbox client
IDs, secrets, loopback callbacks, session keys, test accounts, or evidence in production.
