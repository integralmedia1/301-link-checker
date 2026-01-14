#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${SF_MEMORY:-}" && -z "${JAVA_OPTS:-}" ]]; then
  export JAVA_OPTS="-Xmx${SF_MEMORY}"
fi

if [[ -z "${SF_LICENSE_NAME:-}" || -z "${SF_LICENSE_KEY:-}" ]]; then
  echo "SF_LICENSE_NAME and SF_LICENSE_KEY are required" >&2
  exit 1
fi

# Apply license (idempotent)
screamingfrogseospider --license "${SF_LICENSE_NAME}" "${SF_LICENSE_KEY}"

exec "$@"
