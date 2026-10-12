import React from 'react';
import {Button,Card,Table,Copy,Tag,Bubble,StatusTip} from '@tencent/tea-component';
import {ToolVersion,Snapshot} from '../types';
import {ToolMeta,read} from './data';
import {versionSnapshot,snapshotName} from '../model';
import {snapshots as initialSnapshots} from '../mock';
import State from '../components/ResourceStatus';
export default function ToolDetail({tool,meta,versions,navigate,onEdit}:{tool:ToolVersion;meta:ToolMeta;versions:ToolVersion[];navigate:(v:Record<string,string>)=>void;onEdit:()=>void}){
 const c=meta.advancedConfig,h=c?.health;
 const snapshots=read<Snapshot[]>('snapshots',initialSnapshots);
 const snap=versionSnapshot(tool,snapshots);
 const preheat=read<any[]>('preheat-tasks',[]).find(x=>x.image===tool.imageRepo+':'+tool.imageTag);
 const field=(label:string,value:React.ReactNode)=><div className="_tool-field" key={label}><span>{label}</span><div>{value||'无'}</div></div>;
 const grid=(left:React.ReactNode[],right:React.ReactNode[])=><div className="_tool-info-grid"><div>{left}</div><div>{right}</div></div>;
 const edit=<Button type="text" icon="pencil" aria-label="编辑配置" onClick={onEdit}/>;
 return <div className="console-list-body _tool-detail"><div className="_gpu-tools-toolbar"><Button type="primary" onClick={onEdit}>更新自定义配置</Button><Button onClick={()=>{sessionStorage.setItem('snapshot-preheat-request',JSON.stringify({toolId:tool.toolId,toolTag:tool.toolTag,image:tool.imageRepo+':'+tool.imageTag}));navigate({area:'preheat',fromTool:tool.toolId})}}>新建预热任务</Button><Button disabled={tool.imageVolume} onClick={()=>navigate({tab:'builds',makeBuild:tool.id})}>制作模板快照</Button></div>
 <Card><Card.Body title="模板详情">{grid([
 field('模板ID',<>{tool.toolId} <Copy text={tool.toolId}/></>),field('模板名称',<>{tool.tool} <Copy text={tool.tool}/></>),field('状态',<StatusTip.InstanceTip status="running">{meta.status}</StatusTip.InstanceTip>),field('快照状态',tool.snapshot?<Button type="link" onClick={()=>navigate({tab:'snapshots',snapshot:tool.snapshot!})}>{snap?.status==='Deleted'?'快照已删除':snap?.status==='Deleting'?'快照删除中':'快照已就绪'}</Button>:tool.lastBuild?<Button type="link" onClick={()=>navigate({tab:'builds',build:tool.lastBuild!})}>查看制作任务</Button>:'未制作'),field('模板类型','自定义沙箱'),field('网络策略',<>{meta.network}{edit}</>),field('角色ARN',c?.role||'无')
 ],[field('描述',<>{meta.description||'无'}{edit}</>),field('超时时间',meta.life==='常驻沙箱'?'不限时':c?.ttl||'300秒'),field('创建时间',meta.created),field('更新时间',tool.updated),field('腾讯云标签',<><Tag>{meta.tags||'无'}</Tag>{edit}</>)])}</Card.Body></Card>
 <Card><Card.Body title="自定义配置">{grid([
 field('镜像地址',<>{tool.imageRepo}:{tool.imageTag}{tool.imageDigest?'@'+tool.imageDigest:''}<div><Button type="link" onClick={()=>{if(preheat)sessionStorage.setItem('snapshot-preheat-view',preheat.dataset.id);navigate({area:'preheat'})}}>{preheat?(({success:'已预热',pending:'排队中',processing:'预热中',failed:'预热失败',unloaded:'已卸载',cancelled:'已取消'} as Record<string,string>)[preheat.dataset.status]||'查看镜像预热'):'查看镜像预热'}</Button></div></>),field('镜像仓库类型',(tool.imageRepo||'').includes('tencentcloudcr.com')?'容器镜像服务企业版':(tool.imageRepo||'').includes('ccr.ccs.tencentyun.com')?'容器镜像服务个人版':'第三方镜像仓库'),field('CPU',meta.cpu),field('内存',meta.memory),field('端口配置',c?.launchPorts?.map(p=>`${p.name}:${p.port}/${p.protocol}`).join('\n')||c?.ports||'无')
 ],[field('启动命令',meta.command),field('启动参数',c?.args||'无'),field('环境变量',c?.env||'无'),field('DNS 配置',c?.launchDns?`Servers: ${c.launchDns.servers}\nSearches: ${c.launchDns.searches||'无'}\nOptions: ${c.launchDns.options||'无'}`:c?.dns||'无'),field('健康检查',<Bubble placement="top" content={<div style={{whiteSpace:'pre-line',lineHeight:'24px'}}>{`检查路径: ${h?.path||'/health'}\n检查端口: ${h?.port||'49983'}\n协议: ${h?.protocol||'HTTP'}\n就绪超时时间: ${h?.readyTimeout||'30000'}ms\n探测超时时间: ${h?.probeTimeout||'2000'}ms\n探测周期: ${h?.interval||'1000'}ms\n成功阈值: ${h?.successThreshold||'1'}\n失败阈值: ${h?.failureThreshold||'100'}`}</div>}><Button type="link">Detail</Button></Bubble>)])}</Card.Body></Card>
 </div>;
}
