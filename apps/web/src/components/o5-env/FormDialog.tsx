import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type FormDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function FormDialog({ open, title, onClose, children, footer, className }: FormDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 m-auto w-full max-w-md rounded-xl border border-border/60 bg-white p-0 shadow-xl backdrop:bg-black/40 dark:bg-zinc-900",
        className,
      )}
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="关闭"
          onClick={onClose}
        >
          <Icon icon={Cancel01Icon} className="size-4" />
        </Button>
      </div>
      <div className="px-4 py-4">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-border/50 px-4 py-3">{footer}</div>
      )}
    </dialog>
  );
}
