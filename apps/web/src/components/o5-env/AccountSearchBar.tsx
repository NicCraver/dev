import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { Button } from "@/components/ui/button";
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
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="border-border shrink-0 overflow-hidden border-b bg-astral-deep/40 backdrop-blur-sm"
          >
            <div className="px-4 py-2">
              <div
                className={cn(
                  "group flex items-center gap-2 rounded-lg border transition-[background-color,border-color,box-shadow] duration-200",
                  "border-violet-edge bg-midnight-gaze/80",
                  "focus-within:border-starlight-violet/50 focus-within:bg-midnight-gaze focus-within:shadow-md",
                )}
              >
                <Search
                  className={cn(
                    "text-lunar-dust ml-2.5 size-4 shrink-0 transition-colors",
                    "group-focus-within:text-etherium-blue",
                  )}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={handleBlur}
                  placeholder="搜索中文、拼音全拼、拼音首字母、英文、手机号…"
                  className={cn(
                    "h-9 min-w-0 flex-1 border-0 bg-transparent py-0 text-sm shadow-none outline-none",
                    "text-crystal-white placeholder:text-lunar-dust/70",
                    "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
                  )}
                  aria-label="搜索账号，支持中文、拼音全拼、拼音首字母、英文、手机号"
                />
                <div className="flex shrink-0 items-center gap-1.5 pr-1.5">
                  {hasQuery ? (
                    <>
                      <span className="text-lunar-dust text-xs tabular-nums whitespace-nowrap">
                        {matchCount} / {totalCount}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        aria-label="清空搜索"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onChange("");
                          inputRef.current?.focus();
                        }}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <kbd className="text-lunar-dust bg-twilight-indigo/60 font-mono-ui hidden rounded-md px-1.5 py-0.5 sm:inline">
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
