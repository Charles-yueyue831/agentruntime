# Console Shell

腾讯云控制台通用框架壳子 SDK，供所有控制台业务复用。

## 来源

从 `sdk-nav-v2` 源码完整移植，侧边菜单使用 Tea 原生 `Menu` 组件，包含：

- **顶部导航 Nav**：Logo + AppList + Search + Setting + UserInfo + Menu（汉堡菜单面板）
- **二级导航 SubNav**：产品标签栏
- **左侧菜单 Sider**：Tea Menu（可折叠、支持分组/子菜单）
- **内容区 Content**：通过 `children` 注入业务页面

## 文件清单

| 文件 | 说明 |
|---|---|
| `console-shell.tsx` | 框架壳子组件（默认视为只读） |
| `styles/index.css` | **样式统一入口**（引入此文件即可） |
| `styles/sdk-nav-v2.css` | 顶部导航核心样式（编译产物） |
| `styles/content-area.css` | 内容区宽度覆盖（Tea 默认 `1360px` → `100%`） |

## 使用方式

### 1. 样式引入（在项目入口 `main.tsx` / `app.tsx` 中）

```tsx
import "@tencent/tea-component/dist/themes/console-pack.css";
import "@tencent/tea-component/dist/tea-themeable.css";
import "@sdk/console-shell/styles/index.css";
```

> ⚠️ 顺序必须保持：**Tea 主题变量 → Tea 组件样式 → Console Shell 样式**。

### 2. 组件引入（在业务页面中）

```tsx
import { ConsoleLayout } from "@sdk/console-shell/console-shell";
import { Content, Card } from "@tencent/tea-component";

export default function MyPage() {
  return (
    <ConsoleLayout>
      <Content>
        <Content.Header title="页面标题" />
        <Content.Body>
          <Card>{/* 业务内容 */}</Card>
        </Content.Body>
      </Content>
    </ConsoleLayout>
  );
}
```

### 3. 当前测试项目中的推荐侧边栏注入方式

当前 `console-design/` 运行容器已经支持：

- `CaseViewer` 读取 `registry.ts` 中的 `siderComponent`
- `ConsoleLayout` 通过 `siderContent` 接收自定义侧边栏

因此在当前项目里，**优先新增独立的 `{Product}Sider.tsx`，而不是直接修改 `console-shell.tsx`**。

示意：

```tsx
<ConsoleLayout siderContent={<CvmSiderMenu theme={menuTheme} />}>
  <Page />
</ConsoleLayout>
```

## 样式文件说明

| 文件 | 来源 | 说明 |
|---|---|---|
| `sdk-nav-v2.css` | `sdk-nav-v2` 编译产物 | 顶部导航栏、二级导航、汉堡菜单面板、设置面板、用户信息面板等所有 `sdk-nav-v2-*` CSS 类名 |
| `content-area.css` | 自定义覆盖 | 覆盖 Tea 默认内容区最大宽度 |

## 依赖

- `@tencent/tea-component` **>= 2.8.5**
- `@tencent/tea-icons-react`
- `classnames`
- `react` 18.x
- 所有样式文件为纯 CSS，无需 SCSS 编译能力

> 实际锁定版本以当前项目的 `console-design/package.json` 为准。

## 规则

- ⚠️ 当前项目中，`console-shell.tsx` 默认视为**只读**，优先通过 `siderContent` 定制侧边栏
- ❌ 禁止在业务页面中自行实现顶部导航 / 侧边菜单
- ❌ 禁止漏引样式文件
- ❌ 禁止修改壳子的布局结构（`Layout / Layout.Header / Layout.Body / Layout.Sider / Layout.Content`）
- ❌ 禁止修改顶部导航（Nav）和二级导航（SubNav）的代码
- ✅ 所有控制台页面必须使用 `<ConsoleLayout>` 作为最外层框架
- ✅ 样式必须按正确顺序引入

## 侧边栏内容定制化

### 推荐方式：独立侧边栏组件 + `siderContent`

在当前测试容器中，按下面的方式做：

1. 在目标 case 目录下创建 `{Product}Sider.tsx`
2. 组件内部使用 `TeaMenu` 组织菜单
3. 在 `registry.ts` 中通过 `siderComponent` 懒加载
4. 由 `CaseViewer` 自动注入 `ConsoleLayout.siderContent`

