import type { DevDashModuleId } from "@mt-dev/shared";
import { Bot, Mail, Users, type LucideIcon } from "lucide-react";
import { createElement, type ComponentType } from "react";

import { ComingSoon } from "@/pages/ComingSoon";
import { O5EnvPage } from "@/pages/o5-env/O5EnvPage";

export type DevDashModule = {
  id: DevDashModuleId;
  label: string;
  routePath: string;
  navPath: string;
  icon: LucideIcon;
  page: ComponentType;
};

export const modules: DevDashModule[] = [
  {
    id: "o5-env",
    label: "O5 env",
    routePath: "o5-env",
    navPath: "/o5-env",
    icon: Users,
    page: O5EnvPage,
  },
  {
    id: "zhiyou-env",
    label: "智邮 env",
    routePath: "zhiyou-env",
    navPath: "/zhiyou-env",
    icon: Mail,
    page: () => createElement(ComingSoon, { title: "智邮 env" }),
  },
  {
    id: "aichat-env",
    label: "aichat env",
    routePath: "aichat-env",
    navPath: "/aichat-env",
    icon: Bot,
    page: () => createElement(ComingSoon, { title: "aichat env" }),
  },
];
