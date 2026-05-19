import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/AppShell";
import { modules } from "@/app/modules";
import { HealthCheckPage } from "@/pages/HealthCheckPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/o5-env" replace />} />
          {modules.map((m) => {
            const Page = m.page;
            return <Route key={m.id} path={m.routePath} element={<Page />} />;
          })}
        </Route>
        <Route path="/debug/health" element={<HealthCheckPage />} />
        <Route path="*" element={<Navigate to="/o5-env" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
