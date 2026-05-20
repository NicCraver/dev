import { StarIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { O5Account } from "@/mocks/o5-env";
import { copyPhone } from "@/lib/copy-phone";
import {
  favoriteChipActionClasses,
  favoriteChipClasses,
  iconGhostClasses,
} from "@/lib/interaction";
import { cn } from "@/lib/utils";

type FavoritesSectionProps = {
  accounts: O5Account[];
  activeAccountId?: string;
  onToggleFavorite: (accountId: string) => void;
};

export function FavoritesSection({
  accounts,
  activeAccountId,
  onToggleFavorite,
}: FavoritesSectionProps) {
  if (accounts.length === 0) return null;

  return (
    <section
      className="shrink-0 border-b border-neutral-200/40 bg-slate-50/20 backdrop-blur-md px-4 py-2.5 z-10"
      aria-label="常用账号"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-600/90 uppercase mb-2">
        <Icon icon={StarIcon} className="size-3.5 text-amber-500 fill-amber-400 animate-pulse" />
        常用账号 ({accounts.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {accounts.map((account) => (
          <FavoriteChip
            key={account.id}
            account={account}
            isActive={account.id === activeAccountId}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}

function FavoriteChip({
  account,
  isActive,
  onToggleFavorite,
}: {
  account: O5Account;
  isActive: boolean;
  onToggleFavorite: (accountId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyPhone(account.phone);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={favoriteChipClasses(isActive)} data-account-id={account.id}>
      <button
        type="button"
        className={favoriteChipActionClasses()}
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <>
            <Icon
              icon={Tick01Icon}
              className="text-emerald-600 dark:text-emerald-400 size-3.5 animate-in fade-in zoom-in duration-200"
            />
            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              已复制
            </span>
          </>
        ) : (
          <span className="truncate max-w-[180px]">
            {account.name} <span className="text-slate-400/80 font-normal">· {account.org}</span>
          </span>
        )}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-5 w-5 rounded-full p-0", iconGhostClasses("amber"))}
        aria-label={`取消收藏 ${account.name}`}
        aria-pressed
        onClick={() => onToggleFavorite(account.id)}
      >
        <Icon icon={StarIcon} className="size-3 fill-current" />
      </Button>
    </div>
  );
}
