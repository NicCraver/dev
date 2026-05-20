import type { O5Account, O5Environment, O5System } from "@/types/o5-env";

export type { O5Account, O5Environment, O5System } from "@/types/o5-env";

const ORGS = [
  { corpId: "1", name: "天津美腾科技有限公司" },
  { corpId: "2", name: "北京研发中心" },
  { corpId: "3", name: "上海交付中心" },
  { corpId: "4", name: "深圳创新实验室" },
  { corpId: "5", name: "成都运营分部" },
] as const;

const SURNAMES = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴"] as const;
const GIVEN = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋"] as const;

function mockLoginUrl(port: number): string {
  return `http://localhost:${port}/sso/login`;
}

function generateAccountsForEnv(envId: string, count: number, phoneStart: number): O5Account[] {
  return Array.from({ length: count }, (_, i) => {
    const surname = SURNAMES[i % SURNAMES.length]!;
    const given = GIVEN[(i * 3) % GIVEN.length]!;
    const username = String(phoneStart + i);
    const corp = ORGS[i % ORGS.length]!;
    return {
      id: `acc-${envId}-${i}`,
      username,
      password: "mock-password",
      name: i < 5 ? ["李权泓", "cs01", "王梦菲", "张三", "李四"][i]! : `${surname}${given}${i}`,
      corpList: i === 1 ? [...ORGS] : [corp],
    };
  });
}

const OKR_ENV_BASE: O5Environment[] = [
  {
    id: "env-action-6173",
    systemId: "okr",
    name: "行动中心 6173",
    url: mockLoginUrl(6173),
  },
  { id: "env-o5-6173", systemId: "okr", name: "O5 6173", url: mockLoginUrl(6173) },
  { id: "env-o5-6174", systemId: "okr", name: "O5 6174", url: mockLoginUrl(6174) },
  {
    id: "env-o5-pc-6173",
    systemId: "okr",
    name: "O5 呼叫群 PC 6173",
    url: mockLoginUrl(6173),
  },
  {
    id: "env-o5-pc-6174",
    systemId: "okr",
    name: "O5 呼叫群 PC 6174",
    url: mockLoginUrl(6174),
  },
  {
    id: "env-o5-mobile-6173",
    systemId: "okr",
    name: "O5 呼叫群 移动端 6173",
    url: mockLoginUrl(6173),
  },
  {
    id: "env-o5-mobile-6174",
    systemId: "okr",
    name: "O5 呼叫群 移动端 6174",
    url: mockLoginUrl(6174),
  },
  {
    id: "env-it-personal",
    systemId: "okr",
    name: "信息技术部 个人工作",
    url: mockLoginUrl(6173),
  },
  {
    id: "env-it-team",
    systemId: "okr",
    name: "信息技术部 团队工作",
    url: mockLoginUrl(6173),
  },
  {
    id: "env-hr-personal",
    systemId: "okr",
    name: "人力资源部 个人工作",
    url: mockLoginUrl(6173),
  },
  {
    id: "env-hr-team",
    systemId: "okr",
    name: "人力资源部 团队工作",
    url: mockLoginUrl(6173),
  },
];

const OKR_ENV_PREFIXES = [
  "行动中心",
  "O5",
  "O5 呼叫群 PC",
  "O5 呼叫群 移动端",
  "OKR 看板",
  "周报空间",
] as const;

const OKR_DEPARTMENTS = [
  "信息技术部",
  "人力资源部",
  "财务部",
  "市场部",
  "销售部",
  "研发一部",
  "研发二部",
  "产品部",
  "运营部",
  "客服中心",
] as const;

const OKR_PORTS = [6173, 6174, 6175, 6176, 6177, 6178, 6179, 6180] as const;

function generateOkrEnvironments(): O5Environment[] {
  const generated: O5Environment[] = [];
  let index = 0;

  for (const dept of OKR_DEPARTMENTS) {
    for (const port of OKR_PORTS) {
      generated.push({
        id: `env-okr-dept-${index}`,
        systemId: "okr",
        name: `${dept} 环境 ${port}`,
        url: mockLoginUrl(port),
      });
      index += 1;
    }
  }

  for (const prefix of OKR_ENV_PREFIXES) {
    for (const port of OKR_PORTS) {
      generated.push({
        id: `env-okr-prefix-${index}`,
        systemId: "okr",
        name: `${prefix} ${port}`,
        url: mockLoginUrl(port),
      });
      index += 1;
    }
  }

  return [...OKR_ENV_BASE, ...generated];
}

const BASE_SYSTEMS: Omit<O5System, "count">[] = [
  { id: "test", name: "测试" },
  { id: "action-dev", name: "行动中心dev" },
  { id: "zhiyou", name: "智邮" },
  { id: "okr", name: "OKRdev" },
  { id: "test1", name: "测试系统1" },
  { id: "test2", name: "测试系统2" },
  { id: "aichat", name: "aiChat" },
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `extra-sys-${i + 1}`,
    name: `业务系统 ${String(i + 1).padStart(2, "0")}`,
  })),
];

const OTHER_ENVIRONMENTS: O5Environment[] = [
  {
    id: "env-action-dev-6173",
    systemId: "action-dev",
    name: "行动中心 6173",
    url: mockLoginUrl(6173),
  },
  { id: "env-o5-dev-6173", systemId: "action-dev", name: "O5 6173", url: mockLoginUrl(6173) },
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `env-action-dev-${i}`,
    systemId: "action-dev",
    name: `行动中心 dev 环境 ${6173 + i}`,
    url: mockLoginUrl(6173 + i),
  })),
  {
    id: "env-test-default",
    systemId: "test",
    name: "默认测试环境",
    url: mockLoginUrl(6173),
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `env-test-${i}`,
    systemId: "test",
    name: `测试沙箱 ${i + 1}`,
    url: mockLoginUrl(6173 + i),
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `env-zhiyou-${i}`,
    systemId: "zhiyou",
    name: `智邮实例 ${6173 + i}`,
    url: mockLoginUrl(6173 + i),
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `env-aichat-${i}`,
    systemId: "aichat",
    name: `AI Chat 联调 ${i + 1}`,
    url: mockLoginUrl(6173 + i),
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `env-extra-1-${i}`,
    systemId: "extra-sys-1",
    name: `预发环境 ${6173 + i}`,
    url: mockLoginUrl(6173 + i),
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `env-extra-2-${i}`,
    systemId: "extra-sys-2",
    name: `灰度环境 ${6173 + i}`,
    url: mockLoginUrl(6173 + i),
  })),
];

export const o5Environments: O5Environment[] = [
  ...generateOkrEnvironments(),
  ...OTHER_ENVIRONMENTS,
];

function attachSystemCounts(systems: Omit<O5System, "count">[]): O5System[] {
  return systems.map((system) => ({
    ...system,
    count: o5Environments.filter((env) => env.systemId === system.id).length,
  }));
}

export const o5Systems = attachSystemCounts(BASE_SYSTEMS);

/** @internal mock 按环境挂载，bootstrap 回退时按系统去重合并 */
export const o5AccountsByEnv: Record<string, O5Account[]> = {
  "env-action-6173": generateAccountsForEnv("env-action-6173", 36, 18822211133),
  "env-o5-6173": generateAccountsForEnv("env-o5-6173", 8, 13900001000),
  "env-o5-6174": generateAccountsForEnv("env-o5-6174", 6, 13900002000),
  "env-it-personal": generateAccountsForEnv("env-it-personal", 4, 13700001000),
};

/** @deprecated 仅兼容旧引用；请用 useO5EnvData */
export const o5Accounts: O5Account[] = Object.values(o5AccountsByEnv).flat();
