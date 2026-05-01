#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${FTPS_ENV_FILE:-${REPO_ROOT}/.local/latarce-ftps.env}"
DIST_DIR="${DIST_DIR:-${REPO_ROOT}/dist/cards}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "No existe el fichero de entorno: ${ENV_FILE}" >&2
  echo "Copia scripts/latarce-ftps.env.example a .local/latarce-ftps.env y complétalo." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

required_vars=(FTP_USER FTP_PASS FTP_HOST FTP_PORT REMOTE_PATH)
for variable_name in "${required_vars[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Falta la variable obligatoria ${variable_name} en ${ENV_FILE}" >&2
    exit 1
  fi
done

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "No existe el directorio a desplegar: ${DIST_DIR}" >&2
  exit 1
fi

remote_url() {
  local remote_path="$1"
  printf 'ftp://%s:%s%s' "${FTP_HOST}" "${FTP_PORT}" "${remote_path}"
}

curl_ftps() {
  local curl_args=(
    --silent
    --show-error
    --fail
    --ftp-ssl-control
    --disable-epsv
    --user "${FTP_USER}:${FTP_PASS}"
  )

  if [[ "${FTP_CONTROL_ONLY_TLS:-no}" != "yes" ]]; then
    curl_args+=(--ssl-reqd)
  fi

  if [[ "${FTP_INSECURE:-no}" == "yes" ]]; then
    curl_args+=(--insecure)
  fi

  curl "${curl_args[@]}" "$@"
}

trim_cr() {
  tr -d '\r'
}

remote_list() {
  local remote_path="$1"
  curl_ftps --list-only "$(remote_url "${remote_path}")" | trim_cr
}

remote_size() {
  local remote_path="$1"
  local response=""

  response="$(curl_ftps --quote "SIZE ${remote_path}" "$(remote_url "/")" 2>/dev/null | trim_cr || true)"

  if [[ "${response}" =~ ^213[[:space:]]+([0-9]+)$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi

  return 1
}

remote_directory_exists() {
  local remote_path="$1"
  local listing
  listing="$(curl_ftps --list-only "$(remote_url "${remote_path%/}/")" 2>/dev/null | trim_cr || true)"
  [[ -n "${listing}" ]] || curl_ftps "$(remote_url "${remote_path%/}/")" >/dev/null 2>&1
}

ensure_remote_directory() {
  local remote_path="$1"
  curl_ftps --ftp-create-dirs "$(remote_url "${remote_path%/}/")" >/dev/null 2>&1 || true
}

upload_dist() {
  local local_file=""
  local relative_file=""
  local remote_file=""
  local local_size=""
  local current_remote_size=""

  while IFS= read -r local_file; do
    relative_file="${local_file#"${DIST_DIR}/"}"
    remote_file="${REMOTE_PATH%/}/${relative_file}"
    local_size="$(wc -c < "${local_file}" | tr -d '[:space:]')"

    if current_remote_size="$(remote_size "${remote_file}")" && [[ "${current_remote_size}" == "${local_size}" ]]; then
      echo "Skipping ${relative_file}"
      continue
    fi

    echo "Uploading ${relative_file}"
    curl_ftps \
      --ftp-create-dirs \
      --upload-file "${local_file}" \
      "$(remote_url "${remote_file}")" \
      >/dev/null
  done < <(find "${DIST_DIR}" -type f | sort)
}

echo "Preparing remote directory ${REMOTE_PATH}"
ensure_remote_directory "${REMOTE_PATH}"
upload_dist
echo "FTPS deployment finished."
