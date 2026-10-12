import React from 'react';
import { Card, Button, Alert, Tag } from '@tencent/tea-component';
import BuildProgress from './BuildProgress';
import ProductionConfig from './ProductionConfig';
import { Build, stageMetaMap, errorCatalog, errorKindNames } from '../types';

export default function BuildDetail({
  build, close, retry, cancel, advance, openSnapshot, openTool,
}: {
  build: Build | null;
  close: () => void;
  retry: (b: Build) => void;
  cancel: (b: Build) => void;
  advance: (b: Build) => void;
  openSnapshot: (id: string) => void;
  openTool: (id: string) => void;
}) {
  if (!build) return null;
  const b = build;
  const errMeta = errorCatalog.find(e => e.code === b.errorCode);

  return (
    <Card className="_snap-build-detail _snap-task-detail">
      <Card.Body>
            {b.status === 'Failed' && (
              <Alert type="error">
                <div className="_snap-error-box">
                  <p>
                    <b>错误码：</b><code className="_snap-code">{b.errorCode}</code>
                    {errMeta && <Tag theme="error">{errorKindNames[errMeta.kind]}</Tag>}
                  </p>
                  <p><b>错误信息：</b>{b.errorMessage}</p>
                  {errMeta && <p className="_snap-muted">失败阶段：{stageMetaMap[errMeta.stage]?.name}（{errMeta.stage}）</p>}
                </div>
              </Alert>
            )}
            {b.status === 'Cancelled' && <Alert type="info">制作任务在完成前被主动取消，没有产生可用的模板快照。</Alert>}
            {b.status === 'Success' && <Alert type="success">前置校验、模板快照制作和后置校验全部成功，模板快照{b.snapshot}已就绪，可用于加速启动沙箱实例。</Alert>}
            <BuildProgress build={b} />
      </Card.Body>

      <ProductionConfig tool={b.tool} toolId={b.toolId} overrides={b.configOverrides} openTool={openTool}/>

      {b.status !== 'Success' && <Card.Footer>
        <div className="_snap-inline">
          {['Failed', 'Cancelled'].includes(b.status) && <Button type="primary" onClick={() => retry(b)}>重新制作</Button>}
          {['Pending', 'Building'].includes(b.status) && (
            <>
              <Button type="primary" onClick={() => advance(b)}>演示：推进下一阶段</Button>
            </>
          )}
        </div>
      </Card.Footer>}
    </Card>
  );
}
