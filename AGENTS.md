# AGENTS.md — Agent 规范文件（Coding Agent 执行前必读）

> ⚠️ **本文件是本项目唯一的 Agent 规范文件（Agent Instructions），且 AGENTS.md 会被主流 coding agent 自动加载。**
> **任何 coding agent 在本项目中执行任务之前，必须首先完整阅读本文件**，了解项目结构、文档约定与在线访问路径，再开始工作。

---

## 1. 强制执行规则（Coding Agent 必须遵守）

1. **每次执行任务前，必须先读取本项目根目录的 `AGENTS.md`（即本文件）**，获取项目上下文与最新约定，再开始任何编码、修改或生成操作。
2. 修改 `README.md` 或新增项目文件时，必须同步维护本文件中「第 3 节：项目文件与在线访问路径」表格，保证文档与项目实际文件一一对应。
3. 新生成的 HTML / 文档等可在线访问的文件，必须按「第 3 节」规则生成对应的 GitHub Pages 访问路径，并登记到表格中。
4. **新增或修改 HTML 文档时，必须维护各文档顶部的互链导航条**：包含「🏠 README 首页」链接与全部文档的跳转链接，当前页以深色背景 + "· 当前" 标记高亮；新增文档需在其余所有文档的导航条中同步加入。
5. 提交（commit / push）前，检查文档内容与项目实际文件保持一致，避免遗漏。
6. 项目仓库：`git@github.com:Charles-yueyue831/agentruntime.git`（分支 `main`）。

---

## 2. 项目概述

本项目为 **腾讯云 Agent Runtime（Agent 沙箱）学习资料库**，以手绘草图（Excalidraw 风）HTML 页面讲解核心概念，覆盖技术向（沙箱内管理守护进程 envd、存储挂载 `StorageMount` / `MountOption`、实例覆盖 Tool 挂载配置、存储管控边界）与产品向（产品经理元概念词典、用户旅程观察、问题性质四问归类法）两类学习内容。

- **仓库名称**：`agentruntime`
- **GitHub Pages 站点根路径**：`https://charles-yueyue831.github.io/agentruntime/`

## 3. 项目文件与在线访问路径

> GitHub Pages 访问路径与仓库目录结构一一对应；URL 中空格编码为 `%20`、中文按 UTF-8 URL 编码。

| # | 本地路径（仓库内） | 内容说明 | 在线访问路径 |
| --- | --- | --- | --- |
| 1 | `README.md` | 项目总览与学习资料索引 | https://charles-yueyue831.github.io/agentruntime/ |
| 2 | `Agent 沙箱/计算与执行/envd 使用指南.html` | envd · 沙箱内管理守护进程（Guest Management Agent，把 SDK / 云侧管理请求转换为 Guest Linux 中真实的命令、进程、文件与健康检查操作；管理端口 49983 与业务端口分离） | https://charles-yueyue831.github.io/agentruntime/Agent%20%E6%B2%99%E7%AE%B1/%E8%AE%A1%E7%AE%97%E4%B8%8E%E6%89%A7%E8%A1%8C/envd%20%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.html |
| 3 | `Agent 沙箱/存储/挂载路径覆盖.html` | 图解「为什么 Instance 可以覆盖 Tool 的 MountPath，却不等于绕过存储管控」（MountPath 是位置，StorageSource / ReadOnly 上限 / 路径规则才是边界） | https://charles-yueyue831.github.io/agentruntime/Agent%20%E6%B2%99%E7%AE%B1/%E5%AD%98%E5%82%A8/%E6%8C%82%E8%BD%BD%E8%B7%AF%E5%BE%84%E8%A6%86%E7%9B%96.html |
| 4 | `产品经理/产品经理黑话.html` | AI 产品经理 · 产品概念词典（67 词条：AI 产品语境、场景示例、PM 判断；11 章 + 产品判断链路 + 官方参考资料） | https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E9%BB%91%E8%AF%9D.html |
| 5 | `产品经理/用户旅程图.html` | 姿势 · 流程 · 旅程图：三个观察高度（手绘笔记：三层观察台可下钻、三者对比速查、为四问归类法供证据、实操顺序与误区便签） | https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86/%E7%94%A8%E6%88%B7%E6%97%85%E7%A8%8B%E5%9B%BE.html |
| 6 | `产品能力/问题性质.html` | 问题性质判断 · 四问归类法（手绘笔记：四闸口 · 八出口，Agent 沙箱八场景演练，判定陷阱与实战要点） | https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E8%83%BD%E5%8A%9B/%E9%97%AE%E9%A2%98%E6%80%A7%E8%B4%A8.html |

