import { InMemoryWebStorage, UserManager, WebStorageStateStore, type User } from "oidc-client-ts";

export type PublicConfig = Readonly<{
  authority: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}>;

export type PublicEnv = Readonly<{
  VITE_MYDATUM_ISSUER?: string;
  VITE_MYDATUM_CLIENT_ID?: string;
  VITE_MYDATUM_REDIRECT_URI?: string;
  VITE_MYDATUM_SCOPES?: string;
}>;

export function readPublicConfig(env: PublicEnv): PublicConfig {
  const authority = env.VITE_MYDATUM_ISSUER?.replace(/\/$/, "");
  const clientId = env.VITE_MYDATUM_CLIENT_ID;
  const redirectUri = env.VITE_MYDATUM_REDIRECT_URI;
  const scope = env.VITE_MYDATUM_SCOPES || "openid";
  if (!authority || !clientId || !redirectUri) throw new Error("Public MyDatum configuration is incomplete");
  if (!scope.split(/\s+/).includes("openid")) throw new Error("Scopes must include openid");
  return Object.freeze({ authority, clientId, redirectUri, scope });
}

export function createUserManager(config: PublicConfig): UserManager {
  return new UserManager({
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    automaticSilentRenew: false,
    monitorSession: false,
    userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage, prefix: "mydatum.tx." }),
  });
}

export function safeUser(user: User) {
  return {
    subject: user.profile.sub,
    email: typeof user.profile.email === "string" ? user.profile.email : null,
    emailVerified: user.profile.email_verified === true,
  };
}

export function clearCallbackUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export function safeError(error: unknown): string {
  const value = error as { error?: string };
  if (value?.error === "access_denied") return "Sign-in was cancelled.";
  return "Sign-in could not be completed. Please try again.";
}
