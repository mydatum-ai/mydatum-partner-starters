import { createApp } from "../src/app.mjs";
import { loadConfig } from "../src/config.mjs";

const config = loadConfig({
  MYDATUM_ISSUER: "https://auth.staging.mydatum.ai",
  MYDATUM_CLIENT_ID: "start-check",
  MYDATUM_CLIENT_SECRET: "not-a-real-secret",
  MYDATUM_REDIRECT_URI: "http://127.0.0.1:3000/auth/callback",
  SESSION_SECRET: "start-check-only-session-secret-000000",
  NODE_ENV: "test",
  PORT: "0",
});
const server = createApp({ config }).listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const { port } = server.address();
const response = await fetch(`http://127.0.0.1:${port}/health`);
if (!response.ok || (await response.json()).status !== "ok") process.exitCode = 1;
await new Promise((resolve) => server.close(resolve));
