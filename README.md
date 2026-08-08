# 腾讯云 Agent Runtime（Agent 沙箱）学习资料

> 仓库：`tencentcloud.agentruntime.io`
> 在线访问：<https://charles-yueyue831.github.io/agentruntime/>

## 项目简介

收集、整理**腾讯云 Agent Runtime（Agent 沙箱）**相关学习资料，以手绘草图（Excalidraw 风）HTML 页面讲解核心概念，帮助开发者直观理解存储挂载（`StorageMount` / `MountOption`）、文件系统 CFS 挂载路径拼接等机制。

## 内容结构

| 本地路径 | 内容说明 | 在线访问路径 |
| --- | --- | --- |
| `README.md` | 项目总览（本文件） | <https://charles-yueyue831.github.io/agentruntime/> |
| `Storage/Mount/Storage Path & Mount Path.html` | 存储路径与挂载路径图解（StorageMount 默认规则 + MountOption 实例修改 + CFS 路径拼接） | <https://charles-yueyue831.github.io/agentruntime/Storage/Mount/Storage%20Path%20%26%20Mount%20Path.html> |

> 在线访问路径基于 GitHub Pages 站点 `https://charles-yueyue831.github.io/agentruntime/`，与仓库目录结构一一对应；路径中的空格以 `%20`、`&` 以 `%26` 进行 URL 编码。

> ⚠️ **给 Coding Agent 的说明**：任何 coding agent 在本项目执行任务前，必须先阅读根目录的 [`Agent.md`](Agent.md)（Agent 规范文件），其中包含强制执行规则与文件访问路径对照表；`AGENTS.md` 为自动加载引导入口。

## 学习主题

- **StorageMount**：Tool 级默认挂载规则（存储来源、源路径、默认 MountPath、ReadOnly）
- **MountOption**：Instance 级挂载修改（引用已有 StorageMount.Name，可覆盖 MountPath、收紧权限、通过 SubPath 追加远端子目录）
- **CFS 挂载**：源路径 + SubPath → 目标 MountPath 的正确拼接方式

## 参考资料

- [存储挂载（腾讯云 Agent Runtime）](https://cloud.tencent.com/document/product/1814/132215)
- [挂载文件系统 CFS](https://cloud.tencent.com/document/product/1814/129845)
- [数据结构](https://cloud.tencent.com/document/product/1814/124823)

## License

[Apache License 2.0](LICENSE)
