import { Build, Snapshot, ToolVersion } from './types';

/**
 * 由「镜像地址:镜像版本」推导稳定的演示 Digest。
 * 真实环境中 Digest 由镜像仓库在 OCI Manifest 中返回，控制台只做展示与复制。
 */
export function digestOf(repo: string, tag: string): string {
  const seed = repo + ':' + tag;
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i) * (i + 7), 2246822519) >>> 0;
  }
  let out = '', a = h1, b = h2;
  while (out.length < 64) {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    b = (Math.imul(b, 22695477) + 1) >>> 0;
    out += a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
  }
  return 'sha256:' + out.slice(0, 64);
}

export const builds: Build[] = [
  { id: 'tsb-a8f20c', tool: 'python-agent', toolId: 'sdt-7a8b9c', toolTag: 'default', imageRepo: 'tcr.tencentcloudcr.com/ags/python-agent', imageTag: '20260921', imageDigest: 'sha256:911e287860c8cf3492ced17744fcbdc58d04006ac6674fca082734c164b710d3', hash: 'c8d72f0a', status: 'Building', stage: 3, retry: 0, time: '2026-09-21 10:42:08', duration: '2 分 18 秒' },
  { id: 'tsb-91f3e7', tool: 'code-interpreter', toolId: 'sdt-3f1e88', toolTag: 'canary', imageRepo: 'tcr.tencentcloudcr.com/ags/code-interpreter', imageTag: '2.2.0', imageDigest: 'sha256:03c4d76eca366ce4e501b7f59e9a033583bde8d0187ecffa5426a5efcd833ac3', hash: '4b71ee02', status: 'Pending', stage: 0, retry: 0, time: '2026-09-21 10:39:55', duration: '—' },
  { id: 'tsb-7e91bd', tool: 'browser-agent', toolId: 'sdt-2c5d41', toolTag: 'v1.6.0', imageRepo: 'ccr.ccs.tencentyun.com/agent/browser-agent', imageTag: '1.6.0', imageDigest: 'sha256:a771a8fd65213cd1873e563842e345465c6ba437b8c4ab7fdab3342af69e334c', hash: 'a39e108b', status: 'Failed', stage: 2, retry: 2, time: '2026-09-21 10:30:12', duration: '5 分 02 秒', errorCode: 'FailedOperation.PreReadyCheckTimeout', errorMessage: '冷启动的临时沙箱实例未在 300 秒内通过前置 Ready Check：/health 未返回 200，请检查启动命令与健康探针配置。' },
  { id: 'tsb-6b02fa', tool: 'research-agent', toolId: 'sdt-9d4a77', toolTag: 'v1.1.0', imageRepo: 'ghcr.io/acme/research-agent', imageTag: '1.1.0', imageDigest: 'sha256:ae1d0c87d3022d90e015603aedf54ed18785f2518846ff4626b1877cdd162d7f', hash: '31c7de55', status: 'Failed', stage: 4, retry: 1, time: '2026-09-21 09:58:41', duration: '6 分 47 秒', errorCode: 'FailedOperation.SnapshotStart', errorMessage: '使用本次制作的模板快照启动临时沙箱实例失败，该模板快照不会被标记为可用。' },
  { id: 'tsb-65d0a1', tool: 'python-agent', toolId: 'sdt-7a8b9c', toolTag: 'default', imageRepo: 'tcr.tencentcloudcr.com/ags/python-agent', imageTag: '20260920', imageDigest: 'sha256:5c228201ea6564d25c14f36caf89db7b080857dbfca7ea788c3fab7e5e641ad9', hash: 'b2d63a91', status: 'Success', stage: 6, retry: 0, time: '2026-09-20 18:36:20', duration: '3 分 42 秒', snapshot: 'ts-93c7ab' },
  { id: 'tsb-42ac09', tool: 'code-interpreter', toolId: 'sdt-3f1e88', toolTag: 'default', imageRepo: 'tcr.tencentcloudcr.com/ags/code-interpreter', imageTag: '2.1.0', imageDigest: 'sha256:b73c853138b7a675a95c3cdcacdf1c3a87d9b28beb2e84034f33666e48e83ea0', hash: '9e15bc72', status: 'Success', stage: 6, retry: 0, time: '2026-09-20 16:12:03', duration: '4 分 16 秒', snapshot: 'ts-82e6fd' },
  { id: 'tsb-310fdd', tool: 'python-agent', toolId: 'sdt-7a8b9c', toolTag: 'v1.2.0', imageRepo: 'tcr.tencentcloudcr.com/ags/python-agent', imageTag: '20260918', imageDigest: 'sha256:74930fd445c24e194be9392332cfc92e9875cc26bc7caa87d977754d7c3a6ff4', hash: 'b2d63a91', status: 'Success', stage: 6, retry: 1, time: '2026-09-18 09:24:17', duration: '3 分 28 秒', snapshot: 'ts-61a4ce' },
  { id: 'tsb-29ac80', tool: 'browser-agent', toolId: 'sdt-2c5d41', toolTag: 'default', imageRepo: 'ccr.ccs.tencentyun.com/agent/browser-agent', imageTag: '1.5.0', imageDigest: 'sha256:b73a127a58cb7ef57ba87f91f9f1eeba1bfa33bc1d371883661c7bebf6edfd20', hash: 'fa763d19', status: 'Success', stage: 6, retry: 0, time: '2026-09-18 08:16:52', duration: '4 分 08 秒', snapshot: 'ts-50b32d' },
  { id: 'tsb-18a4ee', tool: 'research-agent', toolId: 'sdt-9d4a77', toolTag: 'default', imageRepo: 'ghcr.io/acme/research-agent', imageTag: '1.0.0', imageDigest: 'sha256:46211c829413f051c62b31f988d36ec663dab304772242ffed41a293a72790cc', hash: '7cc09a18', status: 'Success', stage: 6, retry: 0, time: '2026-09-17 14:20:06', duration: '2 分 54 秒', snapshot: 'ts-49e02a' },
  { id: 'tsb-091acd', tool: 'research-agent', toolId: 'sdt-9d4a77', toolTag: 'v0.9.0', imageRepo: 'ghcr.io/acme/research-agent', imageTag: '0.9.0', imageDigest: 'sha256:1955ecce2d7bd89fe2440dd5ed8a4aec31338530936d6add44cdd6cf4ae875c2', hash: '8eaef011', status: 'Cancelled', stage: 1, retry: 0, time: '2026-09-17 11:02:10', duration: '32 秒' },
];

