import type { DevDashModuleId } from "@mt-dev/shared";
import { Mail01Icon, RobotIcon, UserGroupIcon, WrenchIcon } from "@hugeicons/core-free-icons";
import { createElement, type ComponentType } from "react";

import type { IconSvgElement } from "@/components/ui/icon";
import { ComingSoon } from "@/pages/ComingSoon";
import { O5EnvPage } from "@/pages/o5-env/O5EnvPage";
import { ToolsPage } from "@/pages/tools/ToolsPage";

export type DevDashModule = {
  id: DevDashModuleId;
  label: string;
  routePath: string;
  navPath: string;
  icon: IconSvgElement;
  page: ComponentType;
};

export const modules: DevDashModule[] = [
  {
    id: "o5-env",
    label: "O5 env",
    routePath: "o5-env",
    navPath: "/o5-env",
    icon: UserGroupIcon,
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
    id: "tools",
    label: "工具",
    routePath: "tools",
    navPath: "/tools",
    icon: WrenchIcon,
    page: ToolsPage,
  },
];
