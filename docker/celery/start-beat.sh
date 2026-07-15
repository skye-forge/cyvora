#!/usr/bin/env bash
set -euo pipefail
exec celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler