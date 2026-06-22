export type Account = { external_identity_key: string; subject: string; email: string | null; email_verified: boolean };
export type Session = { authenticated: boolean; account?: Account };

function cookie(name: string): string {
  return document.cookie.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

export async function getSession(): Promise<Session> {
  const response = await fetch("/api/account", { credentials: "same-origin" });
  if (response.status === 401) return { authenticated: false };
  if (!response.ok) throw new Error("Unable to load the application session");
  return response.json() as Promise<Session>;
}

export async function endSession(path: "/api/logout" | "/api/unlink"): Promise<void> {
  const response = await fetch(path, {
    method: "POST", credentials: "same-origin", headers: { "X-CSRFToken": decodeURIComponent(cookie("csrftoken")) },
  });
  if (!response.ok) throw new Error("Unable to end the application session");
}
