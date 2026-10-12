export interface AutoUnloadPolicy {
  id: string;
  name: string;
  region: string;
  imagePattern: string;
  idleEnabled: boolean;
  idleDays?: number;
  lruEnabled: boolean;
  quantityThreshold?: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export const autoUnloadStorageKey = 'ags-business-auto-unload-policies-v1';

export const seedAutoUnloadPolicies: AutoUnloadPolicy[] = [
  {id:'au-08f3a1',name:'生产环境镜像闲置清理',region:'gz',imagePattern:'^tcr\\.tencentcloudcr\\.com/ags/.*$',idleEnabled:true,idleDays:7,lruEnabled:false,enabled:true,createdAt:'2026-09-25 10:15:00',updatedAt:'2026-09-28 09:30:00'},
  {id:'au-3f9c22',name:'浏览器镜像容量管控',region:'gz',imagePattern:'^tcr\\.tencentcloudcr\\.com/ags/browser:.*$',idleEnabled:false,lruEnabled:true,quantityThreshold:80,enabled:true,createdAt:'2026-09-24 14:20:00',updatedAt:'2026-09-26 16:40:00'},
  {id:'au-7a81d0',name:'研发镜像缓存清理',region:'gz',imagePattern:'^tcr-test-jx\\.tencentcloudcr\\.com/jx/.*$',idleEnabled:true,idleDays:3,lruEnabled:true,quantityThreshold:120,enabled:false,createdAt:'2026-09-23 11:05:00',updatedAt:'2026-09-27 17:20:00'},
];

const legacyNames:Record<string,string> = {
  'au-08f3a1':'生产镜像闲置清理',
  'au-3f9c22':'浏览器镜像数量控制',
  'au-7a81d0':'研发镜像自动卸载',
};

export function loadAutoUnloadPolicies(): AutoUnloadPolicy[] {
  const raw=localStorage.getItem(autoUnloadStorageKey);
  if(!raw)return seedAutoUnloadPolicies.map(policy=>({...policy}));
  const data:unknown=JSON.parse(raw);
  if(!Array.isArray(data)||!data.every(policy=>policy&&typeof policy.id==='string'&&typeof policy.name==='string'&&typeof policy.region==='string'&&typeof policy.imagePattern==='string'&&typeof policy.idleEnabled==='boolean'&&typeof policy.lruEnabled==='boolean'&&typeof policy.enabled==='boolean'))throw new Error('自动卸载策略数据格式异常');
  const policies=data as AutoUnloadPolicy[];
  const updated=policies.map(policy=>legacyNames[policy.id]===policy.name?{...policy,name:seedAutoUnloadPolicies.find(seed=>seed.id===policy.id)!.name}:policy);
  if(updated.some((policy,index)=>policy!==policies[index]))localStorage.setItem(autoUnloadStorageKey,JSON.stringify(updated));
  return updated;
}

/** Resolve the enabled business policy that applies most specifically to an image. */
export function matchingBusinessPolicy(image:string): AutoUnloadPolicy|undefined {
  if(!image.trim())return undefined;
  return loadAutoUnloadPolicies()
    .filter(policy=>policy.region==='gz'&&policy.enabled&&!policy.deletedAt)
    .filter(policy=>{try{return new RegExp(policy.imagePattern).test(image)}catch{return false}})
    .sort((a,b)=>b.imagePattern.length-a.imagePattern.length||a.id.localeCompare(b.id))[0];
}

export function strategyLabel(policy:AutoUnloadPolicy):string {
  if(policy.idleEnabled&&policy.lruEnabled)return '闲置超时卸载 + 最近最少使用优先卸载';
  if(policy.idleEnabled)return '闲置超时卸载';
  if(policy.lruEnabled)return '最近最少使用优先卸载';
  return '不启用';
}

export function positiveIntegerError(value:string,label:string):string {
  return /^\d+$/.test(value.trim())&&Number(value)>0&&Number.isSafeInteger(Number(value))?'':`请输入大于 0 的整数${label}`;
}

export function imagePatternError(value:string):string {
  if(!value.trim())return '请输入适用镜像的正则表达式';
  try{new RegExp(value.trim());return ''}catch{return '正则表达式格式不正确，请检查后重试'}
}
