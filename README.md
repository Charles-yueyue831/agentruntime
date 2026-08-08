# 腾讯云 Agent Runtime（Agent 沙箱）学习资料

> 仓库：`agentruntime`
> 在线访问：<https://charles-yueyue831.github.io/agentruntime/>

## 项目简介

收集、整理**腾讯云 Agent Runtime（Agent 沙箱）**相关学习资料，以手绘草图（Excalidraw 风）HTML 页面讲解核心概念，帮助开发者直观理解存储挂载（`StorageMount` / `MountOption`）、实例如何覆盖 Tool 的挂载配置、存储管控边界等机制。

## 内容结构

| 本地路径 | 内容说明 | 在线访问路径 |
| --- | --- | --- |
| `README.md` | 项目总览（本文件） | <https://charles-yueyue831.github.io/agentruntime/> |
| `storage/path override.html` | 图解「为什么 Instance 可以覆盖 Tool 的 MountPath，却不等于绕过存储管控」（MountPath 是位置，StorageSource / ReadOnly 上限 / 路径规则才是边界） | <https://charles-yueyue831.github.io/agentruntime/storage/path%20override.html> |

> 在线访问路径基于 GitHub Pages 站点 `https://charles-yueyue831.github.io/agentruntime/`，与仓库目录结构一一对应；路径中的空格以 `%20` 进行 URL 编码。

> ⚠️ **给 Coding Agent 的说明**：任何 coding agent 在本项目执行任务前，必须先阅读根目录的 [`AGENTS.md`](AGENTS.md)（Agent 规范文件），其中包含强制执行规则与文件访问路径对照表，且会被主流 coding agent 自动加载。

## 学习主题

- **StorageMount（Tool 级）**：定义默认存储来源（StorageSource）、默认 MountPath、默认 ReadOnly，即「允许使用什么存储、最多能有什么权限、默认挂到哪里」
- **MountOption（Instance 级）**：引用已有的 StorageMount.Name，可覆盖本地 MountPath、追加 SubPath、收紧 ReadOnly，但不能替换存储来源或放宽权限
- **管控边界**：MountPath 只是容器内「位置」；StorageSource 不可换、ReadOnly 只能收紧、路径合法性由平台统一校验

## 参考资料

- [存储挂载（腾讯云 Agent Runtime）](https://cloud.tencent.com/document/product/1814/132215)
- [挂载文件系统 CFS](https://cloud.tencent.com/document/product/1814/129845)

## License

[Apache License 2.0](LICENSE)
