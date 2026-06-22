# MyDatum Partner login: React, TypeScript, and Django

This full-stack confidential starter uses React with TypeScript for the UI and Django as a
backend-for-frontend. Django performs OIDC discovery and Authorization Code + PKCE S256, stores OAuth
tokens in its database-backed session, and exposes only safe account fields to React.

## Run locally

1. Register a confidential Partner application with callback `http://127.0.0.1:5173/auth/callback`.
2. In `backend/`, create a virtual environment, install `requirements.txt`, and set
   `MYDATUM_ISSUER`, `MYDATUM_CLIENT_ID`, `MYDATUM_CLIENT_SECRET`, `MYDATUM_REDIRECT_URI`,
   `MYDATUM_SCOPES`, `DJANGO_SECRET_KEY`, and `DJANGO_DEBUG=true`.
3. Start Django:

```sh
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py test
python manage.py runserver 127.0.0.1:8000
```

4. In a second terminal, start the Vite frontend:

```sh
cd frontend
npm ci
npm test
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies login, callback, and API requests to Django, retaining a
same-origin browser contract. React never reads the client secret or OAuth tokens.

From the repository root, run `docker compose --profile react-django up --build -d`, register
`http://127.0.0.1:8080/auth/callback`, and open `http://127.0.0.1:8080`. The multi-stage image builds
React and serves it with the API from Django on one origin.

SQLite and Django's database session store are local-development defaults. For production, use
durable protected stores, HTTPS, `DJANGO_DEBUG=false`, and an explicit allowed-host list. Use the
exact issuer plus opaque pairwise `sub` as the identity; email is optional and mutable.
