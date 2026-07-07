#!/bin/bash
# packages/db/sql/001_roles.sh
#
# Wrapper to apply 001_roles.sql with psql variable substitution.
# Mounted into docker-entrypoint-initdb.d by docker-compose.yml.
#
# The SQL file uses psql :var syntax (:app_role_password, :ops_password)
# so it contains no plaintext credentials. This shell script passes the
# passwords from the container environment variables.
#
# Requires APP_ROLE_PASSWORD and OPS_PASSWORD env vars to be set in
# docker-compose.yml (or the calling environment).
set -euo pipefail

psql -v ON_ERROR_STOP=1 \
  --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" \
  -v app_role_password="${APP_ROLE_PASSWORD:?APP_ROLE_PASSWORD env var must be set}" \
  -v ops_password="${OPS_PASSWORD:?OPS_PASSWORD env var must be set}" \
  -f /sql/001_roles.sql