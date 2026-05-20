import { Building01Icon, Copy01Icon, StarIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { O5Account } from "@/mocks/o5-env";
import { copyPhone } from "@/lib/copy-phone";
import { iconGhostClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

import { HighlightText, accountCardClassName } from "./account-card-utils";

type AccountCardProps = {
  account: O5Account;
  isFavorite: boolean;
  isActive?: boolean;
  searchQuery?: string;
  onToggleFavorite: (accountId: string) => void;
};

export function AccountCard({
  account,
  isFavorite,
  isActive = false,
  searchQuery = "",
  onToggleFavorite,
}: AccountCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyPhone(account.phone);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article
      className={cn(accountCardClassName(isActive), isActive ? "pl-[23px] pr-5" : "px-5")}
      data-account-id={account.id}
    >
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/70 rounded-r-md transition-all duration-300" />
      )}

      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-base font-semibold tracking-tight text-slate-800 dark:text-zinc-200 mt-0.5">
          <HighlightText text={account.name} query={searchQuery} />
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", iconGhostClasses(isFavorite ? "amber" : "neutral"))}
            aria-label={isFavorite ? `取消收藏 ${account.name}` : `收藏 ${account.name}`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(account.id)}
          >
            <Icon
              icon={StarIcon}
              className={cn("size-3.5", isFavorite && "fill-current scale-110")}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={copied}
            className={cn(
              "h-8 shrink-0 gap-1.5 px-2.5 font-medium text-xs",
              copied
                ? "cursor-default bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs opacity-100 active:scale-100"
                : iconGhostClasses("primary"),
            )}
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <>
                <Icon
                  icon={Tick01Icon}
                  className="size-3.5 animate-in fade-in zoom-in duration-200"
                />
                已复制
              </>
            ) : (
              <>
                <Icon icon={Copy01Icon} className="size-3.5" />
                复制
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex max-w-full items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 dark:border-white/5 dark:bg-white/5 px-2.5 py-1 text-[11px] text-slate-500 dark:text-zinc-400">
        <Icon icon={Building01Icon} className="size-3 text-slate-400/80 shrink-0" />
        <span className="truncate">
          <HighlightText text={account.org} query={searchQuery} />
        </span>
      </div>
    </article>
  );
}
