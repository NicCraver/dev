import type { Corp } from "@mt-dev/shared";

export type O5System = {
  id: string;
  name: string;
  count: number;
};

export type O5Environment = {
  id: string;
  systemId: string;
  name: string;
  url: string;
  features?: string;
};

export type O5Account = {
  id: string;
  username: string;
  password: string;
  name: string;
  corpList: Corp[];
};

export function accountPhone(account: O5Account): string {
  return account.username;
}

export function accountOrgLabel(account: O5Account): string {
  return account.corpList.map((c) => c.name).join("、");
}
