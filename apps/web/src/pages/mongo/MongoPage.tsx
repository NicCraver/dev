import { Database01Icon } from "@hugeicons/core-free-icons";

import { Pm2UnlockGate } from "@/components/pm2/Pm2UnlockGate";
import { MongoEmptyState } from "@/components/mongo/MongoEmptyState";
import { useMongoPageAccess } from "@/hooks/useMongoPageAccess";

import { MongoPageContent } from "./MongoPageContent";

export function MongoPage() {
  const { status, loading, unlocked, unlockError, unlock, lock } = useMongoPageAccess();

  if (loading && !status) {
    return <div className="text-muted-foreground p-6 text-sm">加载中…</div>;
  }

  if (!status?.configured) {
    return (
      <MongoEmptyState
        icon={Database01Icon}
        title="MongoDB 未配置"
        description={status?.message ?? "请在 API 环境设置 MONGODB_URI"}
        className="flex-1"
      />
    );
  }

  if (status.pagePasswordRequired && !unlocked) {
    return (
      <Pm2UnlockGate
        title="Mongo 数据编辑"
        description="请输入访问密码以继续（与 PM2 共用）"
        error={unlockError}
        onUnlock={unlock}
      />
    );
  }

  return (
    <MongoPageContent
      databaseName={status.databaseName}
      onLock={lock}
      pagePasswordRequired={status.pagePasswordRequired}
    />
  );
}
