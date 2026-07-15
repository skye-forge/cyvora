#!/usr/bin/env bash
set -euo pipefail
exec celery -A core worker -l info