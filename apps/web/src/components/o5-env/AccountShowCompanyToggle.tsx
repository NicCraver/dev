import { CorporateIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type AccountShowCompanyToggleProps = {
  showCompany: boolean;
  onChange: (show: boolean) => void;
};

export function AccountShowCompanyToggle({ showCompany, onChange }: AccountShowCompanyToggleProps) {
  return (
    <div
      className="bg-muted/40 inline-flex items-center rounded-md border p-0.5"
      role="group"
      aria-label="公司信息显示"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 w-7 p-0",
          showCompany
            ? "text-primary bg-primary/10 hover:!bg-primary/15 hover:!text-primary active:!bg-primary/15 active:!text-primary"
            : "text-muted-foreground hover:!bg-primary-subtle hover:!text-muted-foreground active:!bg-primary/12 active:!text-muted-foreground",
        )}
        aria-pressed={showCompany}
        aria-label={showCompany ? "隐藏公司信息" : "显示公司信息"}
        title={showCompany ? "隐藏公司" : "显示公司"}
        onClick={() => onChange(!showCompany)}
      >
        <Icon icon={CorporateIcon} className="size-3.5 shrink-0" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
