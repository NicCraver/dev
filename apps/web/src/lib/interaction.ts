import { cn } from "@/lib/utils";

/** 通用过渡时长，保持各组件交互节奏一致 */
const motion = "transition-all duration-150 ease-out";

/** 键盘焦点环 */
export const focusRing =
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-0";

/** 可点击元素的按下反馈 */
export const pressable = "cursor-pointer active:scale-[0.97] active:duration-100";

/** 禁用态（用于 button / 可交互控件） */
export const disabledState =
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100";

/** 侧栏导航项：soft / fill × 选中 / 未选中 */
export function navItemClasses({
  appearance = "soft",
  selected,
  disabled = false,
}: {
  appearance?: "soft" | "fill";
  selected: boolean;
  disabled?: boolean;
}) {
  const isSoft = appearance === "soft";

  return cn(
    motion,
    focusRing,
    !disabled && pressable,
    disabled && disabledState,
    selected ? "pl-4 pr-3" : "px-3",
    isSoft &&
      selected && [
        "bg-primary-soft text-primary font-medium",
        "hover:bg-primary-soft-hover",
        "active:bg-primary/15",
      ],
    isSoft &&
      !selected && [
        "text-foreground",
        "hover:bg-primary/8 dark:hover:bg-white/8",
        "active:bg-primary/12 dark:active:bg-white/12",
      ],
    !isSoft &&
      selected && [
        "bg-primary text-primary-foreground font-medium",
        "hover:bg-primary/90",
        "active:bg-primary/80",
      ],
    !isSoft &&
      !selected && [
        "text-foreground",
        "hover:bg-primary/8 dark:hover:bg-white/8",
        "active:bg-primary/12 dark:active:bg-white/12",
      ],
  );
}

/** 分段切换按钮（布局 自动/1/2/3 列） */
export function segmentButtonClasses(selected: boolean) {
  return cn(
    motion,
    focusRing,
    pressable,
    selected && [
      "bg-primary text-primary-foreground",
      "hover:bg-primary/90",
      "active:bg-primary/80",
    ],
    !selected && [
      "text-muted-foreground",
      "hover:bg-primary-subtle hover:text-foreground",
      "active:bg-primary/15 active:text-foreground",
    ],
  );
}

/** App Rail 图标按钮 */
export function appRailButtonClasses(active: boolean) {
  return cn(
    motion,
    focusRing,
    pressable,
    active
      ? ["bg-primary text-primary-foreground", "hover:bg-primary/90", "active:bg-primary/80"]
      : [
          "text-muted-foreground",
          "hover:bg-accent hover:text-foreground",
          "active:bg-accent/80 active:text-foreground",
        ],
  );
}

/** 文本链接按钮（如 ⌘F 搜索） */
export function textLinkClasses() {
  return cn(
    motion,
    focusRing,
    pressable,
    "rounded-sm text-primary font-semibold underline-offset-2",
    "hover:text-primary/80 hover:underline",
    "active:text-primary/65",
    disabledState,
  );
}

/** Ghost 图标按钮变体 */
export function iconGhostClasses(variant: "neutral" | "amber" | "primary" | "danger" = "neutral") {
  const base = cn(motion, focusRing, pressable, disabledState, "rounded-lg");

  switch (variant) {
    case "amber":
      return cn(
        base,
        "text-amber-500 bg-amber-500/5",
        "hover:text-amber-600 hover:bg-amber-500/10",
        "active:bg-amber-500/15 active:text-amber-700",
      );
    case "primary":
      return cn(
        base,
        "text-muted-foreground",
        "hover:text-primary hover:bg-primary-soft",
        "active:bg-primary/15 active:text-primary",
      );
    case "danger":
      return cn(
        base,
        "text-slate-400",
        "hover:text-slate-800 hover:bg-slate-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
        "active:bg-slate-200 active:text-slate-900 dark:active:bg-zinc-700",
      );
    default:
      return cn(
        base,
        "text-muted-foreground",
        "hover:text-foreground hover:bg-accent",
        "active:bg-accent/80",
      );
  }
}

/** 账号卡片容器（悬停抬升；内部按钮独立交互） */
export function accountCardSurfaceClasses(isActive: boolean) {
  return cn(
    "relative overflow-hidden bg-card rounded-xl border border-neutral-200/50 py-4",
    motion,
    "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20",
    isActive
      ? "border-primary/45 shadow-[0_4px_20px_rgba(52,110,238,0.12)] bg-gradient-to-r from-primary/2 to-transparent"
      : "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03),0_1px_3px_-1px_rgba(0,0,0,0.02)]",
  );
}

/** 常用账号药丸外层 */
export function favoriteChipClasses(isActive: boolean) {
  return cn(
    motion,
    "inline-flex items-center gap-1 rounded-full border pl-3 pr-1 py-0.5 text-xs shadow-3xs",
    "bg-white dark:bg-zinc-900 border-slate-200/60 text-slate-700 dark:text-zinc-300",
    "hover:border-primary/25 hover:shadow-2xs hover:-translate-y-0.25",
    "active:translate-y-0 active:shadow-3xs active:border-primary/35",
    isActive && "border-primary ring-2 ring-primary/15 bg-primary/2",
  );
}

/** 常用账号药丸内复制按钮 */
export function favoriteChipActionClasses() {
  return cn(
    motion,
    focusRing,
    pressable,
    "flex items-center gap-1 rounded-md px-1 py-0.5 font-medium",
    "hover:bg-slate-100/80 dark:hover:bg-zinc-800/80",
    "active:bg-slate-200/80 dark:active:bg-zinc-700/80",
  );
}

/** 搜索框容器 */
export function searchFieldClasses() {
  return cn(
    motion,
    "rounded-xl border bg-slate-50 border-slate-200/60 dark:bg-zinc-900 dark:border-zinc-800",
    "hover:border-slate-300/80 hover:bg-slate-100/60 dark:hover:border-zinc-700",
    "focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(52,110,238,0.08)] focus-within:ring-2 focus-within:ring-primary/12",
    "has-[:disabled]:opacity-50 has-[:disabled]:pointer-events-none",
  );
}

/** 工具栏占位按钮（禁用） */
export function toolbarIconDisabledClasses() {
  return cn(
    "size-7 cursor-not-allowed opacity-40",
    "text-muted-foreground/45",
    "hover:bg-transparent hover:text-muted-foreground/45",
    "active:scale-100",
  );
}

/** 可拖拽分隔条 */
export function resizableHandleClasses() {
  return cn(
    motion,
    focusRing,
    "hover:bg-primary/15",
    "active:bg-primary/25",
    "data-[separator=active]:bg-primary/20",
  );
}
