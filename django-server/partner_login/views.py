import logging
import secrets

from authlib.integrations.django_client import OAuth
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET, require_POST

from .security import pkce_challenge, public_account, validate_claims, validate_userinfo_subject

logger = logging.getLogger("partner.auth")
oauth = OAuth()


def provider():
    required = {
        "MYDATUM_ISSUER": settings.MYDATUM_ISSUER,
        "MYDATUM_CLIENT_ID": settings.MYDATUM_CLIENT_ID,
        "MYDATUM_CLIENT_SECRET": settings.MYDATUM_CLIENT_SECRET,
        "MYDATUM_REDIRECT_URI": settings.MYDATUM_REDIRECT_URI,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise RuntimeError("Partner OIDC configuration is incomplete")
    return oauth.create_client("mydatum") or oauth.register(
        name="mydatum",
        client_id=settings.MYDATUM_CLIENT_ID,
        client_secret=settings.MYDATUM_CLIENT_SECRET,
        server_metadata_url=f"{settings.MYDATUM_ISSUER.rstrip('/')}/.well-known/openid-configuration",
        client_kwargs={"scope": settings.MYDATUM_SCOPES},
    )


def safe_failure(view):
    def wrapped(request, *args, **kwargs):
        try:
            return view(request, *args, **kwargs)
        except Exception as error:
            logger.warning(
                "Partner authentication failed", extra={"error_type": type(error).__name__}
            )
            return JsonResponse({"error": "authentication_failed"}, status=400)

    return wrapped


@require_GET
def health(_request):
    return JsonResponse({"status": "ok"})


@require_GET
def home(request):
    return render(request, "partner_login/home.html")


@require_GET
@safe_failure
def login(request):
    verifier = secrets.token_urlsafe(64)
    nonce = secrets.token_urlsafe(32)
    request.session["pkce_verifier"] = verifier
    request.session["oidc_nonce"] = nonce
    return provider().authorize_redirect(
        request,
        settings.MYDATUM_REDIRECT_URI,
        nonce=nonce,
        code_challenge=pkce_challenge(verifier),
        code_challenge_method="S256",
    )


@require_GET
@safe_failure
def callback(request):
    verifier = request.session.pop("pkce_verifier", "")
    nonce = request.session.pop("oidc_nonce", "")
    if not verifier or not nonce:
        raise ValueError("missing or replayed authorization transaction")
    token = provider().authorize_access_token(request, code_verifier=verifier)
    claims = validate_claims(
        token["userinfo"],
        issuer=settings.MYDATUM_ISSUER,
        client_id=settings.MYDATUM_CLIENT_ID,
        nonce=nonce,
    )
    validate_userinfo_subject(claims, token.get("userinfo"))
    request.session.cycle_key()
    request.session["account"] = public_account(claims, settings.MYDATUM_ISSUER)
    request.session["oidc_tokens"] = dict(token)
    return redirect("account")


@require_GET
def account(request):
    value = request.session.get("account")
    if not value:
        return JsonResponse({"authenticated": False}, status=401)
    return JsonResponse({"authenticated": True, "account": value})


@require_POST
def logout(request):
    request.session.flush()
    return JsonResponse({}, status=204)


@require_POST
def unlink(request):
    request.session.flush()
    return JsonResponse({"unlinked": True})
