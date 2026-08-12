import { Building01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { openAccountJump } from "@/lib/account-jump";
import { iconGhostClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";
import { accountPhone, type O5Account } from "@/types/o5-env";

import { HighlightText, accountCardClassName } from "./account-card-utils";
import { CopyAddressButton, CopyPhoneButton } from "./CopyPhoneButton";

type AccountCardProps = {
  account: O5Account;
  isFavorite: boolean;
  isActive?: boolean;
  searchQuery?: string;
  showCompany?: boolean;
  jumpEnabled?: boolean;
  targetUrl?: string | null;
  windowFeatures?: string;
  isDragging?: boolean;
  onToggleFavorite: (accountId: string) => void;
};

export function AccountCard({
  account,
  isFavorite,
  isActive = false,
  searchQuery = "",
  showCompany = false,
  jumpEnabled = false,
  targetUrl = null,
  windowFeatures,
  isDragging = false,
  onToggleFavorite,
}: AccountCardProps) {
  const corps = account.corpList;
  const onlyOneCorp = corps.length === 1;
  const isBlockJump = jumpEnabled && onlyOneCorp;

  const handleJump = (corpId: string, event: MouseEvent) => {
    event.stopPropagation();
    void openAccountJump({
      username: account.username,
      password: account.password,
      corpId,
      targetUrl: targetUrl ?? "",
      features: windowFeatures,
      ctrlKey: event.ctrlKey || event.metaKey,
    });
  };

  const handleBlockClick = (event: MouseEvent<HTMLElement>) => {
    if (!isBlockJump || !corps[0]) return;
    handleJump(corps[0].corpId, event);
  };

  const phone = accountPhone(account);

  return (
    <article
      className={cn(
        accountCardClassName(isActive),
        isActive ? "pl-[23px] pr-5" : "px-5",
        isBlockJump && !isDragging && "cursor-pointer",
        isDragging && "shadow-lg ring-2 ring-primary/20",
      )}
      data-account-id={account.id}
      onClick={handleBlockClick}
    >
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/70 rounded-r-md transition-all duration-300" />
      )}

      <div className="flex items-start justify-between gap-2">
        <p
          className="mt-0.5 min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-slate-800 dark:text-zinc-200"
          title={account.name}
        >
          <HighlightText text={account.name} query={searchQuery} />
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", iconGhostClasses(isFavorite ? "amber" : "neutral"))}
            title={isFavorite ? "取消收藏" : "收藏"}
            aria-label={isFavorite ? `取消收藏 ${account.name}` : `收藏 ${account.name}`}
            aria-pressed={isFavorite}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(account.id);
            }}
          >
            <Icon
              icon={StarIcon}
              className={cn("size-3.5", isFavorite && "fill-current scale-110")}
            />
          </Button>
          <CopyPhoneButton phone={phone} accountName={account.name} variant="labeled" />
          {jumpEnabled && targetUrl && corps[0] && (
            <CopyAddressButton
              jumpRequest={{
                username: account.username,
                password: account.password,
                corpId: corps[0].corpId,
                targetUrl,
              }}
              accountName={account.name}
            />
          )}
        </div>
      </div>

      {showCompany && corps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {corps.map((corp) => (
            <button
              key={corp.corpId}
              type="button"
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px]",
                jumpEnabled && (!onlyOneCorp || !isBlockJump)
                  ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                  : "border-slate-100 bg-slate-50/50 text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-zinc-400",
              )}
              onClick={(event) => {
                if (jumpEnabled && (!onlyOneCorp || !isBlockJump)) {
                  handleJump(corp.corpId, event);
                }
              }}
            >
              <Icon icon={Building01Icon} className="size-3 shrink-0 opacity-80" />
              <span className="truncate">
                <HighlightText text={corp.name} query={searchQuery} />
              </span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
