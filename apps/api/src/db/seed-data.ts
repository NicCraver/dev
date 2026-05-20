import type { MtDevAccount, UrlConfig } from "@mt-dev/shared";

const ORGS = [
  { corpId: "1", name: "天津美腾科技有限公司" },
  { corpId: "2", name: "北京研发中心" },
  { corpId: "3", name: "上海交付中心" },
] as const;

function mockLoginUrl(port: number): string {
  return `http://localhost:${port}/sso/login`;
}

/** 全局账号池种子 */
export const SEED_ACCOUNTS: MtDevAccount[] = [
  {
    username: "18822211133",
    password: "mock-password",
    name: "李权泓",
    corpList: [ORGS[0]],
  },
  {
    username: "18822211134",
    password: "mock-password",
    name: "cs01",
    corpList: [...ORGS],
  },
  {
    username: "18822211135",
    password: "mock-password",
    name: "王梦菲",
    corpList: [ORGS[1]],
  },
  {
    username: "13900001000",
    password: "mock-password",
    name: "张三",
    corpList: [ORGS[2]],
  },
  {
    username: "13900001001",
    password: "mock-password",
    name: "李四",
    corpList: [ORGS[0]],
  },
  {
    username: "13700001000",
    password: "mock-password",
    name: "赵敏",
    corpList: [ORGS[1], ORGS[2]],
  },
];

const ALL_USERNAMES = SEED_ACCOUNTS.map((a) => a.username);

const TEST_ENV_URLS: UrlConfig[] = [
  { url: mockLoginUrl(6173), note: "默认测试环境" },
  { url: mockLoginUrl(6174), note: "测试沙箱 6174" },
  { url: mockLoginUrl(6175), note: "测试沙箱 6175" },
];

const O5_ENV_URLS: UrlConfig[] = [
  { url: mockLoginUrl(6173), note: "行动中心 6173" },
  { url: mockLoginUrl(6173), note: "O5 6173" },
  { url: mockLoginUrl(6174), note: "O5 6174" },
  {
    url: mockLoginUrl(6173),
    note: "O5 呼叫群 PC 6173",
    features: "noopener,noreferrer",
  },
  { url: mockLoginUrl(6174), note: "O5 呼叫群 移动端 6174" },
  { url: mockLoginUrl(6173), note: "信息技术部 个人工作" },
];

/** 各系统共用同一账号池引用 */
const SHARED_ACCOUNT_REFS = ALL_USERNAMES;

/** 系统 + 环境种子（账号通过 accountRefs 引用池子） */
export const SEED_SYSTEMS = [
  {
    name: "测试环境",
    urlList: TEST_ENV_URLS,
    accountRefs: SHARED_ACCOUNT_REFS,
  },
  {
    name: "O5系统",
    urlList: O5_ENV_URLS,
    accountRefs: SHARED_ACCOUNT_REFS,
  },
] as const;