| 7 | `prototype/gpu/01.png` | GPU 沙箱用户体验截图 01 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/01.png |
| 8 | `prototype/gpu/02.png` | GPU 沙箱用户体验截图 02 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/02.png |
| 9 | `prototype/gpu/03.png` | GPU 沙箱用户体验截图 03 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/03.png |
| 10 | `prototype/gpu/04.png` | GPU 沙箱用户体验截图 04 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/04.png |
| 11 | `prototype/gpu/05.png` | GPU 沙箱用户体验截图 05 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/05.png |
| 12 | `prototype/gpu/06.png` | GPU 沙箱用户体验截图 06 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/06.png |
| 13 | `prototype/gpu/07.png` | GPU 沙箱用户体验截图 07 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/07.png |
| 14 | `prototype/gpu/08.png` | GPU 沙箱用户体验截图 08 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/08.png |
| 15 | `prototype/gpu/09.png` | GPU 沙箱用户体验截图 09 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/09.png |
| 16 | `prototype/gpu/10.png` | GPU 沙箱用户体验截图 10 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/10.png |
| 17 | `prototype/gpu/11.png` | GPU 沙箱用户体验截图 11 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/11.png |
| 18 | `prototype/gpu/12.png` | GPU 沙箱用户体验截图 12 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/12.png |
| 19 | `prototype/gpu/13.png` | GPU 沙箱用户体验截图 13 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/13.png |
| 20 | `prototype/gpu/14.png` | GPU 沙箱用户体验截图 14 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/14.png |
| 21 | `prototype/gpu/GPU原型用户体验.webm` | GPU 沙箱用户体验录像 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/GPU%E5%8E%9F%E5%9E%8B%E7%94%A8%E6%88%B7%E4%BD%93%E9%AA%8C.webm |
| 22 | `prototype/gpu/index.html` | GPU 沙箱用户体验页面 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/index.html |
| 23 | `prototype/gpu/体验录像.html` | GPU 沙箱用户体验页面 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/%E4%BD%93%E9%AA%8C%E5%BD%95%E5%83%8F.html |
| 24 | `prototype/gpu/体验报告.md` | GPU 沙箱用户体验报告 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/%E4%BD%93%E9%AA%8C%E6%8A%A5%E5%91%8A.md |
| 25 | `prototype/gpu/操作轨迹.json` | GPU 沙箱用户体验操作记录 | https://charles-yueyue831.github.io/agentruntime/prototype/gpu/%E6%93%8D%E4%BD%9C%E8%BD%A8%E8%BF%B9.json |

