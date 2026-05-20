import type { MtDevAccount, MtDevSystem, UrlConfig } from "@mt-dev/shared";
import { isValidObjectId } from "mongoose";

import { getAccountsByUsernames, upsertAccount } from "./accounts.ts";
import { ensureMongoConnected, SystemModel } from "./mongo.ts";

type SystemDoc = {
  _id: { toString(): string };
  name: string;
  urlList?: UrlConfig[];
  accountRefs?: string[];
  save(): Promise<SystemDoc>;
  markModified(path: string): void;
};

async function findSystem(systemId: string): Promise<SystemDoc | null> {
  await ensureMongoConnected();
  const doc = isValidObjectId(systemId)
    ? await SystemModel.findById(systemId)
    : await SystemModel.findOne({ name: systemId });
  return doc as SystemDoc | null;
}

type SystemLean = {
  _id: { toString(): string };
  name: string;
  urlList?: UrlConfig[];
  accountRefs?: string[];
};

export async function listSystems(): Promise<MtDevSystem[]> {
  await ensureMongoConnected();
  const docs = (await SystemModel.find().lean()) as unknown as SystemLean[];
  return docs.map((doc) => ({
    name: doc.name,
    urlList: doc.urlList ?? [],
    accountRefs: doc.accountRefs ?? [],
  }));
}

export async function createSystem(
  name: string,
  data: Pick<MtDevSystem, "urlList" | "accountRefs">,
): Promise<SystemDoc> {
  await ensureMongoConnected();
  const doc = new SystemModel({
    name,
    urlList: data.urlList ?? [],
    accountRefs: data.accountRefs ?? [],
  });
  return (await doc.save()) as SystemDoc;
}

export async function addLinkToSystem(
  systemId: string,
  link: { url: string; note: string },
): Promise<SystemDoc> {
  const system = await findSystem(systemId);
  if (!system) {
    throw new Error("System not found");
  }

  if (!system.urlList) {
    system.urlList = [];
  }
  system.urlList.push(link);
  system.markModified("urlList");
  return system.save();
}

export async function linkAccountToSystem(systemId: string, username: string): Promise<SystemDoc> {
  const system = await findSystem(systemId);
  if (!system) {
    throw new Error("System not found");
  }

  const refs = system.accountRefs ?? [];
  if (refs.includes(username)) {
    throw new Error("Username already linked to this system");
  }

  refs.push(username);
  system.accountRefs = refs;
  system.markModified("accountRefs");
  return system.save();
}

export async function addUserToSystem(
  systemId: string,
  userData: MtDevAccount,
): Promise<SystemDoc> {
  await upsertAccount(userData);
  return linkAccountToSystem(systemId, userData.username);
}

export type SystemWithAccounts = {
  id: string;
  name: string;
  urlList: UrlConfig[];
  accounts: MtDevAccount[];
};

export async function listSystemsWithAccounts(): Promise<SystemWithAccounts[]> {
  await ensureMongoConnected();
  const docs = (await SystemModel.find().lean()) as unknown as SystemLean[];
  const allUsernames = new Set<string>();
  for (const doc of docs) {
    for (const username of doc.accountRefs ?? []) {
      allUsernames.add(username);
    }
  }

  const accountMap = await getAccountsByUsernames([...allUsernames]);

  return docs
    .filter((doc) => doc.name)
    .map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      urlList: doc.urlList ?? [],
      accounts: (doc.accountRefs ?? [])
        .map((username: string) => accountMap.get(username))
        .filter((a: MtDevAccount | undefined): a is MtDevAccount => a !== undefined),
    }));
}
