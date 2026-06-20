import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../src/app.mjs";
import { loadConfig } from "../src/config.mjs";

const config = loadConfig({
  MYDATUM_ISSUER: "https://auth.staging.mydatum.ai",
  MYDATUM_CLIENT_ID: "client-123",
  MYDATUM_CLIENT_SECRET: "browser-must-never-see-this",
  MYDATUM_REDIRECT_URI: "http://127.0.0.1:3000/auth/callback",
  SESSION_SECRET: "test-session-secret-at-least-32-characters",
});

test("health and anonymous session responses contain no credentials", async (context) => {
  const server = createApp({ config }).listen(0, "127.0.0.1");
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: "ok" });
  const response = await fetch(`${base}/session`);
  const body = await response.text();
  assert.equal(response.status, 401);
  assert.equal(body.includes(config.clientSecret), false);
  assert.equal(body.includes("access_token"), false);
});

test("landing page presents an accessible MyDatum sign-in action", async (context) => {
  const server = createApp({ config }).listen(0, "127.0.0.1");
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, />Sign in with MyDatum<\/a>/);
  assert.equal(body.includes(config.clientSecret), false);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});

test("login requires state nonce and PKCE S256", async (context) => {
  let authorizationParameters;
  const oidc = {
    discovery: async () => ({ discovered: true }),
    randomPKCECodeVerifier: () => "verifier",
    randomState: () => "state",
    randomNonce: () => "nonce",
    calculatePKCECodeChallenge: async () => "challenge",
    buildAuthorizationUrl: (_provider, parameters) => {
      authorizationParameters = parameters;
      return new URL("https://auth.staging.mydatum.ai/o/authorize");
    },
  };
  const server = createApp({ config, oidc }).listen(0, "127.0.0.1");
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/login`, { redirect: "manual" });
  assert.equal(response.status, 302);
  assert.equal(authorizationParameters.state, "state");
  assert.equal(authorizationParameters.nonce, "nonce");
  assert.equal(authorizationParameters.code_challenge, "challenge");
  assert.equal(authorizationParameters.code_challenge_method, "S256");
  assert.equal(JSON.stringify(authorizationParameters).includes(config.clientSecret), false);
});
