import vm from "node:vm";

import type { Pm2EcosystemAppPreview } from "@mt-dev/shared";

type EcosystemExport = {
  apps?: unknown;
};

function validateApp(raw: unknown, index: number): Pm2EcosystemAppPreview {
  if (!raw || typeof raw !== "object") {
    throw new Error(`apps[${index}] 必须是对象`);
  }
  const app = raw as Record<string, unknown>;
  const name = app.name;
  const script = app.script;
  if (typeof name !== "string" || !name.trim()) {
    throw new Error(`apps[${index}].name 必填`);
  }
  if (typeof script !== "string" || !script.trim()) {
    throw new Error(`apps[${index}].script 必填`);
  }
  return {
    name: name.trim(),
    script: script.trim(),
    cwd: typeof app.cwd === "string" ? app.cwd : undefined,
  };
}

function extractApps(exported: EcosystemExport): Pm2EcosystemAppPreview[] {
  if (!exported || typeof exported !== "object") {
    throw new Error("配置必须导出 { apps: [...] }");
  }
  if (!Array.isArray(exported.apps) || exported.apps.length === 0) {
    throw new Error("apps 必须是非空数组");
  }
  return exported.apps.map(validateApp);
}

export function parseEcosystemContent(content: string): Pm2EcosystemAppPreview[] {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("内容不能为空");

  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as EcosystemExport;
    return extractApps(parsed);
  }

  const sandbox: { module: { exports: EcosystemExport }; exports: EcosystemExport } = {
    module: { exports: {} },
    exports: {},
  };
  sandbox.exports = sandbox.module.exports;

  const wrapped = trimmed
    .replace(/^\s*export\s+default\s+/m, "module.exports = ")
    .replace(/^\s*module\.exports\s*=\s*/m, "module.exports = ");

  vm.runInNewContext(wrapped, sandbox, {
    filename: "ecosystem.config.js",
    timeout: 1000,
  });

  return extractApps(sandbox.module.exports);
}

export function findAppsByName(
  apps: Pm2EcosystemAppPreview[],
  names?: string[],
): Pm2EcosystemAppPreview[] {
  if (!names || names.length === 0) return apps;
  const set = new Set(names);
  const matched = apps.filter((a) => set.has(a.name));
  if (matched.length === 0) {
    throw new Error(`未找到名为 ${names.join(", ")} 的 app`);
  }
  return matched;
}
