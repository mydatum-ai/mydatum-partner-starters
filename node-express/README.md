# MyDatum Partner login: Node.js and Express

This confidential server-side reference uses `openid-client`, Authorization Code with PKCE S256,
state, and nonce. The browser receives only the application session cookie; OAuth tokens and the
client secret stay in the server-side session store.

## Run locally

1. Create a confidential Partner application with callback
   `http://127.0.0.1:3000/auth/callback`.
2. Copy `.env.example` to `.env` and export those values through your shell or secret manager.
   Node does not load `.env` automatically in this deliberately minimal sample.
3. Use `openid` for private sign-in. Add `email` only if the feature needs it and handle an absent
   email claim.
4. Run `npm ci`, `npm test`, then `npm start`.
5. Open `http://127.0.0.1:3000/` and select **Sign in with MyDatum**.

From the repository root, `docker compose --profile node up --build -d` loads the root `.env`
automatically. The note above about exporting values applies only to the native `npm start` workflow.

If Partner generated a different loopback port, set `PORT` and `MYDATUM_REDIRECT_URI` to that
exact registered value. `localhost` and `127.0.0.1` are different OAuth redirect hosts.

The default in-memory session store is development-only. Pass a production `express-session`
store to `createApp`, use HTTPS, keep `NODE_ENV=production`, and rotate both secrets before launch.
The `/logout` route clears the local session because MyDatum does not currently advertise an OIDC
end-session endpoint.

The stable local account identifier is a hash of issuer, client ID, and opaque `sub`. Do not infer a
MyDatum database ID or correlate subjects across clients. Errors return allowlisted OAuth codes and
never provider details, authorization codes, tokens, or secrets.

## Verification

```sh
npm ci
npm run lint
npm test
npm run start:check
```

For protocol behavior and shared terminology, see
[`../docs/oauth-pkce-quickstart.md`](../docs/oauth-pkce-quickstart.md).
