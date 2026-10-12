/**
 * 模板快照产品化一期 · 数据模型
 * 字段与状态机对齐《模板快照产品化一期需求 PRD》：
 *  - 2.6 状态管理：Build = Pending/Building/Success/Failed/Cancelled；Snapshot = Ready/Deleting/Deleted
 *  - 2.10 制作进度：两级 Stage（PreChecking / BuildingSnapshot / PostChecking）
 *  - 2.12 功能详情：CreateTemplateSnapshotBuild / DescribeTemplateSnapshotBuildList / CancelTemplateSnapshotBuild
 *                   DescribeTemplateSnapshotList / UpdateTemplateSnapshot / DeleteTemplateSnapshot
 */

export type BuildStatus = 'Pending' | 'Building' | 'Success' | 'Failed' | 'Cancelled';
export type SnapshotStatus = 'Ready' | 'Deleting' | 'Deleted';

/** PRD 2.6 · 模板快照制作任务的状态 */
export const buildStatusMeta: Record<BuildStatus, { name: string; desc: string; produce: string }> = {
  Pending: { name: '等待制作', desc: '已成功接收模板快照的制作请求，制作任务已创建，等待制作中', produce: '否' },
  Building: { name: '制作中', desc: '正在根据沙箱模板的配置执行模板快照的制作和校验流程', produce: '否' },
  Success: { name: '制作成功', desc: '本次制作任务已成功完成，并生成对应的模板快照', produce: '是' },
  Failed: { name: '制作失败', desc: '制作或校验过程中任一步骤失败或超时，未生成可用的模板快照；通过 ErrorCode 和 ErrorMessage 查看失败原因', produce: '否' },
  Cancelled: { name: '制作已取消', desc: '制作任务在完成前被用户主动取消，没有产生可用的模板快照', produce: '否' },
};

/** PRD 2.6 · 模板快照的状态 */
export const snapshotStatusMeta: Record<SnapshotStatus, { name: string; desc: string; usable: string }> = {
  Ready: { name: '模板快照已就绪', desc: '模板快照已就绪，可以被用于加速启动沙箱实例', usable: '是' },
  Deleting: { name: '删除中', desc: '已提交删除请求，正在清理模板快照', usable: '否' },
  Deleted: { name: '模板快照已删除', desc: '模板快照已完成删除，不再支持使用该模板快照加速启动新的沙箱实例', usable: '否' },
};

export const statusNames: Record<string, string> = {
  Pending: '等待制作', Building: '制作中', Success: '制作成功', Failed: '制作失败', Cancelled: '制作已取消',
  Ready: '模板快照已就绪', Deleting: '删除中', Deleted: '模板快照已删除',
};

export type StageKey =
  | 'PreChecking' | 'ImageChecking' | 'SandboxStarting' | 'PreReadyChecking'
  | 'BuildingSnapshot'
  | 'PostChecking' | 'SnapshotStarting' | 'PostReadyChecking';

export interface StageMeta { key: StageKey; name: string; detail: string }

/** PRD 2.10 · 阶段树：父阶段 → 子阶段；BuildingSnapshot 无子阶段 */
export const stagePhases: { parent: StageMeta; children: StageMeta[] }[] = [
  {
    parent: { key: 'PreChecking', name: '前置校验', detail: '校验制作输入和临时沙箱的可运行状态' },
    children: [
      { key: 'ImageChecking', name: '镜像校验', detail: '镜像是否存在、是否可拉取，层数、大小、架构等是否符合要求' },
      { key: 'SandboxStarting', name: '冷启动校验', detail: '根据模板快照的制作配置启动临时的沙箱实例' },
      { key: 'PreReadyChecking', name: '前置就绪检查', detail: '判断临时的沙箱实例是否达到可运行状态' },
    ],
  },
  {
    parent: { key: 'BuildingSnapshot', name: '制作模板快照', detail: '制作模板快照' },
    children: [],
  },
  {
    parent: { key: 'PostChecking', name: '后置校验', detail: '验证本次模板快照是否能够正常启动沙箱实例' },
    children: [
      { key: 'SnapshotStarting', name: '快照启动校验', detail: '使用本次制作的模板快照启动临时的沙箱实例' },
      { key: 'PostReadyChecking', name: '后置就绪检查', detail: '验证通过模板快照启动的沙箱实例是否达到可运行状态' },
    ],
  },
];

