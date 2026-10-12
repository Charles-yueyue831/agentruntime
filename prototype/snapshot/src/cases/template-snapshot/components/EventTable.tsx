import React, { useState } from 'react';
import { Table, Tag, Select, Justify, Button, message } from '@tencent/tea-component';
import type { TableColumn } from '@tencent/tea-component';
import { EventRow } from '../events';
import { stageMetaMap } from '../types';

/** 事件列表：任务级事件 + 阶段级事件（PRD 2.10） */
export default function EventTable({ rows, scoped = true }: { rows: EventRow[]; scoped?: boolean }) {
  const [scope, setScope] = useState('all');
  const [level, setLevel] = useState('all');
  const data = rows.filter(r => (scope === 'all' || r.scope === scope) && (level === 'all' || r.level === level));

  const columns: TableColumn<EventRow>[] = [
    { key: 'time', header: '事件时间', width: 168 },
    {
      key: 'name', header: '事件名称', width: 150,
      render: r => <span className="_snap-event-name"><b>{r.name}</b>{scoped && <small>{r.scope === 'Task' ? '任务级' : '阶段级'}</small>}</span>,
    },
    { key: 'type', header: '事件类型 EventType', width: 300, render: r => <code className="_snap-code">{r.type}</code> },
    { key: 'level', header: '级别', width: 90, render: r => <Tag theme={r.level === 'Warning' ? 'warning' : 'success'}>{r.level}</Tag> },
    { key: 'stage', header: '对应 Stage', width: 150, render: r => (r.stage ? <span>{stageMetaMap[r.stage]?.name}<br /><small className="_snap-muted">{r.stage}</small></span> : '—') },
    { key: 'detail', header: '事件描述', render: r => <span className="_snap-event-detail">{r.detail}</span> },
  ];

  return (
    <div className="_snap-events">
      <Table.ActionPanel>
        <Justify
          left={<span className="_snap-muted">共 {data.length} 条事件，事件同步投递至 CLS 日志主题，可基于事件配置告警策略</span>}
          right={
            <div className="_snap-inline">
              {scoped && (
                <Select value={scope} onChange={setScope} options={[{ value: 'all', text: '全部事件' }, { value: 'Task', text: '任务级事件' }, { value: 'Stage', text: '阶段级事件' }]} />
              )}
              <Select value={level} onChange={setLevel} options={[{ value: 'all', text: '全部级别' }, { value: 'Normal', text: 'Normal' }, { value: 'Warning', text: 'Warning' }]} />
              <Button onClick={() => message.success({ content: '演示：已复制事件 JSON，可投递至 CLS 日志主题' })}>导出事件</Button>
            </div>
          }
        />
      </Table.ActionPanel>
      <Table
        records={data}
        recordKey="key"
        columns={columns}
        addons={[
          Table.addons.autotip({ isLoading: false, emptyText: '暂无事件记录' }),
          Table.addons.scrollable({ minWidth: 1120 }),
        ]}
      />
    </div>
  );
}
