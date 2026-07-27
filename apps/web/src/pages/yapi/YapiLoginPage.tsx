import { ApiIcon } from "@hugeicons/core-free-icons";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { YAPI_BASE, useYapiAuth } from "@/hooks/useYapiAuth";
import { YapiAuthError, YapiError, YapiNetworkError } from "@/lib/yapi-api";

export function YapiLoginPage() {
  const { login, bootstrapError } = useYapiAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || `${YAPI_BASE}/projects`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      void navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof YapiAuthError || err instanceof YapiError) {
        setError(err.message);
      } else if (err instanceof YapiNetworkError) {
        setError(err.message);
      } else {
        setError("登录失败，请检查网络或 YApi 服务是否可达。");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md border-border/60 p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <Icon icon={ApiIcon} className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">YApi 接口浏览</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              使用 YApi 账号登录，浏览有权限的项目接口
            </p>
          </div>
        </div>
        {bootstrapError ? (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-lg px-3 py-2 text-sm">
            {bootstrapError}
            <p className="text-muted-foreground mt-2 text-xs">
              本地开发：
              <code className="mt-1 block font-mono text-[11px]">
                ssh -L 3100:127.0.0.1:3100 lifeng@env.lif3ng.cn
              </code>
            </p>
          </div>
        ) : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="yapi-login-email" className="text-sm font-medium text-slate-800">
              邮箱
            </label>
            <input
              id="yapi-login-email"
              type="email"
              autoComplete="username"
              placeholder="admin@admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-border/60 focus:border-primary/40 focus:ring-primary/12 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="yapi-login-password" className="text-sm font-medium text-slate-800">
              密码
            </label>
            <input
              id="yapi-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-border/60 focus:border-primary/40 focus:ring-primary/12 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
          {error ? (
            <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "登录中…" : "登录"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