/** 制作进度按叶子阶段线性推进：0..5，6 表示全部完成 */
export const stageSteps: StageMeta[] = stagePhases.flatMap(p => (p.children.length ? p.children : [p.parent]));

export const stageMetaMap: Record<string, StageMeta> = Object.fromEntries(
  [...stagePhases.map(p => p.parent), ...stagePhases.flatMap(p => p.children)].map(s => [s.key, s]),
);

/** 叶子阶段 → 所属父阶段 */
export const stageParentOf: Record<string, StageKey> = Object.fromEntries(
  stagePhases.flatMap(p => (p.children.length ? p.children.map(c => [c.key, p.parent.key] as const) : [[p.parent.key, p.parent.key] as const])),
);

export const stageOf = (index: number): StageKey | '' => stageSteps[index]?.key ?? '';

/** PRD 2.9 · Ready Check 的四项判据 */
export const readyCheckItems = [
  { title: 'Health Probe', desc: '主容器启动后执行模板快照制作配置的健康探针，并判断健康探针是否通过' },
  { title: 'Sidecar Ready', desc: '参与启动的 Sidecar 全部 Ready' },
];

/** PRD 2.9 · 镜像可用性校验的四项检查 */
export const imageCheckItems = [
  { title: '镜像访问检查', desc: '访问镜像仓库，确保用于制作模板快照的镜像存在于镜像仓库中' },
  { title: '镜像层数检查', desc: '检查 OCI Manifest 中镜像的层数是否超过层数限制' },
  { title: '镜像大小检查', desc: '检查 OCI Manifest 中镜像的大小是否超过大小限制' },
  { title: '镜像架构检查', desc: '检查 OCI Manifest 中镜像的架构是否为 AMD64 而不是 ARM64' },
];

export type ErrorKind = 'PreCheck' | 'Build' | 'PostCheck';
export const errorKindNames: Record<ErrorKind, string> = { PreCheck: '前置校验错误', Build: '制作错误', PostCheck: '后置校验错误' };

/** PRD 2.10 · 错误码类型：前置校验错误 / 制作错误 / 后置校验错误 */
export const errorCatalog: { code: string; kind: ErrorKind; stage: StageKey; message: string }[] = [
  { code: 'ResourceNotFound.Image', kind: 'PreCheck', stage: 'ImageChecking', message: '镜像在镜像仓库中不存在或无法拉取，请检查镜像地址与仓库访问凭证。' },
  { code: 'LimitExceeded.ImageLayer', kind: 'PreCheck', stage: 'ImageChecking', message: 'OCI Manifest 中镜像层数超过模板快照制作的层数限制。' },
  { code: 'LimitExceeded.ImageSize', kind: 'PreCheck', stage: 'ImageChecking', message: 'OCI Manifest 中镜像大小超过模板快照制作的大小限制。' },
  { code: 'UnsupportedOperation.ImageArch', kind: 'PreCheck', stage: 'ImageChecking', message: '镜像架构为 ARM64，模板快照制作要求镜像架构为 AMD64。' },
  { code: 'FailedOperation.SandboxStart', kind: 'PreCheck', stage: 'SandboxStarting', message: '按沙箱模板当前配置冷启动临时沙箱实例失败，请检查启动命令、环境变量与资源规格。' },
  { code: 'FailedOperation.PreReadyCheckTimeout', kind: 'PreCheck', stage: 'PreReadyChecking', message: '冷启动的临时沙箱实例未在规定时间内通过前置 Ready Check（Health Probe / Sidecar Ready / Instance RUNNING / 数据面 Ping）。' },
  { code: 'FailedOperation.SnapshotBuild', kind: 'Build', stage: 'BuildingSnapshot', message: '模板快照制作失败，可重新发起制作任务；连续失败请提交工单。' },
  { code: 'FailedOperation.SnapshotBuildTimeout', kind: 'Build', stage: 'BuildingSnapshot', message: '模板快照制作阶段超过规定的最大执行时间。' },
  { code: 'FailedOperation.SnapshotStart', kind: 'PostCheck', stage: 'SnapshotStarting', message: '使用本次制作的模板快照启动临时沙箱实例失败，该模板快照不会被标记为可用。' },
  { code: 'FailedOperation.PostReadyCheckTimeout', kind: 'PostCheck', stage: 'PostReadyChecking', message: '通过模板快照启动的临时沙箱实例未通过后置 Ready Check。' },
];

