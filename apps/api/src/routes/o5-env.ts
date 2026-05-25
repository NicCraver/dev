import type {
  AddLinkRequest,
  AddUserRequest,
  O5EnvBootstrapResponse,
  O5SystemDto,
  ShareNewRequest,
  ShareNewResponse,
  UpdateLinkRequest,
  UrlConfig,
} from "@mt-dev/shared";
import type { Hono } from "hono";

import { upsertAccount } from "../db/accounts.ts";
import { isMongoConfigured } from "../db/mongo.ts";
import {
  addLinkToSystem,
  addUserToSystem,
  createSystem,
  listSystemsWithAccounts,
  updateLinkInSystem,
} from "../db/systems.ts";

type RecommendItem = { url: string; note?: string; [key: string]: unknown };

function systemToDto(system: {
  id: string;
  name: string;
  urlList: UrlConfig[];
  accounts: {
    username: string;
    password: string;
    name: string;
    corpList: { corpId: string; name: string }[];
  }[];
}): O5SystemDto {
  const alias = system.name;
  return {
    id: system.id,
    name: alias,
    environments: system.urlList.map((u, i) => ({
      id: `${alias}-env-${i}`,
      name: u.note,
      url: u.url,
      features: u.features,
    })),
    accounts: system.accounts.map((a) => ({
      id: `${alias}-acc-${a.username}`,
      username: a.username,
      password: a.password,
      name: a.name,
      corpList: a.corpList ?? [],
    })),
  };
}

function mongoUnavailable(c: { json: (body: unknown, status?: number) => Response }) {
  return c.json({ message: "MongoDB not configured" }, 503);
}

