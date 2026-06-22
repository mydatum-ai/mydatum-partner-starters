import time
from unittest.mock import Mock, patch
from django.http import HttpResponseRedirect
from django.test import TestCase, override_settings

ISSUER, CLIENT_ID = "https://auth.staging.mydatum.ai", "confidential-client"

@override_settings(DEBUG=True, SECURE_SSL_REDIRECT=False, MYDATUM_ISSUER=ISSUER, MYDATUM_CLIENT_ID=CLIENT_ID, MYDATUM_CLIENT_SECRET="server-only-secret", MYDATUM_REDIRECT_URI="http://127.0.0.1:8000/auth/callback")
class LoginTests(TestCase):
    def claims(self): return {"iss": ISSUER, "aud": CLIENT_ID, "exp": int(time.time()) + 300, "nonce": "expected-nonce", "sub": "opaque-subject"}

    def test_anonymous_api_is_safe(self):
        response = self.client.get("/api/account")
        self.assertEqual(response.status_code, 401); self.assertNotContains(response, "server-only-secret", status_code=401)
        self.assertIn("csrftoken", response.cookies)

    @patch("authentication.views.provider")
    def test_login_uses_pkce(self, provider_mock):
        provider_mock.return_value.authorize_redirect.return_value = HttpResponseRedirect("https://auth.example/authorize")
        self.client.get("/login")
        arguments = provider_mock.return_value.authorize_redirect.call_args.kwargs
        self.assertEqual(arguments["code_challenge_method"], "S256"); self.assertTrue(arguments["nonce"])

    @patch("authentication.views.provider")
    def test_callback_keeps_tokens_server_side(self, provider_mock):
        session = self.client.session; session["pkce_verifier"] = "verifier"; session["oidc_nonce"] = "expected-nonce"; session.save()
        provider_mock.return_value.authorize_access_token.return_value = {"access_token": "never-in-browser", "userinfo": self.claims()}
        self.assertRedirects(self.client.get("/auth/callback?code=one-time"), "/", fetch_redirect_response=False)
        response = self.client.get("/api/account")
        self.assertEqual(response.status_code, 200); self.assertNotContains(response, "never-in-browser")

    def test_logout_requires_csrf(self):
        csrf_client = self.client_class(enforce_csrf_checks=True)
        self.assertEqual(csrf_client.post("/api/logout").status_code, 403)
