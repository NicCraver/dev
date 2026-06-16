import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

const MAX_DOC_BYTES = 1024 * 1024;

export function isValidCollectionName(name: string): boolean {
  return name.length > 0 && !name.includes(".") && !name.includes("$");
}

export function parseDocumentId(id: string): string | mongoose.Types.ObjectId {
  if (ObjectId.isValid(id)) {
    const oid = new ObjectId(id);
    if (oid.toString() === id) return oid;
  }
  return id;
}

export function serializeDocument(doc: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(doc, bsonReplacer)) as Record<string, unknown>;
}

function bsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function assertDocumentSize(body: unknown): void {
  const bytes = Buffer.byteLength(JSON.stringify(body), "utf8");
  if (bytes > MAX_DOC_BYTES) {
    throw new DocumentTooLargeError();
  }
}

export class DocumentTooLargeError extends Error {
  constructor() {
    super("文档超过 1MB 限制");
    this.name = "DocumentTooLargeError";
  }
}

export function coerceDocumentId(
  doc: Record<string, unknown>,
  id: string,
): Record<string, unknown> {
  const parsed = parseDocumentId(id);
  return { ...doc, _id: parsed };
}
