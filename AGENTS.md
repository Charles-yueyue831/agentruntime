# AGENTS.md — Agent 规范文件（Coding Agent 执行前必读）

> ⚠️ **本文件是本项目唯一的 Agent 规范文件（Agent Instructions），且 AGENTS.md 会被主流 coding agent 自动加载。**
> **任何 coding agent 在本项目中执行任务之前，必须首先完整阅读本文件**，了解项目结构、文档约定与在线访问路径，再开始工作。

---

## 1. 强制执行规则（Coding Agent 必须遵守）

1. **每次执行任务前，必须先读取本项目根目录的 `AGENTS.md`（即本文件）**，获取项目上下文与最新约定，再开始任何编码、修改或生成操作。
2. 修改 `README.md` 或新增项目文件时，必须同步维护本文件中「第 3 节：项目文件与在线访问路径」表格，保证文档与项目实际文件一一对应。
3. 新生成的 HTML / 文档等可在线访问的文件，必须按「第 3 节」规则生成对应的 GitHub Pages 访问路径，并登记到表格中。
4. 提交（commit / push）前，检查文档内容与项目实际文件保持一致，避免遗漏。
5. 项目仓库：`git@github.com:Charles-yueyue831/agentruntime.git`（分支 `main`）。

---

## 2. 项目概述

本项目为 **腾讯云 Agent Runtime（Agent 沙箱）学习资料库**，以手绘草图（Excalidraw 风）HTML 页面讲解核心概念，覆盖技术向（存储挂载 `StorageMount` / `MountOption`、实例覆盖 Tool 挂载配置、存储管控边界）与产品向（产品经理元概念词典、问题性质四问归类法）两类学习内容。

- **仓库名称**：`agentruntime`
- **GitHub Pages 站点根路径**：`https://charles-yueyue831.github.io/agentruntime/`

## 3. 项目文件与在线访问路径

> GitHub Pages 访问路径与仓库目录结构一一对应；URL 中空格编码为 `%20`、中文按 UTF-8 URL 编码。

| # | 本地路径（仓库内） | 内容说明 | 在线访问路径 |
| --- | --- | --- | --- |
| 1 | `README.md` | 项目总览与学习资料索引 | https://charles-yueyue831.github.io/agentruntime/ |
| 2 | `storage/path override.html` | 图解「为什么 Instance 可以覆盖 Tool 的 MountPath，却不等于绕过存储管控」（MountPath 是位置，StorageSource / ReadOnly 上限 / 路径规则才是边界） | https://charles-yueyue831.github.io/agentruntime/storage/path%20override.html |
| 3 | `产品经理黑话.html` | 腾讯云 Agent 沙箱 · 产品经理元概念词典（从「为什么做」到「怎么证明可信」共 11 章 + 总链路 + 官方事实锚点） | https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E9%BB%91%E8%AF%9D.html |
| 4 | `产品能力/问题性质.html` | 问题性质判断 · 四问归类法（手绘笔记：四闸口 · 八出口，Agent 沙箱八场景演练，判定陷阱与实战要点） | https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E8%83%BD%E5%8A%9B/%E9%97%AE%E9%A2%98%E6%80%A7%E8%B4%A8.html |

**访问路径生成规则**：任意新增文件，其在线访问路径 = `https://charles-yueyue831.github.io/agentruntime/` + 仓库内相对路径（空格 → `%20`，中文 → UTF-8 百分号编码）。

## 4. 学习主题

**技术向（Agent Runtime 存储挂载）**
- **StorageMount（Tool 级）**：定义默认存储来源（StorageSource）、默认 MountPath、默认 ReadOnly，即「允许使用什么存储、最多能有什么权限、默认挂到哪里」
- **MountOption（Instance 级）**：引用已有的 StorageMount.Name，可覆盖本地 MountPath、追加 SubPath、收紧 ReadOnly，但不能替换存储来源或放宽权限
- **管控边界**：MountPath 只是容器内「位置」；StorageSource 不可换、ReadOnly 只能收紧、路径合法性由平台统一校验

**产品向（产品思维与元概念）**
- **产品经理元概念词典**：从「为什么做 / 怎么看问题 / 怎么解决」到「怎么增长 / 怎么经营市场 / 怎么组织资源 / 怎么证明可信」的产品思维抽象层级梯子
- **问题性质判断 · 四问归类法**：四闸口 · 八出口，快速判断问题性质（需求类 / 实现类 / 认知类等），配合 Agent 沙箱八场景演练

## 5. 参考资料

- [存储挂载（腾讯云 Agent Runtime）](https://cloud.tencent.com/document/product/1814/132215)
- [挂载文件系统 CFS](https://cloud.tencent.com/document/product/1814/129845)
- License：[Apache License 2.0](LICENSE)

---

_本文件为项目唯一的 Agent 规范文件，任何 coding agent 执行任务前必须首先阅读。_
