# 腾讯云 Agent Runtime（Agent 沙箱）学习资料

> 仓库：`agentruntime`
> 在线访问：<https://charles-yueyue831.github.io/agentruntime/>

## 项目简介

收集、整理**腾讯云 Agent Runtime（Agent 沙箱）**相关学习资料，以手绘草图（Excalidraw 风）HTML 页面讲解核心概念，帮助开发者直观理解存储挂载（`StorageMount` / `MountOption`）、实例如何覆盖 Tool 的挂载配置、存储管控边界，以及产品视角下的元概念（需求、价值、增长、组织等）与问题性质判断方法。

## 内容结构

| 本地路径 | 内容说明 | 在线访问路径 |
| --- | --- | --- |
| `README.md` | 项目总览（本文件） | <https://charles-yueyue831.github.io/agentruntime/> |
| `storage/path override.html` | 图解「为什么 Instance 可以覆盖 Tool 的 MountPath，却不等于绕过存储管控」（MountPath 是位置，StorageSource / ReadOnly 上限 / 路径规则才是边界） | <https://charles-yueyue831.github.io/agentruntime/storage/path%20override.html> |
| `产品经理黑话.html` | 腾讯云 Agent 沙箱 · 产品经理元概念词典（从「为什么做」到「怎么证明可信」共 11 个章节 + 最终总链路 + 官方事实锚点） | <https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E9%BB%91%E8%AF%9D.html> |
| `产品能力/问题性质.html` | 问题性质判断 · 四问归类法（手绘笔记：四闸口 · 八出口，Agent 沙箱八场景演练，判定陷阱与实战要点） | <https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E8%83%BD%E5%8A%9B/%E9%97%AE%E9%A2%98%E6%80%A7%E8%B4%A8.html> |

> 在线访问路径基于 GitHub Pages 站点 `https://charles-yueyue831.github.io/agentruntime/`，与仓库目录结构一一对应；路径中的空格以 `%20`、中文以 URL 编码（UTF-8）表示。

> ⚠️ **给 Coding Agent 的说明**：任何 coding agent 在本项目执行任务前，必须先阅读根目录的 [`AGENTS.md`](AGENTS.md)（Agent 规范文件），其中包含强制执行规则与文件访问路径对照表，且会被主流 coding agent 自动加载。

## 学习主题

**技术向（Agent Runtime 存储挂载）**
- **StorageMount（Tool 级）**：定义默认存储来源（StorageSource）、默认 MountPath、默认 ReadOnly，即「允许使用什么存储、最多能有什么权限、默认挂到哪里」
- **MountOption（Instance 级）**：引用已有的 StorageMount.Name，可覆盖本地 MountPath、追加 SubPath、收紧 ReadOnly，但不能替换存储来源或放宽权限
- **管控边界**：MountPath 只是容器内「位置」；StorageSource 不可换、ReadOnly 只能收紧、路径合法性由平台统一校验

**产品向（产品思维与元概念）**
- **产品经理元概念词典**：从「为什么做 / 怎么看问题 / 怎么解决」到「怎么增长 / 怎么经营市场 / 怎么组织资源 / 怎么证明可信」的产品思维抽象层级梯子
- **问题性质判断 · 四问归类法**：四闸口 · 八出口，快速判断问题性质（需求类 / 实现类 / 认知类等），配合 Agent 沙箱八场景演练

## 参考资料

- [存储挂载（腾讯云 Agent Runtime）](https://cloud.tencent.com/document/product/1814/132215)
- [挂载文件系统 CFS](https://cloud.tencent.com/document/product/1814/129845)

## License

[Apache License 2.0](LICENSE)
