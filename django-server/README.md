# MyDatum Partner login: Django server

This confidential server-side example uses Authlib discovery and OIDC validation with state, nonce,
and PKCE S256. The client secret and tokens remain in Django's database-backed session; browser
responses contain only the application session cookie and optional display claims.

## Run locally

1. Register a confidential Partner application with callback
   `http://127.0.0.1:8000/auth/callback`.
2. Create and activate a virtual environment, install `requirements.txt`, and export the values from
   `.env.example` through your shell or secret manager. The sample deliberately does not parse `.env`.
3. Keep scopes at `openid` for private sign-in. Add `email` only when the product needs it.
4. Run the database migration and server:

```sh
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py test
python manage.py runserver 127.0.0.1:8000
```

Visit `/` and select **Sign in with MyDatum**, inspect the safe account view at `/account`, and POST to `/logout` to clear the local
session. POST `/unlink` to remove the sample's local link and session; a real application must also
delete its persisted external-identity row. MyDatum currently advertises no end-session or revocation
endpoint, so these operations do not terminate the upstream MyDatum session.

The local identity key combines the exact issuer and opaque pairwise `sub`. Email is optional and
mutable; never use it as the account key, infer a MyDatum database ID, or correlate subjects between
clients. For production, set `DJANGO_DEBUG=false`, serve HTTPS, use a durable protected session store,
and apply CSRF protection to logout/unlink UI forms.

If Partner generated a different loopback port, run Django on that port and keep
`MYDATUM_REDIRECT_URI` exactly aligned. `localhost` and `127.0.0.1` are different OAuth redirect hosts.
