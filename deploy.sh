#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
config_file="${project_root}/fly.toml"
dry_run=false

usage() {
  cat <<'HELP'
Uso: ./deploy.sh [--dry-run]

Publica o TASS exclusivamente no app existente definido em fly.toml.
Executa testes, lint, build, fly deploy e verifica a página publicada.

  --dry-run  mostra o destino e as etapas, sem publicar
  -h, --help mostra esta ajuda
HELP
}
fail() { echo "erro: $*" >&2; exit 1; }

for argument in "$@"; do
  case "${argument}" in
    --dry-run) dry_run=true ;;
    -h|--help) usage; exit 0 ;;
    *) fail "opção desconhecida: ${argument}" ;;
  esac
done

for dependency in node npm curl; do
  command -v "${dependency}" >/dev/null 2>&1 || fail "comando obrigatório não encontrado: ${dependency}"
done
if command -v fly >/dev/null 2>&1; then
  fly_command=fly
elif command -v flyctl >/dev/null 2>&1; then
  fly_command=flyctl
else
  fail "instale a CLI do Fly.io e execute fly auth login"
fi
[[ -f "${config_file}" ]] || fail "fly.toml não encontrado"
cd "${project_root}"

config_json="$("${fly_command}" config show --local --config "${config_file}")"
app_name="$(printf '%s' "${config_json}" | node -e '
  const fs = require("node:fs");
  const config = JSON.parse(fs.readFileSync(0, "utf8"));
  if (!/^[a-z0-9][a-z0-9-]*$/.test(config.app || "")) throw new Error("App inválido em fly.toml.");
  if (config.env?.TASS_DB_PATH !== "/data/tass-db.json" ||
      !config.mounts?.some(mount => mount.source === "tass_data" && mount.destination === "/data")) {
    throw new Error("Preserve TASS_DB_PATH=/data/tass-db.json e o volume tass_data montado em /data.");
  }
  process.stdout.write(config.app);
')"

site_url="https://${app_name}.fly.dev"
echo "Destino: ${app_name} (${site_url})"
if "${dry_run}"; then
  echo "Etapas: validar configuração e máquina existente; npm test -- --run; npm run lint; npm run build."
  echo "Publicação: ${fly_command} deploy --app ${app_name} --config ${config_file} --remote-only --ha=false --yes"
  echo "Verificação: ${site_url}/ e status do app."
  exit 0
fi

"${fly_command}" config validate --config "${config_file}"
machines_json="$("${fly_command}" machine list --app "${app_name}" --json)"
printf '%s' "${machines_json}" | node -e '
  const fs = require("node:fs");
  const machines = JSON.parse(fs.readFileSync(0, "utf8"));
  if (!Array.isArray(machines) || machines.length !== 1) {
    throw new Error("O banco JSON requer uma única máquina existente. Confira fly machine list antes de publicar.");
  }
  if (!machines[0].config?.mounts?.some(mount => mount.name === "tass_data" && mount.path === "/data")) {
    throw new Error("A máquina existente precisa preservar o volume tass_data em /data.");
  }
'

npm test -- --run
npm run lint
npm run build

"${fly_command}" deploy --app "${app_name}" --config "${config_file}" --remote-only --ha=false --yes
curl --fail --silent --show-error --location --retry 8 --retry-delay 3 \
  --retry-connrefused --max-time 30 --output /dev/null "${site_url}/?deploy=$(date +%s)"
"${fly_command}" status --app "${app_name}"
echo "TASS publicado e acessível em ${site_url}/"
