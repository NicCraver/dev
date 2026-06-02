/** PM2 — 自动用 nvm 的 Node 22，不改动系统默认 node */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function resolveNode22() {
  const base = path.join(os.homedir(), ".nvm/versions/node");
  try {
    const versions = fs
      .readdirSync(base)
      .filter((v) => v.startsWith("v22."))
      .sort();
    if (versions.length > 0) {
      return path.join(base, versions.at(-1), "bin/node");
    }
  } catch {
    /* nvm 未安装或目录不存在 */
  }
  return "node";
}

module.exports = {
  apps: [
    {
      name: "mt-dev-api",
      cwd: "./apps/api",
      script: "src/index.ts",
      interpreter: resolveNode22(),
      interpreter_args: "--experimental-strip-types",
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 6333,
        PM2_ENABLED: "true",
      },
    },
    // 生产 Web 由 Nginx 托管静态 dist + 反代 /api（见 scripts/nginx/mt-dev.conf.example）。
    // 无 Nginx 时可手动：pm2 start scripts/serve-web.mjs --name mt-dev-web
  ],
};
