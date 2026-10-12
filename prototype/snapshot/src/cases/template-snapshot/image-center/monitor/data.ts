export type Source='手动创建'|'自动创建'|'TCR自动预热';
export type Registry='enterprise'|'personal'|'custom';
export type DemoTask={created:number;queuedUntil:number;finished:number;expires:number;source:Source;registry:Registry;outcome:'success'|'failed'|'timedout'};
export const sourceNames:Record<Source,string>={'手动创建':'手动创建','自动创建':'自动创建','TCR自动预热':'TCR 自动预热'};
export const registryNames:Record<Registry,string>={enterprise:'容器镜像服务企业版',personal:'容器镜像服务个人版',custom:'三方镜像仓库'};
export const combinations:Array<[Source,Registry,number]>=[
 ['手动创建','enterprise',.24],['手动创建','personal',.11],['手动创建','custom',.08],
 ['自动创建','enterprise',.19],['自动创建','personal',.09],['自动创建','custom',.04],
 ['TCR自动预热','enterprise',.25]
];
export function generateTasks(seed:number,now:number):DemoTask[]{
 let state=seed>>>0;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 const rows:DemoTask[]=[],hour=3600000,first=Math.floor((now-65*86400000)/hour)*hour;
 for(let start=first;start<now;start+=hour){
  const day=new Date(start).getDay(),clock=new Date(start).getHours();
  const activity=(day===0||day===6 ? .65 : 1)*(clock>=9&&clock<=20 ? 1.3 : .75);
  const count=Math.round((12+random()*14)*activity);
  for(let i=0;i<count;i++){
   const ticket=random();let roll=0;const [source,registry]=combinations.find(([, ,weight])=>(roll+=weight)>ticket)||combinations[0];
   const created=start+Math.floor(random()*hour);if(created>now)continue;
   const sourceQueueFactor=source==='TCR自动预热'?.72:source==='自动创建'?.94:1.16;
   const registryQueueFactor=registry==='custom'?1.3:registry==='personal'?1.08:.9;
   const sourceRunFactor=source==='TCR自动预热'?.82:source==='自动创建'?.96:1.12;
   const registryRunFactor=registry==='custom'?1.2:registry==='personal'?1.06:.93;
   const queueMinutes=1+Math.round((random()*8+Math.pow(random(),5)*26)*sourceQueueFactor*registryQueueFactor);
   const runMinutes=7+Math.round((random()*25+Math.pow(random(),4)*55)*sourceRunFactor*registryRunFactor);
   const queuedUntil=created+queueMinutes*60000,finished=queuedUntil+runMinutes*60000;
   const outcomeRoll=random(),outcome=outcomeRoll<.84?'success':outcomeRoll<.95?'failed':'timedout';
   const expires=finished+(2+Math.floor(random()*17))*86400000;
   rows.push({created,queuedUntil,finished,expires,source,registry,outcome});
  }
 }
 return rows;
}
export function percentile(values:number[],percent:number){if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.ceil(percent*sorted.length)-1]||0;}
export function formatMinutes(ms:number|null){if(ms===null)return '—';return `${Math.round(ms/60000*10)/10} 分钟`;}
