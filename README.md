# 腾讯云 Agent Runtime（Agent 沙箱）学习资料

> 仓库：`agentruntime`
> 在线访问：[在线查看](https://charles-yueyue831.github.io/agentruntime/)

## 项目简介

收集、整理**腾讯云 Agent Runtime（Agent 沙箱）**相关学习资料，以手绘草图（Excalidraw 风）HTML 页面讲解核心概念，帮助开发者直观理解存储挂载（`StorageMount` / `MountOption`）、沙箱内管理守护进程（envd）、实例如何覆盖 Tool 的挂载配置、存储管控边界，以及产品视角下的元概念（需求、价值、增长、组织等）、问题性质判断与用户旅程观察方法。

## AI 前沿每周关键词

[浏览全部六期看板](ai-news/index.html)，或直接阅读[最新一期（11 月 14 日至 20 日）](ai-news-1114-1120/dashboard.html)。各期可按日期跳转到《AI 速递》条目，查看类别对比、Agent 相关度及来源。

## GPU 沙箱用户体验

[观看体验录像与时间点导航](prototype/gpu/) · [阅读体验报告及 14 张操作截图](prototype/gpu/体验报告.md)

体验 GPU 资源购买、通过资源组名称绑定沙箱工具、设置系统盘、启动实例、暂停与释放 GPU 的完整操作流程。录像支持按时间点跳转。

## 镜像预热客户使用演示

[查看四段视频、合集与字幕](prototype/preheat/README.md)。中文配音 + 步骤字幕，涵盖预热任务、自动预热、自动卸载和预热任务监控；合集约 4 分 13 秒。

## K8s 交互学习原型

**[打开 K8s Atlas 交互学习原型](https://charles-yueyue831.github.io/agentruntime/prototype/k8s/)** · [查看完整源码](prototype/k8s/index.html)

从技术机制和产品设计两个视角学习 Kubernetes：

- **架构地图**：37 个知识节点，涵盖控制平面、节点执行、工作负载与控制器、网络、存储、安全治理及扩展；支持搜索、关联跳转与已读标记。
- **第一性原理**：围绕稳定运行、流量突增、版本发布、有状态服务、多团队共享与领域自动化，分析主要矛盾、次要矛盾、设计取舍和验收指标。
- **控制器对照**：比较 10 组控制逻辑的输入、动作、目标和责任边界。
- **场景实验**：逐步播放部署、Pod 删除、容器崩溃、节点失联、负载与容量、发布不就绪；扩容实验可调整 CPU 利用率与可调度容量。
- **理解自测**：6 道题附因果解释，支持本地保存进度；提供三种阅读外观。

原型是自包含 HTML，样式、知识内容与交互代码均在 `prototype/k8s/index.html` 中，无需安装依赖或构建。下载后可直接在浏览器打开；也可在仓库根目录运行 `python3 -m http.server 8000`，访问 `http://localhost:8000/prototype/k8s/`。

实验均为教学模拟，不连接真实集群。各知识节点附有 Kubernetes 官方资料链接；“主要 / 次要矛盾”属于产品分析框架，不是 Kubernetes 官方术语。在线参考链接需要联网。

## 内容结构

| 本地路径 | 内容说明 | 在线访问路径 |
| --- | --- | --- |
| `README.md` | 项目总览（本文件） | [在线查看](https://charles-yueyue831.github.io/agentruntime/) |
| `prototype/k8s/index.html` | K8s Atlas 交互学习原型：37 个知识节点、双视角解释、控制器对照、6 个场景实验与自测；自包含 HTML 源码 | [打开交互原型](https://charles-yueyue831.github.io/agentruntime/prototype/k8s/) |
| `Agent 沙箱/计算与执行/envd 使用指南.html` | envd · 沙箱内管理守护进程（Guest Management Agent，把 SDK / 云侧管理请求转换为 Guest Linux 中的命令、进程、文件与健康检查操作） | [在线查看](https://charles-yueyue831.github.io/agentruntime/Agent%20%E6%B2%99%E7%AE%B1/%E8%AE%A1%E7%AE%97%E4%B8%8E%E6%89%A7%E8%A1%8C/envd%20%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.html) |
| `Agent 沙箱/存储/挂载路径覆盖.html` | 图解「为什么 Instance 可以覆盖 Tool 的 MountPath，却不等于绕过存储管控」（MountPath 是位置，StorageSource / ReadOnly 上限 / 路径规则才是边界） | [在线查看](https://charles-yueyue831.github.io/agentruntime/Agent%20%E6%B2%99%E7%AE%B1/%E5%AD%98%E5%82%A8/%E6%8C%82%E8%BD%BD%E8%B7%AF%E5%BE%84%E8%A6%86%E7%9B%96.html) |
| `产品经理/产品经理黑话.html` | AI 产品经理 · 产品概念词典（67 词条：AI 产品语境、场景示例、PM 判断；11 章 + 产品判断链路 + 官方参考资料） | [在线查看](https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E9%BB%91%E8%AF%9D.html) |
| `产品经理/用户旅程图.html` | 姿势 · 流程 · 旅程图：三个观察高度（手绘笔记：三层观察台可下钻、三者对比速查、为四问归类法供证据、实操顺序与误区便签） | [在线查看](https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86/%E7%94%A8%E6%88%B7%E6%97%85%E7%A8%8B%E5%9B%BE.html) |
| `产品能力/问题性质.html` | 问题性质判断 · 四问归类法（手绘笔记：四闸口 · 八出口，Agent 沙箱八场景演练，判定陷阱与实战要点） | [在线查看](https://charles-yueyue831.github.io/agentruntime/%E4%BA%A7%E5%93%81%E8%83%BD%E5%8A%9B/%E9%97%AE%E9%A2%98%E6%80%A7%E8%B4%A8.html) |
| `prototype/gpu/` | GPU 沙箱用户体验录像、时间点导航、体验报告及 14 张操作截图 | [观看体验录像](prototype/gpu/) |
| `prototype/preheat/` | 镜像预热客户使用演示：五个 MP4、配套 SRT 字幕与播放说明 | [查看视频](prototype/preheat/README.md) |
| `prototype/snapshot/` | 模板快照交互原型、React / Tea 源码及产品能力视频演示（约 2 分 20 秒，中文 AI 配音 + 动态字幕，无背景配乐） | [观看视频演示](https://charles-yueyue831.github.io/agentruntime/prototype/snapshot/demo.mp4) · [打开原型](prototype/snapshot/?tab=template) · [视频与字幕说明](prototype/snapshot/README.md) |

> 在线访问路径基于 GitHub Pages 站点 `https://charles-yueyue831.github.io/agentruntime/`，与仓库目录结构一一对应；路径中的空格以 `%20`、中文以 URL 编码（UTF-8）表示。

> ⚠️ **给 Coding Agent 的说明**：任何 coding agent 在本项目执行任务前，必须先阅读根目录的 [`AGENTS.md`](AGENTS.md)（Agent 规范文件），其中包含强制执行规则与文件访问路径对照表，且会被主流 coding agent 自动加载。各 HTML 文档之间已通过导航条互链，并均可返回本页（README 渲染页）。

## 学习主题

**技术向（Agent Runtime 沙箱）**
- **envd（沙箱内管理守护进程）**：Guest Management Agent，把 SDK / 云侧管理请求转换为 Guest Linux 中真实的命令、进程、文件与健康检查操作；管理端口 49983 与业务端口（8080 / 3000 / …）相分离
- **StorageMount（Tool 级）**：定义默认存储来源（StorageSource）、默认 MountPath、默认 ReadOnly，即「允许使用什么存储、最多能有什么权限、默认挂到哪里」
- **MountOption（Instance 级）**：引用已有的 StorageMount.Name，可覆盖本地 MountPath、追加 SubPath、收紧 ReadOnly，但不能替换存储来源或放宽权限
- **管控边界**：MountPath 只是容器内「位置」；StorageSource 不可换、ReadOnly 只能收紧、路径合法性由平台统一校验

**产品向（产品思维与元概念）**
- **AI 产品经理概念词典**：67 个常用词按「AI 产品语境 / 场景示例 / PM 判断」解释，覆盖用户任务、模型与产品能力边界、验收、成本、人工介入、增长与经营
- **用户旅程观察**：使用姿势 · 使用流程 · 用户旅程图三个观察高度，可下钻的「三层观察台」，为问题定性提供证据
- **问题性质判断 · 四问归类法**：四闸口 · 八出口，快速判断问题性质（需求类 / 实现类 / 认知类等），配合 Agent 沙箱八场景演练

## 参考资料

- [存储挂载（腾讯云 Agent Runtime）](https://cloud.tencent.com/document/product/1814/132215)
- [挂载文件系统 CFS](https://cloud.tencent.com/document/product/1814/129845)

## License

[Apache License 2.0](LICENSE)
