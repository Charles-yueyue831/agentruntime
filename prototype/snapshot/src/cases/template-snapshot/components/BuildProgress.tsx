import React from 'react';
import { Icon, Bubble, Tag, Button } from '@tencent/tea-component';
import { Build, stagePhases, stageSteps, readyCheckItems, imageCheckItems } from '../types';

type LeafState = 'done' | 'current' | 'failed' | 'cancelled' | 'todo';

/** PRD 2.10 · 两级制作进度：父阶段 PreChecking / BuildingSnapshot / PostChecking */
export default function BuildProgress({ build }: { build: Build }) {
  const b = build;
  const done = b.status === 'Success' ? stageSteps.length : b.stage;
  const active = b.status === 'Success' ? -1 : b.stage;

  const leafState = (idx: number): LeafState => {
    if (b.status === 'Success' || idx < done) return 'done';
    if (idx !== active) return 'todo';
    if (b.status === 'Failed') return 'failed';
    if (b.status === 'Cancelled') return 'cancelled';
    if (b.status === 'Pending') return 'todo';
    return 'current';
  };

  const stateText: Record<LeafState, string> = {
    done: '已完成', current: '执行中', failed: '执行失败', cancelled: '已取消', todo: '待执行',
  };

  const checklistFor = (key: string) =>
    key === 'ImageChecking' ? imageCheckItems
      : key === 'PreReadyChecking' || key === 'PostReadyChecking' ? readyCheckItems
        : null;

  return (
    <div className="_snap-progress">

      {stagePhases.map(phase => {
        const leaves = phase.children.length ? phase.children : [phase.parent];
        const idxs = leaves.map(l => stageSteps.findIndex(s => s.key === l.key));
        const states = idxs.map(leafState);
        const phaseState: LeafState =
          states.every(s => s === 'done') ? 'done'
            : states.some(s => s === 'failed') ? 'failed'
              : states.some(s => s === 'cancelled') ? 'cancelled'
                : states.some(s => s === 'current') ? 'current'
                  : 'todo';
        return (
          <section key={phase.parent.key} className={'_snap-phase is-' + phaseState}>
            <header>
              <span className="_snap-phase-dot" />
              <b>{phase.parent.name}</b>
              <code>{phase.parent.key}</code>
              <Tag theme={phaseState === 'done' ? 'success' : phaseState === 'failed' ? 'error' : phaseState === 'current' ? 'primary' : 'default'}>
                {stateText[phaseState]}
              </Tag>
              <span className="_snap-muted">{phase.parent.detail}</span>
            </header>
            {phase.children.length > 0 && (
              <ol className="_snap-leaves">
                {phase.children.map((leaf, i) => {
                  const st = states[i];
                  const list = checklistFor(leaf.key);
                  return (
                    <li key={leaf.key} className={'is-' + st}>
                      <span className="_snap-leaf-icon">
                        {st === 'done' ? <Icon type="success" /> : st === 'failed' ? <Icon type="error" /> : st === 'current' ? <Icon type="loading" /> : <i />}
                      </span>
                      <div className="_snap-leaf-body">
                        <p className="_snap-leaf-title">
                          <b>{leaf.name}</b><code>{leaf.key}</code><em>{stateText[st]}</em>
                          {list && (
                            <Bubble dark={false} content={<ul className="_snap-bubble-list">{list.map(c => <li key={c.title}><b>{c.title}</b><span>{c.desc}</span></li>)}</ul>}>
                              <Button type="link" className="_snap-leaf-more">校验判据</Button>
                            </Bubble>
                          )}
                        </p>
                        <p className="_snap-muted">{leaf.detail}</p>
                        {st === 'failed' && b.errorCode && (
                          <p className="_snap-leaf-error"><b>{b.errorCode}</b>{b.errorMessage}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {phase.children.length === 0 && (
              <ol className="_snap-leaves">
                <li className={'is-' + states[0]}>
                  <span className="_snap-leaf-icon">
                    {states[0] === 'done' ? <Icon type="success" /> : states[0] === 'failed' ? <Icon type="error" /> : states[0] === 'current' ? <Icon type="loading" /> : <i />}
                  </span>
                  <div className="_snap-leaf-body">
                    <p className="_snap-leaf-title"><b>制作模板快照</b><code>BuildingSnapshot</code><em>{stateText[states[0]]}</em></p>
                    <p className="_snap-muted">根据制作配置生成模板快照</p>
                    {states[0] === 'failed' && b.errorCode && <p className="_snap-leaf-error"><b>{b.errorCode}</b>{b.errorMessage}</p>}
                  </div>
                </li>
              </ol>
            )}
          </section>
        );
      })}
      {b.status !== 'Success' && <footer className="_snap-progress-foot">
        {b.status === 'Failed'
            ? <span className="_snap-bad">制作流程终止于{stageSteps[b.stage]?.name}，未生成可用的模板快照</span>
            : b.status === 'Cancelled'
              ? <span className="_snap-muted">制作任务已被主动取消，未生成可用的模板快照</span>
              : <span className="_snap-muted">只有成功完成全部阶段，才会生成可用的模板快照</span>}
      </footer>}
    </div>
  );
}
