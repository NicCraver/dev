// YApi 接口文档数据模型

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type IfaceStatus = "done" | "dev" | "deprecated";

export interface ParamField {
  name: string;
  type: string;
  required: boolean;
  desc: string;
  example: string;
  children?: ParamField[];
}

export interface HeaderField {
  name: string;
  type: string;
  required: boolean;
  desc: string;
  example: string;
}

export interface BodySchema {
  type: string;
  example: unknown;
  fields: ParamField[];
}

export interface ResponseExample {
  code: number;
  label: string;
  desc: string;
  body: unknown;
}

export interface ReturnsSchema {
  type: string;
  fields: ParamField[];
}

export interface IfaceItem {
  id: string;
  cat: string;
  method: HttpMethod;
  path: string;
  title: string;
  status: IfaceStatus;
  desc: string;
  tag: string[];
  updAt: string;
  author: string;
  headers: HeaderField[];
  query: ParamField[];
  pathParams: ParamField[];
  body: BodySchema | null;
  responses: ResponseExample[];
  returns: ReturnsSchema;
  note: string;
  custom?: boolean;
  yapiId?: number;
  yapiUrl?: string;
  yapiApi?: string;
  synced?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  custom?: boolean;
}

export interface ParsedYapiUrl {
  id: number;
  origin: string;
  url: string;
  title: string;
  apiUrl: string;
}

export type StatusLabel = Record<IfaceStatus, string>;

export const STATUS_LABEL: StatusLabel = {
  done: "已完成",
  dev: "开发中",
  deprecated: "已废弃",
};

export interface ImportMessage {
  type: "" | "ok" | "err";
  text: string;
}
