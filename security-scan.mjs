import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname);
const scanRoots = [
  resolve(import.meta.dirname, "starters/express/src"),
  resolve(import.meta.dirname, "starters/react/src"),
  resolve(import.meta.dirname, "starters/django/authentication"),
  resolve(import.meta.dirname, "starters/react-typescript-django/frontend/src"),
  resolve(import.meta.dirname, "starters/react-typescript-django/backend/authentication"),
].filter(existsSync);
const allowedExtensions = new Set([".js", ".mjs", ".ts", ".tsx", ".py", ".html"]);
const forbidden = [
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /(?:access|refresh|id)_token\s*[:=]\s*["'][A-Za-z0-9_-]{24,}["']/i,
  /client_secret\s*[:=]\s*["'][A-Za-z0-9_-]{24,}["']/i,
];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

for (const path of scanRoots.flatMap(files).filter((path) => allowedExtensions.has(extname(path)))) {
  const contents = readFileSync(path, "utf8");
  for (const pattern of forbidden) assert.doesNotMatch(contents, pattern, `${relative(root, path)} matched ${pattern}`);
}

const publicBrowserSource = readFileSync(resolve(import.meta.dirname, "starters/react/src/auth.ts"), "utf8");
assert.doesNotMatch(publicBrowserSource, /localStorage|client_secret|CLIENT_SECRET/);
const catalogue = readFileSync(resolve(root, "catalogue.json"), "utf8");
assert.doesNotMatch(catalogue, /(?:access|refresh|id)_token\s*[=:]\s*["'][A-Za-z0-9_-]{24,}["']/i);
assert.doesNotMatch(catalogue, /client_secret\s*[=:]\s*["'][A-Za-z0-9_-]{24,}["']/i);
console.log(`Partner security scan passed (${scanRoots.length} roots)`);
