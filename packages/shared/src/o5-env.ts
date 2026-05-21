export type Corp = {
  corpId: string;
  name: string;
};

export type UrlConfig = {
  url: string;
  note: string;
  features?: string;
};

export type KvAccount = {
  username: string;
  password: string;
  name: string;
  corpList: Corp[];
};

export type KvValue = {
  urlList: UrlConfig[];
  accountList: KvAccount[];
};

export type KvDocument = {
  id: string;
  alias: string;
  value: KvValue;
};

/** mt-dev 库：全局账号池条目 */
export type MtDevAccount = KvAccount;

/** mt-dev 库：accounts 集合单文档，accountList 维护全局账号池 */
export type MtDevAccountPool = {
  key: string;
  accountList: MtDevAccount[];
};

/** mt-dev 库：系统 + 环境 + 账号引用（集合 systems） */
export type MtDevSystem = {
  name: string;
  urlList: UrlConfig[];
  accountRefs: string[];
};

/** O5 页面聚合后的系统 */
export type O5SystemDto = {
  id: string;
  name: string;
  environments: O5EnvironmentDto[];
  accounts: O5AccountDto[];
};

export type O5EnvironmentDto = {
  id: string;
  name: string;
  url: string;
  features?: string;
};

export type O5AccountDto = {
  id: string;
  username: string;
  password: string;
  name: string;
  corpList: Corp[];
};

export type O5EnvBootstrapResponse = {
  systems: O5SystemDto[];
};

export type AccountJumpRequest = {
  username: string;
  password: string;
  corpId: string;
  targetUrl: string;
  features?: string;
  ctrlKey?: boolean;
};

export type ShareNewRequest = {
  key?: string;
  urlList: UrlConfig[];
  accountList: KvAccount[];
};

export type ShareNewResponse = { slug: string };

export type AddUserRequest = {
  kvId: string;
  username: string;
  name: string;
  password: string;
  corpList: Corp[];
};

export type AddLinkRequest = {
  kvId: string;
  url: string;
  note?: string;
};
