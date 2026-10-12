import React from 'react';
import { Modal } from '@tencent/tea-component';
import CreateTool from '../gpu-reference/CreateTool';
import { initialResources, specs } from '../gpu-reference/mock';
import type { Tool, SandboxConfig } from '../gpu-reference/types';
import { versions, read, fallbackMeta, ToolMeta } from '../sandbox/data';
import { digestOf } from '../mock';
import '../gpu-reference/style.css';

export interface ToolConfig {
 name:string;toolTag:string;life:string;imageRepo:string;imageTag:string;imageDigest:string;
 command:string;snapshot:boolean;cpu:string;memory:string;network:string;probe:string;imageVolume:boolean;
 description:string;tags:string;advancedConfig?:SandboxConfig;resourceId?:string;
}
export default function CreateForm({submit,cancel}:{submit:(v:ToolConfig)=>void;cancel:()=>void}) {
 const vs=versions(), metas=read<Record<string,ToolMeta>>('tool-meta',{});
 const tools:Tool[]=vs.filter((v,i,a)=>a.findIndex(x=>x.toolId===v.toolId)===i).map(v=>{
  const m=metas[v.toolId]||fallbackMeta(v);
  return {id:v.toolId,name:v.tool,resourceId:m.resourceId||'',namespace:'default',image:v.imageRepo+':'+v.imageTag,region:'广州',network:m.network,lifecycle:m.life,config:m.advancedConfig||{ttl:'5分钟',description:m.description,cpu:m.cpu,memory:m.memory,disk:'不设置（使用默认值）',storage:'',mounts:[],version:v.imageTag,commands:[m.command],args:'',env:'',network:m.network,vpc:'',subnet:'',role:'',ports:'',dns:'',logging:false,tagText:m.tags.replace(/:/g,'='),health:{path:'/health',port:'80',interval:'1000'}}};
 });
 const cloneId=new URLSearchParams(location.search).get('clone');
 return <CreateTool tools={tools} clone={tools.find(t=>t.id===cloneId)} resources={initialResources} region="广州" onCancel={cancel}
 onPurchase={()=>Modal.alert({message:'GPU 资源购买',description:'此原型提供当前地域的演示资源组供选择。实际购买请前往腾讯云控制台的资源购买页面。'})}
 onCreate={(t,snapshot,toolTag)=>{
  const c=t.config!;const resource=initialResources.find(r=>r.id===t.resourceId);const spec=specs.find(s=>s.id===resource?.spec);
  const parts=t.image.split('@');const repo=parts[0].replace(/:[^/:]+$/,'');const tag=c.version||'latest';
  submit({name:t.name,toolTag,life:t.lifecycle==='常驻沙箱'?'resident':'limited',imageRepo:repo,imageTag:tag,imageDigest:c.digest||parts[1]||digestOf(repo,tag),command:c.commands.join('\n'),snapshot,cpu:c.cpu||String(spec?.cpu||2),memory:c.memory||(spec?.memory||4)+'Gi',network:t.network||'沙箱内网',probe:c.health.path,imageVolume:!!c.mounts?.some(m=>(!m.method||m.method==='builtin')&&m.type==='镜像'),description:c.description,tags:c.tagText,advancedConfig:c,resourceId:t.resourceId});
 }}/>
}
