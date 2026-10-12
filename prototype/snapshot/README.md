# 腾讯云 Agent Runtime · 模板快照交互原型

[返回仓库首页](../../README.md)

同步日期：2026-10-12。包含当前线上原型的独立运行页面和 React / TypeScript / Tea 源码。

- [交互原型入口](index.html?tab=template)
- [源站](https://julacliang.pages.woa.com/tencent/snapshot/template/?tab=template)
- [GitHub Pages 路径](https://charles-yueyue831.github.io/agentruntime/prototype/snapshot/?tab=template)（是否可访问取决于仓库 Pages 部署状态）

## 当前内容

统一模板快照列表、制作配置页面、多版本、筛选、自动删除策略编辑、快照详情、制作进度和监控，以及关联沙箱模板与实例页面。已包含最新状态名称和筛选条件，并删除列表上方重复的“模板快照”标题栏。

## 本地预览

在本目录运行 `python3 -m http.server 8080`，访问 `http://localhost:8080/?tab=template`。无需安装依赖即可预览已构建的 index.html。

## 修改与构建

需要 Node.js 18+，执行：

```sh
npm ci --registry=https://mirrors.tencent.com/npm/
npm run build
```

`portable.tsx` 为入口；`src/cases/template-snapshot/` 为业务代码；`src/console-shell/` 为控制台框架。构建输出 index.html（内嵌脚本和样式）。该文件属于控制台应用页面，保留原型导航，不混入学习文档导航条。

原型使用浏览器本地模拟数据，不连接真实云资源。部分关联页面仍指向原站，需要网络和相应访问权限。本次未包含视频与录屏素材。
