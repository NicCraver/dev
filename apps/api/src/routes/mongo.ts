import type {
  MongoCollectionsResponse,
  MongoDocResponse,
  MongoDocsResponse,
  MongoStatusResponse,
} from "@mt-dev/shared";
import type { Hono } from "hono";

import {
  deleteDocument,
  DocumentNotFoundError,
  getDocument,
  getMongoStatus,
  insertDocument,
  InvalidCollectionError,
  listCollections,
  listDocuments,
  mongoConfigured,
  replaceDocument,
} from "../mongo/documents.ts";
import { isPagePasswordRequired, pm2AuthMiddleware } from "../pm2/auth.ts";
import { assertDocumentSize, DocumentTooLargeError } from "../mongo/serialize.ts";

const MONGO_PUBLIC_PATHS = new Set(["/api/mongo/status"]);

function mongoUnavailable(c: { json: (body: unknown, status?: number) => Response }) {
  return c.json({ message: "MongoDB not configured" }, 503);
}

async function parseJsonBody(c: {
  req: { json: () => Promise<unknown> };
}): Promise<Record<string, unknown> | Response> {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new Response(JSON.stringify({ message: "请求体须为 JSON 对象" }), { status: 400 });
    }
    return body as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ message: "JSON 解析失败" }), { status: 400 });
  }
}

export function registerMongoRoutes(app: Hono) {
  app.get("/api/mongo/status", async (c) => {
    if (!mongoConfigured()) {
      const body: MongoStatusResponse = {
        configured: false,
        pagePasswordRequired: isPagePasswordRequired(),
        message: "MongoDB 未配置",
      };
      return c.json(body);
    }

    try {
      const { databaseName } = await getMongoStatus();
      const body: MongoStatusResponse = {
        configured: true,
        databaseName,
        pagePasswordRequired: isPagePasswordRequired(),
      };
      return c.json(body);
    } catch (err) {
      const body: MongoStatusResponse = {
        configured: false,
        pagePasswordRequired: isPagePasswordRequired(),
        message: err instanceof Error ? err.message : "MongoDB 连接失败",
      };
      return c.json(body, 503);
    }
  });

  app.use("/api/mongo/*", async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (MONGO_PUBLIC_PATHS.has(path)) {
      await next();
      return;
    }
    return pm2AuthMiddleware(c, next);
  });

  app.get("/api/mongo/collections", async (c) => {
    if (!mongoConfigured()) return mongoUnavailable(c);
    try {
      const collections = await listCollections();
      const body: MongoCollectionsResponse = { collections };
      return c.json(body);
    } catch (err) {
      return c.json({ message: err instanceof Error ? err.message : "加载集合失败" }, 500);
    }
  });

  app.get("/api/mongo/:collection/docs", async (c) => {
    if (!mongoConfigured()) return mongoUnavailable(c);
    const collection = c.req.param("collection");
    const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 50) || 50));

    try {
      const { docs, total } = await listDocuments(collection, page, limit);
      const body: MongoDocsResponse = { docs, total, page, limit };
      return c.json(body);
    } catch (err) {
      if (err instanceof InvalidCollectionError) {
        return c.json({ message: err.message }, 400);
      }
      return c.json({ message: err instanceof Error ? err.message : "加载文档失败" }, 500);
    }
  });

  app.get("/api/mongo/:collection/docs/:id", async (c) => {
    if (!mongoConfigured()) return mongoUnavailable(c);
    const collection = c.req.param("collection");
    const id = c.req.param("id");

    try {
      const doc = await getDocument(collection, id);
      if (!doc) return c.json({ message: "文档不存在" }, 404);
      const body: MongoDocResponse = { doc };
      return c.json(body);
    } catch (err) {
      if (err instanceof InvalidCollectionError) {
        return c.json({ message: err.message }, 400);
      }
      return c.json({ message: err instanceof Error ? err.message : "加载文档失败" }, 500);
    }
  });

  app.put("/api/mongo/:collection/docs/:id", async (c) => {
    if (!mongoConfigured()) return mongoUnavailable(c);
    const collection = c.req.param("collection");
    const id = c.req.param("id");
    const parsed = await parseJsonBody(c);
    if (parsed instanceof Response) {
      const status = parsed.status as 400;
      return c.json(JSON.parse(await parsed.text()), status);
    }

    try {
      assertDocumentSize(parsed);
      const doc = await replaceDocument(collection, id, parsed);
      const body: MongoDocResponse = { doc };
      return c.json(body);
    } catch (err) {
      if (err instanceof DocumentTooLargeError) {
        return c.json({ message: err.message }, 413);
      }
      if (err instanceof DocumentNotFoundError) {
        return c.json({ message: err.message }, 404);
      }
      if (err instanceof InvalidCollectionError) {
        return c.json({ message: err.message }, 400);
      }
      return c.json({ message: err instanceof Error ? err.message : "保存失败" }, 500);
    }
  });

  app.post("/api/mongo/:collection/docs", async (c) => {
    if (!mongoConfigured()) return mongoUnavailable(c);
    const collection = c.req.param("collection");
    const parsed = await parseJsonBody(c);
    if (parsed instanceof Response) {
      const status = parsed.status as 400;
      return c.json(JSON.parse(await parsed.text()), status);
    }

    try {
      assertDocumentSize(parsed);
      const doc = await insertDocument(collection, parsed);
      const body: MongoDocResponse = { doc };
      return c.json(body, 201);
    } catch (err) {
      if (err instanceof DocumentTooLargeError) {
        return c.json({ message: err.message }, 413);
      }
      if (err instanceof InvalidCollectionError) {
        return c.json({ message: err.message }, 400);
      }
      return c.json({ message: err instanceof Error ? err.message : "新建失败" }, 500);
    }
  });

  app.delete("/api/mongo/:collection/docs/:id", async (c) => {
    if (!mongoConfigured()) return mongoUnavailable(c);
    const collection = c.req.param("collection");
    const id = c.req.param("id");

    try {
      await deleteDocument(collection, id);
      return c.json({ ok: true });
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        return c.json({ message: err.message }, 404);
      }
      if (err instanceof InvalidCollectionError) {
        return c.json({ message: err.message }, 400);
      }
      return c.json({ message: err instanceof Error ? err.message : "删除失败" }, 500);
    }
  });
}
