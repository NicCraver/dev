import { useState } from "react";

import { ProcessDetail } from "@/components/pm2/ProcessDetail";
import { ProcessList } from "@/components/pm2/ProcessList";
import { LogViewer } from "@/components/pm2/LogViewer";
import { Pm2SettingsDialog } from "@/components/pm2/Pm2SettingsDialog";
import { StartProcessDialog } from "@/components/pm2/StartProcessDialog";
import { Button } from "@/components/ui/button";
import { usePm2Data } from "@/hooks/usePm2Data";

type Pm2PageContentProps = {
  onLock: () => void;
  pagePasswordRequired: boolean;
};

function isAuthError(message: string | null): boolean {
  if (!message) return false;
  return message.includes("未授权") || message.includes("401") || message.includes("Token");
}

function isPagePasswordError(message: string | null): boolean {
  if (!message) return false;
  return message.includes("页面密码");
}

export function Pm2PageContent({ onLock, pagePasswordRequired }: Pm2PageContentProps) {
  const {
    status,
    processes,
    selectedPmId,
    setSelectedPmId,
    detail,
    loading,
    error,
    acting,
    refetch,
    runAction,
    saveDump,
    maybeAutoSave,
  } = usePm2Data();

  const [startOpen, setStartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  if (!status.daemonReachable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
        <p className="text-sm font-medium">PM2 daemon 不可达</p>
        <p className="text-muted-foreground text-sm">请先在本机执行 pm2 ping 或 pm2 resurrect</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border/50 px-4 py-3">
        <h1 className="text-sm font-semibold">PM2 进程管理</h1>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => setStartOpen(true)}>
            新增进程
          </Button>
          <Button size="sm" variant="outline" onClick={() => void saveDump()} disabled={acting}>
            保存 PM2 列表
          </Button>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            刷新
          </Button>
          {pagePasswordRequired && (
            <Button size="sm" variant="ghost" onClick={onLock}>
              锁定
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
            设置
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/10 text-destructive flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
          <span>{error}</span>
          {isPagePasswordError(error) && (
            <Button size="sm" variant="outline" className="h-7" onClick={onLock}>
              重新验证
            </Button>
          )}
          {isAuthError(error) && (
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => setSettingsOpen(true)}
            >
              打开设置
            </Button>
          )}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
        <ProcessList processes={processes} selectedPmId={selectedPmId} onSelect={setSelectedPmId} />
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
          <ProcessDetail detail={detail} acting={acting} onAction={runAction} />
          <LogViewer pmId={selectedPmId} />
        </div>
      </div>

      <StartProcessDialog
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onSuccess={async (pmId) => {
          await maybeAutoSave();
          await refetch();
          if (pmId > 0) setSelectedPmId(pmId);
        }}
      />
      <Pm2SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
