#!/usr/bin/env bash
# 快速部署：本地构建 + rsync + PM2（~1–2 分钟，无 Docker 镜像构建/传输）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.deploy.ssh ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.deploy.ssh
  set +a
fi

DEPLOY_HOST="${DEPLOY_HOST:-env.lif3ng.cn}"
DEPLOY_USER="${DEPLOY_USER:-lifeng}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/lifeng/mt-dev}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
DEPLOY_WEB_PORT="${DEPLOY_WEB_PORT:-51611}"
DEPLOY_LAN_IP="${DEPLOY_LAN_IP:-192.168.5.46}"
DEPLOY_PUBLIC_URL="${DEPLOY_PUBLIC_URL:-http://${DEPLOY_LAN_IP}:${DEPLOY_WEB_PORT}}"
DEPLOY_HEALTH_URL="${DEPLOY_HEALTH_URL:-${DEPLOY_PUBLIC_URL}/api/health}"

SSH=(ssh -p "${DEPLOY_SSH_PORT}" -o ConnectTimeout=30 "${DEPLOY_USER}@${DEPLOY_HOST}")
RSYNC_SSH="ssh -p ${DEPLOY_SSH_PORT} -o ConnectTimeout=30"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

echo "==> SSH ${DEPLOY_USER}@${DEPLOY_HOST}"
"${SSH[@]}" 'echo "OK — $(hostname)"'

export PATH="${HOME}/.vite-plus/bin:${PATH}"

echo "==> 本地构建 Web (~10s)"
pnpm --filter @mt-dev/web run build

echo "==> 同步到服务器"
rsync -avz --delete \
  -e "${RSYNC_SSH}" \
  --exclude node_modules \
  --exclude .git \
  --exclude apps/web/node_modules \
  --exclude apps/api/node_modules \
  --exclude '.env.deploy' \
  --exclude '.env.deploy.ssh' \
  --exclude 'apps/api/.env' \
  ./ "${REMOTE}/"

echo "==> 远程安装依赖 & PM2 重启"
"${SSH[@]}" bash -s <<EOF
set -euo pipefail
cd "${DEPLOY_PATH}"

export NVM_DIR="\${HOME}/.nvm"
# shellcheck disable=SC1091
[[ -s "\${NVM_DIR}/nvm.sh" ]] && source "\${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || nvm use 24 >/dev/null 2>&1 || { echo "ERROR: 需要 nvm Node 22+"; exit 1; }
echo "Node: \$(node -v)"
corepack disable 2>/dev/null || true
if ! command -v pnpm >/dev/null 2>&1 || pnpm -v 2>&1 | grep -q corepack; then
  npm install -g pnpm@11 --force
fi
echo "pnpm: \$(pnpm -v)"

if [[ ! -f apps/api/.env ]]; then
  cp -n apps/api/.env.example apps/api/.env || true
fi
if grep -q '^PM2_ENABLED=' apps/api/.env 2>/dev/null; then
  sed -i 's|^PM2_ENABLED=.*|PM2_ENABLED=true|' apps/api/.env
else
  echo 'PM2_ENABLED=true' >> apps/api/.env
fi
if [[ -n "${PM2_PAGE_PASSWORD:-}" ]]; then
  if grep -q '^PM2_PAGE_PASSWORD=' apps/api/.env 2>/dev/null; then
    sed -i "s|^PM2_PAGE_PASSWORD=.*|PM2_PAGE_PASSWORD=${PM2_PAGE_PASSWORD}|" apps/api/.env
  else
    echo "PM2_PAGE_PASSWORD=${PM2_PAGE_PASSWORD}" >> apps/api/.env
  fi
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pnpm install --frozen-lockfile --filter @mt-dev/api... --ignore-scripts

pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
pm2 list
EOF

PUBLIC_IP="$("${SSH[@]}" "curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || true")"

echo ""
echo "==> 健康检查"
sleep 2
HEALTH_OK=false
if "${SSH[@]}" "curl -fsS --connect-timeout 5 '${DEPLOY_HEALTH_URL}'" 2>/dev/null; then
  HEALTH_OK=true
elif "${SSH[@]}" "curl -fsS --connect-timeout 5 http://127.0.0.1/api/health -H 'Host: env.nextdev.cc'" 2>/dev/null; then
  HEALTH_OK=true
elif "${SSH[@]}" "curl -fsS --connect-timeout 5 http://127.0.0.1:${DEPLOY_WEB_PORT}/api/health" 2>/dev/null; then
  HEALTH_OK=true
elif "${SSH[@]}" "curl -fsS http://127.0.0.1:6333/api/health" 2>/dev/null; then
  echo "API 正常；Web 未通 → 检查 Nginx：sudo nginx -t && sudo nginx -s reload"
fi

if [[ "${HEALTH_OK}" == true ]]; then
  echo ""
  echo "Done → ${DEPLOY_PUBLIC_URL}"
  echo "  域名: http://env.nextdev.cc（需 Nginx + DNS）"
  echo "  内网: http://${DEPLOY_LAN_IP}:${DEPLOY_WEB_PORT}（51611 可配置为跳转）"
  [[ -n "${PUBLIC_IP}" ]] && echo "  公网 IP: ${PUBLIC_IP}"
else
  echo "WARN: 检查失败 → ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'pm2 logs mt-dev-api --lines 30'"
fi
