import { randomBytes } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, ".env");
const force = process.argv.includes("--force");

try {
  if (!force) await readFile(target, "utf8").then(() => { throw new Error(".env already exists; use --force to replace it"); });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await copyFile(resolve(root, ".env.example"), target);
let contents = await readFile(target, "utf8");
contents = contents
  .replace("replace-with-at-least-32-random-characters", randomBytes(32).toString("base64url"))
  .replaceAll("replace-with-at-least-50-random-characters", () => randomBytes(48).toString("base64url"));
await writeFile(target, contents);
console.log("Created .env with random local session secrets. Add your MyDatum client credentials.");
