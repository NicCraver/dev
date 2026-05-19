import { Check, Copy, Star } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { O5Account } from "@/mocks/o5-env";
import { copyPhone } from "@/lib/copy-phone";
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
    <article className={accountCardClassName(isActive)} data-account-id={account.id}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-base font-medium tracking-tight text-crystal-white">
          <HighlightText text={account.name} query={searchQuery} />
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              isFavorite ? "text-starlight-violet" : "text-lunar-dust hover:text-crystal-white",
            )}
            aria-label={isFavorite ? `取消收藏 ${account.name}` : `收藏 ${account.name}`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(account.id)}
          >
            <Star className={cn("size-3.5", isFavorite && "fill-current")} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-lunar-dust hover:text-etherium-blue h-8 shrink-0 gap-1 rounded-full px-2"
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                已复制
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                复制
              </>
            )}
          </Button>
        </div>
      </div>
      <Badge
        variant="secondary"
        className="bg-astral-deep text-action-muted mt-2 max-w-full truncate rounded-full border border-violet-edge font-normal"
      >
        <HighlightText text={account.org} query={searchQuery} />
      </Badge>
    </article>
  );
}
