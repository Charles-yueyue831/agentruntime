import {TaskUnloadPolicy} from './unload-policy';
export type Task = {id:string;image:string;digest:string;status:string;registry:string;source:string;size:string;created:string;lastUsed:string;message:string;toolId:string;timeout:string;unloadPolicy:TaskUnloadPolicy};
export const el = <T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export const input=(id:string)=>el<HTMLInputElement>(id);
export const registryNames:Record<string,string>={enterprise:'容器镜像服务企业版',personal:'容器镜像服务个人版',custom:'三方镜像仓库'};
export const statuses:Record<string,string>={pending:'排队中',queuing:'排队中',processing:'预热中',success:'已预热',failed:'预热失败',cancelled:'预热已取消',unloaded:'预热已卸载'};
export const repository=(image:string)=>image.split('@')[0].replace(/:[^/:]+$/,'');
export const registryOf=(image:string)=>image.includes('tencentcloudcr.com')?'enterprise':image.includes('ccr.ccs.tencentyun.com')?'personal':'custom';
export const formatTime=(value:string)=>value?new Date(value).toLocaleString('sv-SE'):'—';
export function readTasks():Task[]{return Array.from(document.querySelectorAll<HTMLElement>('#resource-rows .resource-row')).map(row=>({id:row.dataset.id||'',image:row.querySelector('.image-cell .resource-link')?.textContent?.trim()||'',digest:row.dataset.digest||'',status:row.dataset.status||'',registry:row.dataset.registry||'',source:row.dataset.sourceType||'',size:row.dataset.unpackedImageSize||'—',created:row.dataset.createTime||'',lastUsed:row.dataset.lastMatchedTime||'',message:row.dataset.message||'',toolId:row.dataset.toolId||'',timeout:row.dataset.timeoutMinutes||'120',unloadPolicy:rowPolicy(row)}));}
export function legacyRow(id:string){return Array.from(document.querySelectorAll<HTMLElement>('#resource-rows .resource-row')).find(row=>row.dataset.id===id);}
export function openCreate(){document.querySelector<HTMLButtonElement>('[data-open="create"]')?.click();}
export function submitTask(values:{image:string;tag:string;digest:string;useDigest:boolean;timeout:string;credential:string;vpc:boolean;network:string;subnet:string;unloadPolicy:TaskUnloadPolicy}){
 input('create-image').value=values.image;input('create-image').dataset.pickedDigest=values.digest;input('create-image').dataset.credential=values.credential;
 input('create-tag').value=values.tag;input('use-digest').checked=values.useDigest;input('create-timeout').value=values.timeout;
 el<HTMLSelectElement>('create-registry').value=registryOf(values.image);el<HTMLSelectElement>('create-credential').value=values.credential;
 input('create-vpc').checked=values.vpc;el<HTMLSelectElement>('create-vpc-id').value=values.network;el<HTMLSelectElement>('create-subnet-id').value=values.subnet;
 const existing=new Set(readTasks().map(task=>task.id));
 el('create-submit').click();
 const created=readTasks().find(task=>!existing.has(task.id));
 if(!created)throw new Error('预热任务未创建，请检查表单后重试');
 updateTaskPolicy(created.id,values.unloadPolicy);
}
export function unloadTask(id:string){legacyRow(id)?.querySelector<HTMLButtonElement>('[data-action="delete"]')?.click();input('delete-check').checked=true;input('delete-check').dispatchEvent(new Event('change',{bubbles:true}));el<HTMLButtonElement>('confirm-delete').disabled=false;el('confirm-delete').click();}

function rowPolicy(row:HTMLElement):TaskUnloadPolicy{
 return row.dataset.taskAutoUnloadStrategy==='IdleTimeout'&&Number(row.dataset.idleTtl)>0?{strategy:'IdleTimeout',idleTTL:Number(row.dataset.idleTtl)}:{strategy:'Disabled'};
}
export function updateTaskPolicy(id:string,policy:TaskUnloadPolicy){
 const row=legacyRow(id);if(!row)throw new Error('任务不存在，请刷新后重试');
 const dataset:Record<string,string|undefined>={...row.dataset,taskAutoUnloadStrategy:policy.strategy};
 if(policy.strategy==='IdleTimeout')dataset.idleTtl=String(policy.idleTTL);else delete dataset.idleTtl;
 const records=Array.from(document.querySelectorAll<HTMLElement>('#resource-rows .resource-row')).map(item=>({dataset:item===row?dataset:{...item.dataset},image:item.querySelector('.image-cell .resource-link')?.textContent?.trim()||''}));
 // Persist first, so a failed write leaves the visible task policy unchanged.
 try{localStorage.setItem('snapshot-demo-v2-preheat-tasks',JSON.stringify(records))}catch{throw new Error('无法保存策略，请检查浏览器存储空间后重试')}
 row.dataset.taskAutoUnloadStrategy=policy.strategy;
 if(policy.strategy==='IdleTimeout')row.dataset.idleTtl=String(policy.idleTTL);else delete row.dataset.idleTtl;
}
