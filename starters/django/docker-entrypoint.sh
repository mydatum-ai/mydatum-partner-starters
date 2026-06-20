#!/bin/sh
set -eu

python - <<'PY'
import os

required = ("MYDATUM_CLIENT_ID", "MYDATUM_CLIENT_SECRET", "DJANGO_SECRET_KEY")
for name in required:
    value = os.environ.get(name, "").strip()
    if not value or value.startswith("replace-with-"):
        raise SystemExit(f"Invalid {name}: replace the placeholder in the root .env file")
if len(os.environ["DJANGO_SECRET_KEY"]) < 50:
    raise SystemExit("DJANGO_SECRET_KEY must contain at least 50 characters")
PY

python manage.py migrate --noinput
exec "$@"
