import React from 'react';
import { Card, Form, Button, Copy, Tag, StatusTip } from '@tencent/tea-component';
import State from './ResourceStatus';
import ProductionConfig from './ProductionConfig';
import { Build, Snapshot, ToolVersion, idleTTLText, imageRef } from '../types';

export default function SnapshotDetail({ snapshot, close, openBuild, openTool, editPolicy, remove, versions = [], build }: {
  snapshot: Snapshot | null;
  close: () => void;
  openBuild: (id: string) => void;
  openTool: (id: string) => void;
  editPolicy: (s: Snapshot) => void;
  remove: (s: Snapshot) => void;
  versions?: ToolVersion[];
  build?: Build;
}) {
  if (!snapshot) return <Card><Card.Body><StatusTip status="empty" emptyText="未找到该模板快照"/><Button onClick={close}>返回模板快照</Button></Card.Body></Card>;
  const s = snapshot;
  const overrides = s.configOverrides ?? build?.configOverrides;
  return (
    <Card className="_snap-build-detail">
          <Card.Body title="基本信息">
            <div className="_snap-basic-grid-v2">
              <Form readonly layout="flex" fixedLabelWidth={140}>
                <Form.Item label="模板快照名称"><Form.Text>{s.name||s.id}</Form.Text></Form.Item>
                <Form.Item label="模板快照 ID"><Form.Text>{s.id} <Copy text={s.id} /></Form.Text></Form.Item>
                <Form.Item label="模板快照状态"><Form.Text><State value={s.status} hideEnglish />{s.replacedBy&&<span className="_snap-muted">已被新快照替换</span>}</Form.Text></Form.Item>
              </Form>
              <Form readonly layout="flex" fixedLabelWidth={140}>
                <Form.Item label="制作请求时间"><Form.Text>{s.requestTime || build?.time || '—'}</Form.Text></Form.Item>
                <Form.Item label="成功制作时间"><Form.Text>{s.time}</Form.Text></Form.Item>
                <Form.Item label="最近使用时间"><Form.Text>{s.lastUseTime}</Form.Text></Form.Item>
              </Form>
              <Form readonly layout="flex" fixedLabelWidth={140}>
                <Form.Item label="模板快照版本"><Form.Text>{s.versionNames?.join('、') || s.versionName || 'default'}</Form.Text></Form.Item>
              </Form>
              <Form readonly layout="flex" fixedLabelWidth={140}>
                <Form.Item label="自动删除策略">
                  <Form.Text>
                    {s.autoDelete
                      ? <><Tag theme="success">已开启</Tag> <span>{idleTTLText(s.idleTTL)}未被使用时自动删除</span></>
                      : <><Tag>未开启</Tag> <span className="_snap-muted">永久保留；同版本重新制作成功后会被替换删除</span></>}
                    <span className="_snap-inline-gap" />
                    <Button type="link" onClick={() => editPolicy(s)} disabled={s.status !== 'Ready'}>编辑</Button>
                  </Form.Text>
                </Form.Item>
              </Form>
            </div>
          </Card.Body>
      <ProductionConfig tool={s.tool} toolId={s.toolId} overrides={overrides} openTool={openTool}/>
    </Card>
  );
}
