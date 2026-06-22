import { useEffect, useState } from "react";
import { endSession, getSession, type Session } from "./api";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { getSession().then(setSession).catch(() => setError("Unable to load your session.")); }, []);

  async function signOut() {
    setError("");
    try { await endSession("/api/logout"); setSession({ authenticated: false }); }
    catch { setError("Unable to sign out. Please try again."); }
  }

  return <main><section className="card" aria-labelledby="title">
    <p className="eyebrow">MYDATUM PARTNER REFERENCE</p>
    <h1 id="title">React + TypeScript + Django</h1>
    <p>Django handles OAuth and keeps tokens server-side. React receives only safe account fields.</p>
    {error && <div className="error" role="alert">{error}</div>}
    {!session ? <p aria-live="polite">Loading session…</p> : session.authenticated && session.account ? <div className="profile">
      <h2>Signed in</h2><dl><dt>Opaque subject</dt><dd>{session.account.subject}</dd><dt>Email</dt><dd>{session.account.email ?? "Not shared"}</dd></dl>
      <button type="button" onClick={signOut}>Sign out locally</button>
    </div> : <a className="button" href="/login">Sign in with MyDatum</a>}
    <p className="note">The browser holds only an HTTP-only application session cookie, not OAuth tokens.</p>
  </section></main>;
}