export type EventLevel = 'Normal' | 'Warning';
export interface EventMeta { type: string; name: string; level: EventLevel; stage?: StageKey; trigger: string }

/** PRD 2.10 · 任务级事件 */
export const taskEventMeta: EventMeta[] = [
  { type: 'TEMPLATE_SNAPSHOT_BUILD_CREATED', name: '制作任务已创建', level: 'Normal', trigger: '模板快照制作任务创建成功' },
  { type: 'TEMPLATE_SNAPSHOT_BUILD_STARTED', name: '制作任务已开始', level: 'Normal', trigger: '制作任务从 Pending 进入 Building' },
  { type: 'TEMPLATE_SNAPSHOT_BUILD_RETRYING', name: '制作任务正在重试', level: 'Warning', trigger: '制作过程中的某个阶段发生自动重试' },
  { type: 'TEMPLATE_SNAPSHOT_BUILD_SUCCEEDED', name: '制作任务成功', level: 'Normal', trigger: '前置校验、模板快照制作和后置校验全部成功，制作任务进入 Success' },
  { type: 'TEMPLATE_SNAPSHOT_BUILD_FAILED', name: '制作任务失败', level: 'Warning', trigger: '制作过程的任一阶段最终失败，制作任务进入 Failed' },
  { type: 'TEMPLATE_SNAPSHOT_BUILD_TIMEOUT', name: '制作任务超时', level: 'Warning', trigger: '制作过程的任一阶段超过规定的最大执行时间' },
  { type: 'TEMPLATE_SNAPSHOT_BUILD_CANCELLED', name: '制作任务已取消', level: 'Normal', trigger: '制作任务在完成前被用户取消' },
];

const stageEventBase: Record<StageKey, { slug: string; label: string; started: string; succeeded: string; failed: string }> = {
  PreChecking: { slug: 'PRE_CHECK', label: '前置校验', started: '模板快照制作任务开始执行前置校验', succeeded: '镜像校验、冷启动校验和前置就绪检查全部通过', failed: '镜像校验、冷启动校验和前置就绪检查未全部通过' },
  ImageChecking: { slug: 'IMAGE_CHECK', label: '镜像校验', started: '开始检查镜像是否满足模板快照的制作要求', succeeded: '镜像存在、可拉取，且层数、大小、架构等校验通过', failed: '镜像不存在、不可拉取，或层数、大小、架构等校验未通过' },
  SandboxStarting: { slug: 'SANDBOX_START', label: '冷启动校验', started: '开始按照沙箱模板的配置启动临时的沙箱实例', succeeded: '临时的沙箱实例创建并启动成功', failed: '临时的沙箱实例创建或启动失败' },
  PreReadyChecking: { slug: 'PRE_READY_CHECK', label: '前置就绪检查', started: '开始检查冷启动的沙箱实例是否达到可运行状态', succeeded: '临时的沙箱实例通过前置 Ready Check', failed: '临时的沙箱实例未通过前置 Ready Check' },
  BuildingSnapshot: { slug: 'BUILDING', label: '模板快照制作', started: '开始制作模板快照', succeeded: '模板快照制作完成', failed: '模板快照制作失败' },
  PostChecking: { slug: 'POST_CHECK', label: '后置校验', started: '开始验证本次制作的模板快照是否可正常使用', succeeded: '快照启动校验和后置就绪检查全部通过', failed: '快照启动校验和后置就绪检查未全部通过' },
  SnapshotStarting: { slug: 'SNAPSHOT_START', label: '快照启动校验', started: '开始使用本次制作的模板快照启动临时的沙箱实例', succeeded: '使用模板快照成功启动临时的沙箱实例', failed: '使用模板快照启动临时的沙箱实例失败' },
  PostReadyChecking: { slug: 'POST_READY_CHECK', label: '后置就绪检查', started: '开始检查通过模板快照启动的沙箱实例是否达到可运行状态', succeeded: '沙箱实例通过后置 Ready Check', failed: '沙箱实例未通过后置 Ready Check' },
};

