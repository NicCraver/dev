import { Navigate, Route, Routes } from "react-router-dom";

import { YapiAuthProvider, YapiRedirectIfAuthed, YapiRequireAuth } from "@/hooks/useYapiAuth";
import { YapiCollectionBrowsePage } from "@/pages/yapi/YapiCollectionBrowsePage";
import { YapiDebugPage } from "@/pages/yapi/YapiDebugPage";
import { YapiLoginPage } from "@/pages/yapi/YapiLoginPage";
import { YapiProjectBrowsePage } from "@/pages/yapi/YapiProjectBrowsePage";
import { YapiProjectListPage } from "@/pages/yapi/YapiProjectListPage";

export function YapiPage() {
  return (
    <YapiAuthProvider>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <Routes>
          <Route
            path="login"
            element={
              <YapiRedirectIfAuthed>
                <YapiLoginPage />
              </YapiRedirectIfAuthed>
            }
          />
          <Route
            path="projects"
            element={
              <YapiRequireAuth>
                <YapiProjectListPage />
              </YapiRequireAuth>
            }
          />
          <Route
            path="debug"
            element={
              <YapiRequireAuth>
                <YapiDebugPage />
              </YapiRequireAuth>
            }
          />
          <Route
            path="all"
            element={
              <YapiRequireAuth>
                <YapiCollectionBrowsePage />
              </YapiRequireAuth>
            }
          />
          <Route
            path="custom/:catId"
            element={
              <YapiRequireAuth>
                <YapiCollectionBrowsePage />
              </YapiRequireAuth>
            }
          />
          <Route
            path="projects/:projectId"
            element={
              <YapiRequireAuth>
                <YapiProjectBrowsePage />
              </YapiRequireAuth>
            }
          />
          <Route
            path="projects/:projectId/:interfaceId"
            element={
              <YapiRequireAuth>
                <YapiProjectBrowsePage />
              </YapiRequireAuth>
            }
          />
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="*" element={<Navigate to="projects" replace />} />
        </Routes>
      </div>
    </YapiAuthProvider>
  );
}
