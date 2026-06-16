export const SYSTEMS_COLLECTION = "systems";

export function formatDocId(id: unknown): string {
  if (id === null || id === undefined) return "(无 _id)";
  if (
    typeof id === "string" ||
    typeof id === "number" ||
    typeof id === "bigint" ||
    typeof id === "boolean"
  ) {
    return String(id);
  }
  if (typeof id === "object") {
    return JSON.stringify(id);
  }
  return "(unknown)";
}

export function isSystemsCollection(collection: string | null | undefined): boolean {
  return collection === SYSTEMS_COLLECTION;
}

export function getDocListLabel(doc: Record<string, unknown>, collection: string | null): string {
  if (isSystemsCollection(collection) && typeof doc.name === "string" && doc.name) {
    return doc.name;
  }
  return formatDocId(doc._id);
}

export function collectSystemNames(docs: Record<string, unknown>[]): Set<string> {
  return new Set(
    docs
      .map((doc) => doc.name)
      .filter((name): name is string => typeof name === "string" && name.length > 0),
  );
}

function uniqueSystemCopyName(baseName: string, existingNames: Set<string>): string {
  const stripped = baseName.replace(/(-副本\d*)$/, "");
  let candidate = `${stripped}-副本`;
  if (!existingNames.has(candidate)) return candidate;

  let n = 2;
  while (existingNames.has(`${stripped}-副本${n}`)) {
    n += 1;
  }
  return `${stripped}-副本${n}`;
}

export function prepareDocForCopy(
  doc: Record<string, unknown>,
  options?: {
    collection?: string | null;
    existingNames?: Set<string>;
  },
): Record<string, unknown> {
  const copy = { ...doc };
  delete copy._id;

  if (isSystemsCollection(options?.collection) && options?.existingNames) {
    const baseName = typeof copy.name === "string" && copy.name ? copy.name : "未命名";
    copy.name = uniqueSystemCopyName(baseName, options.existingNames);
  }

  return copy;
}

export function getCopySourceLabel(
  doc: Record<string, unknown>,
  collection: string | null,
  fallbackId: string | null,
): string {
  if (isSystemsCollection(collection) && typeof doc.name === "string" && doc.name) {
    return doc.name;
  }
  return fallbackId ?? "文档";
}