| 26 | `prototype/preheat/01 预热任务.mp4` | 01 预热任务 · 中文配音演示视频 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/01%20%E9%A2%84%E7%83%AD%E4%BB%BB%E5%8A%A1.mp4 |
| 27 | `prototype/preheat/01 预热任务.srt` | 01 预热任务 · 中文字幕 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/01%20%E9%A2%84%E7%83%AD%E4%BB%BB%E5%8A%A1.srt |
| 28 | `prototype/preheat/02 自动预热.mp4` | 02 自动预热 · 中文配音演示视频 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/02%20%E8%87%AA%E5%8A%A8%E9%A2%84%E7%83%AD.mp4 |
| 29 | `prototype/preheat/02 自动预热.srt` | 02 自动预热 · 中文字幕 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/02%20%E8%87%AA%E5%8A%A8%E9%A2%84%E7%83%AD.srt |
| 30 | `prototype/preheat/03 自动卸载.mp4` | 03 自动卸载 · 中文配音演示视频 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/03%20%E8%87%AA%E5%8A%A8%E5%8D%B8%E8%BD%BD.mp4 |
| 31 | `prototype/preheat/03 自动卸载.srt` | 03 自动卸载 · 中文字幕 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/03%20%E8%87%AA%E5%8A%A8%E5%8D%B8%E8%BD%BD.srt |
| 32 | `prototype/preheat/04 预热任务监控.mp4` | 04 预热任务监控 · 中文配音演示视频 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/04%20%E9%A2%84%E7%83%AD%E4%BB%BB%E5%8A%A1%E7%9B%91%E6%8E%A7.mp4 |
| 33 | `prototype/preheat/04 预热任务监控.srt` | 04 预热任务监控 · 中文字幕 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/04%20%E9%A2%84%E7%83%AD%E4%BB%BB%E5%8A%A1%E7%9B%91%E6%8E%A7.srt |
| 34 | `prototype/preheat/README.md` | 镜像预热客户使用演示播放说明 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/README.md |
| 35 | `prototype/preheat/镜像预热客户使用演示-合集.mp4` | 镜像预热客户使用演示-合集 · 中文配音演示视频 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/%E9%95%9C%E5%83%8F%E9%A2%84%E7%83%AD%E5%AE%A2%E6%88%B7%E4%BD%BF%E7%94%A8%E6%BC%94%E7%A4%BA-%E5%90%88%E9%9B%86.mp4 |
| 36 | `prototype/preheat/镜像预热客户使用演示-合集.srt` | 镜像预热客户使用演示-合集 · 中文字幕 | https://charles-yueyue831.github.io/agentruntime/prototype/preheat/%E9%95%9C%E5%83%8F%E9%A2%84%E7%83%AD%E5%AE%A2%E6%88%B7%E4%BD%BF%E7%94%A8%E6%BC%94%E7%A4%BA-%E5%90%88%E9%9B%86.srt |

**访问路径生成规则**：任意新增文件，其在线访问路径 = `https://charles-yueyue831.github.io/agentruntime/` + 仓库内相对路径（空格 → `%20`，中文 → UTF-8 百分号编码）。

## 4. 学习主题

**技术向（Agent Runtime 沙箱）**
- **envd（沙箱内管理守护进程）**：Guest Management Agent，把 SDK / 云侧管理请求转换为 Guest Linux 中真实的命令、进程、文件与健康检查操作；管理端口 49983 与业务端口（8080 / 3000 / …）相分离
- **StorageMount（Tool 级）**：定义默认存储来源（StorageSource）、默认 MountPath、默认 ReadOnly，即「允许使用什么存储、最多能有什么权限、默认挂到哪里」
- **MountOption（Instance 级）**：引用已有的 StorageMount.Name，可覆盖本地 MountPath、追加 SubPath、收紧 ReadOnly，但不能替换存储来源或放宽权限
- **管控边界**：MountPath 只是容器内「位置」；StorageSource 不可换、ReadOnly 只能收紧、路径合法性由平台统一校验

**产品向（产品思维与元概念）**
- **AI 产品经理概念词典**：67 个常用词按「AI 产品语境 / 场景示例 / PM 判断」解释，覆盖用户任务、模型与产品能力边界、验收、成本、人工介入、增长与经营
- **用户旅程观察**：使用姿势 · 使用流程 · 用户旅程图三个观察高度，可下钻的「三层观察台」，为问题定性提供证据
- **问题性质判断 · 四问归类法**：四闸口 · 八出口，快速判断问题性质（需求类 / 实现类 / 认知类等），配合 Agent 沙箱八场景演练

## 5. 参考资料

- [存储挂载（腾讯云 Agent Runtime）](https://cloud.tencent.com/document/product/1814/132215)
- [挂载文件系统 CFS](https://cloud.tencent.com/document/product/1814/129845)
- License：[Apache License 2.0](LICENSE)

---

_本文件为项目唯一的 Agent 规范文件，任何 coding agent 执行任务前必须首先阅读。_
