const [issuerArg, originArg] = process.argv.slice(2);

if (!issuerArg || !originArg) {
  console.error("Usage: node scripts/verify-oidc-cors.mjs <issuer> <browser-origin>");
  process.exit(2);
}

const issuer = issuerArg.replace(/\/$/, "");
const origin = new URL(originArg).origin;

async function requireCors(response, label) {
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  if (response.headers.get("access-control-allow-origin") !== origin) {
    throw new Error(`${label} did not allow the exact browser origin`);
  }
  if (response.headers.has("access-control-allow-credentials")) {
    throw new Error(`${label} unexpectedly allowed browser credentials`);
  }
}

const discovery = await fetch(`${issuer}/.well-known/openid-configuration`, {
  headers: { Accept: "application/json", Origin: origin },
});
await requireCors(discovery, "OIDC discovery");

const metadata = await discovery.json();
const preflight = await fetch(metadata.token_endpoint, {
  method: "OPTIONS",
  headers: {
    Origin: origin,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
  },
});
await requireCors(preflight, "Token preflight");
if (!(preflight.headers.get("access-control-allow-methods") || "").includes("POST")) {
  throw new Error("Token preflight did not allow POST");
}

console.log(`OIDC browser CORS verified for ${origin}`);
