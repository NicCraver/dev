import { Copy01Icon, CopyLinkIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { type IconSvgElement } from "@hugeicons/react";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { copyPhone } from "@/lib/copy-phone";
import { favoriteChipIconClasses, iconGhostClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";
import type { AccountJumpRequest } from "@mt-dev/shared";
import { buildAccountJumpUrl } from "@/lib/account-jump";

const HOVER_DELAY_MS = 500;

type CopyValueButtonProps = {
  /** 悬停气泡里预览的文本 */
  preview: string;
  /** 要复制到剪贴板的内容；提供 getValue 时以异步结果为准 */
  value?: string;
  /** 异步取复制内容（如登录后拼接的跳转地址） */
  getValue?: () => Promise<string>;
  /** 所属账号名，用于无障碍标签 */
  subject: string;
  /** 复制内容的类型名，如「手机号」「地址」 */
  kind: string;
  variant: "labeled" | "icon" | "card";
  defaultIcon: IconSvgElement;
};

type BubblePos = { left: number; top: number };

function ValueBubble({ text, compact, pos }: { text: string; compact?: boolean; pos: BubblePos }) {
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
          "font-mono font-semibold tabular-nums tracking-wide",
          "dark:border-primary/40 dark:bg-primary/15 dark:text-zinc-100",
          "max-w-[320px] truncate",
          compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        )}
        title={text}
      >
        {text}
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

function CopyValueButton({
  preview,
  value,
  getValue,
  subject,
  kind,
  variant,
  defaultIcon,
}: CopyValueButtonProps) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    if (!showPreview || copied) {
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
  }, [showPreview, copied, variant]);

  const handleMouseEnter = () => {
    if (copied || copying) return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setShowPreview(true), HOVER_DELAY_MS);
  };

  const handleMouseLeave = () => {
    clearHoverTimer();
    setShowPreview(false);
  };

  const handleCopy = async (event: MouseEvent) => {
    event.stopPropagation();
    if (copying) return;
    clearHoverTimer();
    setShowPreview(false);
    setCopying(true);
    try {
      const text = getValue ? await getValue() : value;
      if (!text) return;
      const ok = await copyPhone(text);
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error(`复制${kind}失败:`, error);
      const message = error instanceof Error ? error.message : `复制${kind}失败，请重试`;
      alert(message);
    } finally {
      setCopying(false);
    }
  };

  const previewActive = showPreview && !copied && bubblePos;
  const ariaLabel = copied ? `已复制 ${subject} 的${kind}` : `复制 ${subject} 的${kind}`;

  if (variant === "labeled") {
    return (
      <div
        ref={wrapRef}
        className="relative shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {previewActive && <ValueBubble text={preview} pos={bubblePos} />}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={copied || copying}
          className={cn(
            "h-8 shrink-0 gap-1.5 px-2.5 font-medium text-xs transition-all duration-200",
            copied
              ? "cursor-default border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 opacity-100 shadow-2xs active:scale-100 dark:bg-emerald-500/15 dark:text-emerald-400"
              : iconGhostClasses("primary"),
          )}
          aria-label={ariaLabel}
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
              <Icon icon={defaultIcon} className="size-3.5" />
              复制
            </>
          )}
        </Button>
      </div>
    );
  }

  const isChip = variant === "icon";
  const copiedClasses = cn(
    "cursor-default",
    isChip
      ? favoriteChipIconClasses("copied")
      : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 shadow-2xs active:scale-100 dark:bg-emerald-500/15 dark:text-emerald-400",
  );
  const buttonClassName = cn(
    isChip ? "size-6 shrink-0 rounded-full p-0" : "h-8 w-8 shrink-0 rounded-lg p-0",
    "transition-all duration-200",
    copied ? copiedClasses : isChip ? favoriteChipIconClasses("copy") : iconGhostClasses("primary"),
  );

  return (
    <div
      ref={wrapRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {previewActive && <ValueBubble text={preview} compact pos={bubblePos} />}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={copied || copying}
        className={buttonClassName}
        aria-label={ariaLabel}
        onClick={(event) => void handleCopy(event)}
      >
        {copied ? (
          <Icon icon={Tick01Icon} className="size-3 animate-in fade-in zoom-in duration-200" />
        ) : (
          <Icon icon={defaultIcon} className="size-3" />
        )}
      </Button>
    </div>
  );
}

type CopyPhoneButtonProps = {
  phone: string;
  accountName: string;
  variant: "labeled" | "icon";
};

export function CopyPhoneButton({ phone, accountName, variant }: CopyPhoneButtonProps) {
  return (
    <CopyValueButton
      value={phone}
      preview={phone}
      subject={accountName}
      kind="手机号"
      variant={variant}
      defaultIcon={Copy01Icon}
    />
  );
}

type CopyAddressButtonProps = {
  jumpRequest: AccountJumpRequest;
  accountName: string;
  variant?: "labeled" | "icon" | "card";
};

export function CopyAddressButton({
  jumpRequest,
  accountName,
  variant = "card",
}: CopyAddressButtonProps) {
  return (
    <CopyValueButton
      preview={jumpRequest.targetUrl}
      getValue={() => buildAccountJumpUrl(jumpRequest)}
      subject={accountName}
      kind="地址"
      variant={variant}
      defaultIcon={CopyLinkIcon}
    />
  );
}
