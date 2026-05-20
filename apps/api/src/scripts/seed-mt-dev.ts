/**
 * 写入 mt-dev 种子：测试环境、O5系统 + 账号池。
 * 用法：pnpm --filter @mt-dev/api db:seed
 */
import "../load-env.ts";

import { upsertAccount } from "../db/accounts.ts";
import { ensureMongoConnected, getMongoDatabaseName, SystemModel } from "../db/mongo.ts";
import { SEED_ACCOUNTS, SEED_SYSTEMS } from "../db/seed-data.ts";

await ensureMongoConnected();

for (const account of SEED_ACCOUNTS) {
  await upsertAccount(account);
}

for (const seed of SEED_SYSTEMS) {
  await SystemModel.findOneAndUpdate(
    { name: seed.name },
    {
      name: seed.name,
      urlList: [...seed.urlList],
      accountRefs: [...seed.accountRefs],
    },
    { upsert: true, new: true },
  );
}

const dbName = getMongoDatabaseName();
const accountCount = SEED_ACCOUNTS.length;
const systemCount = SEED_SYSTEMS.length;

console.log(`Seeded database="${dbName}"`);
console.log(`  accounts: ${accountCount}`);
console.log(`  systems: ${systemCount} (${SEED_SYSTEMS.map((s) => s.name).join(", ")})`);

process.exit(0);