/** Add stage examples once; keep existing user-created tasks and their updates. */
export function prepareBuildDemo(rows: Build[]): Build[] {
  if (!rows.some(row=>row.id===overrideExampleBuild.id)) rows=[overrideExampleBuild,...rows];
  const examples: Build[] = Array.from({length: 6}, (_, stage) => ({
    ...builds[stage % 4], id: 'tsb-demo' + stage.toString().padStart(2, '0'),
    status: 'Building', stage, retry: 0, snapshot: undefined,
    errorCode: undefined, errorMessage: undefined, duration: '—',
  }));
  const missing = examples.filter(item => !rows.some(row => row.id === item.id));
  if (!missing.length) return rows;
  const next = [...rows, ...missing];
  for (const status of ['Pending', 'Building', 'Success', 'Failed', 'Cancelled']) {
    if (!next.some(row => row.status === status)) {
      const sample = builds.find(row => row.status === status);
      if (sample) next.push({...sample, id: 'tsb-demo-' + status.toLowerCase()});
    }
  }
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const lastUse: Record<string, string> = {
  'ts-93c7ab': '2026-09-21 10:38:52',
  'ts-82e6fd': '2026-09-21 09:12:07',
  'ts-61a4ce': '2026-09-19 22:41:33',
  'ts-50b32d': '2026-09-21 08:05:19',
  'ts-49e02a': '2026-09-08 17:26:44',
};
const useCount: Record<string, number> = { 'ts-93c7ab': 1286, 'ts-82e6fd': 842, 'ts-61a4ce': 308, 'ts-50b32d': 496, 'ts-49e02a': 75 };
const autoDel: Record<string, [boolean, string]> = {
  'ts-93c7ab': [false, '168h'],
  'ts-82e6fd': [false, '168h'],
  'ts-61a4ce': [false, '72h'],
  'ts-50b32d': [false, '168h'],
  'ts-49e02a': [false, '336h'],
};

export const snapshots: Snapshot[] = builds
  .filter(b => b.snapshot)
  .map(b => ({
    id: b.snapshot!,
    tool: b.tool,
    toolId: b.toolId,
    toolTag: b.toolTag,
    build: b.id,
    hash: b.hash,
    time: b.time,
    lastUseTime: lastUse[b.snapshot!] ?? b.time,
    status: 'Ready' as const,
    uses: useCount[b.snapshot!] ?? 0,
    autoDelete: autoDel[b.snapshot!]?.[0] ?? true,
    idleTTL: autoDel[b.snapshot!]?.[1] ?? '168h',
  }));

/** 沙箱模板版本（ToolTag）→ 模板快照 映射，PRD 2.7 */
export const toolVersions: ToolVersion[] = [
  { id: 'tv-1', tool: 'python-agent', toolId: 'sdt-7a8b9c', toolTag: 'default', imageRepo: 'tcr.tencentcloudcr.com/ags/python-agent', imageTag: '20260920', imageDigest: 'sha256:5c228201ea6564d25c14f36caf89db7b080857dbfca7ea788c3fab7e5e641ad9', hash: 'b2d63a91', snapshot: 'ts-93c7ab', lastBuild: 'tsb-65d0a1', updated: '2026-09-20 18:36:20' },
  { id: 'tv-2', tool: 'python-agent', toolId: 'sdt-7a8b9c', toolTag: 'v1.2.0', imageRepo: 'tcr.tencentcloudcr.com/ags/python-agent', imageTag: '20260918', imageDigest: 'sha256:74930fd445c24e194be9392332cfc92e9875cc26bc7caa87d977754d7c3a6ff4', hash: 'b2d63a91', snapshot: 'ts-61a4ce', lastBuild: 'tsb-310fdd', updated: '2026-09-18 09:24:17' },
  { id: 'tv-3', tool: 'code-interpreter', toolId: 'sdt-3f1e88', toolTag: 'default', imageRepo: 'tcr.tencentcloudcr.com/ags/code-interpreter', imageTag: '2.1.0', imageDigest: 'sha256:b73c853138b7a675a95c3cdcacdf1c3a87d9b28beb2e84034f33666e48e83ea0', hash: '9e15bc72', snapshot: 'ts-82e6fd', lastBuild: 'tsb-42ac09', updated: '2026-09-20 16:12:03' },
  { id: 'tv-4', tool: 'code-interpreter', toolId: 'sdt-3f1e88', toolTag: 'canary', imageRepo: 'tcr.tencentcloudcr.com/ags/code-interpreter', imageTag: '2.2.0', imageDigest: 'sha256:03c4d76eca366ce4e501b7f59e9a033583bde8d0187ecffa5426a5efcd833ac3', hash: '4b71ee02', lastBuild: 'tsb-91f3e7', updated: '2026-09-21 10:39:55' },
  { id: 'tv-5', tool: 'browser-agent', toolId: 'sdt-2c5d41', toolTag: 'default', imageRepo: 'ccr.ccs.tencentyun.com/agent/browser-agent', imageTag: '1.5.0', imageDigest: 'sha256:b73a127a58cb7ef57ba87f91f9f1eeba1bfa33bc1d371883661c7bebf6edfd20', hash: 'fa763d19', snapshot: 'ts-50b32d', lastBuild: 'tsb-29ac80', updated: '2026-09-18 08:16:52' },
  { id: 'tv-6', tool: 'browser-agent', toolId: 'sdt-2c5d41', toolTag: 'v1.6.0', imageRepo: 'ccr.ccs.tencentyun.com/agent/browser-agent', imageTag: '1.6.0', imageDigest: 'sha256:a771a8fd65213cd1873e563842e345465c6ba437b8c4ab7fdab3342af69e334c', hash: 'a39e108b', lastBuild: 'tsb-7e91bd', updated: '2026-09-21 10:30:12' },
  { id: 'tv-7', tool: 'research-agent', toolId: 'sdt-9d4a77', toolTag: 'default', imageRepo: 'ghcr.io/acme/research-agent', imageTag: '1.0.0', imageDigest: 'sha256:46211c829413f051c62b31f988d36ec663dab304772242ffed41a293a72790cc', hash: '7cc09a18', snapshot: 'ts-49e02a', lastBuild: 'tsb-18a4ee', updated: '2026-09-17 14:20:06', overridden: true },
  { id: 'tv-8', tool: 'research-agent', toolId: 'sdt-9d4a77', toolTag: 'v1.1.0', imageRepo: 'ghcr.io/acme/research-agent', imageTag: '1.1.0', imageDigest: 'sha256:ae1d0c87d3022d90e015603aedf54ed18785f2518846ff4626b1877cdd162d7f', hash: '31c7de55', lastBuild: 'tsb-6b02fa', updated: '2026-09-21 09:58:41' },
  { id: 'tv-9', tool: 'dataset-loader', toolId: 'sdt-5e7b22', toolTag: 'default', imageRepo: 'ccr.ccs.tencentyun.com/agent/dataset-loader', imageTag: '0.4.2', imageDigest: 'sha256:cc055076340d07b492490d5d28537045138caf1882bd444a61af67970801af53', hash: 'd0417ab6', updated: '2026-09-16 11:02:35', imageVolume: true },
];

/** PRD 2.10 监控 · 演示用采样序列（近 24 小时，每 2 小时一个采样点） */
export const metricSeries = {
  hours: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
  /** 创建量趋势 */
  created: [3, 2, 1, 4, 9, 18, 14, 11, 16, 12, 7, 5],
  /** 制作并发数趋势 */
  concurrent: [1, 1, 0, 2, 5, 8, 6, 5, 7, 6, 3, 2],
};

export const metricTotals = {
  createRequests: 102,
  pending: 1,
  building: 1,
  success: 86,
  failed: 9,
  cancelled: 4,
  timeout: 2,
};

/** Seed all snapshot states once, retaining subsequent edits and user-created snapshots. */
export function prepareSnapshotDemo(rows: Snapshot[]): Snapshot[] {
  rows = rows.map(row => row.status === 'Deleting' ? { ...row, status: 'Deleted' as const } : row);
  if (!rows.some(row=>row.id===overrideExampleSnapshot.id)) rows=[overrideExampleSnapshot,...rows];
  if (rows.some(row => 'demoStatusAssigned' in row)) return rows;
  const states: Snapshot['status'][] = ['Ready', 'Deleted'];
  const candidates = rows.filter(row => snapshots.some(sample => sample.id === row.id));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const assigned = new Map(candidates.map((row, index) => [row.id, states[index < states.length ? index : Math.floor(Math.random() * states.length)]]));
  return rows.map(row => assigned.has(row.id) ? { ...row, status: assigned.get(row.id)!, demoStatusAssigned: true } : row);
}


/** Explicit inheritance-and-override example, separate from user-created records. */
const overrideExampleConfig: Record<string,string> = {
 image:'tcr.tencentcloudcr.com/ags/python-agent:20260920',digest:toolVersions[0].imageDigest,useDigest:'false',
 command:'/init\nsleep inf',args:'',env:'LOG_LEVEL=debug\nWORKER_COUNT=4',cpu:'4',memory:'8Gi',network:'公网',
 life:'限时沙箱',ttl:'300秒',description:'',tags:'env:demo',resourceId:'',disk:'不设置（使用默认值）',storage:'',mounts:'[]',
 launchMode:'custom',vpc:'',subnet:'',role:'',securityGroups:'',ports:'',dns:'',dnsSearches:'',dnsOptions:'',
 healthPath:'/health',healthPort:'49983',healthProtocol:'HTTP',healthReadyTimeout:'30000',healthProbeTimeout:'2000',healthInterval:'1000',healthSuccessThreshold:'1',healthFailureThreshold:'100',
 logging:'false',logset:'',topic:'',logPaths:'',launchAuthMode:'',launchMetadata:'',imageConfig:'{}',
};
const overrideExampleFields = {cpu:'4',memory:'8Gi',env:'LOG_LEVEL=debug\nWORKER_COUNT=4'};
export const overrideExampleBuild: Build = {
 id:'tsb-demo-override',tool:'python-agent',toolId:'sdt-7a8b9c',toolTag:'default',imageRepo:toolVersions[0].imageRepo,imageTag:toolVersions[0].imageTag,imageDigest:toolVersions[0].imageDigest,
 hash:'demo-override-python-4c8g',status:'Success',stage:6,retry:0,time:'2026-10-12 10:00:00',startedAt:'2026-10-12 10:00:05',finishedAt:'2026-10-12 10:03:42',duration:'3 分 37 秒',snapshot:'ts-demo-override',versionName:'python-4c8g-demo',config:overrideExampleConfig,configOverrides:overrideExampleFields,autoDelete:false,idleTTL:'168h',
};
export const overrideExampleSnapshot: Snapshot = {
 id:'ts-demo-override',name:'继承并覆盖配置示例',tool:overrideExampleBuild.tool,toolId:overrideExampleBuild.toolId,toolTag:'default',build:overrideExampleBuild.id,hash:overrideExampleBuild.hash,
 requestTime:overrideExampleBuild.time,time:overrideExampleBuild.finishedAt!,lastUseTime:'—',status:'Ready',uses:0,autoDelete:false,idleTTL:'168h',versionName:overrideExampleBuild.versionName,config:overrideExampleConfig,configOverrides:overrideExampleFields,
};
