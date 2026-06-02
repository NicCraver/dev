#!/usr/bin/env bash
# 启用仓库 Git hooks（push 后自动部署）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

chmod +x .githooks/post-push
git config core.hooksPath .githooks

echo "已启用 Git hooks：core.hooksPath=.githooks"
echo "  push 到 origin/main 后将自动执行 pnpm deploy"
echo ""
echo "跳过单次部署：MT_DEV_SKIP_DEPLOY=1 git push"
echo "关闭 hooks：git config --unset core.hooksPath"
