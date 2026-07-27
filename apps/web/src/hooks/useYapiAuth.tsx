import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";

import {
  getStatus,
  login as apiLogin,
  logout as apiLogout,
  YapiNetworkError,
  type YapiUser,
} from "@/lib/yapi-api";

interface AuthContextValue {
  user: YapiUser | null;
  loading: boolean;
  bootstrapError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const YAPI_BASE = "/yapi";

function AuthLoading({ message, error }: { message: string; error?: string | null }) {
  return (
    <div className="bg-background flex flex-1 items-center justify-center p-6">
      <div className="border-border/60 w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-muted-foreground text-sm">{message}</p>
        {error ? <div className="text-destructive mt-3 text-sm">{error}</div> : null}
        {error ? (
          <p className="text-muted-foreground mt-3 text-xs">
            本地开发请执行：
            <code className="bg-muted mt-1 block rounded px-2 py-1 font-mono text-[11px]">
              ssh -L 3100:127.0.0.1:3100 lifeng@env.lif3ng.cn
            </code>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function YapiAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<YapiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await getStatus();
    setUser(data);
    setBootstrapError(null);
  }, []);

  useEffect(() => {
    void getStatus()
      .then((data) => {
        setUser(data);
        setBootstrapError(null);
      })
      .catch((err) => {
        setUser(null);
        if (err instanceof YapiNetworkError) {
          setBootstrapError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, bootstrapError, login, logout, refresh }),
    [user, loading, bootstrapError, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useYapiAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useYapiAuth must be used within YapiAuthProvider");
  return ctx;
}

export function YapiRequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, bootstrapError } = useYapiAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoading message="正在检查登录态…" error={bootstrapError} />;
  }

  if (!user) {
    return <Navigate to={`${YAPI_BASE}/login`} replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function YapiRedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading, bootstrapError } = useYapiAuth();
  if (loading) {
    return <AuthLoading message="正在检查登录态…" error={bootstrapError} />;
  }
  if (user) return <Navigate to={`${YAPI_BASE}/projects`} replace />;
  return children;
}
