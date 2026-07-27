import { FormDialog } from "@/components/o5-env/FormDialog";
import { Button } from "@/components/ui/button";

type YapiCreateCollectionModalProps = {
  open: boolean;
  onClose: () => void;
  catName: string;
  setCatName: (v: string) => void;
  onCreate: () => void;
};

export function YapiCreateCollectionModal({
  open,
  onClose,
  catName,
  setCatName,
  onCreate,
}: YapiCreateCollectionModalProps) {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onCreate();
  };

  return (
    <FormDialog
      open={open}
      title="新建自定义分类"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" disabled={!catName.trim()} onClick={onCreate}>
            创建
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-2">
        <label htmlFor="yapi-create-cat-name" className="text-sm font-medium text-slate-800">
          分类名称
        </label>
        <input
          id="yapi-create-cat-name"
          type="text"
          autoFocus
          value={catName}
          placeholder="例如：AI框"
          onChange={(e) => setCatName(e.target.value)}
          className="border-border/60 focus:border-primary/40 focus:ring-primary/12 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
        />
        <p className="text-muted-foreground text-xs">先建一个空分类，进去后再添加细分分类与接口</p>
      </form>
    </FormDialog>
  );
}
