export type YapiDebugEnvId = "test" | "prod";

export type YapiDebugEnv = {
  id: YapiDebugEnvId;
  label: string;
  baseURL: string;
};

export const YAPI_DEBUG_ENVS: YapiDebugEnv[] = [
  { id: "test", label: "测试", baseURL: "http://192.168.10.25" },
  { id: "prod", label: "生产", baseURL: "https://zhixin.zhiguaniot.com" },
];

const ENV_KEY = "mt-dev:yapi-debug:env";

export function getDebugEnv(id: YapiDebugEnvId): YapiDebugEnv {
  return YAPI_DEBUG_ENVS.find((e) => e.id === id) ?? YAPI_DEBUG_ENVS[0]!;
}

export function loadDebugEnvId(): YapiDebugEnvId {
  try {
    const raw = localStorage.getItem(ENV_KEY);
    if (raw === "test" || raw === "prod") return raw;
  } catch {
    /* ignore */
  }
  return "test";
}

export function saveDebugEnvId(id: YapiDebugEnvId): void {
  try {
    localStorage.setItem(ENV_KEY, id);
  } catch {
    /* ignore */
  }
}