/** PRD 2.10 · 阶段级事件：每个 Stage 对应 STARTED / SUCCEEDED / FAILED */
export const stageEventMeta: EventMeta[] = (Object.keys(stageEventBase) as StageKey[]).flatMap(key => {
  const b = stageEventBase[key];
  return [
    { type: 'TEMPLATE_SNAPSHOT_' + b.slug + '_STARTED', name: b.label + '开始', level: 'Normal' as EventLevel, stage: key, trigger: b.started },
    { type: 'TEMPLATE_SNAPSHOT_' + b.slug + '_SUCCEEDED', name: b.label + '完成', level: 'Normal' as EventLevel, stage: key, trigger: b.succeeded },
    { type: 'TEMPLATE_SNAPSHOT_' + b.slug + '_FAILED', name: b.label + '失败', level: 'Warning' as EventLevel, stage: key, trigger: b.failed },
  ];
});

export const stageEvent = (stage: StageKey, kind: 'STARTED' | 'SUCCEEDED' | 'FAILED'): EventMeta =>
  stageEventMeta.find(e => e.stage === stage && e.type.endsWith('_' + kind))!;

/** PRD 2.10 · 模板快照事件 */
export const snapshotEventMeta: EventMeta[] = [
  { type: 'TEMPLATE_SNAPSHOT_READY', name: '模板快照已就绪', level: 'Normal', trigger: '制作任务状态为 Success，生成可用的模板快照' },
  { type: 'TEMPLATE_SNAPSHOT_ACTIVE_DELETE_STARTED', name: '开始主动删除', level: 'Normal', trigger: '主动提交模板快照的删除请求' },
  { type: 'TEMPLATE_SNAPSHOT_AUTO_DELETE_STARTED', name: '开始自动删除', level: 'Normal', trigger: '自动提交模板快照的删除请求' },
  { type: 'TEMPLATE_SNAPSHOT_DELETED', name: '模板快照已删除', level: 'Normal', trigger: '对应模板快照完成删除' },
];

/** PRD 2.10 · 事件告警场景（CLS 持久化 + 告警策略） */
export const alarmScenes: { scene: string; type: string; when: string }[] = [
  { scene: '模板快照制作持续重试', type: 'TEMPLATE_SNAPSHOT_BUILD_RETRYING', when: '制作过程中发生自动重试，且重试次数达到配置阈值时通知' },
  { scene: '模板快照制作失败', type: 'TEMPLATE_SNAPSHOT_BUILD_FAILED', when: '制作任务最终进入 Failed 状态时通知' },
  { scene: '模板快照制作超时', type: 'TEMPLATE_SNAPSHOT_BUILD_TIMEOUT', when: '制作过程中任一阶段超过规定的最大执行时间时通知' },
  { scene: '前置校验失败', type: 'TEMPLATE_SNAPSHOT_PRE_CHECK_FAILED', when: '前置校验未全部通过，导致制作流程无法继续时通知' },
  { scene: '镜像校验失败', type: 'TEMPLATE_SNAPSHOT_IMAGE_CHECK_FAILED', when: '源镜像不存在、无法拉取，或镜像层数、大小、架构等不满足制作要求时通知' },
  { scene: '冷启动校验失败', type: 'TEMPLATE_SNAPSHOT_SANDBOX_START_FAILED', when: '按照沙箱模板当前配置启动临时沙箱实例失败时通知' },
  { scene: '前置就绪检查失败', type: 'TEMPLATE_SNAPSHOT_PRE_READY_CHECK_FAILED', when: '冷启动的临时沙箱实例未通过前置 Ready Check 时通知' },
  { scene: '模板快照制作阶段失败', type: 'TEMPLATE_SNAPSHOT_BUILDING_FAILED', when: '在制作过程中不同阶段发生失败时通知' },
  { scene: '后置校验失败', type: 'TEMPLATE_SNAPSHOT_POST_CHECK_FAILED', when: '已完成模板快照制作，但启动校验或后置就绪检查未全部通过时通知' },
  { scene: '模板快照启动校验失败', type: 'TEMPLATE_SNAPSHOT_SNAPSHOT_START_FAILED', when: '使用新制作的模板快照启动临时沙箱实例失败时通知' },
  { scene: '后置就绪检查失败', type: 'TEMPLATE_SNAPSHOT_POST_READY_CHECK_FAILED', when: '通过模板快照启动的临时沙箱实例未通过后置 Ready Check 时通知' },
];

