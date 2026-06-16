import type {
  MongoCollectionsResponse,
  MongoDocResponse,
  MongoDocsResponse,
  MongoStatusResponse,
} from "@mt-dev/shared";

import { getPm2Token, getPm2UnlockToken } from "./pm2-storage";

type ApiErrorBody = { message?: string };

function authHeaders(): HeadersInit {
  const token = getPm2Token();
  const unlock = getPm2UnlockToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (unlock) headers["X-PM2-Unlock"] = unlock;
  return headers;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.message ?? `请求失败 (${res.status})`;
  } catch {
    return `请求失败 (${res.status})`;
  }
}

export async function fetchMongoStatus(): Promise<MongoStatusResponse> {
  const res = await fetch("/api/mongo/status", { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<MongoStatusResponse>;
}

export async function fetchMongoCollections(): Promise<MongoCollectionsResponse> {
  const res = await fetch("/api/mongo/collections", { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<MongoCollectionsResponse>;
}

export async function fetchMongoDocs(
  collection: string,
  page: number,
  limit = 50,
): Promise<MongoDocsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`/api/mongo/${encodeURIComponent(collection)}/docs?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<MongoDocsResponse>;
}

export async function fetchMongoDoc(collection: string, id: string): Promise<MongoDocResponse> {
  const res = await fetch(
    `/api/mongo/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<MongoDocResponse>;
}

export async function saveMongoDoc(
  collection: string,
  id: string,
  doc: Record<string, unknown>,
): Promise<MongoDocResponse> {
  const res = await fetch(
    `/api/mongo/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(doc),
    },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<MongoDocResponse>;
}

export async function createMongoDoc(
  collection: string,
  doc: Record<string, unknown>,
): Promise<MongoDocResponse> {
  const res = await fetch(`/api/mongo/${encodeURIComponent(collection)}/docs`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<MongoDocResponse>;
}

export async function deleteMongoDoc(collection: string, id: string): Promise<void> {
  const res = await fetch(
    `/api/mongo/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: authHeaders() },
  );
  if (!res.ok) throw new Error(await parseError(res));
}
