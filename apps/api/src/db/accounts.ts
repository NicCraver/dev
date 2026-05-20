import type { Corp, MtDevAccount } from "@mt-dev/shared";

import { AccountModel, ensureMongoConnected } from "./mongo.ts";

type AccountLean = {
  username: string;
  password?: string;
  name?: string;
  corpList?: Corp[];
};

function toAccount(doc: AccountLean): MtDevAccount {
  return {
    username: doc.username,
    password: doc.password ?? "",
    name: doc.name ?? "",
    corpList: doc.corpList ?? [],
  };
}

export async function listAccounts(): Promise<MtDevAccount[]> {
  await ensureMongoConnected();
  const docs = (await AccountModel.find().lean()) as unknown as AccountLean[];
  return docs.map(toAccount);
}

export async function upsertAccount(data: MtDevAccount): Promise<MtDevAccount> {
  await ensureMongoConnected();
  const doc = (await AccountModel.findOneAndUpdate(
    { username: data.username },
    {
      username: data.username,
      password: data.password,
      name: data.name,
      corpList: data.corpList ?? [],
    },
    { upsert: true, new: true },
  ).lean()) as unknown as AccountLean | null;

  if (!doc) {
    throw new Error("Failed to upsert account");
  }

  return toAccount(doc);
}

export async function getAccountsByUsernames(
  usernames: string[],
): Promise<Map<string, MtDevAccount>> {
  await ensureMongoConnected();
  if (usernames.length === 0) return new Map();

  const docs = (await AccountModel.find({
    username: { $in: usernames },
  }).lean()) as unknown as AccountLean[];
  const map = new Map<string, MtDevAccount>();
  for (const doc of docs) {
    map.set(doc.username, toAccount(doc));
  }
  return map;
}
