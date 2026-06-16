import type { MongoCollectionInfo } from "@mt-dev/shared";
import mongoose from "mongoose";

import { ensureMongoConnected, getMongoDatabaseName, isMongoConfigured } from "../db/mongo.ts";
import {
  coerceDocumentId,
  isValidCollectionName,
  parseDocumentId,
  serializeDocument,
} from "./serialize.ts";

export function mongoConfigured(): boolean {
  return isMongoConfigured;
}

export async function getMongoStatus(): Promise<{
  configured: boolean;
  databaseName?: string;
}> {
  if (!isMongoConfigured) {
    return { configured: false };
  }
  await ensureMongoConnected();
  return { configured: true, databaseName: getMongoDatabaseName() };
}

export async function listCollections(): Promise<MongoCollectionInfo[]> {
  await ensureMongoConnected();
  const db = getDb();
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name).sort();

  const result: MongoCollectionInfo[] = [];
  for (const name of names) {
    try {
      const count = await db.collection(name).countDocuments();
      result.push({ name, count });
    } catch {
      result.push({ name });
    }
  }
  return result;
}

export async function listDocuments(
  collectionName: string,
  page: number,
  limit: number,
): Promise<{ docs: Record<string, unknown>[]; total: number }> {
  assertCollection(collectionName);
  await ensureMongoConnected();
  const col = getDb().collection(collectionName);
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    col.find({}).skip(skip).limit(limit).toArray(),
    col.countDocuments(),
  ]);
  return {
    docs: docs.map((d) => serializeDocument(d as Record<string, unknown>)),
    total,
  };
}

function idFilter(id: string) {
  return { _id: parseDocumentId(id) };
}

export async function getDocument(
  collectionName: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  assertCollection(collectionName);
  await ensureMongoConnected();
  const col = getDb().collection(collectionName);
  const doc = await col.findOne(idFilter(id) as never);
  return doc ? serializeDocument(doc as Record<string, unknown>) : null;
}

export async function replaceDocument(
  collectionName: string,
  id: string,
  doc: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  assertCollection(collectionName);
  await ensureMongoConnected();
  const col = getDb().collection(collectionName);
  const payload = coerceDocumentId(doc, id);
  const result = await col.replaceOne(idFilter(id) as never, payload, { upsert: false });
  if (result.matchedCount === 0) {
    throw new DocumentNotFoundError();
  }
  const saved = await col.findOne(idFilter(id) as never);
  if (!saved) throw new DocumentNotFoundError();
  return serializeDocument(saved as Record<string, unknown>);
}

export async function insertDocument(
  collectionName: string,
  doc: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  assertCollection(collectionName);
  await ensureMongoConnected();
  const col = getDb().collection(collectionName);
  const payload = { ...doc };
  if (payload._id === "" || payload._id === null) {
    delete payload._id;
  }
  const result = await col.insertOne(payload);
  const inserted = await col.findOne({ _id: result.insertedId });
  if (!inserted) throw new Error("插入后无法读取文档");
  return serializeDocument(inserted as Record<string, unknown>);
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  assertCollection(collectionName);
  await ensureMongoConnected();
  const col = getDb().collection(collectionName);
  const result = await col.deleteOne(idFilter(id) as never);
  if (result.deletedCount === 0) {
    throw new DocumentNotFoundError();
  }
}

export class DocumentNotFoundError extends Error {
  constructor() {
    super("文档不存在");
    this.name = "DocumentNotFoundError";
  }
}

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection has no database handle");
  return db;
}

function assertCollection(name: string): void {
  if (!isValidCollectionName(name)) {
    throw new InvalidCollectionError(name);
  }
}

export class InvalidCollectionError extends Error {
  constructor(name: string) {
    super(`非法集合名: ${name}`);
    this.name = "InvalidCollectionError";
  }
}
