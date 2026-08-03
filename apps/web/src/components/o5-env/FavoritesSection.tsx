import { StarIcon } from "@hugeicons/core-free-icons";
import { type KeyboardEvent, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { openAccountJump } from "@/lib/account-jump";
import { favoriteChipClasses, favoriteChipIconClasses, focusRing } from "@/lib/interaction";
import { accountOrgLabel, accountPhone, type O5Account } from "@/types/o5-env";
import { cn } from "@/lib/utils";

import { CopyPhoneButton } from "./CopyPhoneButton";
import { o5SectionHeaderClasses, o5SectionHeaderHintClasses } from "./o5-section-header";
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
      <p className={cn(o5SectionHeaderClasses, "mb-2.5 text-amber-600/90")}>
        <Icon
          icon={StarIcon}
          className="size-3.5 shrink-0 text-amber-500 fill-amber-400 animate-pulse"
        />
        <span className="min-w-0 truncate">
          常用账号 ({accounts.length})
          {sortable && <span className={o5SectionHeaderHintClasses}> · 按住拖动排序</span>}
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
  const defaultCorp = account.corpList[0];
  const phone = accountPhone(account);

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

  const handleToggleFavorite = (event: MouseEvent) => {
    event.stopPropagation();
    onToggleFavorite(account.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
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
      title={sortable ? "按住拖动排序" : undefined}
    >
      <button
        type="button"
        className={cn(
          focusRing,
          "min-w-0 flex-1 truncate rounded-3xl border-0 bg-transparent pl-3 pr-1 py-2 text-left font-semibold",
          jumpEnabled ? "cursor-pointer" : "cursor-default",
        )}
        aria-label={`打开 ${account.name} 的登录页`}
        disabled={!jumpEnabled || !defaultCorp}
        onClick={(event) => jumpEnabled && handleOpen(event)}
        onKeyDown={handleKeyDown}
      >
        <span
          className="block truncate"
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
      </button>
      {!sortable?.anyDragging && (
        <div className="flex shrink-0 items-center pr-0.5">
          <CopyPhoneButton phone={phone} accountName={account.name} variant="icon" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("size-6 shrink-0 rounded-full p-0", favoriteChipIconClasses("star"))}
            aria-label={`取消收藏 ${account.name}`}
            aria-pressed
            onClick={handleToggleFavorite}
          >
            <Icon icon={StarIcon} className="size-3 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
}
