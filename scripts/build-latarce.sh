#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_FILE="${REPO_ROOT}/src/environments/environment.prod.ts"
BACKUP_FILE="$(mktemp)"

cp "${TARGET_FILE}" "${BACKUP_FILE}"

restore_environment() {
  cp "${BACKUP_FILE}" "${TARGET_FILE}"
  rm -f "${BACKUP_FILE}"
}

trap restore_environment EXIT

bash "${SCRIPT_DIR}/generate-prod-environment.sh"
cd "${REPO_ROOT}"
ng build --configuration production
