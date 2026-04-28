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

if [[ "${REMOTE_PATH}" == "/" && "${ALLOW_REMOTE_ROOT_CLEAN:-no}" != "yes" ]]; then
  echo "REMOTE_PATH='/' requiere ALLOW_REMOTE_ROOT_CLEAN='yes' para evitar borrados accidentales." >&2
  exit 1
fi

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

remote_directory_exists() {
  local remote_path="$1"
  local listing
  listing="$(curl_ftps --list-only "$(remote_url "${remote_path%/}/")" 2>/dev/null | trim_cr || true)"
  [[ -n "${listing}" ]] || curl_ftps "$(remote_url "${remote_path%/}/")" >/dev/null 2>&1
}

remote_delete_recursive() {
  local remote_path="$1"
  local normalized_path="${remote_path%/}"
  local entries=()
  local entry=""
  local child_path=""

  while IFS= read -r entry; do
    [[ -z "${entry}" ]] && continue
    [[ "${entry}" == "." || "${entry}" == ".." ]] && continue
    entries+=("${entry}")
  done < <(remote_list "${normalized_path}/" || true)

  if [[ ${#entries[@]} -eq 0 ]]; then
    return 0
  fi

  for entry in "${entries[@]}"; do
    child_path="${normalized_path}/${entry}"

    if remote_directory_exists "${child_path}"; then
      remote_delete_recursive "${child_path}"
      echo "Removing remote directory ${child_path}"
      curl_ftps --quote "RMD ${child_path}" "$(remote_url "/")" >/dev/null
    else
      echo "Removing remote file ${child_path}"
      curl_ftps --quote "DELE ${child_path}" "$(remote_url "/")" >/dev/null
    fi
  done
}

ensure_remote_directory() {
  local remote_path="$1"
  curl_ftps --ftp-create-dirs "$(remote_url "${remote_path%/}/")" >/dev/null 2>&1 || true
}

upload_dist() {
  local local_file=""
  local relative_file=""
  local remote_file=""

  while IFS= read -r local_file; do
    relative_file="${local_file#"${DIST_DIR}/"}"
    remote_file="${REMOTE_PATH%/}/${relative_file}"
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
remote_delete_recursive "${REMOTE_PATH}"
upload_dist
echo "FTPS deployment finished."
