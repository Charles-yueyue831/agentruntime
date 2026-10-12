export type MatchMode = 'exact' | 'regex';
export interface AutoPolicy {
 id: string; name: string; region: string; instance: string; namespace: string;
 repository: string; repositoryMode: MatchMode; tag: string; tagMode: MatchMode;
 enabled: boolean; createdAt: string; updatedAt: string; deletedAt?: string;
}
// Prototype inventory; replace with current-region TCR inventory when APIs are connected.
export const tcrInstances = [
 {id:'tcr-gz-7f2a',name:'tcr-production',region:'gz',host:'tcr.tencentcloudcr.com',namespaces:['ags','production','models']},
 {id:'tcr-gz-92bc',name:'tcr-development',region:'gz',host:'tcr-test-jx.tencentcloudcr.com',namespaces:['jx','sandbox','test']},
 {id:'tcr-sh-184c',name:'tcr-shanghai',region:'sh',host:'sh.tencentcloudcr.com',namespaces:['ags']},
];
export const policyStorageKey = 'ags-auto-preheat-policies-v1';
export const seedPolicies: AutoPolicy[] = [
 {id:'ap-08f3a1',name:'生产环境 Agent 镜像',region:'gz',instance:'tcr-gz-7f2a',namespace:'ags',repository:'^(browser|worker)$',repositoryMode:'regex',tag:'^v[0-9]+$',tagMode:'regex',enabled:true,createdAt:'2026-09-25 10:15:00',updatedAt:'2026-09-28 09:30:00'},
 {id:'ap-3f9c22',name:'推理模型发布预热',region:'gz',instance:'tcr-gz-7f2a',namespace:'models',repository:'inference',repositoryMode:'exact',tag:'latest',tagMode:'exact',enabled:true,createdAt:'2026-09-24 14:20:00',updatedAt:'2026-09-26 16:40:00'},
 {id:'ap-7a81d0',name:'研发沙箱镜像',region:'gz',instance:'tcr-gz-92bc',namespace:'jx',repository:'sandbox',repositoryMode:'exact',tag:'^release-.*$',tagMode:'regex',enabled:false,createdAt:'2026-09-23 11:05:00',updatedAt:'2026-09-27 17:20:00'},
 {id:'ap-all001',name:'命名空间全量预热',region:'gz',instance:'tcr-gz-7f2a',namespace:'production',repository:'',repositoryMode:'exact',tag:'',tagMode:'exact',enabled:true,createdAt:'2026-09-28 10:00:00',updatedAt:'2026-09-28 10:00:00'},
 {id:'ap-all002',name:'浏览器全部版本',region:'gz',instance:'tcr-gz-7f2a',namespace:'ags',repository:'browser',repositoryMode:'exact',tag:'',tagMode:'exact',enabled:true,createdAt:'2026-09-28 10:00:00',updatedAt:'2026-09-28 10:00:00'},
 {id:'ap-all003',name:'全部仓库稳定版本',region:'gz',instance:'tcr-gz-7f2a',namespace:'production',repository:'',repositoryMode:'exact',tag:'latest',tagMode:'exact',enabled:false,createdAt:'2026-09-28 10:00:00',updatedAt:'2026-09-28 10:00:00'},
 {id:'ap-all004',name:'工作镜像全部版本',region:'gz',instance:'tcr-gz-7f2a',namespace:'ags',repository:'^worker-.*$',repositoryMode:'regex',tag:'',tagMode:'exact',enabled:false,createdAt:'2026-09-28 10:00:00',updatedAt:'2026-09-28 10:00:00'},
 {id:'ap-all005',name:'全部仓库发布版本',region:'gz',instance:'tcr-gz-7f2a',namespace:'models',repository:'',repositoryMode:'exact',tag:'^release-.*$',tagMode:'regex',enabled:true,createdAt:'2026-09-28 10:00:00',updatedAt:'2026-09-28 10:00:00'},
 {id:'ap-all006',name:'模型仓库固定版本',region:'gz',instance:'tcr-gz-7f2a',namespace:'models',repository:'^model-.*$',repositoryMode:'regex',tag:'v1.0',tagMode:'exact',enabled:true,createdAt:'2026-09-28 10:00:00',updatedAt:'2026-09-28 10:00:00'},
];
export function loadPolicies(): AutoPolicy[] {
 const raw = localStorage.getItem(policyStorageKey);
 if (!raw) return seedPolicies.map(p=>({...p}));
 const data: unknown = JSON.parse(raw);
 if (!Array.isArray(data) || !data.every(p=>p && typeof p.id==='string' && typeof p.name==='string' && typeof p.region==='string' && typeof p.instance==='string' && typeof p.namespace==='string' && typeof p.repository==='string' && typeof p.tag==='string' && ['exact','regex'].includes(p.repositoryMode) && ['exact','regex'].includes(p.tagMode) && typeof p.enabled==='boolean')) throw new Error('策略数据格式异常');
 const migrationKey=policyStorageKey+'-optional-demo-v2';
 if(!localStorage.getItem(migrationKey)){
  const merged=[...data,...seedPolicies.filter(p=>p.id.startsWith('ap-all')&&!data.some(old=>old.id===p.id))];
  localStorage.setItem(policyStorageKey,JSON.stringify(merged));
  localStorage.setItem(migrationKey,'1');
  return merged;
 }
 return data;
}
export function matchValue(mode: MatchMode, pattern: string, value: string) {
 if(!pattern.trim()) return true;
 if(mode==='exact') return pattern===value;
 try { return new RegExp(pattern).test(value); } catch { return false; }
}
export function ruleError(mode: MatchMode,value: string,kind:'repository'|'tag') {
 if(!value.trim()) return '';
 if(mode==='regex') {try {new RegExp(value);}catch{return '正则表达式格式不正确，请检查括号、转义和量词';}return '';}
 if(kind==='repository'&&!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(value)) return '请输入仓库名称，不含域名、命名空间或版本';
 if(kind==='tag'&&!/^[\w][\w.-]{0,127}$/.test(value)) return '请输入有效镜像版本，最多 128 个字母、数字、下划线、点或短横线';
 return '';
}

// Concrete names (including dots) remain exact; regex syntax opts into pattern matching.
export function inferMatchMode(value:string,kind:'repository'|'tag'): MatchMode {
 if(!value||!( /[\^$*+?()[\]{}|\\]/.test(value))) return 'exact';
 return 'regex';
}
