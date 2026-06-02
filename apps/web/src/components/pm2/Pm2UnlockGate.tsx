import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Pm2UnlockGateProps = {
  error: string | null;
  onUnlock: (password: string) => Promise<void>;
};

const inputClassName = cn(
  "w-full max-w-xs rounded-lg border border-border/60 bg-white px-3 py-2 text-sm",
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-zinc-950",
);

export function Pm2UnlockGate({ error, onUnlock }: Pm2UnlockGateProps) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    try {
      await onUnlock(password);
    } catch {
      /* error shown via props */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="w-full max-w-sm rounded-xl border border-border/50 bg-white/50 p-6 dark:bg-zinc-950/30">
        <h1 className="text-base font-semibold">PM2 进程管理</h1>
        <p className="text-muted-foreground mt-1 text-sm">请输入访问密码以继续</p>

        <form className="mt-5 flex flex-col gap-3" onSubmit={(e) => void handleSubmit(e)}>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="访问密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
            autoFocus
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={submitting || !password.trim()}>
            {submitting ? "验证中…" : "进入"}
          </Button>
        </form>
      </div>
    </div>
  );
}
