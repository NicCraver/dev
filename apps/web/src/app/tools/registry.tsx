import { Clock01Icon, SourceCodeIcon } from "@hugeicons/core-free-icons";
import type { ComponentType, ReactNode } from "react";

import type { IconSvgElement } from "@/components/ui/icon";
import { JsonNewlineFixTool } from "@/components/tools/JsonNewlineFixTool";
import { TimestampConvertTool } from "@/components/tools/TimestampConvertTool";

export type ToolDefinition = {
  id: string;
  label: string;
  description: ReactNode;
  icon: IconSvgElement;
  component: ComponentType;
};

const inlineCodeClassName =
  "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground/90";

export const tools: ToolDefinition[] = [
  {
    id: "json-newline-fix",
    label: "JSON 换行修复",
    icon: SourceCodeIcon,
    description: (
      <>
        修复字符串值内错误的换行（如{" "}
        <code className={inlineCodeClassName}>&quot;topic&quot;: &quot;\n文本\n&quot;</code>
        ），并可选清理 ISO 时间中的多余空格（
        <code className={inlineCodeClassName}>16: 00: 00</code> →{" "}
        <code className={inlineCodeClassName}>16:00:00</code>）。
      </>
    ),
    component: JsonNewlineFixTool,
  },
  {
    id: "timestamp-convert",
    label: "时间戳转换",
    icon: Clock01Icon,
    description: (
      <>
        同时转换多行时间戳，便于对比；支持秒、毫秒与日期字符串。可搜索时区，默认{" "}
        <code className={inlineCodeClassName}>Asia/Shanghai</code>。
      </>
    ),
    component: TimestampConvertTool,
  },
];
