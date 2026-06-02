declare module "pm2" {
  export interface Pm2Env {
    pm_id?: number;
    status?: string;
    pm_uptime?: number;
    restart_time?: number;
    pm_exec_path?: string;
    pm_cwd?: string;
    args?: string[];
    exec_mode?: string;
    instances?: number;
    env?: Record<string, unknown>;
    pm_out_log_path?: string;
    pm_err_log_path?: string;
  }

  export interface Proc {
    name?: string;
    pid?: number;
    pm2_env?: Pm2Env;
    monit?: { cpu?: number; memory?: number };
  }

  export type ProcessDescription = Proc;

  export interface StartOptions {
    script: string;
    name: string;
    cwd?: string;
    args?: string[];
    env?: Record<string, string>;
    instances?: number;
  }

  export interface LogPacket {
    process?: { pm_id?: number };
    data?: string;
  }

  export interface Pm2Bus {
    on(event: "log:out" | "log:err", listener: (packet: LogPacket) => void): void;
    off(event: "log:out" | "log:err", listener: (packet: LogPacket) => void): void;
  }

  interface Pm2 {
    connect(cb: (err: Error | null) => void): void;
    list(cb: (err: Error | null, list: Proc[]) => void): void;
    describe(id: number, cb: (err: Error | null, desc: ProcessDescription[]) => void): void;
    restart(id: number, cb: (err: Error | null, proc: Proc) => void): void;
    stop(id: number, cb: (err: Error | null, proc: Proc) => void): void;
    start(options: StartOptions, cb: (err: Error | null, proc: Proc | Proc[]) => void): void;
    dump(cb: (err: Error | null) => void): void;
    launchBus(cb: (err: Error | null, bus: Pm2Bus) => void): void;
  }

  const pm2: Pm2;
  export default pm2;
}
