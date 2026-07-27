import { YAPI_API_PREFIX } from "@/lib/yapi-api";
import type {
  BodySchema,
  HeaderField,
  IfaceItem,
  IfaceStatus,
  ParamField,
  ParsedYapiUrl,
  ResponseExample,
  ReturnsSchema,
} from "@/lib/yapi-types";

interface YapiParam {
  name?: string;
  _id?: string | number;
  type?: string;
  required?: string | number | boolean;
  desc?: string;
  description?: string;
  example?: unknown;
}

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  description?: string;
  default?: unknown;
  example?: unknown;
  items?: JsonSchema;
}

interface YapiDetail {
  _id?: string | number;
  id?: string | number;
  title?: string;
  method?: string;
  path?: string;
  status?: string;
  desc?: string;
  tag?: string[];
  up_time?: string | number;
  username?: string;
  uid?: string | number;
  req_headers?: YapiParam[];
  req_query?: YapiParam[];
  req_params?: YapiParam[];
  req_body_type?: string;
  req_body_form?: YapiParam[];
  req_body_other?: string;
  req_body?: string;
  res_body?: string;
  markdown?: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractInterfaceId(input: string): number | null {
  const text = input.trim();
  if (!text) return null;

  const byPath = text.match(/\/interface\/api\/(\d+)/);
  if (byPath) {
    const id = Number(byPath[1]);
    return Number.isNaN(id) ? null : id;
  }

  if (/^\d+$/.test(text)) {
    return Number(text);
  }

  const withProto = /^https?:\/\//i.test(text) ? text : `http://${text}`;
  try {
    const u = new URL(withProto);
    const fromPath = u.pathname.match(/\/interface\/api\/(\d+)/);
    if (fromPath) {
      const id = Number(fromPath[1]);
      return Number.isNaN(id) ? null : id;
    }
    const fromQuery = u.searchParams.get("id");
    if (fromQuery) {
      const id = Number(fromQuery);
      return Number.isNaN(id) ? null : id;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseYapiInterfaceUrl(raw: string): ParsedYapiUrl | null {
  const text = String(raw || "").trim();
  if (!text) return null;

  let title = "";
  let url = text;
  const titled = text.match(/^(.+?)[：:]\s*(.+)$/);
  if (titled) {
    const rest = titled[2].trim();
    if (extractInterfaceId(rest) != null) {
      title = titled[1].trim();
      url = rest;
    }
  }

  const id = extractInterfaceId(url);
  if (id == null) return null;

  const displayUrl = /^https?:\/\//i.test(url) ? url : `http://${url}`;
  return {
    id,
    origin: "",
    url: displayUrl,
    title,
    apiUrl: `${YAPI_API_PREFIX}/interface/get?id=${id}`,
  };
}

export function parseYapiImportText(text: string): ParsedYapiUrl[] {
  return String(text || "")
    .split(/\n+/)
    .map((line) => parseYapiInterfaceUrl(line))
    .filter((p): p is ParsedYapiUrl => p !== null);
}

function exampleToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}

function yapiTypeMap(t?: string): string {
  const s = String(t || "string").toLowerCase();
  if (s === "number" || s === "integer" || s === "int" || s === "long") return "integer";
  if (s === "boolean" || s === "bool") return "boolean";
  if (s === "array" || s === "object") return s;
  return s || "string";
}

function mapYapiParams(list?: YapiParam[]): ParamField[] | HeaderField[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => ({
      name: p.name || String(p._id ?? ""),
      type: yapiTypeMap(p.type),
      required: p.required === "1" || p.required === 1 || p.required === true,
      desc: p.desc || p.description || "",
      example: exampleToString(p.example),
    }))
    .filter((p) => p.name) as ParamField[];
}

function tryParseJson(text: unknown): unknown {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function fieldsFromJsonSchema(schema: JsonSchema | null, nameHint?: string): ParamField[] {
  if (!schema || typeof schema !== "object") return [];
  if (schema.type === "object" && schema.properties) {
    const req = new Set(schema.required || []);
    return Object.keys(schema.properties).map((key) => {
      const prop = schema.properties![key] || {};
      const node: ParamField = {
        name: key,
        type: yapiTypeMap(prop.type || (prop.properties ? "object" : "string")),
        required: req.has(key),
        desc: prop.description || "",
        example:
          prop.default != null
            ? exampleToString(prop.default)
            : prop.example != null
              ? exampleToString(prop.example)
              : "",
      };
      if (prop.type === "object" || prop.properties) {
        const children = fieldsFromJsonSchema(prop, key);
        if (children.length) node.children = children;
      }
      if (prop.type === "array" && prop.items) {
        node.type = `array[${yapiTypeMap(prop.items.type || "object")}]`;
        const children = fieldsFromJsonSchema(prop.items, key);
        if (children.length) node.children = children;
      }
      return node;
    });
  }
  if (nameHint) {
    return [
      {
        name: nameHint,
        type: yapiTypeMap(schema.type),
        required: false,
        desc: schema.description || "",
        example: "",
      },
    ];
  }
  return [];
}

function fieldsFromExample(obj: unknown, depth: number): ParamField[] {
  if (obj == null || depth > 4) return [];
  if (Array.isArray(obj)) {
    if (!obj.length || typeof obj[0] !== "object") return [];
    return fieldsFromExample(obj[0], depth + 1);
  }
  if (typeof obj !== "object") return [];
  return Object.keys(obj as Record<string, unknown>).map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    const node: ParamField = {
      name: key,
      type: Array.isArray(val)
        ? "array"
        : typeof val === "object" && val
          ? "object"
          : typeof val === "number"
            ? "integer"
            : typeof val,
      required: false,
      desc: "",
      example:
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean" ||
        typeof val === "bigint"
          ? String(val)
          : Array.isArray(val)
            ? "[ ... ]"
            : "{ ... }",
    };
    if (val && typeof val === "object") {
      const children = fieldsFromExample(val, depth + 1);
      if (children.length) node.children = children;
    }
    return node;
  });
}

function buildBody(data: YapiDetail): BodySchema | null {
  const type = data.req_body_type || "json";
  if (type === "form" || type === "file") {
    const fields = mapYapiParams(data.req_body_form) as ParamField[];
    return fields.length ? { type: "object", example: null, fields } : null;
  }
  const raw = data.req_body_other || data.req_body || "";
  const schema = tryParseJson(raw) as JsonSchema | null;
  if (!schema) {
    if (!raw) return null;
    return { type: "raw", example: raw, fields: [] };
  }
  if (schema.properties || schema.type === "object" || schema.type === "array") {
    return {
      type: "object",
      example: schema.example ?? null,
      fields: fieldsFromJsonSchema(
        schema.type === "array" ? { type: "object", properties: { items: schema } } : schema,
      ),
    };
  }
  return { type: "object", example: schema, fields: fieldsFromExample(schema, 0) };
}

function buildResponses(data: YapiDetail): ResponseExample[] {
  const raw = data.res_body || "";
  const parsed = tryParseJson(raw);
  const body = parsed != null ? parsed : raw ? { raw } : { code: 0, message: "ok", data: null };
  return [{ code: 200, label: "OK", desc: "成功", body }];
}

function buildReturns(data: YapiDetail): ReturnsSchema {
  const raw = data.res_body || "";
  const parsed = tryParseJson(raw) as JsonSchema | null;
  if (parsed && (parsed.properties || parsed.type === "object")) {
    return { type: "object", fields: fieldsFromJsonSchema(parsed) };
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return { type: "object", fields: fieldsFromExample(parsed, 0) };
  }
  return {
    type: "object",
    fields: [
      { name: "code", type: "integer", required: true, desc: "业务状态码", example: "0" },
      { name: "message", type: "string", required: true, desc: "提示信息", example: "ok" },
      { name: "data", type: "object", required: false, desc: "业务数据", example: "{ ... }" },
    ],
  };
}

function statusFromYapi(s?: string): IfaceStatus {
  if (s === "done" || s === "undone" || s === "deprecated") return s === "undone" ? "dev" : s;
  return "done";
}

function formatYapiTime(ts?: string | number): string {
  if (!ts) return "";
  const d = new Date(Number(ts) * (String(ts).length > 10 ? 1 : 1000));
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function stubFromParsed(parsed: ParsedYapiUrl, catId: string): IfaceItem {
  return {
    id: `yapi-${parsed.id}`,
    cat: catId,
    method: "GET",
    path: `/yapi/${parsed.id}`,
    title: parsed.title || `接口 #${parsed.id}`,
    status: "dev",
    desc: `待从 YApi 同步详情。来源：${parsed.url}`,
    tag: ["YApi", "待同步"],
    updAt: today(),
    author: "YApi",
    headers: [],
    query: [],
    pathParams: [],
    body: null,
    responses: [
      { code: 200, label: "OK", desc: "成功", body: { code: 0, message: "ok", data: null } },
    ],
    returns: {
      type: "object",
      fields: [
        { name: "code", type: "integer", required: true, desc: "业务状态码", example: "0" },
        { name: "message", type: "string", required: true, desc: "提示信息", example: "ok" },
        { name: "data", type: "object", required: false, desc: "业务数据", example: "{ ... }" },
      ],
    },
    note: "打开页面后若内网可达，将自动拉取 YApi 详情覆盖本条。",
    yapiId: parsed.id,
    yapiUrl: parsed.url,
    yapiApi: parsed.apiUrl,
    synced: false,
    custom: true,
  };
}

export function convertYapiData(
  data: YapiDetail,
  catId: string,
  fallback?: ParsedYapiUrl,
  opts?: { custom?: boolean },
): IfaceItem {
  const id = data._id || data.id || (fallback ? fallback.id : 0);
  const title = data.title || (fallback ? fallback.title : "") || `接口 #${id}`;
  const body = buildBody(data);
  const custom = opts?.custom ?? !!fallback;
  return {
    id: `yapi-${id}`,
    cat: catId,
    method: String(data.method || "GET").toUpperCase() as IfaceItem["method"],
    path: data.path || `/yapi/${id}`,
    title,
    status: statusFromYapi(data.status),
    desc: (data.desc || "").replace(/<[^>]+>/g, "").trim() || title,
    tag: Array.isArray(data.tag) ? data.tag : [],
    updAt: formatYapiTime(data.up_time) || today(),
    author: data.username || String(data.uid ?? "YApi"),
    headers: mapYapiParams(data.req_headers) as HeaderField[],
    query: mapYapiParams(data.req_query) as ParamField[],
    pathParams: mapYapiParams(data.req_params) as ParamField[],
    body,
    responses: buildResponses(data),
    returns: buildReturns(data),
    note: data.markdown || "",
    yapiId: Number(id),
    yapiUrl: fallback ? fallback.url : undefined,
    yapiApi: fallback ? fallback.apiUrl : undefined,
    synced: true,
    custom,
  };
}

interface YapiEnvelope {
  errcode?: number;
  errmsg?: string;
  data?: YapiDetail;
}

async function fetchYapiInterface(parsed: ParsedYapiUrl): Promise<YapiDetail> {
  const res = await fetch(parsed.apiUrl, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as YapiEnvelope;
  if (json.errcode && json.errcode !== 0) throw new Error(json.errmsg || "YApi error");
  if (!json.data) throw new Error("empty data");
  return json.data;
}

export async function importYapiLines(
  text: string,
  catId: string,
  onProgress?: (p: {
    ok: boolean;
    parsed: ParsedYapiUrl;
    iface: IfaceItem;
    error?: string;
  }) => void,
): Promise<IfaceItem[]> {
  const parsedList = parseYapiImportText(text);
  const results: IfaceItem[] = [];
  for (const parsed of parsedList) {
    let iface = stubFromParsed(parsed, catId);
    try {
      const data = await fetchYapiInterface(parsed);
      iface = convertYapiData(data, catId, parsed);
      onProgress?.({ ok: true, parsed, iface });
    } catch (err) {
      onProgress?.({ ok: false, parsed, iface, error: String((err as Error)?.message || err) });
    }
    results.push(iface);
  }
  return results;
}
