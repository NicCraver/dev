import { FormDialog } from "@/components/o5-env/FormDialog";
import { Button } from "@/components/ui/button";

type MongoDeleteConfirmDialogProps = {
  open: boolean;
  noun: string;
  label: string;
  collection: string | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function MongoDeleteConfirmDialog({
  open,
  noun,
  label,
  collection,
  deleting,
  onClose,
  onConfirm,
}: MongoDeleteConfirmDialogProps) {
  return (
    <FormDialog
      open={open}
      title={`确认删除${noun}`}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={onClose}>
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {deleting ? "删除中…" : "确认删除"}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          确定要删除{noun}
          <span className="mx-1 font-medium">「{label}」</span>
          吗？
        </p>
        {collection && (
          <p className="text-muted-foreground font-mono text-xs">
            集合 <span className="text-foreground">{collection}</span>
          </p>
        )}
        <p className="text-destructive text-xs">此操作不可撤销，删除后数据将无法恢复。</p>
      </div>
    </FormDialog>
  );
}
