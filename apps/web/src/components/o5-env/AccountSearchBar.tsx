import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { iconGhostClasses, searchFieldClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

export type AccountSearchBarHandle = {
  focus: () => void;
  blur: () => void;
  open: () => void;
};

type AccountSearchBarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  matchCount: number;
  totalCount: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const AccountSearchBar = forwardRef<AccountSearchBarHandle, AccountSearchBarProps>(
  function AccountSearchBar(
    { open, onOpenChange, value, onChange, matchCount, totalCount, onKeyDown },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasQuery = value.trim().length > 0;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      open: () => onOpenChange(true),
    }));

    const handleBlur = () => {
      if (!hasQuery) {
        onOpenChange(false);
      }
    };

    return (
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="account-search"
            role="search"
            aria-label="搜索账号，支持中文、拼音全拼、拼音首字母、英文、手机号"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 overflow-hidden border-b border-neutral-200/40 bg-white/90 backdrop-blur-md"
          >
            <div className="px-4 py-2.5">
              <div className={cn("group flex items-center gap-2.5", searchFieldClasses())}>
                <Icon
                  icon={Search01Icon}
                  className={cn(
                    "text-slate-400 ml-3 size-4 transition-colors duration-200",
                    "group-focus-within:text-primary",
                  )}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={handleBlur}
                  placeholder="搜索姓名（支持拼音、首字母）、组织、手机号…"
                  className={cn(
                    "h-9 min-w-0 flex-1 border-0 bg-transparent py-0 text-sm shadow-none outline-none font-medium text-slate-700 dark:text-zinc-200",
                    "placeholder:text-slate-400 placeholder:font-normal",
                    "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                  aria-label="搜索账号，支持中文、拼音全拼、拼音首字母、英文、手机号"
                />
                <div className="flex shrink-0 items-center gap-2 pr-2">
                  {hasQuery ? (
                    <>
                      <span className="bg-primary/6 border border-primary/10 rounded-md px-1.5 py-0.5 text-[10px] text-primary font-bold tracking-tight tabular-nums whitespace-nowrap shadow-2xs">
                        {matchCount} / {totalCount}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 w-7 p-0", iconGhostClasses("danger"))}
                        aria-label="清空搜索"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onChange("");
                          inputRef.current?.focus();
                        }}
                      >
                        <Icon icon={Cancel01Icon} className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <kbd className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200/40 rounded-md px-1.5 py-0.5 tracking-tight hidden sm:inline dark:bg-zinc-800 dark:border-zinc-700">
                      Esc
                    </kbd>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);
