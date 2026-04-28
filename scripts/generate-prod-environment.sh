#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${FIREBASE_PROD_ENV_FILE:-${REPO_ROOT}/.local/latarce-firebase-prod.env}"
TARGET_FILE="${TARGET_FILE:-${REPO_ROOT}/src/environments/environment.prod.ts}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "No existe el fichero de entorno: ${ENV_FILE}" >&2
  echo "Copia scripts/latarce-firebase-prod.env.example a .local/latarce-firebase-prod.env y complétalo." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

required_vars=(
  FIREBASE_API_KEY
  FIREBASE_AUTH_DOMAIN
  FIREBASE_PROJECT_ID
  FIREBASE_STORAGE_BUCKET
  FIREBASE_MESSAGING_SENDER_ID
  FIREBASE_APP_ID
  FIREBASE_MEASUREMENT_ID
)

for variable_name in "${required_vars[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Falta la variable obligatoria ${variable_name} en ${ENV_FILE}" >&2
    exit 1
  fi
done

cat > "${TARGET_FILE}" <<EOF
export const environment = {
  production: true,
  appId: 'cards-397007',
  firebase: {
    apiKey: '${FIREBASE_API_KEY}',
    authDomain: '${FIREBASE_AUTH_DOMAIN}',
    projectId: '${FIREBASE_PROJECT_ID}',
    storageBucket: '${FIREBASE_STORAGE_BUCKET}',
    messagingSenderId: '${FIREBASE_MESSAGING_SENDER_ID}',
    appId: '${FIREBASE_APP_ID}',
    measurementId: '${FIREBASE_MEASUREMENT_ID}'
  },
  openAICredentials: {
    apiKey: '',
    organization: ''
  }
};
EOF

echo "Generated ${TARGET_FILE} from ${ENV_FILE}"
