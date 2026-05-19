import { pinyin } from "pinyin-pro";

import type { O5Account } from "@/mocks/o5-env";

const CJK_RE = /[\u4e00-\u9fff]/;

function isChinese(char: string): boolean {
  return CJK_RE.test(char);
}

function fullPinyin(text: string): string {
  return Array.from(text)
    .map((char) => (isChinese(char) ? pinyin(char, { toneType: "none" }) : char))
    .join("")
    .toLowerCase();
}

function initials(text: string): string {
  return Array.from(text)
    .map((char) => {
      if (isChinese(char)) {
        return pinyin(char, { pattern: "first", toneType: "none" }).charAt(0);
      }
      if (/[a-zA-Z0-9]/.test(char)) {
        return char.toLowerCase();
      }
      return "";
    })
    .join("");
}

function matchesField(value: string, query: string): boolean {
  const normalized = value.toLowerCase();
  if (normalized.includes(query)) return true;

  const py = fullPinyin(value);
  if (py.includes(query)) return true;

  const abbr = initials(value);
  return abbr.includes(query);
}

export function matchesAccount(account: O5Account, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return matchesField(account.name, q) || matchesField(account.org, q) || account.phone.includes(q);
}

export function filterAccounts(accounts: O5Account[], query: string): O5Account[] {
  const q = query.trim();
  if (!q) return accounts;
  return accounts.filter((account) => matchesAccount(account, q));
}
