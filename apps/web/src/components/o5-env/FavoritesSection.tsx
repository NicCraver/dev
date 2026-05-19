import { Check, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { O5Account } from "@/mocks/o5-env";
import { copyPhone } from "@/lib/copy-phone";
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
    <section className="shrink-0 border-b bg-white px-4 py-2" aria-label="常用账号">
      <p className="text-muted-foreground mb-2 text-xs font-medium">常用 ({accounts.length})</p>
      <div className="flex flex-wrap gap-2">
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
    <div
      className={cn(
        "bg-card inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm shadow-xs",
        isActive && "border-primary ring-primary/30 ring-2",
      )}
      data-account-id={account.id}
    >
      <button
        type="button"
        className="hover:bg-muted/60 flex items-center gap-1 rounded px-1 py-0.5 transition-colors"
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <>
            <Check className="text-primary size-3.5" />
            <span className="text-primary text-xs">已复制</span>
          </>
        ) : (
          <span>
            {account.name} · {account.org}
          </span>
        )}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-primary h-6 w-6 p-0"
        aria-label={`取消收藏 ${account.name}`}
        aria-pressed
        onClick={() => onToggleFavorite(account.id)}
      >
        <Star className="size-3.5 fill-current" />
      </Button>
    </div>
  );
}
