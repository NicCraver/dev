#!/usr/bin/env bash
# 兼容旧命令：已改为 Docker 部署
exec "$(dirname "$0")/deploy-docker.sh" "$@"
