import preheatHtml from './preheat.html?raw';
export const preheatStore = 'snapshot-demo-v2-preheat-tasks';
export type PreheatRecord = {image:string;dataset:{id?:string;digest?:string;status?:string;createTime?:string;registry?:string}};
let defaults:PreheatRecord[]|undefined;
export function readPreheatRecords():PreheatRecord[]{
  try {const saved=JSON.parse(localStorage.getItem(preheatStore)||'null');if(Array.isArray(saved))return saved;} catch {}
  if(!defaults){const doc=new DOMParser().parseFromString(preheatHtml,'text/html');defaults=Array.from(doc.querySelectorAll<HTMLElement>('.resource-row')).map(row=>({image:row.querySelector('.image-cell .resource-link')?.textContent?.trim()||'',dataset:{...row.dataset}})).filter(row=>row.image);const extra:PreheatRecord[]=JSON.parse(doc.getElementById('preheat-demo-records')?.textContent||'[]');defaults.push(...extra.map(row=>({...row,dataset:{...defaults![5]?.dataset,...row.dataset}})));}
  return defaults;
}
export function imageIdentity(value:string){
  const [address,digest]=value.trim().split('@');
  const match=address.match(/^(.*):([^/:]+)$/);
  return {repository:match?match[1]:address,tag:match?match[2]:'',digest:digest||''};
}
export function findPreheatStatus(image:string,version:string,digest:string){
  const target=imageIdentity(image),sha=digest||target.digest,tag=version||target.tag||'latest';
  const matches=readPreheatRecords().filter(row=>{const identity=imageIdentity(row.image);return identity.repository===target.repository&&(sha?(row.dataset.digest||identity.digest)===sha:identity.tag===tag);});
  matches.sort((a,b)=>(Date.parse(b.dataset.createTime||'')||0)-(Date.parse(a.dataset.createTime||'')||0));
  return matches[0]?.dataset.status||'none';
}
export const preheatLabels:Record<string,string>={pending:'排队中',queuing:'排队中',processing:'预热中',success:'已预热',failed:'预热失败',cancelled:'预热已取消',unloaded:'预热已卸载',none:'未预热',loading:'预热状态查询中'};
