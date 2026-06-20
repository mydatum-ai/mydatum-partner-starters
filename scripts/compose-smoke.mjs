import { spawnSync } from "node:child_process";
import http from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const keep = process.argv.includes("--keep");
const requested = process.argv.slice(2).filter((value) => !value.startsWith("--"));
const profiles = requested.length ? requested : ["react", "node", "django"];
const known = new Set(["react", "node", "django"]);
if (profiles.some((profile) => !known.has(profile))) {
  throw new Error("Profiles must be react, node, or django");
}

const profileArgs = profiles.flatMap((profile) => ["--profile", profile]);
const compose = (...args) => spawnSync("docker", ["compose", ...profileArgs, ...args], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
  shell: process.platform === "win32",
});

const endpoints = {
  react: `http://127.0.0.1:${process.env.REACT_PORT || 4173}/`,
  node: `http://127.0.0.1:${process.env.NODE_PORT || 3000}/health`,
  django: `http://127.0.0.1:${process.env.DJANGO_PORT || 8000}/`,
};

async function waitFor(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const healthy = await new Promise((resolveRequest) => {
      const request = http.get(url, (response) => {
        response.resume();
        resolveRequest(response.statusCode >= 200 && response.statusCode < 400);
      });
      request.setTimeout(2_000, () => request.destroy());
      request.on("error", () => resolveRequest(false));
    });
    if (healthy) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let failed = false;
try {
  const up = compose("up", "--build", "-d");
  if (up.status !== 0) throw new Error("Docker Compose startup failed");
  await Promise.all(profiles.map((profile) => waitFor(endpoints[profile])));
  console.log(`Smoke test passed: ${profiles.join(", ")}`);
} catch (error) {
  failed = true;
  compose("logs", "--no-color");
  console.error(error.message);
} finally {
  if (!keep) compose("down");
}
if (failed) process.exit(1);
