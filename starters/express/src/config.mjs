function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required setting: ${name}`);
  if (value.startsWith("replace-with-")) {
    throw new Error(`Invalid ${name}: replace the placeholder before starting`);
  }
  return value;
}

export function loadConfig(env = process.env) {
  const issuer = new URL(required(env, "MYDATUM_ISSUER"));
  const redirectUri = new URL(required(env, "MYDATUM_REDIRECT_URI"));
  const sessionSecret = required(env, "SESSION_SECRET");
  const scopes = (env.MYDATUM_SCOPES || "openid").trim().split(/\s+/);

  if (!scopes.includes("openid")) throw new Error("MYDATUM_SCOPES must include openid");
  if (sessionSecret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  if (issuer.protocol !== "https:" && issuer.hostname !== "127.0.0.1" && issuer.hostname !== "localhost") {
    throw new Error("MYDATUM_ISSUER must use HTTPS outside local development");
  }

  return Object.freeze({
    issuer,
    clientId: required(env, "MYDATUM_CLIENT_ID"),
    clientSecret: required(env, "MYDATUM_CLIENT_SECRET"),
    redirectUri,
    scopes,
    sessionSecret,
    port: Number(env.PORT || 3000),
    host: env.HOST || "127.0.0.1",
    production: env.NODE_ENV === "production",
  });
}
