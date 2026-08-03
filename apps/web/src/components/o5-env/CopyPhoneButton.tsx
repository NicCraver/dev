import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { copyPhone } from "@/lib/copy-phone";
import { favoriteChipIconClasses, iconGhostClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

const HOVER_DELAY_MS = 500;

type CopyPhoneButtonProps = {
  phone: string;
  accountName: string;
  variant: "labeled" | "icon";
};

type BubblePos = { left: number; top: number };

function PhoneBubble({
  phone,
  compact,
  pos,
}: {
  phone: string;
  compact?: boolean;
  pos: BubblePos;
}) {
  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed z-[100]",
        "animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-200",
      )}
      style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -100%)" }}
      role="tooltip"
    >
      <div
        className={cn(
          "rounded-xl border border-[#b8c8f0] bg-[#eef2fb] text-slate-700 shadow-sm",
          "font-mono font-semibold tabular-nums tracking-wide whitespace-nowrap",
          "dark:border-primary/40 dark:bg-primary/15 dark:text-zinc-100",
          compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        )}
      >
        {phone}
      </div>
      <div
        className={cn(
          "mx-auto h-0 w-0 border-x-transparent border-t-[#5b7fd9]",
          compact ? "border-x-[5px] border-t-[5px]" : "border-x-[6px] border-t-[6px]",
        )}
      />
    </div>,
    document.body,
  );
}

export function CopyPhoneButton({ phone, accountName, variant }: CopyPhoneButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [bubblePos, setBubblePos] = useState<BubblePos | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const updateBubblePos = () => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = variant === "icon" ? 6 : 8;
    setBubblePos({
      left: rect.left + rect.width / 2,
      top: rect.top - gap,
    });
  };

  useEffect(() => () => clearHoverTimer(), []);

  useLayoutEffect(() => {
    if (!showPhone || copied) {
      setBubblePos(null);
      return;
    }
    updateBubblePos();
    const onScrollOrResize = () => updateBubblePos();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [showPhone, copied, variant]);

  const handleMouseEnter = () => {
    if (copied) return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setShowPhone(true), HOVER_DELAY_MS);
  };

  const handleMouseLeave = () => {
    clearHoverTimer();
    setShowPhone(false);
  };

  const handleCopy = async (event: MouseEvent) => {
    event.stopPropagation();
    const ok = await copyPhone(phone);
    if (!ok) return;
    clearHoverTimer();
    setShowPhone(false);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const previewActive = showPhone && !copied && bubblePos;

  if (variant === "labeled") {
    return (
      <div
        ref={wrapRef}
        className="relative shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {previewActive && <PhoneBubble phone={phone} pos={bubblePos} />}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={copied}
          className={cn(
            "h-8 shrink-0 gap-1.5 px-2.5 font-medium text-xs transition-all duration-200",
            copied
              ? "cursor-default border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 opacity-100 shadow-2xs active:scale-100 dark:bg-emerald-500/15 dark:text-emerald-400"
              : iconGhostClasses("primary"),
          )}
          aria-label={copied ? `已复制 ${accountName} 的手机号` : `复制 ${accountName} 的手机号`}
          onClick={(event) => void handleCopy(event)}
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
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {previewActive && <PhoneBubble phone={phone} compact pos={bubblePos} />}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={copied}
        className={cn(
          "size-6 shrink-0 rounded-full p-0 transition-all duration-200",
          copied ? favoriteChipIconClasses("copied") : favoriteChipIconClasses("copy"),
        )}
        aria-label={copied ? `已复制 ${accountName} 的手机号` : `复制 ${accountName} 的手机号`}
        onClick={(event) => void handleCopy(event)}
      >
        {copied ? (
          <Icon icon={Tick01Icon} className="size-3 animate-in fade-in zoom-in duration-200" />
        ) : (
          <Icon icon={Copy01Icon} className="size-3" />
        )}
      </Button>
    </div>
  );
}