export interface Build {
  /** TemplateSnapshotBuildID */
  id: string;
  tool: string;
  /** SandboxToolID */
  toolId: string;
  /** 沙箱模板版本 ToolTag，默认 default */
  toolTag: string;
  /** 镜像地址（不含版本与 Digest），如 tcr.tencentcloudcr.com/ags/python-agent */
  imageRepo: string;
  /** 镜像版本（Tag），如 20260921 */
  imageTag: string;
  /** 镜像 Digest，由镜像仓库在 Manifest 中给出 */
  imageDigest: string;
  /** 复用依据 ConfigHash */
  hash: string;
  status: BuildStatus;
  /** 当前叶子阶段下标 0..5；Success 时为 6 */
  stage: number;
  /** 自动重试次数 */
  retry: number;
  time: string;
  duration: string;
  startedAt?: string;
  finishedAt?: string;
  /** Status = Success 时对应的 TemplateSnapshotID */
  snapshot?: string;
  errorCode?: string;
  errorMessage?: string;
  snapshotName?: string;
  /** 本次制作可覆盖的配置与模板快照版本名称 */
  versionNames?: string[];
  versionName?: string;
  config?: Record<string, string>;
  configOverrides?: Record<string, string>;
  autoDelete?: boolean;
  idleTTL?: string;
}

export interface Snapshot {
  name?: string;
  replacedBy?: string;
  /** TemplateSnapshotID */
  id: string;
  tool: string;
  toolId: string;
  toolTag: string;
  /** 来源 TemplateSnapshotBuildID */
  build: string;
  hash: string;
  /** 成功制作的时间 CreateTime */
  time: string;
  /** 制作请求创建时间 */
  requestTime?: string;
  /** 最近一次使用时间 LastUseTime */
  lastUseTime: string;
  status: SnapshotStatus | BuildStatus;
  /** 加速启动沙箱实例的累计次数 */
  uses: number;
  /** UpdateTemplateSnapshot · EnableAutoDelete */
  autoDelete: boolean;
  /** UpdateTemplateSnapshot · IdleTTL 闲置时长阈值 */
  idleTTL: string;
  versionNames?: string[];
  versionName?: string;
  config?: Record<string, string>;
  configOverrides?: Record<string, string>;
}

/** PRD 2.7 · 版本管理落在沙箱模板的 ToolTag 上，模板快照本身不含版本 */
export interface ToolVersion {
  id: string;
  tool: string;
  toolId: string;
  /** ToolTag，默认值为 default */
  toolTag: string;
  /** 镜像地址（不含版本与 Digest） */
  imageRepo: string;
  /** 镜像版本（Tag） */
  imageTag: string;
  /** 镜像 Digest */
  imageDigest: string;
  hash: string;
  /** 该版本当前可用的模板快照 */
  snapshot?: string;
  /** 最近一次制作任务 */
  lastBuild?: string;
  updated: string;
  /** 制作限制：挂载 Image Volume 的沙箱模板只能冷启动，不能制作模板快照 */
  imageVolume?: boolean;
  /** 使用限制：沙箱实例覆盖继承的关键配置时不会命中模板快照 */
  overridden?: boolean;
}

export const IDLE_TTL_OPTIONS = [
  { value: '24h', text: '闲置 24 小时' },
  { value: '72h', text: '闲置 3 天' },
  { value: '168h', text: '闲置 7 天' },
  { value: '336h', text: '闲置 14 天' },
];

export const idleTTLText = (v: string) => IDLE_TTL_OPTIONS.find(o => o.value === v)?.text ?? (/^\d+(\.\d+)?h$/.test(v) ? `${parseFloat(v) / 24} 天` : v);

export interface ImageRefLike { imageRepo: string; imageTag: string; imageDigest: string }

/** 镜像完整引用 = 镜像地址:镜像版本 */
export const imageRef = (v: ImageRefLike) => (v.imageRepo ? v.imageRepo + (v.imageTag ? ':' + v.imageTag : '') : '—');

/** 镜像 Digest 的列表短展示（完整值放在 title 与复制内容里） */
export const shortDigest = (d: string) => (d && d.length > 22 ? d.slice(0, 22) + '…' : d || '—');
