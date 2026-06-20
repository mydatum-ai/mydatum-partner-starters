import express from "express";
import session from "express-session";
import * as defaultOidc from "openid-client";

import { publicProfile, safeError, validateClaims } from "./security.mjs";

const regenerate = (request) => new Promise((resolve, reject) => request.session.regenerate((error) => error ? reject(error) : resolve()));
const destroy = (request) => new Promise((resolve, reject) => request.session.destroy((error) => error ? reject(error) : resolve()));
const loginPage = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Partner sign in</title><style>body{font:16px system-ui;margin:0;background:#f4f7f5;color:#10221d}main{max-width:34rem;margin:12vh auto;padding:2rem;border:1px solid #cad8d2;border-radius:1rem;background:#fff}a{display:inline-block;padding:.75rem 1rem;border-radius:.5rem;background:#086b55;color:#fff;font-weight:700;text-decoration:none}a:focus{outline:3px solid #52d5ad;outline-offset:3px}.note{color:#52645e}</style></head>
<body><main><p class="note">MYDATUM PARTNER STARTER</p><h1>Sign in to the partner app</h1><p>Use your MyDatum account. The partner app receives only approved scopes after Consent.</p><p><a href="/login">Sign in with MyDatum</a></p><p class="note">OAuth tokens and the client secret remain on this server.</p></main></body></html>`;

export function createApp({ config, oidc = defaultOidc, store } = {}) {
  if (!config) throw new Error("createApp requires validated configuration");
  const app = express();
  let discovered;
  const provider = () => discovered ||= oidc.discovery(config.issuer, config.clientId, config.clientSecret);

  app.disable("x-powered-by");
  app.use((_request, response, next) => {
    response.set({
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
    next();
  });
  app.use(session({
    name: "partner_session",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: { httpOnly: true, sameSite: "lax", secure: config.production, maxAge: 60 * 60 * 1000 },
  }));

  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.get("/", (_request, response) => response.type("html").send(loginPage()));

  app.get("/login", async (request, response, next) => {
    try {
      const verifier = oidc.randomPKCECodeVerifier();
      const transaction = {
        state: oidc.randomState(),
        nonce: oidc.randomNonce(),
        verifier,
        createdAt: Date.now(),
      };
      request.session.oauth = transaction;
      const url = oidc.buildAuthorizationUrl(await provider(), {
        redirect_uri: config.redirectUri.href,
        scope: config.scopes.join(" "),
        response_type: "code",
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
        code_challenge_method: "S256",
        state: transaction.state,
        nonce: transaction.nonce,
      });
      response.redirect(url.href);
    } catch (error) { next(error); }
  });

  app.get("/auth/callback", async (request, response, next) => {
    const transaction = request.session.oauth;
    delete request.session.oauth;
    try {
      if (!transaction || Date.now() - transaction.createdAt > 10 * 60 * 1000) throw new Error("expired transaction");
      const currentUrl = new URL(request.originalUrl, config.redirectUri.origin);
      const tokens = await oidc.authorizationCodeGrant(await provider(), currentUrl, {
        pkceCodeVerifier: transaction.verifier,
        expectedState: transaction.state,
        expectedNonce: transaction.nonce,
      });
      const claims = validateClaims(tokens.claims(), transaction, config);
      const authenticated = { profile: publicProfile(claims, config), tokens };
      await regenerate(request);
      request.session.authenticated = authenticated;
      response.redirect("/session");
    } catch (error) { next(error); }
  });

  app.get("/session", (request, response) => {
    if (!request.session.authenticated) return response.status(401).json({ authenticated: false });
    return response.json({ authenticated: true, profile: request.session.authenticated.profile });
  });

  app.post("/logout", async (request, response, next) => {
    try {
      await destroy(request);
      response.clearCookie("partner_session");
      response.status(204).end();
    } catch (error) { next(error); }
  });

  app.use((error, _request, response, _next) => {
    console.error("Partner authentication failed", { type: error?.name || "Error" });
    response.status(400).json(safeError(error));
  });
  return app;
}
