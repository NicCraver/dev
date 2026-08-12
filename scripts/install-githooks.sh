#!/usr/bin/env bash
# 启用仓库 Git hooks（push 后自动部署）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

chmod +x .githooks/post-push
chmod +x .vite-hooks/post-push

HOOKS_DIR="$(git rev-parse --git-path hooks)"
if [ -f "$HOOKS_DIR/h" ]; then
  # Vite+ 接管了 hooksPath：在其目录下补 post-push shim
  printf '#!/usr/bin/env sh\n. "$(dirname "$0")/h"\n' > "$HOOKS_DIR/post-push"
  chmod +x "$HOOKS_DIR/post-push"
  echo "已启用 Git hooks：Vite+ shim（core.hooksPath=$(git config core.hooksPath)）"
else
  git config core.hooksPath .githooks
  echo "已启用 Git hooks：core.hooksPath=.githooks"
fi

echo "  push 到 origin/main 后将自动执行 pnpm deploy"
echo ""
echo "跳过单次部署：MT_DEV_SKIP_DEPLOY=1 git push"
echo "关闭 hooks：git config --unset core.hooksPath"
