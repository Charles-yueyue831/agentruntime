import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layout, Card, Table, Button, Tabs, TabPanel, Alert, Select, TagSearchBox, Justify, Tag, Copy, Bubble, Radio,
  Modal, Form, Switch, Input, InputNumber, Icon, message,
} from '@tencent/tea-component';
import type { TableColumn } from '@tencent/tea-component';
import type { AttributeValue, TagValue } from '@tencent/tea-component/lib/tagsearchbox';
import { prepareSnapshotDemo, prepareBuildDemo, builds as initialBuilds, snapshots as initialSnapshots, toolVersions as initialVersions } from './mock';
import {
  Build, Snapshot, ToolVersion, BuildStatus, SnapshotStatus, ImageRefLike,
  stageSteps, stageMetaMap, stageParentOf, statusNames, errorCatalog, errorKindNames,
  buildStatusMeta, snapshotStatusMeta, idleTTLText, imageRef, shortDigest,
} from './types';
import CreateForm, { ToolConfig } from './components/CreateForm';
import BuildDetail from './components/BuildDetail';
import SnapshotDetail from './components/SnapshotDetail';
import {FilterHeader} from './image-center/RepositoryFilters';
import MonitorPanel from './components/MonitorPanel';
import State from './components/ResourceStatus';
import {completeBuild, resolveImage, versionSnapshot, snapshotName, normalizeBuilds, normalizeVersions} from './model';
import {inheritedConfig, configFingerprint, mergeBuildConfig, validateBuildConfig, BuildConfig} from './build-config';
import BuildConfigFields from './components/BuildConfigFields';
import './style.css';
import './tea-refresh.css';

const { Content } = Layout;
const REGION = 'ap-guangzhou';
const UIN = '100051004881';
const STORE = 'snapshot-demo-v2-';

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function useStored<T>(key: string, initial: T, prepare?: (value: T) => T) {
  const [v, set] = useState<T>(() => { const value = read(STORE + key, initial); return prepare ? prepare(value) : value; });
  useEffect(() => { localStorage.setItem(STORE + key, JSON.stringify(v)); }, [v, key]);
  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key===STORE+key&&event.newValue){try{const next=JSON.parse(event.newValue);const prepared=prepare?prepare(next):next;set(previous=>JSON.stringify(previous)===JSON.stringify(prepared)?previous:prepared);}catch{}}};window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);},[key]);
  return [v, set] as const;
}
const now = () => new Date().toLocaleString('sv-SE');

