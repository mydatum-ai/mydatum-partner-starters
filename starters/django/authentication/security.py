import hashlib
import hmac
import time


def pkce_challenge(verifier: str) -> str:
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    import base64

    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def validate_claims(claims, *, issuer, client_id, nonce, now=None):
    now = int(time.time()) if now is None else now
    if claims.get("iss") != issuer.rstrip("/"):
        raise ValueError("issuer validation failed")
    audience = claims.get("aud", [])
    audience = [audience] if isinstance(audience, str) else audience
    if client_id not in audience:
        raise ValueError("audience validation failed")
    if not isinstance(claims.get("exp"), int) or claims["exp"] <= now:
        raise ValueError("expiry validation failed")
    if not hmac.compare_digest(str(claims.get("nonce", "")), nonce):
        raise ValueError("nonce validation failed")
    if not claims.get("sub"):
        raise ValueError("subject validation failed")
    return claims


def validate_userinfo_subject(id_claims, userinfo):
    if userinfo and not hmac.compare_digest(str(id_claims["sub"]), str(userinfo.get("sub", ""))):
        raise ValueError("userinfo subject validation failed")


def external_identity_key(issuer: str, subject: str) -> str:
    return hashlib.sha256(f"{issuer.rstrip('/')}\0{subject}".encode()).hexdigest()


def public_account(claims, issuer):
    return {
        "external_identity_key": external_identity_key(issuer, claims["sub"]),
        "subject": claims["sub"],
        "email": claims.get("email"),
        "email_verified": claims.get("email_verified") is True,
    }
