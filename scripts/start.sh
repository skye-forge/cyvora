#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$SCRIPT_DIR/wait_for_db.sh"

echo "Applying database migrations..."
python manage.py migrate --noinput

if [ -n "${DJANGO_SUPERUSER_EMAIL:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  echo "Ensuring admin superuser exists..."
  python manage.py shell -c "from django.contrib.auth import get_user_model; import os; User=get_user_model(); email=os.environ.get('DJANGO_SUPERUSER_EMAIL'); password=os.environ.get('DJANGO_SUPERUSER_PASSWORD'); name=os.environ.get('DJANGO_SUPERUSER_NAME','Skyeforge'); user=User.objects.filter(email=email).first();
if not user:
    User.objects.create_superuser(email=email, password=password, name=name)
else:
    user.is_staff=True; user.is_superuser=True; user.role='system_admin'; user.name=name; user.save(update_fields=['is_staff','is_superuser','role','name'])"
fi

if [ "${DJANGO_SETTINGS_MODULE:-}" = "core.settings.production" ]; then
  echo "Collecting static files..."
  python manage.py collectstatic --noinput
fi

exec "$@"