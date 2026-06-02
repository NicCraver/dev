#!/usr/bin/env bash
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
DEPLOY_PUBLIC_URL="${DEPLOY_PUBLIC_URL:-https://env.nextdev.cc}"
DEPLOY_HEALTH_URL="${DEPLOY_HEALTH_URL:-${DEPLOY_PUBLIC_URL}/api/health}"

SSH=(ssh -p "${DEPLOY_SSH_PORT}" -o ConnectTimeout=30 "${DEPLOY_USER}@${DEPLOY_HOST}")
RSYNC_SSH="ssh -p ${DEPLOY_SSH_PORT} -o ConnectTimeout=30"
SCP=(scp -P "${DEPLOY_SSH_PORT}" -o ConnectTimeout=30)

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
IMAGE_TAR="/tmp/mt-dev-images.tar.gz"

echo "==> 检查 SSH (${DEPLOY_USER}@${DEPLOY_HOST})"
"${SSH[@]}" 'echo "SSH OK — $(hostname)"'
"${SSH[@]}" 'docker info >/dev/null 2>&1 || { echo "ERROR: 无法访问 Docker"; exit 1; }'

REMOTE_ARCH="$("${SSH[@]}" 'uname -m')"
case "${REMOTE_ARCH}" in
  x86_64) DEPLOY_PLATFORM="linux/amd64" ;;
  aarch64|arm64) DEPLOY_PLATFORM="linux/arm64" ;;
  *) DEPLOY_PLATFORM="linux/amd64" ;;
esac
echo "==> 远程架构: ${REMOTE_ARCH} → ${DEPLOY_PLATFORM}"

export PATH="${HOME}/.vite-plus/bin:${PATH}"

echo "==> 本地构建 Web"
pnpm --filter @mt-dev/web run build

echo "==> 同步代码"
rsync -avz --delete \
  -e "${RSYNC_SSH}" \
  --exclude node_modules --exclude .git \
  --exclude apps/web/node_modules --exclude apps/api/node_modules \
  --exclude '.env.deploy' --exclude '.env.deploy.ssh' --exclude 'apps/api/.env' \
  ./ "${REMOTE}/"

USE_LOCAL_BUILD=false
if docker info >/dev/null 2>&1; then
  USE_LOCAL_BUILD=true
fi

if [[ "${USE_LOCAL_BUILD}" == true ]]; then
  echo "==> 本地构建镜像 (${DEPLOY_PLATFORM}) 并上传（绕过服务器 Docker 代理）"
  DOCKER_DEFAULT_PLATFORM="${DEPLOY_PLATFORM}" docker compose build
  docker save mt-dev-api:latest mt-dev-web:latest | gzip > "${IMAGE_TAR}"
  "${SCP[@]}" "${IMAGE_TAR}" "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/mt-dev-images.tar.gz"
  rm -f "${IMAGE_TAR}"
  REMOTE_UP='gunzip -c /tmp/mt-dev-images.tar.gz | docker load && rm -f /tmp/mt-dev-images.tar.gz && docker compose up -d --no-build'
else
  echo "==> 本地 Docker 不可用，在服务器构建（需能拉取镜像）"
  REMOTE_UP='docker compose build && docker compose up -d'
fi

echo "==> 远程启动容器"
"${SSH[@]}" bash -s <<EOF
set -euo pipefail
cd "${DEPLOY_PATH}"

if [[ ! -f apps/api/.env ]]; then
  cp -n apps/api/.env.example apps/api/.env || true
fi
grep -q '^PM2_ENABLED=' apps/api/.env 2>/dev/null || echo 'PM2_ENABLED=true' >> apps/api/.env

export DEPLOY_UID="\$(id -u)"
export DEPLOY_GID="\$(id -g)"
export DEPLOY_HOME="\${HOME}"
export DEPLOY_PM2_HOME="\${HOME}/.pm2"
export DEPLOY_WEB_PORT="${DEPLOY_WEB_PORT}"
export PM2_ENABLED=true

${REMOTE_UP}
docker compose ps
EOF

PUBLIC_IP="$("${SSH[@]}" "curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || true")"

echo ""
echo "==> 健康检查"
sleep 5
HEALTH_OK=false
if curl -fsS --connect-timeout 10 "${DEPLOY_HEALTH_URL}" 2>/dev/null; then
  HEALTH_OK=true
elif "${SSH[@]}" "curl -fsS --connect-timeout 5 http://127.0.0.1:${DEPLOY_WEB_PORT}/api/health"; then
  HEALTH_OK=true
fi

if [[ "${HEALTH_OK}" == true ]]; then
  echo ""
  echo "Done. 部署成功 → ${DEPLOY_PUBLIC_URL}"
  echo "  内网: http://${DEPLOY_HOST}:${DEPLOY_WEB_PORT}"
  [[ -n "${PUBLIC_IP}" ]] && echo "  DNS:  env.nextdev.cc  A  ${PUBLIC_IP}"
  echo "  Nginx: sudo cp ${DEPLOY_PATH}/scripts/nginx/mt-dev.conf.example /etc/nginx/conf.d/mt-dev.conf && sudo nginx -t && sudo systemctl reload nginx"
else
  echo "WARN: 健康检查失败。ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'cd ${DEPLOY_PATH} && docker compose logs --tail=80'"
fi
