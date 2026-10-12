import type { SandboxConfig } from '../gpu-reference/types';
import { ToolVersion } from '../types';
import { toolVersions, builds as initialBuilds, snapshots as initialSnapshots } from '../mock';
import { normalizeVersions, normalizeBuilds } from '../model';
import type { Build, Snapshot } from '../types';
export const prefix = 'snapshot-demo-v2-';
export function read<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(prefix + key) || 'null') ?? fallback; } catch { return fallback; } }
export function save(key: string, value: unknown) { localStorage.setItem(prefix + key, JSON.stringify(value)); }
export const versions = () => normalizeVersions(read<ToolVersion[]>('versions', toolVersions));
export function migratePrototypeData() {
 const vs = versions();
 save('versions', vs);
 save('builds', normalizeBuilds(read<Build[]>('builds', initialBuilds), vs));
 const snaps = read<Snapshot[]>('snapshots', initialSnapshots);
 save('snapshots', snaps.map(s => ({...s, name:s.name||s.id, tool:vs.find(v=>v.toolId===s.toolId)?.tool||s.tool})));
 const metas = read<Record<string, ToolMeta>>('tool-meta', {});
 const merged:Record<string,ToolMeta> = {...metas};
 vs.filter((v,i,rows)=>rows.findIndex(row=>row.toolId===v.toolId)===i).forEach(v => { merged[v.toolId] = {...fallbackMeta(v), ...Object.fromEntries(Object.entries(metas[v.toolId]||{}).filter(([,value])=>value!==undefined&&value!==null))}; });
 save('tool-meta', merged);
}
export interface ToolMeta { advancedConfig?:SandboxConfig; resourceId?:string; cpu: string; memory: string; network: string; command: string; life: string; description: string; tags: string; created: string; status: string; }
export const fallbackMeta = (v: ToolVersion): ToolMeta => ({cpu:'2',memory:'4Gi',network:'公网',command:'/init\nsleep inf',life:'限时沙箱',description:'',tags:'env:demo',created:v.updated,status:'可用'});
export interface Instance { snapshot?:string; id: string; toolId: string; toolTag: string; status: string; created: string; updated: string; expires: string; timeout: number; metadata: string; image: string; command: string; }
export const now = () => new Date().toLocaleString('sv-SE');
export const dateText = (n: number) => new Date(n).toLocaleString('sv-SE');
export function initialInstances(): Instance[] { return versions().filter((v,i,a)=>a.findIndex(x=>x.toolId===v.toolId)===i).flatMap((v,i)=>[0,1].map(n=>({id:`sbi-demo-${i+1}${n+1}`,toolId:v.toolId,toolTag:v.toolTag,status:n?'已停止':'运行中',created:dateText(Date.now()-(n?2:0.1)*86400000),updated:now(),expires:n?'—':dateText(Date.now()+3600000),timeout:3600,metadata:'env: demo',image:v.imageRepo+':'+v.imageTag,command:'/init\nsleep inf'}))); }
export function download(name: string, rows: unknown) { const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(rows,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
