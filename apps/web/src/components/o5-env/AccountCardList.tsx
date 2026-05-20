import { Search01Icon, UserAdd01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { accountPhone, type O5Account } from "@/types/o5-env";
import { filterAccounts } from "@/lib/account-search";
import { iconGhostClasses } from "@/lib/interaction";
import { useModShortcut } from "@/lib/keyboard-shortcut";
import { copyPhone } from "@/lib/copy-phone";
import { useGridColumns } from "@/hooks/useGridColumns";
import { resolveGridColumns, useO5GridLayout, type O5GridLayout } from "@/hooks/useO5GridLayout";
import { useO5AccountOrder } from "@/hooks/useO5AccountOrder";
import { useO5Favorites } from "@/hooks/useO5Favorites";
import { useO5ShowCompany } from "@/hooks/useO5ShowCompany";
import { cn } from "@/lib/utils";

import { AccountCard } from "./AccountCard";
import { AccountLayoutSwitcher } from "./AccountLayoutSwitcher";
import { AccountShowCompanyToggle } from "./AccountShowCompanyToggle";
import { AccountSearchBar, type AccountSearchBarHandle } from "./AccountSearchBar";
import { AddUserDialog } from "./AddUserDialog";
import { AccountPanelSortable } from "./AccountPanelSortable";
import { FavoritesSection, FavoriteChip } from "./FavoritesSection";
import { SortableAccountGrid } from "./SortableAccountGrid";

type AccountCardListProps = {
  accounts: O5Account[];
  environmentName: string | null;
  systemKvId?: string | null;
  writable?: boolean;
  targetUrl?: string | null;
  windowFeatures?: string;
  onRefetch?: () => void;
};

export function AccountCardList({
  accounts,
  environmentName,
  systemKvId = null,
  writable = false,
  targetUrl = null,
  windowFeatures,
  onRefetch,
}: AccountCardListProps) {
  const jumpEnabled = Boolean(targetUrl?.trim());
  const { favorites, isFavorite, toggleFavorite, reorderFavorites } = useO5Favorites();
  const { sortAccounts, reorderAccounts } = useO5AccountOrder(systemKvId);
  const { layout, setLayout } = useO5GridLayout();
  const { showCompany, setShowCompany } = useO5ShowCompany();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const canWrite = writable && Boolean(systemKvId);
  const searchRef = useRef<AccountSearchBarHandle>(null);
  const [gridNode, setGridNode] = useState<HTMLDivElement | null>(null);
  const autoColumns = useGridColumns(gridNode);
  const columns = resolveGridColumns(layout, autoColumns);

  const orderedAccounts = useMemo(() => sortAccounts(accounts), [accounts, sortAccounts]);

  const filteredAccounts = useMemo(
    () => filterAccounts(orderedAccounts, searchQuery),
    [orderedAccounts, searchQuery],
  );

  const favoriteAccounts = useMemo(() => {
    const byId = new Map(filteredAccounts.map((account) => [account.id, account]));
    return favorites
      .map((id) => byId.get(id))
      .filter((account): account is O5Account => account != null);
  }, [filteredAccounts, favorites]);

  const gridAccounts = useMemo(
    () => filteredAccounts.filter((account) => !isFavorite(account.id)),
    [filteredAccounts, isFavorite],
  );

  const navigableAccounts = useMemo(
    () => [...favoriteAccounts, ...gridAccounts],
    [favoriteAccounts, gridAccounts],
  );

  useEffect(() => {
    setSearchQuery("");
    setSearchOpen(false);
    setActiveIndex(-1);
  }, [environmentName]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setActiveIndex(-1);
    searchRef.current?.blur();
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 180);
    return () => window.clearTimeout(id);
  }, [searchOpen]);

  useEffect(() => {
    if (activeIndex >= navigableAccounts.length) {
      setActiveIndex(navigableAccounts.length > 0 ? navigableAccounts.length - 1 : -1);
    }
  }, [activeIndex, navigableAccounts.length]);

  const copyActiveAccount = useCallback(async () => {
    const account = navigableAccounts[activeIndex];
    if (!account) return;
    await copyPhone(accountPhone(account));
  }, [activeIndex, navigableAccounts]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (searchQuery) {
        setSearchQuery("");
        setActiveIndex(-1);
      } else {
        closeSearch();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (navigableAccounts.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % navigableAccounts.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (navigableAccounts.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? navigableAccounts.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void copyActiveAccount();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!environmentName || accounts.length === 0) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [accounts.length, environmentName]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const account = navigableAccounts[activeIndex];
    if (!account) return;
    const panel = gridNode?.closest("[data-account-panel]");
    const element = panel?.querySelector(`[data-account-id="${account.id}"]`);
    element?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, gridNode, navigableAccounts]);

  if (!environmentName) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center p-8 text-center bg-[#f8fafc] dark:bg-neutral-950/20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10 shadow-[0_4px_16px_rgba(52,110,238,0.06)] text-primary mb-4">
          <Icon icon={UserGroupIcon} className="size-6 text-primary/85" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">请选择一个环境</h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] leading-relaxed">
          在左侧点击对应的系统和具体环境，即可开始浏览该环境下的测试账号并快捷一键复制。
        </p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8fafc] dark:bg-neutral-950/20"
        data-account-panel
      >
        <AccountListHeader
          environmentName={environmentName}
          count={0}
          layout={layout}
          showCompany={showCompany}
          canWrite={canWrite}
          onShowCompanyChange={setShowCompany}
          onLayoutChange={setLayout}
          onAddUser={() => setAddUserOpen(true)}
        />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 text-slate-400 mb-4">
            <Icon icon={UserGroupIcon} className="size-6 text-slate-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">该环境下暂无账号</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-[260px] leading-relaxed">
            当前环境尚未登记测试账号，可点击右上角「添加账号」手动登记。
          </p>
        </div>
        {systemKvId && (
          <AddUserDialog
            open={addUserOpen}
            kvId={systemKvId}
            onClose={() => setAddUserOpen(false)}
            onSuccess={() => onRefetch?.()}
          />
        )}
      </div>
    );
  }

  const activeAccountId = activeIndex >= 0 ? navigableAccounts[activeIndex]?.id : undefined;
  const dragEnabled = !searchQuery.trim();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" data-account-panel>
      <AccountListHeader
        environmentName={environmentName}
        count={accounts.length}
        layout={layout}
        showCompany={showCompany}
        canWrite={canWrite}
        searchOpen={searchOpen}
        onShowCompanyChange={setShowCompany}
        onLayoutChange={setLayout}
        onOpenSearch={() => setSearchOpen(true)}
        onAddUser={() => setAddUserOpen(true)}
      />
      <AccountSearchBar
        ref={searchRef}
        open={searchOpen}
        onOpenChange={(open) => {
          if (open) {
            setSearchOpen(true);
            return;
          }
          closeSearch();
        }}
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setActiveIndex(-1);
        }}
        matchCount={filteredAccounts.length}
        totalCount={accounts.length}
        onKeyDown={handleSearchKeyDown}
      />
      <AccountPanelSortable
        dragEnabled={dragEnabled}
        favoriteAccounts={favoriteAccounts}
        gridAccounts={gridAccounts}
        onReorderFavorites={(activeId, overId) =>
          reorderFavorites(
            activeId,
            overId,
            favoriteAccounts.map((account) => account.id),
          )
        }
        onReorderGrid={(activeId, overId) =>
          reorderAccounts(
            orderedAccounts,
            orderedAccounts.filter((account) => !isFavorite(account.id)),
            activeId,
            overId,
          )
        }
        renderFavoriteOverlay={(account) => (
          <FavoriteChip
            account={account}
            isActive={account.id === activeAccountId}
            showCompany={showCompany}
            jumpEnabled={jumpEnabled}
            targetUrl={targetUrl}
            windowFeatures={windowFeatures}
            sortable={null}
            onToggleFavorite={toggleFavorite}
          />
        )}
        renderGridOverlay={(account) => (
          <AccountCard
            account={account}
            isFavorite={isFavorite(account.id)}
            isActive={account.id === activeAccountId}
            searchQuery={searchQuery}
            showCompany={showCompany}
            jumpEnabled={jumpEnabled}
            targetUrl={targetUrl}
            windowFeatures={windowFeatures}
            isDragging
            onToggleFavorite={toggleFavorite}
          />
        )}
      >
        <FavoritesSection
          accounts={favoriteAccounts}
          activeAccountId={activeAccountId}
          showCompany={showCompany}
          jumpEnabled={jumpEnabled}
          targetUrl={targetUrl}
          windowFeatures={windowFeatures}
          sortable={dragEnabled}
          onToggleFavorite={toggleFavorite}
        />
        <div
          ref={setGridNode}
          className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          role="region"
          aria-label="账号列表"
        >
          {filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-transparent">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-neutral-800/40 text-slate-400 dark:text-zinc-500 mb-4 border border-slate-200/50 dark:border-zinc-800">
                <Icon icon={UserGroupIcon} className="size-5 text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                未找到匹配账号
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed mb-4">
                试着搜索其他关键词，或者点击下方按钮快速清空当前搜索词。
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg font-medium text-xs shadow-2xs hover:bg-slate-50 transition-all active:scale-95 px-3 py-1.5"
                onClick={() => setSearchQuery("")}
              >
                清空搜索
              </Button>
            </div>
          ) : (
            <SortableAccountGrid
              accounts={gridAccounts}
              columns={columns}
              renderCard={(account, { isDragging }) => (
                <AccountCard
                  account={account}
                  isFavorite={isFavorite(account.id)}
                  isActive={account.id === activeAccountId}
                  searchQuery={searchQuery}
                  showCompany={showCompany}
                  jumpEnabled={jumpEnabled}
                  targetUrl={targetUrl}
                  windowFeatures={windowFeatures}
                  isDragging={isDragging}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            />
          )}
        </div>
      </AccountPanelSortable>
      {systemKvId && (
        <AddUserDialog
          open={addUserOpen}
          kvId={systemKvId}
          onClose={() => setAddUserOpen(false)}
          onSuccess={() => onRefetch?.()}
        />
      )}
    </div>
  );
}

function AccountListHeader({
  environmentName,
  count,
  layout,
  showCompany,
  canWrite,
  searchOpen,
  onLayoutChange,
  onShowCompanyChange,
  onOpenSearch,
  onAddUser,
}: {
  environmentName: string;
  count: number;
  layout: O5GridLayout;
  showCompany: boolean;
  canWrite?: boolean;
  searchOpen?: boolean;
  onLayoutChange: (layout: O5GridLayout) => void;
  onShowCompanyChange: (show: boolean) => void;
  onOpenSearch?: () => void;
  onAddUser?: () => void;
}) {
  const searchShortcut = useModShortcut("f");
  const metaText =
    count > 0 ? (
      <>
        共 <span className="text-primary font-bold tabular-nums">{count}</span> 个账号
      </>
    ) : (
      "暂无登记账号"
    );

  return (
    <header className="z-20 flex shrink-0 flex-col gap-1 border-b border-neutral-200/40 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 dark:bg-zinc-950/80">
      <div className="flex min-w-0 items-center gap-2">
        <h1
          className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-slate-800 dark:text-zinc-100"
          title={environmentName}
        >
          {environmentName}
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          <AccountShowCompanyToggle showCompany={showCompany} onChange={onShowCompanyChange} />
          <AccountLayoutSwitcher layout={layout} onChange={onLayoutChange} />
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        <span className="text-muted-foreground min-w-0 truncate text-xs font-medium">
          {metaText}
        </span>
        {!searchOpen && onOpenSearch && count > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 shrink-0 p-0",
              iconGhostClasses("neutral"),
              "hover:!bg-primary-subtle hover:!text-foreground",
            )}
            title={`搜索 (${searchShortcut})`}
            aria-label={`搜索 (${searchShortcut})`}
            onClick={onOpenSearch}
          >
            <Icon icon={Search01Icon} className="size-3.5" strokeWidth={1.75} />
          </Button>
        )}
        {onAddUser && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 shrink-0 p-0",
              canWrite
                ? cn(iconGhostClasses("neutral"), "hover:!bg-primary-subtle hover:!text-foreground")
                : "text-muted-foreground opacity-40",
            )}
            title={canWrite ? "添加账号" : "需连接 MongoDB 且选中系统"}
            aria-label="添加账号"
            disabled={!canWrite}
            onClick={onAddUser}
          >
            <Icon icon={UserAdd01Icon} className="size-3.5" strokeWidth={1.75} />
          </Button>
        )}
      </div>
    </header>
  );
}
