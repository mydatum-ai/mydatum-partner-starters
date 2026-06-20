import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const examplesRoot = resolve(import.meta.dirname);
const cataloguePath = resolve(examplesRoot, "catalogue.json");
const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const excludedDirectories = new Set(["node_modules", "dist", ".venv", "__pycache__", ".pytest_cache"]);
const excludedFiles = new Set([".env", "db.sqlite3", ".DS_Store"]);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
    if (entry.isFile() && (excludedFiles.has(entry.name) || entry.name.endsWith(".tsbuildinfo"))) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

function checksum(directory) {
  const digest = createHash("sha256");
  for (const path of sourceFiles(directory).sort()) {
    digest.update(relative(directory, path).split(sep).join("/"));
    digest.update("\0");
    digest.update(readFileSync(path, "utf8").replaceAll("\r\n", "\n"));
    digest.update("\0");
  }
  return digest.digest("hex");
}

assert.equal(catalogue.length, 3, "The supported starter catalogue must contain three entries");
assert.equal(new Set(catalogue.map((item) => item.id)).size, catalogue.length, "Starter IDs must be unique");
for (const item of catalogue) {
  assert.match(item.id, /^[a-z0-9-]+$/);
  assert.match(item.version, /^\d+\.\d+\.\d+$/);
  assert.ok(["public", "confidential"].includes(item.clientType));
  assert.ok(["supported", "deprecated", "withdrawn"].includes(item.status));
  assert.equal(item.callbackPath, "/auth/callback");
  assert.match(item.sourceDirectory, /^starters\/[a-z0-9-]+$/, "Source directory must be a starter path");
  assert.match(item.sourceUrl, /^https:\/\/github\.com\/mydatum-ai\/mydatum-partner-starters\//);
  assert.match(item.documentationUrl, /^https:\/\/github\.com\/mydatum-ai\/mydatum-partner-starters\//);
  assert.equal(item.releaseUrl, "https://github.com/mydatum-ai/mydatum-partner-starters/releases");
  const directory = resolve(examplesRoot, item.sourceDirectory);
  assert.ok(directory.startsWith(`${examplesRoot}${sep}`) && existsSync(directory), `Missing ${item.sourceDirectory}`);
  const actual = checksum(directory);
  if (process.argv.includes("--print")) console.log(`${item.id} ${actual}`);
  else assert.equal(item.checksumSha256, actual, `${item.id} checksum is stale`);
}

if (!process.argv.includes("--print")) console.log(`Partner starter catalogue passed (${catalogue.length} entries)`);
