# Contributing

Open an issue before proposing a new framework or protocol behavior. Changes must preserve the public
versus confidential client boundary, Authorization Code flow, PKCE S256, state and nonce validation,
discovery, opaque subject handling, least-privilege scopes, Consent authority, and redacted output.

Run the relevant starter's documented install, lint, test, and build/start checks. Also run:

```sh
node catalogue-check.mjs
node security-scan.mjs
```

When changing container behavior, also create a root `.env` with non-production test credentials and
run `node scripts/compose-smoke.mjs react node django`. This builds all images, verifies their HTTP
health, and removes the test containers.

Never commit `.env`, credentials, OAuth artifacts, cookies, private keys, personal data, dependency
directories, build output, local databases, or editor/OS caches. Contributions are licensed under
Apache-2.0.
