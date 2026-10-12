import {
  Build, Snapshot, EventLevel, EventMeta, StageKey,
  stagePhases, stageSteps, stageEvent, taskEventMeta, snapshotEventMeta, stageMetaMap,
} from './types';

export interface EventRow {
  key: string;
  time: string;
  type: string;
  name: string;
  level: EventLevel;
  /** 任务级事件 / 阶段级事件 */
  scope: 'Task' | 'Stage';
  stage?: StageKey;
  detail: string;
}

const task = (t: string) => taskEventMeta.find(e => e.type === t)!;

function fmt(base: string, offsetSec: number) {
  const d = new Date(base.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return base;
  d.setSeconds(d.getSeconds() + offsetSec);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 由制作任务的 Status + Stage 推导出完整事件序列（PRD 2.10 任务级事件 + 阶段级事件） */
export function buildEvents(b: Build): EventRow[] {
  const rows: EventRow[] = [];
  let t = 0;
  let seq = 0;
  const push = (meta: EventMeta, scope: 'Task' | 'Stage', step = 6, detail?: string) => {
    t += step;
    rows.push({ key: `${b.id}-${seq++}`, time: fmt(b.time, t), type: meta.type, name: meta.name, level: meta.level, scope, stage: meta.stage, detail: detail ?? meta.trigger });
  };

  push(task('TEMPLATE_SNAPSHOT_BUILD_CREATED'), 'Task', 0);
  if (b.status === 'Pending') return rows;
  push(task('TEMPLATE_SNAPSHOT_BUILD_STARTED'), 'Task', 4);

  /** 已完成的叶子阶段数量 */
  const done = b.status === 'Success' ? stageSteps.length : b.stage;
  /** 正在执行 / 失败所处的叶子阶段 */
  const active = b.status === 'Success' ? -1 : b.stage;
  let retryLeft = b.retry;

  for (const phase of stagePhases) {
    const leaves = phase.children.length ? phase.children : [phase.parent];
    const firstIdx = stageSteps.findIndex(s => s.key === leaves[0].key);
    const lastIdx = stageSteps.findIndex(s => s.key === leaves[leaves.length - 1].key);
    if (firstIdx > done && firstIdx !== active) break;

    const grouped = phase.children.length > 0;
    if (grouped) push(stageEvent(phase.parent.key, 'STARTED'), 'Stage', 5);

    let phaseFailed = false;
    for (const leaf of leaves) {
      const idx = stageSteps.findIndex(s => s.key === leaf.key);
      if (idx > done && idx !== active) break;
      push(stageEvent(leaf.key, 'STARTED'), 'Stage', 8);
      if (idx < done) {
        if (retryLeft > 0 && idx === Math.max(0, done - 1)) {
          push(task('TEMPLATE_SNAPSHOT_BUILD_RETRYING'), 'Task', 20, `阶段 ${leaf.name}（${leaf.key}）发生自动重试，当前累计重试 ${b.retry} 次`);
          retryLeft = 0;
        }
        push(stageEvent(leaf.key, 'SUCCEEDED'), 'Stage', 24);
      } else if (idx === active) {
        if (b.status === 'Failed') {
          if (retryLeft > 0) {
            push(task('TEMPLATE_SNAPSHOT_BUILD_RETRYING'), 'Task', 20, `阶段 ${leaf.name}（${leaf.key}）发生自动重试，当前累计重试 ${b.retry} 次`);
            retryLeft = 0;
          }
          push(stageEvent(leaf.key, 'FAILED'), 'Stage', 30, b.errorMessage ?? stageEvent(leaf.key, 'FAILED').trigger);
          phaseFailed = true;
        }
        break;
      }
    }

    if (grouped) {
      if (phaseFailed) push(stageEvent(phase.parent.key, 'FAILED'), 'Stage', 2);
      else if (lastIdx < done) push(stageEvent(phase.parent.key, 'SUCCEEDED'), 'Stage', 2);
    }
    if (phaseFailed) break;
    if (lastIdx >= done && active !== -1) break;
  }

  if (b.status === 'Success') push(task('TEMPLATE_SNAPSHOT_BUILD_SUCCEEDED'), 'Task', 4, `模板快照 ${b.snapshot} 已生成`);
  if (b.status === 'Failed') {
    const timeout = /Timeout$/i.test(b.errorCode ?? '');
    if (timeout) push(task('TEMPLATE_SNAPSHOT_BUILD_TIMEOUT'), 'Task', 2, b.errorMessage ?? '制作过程的某个阶段超过规定的最大执行时间');
    push(task('TEMPLATE_SNAPSHOT_BUILD_FAILED'), 'Task', 2, `${b.errorCode}：${b.errorMessage ?? ''}`);
  }
  if (b.status === 'Cancelled') push(task('TEMPLATE_SNAPSHOT_BUILD_CANCELLED'), 'Task', 2, `制作任务在阶段 ${stageMetaMap[stageSteps[b.stage]?.key]?.name ?? '—'} 被用户主动取消`);
  return rows;
}

/** 模板快照 的生命周期事件 */
export function snapshotEvents(s: Snapshot): EventRow[] {
  const meta = (t: string) => snapshotEventMeta.find(e => e.type === t)!;
  const rows: EventRow[] = [];
  const push = (m: EventMeta, offset: number, detail?: string) =>
    rows.push({ key: `${s.id}-${rows.length}`, time: fmt(s.time, offset), type: m.type, name: m.name, level: m.level, scope: 'Task', detail: detail ?? m.trigger });
  push(meta('TEMPLATE_SNAPSHOT_READY'), 0, `来源制作任务 ${s.build} 进入 Success，模板快照 ${s.id} 可用于加速启动沙箱实例`);
  if (s.status === 'Deleting' || s.status === 'Deleted') {
    push(meta(s.autoDelete ? 'TEMPLATE_SNAPSHOT_AUTO_DELETE_STARTED' : 'TEMPLATE_SNAPSHOT_ACTIVE_DELETE_STARTED'), 60);
  }
  if (s.status === 'Deleted') push(meta('TEMPLATE_SNAPSHOT_DELETED'), 90);
  return rows;
}
