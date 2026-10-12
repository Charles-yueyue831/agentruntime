import React from 'react';
import { StatusTip, Bubble } from '@tencent/tea-component';
import { buildStatusMeta, snapshotStatusMeta, statusNames, BuildStatus, SnapshotStatus } from '../types';

export { statusNames };

/** 状态含义（PRD 2.6 状态管理表） */
function describe(value: string) {
  if (value in buildStatusMeta) {
    const m = buildStatusMeta[value as BuildStatus];
    return { desc: m.desc, extra: '' };
  }
  if (value in snapshotStatusMeta) {
    const m = snapshotStatusMeta[value as SnapshotStatus];
    return { desc: m.desc, extra: '是否可被用于启动 Sandbox：' + m.usable };
  }
  return null;
}

export default function ResourceStatus({ value, tooltip, hideEnglish = false }: { value: string; tooltip?: React.ReactNode; hideEnglish?: boolean }) {
  const status =
    value === 'Failed' ? 'error'
      : ['Success', 'Ready'].includes(value) ? 'running'
        : ['Building', 'Deleting'].includes(value) ? 'operating'
          : value === 'Pending' ? 'warning'
            : 'closed';
  const info = describe(value);
  const body = (
    <span className="_snap-resource-status">
      <StatusTip.InstanceTip status={status}>{statusNames[value] || value}</StatusTip.InstanceTip>
      {!hideEnglish && <small>{value}</small>}
    </span>
  );
  if (tooltip !== undefined) return <Bubble content={tooltip}>{body}</Bubble>;
  if (!info) return body;
  return (
    <Bubble content={<div className="_snap-bubble"><p>{info.desc}</p>{info.extra && <p className="_snap-muted">{info.extra}</p>}</div>}>
      {body}
    </Bubble>
  );
}
