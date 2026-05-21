import type { Corp, MtDevAccount } from "@mt-dev/shared";

import { ACCOUNT_POOL_KEY, AccountModel, ensureMongoConnected } from "./mongo.ts";

type AccountLean = {
  username: string;
  password?: string;
  name?: string;
  corpList?: Corp[];
};

type AccountPoolLean = {
  key: string;
  accountList?: AccountLean[];
};

function toAccount(doc: AccountLean): MtDevAccount {
  return {
    username: doc.username,
    password: doc.password ?? "",
    name: doc.name ?? "",
    corpList: doc.corpList ?? [],
  };
}

async function getPoolLean(): Promise<AccountPoolLean | null> {
  await ensureMongoConnected();
  return AccountModel.findOne({ key: ACCOUNT_POOL_KEY }).lean() as Promise<AccountPoolLean | null>;
}

export async function listAccounts(): Promise<MtDevAccount[]> {
  const pool = await getPoolLean();
  return (pool?.accountList ?? []).map(toAccount);
}

export async function setAccountPool(accounts: MtDevAccount[]): Promise<void> {
  await ensureMongoConnected();
  await AccountModel.findOneAndUpdate(
    { key: ACCOUNT_POOL_KEY },
    { key: ACCOUNT_POOL_KEY, accountList: accounts },
    { upsert: true },
  );
}

export async function upsertAccount(data: MtDevAccount): Promise<MtDevAccount> {
  await ensureMongoConnected();
  const pool = await AccountModel.findOne({ key: ACCOUNT_POOL_KEY });
  const entry = {
    username: data.username,
    password: data.password,
    name: data.name,
    corpList: data.corpList ?? [],
  };

  if (!pool) {
    await AccountModel.create({ key: ACCOUNT_POOL_KEY, accountList: [entry] });
    return toAccount(entry);
  }

  const list = (pool.accountList ?? []) as AccountLean[];
  const index = list.findIndex((item: AccountLean) => item.username === data.username);
  if (index >= 0) {
    list[index] = entry;
  } else {
    list.push(entry);
  }

  pool.accountList = list;
  pool.markModified("accountList");
  await pool.save();

  return toAccount(entry);
}

export async function getAccountsByUsernames(
  usernames: string[],
): Promise<Map<string, MtDevAccount>> {
  if (usernames.length === 0) return new Map();

  const usernameSet = new Set(usernames);
  const accounts = await listAccounts();
  const map = new Map<string, MtDevAccount>();

  for (const account of accounts) {
    if (usernameSet.has(account.username)) {
      map.set(account.username, account);
    }
  }

  return map;
}