### 菜单数据来源

如果 `yehe-mcp-server` 可用，优先：

1. 调用 `buffet_product_detail(productId)`
2. 从 `configList` 中提取 `product.menu`
3. 优先使用 `site=1, lang="zh"` 的菜单配置
4. 解析 `staticMenu`，每个一级菜单项的 `iconName` 字段为 UUID 格式

### 菜单图标处理

#### ⚠️ 图标来源优先级（强制）

**侧边栏图标必须优先使用 Yehe 真实数据，禁止自行猜测、匹配或编造图标 ID。**

1. **Yehe MCP 真实数据（最高优先级）**：调用 `yehe-mcp-server` 的 `buffet_product_detail` 获取产品菜单配置，从 `staticMenu` 中提取每个菜单项的 `iconName` 字段（UUID 格式），使用该真实 UUID 拼接图标 URL
2. **`DEFAULT_SIDER_ICON` 占位符兜底（需用户确认）**：当 yehe MCP 未返回 `iconName`（接口调用失败、字段缺失或为空）时，**必须暂停并提示用户**，明确告知哪些菜单项缺少真实图标，询问是否使用 `DEFAULT_SIDER_ICON` 占位符代替。**用户确认后才能继续生成代码**

#### 🚫 未获取到真实图标时的处理流程

```
调用 yehe MCP 获取菜单数据
  ├─ ✅ iconName 存在 → 直接使用真实 UUID 拼接图标 URL
  └─ ❌ iconName 缺失/为空/接口失败
       → ⛔ 暂停生成，向用户提示：
         "以下菜单项未从 Yehe 获取到真实图标：[菜单项列表]，是否使用默认占位图标（DEFAULT_SIDER_ICON）代替？"
       → 用户确认 → 使用 DEFAULT_SIDER_ICON 兜底
       → 用户拒绝 → 等待用户提供图标信息或调整方案
```

❌ **禁止**：在未调用 yehe MCP 的情况下，从其他产品页面"借用"或"按语义匹配"图标 ID
❌ **禁止**：凭记忆或猜测编造图标 UUID
❌ **禁止**：所有菜单项统一使用同一个 `DEFAULT_SIDER_ICON`（这说明没有去取真实图标数据）
❌ **禁止**：未经用户确认就静默使用 `DEFAULT_SIDER_ICON` 兜底

#### CDN 域名与路径

- **CDN 域名与路径**（与 `references/common/hard-rules.md` 一致）：yehe 返回的 `iconName` 是 UUID，必须按以下模板拼接：

```ts
const DEFAULT_SIDER_ICON =
  "https://cloudcache.tencentcs.com/qcloud/ui/static/console_aside_v5/808b4bc6-761b-4aa2-ac62-53ec1d4eacb2-light.svg";

const siderIcon = (iconName?: string) =>
  iconName
    ? `https://cloudcache.tencentcs.com/qcloud/ui/static/console_aside_v5/${iconName}-light.svg`
    : DEFAULT_SIDER_ICON;
```

- 直接传 URL 字符串给 Tea Menu 的 `icon` prop：`icon={siderIcon(iconName)}`
- ❌ **禁止**用 `<img>` 元素包装：Tea Menu 的 `icon` prop 接收 string URL 时会自动渲染图标
- ❌ **禁止**使用 `qcloud/tea/app-icon/{iconName}.svg` 路径（该路径不存在，会 404）
- ❌ **禁止**使用 `tencent-cloud.com` 域名（现网实际域名为 `tencentcs.com`）
- **兜底规则**：如果菜单项没有 `iconName` 或为空，**必须先提示用户确认**，确认后使用 `DEFAULT_SIDER_ICON` 兜底，禁止省略 `icon` 属性或传入空字符串

### 何时才考虑直接改壳子

只有在以下场景才考虑修改 `console-shell.tsx`：

1. 用户明确要求“修改壳子本身”
2. 当前运行容器不支持 `siderContent`
3. 必须调整壳子默认占位内容，且注入方式无法满足

若不满足以上条件，统一使用独立侧边栏组件方案。
