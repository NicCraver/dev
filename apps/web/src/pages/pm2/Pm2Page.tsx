import { Pm2UnlockGate } from "@/components/pm2/Pm2UnlockGate";
import { usePm2PageAccess } from "@/hooks/usePm2PageAccess";

import { Pm2PageContent } from "./Pm2PageContent";

export function Pm2Page() {
  const { status, loading, unlocked, unlockError, unlock, lock } = usePm2PageAccess();

  if (loading && !status) {
    return <div className="text-muted-foreground p-6 text-sm">加载中…</div>;
  }

  if (!status?.enabled) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
        <p className="text-sm font-medium">PM2 模块未启用</p>
        <p className="text-muted-foreground text-sm">请在 API 环境设置 PM2_ENABLED=true</p>
      </div>
    );
  }

  if (status.pagePasswordRequired && !unlocked) {
    return <Pm2UnlockGate error={unlockError} onUnlock={unlock} />;
  }

  return <Pm2PageContent onLock={lock} pagePasswordRequired={status.pagePasswordRequired} />;
}
