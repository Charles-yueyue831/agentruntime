import React from 'react';
import {Card,Form,Button} from '@tencent/tea-component';
import {configSections,buildOverrideSections} from '../build-config';
export default function ProductionConfig({tool,toolId,overrides,openTool}:{tool:string;toolId:string;overrides?:Record<string,string>;openTool:(id:string)=>void}){
  const fields = [...new Map([...configSections.flatMap(([,fields])=>fields),...buildOverrideSections.flatMap(([,fields])=>fields)].map(field=>[field[0],field])).values(), ['useDigest','使用镜像摘要'], ['mounts','存储挂载'], ['health','健康检查']] as [string,string][];
  const display = (key:string,value:string) => {
    if(['logging','useDigest','autoPause','autoResume'].includes(key)) return value==='true'?'开启':'关闭';
    if(key==='launchMode') return value==='image'?'使用镜像默认':'自定义';
    if(key==='mounts') {try {return JSON.parse(value).map((m:any)=>`${m.name||m.type}：${m.source||m.templateId||m.volumeId||''} → ${m.mount||m.path}（${m.permission||'默认权限'}）`).join('；')||'无';}catch{return '无';}}
    return value || '无（已清空）';
  };
  const visibleFields=fields.filter(([key])=>overrides && Object.prototype.hasOwnProperty.call(overrides,key));
  return <Card.Body title="制作配置" className="_snap-production-config">
    <Form readonly layout="flex" fixedLabelWidth={160}>
      <Form.Item label="关联的沙箱模板"><Form.Text><Button type="link" onClick={()=>openTool(toolId)}>{tool}</Button><span className="_snap-muted">（{toolId}）</span></Form.Text></Form.Item>
    </Form>
    <div className="_snap-config-columns">{visibleFields.map(([key,label])=><Form key={key} readonly layout="flex" fixedLabelWidth={160}><Form.Item label={label}><Form.Text><span className="_snap-config-value">{display(key,overrides![key])}</span></Form.Text></Form.Item></Form>)}</div>
    {!visibleFields.length&&<p className="_snap-muted">{overrides?'未覆盖配置':'未记录覆盖配置'}</p>}
  </Card.Body>;
}
