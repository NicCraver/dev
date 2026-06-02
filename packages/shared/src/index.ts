export type HealthResponse = {
  status: "ok";
};

export type DevDashModuleId = "o5-env" | "zhiyou-env" | "aichat-env" | "tools" | "pm2";

export * from "./o5-env.js";
export * from "./pm2.js";
