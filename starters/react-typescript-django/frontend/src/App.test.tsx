import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
test("offers server-side login to an anonymous user", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 401 }));
  render(<App />);
  expect(await screen.findByRole("link", { name: "Sign in with MyDatum" })).toHaveAttribute("href", "/login");
});
test("renders only the safe account response", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ authenticated: true, account: { external_identity_key: "key", subject: "opaque-sub", email: null, email_verified: false } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  render(<App />);
  await waitFor(() => expect(screen.getByText("opaque-sub")).toBeInTheDocument());
  expect(document.body).not.toHaveTextContent("never-in-browser");
});
