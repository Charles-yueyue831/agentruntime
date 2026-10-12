export type TaskUnloadPolicy = {strategy:'Disabled'|'IdleTimeout'; idleTTL?:number};
export type AccountUnloadPolicy = {idleTTL?:number; quantityThreshold?:number};
export type PolicyDraft = {strategy:'Disabled'|'IdleTimeout'; amount:string; unit:'hour'|'day'};
export const ACCOUNT_POLICY_KEY='snapshot-demo-v3-preheat-account-unload:ap-guangzhou';
export const unitSeconds={hour:3600,day:86400};
export function daysFromSeconds(seconds?:number){return seconds?String(Number((seconds/86400).toFixed(6))):'';}
export function draftError(draft:PolicyDraft){
 if(draft.strategy==='Disabled')return '';
 if(!draft.amount.trim())return '请输入闲置超时阈值';
 const number=Number(draft.amount);
 const valid=draft.unit==='day'?/^\d+(?:\.\d{1,6})?$/.test(draft.amount):/^\d+$/.test(draft.amount);
 const seconds=Math.round(number*unitSeconds[draft.unit]);
 return !valid||!Number.isFinite(number)||seconds<=0||!Number.isSafeInteger(seconds)?'请输入大于 0 的有效时长':'';
}
export function toPolicy(draft:PolicyDraft):TaskUnloadPolicy{
 const error=draftError(draft);if(error)throw new Error(error);
 return draft.strategy==='Disabled'?{strategy:'Disabled'}:{strategy:'IdleTimeout',idleTTL:Math.round(Number(draft.amount)*unitSeconds[draft.unit])};
}
export function toDraft(policy:TaskUnloadPolicy):PolicyDraft{
 const seconds=policy.idleTTL;
 return {strategy:policy.strategy,amount:seconds?String(seconds/(seconds%86400===0?86400:3600)):'',unit:seconds&&seconds%86400===0?'day':'hour'};
}
export function duration(seconds:number){return seconds%86400===0?`${seconds/86400} 天`:`${seconds/3600} 小时`;}
export function readAccountPolicy():AccountUnloadPolicy{
 const value=JSON.parse(localStorage.getItem(ACCOUNT_POLICY_KEY)||'{}');
 if(!value||typeof value!=='object')throw new Error('账号级策略读取失败');
 for(const key of ['idleTTL','quantityThreshold'])if(value[key]!==undefined&&(!Number.isSafeInteger(value[key])||value[key]<=0))throw new Error('账号级策略读取失败');
 return {idleTTL:value.idleTTL,quantityThreshold:value.quantityThreshold};
}
export function effectivePolicy(task:TaskUnloadPolicy,account:AccountUnloadPolicy){
 const idleTTL=task.strategy==='IdleTimeout'?task.idleTTL:account.idleTTL;
 return {idleTTL,idleSource:idleTTL?(task.strategy==='IdleTimeout'?'task':'account'):undefined,quantityThreshold:account.quantityThreshold};
}
export function effectiveDescription(task:TaskUnloadPolicy,account:AccountUnloadPolicy){
 const p=effectivePolicy(task,account);const lines:string[]=[];
 if(p.idleTTL)lines.push(p.idleSource==='task'?`使用任务级闲置超时阈值 ${duration(p.idleTTL)}${account.idleTTL?'，覆盖账号级闲置超时阈值':''}。`:`继承账号级闲置超时阈值 ${duration(p.idleTTL)}。`);
 if(p.quantityThreshold)lines.push(`参与账号级 LRU 自动卸载：缓存数量超过 ${p.quantityThreshold} 个时，优先卸载最近最少使用的缓存；任务级不可覆盖。`);
 return lines.length?lines:['不执行自动卸载，仍可手动卸载预热缓存。'];
}

export type AccountPolicyDraft={enabled:boolean;idleEnabled:boolean;lruEnabled:boolean;amount:string;unit:'hour'|'day';quantity:string};
export const ACCOUNT_POLICY_CHANGED='preheat-account-policy-changed';
export function accountDraft(policy:AccountUnloadPolicy):AccountPolicyDraft{
 const ttl=toDraft({strategy:policy.idleTTL?'IdleTimeout':'Disabled',idleTTL:policy.idleTTL});
 return {enabled:Boolean(policy.idleTTL||policy.quantityThreshold),idleEnabled:Boolean(policy.idleTTL),lruEnabled:Boolean(policy.quantityThreshold),amount:ttl.amount,unit:ttl.unit,quantity:policy.quantityThreshold?String(policy.quantityThreshold):''};
}
export function accountErrors(draft:AccountPolicyDraft){
 return {
  strategies:draft.enabled&&!draft.idleEnabled&&!draft.lruEnabled?'请至少选择一种自动卸载策略':'',
  idle:draft.enabled&&draft.idleEnabled?draftError({strategy:'IdleTimeout',amount:draft.amount,unit:draft.unit}):'',
  quantity:draft.enabled&&draft.lruEnabled&&(!/^\d+$/.test(draft.quantity)||!Number.isSafeInteger(Number(draft.quantity))||Number(draft.quantity)<=0)?'请输入大于 0 的整数数量':''
 };
}
export function accountFromDraft(draft:AccountPolicyDraft):AccountUnloadPolicy{
 if(Object.values(accountErrors(draft)).some(Boolean))throw new Error('请检查自动卸载策略配置');
 return !draft.enabled?{}:{...(draft.idleEnabled?{idleTTL:Math.round(Number(draft.amount)*unitSeconds[draft.unit])}:{}),...(draft.lruEnabled?{quantityThreshold:Number(draft.quantity)}:{})};
}
export function saveAccountPolicy(draft:AccountPolicyDraft){
 const policy=accountFromDraft(draft);
 try{localStorage.setItem(ACCOUNT_POLICY_KEY,JSON.stringify(policy))}catch{throw new Error('配置保存失败，请检查浏览器存储空间后重试')}
 window.dispatchEvent(new Event(ACCOUNT_POLICY_CHANGED));
}
