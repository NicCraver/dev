/**
 * 初始化 mt-dev 库：创建索引并确保 accounts / systems 集合可用。
 * 用法：cd apps/api && node --experimental-strip-types src/scripts/init-mt-dev-db.ts
 */
import "../load-env.ts";

import mongoose from "mongoose";

import {
  AccountModel,
  ensureMongoConnected,
  getMongoDatabaseName,
  SystemModel,
} from "../db/mongo.ts";

await ensureMongoConnected();

await AccountModel.syncIndexes();
await SystemModel.syncIndexes();

const dbName = getMongoDatabaseName();
const db = mongoose.connection.db;
if (!db) {
  throw new Error("MongoDB connection has no database handle");
}
const collections = await db.listCollections().toArray();
const names = collections.map((c) => c.name).sort();

console.log(`MongoDB ready: database="${dbName}"`);
console.log(`Collections: ${names.join(", ") || "(none yet — first write creates them)"}`);
console.log("Indexes:");
console.log("  accounts.key — unique (single pool document)");
console.log("  systems.name — unique");

process.exit(0);
