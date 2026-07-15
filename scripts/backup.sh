#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="${POSTGRES_DB:-varnis_db}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Backing up database '${POSTGRES_DB:-varnis_db}' to ${BACKUP_DIR}/${FILENAME}..."

PGPASSWORD="${POSTGRES_PASSWORD:-var_p@ssw0rd}" pg_dump \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:-varnis_user}" \
  -d "${POSTGRES_DB:-varnis_db}" \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup complete: ${BACKUP_DIR}/${FILENAME}"

ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --