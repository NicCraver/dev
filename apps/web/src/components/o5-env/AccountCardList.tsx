import { Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { O5Account } from "@/mocks/o5-env";
import { filterAccounts } from "@/lib/account-search";
import { copyPhone } from "@/lib/copy-phone";
import { useGridColumns } from "@/hooks/useGridColumns";
import { resolveGridColumns, useO5GridLayout, type O5GridLayout } from "@/hooks/useO5GridLayout";
import { useO5Favorites } from "@/hooks/useO5Favorites";

import { AccountCard } from "./AccountCard";
import { AccountLayoutSwitcher } from "./AccountLayoutSwitcher";
import { AccountSearchBar, type AccountSearchBarHandle } from "./AccountSearchBar";
import { FavoritesSection } from "./FavoritesSection";

type AccountCardListProps = {
  accounts: O5Account[];
  environmentName: string | null;
};

export function AccountCardList({ accounts, environmentName }: AccountCardListProps) {
  const { isFavorite, toggleFavorite } = useO5Favorites();
  const { layout, setLayout } = useO5GridLayout();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<AccountSearchBarHandle>(null);
  const [gridNode, setGridNode] = useState<HTMLDivElement | null>(null);
  const autoColumns = useGridColumns(gridNode);
  const columns = resolveGridColumns(layout, autoColumns);

  const filteredAccounts = useMemo(
    () => filterAccounts(accounts, searchQuery),
    [accounts, searchQuery],
  );

  const favoriteAccounts = useMemo(
    () => filteredAccounts.filter((account) => isFavorite(account.id)),
    [filteredAccounts, isFavorite],
  );

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
    await copyPhone(account.phone);
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
      <div className="text-muted-foreground flex h-full min-h-0 flex-col items-center justify-center gap-2 text-sm">
        <Users className="text-muted-foreground/50 size-10" strokeWidth={1.25} />
        <p>请选择一个环境</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden" data-account-panel>
        <AccountListHeader
          environmentName={environmentName}
          count={0}
          layout={layout}
          onLayoutChange={setLayout}
        />
        <div className="text-muted-foreground flex min-h-0 flex-1 flex-col items-center justify-center gap-1 text-sm">
          <p>该环境下暂无账号</p>
        </div>
      </div>
    );
  }

  const activeAccountId = activeIndex >= 0 ? navigableAccounts[activeIndex]?.id : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" data-account-panel>
      <AccountListHeader
        environmentName={environmentName}
        count={accounts.length}
        layout={layout}
        searchOpen={searchOpen}
        onLayoutChange={setLayout}
        onOpenSearch={() => setSearchOpen(true)}
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
      <FavoritesSection
        accounts={favoriteAccounts}
        activeAccountId={activeAccountId}
        onToggleFavorite={toggleFavorite}
      />
      <div
        ref={setGridNode}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        role="region"
        aria-label="账号列表"
      >
        {filteredAccounts.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-sm">
            <p>未找到匹配账号</p>
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              清空搜索
            </Button>
          </div>
        ) : (
          <div
            className="grid gap-3 p-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {gridAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                isFavorite={isFavorite(account.id)}
                isActive={account.id === activeAccountId}
                searchQuery={searchQuery}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountListHeader({
  environmentName,
  count,
  layout,
  searchOpen,
  onLayoutChange,
  onOpenSearch,
}: {
  environmentName: string;
  count: number;
  layout: O5GridLayout;
  searchOpen?: boolean;
  onLayoutChange: (layout: O5GridLayout) => void;
  onOpenSearch?: () => void;
}) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 border-b bg-white px-4 py-3">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{environmentName}</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {count > 0 ? `${count} 个账号` : "暂无账号"}
          {!searchOpen && onOpenSearch && count > 0 && (
            <>
              {" · "}
              <button
                type="button"
                className="hover:text-foreground underline-offset-2 transition-colors hover:underline"
                onClick={onOpenSearch}
              >
                <kbd className="font-mono">⌘F</kbd> 搜索
              </button>
            </>
          )}
        </p>
      </div>
      <AccountLayoutSwitcher layout={layout} onChange={onLayoutChange} />
    </header>
  );
}
