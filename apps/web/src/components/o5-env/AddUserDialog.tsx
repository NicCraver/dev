import { useState } from "react";

import { Button } from "@/components/ui/button";
import { addUserToEnv } from "@/lib/o5-env-api";
import { cn } from "@/lib/utils";

import { FormDialog } from "./FormDialog";

const inputClassName = cn(
  "w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm",
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-zinc-950",
);

type AddUserDialogProps = {
  open: boolean;
  kvId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddUserDialog({ open, kvId, onClose, onSuccess }: AddUserDialogProps) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [corpId, setCorpId] = useState("6");
  const [corpName, setCorpName] = useState("天津美腾科技有限公司");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setUsername("");
    setName("");
    setPassword("");
    setCorpId("6");
    setCorpName("天津美腾科技有限公司");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!username.trim() || !name.trim() || !password.trim()) {
      setError("请填写手机号、姓名和密码");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addUserToEnv({
        kvId,
        username: username.trim(),
        name: name.trim(),
        password: password.trim(),
        corpList: [{ corpId: corpId.trim(), name: corpName.trim() }],
      });
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title="添加用户"
      onClose={handleClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
          >
            取消
          </Button>
          <Button type="button" size="sm" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? "提交中…" : "添加"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          手机号
          <input
            className={inputClassName}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="13800138000"
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          姓名
          <input
            className={inputClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="张三"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          密码
          <input
            type="password"
            className={inputClassName}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            企业 ID
            <input
              className={inputClassName}
              value={corpId}
              onChange={(e) => setCorpId(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            企业名称
            <input
              className={inputClassName}
              value={corpName}
              onChange={(e) => setCorpName(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </FormDialog>
  );
}
