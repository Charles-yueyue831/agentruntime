# Agent.md — Coding Agent 执行前必读

> ⚠️ **本文件是本项目的 Agent 规范文件（Agent Instructions）。**
> **任何 coding agent 在本项目中执行任务之前，必须首先完整阅读本文件**，了解项目结构、文档约定与在线访问路径，再开始工作。

---

## 1. 强制执行规则（Coding Agent 必须遵守）

1. **每次执行任务前，必须先读取本项目根目录的 `Agent.md`（即本文件）**，获取项目上下文与最新约定，再开始任何编码、修改或生成操作。
2. 修改 `README.md` 或新增项目文件时，必须同步维护本文件中「第 3 节：项目文件与在线访问路径」表格，保证文档与项目实际文件一一对应。
3. 新生成的 HTML / 文档等可在线访问的文件，必须按「第 3 节」规则生成对应的 GitHub Pages 访问路径，并登记到表格中。
4. 提交（commit / push）前，检查文档内容与项目实际文件保持一致，避免遗漏。
5. 项目仓库：`git@github.com:Charles-yueyue831/tencentcloud.agentruntime.io.git`（分支 `main`）。

---

## 2. 项目概述

本项目为 **腾讯云 Agent Runtime（Agent 沙箱）学习资料库**，以手绘草图（Excalidraw 风）HTML 页面讲解核心概念，帮助开发者直观理解存储挂载（`StorageMount` / `MountOption`）、文件系统 CFS 挂载路径拼接等机制。

- **仓库名称**：`tencentcloud.agentruntime.io`
- **GitHub Pages 站点根路径**：`https://charles-yueyue831.github.io/agentruntime/`

## 3. 项目文件与在线访问路径

> GitHub Pages 访问路径与仓库目录结构一一对应；URL 中空格编码为 `%20`、`&` 编码为 `%26`。

| # | 本地路径（仓库内） | 内容说明 | 在线访问路径 |
| --- | --- | --- | --- |
| 1 | `README.md` | 项目总览与学习资料索引 | https://charles-yueyue831.github.io/agentruntime/ |
| 2 | `Storage/Mount/Storage Path & Mount Path.html` | 存储路径与挂载路径图解（StorageMount 默认规则 + MountOption 实例修改 + CFS 路径拼接） | https://charles-yueyue831.github.io/agentruntime/Storage/Mount/Storage%20Path%20%26%20Mount%20Path.html |

**访问路径生成规则**：任意新增文件，其在线访问路径 = `https://charles-yueyue831.github.io/agentruntime/` + 仓库内相对路径（空格 → `%20`，`&` → `%26`）。

## 4. 学习主题

- **StorageMount**：Tool 级默认挂载规则（存储来源、源路径、默认 MountPath、ReadOnly）
- **MountOption**：Instance 级挂载修改（引用已有 StorageMount.Name，可覆盖 MountPath、收紧权限、通过 SubPath 追加远端子目录）
- **CFS 挂载**：源路径 + SubPath → 目标 MountPath 的正确拼接方式（SubPath 加在远端源路径后，而非沙箱目标路径）

## 5. 参考资料

- [存储挂载（腾讯云 Agent Runtime）](https://cloud.tencent.com/document/product/1814/132215)
- [挂载文件系统 CFS](https://cloud.tencent.com/document/product/1814/129845)
- [数据结构](https://cloud.tencent.com/document/product/1814/124823)
- License：[Apache License 2.0](LICENSE)

---

_本文件为 Agent 规范文件，任何 coding agent 执行任务前必须首先阅读。_
