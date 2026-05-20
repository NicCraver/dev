import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "motion/react";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { O5Account } from "@/types/o5-env";

import { useHoldToDragSensors } from "./useHoldToDragSensors";

type AccountPanelSortableContextValue = {
  dragEnabled: boolean;
  activeId: string | null;
};

const AccountPanelSortableContext = createContext<AccountPanelSortableContextValue | null>(null);

export function useAccountPanelSortable() {
  const ctx = useContext(AccountPanelSortableContext);
  if (!ctx) {
    throw new Error("useAccountPanelSortable must be used within AccountPanelSortable");
  }
  return ctx;
}

type AccountPanelSortableProps = {
  dragEnabled: boolean;
  favoriteAccounts: O5Account[];
  gridAccounts: O5Account[];
  onReorderFavorites: (activeId: string, overId: string) => void;
  onReorderGrid: (activeId: string, overId: string) => void;
  renderFavoriteOverlay: (account: O5Account) => ReactNode;
  renderGridOverlay: (account: O5Account) => ReactNode;
  children: ReactNode;
};

export function AccountPanelSortable({
  dragEnabled,
  favoriteAccounts,
  gridAccounts,
  onReorderFavorites,
  onReorderGrid,
  renderFavoriteOverlay,
  renderGridOverlay,
  children,
}: AccountPanelSortableProps) {
  const sensors = useHoldToDragSensors();
  const [activeId, setActiveId] = useState<string | null>(null);

  const favoriteIds = useMemo(
    () => new Set(favoriteAccounts.map((account) => account.id)),
    [favoriteAccounts],
  );
  const accountById = useMemo(() => {
    const map = new Map<string, O5Account>();
    for (const account of [...favoriteAccounts, ...gridAccounts]) {
      map.set(account.id, account);
    }
    return map;
  }, [favoriteAccounts, gridAccounts]);

  const activeAccount = activeId ? accountById.get(activeId) : undefined;
  const activeIsFavorite = activeId ? favoriteIds.has(activeId) : false;

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (!dragEnabled) return;
    setActiveId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!dragEnabled || !over || active.id === over.id) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);
    const activeInFavorites = favoriteIds.has(activeItemId);
    const overInFavorites = favoriteIds.has(overItemId);

    if (activeInFavorites && overInFavorites) {
      onReorderFavorites(activeItemId, overItemId);
      return;
    }

    if (!activeInFavorites && !overInFavorites) {
      onReorderGrid(activeItemId, overItemId);
    }
  };

  const contextValue = useMemo(() => ({ dragEnabled, activeId }), [dragEnabled, activeId]);

  if (!dragEnabled) {
    return (
      <AccountPanelSortableContext.Provider value={{ dragEnabled: false, activeId: null }}>
        {children}
      </AccountPanelSortableContext.Provider>
    );
  }

  return (
    <AccountPanelSortableContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {children}
        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeAccount ? (
            <motion.div
              layout
              initial={false}
              animate={
                activeIsFavorite
                  ? { scale: 1.04, rotate: -1 }
                  : { scale: 1.03, boxShadow: "0 16px 40px -12px rgba(52, 110, 238, 0.35)" }
              }
              className={
                activeIsFavorite
                  ? "cursor-grabbing rounded-full ring-2 ring-amber-400/50 shadow-lg"
                  : "cursor-grabbing rounded-xl ring-2 ring-primary/30"
              }
            >
              {activeIsFavorite
                ? renderFavoriteOverlay(activeAccount)
                : renderGridOverlay(activeAccount)}
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </AccountPanelSortableContext.Provider>
  );
}
