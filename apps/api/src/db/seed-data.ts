import type { MtDevAccount, UrlConfig } from "@mt-dev/shared";

const MT_CORP = { corpId: "6", name: "天津美腾科技有限公司" } as const;
const SUB_CORP = { corpId: "1183650868449583106", name: "天津美腾&订阅" } as const;

function mockLoginUrl(port: number): string {
  return `http://localhost:${port}/sso/login`;
}

/** 全局账号池种子 */
export const SEED_ACCOUNTS: MtDevAccount[] = [
  {
    username: "18822211133",
    password: "zx111222",
    name: "李权泓",
    corpList: [MT_CORP],
  },
  {
    username: "18899900088",
    password: "zx111222",
    name: "cs01",
    corpList: [MT_CORP],
  },
  {
    username: "18800011122",
    password: "zx111222",
    name: "cs02",
    corpList: [MT_CORP],
  },
  {
    username: "17615834927",
    password: "zx111222",
    name: "李峰",
    corpList: [MT_CORP],
  },
  {
    username: "15583811560",
    password: "zx111222",
    name: "王梦菲",
    corpList: [MT_CORP],
  },
  {
    username: "18611142155",
    password: "zx111222",
    name: "韩佳琦",
    corpList: [MT_CORP],
  },
  {
    username: "18526814685",
    password: "zx111222",
    name: "刘馨琪",
    corpList: [MT_CORP],
  },
  {
    username: "13900000020",
    password: "zx111222",
    name: "刘丰k2",
    corpList: [MT_CORP],
  },
  {
    username: "15822305890",
    password: "zx111222",
    name: "李博雅",
    corpList: [MT_CORP],
  },
  {
    username: "15502280000",
    password: "zx111222",
    name: "陈建东",
    corpList: [MT_CORP],
  },
  {
    username: "15620531519",
    password: "zx111222",
    name: "赵彬华",
    corpList: [MT_CORP],
  },
  {
    username: "18602212392",
    password: "liu222111",
    name: "刘义岭",
    corpList: [MT_CORP],
  },
  {
    username: "15620864523",
    password: "zx111222",
    name: "刘晓慧",
    corpList: [MT_CORP],
  },
  {
    username: "15202285154",
    password: "zx111222",
    name: "刘芳",
    corpList: [MT_CORP],
  },
  {
    username: "13512235881",
    password: "zx111222",
    name: "赵健军",
    corpList: [MT_CORP],
  },
  {
    username: "15318420665",
    password: "zx111222",
    name: "王梦菲3",
    corpList: [MT_CORP],
  },
  {
    username: "15922226045",
    password: "zx111222",
    name: "陈丽娜",
    corpList: [MT_CORP],
  },
  {
    username: "18088880007",
    password: "ceshi111222",
    name: "测试账号007",
    corpList: [MT_CORP],
  },
  {
    username: "18088880009",
    password: "zx111222",
    name: "测试账号009",
    corpList: [MT_CORP],
  },
  {
    username: "13900000017",
    password: "zx111222",
    name: "王德臣kk",
    corpList: [SUB_CORP],
  },
  {
    username: "15700000007",
    password: "zx111222",
    name: "开发测试账号07",
    corpList: [MT_CORP],
  },
  {
    username: "13702116776",
    password: "zx111222",
    name: "王德晨",
    corpList: [MT_CORP],
  },
  {
    username: "15122184000",
    password: "zx111222",
    name: "刘云峰",
    corpList: [MT_CORP],
  },
  {
    username: "15800198630",
    password: "zx111222",
    name: "钱广盼",
    corpList: [MT_CORP],
  },
  {
    username: "15320092121",
    password: "zx111222",
    name: "张海峰",
    corpList: [MT_CORP],
  },
  {
    username: "15620523385",
    password: "zx111222",
    name: "李歆楠",
    corpList: [MT_CORP],
  },
  {
    username: "18920870000",
    password: "zx111222",
    name: "秦野",
    corpList: [MT_CORP],
  },
  {
    username: "13521378691",
    password: "zx111222",
    name: "王青改",
    corpList: [MT_CORP],
  },
  {
    username: "15822860000",
    password: "zx111222",
    name: "lalalalala",
    corpList: [MT_CORP],
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
