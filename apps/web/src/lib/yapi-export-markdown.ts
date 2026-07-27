import type { BodySchema, HeaderField, IfaceItem, ParamField } from "@/lib/yapi-types";
import { STATUS_LABEL } from "@/lib/yapi-types";

export type IfaceMarkdownContext = {
  collectionName?: string;
  subcatName?: string;
  syncFailed?: boolean;
};

const INVALID_PATH_CHARS = /[/\\:*?"<>|]/g;

function stripHtml(text: string): string {
  return String(text || "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function escapeMdCell(value: string): string {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type FlatParamRow = { field: ParamField; depth: number };

function flattenParams(fields: ParamField[], depth = 0): FlatParamRow[] {
  const rows: FlatParamRow[] = [];
  const walk = (list: ParamField[], d: number) => {
    for (const field of list) {
      rows.push({ field, depth: d });
      if (field.children?.length) walk(field.children, d + 1);
    }
  };
  walk(fields, depth);
  return rows;
}

function paramNameWithDepth(name: string, depth: number): string {
  const prefix = depth > 0 ? `${"·".repeat(depth)} ` : "";
  return `${prefix}${name}`;
}

function paramTableMd(fields: ParamField[], showExample = true): string {
  if (!fields?.length) return "_无参数_\n";

  const rows = flattenParams(fields);
  const headers = showExample
    ? "| 参数名 | 类型 | 必填 | 说明 | 示例 |\n|--------|------|------|------|------|\n"
    : "| 参数名 | 类型 | 必填 | 说明 |\n|--------|------|------|------|\n";

  const body = rows
    .map(({ field, depth }) => {
      const name = escapeMdCell(paramNameWithDepth(field.name, depth));
      const cells = [
        name,
        escapeMdCell(field.type),
        field.required ? "是" : "否",
        escapeMdCell(field.desc || "—"),
      ];
      if (showExample) cells.push(escapeMdCell(field.example || "—"));
      return `| ${cells.join(" | ")} |`;
    })
    .join("\n");

  return `${headers}${body}\n`;
}

function headerTableMd(headers: HeaderField[]): string {
  if (!headers?.length) return "_无自定义请求头_\n";

  const head = "| 名称 | 类型 | 必填 | 说明 |\n|------|------|------|------|\n";
  const body = headers
    .map(
      (h) =>
        `| ${escapeMdCell(h.name)} | ${escapeMdCell(h.type)} | ${h.required ? "是" : "否"} | ${escapeMdCell(h.desc || "—")} |`,
    )
    .join("\n");
  return `${head}${body}\n`;
}

function bodySectionMd(body: BodySchema | null): string {
  if (!body) {
    return "该接口无请求体（GET / DELETE）。\n";
  }

  const parts: string[] = [];
  if (body.fields.length > 0) {
    parts.push("### 字段说明\n\n", paramTableMd(body.fields));
  }
  parts.push("### 示例\n\n", "```json\n", formatJson(body.example), "\n```\n");
  return parts.join("");
}

function responsesSectionMd(responses: IfaceItem["responses"]): string {
  if (!responses?.length) return "_无响应示例_\n";

  return responses
    .map((r) => {
      const title = `### ${r.code} ${r.label}`.trim();
      const desc = r.desc ? `\n\n${r.desc}\n` : "\n";
      return `${title}${desc}\n\`\`\`json\n${formatJson(r.body)}\n\`\`\`\n`;
    })
    .join("\n");
}

export function sanitizePathSegment(name: string): string {
  const trimmed = String(name || "")
    .trim()
    .replace(INVALID_PATH_CHARS, "_")
    .replace(/\s+/g, " ")
    .trim();
  return trimmed || "untitled";
}

export function uniqueFileName(base: string, used: Set<string>): string {
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}_${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

export function ifaceToMarkdown(iface: IfaceItem, ctx: IfaceMarkdownContext = {}): string {
  const lines: string[] = [];

  if (ctx.syncFailed) {
    lines.push("> 警告：详情同步失败，以下为缓存数据\n");
  }

  lines.push(`# ${iface.title}\n`);
  lines.push(`> **${iface.method}** \`${iface.path}\`\n`);

  if (ctx.collectionName || ctx.subcatName) {
    lines.push(`> 分类：${[ctx.collectionName, ctx.subcatName].filter(Boolean).join(" / ")}\n`);
  }

  lines.push(
    "\n| 属性 | 值 |\n|------|-----|\n",
    `| 状态 | ${STATUS_LABEL[iface.status]} |\n`,
    `| 维护人 | ${escapeMdCell(iface.author || "—")} |\n`,
    `| 更新时间 | ${escapeMdCell(iface.updAt || "—")} |\n`,
    `| 标签 | ${escapeMdCell((iface.tag || []).join("、") || "—")} |\n`,
  );

  const desc = stripHtml(iface.desc);
  lines.push("\n## 接口说明\n\n", desc || "_无说明_\n");

  if (iface.note?.trim()) {
    lines.push("\n### 备注\n\n", iface.note.trim(), "\n");
  }

  if (iface.pathParams?.length) {
    lines.push("\n## Path 参数\n\n", paramTableMd(iface.pathParams));
  }

  if (iface.query?.length) {
    lines.push("\n## Query 参数\n\n", paramTableMd(iface.query));
  }

  lines.push("\n## 请求头\n\n", headerTableMd(iface.headers));
  lines.push("\n## 请求体 Body\n\n", bodySectionMd(iface.body));
  lines.push("\n## 响应示例\n\n", responsesSectionMd(iface.responses));

  if (iface.returns?.fields?.length) {
    lines.push("\n## 返回数据结构\n\n", paramTableMd(iface.returns.fields));
  }

  if (iface.yapiUrl) {
    lines.push("\n---\n\n", `YApi 链接：${iface.yapiUrl}\n`);
  }

  return lines.join("");
}
