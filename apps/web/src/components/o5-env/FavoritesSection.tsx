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
    <section
      className="border-border shrink-0 border-b bg-astral-deep/30 px-4 py-2 backdrop-blur-sm"
      aria-label="常用账号"
    >
      <p className="text-lunar-dust mb-2 text-xs font-medium tracking-wide uppercase">
        常用 ({accounts.length})
      </p>
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
        "border-violet-edge bg-midnight-gaze inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm shadow-md",
        isActive && "border-starlight-violet ring-starlight-violet/40 ring-2",
      )}
      data-account-id={account.id}
    >
      <button
        type="button"
        className="text-lunar-dust hover:text-crystal-white flex items-center gap-1 rounded-full px-1 py-0.5 transition-colors"
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <>
            <Check className="text-etherium-blue size-3.5" />
            <span className="text-etherium-blue text-xs">已复制</span>
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
        className="text-starlight-violet h-6 w-6 rounded-full p-0"
        aria-label={`取消收藏 ${account.name}`}
        aria-pressed
        onClick={() => onToggleFavorite(account.id)}
      >
        <Star className="size-3.5 fill-current" />
      </Button>
    </div>
  );
}
