/** 移除 JSON 字符串字面量内部的换行 */
export function stripNewlinesInStrings(text: string): string {
  let out = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (!inString) {
      if (c === '"') inString = true;
      out += c;
      continue;
    }

    if (escape) {
      out += c;
      escape = false;
      continue;
    }

    if (c === "\\") {
      out += c;
      escape = true;
      continue;
    }

    if (c === '"') {
      inString = false;
      out += c;
      continue;
    }

    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      continue;
    }

    out += c;
  }

  return out;
}

/** 修复 ISO 时间字符串中冒号后的空格，如 16: 00: 00 */
export function fixIsoTimeSpaces(text: string): string {
  return text.replace(/(\d{4}-\d{2}-\d{2}T\d{2}): (\d{2}): (\d{2})/g, "$1:$2:$3");
}

export type RepairJsonOptions = {
  fixTime: boolean;
  prettify: boolean;
};

export function repairJson(raw: string, { fixTime, prettify }: RepairJsonOptions): string {
  let text = stripNewlinesInStrings(raw);
  if (fixTime) text = fixIsoTimeSpaces(text);
  const parsed: unknown = JSON.parse(text);
  return prettify ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
}
