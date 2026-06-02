export type Pm2ProcessStatus =
  | "online"
  | "stopped"
  | "stopping"
  | "launching"
  | "errored"
  | "one-launch-status";

export type Pm2ProcessSummary = {
  pmId: number;
  name: string;
  status: Pm2ProcessStatus | string;
  cpu: number;
  memory: number;
  uptime: number;
  pid: number;
  restartTime: number;
};

export type Pm2ProcessDetail = Pm2ProcessSummary & {
  script: string;
  cwd?: string;
  args?: string[];
  execMode?: string;
  instances?: number;
  env?: Record<string, string>;
};

export type Pm2StatusResponse = {
  enabled: boolean;
  authRequired: boolean;
  pagePasswordRequired: boolean;
  daemonReachable: boolean;
  message?: string;
};

export type Pm2UnlockRequest = {
  password: string;
};

export type Pm2UnlockResponse = {
  ok: true;
  unlockToken: string;
};

export type Pm2QuickStartRequest = {
  script: string;
  name: string;
  cwd?: string;
  args?: string[];
  env?: Record<string, string>;
  instances?: number;
};

export type Pm2EcosystemAppPreview = {
  name: string;
  script: string;
  cwd?: string;
};

export type Pm2EcosystemParseResponse = {
  apps: Pm2EcosystemAppPreview[];
};

export type Pm2EcosystemStartRequest = {
  content: string;
  appNames?: string[];
};

export type Pm2LogsResponse = {
  lines: string[];
};

export type Pm2SaveResponse = {
  ok: true;
};

export type Pm2ActionResponse = {
  ok: true;
  pmId: number;
};
