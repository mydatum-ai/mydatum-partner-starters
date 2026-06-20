import time
from unittest.mock import Mock, patch

from django.http import HttpResponseRedirect
from django.test import TestCase, override_settings

from .security import (
    external_identity_key,
    public_account,
    validate_claims,
    validate_userinfo_subject,
)

ISSUER = "https://auth.staging.mydatum.ai"
CLIENT_ID = "confidential-client"


@override_settings(
    DEBUG=True,
    SECURE_SSL_REDIRECT=False,
    MYDATUM_ISSUER=ISSUER,
    MYDATUM_CLIENT_ID=CLIENT_ID,
    MYDATUM_CLIENT_SECRET="server-only-secret",
    MYDATUM_REDIRECT_URI="http://127.0.0.1:8000/auth/callback",
    MYDATUM_SCOPES="openid",
)
class PartnerLoginTests(TestCase):
    def claims(self, **changes):
        value = {
            "iss": ISSUER,
            "aud": CLIENT_ID,
            "exp": int(time.time()) + 300,
            "nonce": "expected-nonce",
            "sub": "opaque-pairwise-subject",
        }
        value.update(changes)
        return value

    def test_health_and_anonymous_account_are_safe(self):
        self.assertEqual(self.client.get("/health").json(), {"status": "ok"})
        response = self.client.get("/account")
        self.assertEqual(response.status_code, 401)
        self.assertNotIn("server-only-secret", response.content.decode())

    def test_home_page_presents_mydatum_sign_in_without_credentials(self):
        response = self.client.get("/")
        self.assertContains(response, "Sign in with MyDatum")
        self.assertContains(response, 'href="/login"')
        self.assertNotContains(response, "server-only-secret")

    def test_claim_validation_fails_closed(self):
        validate_claims(self.claims(), issuer=ISSUER, client_id=CLIENT_ID, nonce="expected-nonce")
        for changed in (
            {"iss": "https://attacker.invalid"},
            {"aud": "wrong"},
            {"exp": 1},
            {"nonce": "wrong"},
            {"sub": ""},
        ):
            with self.assertRaises(ValueError):
                validate_claims(
                    self.claims(**changed),
                    issuer=ISSUER,
                    client_id=CLIENT_ID,
                    nonce="expected-nonce",
                )

    def test_userinfo_subject_must_match(self):
        validate_userinfo_subject(self.claims(), {"sub": "opaque-pairwise-subject"})
        with self.assertRaises(ValueError):
            validate_userinfo_subject(self.claims(), {"sub": "different"})

    def test_optional_email_is_not_an_identity_key(self):
        first = public_account(self.claims(), ISSUER)
        second = public_account(self.claims(email="changed@example.test"), ISSUER)
        self.assertEqual(first["external_identity_key"], second["external_identity_key"])
        self.assertIsNone(first["email"])
        self.assertNotEqual(
            external_identity_key(ISSUER, "opaque-pairwise-subject"),
            external_identity_key(ISSUER, "other-subject"),
        )

    @patch("partner_login.views.provider")
    def test_login_requests_nonce_and_pkce_s256(self, provider_mock):
        client = Mock()
        client.authorize_redirect.return_value = HttpResponseRedirect(
            "https://auth.example/authorize"
        )
        provider_mock.return_value = client

        self.client.get("/login")

        arguments = client.authorize_redirect.call_args.kwargs
        self.assertEqual(arguments["code_challenge_method"], "S256")
        self.assertTrue(arguments["code_challenge"])
        self.assertTrue(arguments["nonce"])

    @patch("partner_login.views.provider")
    def test_signature_failure_is_redacted(self, provider_mock):
        session = self.client.session
        session["pkce_verifier"] = "verifier"
        session["oidc_nonce"] = "expected-nonce"
        session.save()
        provider_mock.return_value.authorize_access_token.side_effect = ValueError(
            "invalid signature: token-and-secret-details"
        )

        response = self.client.get("/auth/callback?code=sensitive-code&state=expected")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "authentication_failed"})
        self.assertNotIn("token-and-secret-details", response.content.decode())

    @patch("partner_login.views.provider")
    def test_callback_rotates_session_and_keeps_tokens_server_side(self, provider_mock):
        session = self.client.session
        session["pkce_verifier"] = "verifier"
        session["oidc_nonce"] = "expected-nonce"
        session.save()
        old_key = session.session_key
        client = Mock()
        client.authorize_access_token.return_value = {
            "access_token": "never-in-browser",
            "userinfo": self.claims(),
        }
        provider_mock.return_value = client

        response = self.client.get("/auth/callback?code=one-time&state=expected")
        self.assertEqual(response.status_code, 302)
        self.assertNotEqual(self.client.session.session_key, old_key)
        account_response = self.client.get("/account")
        self.assertNotIn("never-in-browser", account_response.content.decode())
        replay = self.client.get("/auth/callback?code=one-time&state=expected")
        self.assertEqual(replay.status_code, 400)
        self.assertEqual(replay.json(), {"error": "authentication_failed"})

    def test_production_cookie_flags_are_secure(self):
        from django.conf import settings

        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertEqual(settings.SESSION_COOKIE_SAMESITE, "Lax")
