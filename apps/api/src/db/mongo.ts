import mongoose, { Schema } from "mongoose";

export const isMongoConfigured = Boolean(process.env.MONGODB_URI);

const corpSchema = new Schema(
  {
    corpId: String,
    name: String,
  },
  { _id: false },
);

const urlConfigSchema = new Schema(
  {
    url: String,
    note: String,
    features: String,
  },
  { _id: false },
);

const accountEntrySchema = new Schema(
  {
    username: { type: String, required: true },
    password: String,
    name: String,
    corpList: [corpSchema],
  },
  { _id: false },
);

/** accounts 集合仅一条文档，accountList 为全局账号池 */
const accountPoolSchema = new Schema({
  key: { type: String, required: true, unique: true, default: "pool" },
  accountList: [accountEntrySchema],
});

export const ACCOUNT_POOL_KEY = "pool";

const systemSchema = new Schema({
  name: { type: String, required: true, unique: true },
  urlList: [urlConfigSchema],
  accountRefs: [String],
});

/** @deprecated env-share 兼容；mt-dev 库请用 AccountModel / SystemModel */
const kvSchema = new Schema({
  alias: String,
  value: Object,
});

export const AccountModel = mongoose.models.Account ?? mongoose.model("Account", accountPoolSchema);

export const SystemModel = mongoose.models.System ?? mongoose.model("System", systemSchema);

export const KvModel = mongoose.models.KV ?? mongoose.model("KV", kvSchema);

let connectPromise: Promise<typeof mongoose> | null = null;

export async function ensureMongoConnected(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MongoDB not configured");
  }
  if (mongoose.connection.readyState === 1) return;
  connectPromise ??= mongoose.connect(uri);
  await connectPromise;
}

export function getMongoDatabaseName(): string | undefined {
  return mongoose.connection.db?.databaseName;
}
