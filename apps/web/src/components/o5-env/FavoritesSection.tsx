import { Copy01Icon, StarIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useState, type KeyboardEvent, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { openAccountJump } from "@/lib/account-jump";
import { copyPhone } from "@/lib/copy-phone";
import { favoriteChipClasses, favoriteChipIconClasses } from "@/lib/interaction";
import { accountOrgLabel, accountPhone, type O5Account } from "@/types/o5-env";
import { cn } from "@/lib/utils";

import { SortableFavoritesRow, type FavoriteSortableProps } from "./SortableFavoritesRow";

type FavoritesSectionProps = {
  accounts: O5Account[];
  activeAccountId?: string;
  showCompany?: boolean;
  jumpEnabled?: boolean;
  targetUrl?: string | null;
  windowFeatures?: string;
  sortable?: boolean;
  onToggleFavorite: (accountId: string) => void;
};

export function FavoritesSection({
  accounts,
  activeAccountId,
  showCompany = false,
  jumpEnabled = false,
  targetUrl = null,
  windowFeatures,
  sortable = true,
  onToggleFavorite,
}: FavoritesSectionProps) {
  if (accounts.length === 0) return null;

  return (
    <section
      className="shrink-0 border-b border-neutral-200/40 bg-slate-50/20 backdrop-blur-md px-4 py-3 z-10"
      aria-label="常用账号"
    >
      <p className="mb-2.5 flex min-w-0 items-center gap-1.5 text-xs font-bold tracking-wider text-amber-600/90 uppercase">
        <Icon
          icon={StarIcon}
          className="size-4 shrink-0 text-amber-500 fill-amber-400 animate-pulse"
        />
        <span className="min-w-0 truncate">
          常用账号 ({accounts.length})
          {sortable && (
            <span className="font-normal normal-case tracking-normal text-slate-400/90">
              {" "}
              · 按住拖动排序
            </span>
          )}
        </span>
      </p>
      <SortableFavoritesRow
        accounts={accounts}
        renderChip={(account, sortable) => (
          <FavoriteChip
            account={account}
            isActive={account.id === activeAccountId}
            showCompany={showCompany}
            jumpEnabled={jumpEnabled}
            targetUrl={targetUrl}
            windowFeatures={windowFeatures}
            sortable={sortable}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      />
    </section>
  );
}

export function FavoriteChip({
  account,
  isActive,
  showCompany,
  jumpEnabled,
  targetUrl,
  windowFeatures,
  sortable,
  onToggleFavorite,
}: {
  account: O5Account;
  isActive: boolean;
  showCompany: boolean;
  jumpEnabled: boolean;
  targetUrl: string | null;
  windowFeatures?: string;
  sortable: FavoriteSortableProps | null;
  onToggleFavorite: (accountId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const defaultCorp = account.corpList[0];

  const handleOpen = (event: MouseEvent | KeyboardEvent) => {
    if (sortable?.isDragging || !jumpEnabled || !defaultCorp) return;
    const ctrlKey = "ctrlKey" in event && (event.ctrlKey || event.metaKey);
    void openAccountJump({
      username: account.username,
      password: account.password,
      corpId: defaultCorp.corpId,
      targetUrl: targetUrl ?? "",
      features: windowFeatures,
      ctrlKey,
    });
  };

  const handleCopy = async (event: MouseEvent) => {
    event.stopPropagation();
    await copyPhone(accountPhone(account));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleFavorite = (event: MouseEvent) => {
    event.stopPropagation();
    onToggleFavorite(account.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen(event);
    }
  };

  return (
    <div
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      {...sortable?.attributes}
      {...sortable?.listeners}
      className={cn(
        favoriteChipClasses(isActive),
        sortable && "touch-none select-none cursor-grab active:cursor-grabbing",
        sortable?.isDragging && "opacity-35 shadow-lg ring-2 ring-amber-400/40",
      )}
      data-account-id={account.id}
      role="button"
      tabIndex={0}
      aria-label={`打开 ${account.name} 的登录页`}
      title={sortable ? "按住拖动排序" : undefined}
      onClick={(event) => jumpEnabled && handleOpen(event)}
      onKeyDown={handleKeyDown}
    >
      <span
        className="min-w-0 flex-1 truncate px-2.5 py-1.5 font-semibold"
        title={
          showCompany && defaultCorp
            ? `${account.name} · ${accountOrgLabel(account)}`
            : account.name
        }
      >
        {account.name}
        {showCompany && defaultCorp && (
          <span className="text-slate-400/80 font-normal"> · {accountOrgLabel(account)}</span>
        )}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={copied}
          className={cn(
            "h-8 w-8 shrink-0 rounded-full p-0",
            favoriteChipIconClasses(copied ? "copied" : "copy"),
          )}
          aria-label={copied ? `已复制 ${account.name} 的手机号` : `复制 ${account.name} 的手机号`}
          onClick={(event) => void handleCopy(event)}
        >
          {copied ? (
            <Icon icon={Tick01Icon} className="size-3.5 animate-in fade-in zoom-in duration-200" />
          ) : (
            <Icon icon={Copy01Icon} className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 shrink-0 rounded-full p-0", favoriteChipIconClasses("star"))}
          aria-label={`取消收藏 ${account.name}`}
          aria-pressed
          onClick={handleToggleFavorite}
        >
          <Icon icon={StarIcon} className="size-3.5 fill-current" />
        </Button>
      </div>
    </div>
  );
}
