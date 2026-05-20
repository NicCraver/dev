import type { KvAccount, KvValue } from "@mt-dev/shared";
import { isValidObjectId } from "mongoose";

import { ensureMongoConnected, KvModel } from "./mongo.ts";

type KvDoc = {
  _id: { toString(): string };
  alias?: string;
  value?: KvValue;
  save(): Promise<KvDoc>;
  markModified(path: string): void;
};

async function findKv(kvId: string): Promise<KvDoc | null> {
  await ensureMongoConnected();
  const doc = isValidObjectId(kvId)
    ? await KvModel.findById(kvId)
    : await KvModel.findOne({ alias: kvId });
  return doc as KvDoc | null;
}

export async function getKvList() {
  await ensureMongoConnected();
  return KvModel.find();
}

export async function setKv(alias: string | undefined, value: KvValue) {
  await ensureMongoConnected();
  const newKv = new KvModel({
    alias,
    value,
  });
  return (await newKv.save()) as KvDoc;
}

export async function getKv(k: string) {
  return findKv(k);
}

export async function addUserToKv(kvId: string, userData: KvAccount) {
  const kv = await findKv(kvId);
  if (!kv) {
    throw new Error("KV document not found");
  }

  const value = kv.value ?? { urlList: [], accountList: [] };
  if (!value.accountList) {
    value.accountList = [];
  }

  const existingUser = value.accountList.find((user) => user.username === userData.username);
  if (existingUser) {
    throw new Error("Username already exists in this environment");
  }

  value.accountList.push(userData);
  kv.value = value;
  kv.markModified("value");
  return kv.save();
}

export async function addLinkToKv(kvId: string, linkData: { url: string; note: string }) {
  const kv = await findKv(kvId);
  if (!kv) {
    throw new Error("KV document not found");
  }

  const value = kv.value ?? { urlList: [], accountList: [] };
  if (!value.urlList) {
    value.urlList = [];
  }

  value.urlList.push(linkData);
  kv.value = value;
  kv.markModified("value");
  return kv.save();
}

export async function getAccountListFromKv(kvId: string) {
  const kv = await getKv(kvId);
  return kv?.value?.accountList ?? [];
}

export async function getUrlListFromKv(kvId: string) {
  const kv = await getKv(kvId);
  return kv?.value?.urlList ?? [];
}
