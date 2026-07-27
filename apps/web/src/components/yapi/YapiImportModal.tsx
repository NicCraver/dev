import { FormDialog } from "@/components/o5-env/FormDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImportMessage } from "@/lib/yapi-types";

type YapiImportModalProps = {
  open: boolean;
  onClose: () => void;
  catName: string;
  setCatName: (v: string) => void;
  importText: string;
  setImportText: (v: string) => void;
  importing: boolean;
  importMsg: ImportMessage | null;
  onImport: () => void;
  title?: string;
  buttonLabel?: string;
  namePlaceholder?: string;
  /** 为 false 时隐藏分类名称输入（向已有细分分类追加接口） */
  showCatName?: boolean;
  subcatHint?: string;
  replaceExisting?: boolean;
  onReplaceExistingChange?: (v: boolean) => void;
};

export function YapiImportModal({
  open,
  onClose,
  catName,
  setCatName,
  importText,
  setImportText,
  importing,
  importMsg,
  onImport,
  title = "自定义分类",
  buttonLabel = "导入到分类",
  namePlaceholder = "例如：AI框",
  showCatName = true,
  subcatHint,
  replaceExisting,
  onReplaceExistingChange,
}: YapiImportModalProps) {
  return (
    <FormDialog
      open={open}
      title={title}
      onClose={onClose}
      className="max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" disabled={importing} onClick={onClose}>
            取消
          </Button>
          <Button type="button" disabled={importing || !importText.trim()} onClick={onImport}>
            {importing ? "导入中…" : buttonLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-xs">
          {showCatName
            ? "粘贴 YApi 接口链接，自动解析并加入左侧分类"
            : `粘贴 YApi 接口链接，将追加到细分分类「${subcatHint || "未命名"}」`}
        </p>
        {showCatName ? (
          <div className="space-y-2">
            <label htmlFor="yapi-import-cat-name" className="text-sm font-medium text-slate-800">
              分类名称
            </label>
            <input
              id="yapi-import-cat-name"
              type="text"
              value={catName}
              placeholder={namePlaceholder}
              onChange={(e) => setCatName(e.target.value)}
              className="border-border/60 focus:border-primary/40 focus:ring-primary/12 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <label htmlFor="yapi-import-urls" className="text-sm font-medium text-slate-800">
            接口清单
          </label>
          <p className="text-muted-foreground text-xs">
            每行一条：标题：YApi URL（也支持只贴 URL）
          </p>
          <p className="text-muted-foreground text-[11px]">
            支持格式：完整 URL、无 http 前缀（如 192.168.5.46:3100/project/…/api/123）、路径或接口
            ID
          </p>
          <textarea
            id="yapi-import-urls"
            value={importText}
            spellCheck={false}
            rows={6}
            placeholder="获取个人AI框列表：http://host/project/1/interface/api/123"
            onChange={(e) => setImportText(e.target.value)}
            className="border-border/60 focus:border-primary/40 focus:ring-primary/12 w-full resize-y rounded-lg border bg-white px-3 py-2 font-mono text-xs outline-none focus:ring-2"
          />
        </div>
        {!showCatName && onReplaceExistingChange ? (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={replaceExisting ?? true}
              onChange={(e) => onReplaceExistingChange(e.target.checked)}
            />
            <span>
              覆盖已存在的接口
              <span className="text-muted-foreground mt-0.5 block text-xs">
                同一 YApi 接口 ID 已在当前细分分类时，用最新同步内容替换旧数据
              </span>
            </span>
          </label>
        ) : null}
        {importMsg ? (
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-xs",
              importMsg.type === "ok" && "bg-emerald-500/10 text-emerald-700",
              importMsg.type === "err" && "bg-destructive/10 text-destructive",
              !importMsg.type && "bg-muted text-muted-foreground",
            )}
          >
            {importMsg.text}
          </div>
        ) : null}
      </div>
    </FormDialog>
  );
}