async function parseBuildVersion(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${url}/build_version`);
    let text = (await res.text())?.trim();
    if (text?.match(/^[a-zA-Z0-9.+: \-_]*$/)) {
      return text;
    }
    try {
      const v = JSON.parse(text) as {
        branch: string;
        build_number: string;
        commit: string;
      };
      return `${v.branch}-${v.build_number}:${v.commit.substring(0, 8)}`;
    } catch {
      return undefined;
    }
  } catch {
    return undefined;
  }
}

export function registerO5EnvRoutes(app: Hono) {
  app.get("/api/o5-env/bootstrap", async (c) => {
    if (!isMongoConfigured) return mongoUnavailable(c);

    try {
      const list = await listSystemsWithAccounts();
      const systems = list.map((s) => systemToDto(s));
      const body: O5EnvBootstrapResponse = { systems };
      return c.json(body);
    } catch (error) {
      console.error("bootstrap error:", error);
      return c.json({ message: "Failed to load environments" }, 500);
    }
  });

  app.post("/api/share/new", async (c) => {
    if (!isMongoConfigured) return mongoUnavailable(c);

    try {
      const body = (await c.req.json()) as ShareNewRequest;
      const { key, urlList, accountList } = body;

      for (const account of accountList) {
        await upsertAccount(account);
      }

      const newSystem = await createSystem(key ?? "", {
        urlList,
        accountRefs: accountList.map((a) => a.username),
      });

      const slug = newSystem.name || newSystem._id.toString();
      const response: ShareNewResponse = { slug };
      return c.json(response);
    } catch (error) {
      console.error("share/new error:", error);
      return c.json({ message: "Failed to create share" }, 500);
    }
  });

  app.post("/api/user/add", async (c) => {
    if (!isMongoConfigured) return mongoUnavailable(c);

    try {
      const body = (await c.req.json()) as AddUserRequest;
      const { kvId, username, name, password, corpList } = body;

      if (!kvId) {
        return c.json(
          {
            success: false,
            message: "kvId is required (system document ID or name)",
          },
          400,
        );
      }
      if (!username || !name || !password) {
        return c.json({ success: false, message: "Missing required fields" }, 400);
      }

      const updated = await addUserToSystem(kvId, {
        username,
        name,
        password,
        corpList: corpList ?? [],
      });

      return c.json(
        {
          success: true,
          message: "User added to global accounts and linked to system",
          data: {
            kvId: updated._id.toString(),
            alias: updated.name,
            accountListCount: updated.accountRefs?.length ?? 0,
          },
        },
        201,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("user/add error:", error);

      if (message === "System not found") {
        return c.json({ success: false, message }, 404);
      }
      if (message === "Username already linked to this system") {
        return c.json({ success: false, message }, 409);
      }

      return c.json({ success: false, message: "Failed to add user", error: message }, 500);
    }
  });

  app.post("/api/link/update", async (c) => {
    if (!isMongoConfigured) return mongoUnavailable(c);

    try {
      const body = (await c.req.json()) as UpdateLinkRequest;
      const { kvId, envIndex, url, note, features } = body;

      if (!kvId) {
        return c.json(
          {
            success: false,
            message: "kvId is required (system document ID or name)",
          },
          400,
        );
      }
      if (typeof envIndex !== "number" || envIndex < 0) {
        return c.json({ success: false, message: "envIndex must be a non-negative number" }, 400);
      }
      if (!url) {
        return c.json({ success: false, message: "url is required" }, 400);
      }

      const updated = await updateLinkInSystem(kvId, envIndex, {
        url,
        note: note ?? "",
        features,
      });

      return c.json(
        {
          success: true,
          message: "Link updated in system urlList",
          data: {
            kvId: updated._id.toString(),
            alias: updated.name,
            urlListCount: updated.urlList?.length ?? 0,
          },
        },
        200,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("link/update error:", error);

      if (message === "System not found") {
        return c.json({ success: false, message }, 404);
      }
      if (message === "Environment index out of range") {
        return c.json({ success: false, message }, 400);
      }

      return c.json({ success: false, message: "Failed to update link", error: message }, 500);
    }
  });

  app.post("/api/link/add", async (c) => {
    if (!isMongoConfigured) return mongoUnavailable(c);

    try {
      const body = (await c.req.json()) as AddLinkRequest;
      const { kvId, url, note } = body;

      if (!kvId) {
        return c.json(
          {
            success: false,
            message: "kvId is required (system document ID or name)",
          },
          400,
        );
      }
      if (!url) {
        return c.json({ success: false, message: "url is required" }, 400);
      }

      const updated = await addLinkToSystem(kvId, { url, note: note ?? "" });

      return c.json(
        {
          success: true,
          message: "Link added to system urlList",
          data: {
            kvId: updated._id.toString(),
            alias: updated.name,
            urlListCount: updated.urlList?.length ?? 0,
          },
        },
        201,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("link/add error:", error);

      if (message === "System not found") {
        return c.json({ success: false, message }, 404);
      }

      return c.json({ success: false, message: "Failed to add link", error: message }, 500);
    }
  });

  app.post("/api/o5-env/login-proxy", async (c) => {
    const base = process.env.EXTERNAL_LOGIN_BASE ?? "https://env.lif3ng.cn:3443";
    const appHeaders = { clientType: "app" };

    try {
      const body = (await c.req.json()) as {
        action: "login" | "orgs" | "authCode";
        username?: string;
        password?: string;
        accessToken?: string;
      };

      if (body.action === "login") {
        if (!body.username || !body.password) {
          return c.json({ message: "username and password are required" }, 400);
        }
        const search = new URLSearchParams({
          username: body.username,
          password: body.password,
        });
        const res = await fetch(`${base}/testapi/app/login?${search}`, {
          method: "GET",
          headers: appHeaders,
        });
        const data = await res.json();
        return c.json(data, res.status as 200);
      }

      if (body.action === "orgs") {
        if (!body.accessToken) {
          return c.json({ message: "accessToken is required" }, 400);
        }
        const res = await fetch(
          `${base}/testapi/contact/v1/orInv/contactV2/get_my_info_organization`,
          {
            method: "GET",
            headers: {
              ...appHeaders,
              Authorization: `Bearer ${body.accessToken}`,
            },
          },
        );
        const data = await res.json();
        return c.json(data, res.status as 200);
      }

      if (body.action === "authCode") {
        if (!body.accessToken) {
          return c.json({ message: "accessToken is required" }, 400);
        }
        const res = await fetch(`${base}/testapi/oauth/getAuthCode`, {
          method: "GET",
          headers: {
            ...appHeaders,
            authorization: `Bearer ${body.accessToken}`,
          },
        });
        const data = await res.json();
        return c.json(data, res.status as 200);
      }

      return c.json({ message: "Invalid action" }, 400);
    } catch (error) {
      console.error("login-proxy error:", error);
      return c.json({ message: "Login proxy failed" }, 500);
    }
  });

  app.get("/api/recommend/:env", async (c) => {
    const env = c.req.param("env");
    if (!["test", "dev", "prod"].includes(env)) {
      return c.json({ message: "env must be test, dev, or prod" }, 400);
    }

    const upstream = process.env.RECOMMEND_UPSTREAM ?? "http://192.168.5.46:3000";
    const target = `${upstream}/api/recommend?env=${env}`;

    try {
      const res = await fetch(target);
      const items = (await res.json()) as RecommendItem[];
      const versions = await Promise.all(items.map((item) => parseBuildVersion(item.url)));
      const list = items.map((item, index) => ({
        ...item,
        v: versions[index],
      }));
      return c.json(list);
    } catch (error) {
      console.error("recommend error:", error);
      return c.json({ message: "Failed to fetch recommendations" }, 500);
    }
  });
}
