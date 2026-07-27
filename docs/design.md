# mt-dev 设计风格

> 内部开发工具台（Dev Dash）的前端视觉与交互约定。  
> 实现参考：`apps/web/src/index.css`、`apps/web/src/lib/interaction.ts`、`apps/web/src/components/ui/`。

## 气质

冷灰底 + 品牌蓝点缀的**双栏工作台**：安静、密信息、可操作。接近 shadcn 系 SaaS 控制台，不是品牌营销页——不做装饰性插画、大段氛围渐变或花哨动效。

**口诀**：冷中性底面、单一品牌蓝、细边框轻阴影、分栏工作台、短时 micro-interaction。

## 技术底座

| 项   | 选择                                                              |
| ---- | ----------------------------------------------------------------- |
| 样式 | Tailwind CSS 4 + CSS 变量（oklch / color-mix）                    |
| 组件 | shadcn 风格（`components/ui/`）+ CVA                              |
| 图标 | `@hugeicons/react`，线宽默认 `1.5`                                |
| 动效 | `motion` 仅用于少量入场；交互节奏统一走 `lib/interaction.ts`      |
| 字体 | 系统无衬线 + `antialiased`；数字 `tabular-nums`；快捷键等宽 `kbd` |

## 色彩

### 品牌色

| Token                                      | 值                        | 用法                       |
| ------------------------------------------ | ------------------------- | -------------------------- |
| `--primary`                                | `#346eee`                 | 选中、焦点、链接、强调阴影 |
| `--primary-subtle`                         | primary 与白/透明的浅混色 | 弱 hover、分段未选中 hover |
| `--primary-soft`                           | 更深一层浅蓝              | 导航/Rail 选中底           |
| `--primary-hover` / `--primary-soft-hover` | soft 的 hover 变体        | 选中态悬停                 |

选中态优先用 **浅蓝底（`primary-soft`）+ 主色文字**，慎用整块实心蓝；实心 `bg-primary` 留给主按钮、分段选中、fill 型导航。

### 中性与层级

| 角色    | 典型值                                              | 用法                 |
| ------- | --------------------------------------------------- | -------------------- |
| 页面底  | `background` ≈ oklch(0.985) / `#f8fafc`             | 主内容区             |
| 侧栏底  | `#fcfcfe` / `sidebar`                               | 列表、工具目录       |
| 卡片/壳 | `card` 纯白、`bg-white`                             | 面板、弹层           |
| 正文    | `foreground` / `slate-800`                          | 标题、主文案         |
| 次要    | `muted-foreground`                                  | 说明、元数据         |
| 边框    | `border` / `border-border/60` / `border-primary/20` | 细线分割，半透明优先 |

中性色略偏冷（hue ≈ 262）。暗色 token 已在 `.dark` 定义；默认体验以浅色工作台为准。

### 语义色

| 语义        | 用法           |
| ----------- | -------------- |
| emerald     | 成功、已复制   |
| amber       | 收藏 / 星标    |
| destructive | 危险操作、错误 |

## 布局

```
┌────┬──────────────────────────────┐
│Rail│  模块内容（Outlet）            │
│56px│  左列表 / 可拖拽分栏 / 主区    │
└────┴──────────────────────────────┘
```

- **App Rail**：最左 `w-14` 图标栏，只靠图标切换模块。
- **模块内**：左窄列表 + 右主区；O5 / PM2 / Mongo 等可用 `react-resizable-panels`。
- **全屏壳**：`h-svh overflow-hidden`；滚动落在局部面板，用 `scrollbar-thin`（悬停才显 thumb）。
- **分隔条**：静态 `border` 细线；拖动时可用 `primary/15~25` 轻高亮，避免粗黑块或强 ring。

## 形态

| 元素          | 约定                                                           |
| ------------- | -------------------------------------------------------------- |
| 全局圆角      | `--radius: 0.625rem`                                           |
| 列表项 / 按钮 | `rounded-lg` / `rounded-md`                                    |
| 卡片 / 搜索框 | `rounded-xl`                                                   |
| 常用账号 chip | `rounded-3xl` 胶囊                                             |
| 边框          | 细、半透明；少用厚描边                                         |
| 阴影          | `shadow-xs` / `shadow-sm`；账号卡悬停轻微上浮 + 淡蓝阴影       |
| Card          | 有交互或成组内容时用；空状态可用居中 Card，日常列表不必套 Card |

## 组件与信息层级

- **Button**：`default` / `secondary` / `outline` / `ghost`；尺寸 `default` / `sm` / `icon`。
- **Badge**：默认 primary；计数、组织等用小号、`text-[10px]`、浅边框。
- **列表选中**：`bg-primary/5 border-primary/30` 或 soft 导航样式；与 App Rail 一致走主题色，不硬编码蓝。
- **顶栏**：可 `bg-white/80 backdrop-blur-md` + 底部分割线。
- **空状态**：大圆角图标容器（如 `rounded-2xl bg-primary/5`）+ 一句标题 + 一句说明，不堆插画。
- **密度**：偏工具软件——小号标签（如 `tracking-widest uppercase`）、网格卡片、常驻操作（复制等）。

## 交互

统一从 `apps/web/src/lib/interaction.ts` 取类名，避免各页自造 hover/active。

| 约定           | 值                                        |
| -------------- | ----------------------------------------- |
| 过渡           | `transition-all duration-150 ease-out`    |
| 按下           | `active:scale-[0.97] active:duration-100` |
| 焦点环         | `ring-[3px] ring-ring/50`                 |
| 禁用           | `opacity-40` + 禁止 pointer / 取消 scale  |
| 导航 soft 选中 | `bg-primary-soft text-primary` + 左侧色条 |
| 导航 fill 选中 | `bg-primary text-primary-foreground`      |
| 快捷键徽标     | `shortcutKbdClasses`（mono + 浅蓝底边框） |

动效克制：模块占位页可有短暂 fade / 上移（约 200ms）；禁止大段氛围动画、glow、多层阴影堆叠。

## 模块页面约定

| 区域        | 浅色参考                            |
| ----------- | ----------------------------------- |
| 侧栏 / 目录 | `bg-[#fcfcfe]` + `border-border/60` |
| 主滚动区    | `bg-[#f8fafc]` + `scrollbar-thin`   |
| 面板表面    | `bg-white` / `bg-card`              |

新增侧栏模块时：走 `app/modules.ts` 注册；UI 对齐现有 token 与 `interaction.ts`，不要另起一套色板或圆角体系。

## 反模式

- 紫粉渐变、暖奶油底 + 衬线大标题、报纸风细线密排
- 默认 Inter/Roboto 作「品牌字体」、hero 大图、营销式卡片墙
- 硬编码与 `#346eee` 无关的蓝色选中态
- 分隔条拖动时大块黑色/强 ring
- 为装饰而装饰的渐变球、emoji、圆角胶囊标签堆

## 相关文件

| 路径                                                   | 说明                                 |
| ------------------------------------------------------ | ------------------------------------ |
| `apps/web/src/index.css`                               | 设计 token、滚动条、分隔条覆盖       |
| `apps/web/src/lib/interaction.ts`                      | 导航、按钮、卡片、搜索框交互类       |
| `apps/web/src/components/ui/`                          | Button、Card、Badge、Icon、Resizable |
| `apps/web/src/components/app-rail/`                    | 应用栏                               |
| `docs/superpowers/specs/2026-05-19-dev-dash-design.md` | 壳与模块 IA                          |
| `docs/superpowers/specs/2026-05-19-o5-env-prd.md`      | O5 分栏与选中态细则                  |
