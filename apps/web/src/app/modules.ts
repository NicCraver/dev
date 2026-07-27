import type { DevDashModuleId } from "@mt-dev/shared";
import {
  ApiIcon,
  ComputerIcon,
  Database01Icon,
  Mail01Icon,
  RobotIcon,
  Layers01Icon,
  WrenchIcon,
} from "@hugeicons/core-free-icons";
import { createElement, type ComponentType } from "react";

import type { IconSvgElement } from "@/components/ui/icon";
import { ComingSoon } from "@/pages/ComingSoon";
import { MongoPage } from "@/pages/mongo/MongoPage";
import { O5EnvPage } from "@/pages/o5-env/O5EnvPage";
import { Pm2Page } from "@/pages/pm2/Pm2Page";
import { ToolsPage } from "@/pages/tools/ToolsPage";
import { YapiPage } from "@/pages/yapi/YapiPage";

export type DevDashModule = {
  id: DevDashModuleId;
  label: string;
  routePath: string;
  navPath: string;
  icon: IconSvgElement;
  page: ComponentType;
  /** 为 true 时侧栏 NavLink 匹配子路径（如 /yapi/projects） */
  navMatchPrefix?: boolean;
};

export const modules: DevDashModule[] = [
  {
    id: "o5-env",
    label: "O5 env",
    routePath: "o5-env",
    navPath: "/o5-env",
    icon: Layers01Icon,
    page: O5EnvPage,
  },
  {
    id: "zhiyou-env",
    label: "智邮 env",
    routePath: "zhiyou-env",
    navPath: "/zhiyou-env",
    icon: Mail01Icon,
    page: () => createElement(ComingSoon, { title: "智邮 env" }),
  },
  {
    id: "aichat-env",
    label: "aichat env",
    routePath: "aichat-env",
    navPath: "/aichat-env",
    icon: RobotIcon,
    page: () => createElement(ComingSoon, { title: "aichat env" }),
  },
  {
    id: "pm2",
    label: "PM2",
    routePath: "pm2",
    navPath: "/pm2",
    icon: ComputerIcon,
    page: Pm2Page,
  },
  {
    id: "mongo",
    label: "Mongo",
    routePath: "mongo",
    navPath: "/mongo",
    icon: Database01Icon,
    page: MongoPage,
  },
  {
    id: "yapi",
    label: "YApi",
    routePath: "yapi/*",
    navPath: "/yapi",
    icon: ApiIcon,
    page: YapiPage,
    navMatchPrefix: true,
  },
  {
    id: "tools",
    label: "工具",
    routePath: "tools",
    navPath: "/tools",
    icon: WrenchIcon,
    page: ToolsPage,
  },
];