export default function Page() {
  const [params, setParams] = useSearchParams();
  const create = params.get('view') === 'create';
  const requestedTab = params.get('tab') || 'template';
  // 旧链接继续落到综合页，避免用户从历史书签进入空白页。
  const tab = ['snapshots', 'builds', 'artifacts', 'versions'].includes(requestedTab) ? 'template' : requestedTab;

  const [builds, B] = useStored<Build[]>('builds', initialBuilds, rows=>normalizeBuilds(prepareBuildDemo(rows),normalizeVersions(read(STORE+'versions',initialVersions))));
  const [snapshots, S] = useStored<Snapshot[]>('snapshots', initialSnapshots, prepareSnapshotDemo);
  const [versions, V] = useStored<ToolVersion[]>('versions', initialVersions, normalizeVersions);

  /** 列表筛选统一由 TagSearchBox 承载（控制台列表页规范：搜索栏不使用 SearchBox） */
  const [tags, TG] = useState<TagValue[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const updateFilters = (value: TagValue[]) => { TG(value); setPageIndex(1); };

  const newBuild = params.get('view') === 'build' || !!params.get('makeBuild');
  const NB = (open:boolean) => setParams(open ? {tab:'template',view:'build'} : {tab:'template'});
  const [buildTarget, BT] = useState('');
  const [buildSnapshotName, BSN] = useState('');
  const [buildVersionNames, BVN] = useState<string[]>([]);
  const [buildConfig, BC] = useState<BuildConfig>({});
  const [buildInherited, BI] = useState<BuildConfig>({});
  const [buildDeletePolicy, BDP] = useState<'off' | 'idle'>('off');
  const [buildIdleDays, BID] = useState('7');
  const [buildError, BE] = useState(false);
  const [configErrors, setConfigErrors] = useState<Record<string,string>>({});
  useEffect(()=>{if(!newBuild||(!buildError&&!Object.keys(configErrors).length))return;const timer=window.setTimeout(()=>{const field=document.querySelector('._snap-build-create-page .is-error');field?.scrollIntoView({block:'center',behavior:'smooth'});field?.querySelector<HTMLElement>('input,textarea,button')?.focus({preventScroll:true});},100);return()=>window.clearTimeout(timer)},[configErrors,buildError,newBuild]);
  useEffect(() => { BE(false); }, [newBuild, buildTarget]);
  function selectBuildTarget(id: string) {
    BT(id);setConfigErrors({});
    const v = versions.find(x => x.id === id);
    if (!v) return;
    const inherited=inheritedConfig(v);
    BI(inherited); BC(inherited);
    BDP('off');
    BID('7');
  }
  function refreshList(silent = false) { B(normalizeBuilds(read(STORE + 'builds', builds),normalizeVersions(read(STORE+'versions',versions)))); S(prepareSnapshotDemo(read(STORE + 'snapshots', snapshots))); V(normalizeVersions(read(STORE + 'versions', versions))); if (!silent) message.success({content:'列表已刷新'}); }
  useEffect(()=>{const id=params.get('makeBuild');if(id){selectBuildTarget(id)}},[params.get('makeBuild')]);
  const [policy, PL] = useState<Snapshot | null>(null);
  const [policyOn, PON] = useState(false);
  const [policyError, PE] = useState(false);
  const [policyTTL, PTTL] = useState('');
  const [help, H] = useState(false);
  const [codes, CD] = useState(false);

  const detail = params.get('build');
  const snapshotDetail = params.get('snapshot');
  const versionDetail = params.get('version');
  const toolDetail = params.get('tool');
  useEffect(() => { setPageIndex(1); }, [tab, toolDetail]);
  const currentTool = versions.find(v => v.toolId === toolDetail) || builds.find(b => b.toolId === toolDetail);
  const hasDetail = !!(detail || snapshotDetail || versionDetail || toolDetail);

  const showDetail = (kind: string, id: string | null) => {
    if (kind === 'tool' && id) { setParams({area:'templates',tool:id,section:'detail'}); return; }
    const next = new URLSearchParams(params);
    ['build', 'snapshot', 'version', 'tool', 'view'].forEach(k => next.delete(k));
    if (id) next.set(kind, id);
    setParams(next);
  };
  const D = (id: string | null) => showDetail('build', id);
  const SD = (id: string | null) => showDetail('snapshot', id);
  const backToList = () => showDetail('', null);

  const tools = Array.from(new Set(versions.map(v => v.tool)));
  const toolTags = Array.from(new Set(versions.map(v => v.toolTag)));
  const currentBuild = builds.find(b => b.id === detail) || null;
  const pendingSnapshot = builds.find(b => b.id === snapshotDetail);
  const currentSnapshot: Snapshot | null = snapshots.find(s => s.id === snapshotDetail || s.build === snapshotDetail) || (pendingSnapshot ? {
    id: '—', name: pendingSnapshot.snapshotName || pendingSnapshot.versionName || '制作后生成', tool: pendingSnapshot.tool, toolId: pendingSnapshot.toolId, toolTag: pendingSnapshot.toolTag,
    build: pendingSnapshot.id, hash: pendingSnapshot.hash, requestTime: pendingSnapshot.time, time:'—', lastUseTime:'—', status:pendingSnapshot.status,
    uses:0,autoDelete:!!pendingSnapshot.autoDelete,idleTTL:pendingSnapshot.idleTTL||'168h',versionName:pendingSnapshot.versionName,versionNames:pendingSnapshot.versionNames,config:pendingSnapshot.config,configOverrides:pendingSnapshot.configOverrides,
  } : null);
  const currentVersion = versions.find(v => v.id === versionDetail) || null;

  function switchTab(id: string) {
    setParams({ tab: id });
    TG([]);
  }

  /* ---------- CreateTemplateSnapshotBuild ---------- */
  function addBuild(v: { tool: string; toolId: string; toolTag: string; imageRepo: string; imageTag: string; imageDigest: string; hash: string }) {
    if (!v.imageRepo) { message.error({content:'该模板版本缺少镜像配置，请先完善镜像信息'}); return; }
    const selected = versions.find(x=>x.toolId===v.toolId && x.toolTag===v.toolTag);
    const inherited = buildTarget===selected?.id ? buildInherited : (selected ? inheritedConfig(selected) : {});
    const config = mergeBuildConfig(inherited, buildConfig);
    const errors=validateBuildConfig({...config,dnsEnabled:buildConfig.dnsEnabled});
    if(!buildSnapshotName.trim())errors.snapshotName='请输入模板快照名称';
    const versionNames=buildVersionNames.length?buildVersionNames.map(v=>v.trim()):['default'];
    if(versionNames.some(v=>!v))errors.versionNames='请输入版本名称，或删除空白版本';
    else if(new Set(versionNames).size!==versionNames.length)errors.versionNames='模板快照版本不能重复';
    if(buildDeletePolicy==='idle'&&(!Number.isInteger(Number(buildIdleDays))||Number(buildIdleDays)<1))errors.idleDays='请输入大于 0 的整数天数';
    setConfigErrors(errors);
    if(Object.keys(errors).length){message.error({content: '请检查制作配置中标记的字段'});return;}
    const configOverrides = Object.fromEntries(Object.entries(config).filter(([key,value])=>value!==inherited[key]));
    if (!config.image?.trim()) { message.error({content:'请填写镜像地址'}); return; }
    if (!Number.isFinite(Number(config.cpu)) || Number(config.cpu)<=0) { message.error({content:'CPU 必须大于 0'}); return; }
    if (!config.memory?.trim()) { message.error({content:'请填写内存'}); return; }
    if (buildDeletePolicy==='idle' && (!Number.isFinite(Number(buildIdleDays)) || Number(buildIdleDays)<=0)) { message.error({content:'闲置超时阈值必须大于 0'}); return; }
    const image = resolveImage({image:config.image, imageDigest:config.useDigest==='true'?config.digest:undefined});
    config.digest=image.imageDigest;
    const b: Build = {
      id: 'tsb-' + Date.now().toString(16).slice(-6),
      tool: v.tool, toolId: v.toolId, toolTag: v.toolTag,
      ...image, hash: selected && configFingerprint(config)===configFingerprint(inherited) ? v.hash : configFingerprint(config),
      status: 'Pending', stage: 0, retry: 0, time: now(), duration: '—', snapshotName:buildSnapshotName.trim(),versionNames,versionName:versionNames[0],
      config, configOverrides, autoDelete: buildDeletePolicy === 'idle', idleTTL: `${Math.max(1, Number(buildIdleDays) || 7) * 24}h`,
    };
    B(list => [b, ...list]);
    V(list => list.map(x => (x.toolId === v.toolId && x.toolTag === v.toolTag ? { ...x, lastBuild: b.id, updated: b.time } : x)));
    switchTab('template');
    return b;
  }

  async function confirmVersionBuild(v: ToolVersion) {
    if (v.imageVolume) return;
    const confirmed = await Modal.confirm({
      message: '确认制作模板快照？',
      description: `将按沙箱模板「${v.tool}」的「${v.toolTag}」版本当前配置创建新的模板快照制作任务。重新制作会生成新的模板快照，原快照会被自动删除。新快照默认永久保留。`,
      okText: '确认制作', cancelText: '取消',
    });
    if (!confirmed) return;
    if (!addBuild(v)) return;
    switchTab('template');
    message.success({ content: '模板快照制作任务已提交' });
  }

  function submit(config: ToolConfig) {
    const toolId = 'sdt-' + Date.now().toString(16).slice(-6);
    const hash = Date.now().toString(16).slice(-8);
    const version: ToolVersion = {
      id: 'tv-' + Date.now(), tool: config.name, toolId, toolTag: config.toolTag,
      imageRepo: config.imageRepo, imageTag: config.imageTag, imageDigest: config.imageDigest,
      hash, updated: now(), imageVolume: config.imageVolume,
    };
    localStorage.setItem(STORE + 'tool-meta', JSON.stringify({...read<Record<string, unknown>>(STORE + 'tool-meta', {}), [toolId]: {cpu:config.cpu,memory:config.memory,network:config.network,command:config.command,life:config.life==='limited'?'限时沙箱':'常驻沙箱',description:config.description,tags:config.tags,advancedConfig:config.advancedConfig,resourceId:config.resourceId,created:now(),status:'可用'}}));
    localStorage.setItem(STORE + 'versions', JSON.stringify([version, ...versions]));
    V(list => [version, ...list]);
    if (config.snapshot) {
      addBuild({ tool: config.name, toolId, toolTag: config.toolTag, imageRepo: config.imageRepo, imageTag: config.imageTag, imageDigest: config.imageDigest, hash });
      message.success({ content: '沙箱模板已创建，模板快照制作任务 已提交' });
    } else {
      setParams({area:'templates'});
      Modal.success({
        message: '沙箱模板创建成功',
        description: config.imageVolume
          ? '该沙箱模板挂载了 Image Volume，按产品限制不支持制作模板快照，沙箱实例将冷启动。'
          : '未创建模板快照。后续可在「沙箱模板版本」中为指定版本发起制作。',
      });
    }
  }

  function retry(b: Build) {
    addBuild({ tool: b.tool, toolId: b.toolId, toolTag: b.toolTag, imageRepo: b.imageRepo, imageTag: b.imageTag, imageDigest: b.imageDigest, hash: b.hash });
  }

  /* ---------- CancelTemplateSnapshotBuild ---------- */
  async function cancel(b: Build) {
    const ok = await Modal.confirm({
      message: '取消制作任务 ' + b.id + '？',
      description: '取消后不会生成可用的模板快照，已存在的模板快照与已启动的沙箱实例不受影响。',
      okText: '取消制作', cancelText: '再想想',
    });
    if (!ok) return;
    B(list => list.map(x => (x.id === b.id ? { ...x, status: 'Cancelled' as BuildStatus, startedAt: x.status==='Pending'?'':x.startedAt, finishedAt: now() } : x)));
    message.success({ content: '制作任务已取消' });
  }

  /** 演示：推进制作进度 */
  function advance(b: Build) {
    if (b.status === 'Pending') {
      B(list => list.map(x => (x.id === b.id ? { ...x, status: 'Building' as BuildStatus, startedAt: now() } : x)));
      return;
    }
    if (b.stage < stageSteps.length - 1) {
      B(list => list.map(x => (x.id === b.id ? { ...x, stage: x.stage + 1 } : x)));
      return;
    }
    const id = 'ts-' + Date.now().toString(16).slice(-6);
    B(list => list.map(x => (x.id === b.id ? { ...x, ...resolveImage(x, versions.find(v=>v.toolId===x.toolId&&v.toolTag===x.toolTag)), status: 'Success' as BuildStatus, stage: stageSteps.length, snapshot: id, finishedAt: now(), duration: `${Math.max(0,Math.floor((Date.now()-new Date((x.startedAt||x.time).replace(' ','T')).getTime())/1000))} 秒` } : x)));
    S(list => completeBuild(b, list, id, now()));
    V(list => list.map(x => (x.toolId === b.toolId && x.toolTag === b.toolTag ? { ...x, snapshot: id, updated: now() } : x)));
    message.success({ content: '后置校验通过，已生成可用的模板快照 ' + id });
  }

  /* ---------- UpdateTemplateSnapshot ---------- */
  function openPolicy(s: Snapshot) { PE(false); PL(s); PON(s.autoDelete); PTTL(s.idleTTL === '168h' ? '' : String(parseFloat(s.idleTTL) / 24)); }
  function savePolicy() {
    if (!policy) return;
    const days = policyTTL.trim() ? Number(policyTTL) : 7;
    if (policyOn && (!Number.isFinite(days) || days <= 0)) { PE(true); return; }
    const ttl = policyOn ? `${days * 24}h` : policy.idleTTL;
    S(list => list.map(x => (x.id === policy.id ? { ...x, autoDelete: policyOn, idleTTL: ttl } : x)));
    PL(null);
    message.success({ content: policyOn ? '已开启自动删除，' + idleTTLText(ttl) + '未被使用时自动删除' : '已关闭自动删除策略' });
  }

  /* ---------- DeleteTemplateSnapshot ---------- */
  async function deleteSnapshot(s: Snapshot) {
    const ok = await Modal.confirm({
      message: '删除模板快照 ' + s.id + '？',
      description: '删除后不可恢复。使用该模板快照已经启动的沙箱实例不受影响；后续基于该模板快照启动沙箱实例时将退回冷启动。',
      okText: '删除', cancelText: '取消',
    });
    if (!ok) return;
    S(list => list.map(x => (x.id === s.id ? { ...x, status: 'Deleted' as SnapshotStatus } : x)));
  }

  const linked = (id: string, click: () => void, className = '') => (
    <span className={'_snap-id ' + className}><Button type="link" onClick={click}>{id}</Button><span className="_snap-copy-control"><Copy text={id} /></span></span>
  );

  const toolCell = (tool: string, toolId: string, toolTag: string) => (
    <div className="_snap-tool-cell">
      <Button type="link" onClick={() => showDetail('tool', toolId)}>{tool}</Button>
      <Tag theme={toolTag === 'default' ? 'primary' : 'default'}>{toolTag}</Tag>
      <p className="_snap-muted">{toolId}</p>
    </div>
  );

  /** 沙箱模板名 + SandboxToolID（制作任务列表：与「版本」拆成两列） */
  const toolNameCell = (tool: string, toolId: string) => (
    <div className="_snap-tool-cell">
      <Button type="link" onClick={() => showDetail('tool', toolId)}>{tool}</Button>
      <p className="_snap-muted">{toolId}</p>
    </div>
  );

  /** 沙箱模板版本 ToolTag */
  const versionCell = (toolTag: string) => <Tag theme={toolTag === 'default' ? 'primary' : 'default'}>{toolTag}</Tag>;

  /**
   * 镜像信息：两行堆叠展示
   *  - 第一行 镜像地址:镜像版本（完整引用，可复制）
   *  - 第二行 镜像 Digest（短展示，完整值在 title 与复制内容中）
   */
  const imageCell = (v: ImageRefLike) => {
    const ref = imageRef(v);
    const digest = v.imageDigest;
    return (
      <div className="_snap-image-cell">
        <span className="_snap-image-ref">
          <span title={ref}>{ref}</span>
          {v.imageRepo && <span className="_snap-copy-control"><Copy text={ref} /></span>}
        </span>
        {digest
          ? (
            <span className="_snap-image-digest" title={digest}>
              <span>{shortDigest(digest)}</span>
              <span className="_snap-copy-control"><Copy text={digest} /></span>
            </span>
          )
          : <span className="_snap-image-digest is-empty">镜像摘要暂未提供</span>}
      </div>
    );
  };

  const stageCell = (b: Build) => {
    if (b.status === 'Success') return <span className="_snap-muted">全部完成</span>;
    if (b.status === 'Pending') return <span className="_snap-muted">—</span>;
    const leaf = stageSteps[b.stage];
    if (!leaf) return <span className="_snap-muted">—</span>;
    return (
      <div className="_snap-stage-tooltip">
        <p>当前阶段：{['正在校验镜像', '正在冷启动沙箱', '正在进行前置就绪检查', '正在制作模板快照', '正在通过模板快照启动沙箱', '正在进行后置就绪检查'][b.stage]}</p>
      </div>
    );
  };

  /* ---------- 列定义 ---------- */
  const buildColumns: TableColumn<Build>[] = [
    { key: 'id', header: '制作任务 ID', width: 132, render: b => linked(b.id, () => D(b.id), '_snap-task-id') },
    { key: 'tool', header: '沙箱模板', width: 152, render: b => toolNameCell(b.tool, b.toolId) },
    { key: 'toolTag', header: '沙箱模板版本', width: 112, render: b => versionCell(b.toolTag) },
    { key: 'status', header: <FilterHeader attribute={{key:'status',name:'制作任务',type:'multiple',values:Object.keys(buildStatusMeta).map(key=>({key,name:statusNames[key]}))}} tags={tags} onChange={value=>updateFilters(value.map(t=>t.attr?.key==='status'?{...t,values:t.values?.map(v=>({key:Object.keys(buildStatusMeta).find(k=>statusNames[k]===v.name)||v.key,name:v.name}))}:t))}/>, width: 140, render: b => <State value={b.status} hideEnglish tooltip={b.status === 'Building' ? stageCell(b) : undefined} /> },
    {
      key: 'snapshot', header: '生成的模板快照', width: 142,
      render: b => (b.snapshot ? linked(b.snapshot, () => SD(b.snapshot!)) : <span className="_snap-muted">—</span>),
    },
    { key: 'image', header: '镜像信息', width: 348, render: b => imageCell(b) },
    { key: 'time', header: '字段创建时间', width: 158 },
    {
      key: 'actions', header: '操作', width: 176, fixed: 'right',
      render: b => (
        <div className="_snap-actions">
          <Button type="link" onClick={() => D(b.id)}>详情</Button>
          {['Failed', 'Cancelled'].includes(b.status) && <Button type="link" onClick={() => retry(b)}>重新制作</Button>}
          {['Pending', 'Building'].includes(b.status) && <Button type="link" onClick={() => cancel(b)}>取消</Button>}
        </div>
      ),
    },
  ];

  const snapshotColumns: TableColumn<Snapshot>[] = [
    { key: 'id', header: '模板快照 ID', width: 160, render: s => linked(s.id, () => SD(s.id), '_snap-task-id') },
    { key: 'status', header: '状态', width: 148, render: s => <State value={s.status} hideEnglish /> },
    { key: 'time', header: '成功制作时间', width: 180 },
    {
      key: 'lastUseTime', header: '最近使用时间', width: 186,
      render: s => (s.lastUseTime === '—' ? <span className="_snap-muted">未被使用</span> : s.lastUseTime),
    },
    { key: 'build', header: '制作任务', width: 158, render: s => linked(s.build, () => D(s.build)) },
    { key: 'tool', header: '沙箱模板 / 版本', width: 200, render: s => toolCell(s.tool, s.toolId, s.toolTag) },
    {
      key: 'autoDelete', header: '自动删除策略', width: 158,
      render: s => (s.autoDelete
        ? <span className="_snap-policy"><Tag theme="success">已开启</Tag><small>{idleTTLText(s.idleTTL)}</small></span>
        : <span className="_snap-muted">永久保留</span>),
    },
    {
      key: 'actions', header: '操作', width: 214, fixed: 'right',
      render: s => (
        <div className="_snap-actions">
          <Button type="link" onClick={() => SD(s.id)}>详情</Button>
          <Button type="link" disabled={s.status !== 'Ready'} onClick={() => openPolicy(s)}>编辑</Button>
          <Button type="link" disabled={s.status !== 'Ready'} onClick={() => deleteSnapshot(s)}>删除</Button>
        </div>
      ),
    },
  ];

  type TemplateRow = { kind: 'snapshot'; row: Snapshot } | { kind: 'build'; row: Build };
  const templateRows: TemplateRow[] = [
    ...snapshots.map(row => ({ kind: 'snapshot' as const, row })),
    ...builds.filter(build => !build.snapshot).map(row => ({ kind: 'build' as const, row })),
  ];
  const stateAttribute: AttributeValue = {key:'status',name:'状态',type:'multiple',values:[...new Set([...Object.keys(buildStatusMeta).filter(key=>key!=='Success'),...Object.keys(snapshotStatusMeta).filter(key=>key!=='Deleting')])].map(key=>({key,name:statusNames[key]}))};
  const templateColumns: TableColumn<TemplateRow>[] = [
    { key: 'id', header: '模板快照 ID', width: 160, render: item => item.kind === 'snapshot' && ['Ready', 'Deleted'].includes(item.row.status) ? linked(item.row.id, () => SD(item.row.id), '_snap-task-id') : <span className="_snap-muted">—</span> },
    { key: 'tool', header: '关联沙箱模板', width: 200, render: item => <div className="_snap-tool-cell"><Button type="link" onClick={() => showDetail('tool', item.row.toolId)}>{item.row.tool}</Button><p className="_snap-muted">{item.row.toolId}</p></div> },
    { key: 'status', header: <FilterHeader attribute={stateAttribute} tags={tags} onChange={value=>updateFilters(value.map(t=>t.attr?.key==='status'?{...t,values:t.values?.map(v=>({key:Object.keys(statusNames).find(k=>statusNames[k]===v.name)||v.key,name:v.name}))}:t))}/>, width: 180, render: item => <State value={item.row.status} hideEnglish tooltip={item.kind === 'build' && item.row.status === 'Building' ? stageCell(item.row) : undefined} /> },
    { key: 'requestTime', header: '制作请求时间', width: 180, render: item => item.kind === 'snapshot' ? (item.row.requestTime || builds.find(b => b.id === item.row.build)?.time || '—') : item.row.time },
    { key: 'build', header: '制作进度', width: 180, render: item => linked(item.kind === 'snapshot' ? item.row.build : item.row.id, () => D(item.kind === 'snapshot' ? item.row.build : item.row.id)) },
    { key: 'time', header: '成功制作时间', width: 180, render: item => item.kind === 'snapshot' ? item.row.time : <span className="_snap-muted">—</span> },
    { key: 'lastUseTime', header: '最近使用时间', width: 186, render: item => item.kind === 'snapshot' && ['Ready', 'Deleted'].includes(item.row.status) ? (item.row.lastUseTime === '—' ? <span className="_snap-muted">未被使用</span> : item.row.lastUseTime) : <span className="_snap-muted">—</span> },
    { key: 'autoDelete', header: '自动删除策略', width: 158, render: item => item.kind === 'snapshot' ? (item.row.autoDelete ? <span className="_snap-policy"><Tag theme="success">已开启</Tag><small>{idleTTLText(item.row.idleTTL)}</small></span> : <span className="_snap-muted">永久保留</span>) : <span className="_snap-muted">—</span> },
    { key: 'actions', header: '操作', width: 214, fixed: 'right', render: item => item.kind === 'snapshot' ? <div className="_snap-actions"><Button type="link" onClick={() => SD(item.row.id)}>详情</Button><Button type="link" disabled={item.row.status !== 'Ready'} onClick={() => openPolicy(item.row)}>编辑</Button><Button type="link" disabled={item.row.status !== 'Ready'} onClick={() => deleteSnapshot(item.row)}>删除</Button></div> : <div className="_snap-actions"><Button type="link" onClick={() => SD(item.row.id)}>详情</Button>{['Failed', 'Cancelled'].includes(item.row.status) && <Button type="link" onClick={() => retry(item.row)}>重新制作</Button>}{['Pending', 'Building'].includes(item.row.status) && <Button type="link" onClick={() => cancel(item.row)}>取消</Button>}</div> },
  ];

  const versionColumns: TableColumn<ToolVersion>[] = [
    { key: 'tool', header: '沙箱模板', width: 186, render: v => toolNameCell(v.tool, v.toolId) },
    { key: 'toolTag', header: '模板版本', width: 140, render: v => versionCell(v.toolTag) },
    { key: 'lastBuild', header: '制作任务', width: 178, render: v => v.lastBuild ? linked(v.lastBuild, () => D(v.lastBuild!), '_snap-task-id') : <span className="_snap-muted">未制作</span> },
    { key: 'snapshot', header: '模板快照', width: 210, render: v => { const s=versionSnapshot(v,snapshots); return s ? <div>{linked(snapshotName(s), () => SD(s.id), '_snap-task-id')}<State value={s.status} hideEnglish /></div> : <span className="_snap-muted">未制作</span>; } },
    { key: 'snapshotTime', header: '模板快照的制作时间', width: 180, render: v => versionSnapshot(v,snapshots)?.time ?? '—' },
    {
      key: 'actions', header: '操作', width: 260, fixed: 'right',
      render: v => (
        <div className="_snap-actions">
          <Button type="link" disabled={!!v.imageVolume} onClick={() => confirmVersionBuild(v)}>制作模板快照</Button>
          <Button type="link" disabled={!v.lastBuild} onClick={() => D(v.lastBuild!)}>最近任务</Button>
          <Button type="link" disabled={!versionSnapshot(v,snapshots)} onClick={() => SD(versionSnapshot(v,snapshots)!.id)}>查看快照</Button>
        </div>
      ),
    },
  ];

  /* ---------- 过滤 ---------- */
  /** 某个属性下已选的值集合；同属性多值取「或」，不同属性取「且」 */
  const picked = (key: string) =>
    tags.filter(t => t.attr?.key === key).flatMap(t => (t.values || []).map(v => String(v.key ?? v.name)));
  /** 未指定属性的纯关键词 */
  const keywords = tags.filter(t => !t.attr).flatMap(t => (t.values || []).map(v => String(v.name).toLowerCase()));
  const keyword = keywords.join(' ');

  const inSet = (set: string[], value: string) => !set.length || set.includes(value);
  const text = (r: unknown) => {
    if (!keywords.length) return true;
    const resource = r as Record<string, unknown>;
    const searchableFields = ['id', 'name', 'snapshotName', 'tool', 'toolId', 'toolTag', 'build', 'snapshot', 'versionName', 'versionNames'];
    const blob = (searchableFields.map(key => JSON.stringify(resource[key] ?? '')).join(' ') + ' ' + statusNames[String(resource.status || '')]).toLowerCase();
    return keywords.every(k => blob.includes(k));
  };
  const matchStage = (b: Build) => {
    const set = picked('stage');
    if (!set.length) return true;
    return b.status === 'Building' && !!stageSteps[b.stage] && set.includes(stageParentOf[stageSteps[b.stage].key]);
  };
  const matchBuild = (b: Build) =>
    inSet(picked('tool'), b.tool) && inSet(picked('toolTag'), b.toolTag) &&
    inSet(picked('status'), b.status) && matchStage(b) && text(b);
  const matchSnapshot = (s: Snapshot) =>
    inSet(picked('tool'), s.tool) && inSet(picked('toolTag'), s.toolTag) &&
    inSet(picked('status'), s.status) && text(s);
  const matchTemplateRow = (item: TemplateRow) => {
    const ids = picked('snapshotId');
    if (ids.length && (item.kind !== 'snapshot' || !['Ready', 'Deleted'].includes(item.row.status) || !inSet(ids, item.row.id))) return false;
    return item.kind === 'snapshot' ? !picked('stage').length && matchSnapshot(item.row) : matchBuild(item.row);
  };
  const matchVersion = (v: ToolVersion) =>
    inSet(picked('tool'), v.tool) && inSet(picked('toolTag'), v.toolTag) && text(v);

  /** 各页签可筛选的资源属性（TagSearchBox attributes） */
  const attrsFor = (key: 'builds' | 'snapshots' | 'versions'): AttributeValue[] => {
    const base: AttributeValue[] = [
      { key: 'tool', name: '沙箱模板', type: 'multiple', values: tools.map(t => ({ key: t, name: t })) },
      { key: 'toolTag', name: '模板版本', type: 'multiple', values: toolTags.map(t => ({ key: t, name: t })) },
    ];
    if (key === 'builds') {
      base.push(
        { key: 'status', name: '制作任务', type: 'multiple', values: (Object.keys(buildStatusMeta) as BuildStatus[]).map(s => ({ key: s, name: statusNames[s] })) },
        { key: 'stage', name: '制作阶段', type: 'multiple', values: [
          { key: 'PreChecking', name: '前置校验' },
          { key: 'BuildingSnapshot', name: '制作模板快照' },
          { key: 'PostChecking', name: '后置校验' },
        ] },
      );
    }
    if (key === 'snapshots') {
      base.push({ key: 'status', name: '状态', type: 'multiple', values: (Object.keys(snapshotStatusMeta) as SnapshotStatus[]).map(s => ({ key: s, name: statusNames[s] })) });
    }
    return base;
  };

  /** 筛选是否生效：决定空状态文案与「清空筛选条件」入口是否出现 */
  const hasFilter = tags.length > 0;
  const resetFilters = () => updateFilters([]);

  /**
   * 各页签的列宽合计（必须 ≥ 该页签所有列 width 之和）。
   * 小于合计值时，fixed:'right' 的操作列会浮在容器右缘盖住内容列尾巴。
   * 加列 / 加宽列时必须同步调大这里。
   */
  const TABLE_MIN_WIDTH: Record<string, number> = { builds: 1340, snapshots: 1404, versions: 1104, template: templateColumns.reduce((sum,column)=>sum+Number(column.width||0),0) };

  const addonsFor = (key: string, emptyText: React.ReactNode) => [
    Table.addons.autotip({
      isLoading: false,
      isFound: hasFilter,
      foundKeyword: keyword || (hasFilter ? tags.map(t => [t.attr?.name, ...(t.values || []).map(v => v.name)].filter(Boolean).join('：')).join('；') : undefined),
      onClear: resetFilters,
      emptyText: hasFilter ? '暂无匹配结果，请调整筛选条件' : emptyText,
    }),
    Table.addons.pageable({ pageIndex, pageSize, pageSizeOptions: [30, 50, 100, 200], onPagingChange: next => { setPageIndex(next.pageIndex || 1); if (next.pageSize && next.pageSize !== pageSize) { setPageSize(next.pageSize); setPageIndex(1); } } }),
    Table.addons.scrollable({ minWidth: TABLE_MIN_WIDTH[key] ?? 1340 }),
  ];
  const tableAddons = addonsFor('versions', '暂无数据');

  const headerTitle = newBuild ? '模板快照的制作' : create
    ? '创建自定义沙箱模板'
    : hasDetail
      ? (detail ? '制作进度详情' : snapshotDetail ? '模板快照详情' : toolDetail ? '沙箱模板详情' : '沙箱模板版本详情')
      : (
        <span className="_snap-header-line">
          <span>模板快照</span>
          <span className="_snap-region">
            <span>地域</span>
            <Select value="gz" options={[{ value: 'gz', text: '广州' }, { value: 'sg', text: '新加坡' }, { value: 'va', text: '弗吉尼亚' }]} appearance="button" />
          </span>
        </span>
      );

  const tabList = [
    { id: 'template', label: '模板快照' },
    { id: 'monitor', label: '监控' },
  ];

  const listSubtitle =
    tab === 'template' ? '统一查看模板快照制作任务与制作产物，并完成制作、编辑和删除等操作'
      : tab === 'monitor' ? '模板快照制作任务的规模与结果指标，并可配置 CLS 事件告警'
        : '模板快照制作任务的规模与结果指标';

  const isList = !newBuild && !create && !hasDetail;

  /**
   * 列表操作栏：控制台规范的两行布局
   *  Row 1 动词行——新建 / 批量操作
   *  Row 2 筛选行——TagSearchBox + 右侧模板按钮（刷新）
   */
  const filterBar = (key: 'builds' | 'snapshots' | 'versions') => (
    <Table.ActionPanel className="_snap-unified-toolbar">
      <div className="_snap-toolbar-row">
        {key === 'builds' && <div className="_snap-toolbar-actions">
          <Button type="primary" onClick={() => { BT(''); BSN(''); BVN([]); NB(true); }}>制作模板快照</Button>
          <Button onClick={() => setParams({ view: 'create' })}>创建自定义沙箱模板</Button>
        </div>}
        <div className="_snap-toolbar-search">
          <TagSearchBox attributes={key==='builds' ? [{key:'snapshotId',name:'模板快照 ID',type:'input'}, {...attrsFor('builds')[0],name:'关联沙箱模板'},stateAttribute] : attrsFor(key)} value={tags}
            tips="请选择筛选条件" attributesSelectTips="选择属性进行过滤"
            minWidth={180} hideHelp onChange={updateFilters} onClearButtonClick={resetFilters}/>
        </div>
        <Bubble content="刷新"><Button icon="refresh" aria-label="刷新列表" onClick={()=>refreshList()}/></Bubble>
      </div>
    </Table.ActionPanel>
  );

  /** 列表主体：ActionPanel + Card 表格，包在规范要求的 console-list-body 内 */
  const listBody = (key: 'builds' | 'snapshots' | 'versions') => (
    <div className="console-list-body _snap-build-list">
      {filterBar(key)}
      <Card>
        {key === 'builds' && (
          <Table
            records={builds.filter(matchBuild).sort((a,b)=>new Date(b.time.replace(' ','T')).getTime()-new Date(a.time.replace(' ','T')).getTime())} recordKey="id" columns={buildColumns}
            addons={addonsFor('builds', <>当前地域【广州】暂无制作任务，您可以<Button type="link" onClick={() => { BT(''); BSN(''); BVN([]); NB(true); }}>制作模板快照</Button></>)}
          />
        )}
        {key === 'snapshots' && (
          <Table
            records={snapshots.filter(matchSnapshot)} recordKey="id" columns={snapshotColumns}
            addons={addonsFor('snapshots', <>暂无模板快照，制作任务成功后会自动生成，您可以先<Button type="link" onClick={() => switchTab('template')}>查看制作任务</Button></>)}
          />
        )}
        {key === 'versions' && (
          <Table
            records={versions.filter(matchVersion)} recordKey="id" columns={versionColumns}
            addons={addonsFor('versions', <>暂无沙箱模板版本</>)}
          />
        )}
      </Card>
    </div>
  );

  const emptyTabBody = (messageText: string) => (
    <div className="console-list-body _snap-empty-tab">
      <Card><Card.Body><Alert type="info">{messageText}</Alert></Card.Body></Card>
    </div>
  );

  /** 综合页：共用筛选和操作栏，下方同时展示制作任务与模板快照产物。 */
  const templateSnapshotBody = (
    <div className="console-list-body _snap-build-list _snap-template-overview">
      {filterBar('builds')}
      <Card className="_snap-overview-card">
        <Card.Body>
          <Table
            grayHeader
            records={templateRows.filter(matchTemplateRow).sort((a,b)=>{const time=(item:TemplateRow)=>item.kind==='snapshot'?(item.row.requestTime||builds.find(build=>build.id===item.row.build)?.time||item.row.time):item.row.time;return time(b).localeCompare(time(a));})} recordKey={item => item.kind + ':' + item.row.id} columns={templateColumns}
            addons={addonsFor('template', <>暂无模板快照，您可以<Button type="link" onClick={() => { BT(''); BSN(''); BVN([]); NB(true); }}>制作模板快照</Button></>)}
          />
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <Content className={'_snap-page _snap-tea-refresh' + (isList ? ' _snap-tabbed' : '')}>
      <Content.Header
        title={headerTitle}
        showBackButton={newBuild || create || hasDetail}
        onBackButtonClick={() => (hasDetail ? backToList() : setParams({ tab: 'template' }))}

      />

      {isList && (
        <Content.Body full>
          <Tabs tabs={tabList} activeId={tab} onActive={t => switchTab(t.id)}>
            <TabPanel id="template">{templateSnapshotBody}</TabPanel>
            <TabPanel id="versions">{listBody('versions')}</TabPanel>
            <TabPanel id="monitor"><div className="console-list-body _snap-monitor-body"><MonitorPanel tools={tools} builds={builds} snapshots={snapshots} onRefresh={()=>refreshList(true)} active={tab==='monitor'} /></div></TabPanel>
          </Tabs>
        </Content.Body>
      )}

      {!isList && (
      <Content.Body>
        {newBuild && <div className="_ags-create-page _snap-build-create-page">
            <Card className="_ags-create-section"><Card.Body><div className="_ags-create-section-grid"><h3>基本信息</h3><Form layout="fixed" fixedLabelWidth={130}>
              <Form.Item label="沙箱模板" required showStatusIcon={false} status={buildError ? "error" : undefined} message={buildError ? "请选择沙箱模板" : undefined}>
                <Select
                  appearance="button" size="l" value={buildTarget} onChange={selectBuildTarget} placeholder="请选择沙箱模板" searchable
                  matchButtonWidth virtual={false} autoWrap listHeight={320}
                  boxClassName="_snap-build-version-options" searchPlaceholder="搜索沙箱模板"
                  options={versions.filter((v,i,all)=>all.findIndex(x=>x.toolId===v.toolId)===i).map(v => ({
                    value: v.id,
                    text: v.tool + (v.imageVolume ? '（不支持制作快照）' : ''),
                    tooltip: v.imageVolume ? '该模板版本挂载了镜像存储，不支持制作模板快照' : undefined,
                    disabled: !!v.imageVolume,
                  }))}
                />
              </Form.Item>
              <>
                <Form.Item label="模板快照名称" required showStatusIcon={false} status={configErrors.snapshotName?'error':undefined} message={configErrors.snapshotName}><Input size="l" aria-label="模板快照名称" value={buildSnapshotName} onChange={v=>{BSN(v);setConfigErrors(prev=>{const next={...prev};delete next.snapshotName;return next})}} placeholder="请输入模板快照名称" /></Form.Item>
                <Form.Item label="模板快照版本" showStatusIcon={false} status={configErrors.versionNames?'error':undefined} message={configErrors.versionNames}>
                {buildVersionNames.map((value,i)=><div className="_ags-image-input-row" key={i}><Input size="l" aria-label={`模板快照版本${i+1}`} value={value} placeholder="请输入版本名称" onChange={v=>{BVN(rows=>rows.map((row,j)=>j===i?v:row));setConfigErrors(prev=>{const next={...prev};delete next.versionNames;return next})}}/><Button type="text" aria-label={`删除模板快照版本${i+1}`} onClick={()=>{BVN(rows=>rows.filter((_,j)=>j!==i));setConfigErrors(prev=>{const next={...prev};delete next.versionNames;return next})}}><Icon type="close"/></Button></div>)}
                <Button type="link" onClick={()=>BVN(rows=>[...rows,''])}>添加</Button>
                <p className="_ags-launch-hint">一个模板快照可以对应多个版本，如果不添加的话，默认为 default 版本</p>
                </Form.Item>
              </>
            </Form></div></Card.Body></Card>
            {buildTarget && <BuildConfigFields value={buildConfig} errors={configErrors} onChange={value=>{BC(value);if(Object.keys(configErrors).length)setConfigErrors({...validateBuildConfig(value),...(configErrors.idleDays?{idleDays:configErrors.idleDays}:{})});}} onReset={()=>{const v=versions.find(x=>x.id===buildTarget);if(v){const inherited=inheritedConfig(v);BI(inherited);BC(inherited);}}}/>}
            {buildTarget && <Card className="_ags-create-section"><Card.Body><div className="_ags-create-section-grid"><h3>模板快照删除策略</h3><Form layout="fixed" fixedLabelWidth={130}>
              <Form.Item label="自动删除策略">
                <Radio.Group value={buildDeletePolicy} onChange={value => BDP(value as 'off' | 'idle')}>
                  <Radio name="off">不启用</Radio>
                  <Radio name="idle">闲置超时删除策略</Radio>
                </Radio.Group>
              </Form.Item>
              {buildDeletePolicy === 'idle' && <Form.Item label="闲置超时阈值" required showStatusIcon={false} status={configErrors.idleDays?"error":undefined} message={configErrors.idleDays}><InputNumber size="l" inputProps={{"aria-label":"闲置超时阈值"}} min={1} max={Number.MAX_SAFE_INTEGER} precision={0} unit="天" value={Number(buildIdleDays)} onChange={v=>{BID(String(v??''));setConfigErrors(previous=>{const next={...previous};delete next.idleDays;return next});}} /></Form.Item>}
            </Form></div></Card.Body></Card>}
          
          <Form.Action className="_ags-create-footer">
            <Button
              type="primary" disabled={!!versions.find(v=>v.id===buildTarget)?.imageVolume}
              onClick={() => {
                const v = versions.find(x => x.id === buildTarget);
                if (!v) { BE(true); return; }
                if (!addBuild({ tool: v.tool, toolId: v.toolId, toolTag: v.toolTag, imageRepo: v.imageRepo, imageTag: v.imageTag, imageDigest: v.imageDigest, hash: v.hash })) return;
                NB(false);
                message.success({ content: '模板快照制作任务已提交' });
              }}
            >
              开始制作
            </Button>
          </Form.Action>
        </div>}
        {create && <CreateForm submit={submit} cancel={() => setParams({ area: 'templates', tab: 'template' })} />}

        {detail && (
          <BuildDetail
            build={currentBuild} close={backToList} retry={retry} cancel={cancel} advance={advance}
            openSnapshot={id => SD(id)} openTool={id => showDetail('tool', id)}
          />
        )}
        {snapshotDetail && (
          <SnapshotDetail
            snapshot={currentSnapshot} close={backToList} openTool={id => showDetail('tool', id)}
            openBuild={id => D(id)} editPolicy={openPolicy} remove={deleteSnapshot} versions={versions} build={builds.find(b=>b.id===currentSnapshot?.build)}
          />
        )}
        {snapshotDetail && !currentSnapshot && (
          <Card className="_snap-build-detail"><Card.Body title="模板快照详情"><Alert type="warning">未找到模板快照 {snapshotDetail}，请返回列表查看。</Alert></Card.Body><Card.Footer><Button onClick={backToList}>返回列表</Button></Card.Footer></Card>
        )}
        {versionDetail && currentVersion && (
          <Card className="_snap-build-detail">
            <Card.Body title="沙箱模板版本">
              <Form readonly>
                <Form.Item label="沙箱模板"><Form.Text>{currentVersion.tool}（{currentVersion.toolId}）</Form.Text></Form.Item>
                <Form.Item label="版本 ToolTag"><Form.Text><Tag theme={currentVersion.toolTag === 'default' ? 'primary' : 'default'}>{currentVersion.toolTag}</Tag></Form.Text></Form.Item>
                <Form.Item label="镜像"><Form.Text>{imageRef(currentVersion)}</Form.Text></Form.Item>
                <Form.Item label="当前可用模板快照"><Form.Text>{currentVersion.snapshot || '未制作'}</Form.Text></Form.Item>
              </Form>
            </Card.Body>
            <Card.Footer><Button onClick={backToList}>返回列表</Button></Card.Footer>
          </Card>
        )}
        {toolDetail && currentTool && (
          <Card className="_snap-build-detail">
            <Card.Body title="沙箱模板信息"><Form readonly>
              <Form.Item label="沙箱模板名称"><Form.Text>{currentTool.tool}</Form.Text></Form.Item>
              <Form.Item label="沙箱模板 ID"><Form.Text>{currentTool.toolId} <span className="_snap-copy-control"><Copy text={currentTool.toolId}/></span></Form.Text></Form.Item>
            </Form></Card.Body>
            <Card.Footer><Button onClick={backToList}>返回列表</Button></Card.Footer>
          </Card>
        )}
        {hasDetail && !snapshotDetail && !currentBuild && !currentSnapshot && !currentVersion && !currentTool && (
          <Alert type="warning">未找到该资源，请返回列表查看。</Alert>
        )}
      </Content.Body>
      )}

      {/* 弹窗与列表 / 详情视图解耦，任何视图下都保持挂载 */}
      <>
        {/* 模板快照的制作：按沙箱模板配置发起 CreateTemplateSnapshotBuild */}


        {/* UpdateTemplateSnapshot：自动删除策略 */}
        <Modal className="_snap-modal _snap-tea-modal" visible={!!policy} caption="模板快照的编辑" size="m" onClose={() => PL(null)}>
          <Modal.Body>
            {policy && (
              <Form layout="fixed" fixedLabelWidth={150}>
                <Form.Item label="模板快照 ID"><Form.Text>{policy.id}</Form.Text></Form.Item>
                <Form.Item label="最近使用时间"><Form.Text>{policy.lastUseTime === '—' ? '未被使用' : policy.lastUseTime}</Form.Text></Form.Item>
                <Form.Item label="开启自动删除策略">
                  <Radio.Group value={policyOn?'on':'off'} onChange={v=>{PON(v==='on');PE(false)}}><Radio name="off">不启用</Radio><Radio name="on">启用</Radio></Radio.Group>
                  <p className="_snap-muted _snap-policy-help">启用后，模板快照在超过闲置时长阈值未被使用时会自动删除</p>
                </Form.Item>
                {policyOn && (
                  <Form.Item label="闲置时长阈值" required showStatusIcon={false} status={policyError ? "error" : undefined} message={policyError ? "请输入大于 0 的闲置天数" : undefined} extra="超过该时长未被用于加速启动时自动删除">
                    <div className="_snap-idle-input"><Input aria-label="闲置时长阈值" type="number" min={1} value={policyTTL} onChange={v=>{PTTL(v);PE(false)}} placeholder="闲置时长的阈值默认为闲置 7 天" size="full" /><span>天</span></div>
                  </Form.Item>
                )}
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button type="primary" onClick={savePolicy}>保存</Button>
            <Button onClick={() => PL(null)}>取消</Button>
          </Modal.Footer>
        </Modal>

        {/* 错误码说明 */}
        <Modal className="_snap-modal _snap-tea-modal" visible={codes} caption="模板快照错误码" size="l" onClose={() => CD(false)}>
          <Modal.Body>
            <Alert type="info">错误码按制作流程分为三类：前置校验错误、制作错误、后置校验错误。</Alert>
            <Table
              records={errorCatalog}
              recordKey="code"
              columns={[
                { key: 'kind', header: '错误类型', width: 120, render: r => <Tag theme={r.kind === 'PreCheck' ? 'warning' : r.kind === 'Build' ? 'error' : 'default'}>{errorKindNames[r.kind]}</Tag> },
                { key: 'code', header: '错误码 ErrorCode', width: 270, render: r => <code className="_snap-code">{r.code}</code> },
                { key: 'stage', header: '所属阶段', width: 130, render: r => stageMetaMap[r.stage]?.name },
                { key: 'message', header: '错误信息 ErrorMessage' },
              ]}
              addons={[Table.addons.scrollable({ minWidth: 900, maxHeight: 420 })]}
            />
          </Modal.Body>
          <Modal.Footer><Button type="primary" onClick={() => CD(false)}>知道了</Button></Modal.Footer>
        </Modal>

        {/* 使用说明 */}
        <Modal className="_snap-modal _snap-tea-modal" visible={help} caption="模板快照 · 原型说明" size="l" onClose={() => H(false)}>
          <Modal.Body>
            <h4 className="_snap-help-h">产品概念</h4>
            <p>
              模板快照：根据沙箱模板 的镜像与启动命令、环境变量、资源规格、网络等配置，
              预先制作并下发、供沙箱实例复用的启动加速资源。启动沙箱实例时平台自动匹配并复用可用的模板快照。
            </p>
            <h4 className="_snap-help-h">对象关系</h4>
            <p>沙箱模板 → 发起 N 个制作任务 → 每次成功产生 1 份模板快照 → 加速启动 N 个沙箱实例。</p>
            <h4 className="_snap-help-h">使用与制作限制</h4>
            <ul className="_snap-check-list">
              <li>仅支持同一沙箱模板下不同沙箱实例同构镜像的场景；异构镜像场景推荐使用「镜像预热」。</li>
              <li>挂载 Image Volume 的沙箱模板只能冷启动，不能制作对应的模板快照。</li>
              <li>沙箱实例覆盖从沙箱模板继承的关键配置时，ConfigHash 不兼容，不会命中模板快照。</li>
            </ul>
            <h4 className="_snap-help-h">原型操作路径</h4>
            <ul className="_snap-check-list">
              <li>「制作模板快照」按沙箱模板版本发起制作任务；或在「创建自定义沙箱模板」中开启创建模板快照。</li>
              <li>在制作任务详情中查看两级阶段进度、Ready Check 判据与任务级 / 阶段级事件；可通过「演示：推进下一阶段」走完成功路径。</li>
              <li>在模板快照列表中编辑自动删除策略（EnableAutoDelete / IdleTTL）或删除快照。</li>
              <li>在「监控」中查看任务规模与任务结果指标，并配置 CLS 事件告警。</li>
            </ul>
            <h4 className="_snap-help-h">设计假设（待产品评审确认）</h4>
            <p className="_snap-muted">
              ToolTag 默认 default、长度 1–64；IdleTTL 提供 24 小时 / 3 天 / 7 天 / 14 天四档；错误码命名参考云 API 错误码规范；
              监控数据与事件时间线为演示生成。数据仅保存在浏览器本地，不连接真实云资源。
            </p>
            <Button
              onClick={async () => {
                if (await Modal.confirm({ message: '重置全部演示数据？' })) {
                  B(initialBuilds); S(initialSnapshots); V(initialVersions); H(false);
                }
              }}
            >
              重置演示数据
            </Button>
          </Modal.Body>
          <Modal.Footer><Button type="primary" onClick={() => H(false)}>知道了</Button></Modal.Footer>
        </Modal>
      </>
    </Content>
  );
}
