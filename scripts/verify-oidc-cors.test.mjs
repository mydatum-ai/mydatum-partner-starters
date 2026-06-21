import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("OIDC CORS verifier checks discovery and token preflight", async () => {
  const browserOrigin = "http://127.0.0.1:4173";
  const server = createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", browserOrigin);
    response.setHeader("Vary", "Origin");
    if (request.method === "OPTIONS") {
      response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "content-type");
      response.end();
      return;
    }
    const { port } = server.address();
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ token_endpoint: `http://127.0.0.1:${port}/o/token` }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const result = await new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        [fileURLToPath(new URL("./verify-oidc-cors.mjs", import.meta.url)), `http://127.0.0.1:${port}`, browserOrigin],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (code) => resolve({ code, stdout, stderr }));
    });
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /OIDC browser CORS verified/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
