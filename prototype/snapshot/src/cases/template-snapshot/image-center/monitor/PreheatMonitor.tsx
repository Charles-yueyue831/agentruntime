import React,{useMemo,useState} from 'react';
import {Button,Bubble,Card,Select,TagSearchBox} from '@tencent/tea-component';
import type {TagValue,AttributeValue} from '@tencent/tea-component/lib/tagsearchbox';
import type {RangeDateType} from '@tencent/tea-component/lib/calendar/DateProps';
import {TeaChart} from '../../../../TeaChart';
import MonitorTimeRange from '../../components/MonitorTimeRange';
import moment from 'moment';
import type {EChartsOption} from 'echarts';
import {combinations,formatMinutes,generateTasks,percentile,registryNames,sourceNames} from './data';
import './style.css';
import '../preheat-console.css';
const grainNames:Record<string,string>={'1m':'1分钟','5m':'5分钟','1h':'1小时','1d':'1天'};
const grainMs:Record<string,number>={'1m':60000,'5m':300000,'1h':3600000,'1d':86400000};
function grainOptions(hours:number){return hours<=1?['1m','5m']:hours<=24?['1m','5m','1h']:['1h','1d'];}
function chartOption(labels:string[],values:number[]):EChartsOption{return {animation:false,tooltip:{trigger:'axis',valueFormatter:value=>`${value} 个`},grid:{left:16,right:24,top:18,bottom:12,containLabel:true},xAxis:{type:'category',boundaryGap:false,data:labels,axisTick:{show:false},axisLabel:{hideOverlap:true}},yAxis:{type:'value',min:0,minInterval:1,splitLine:{lineStyle:{type:'dashed'}}},series:[{name:'数量',type:'line',smooth:true,showSymbol:false,data:values,areaStyle:{opacity:.07},lineStyle:{width:2}}]};}
function Metric({label,value,unit,help}:{label:string;value:string|number;unit?:string;help:string}){return <Card className="pm-metric-card"><Card.Body><div className="pm-metric"><span>{label}<Bubble content={help}><Button icon="info" aria-label={`${label}说明`}/></Bubble></span><div><strong>{value}</strong>{unit&&<span className="pm-unit">{unit}</span>}</div></div></Card.Body></Card>;}
function Chart({title,labels,values}:{title:string;labels:string[];values:number[]}){return <Card className="pm-chart-card"><Card.Body><h3>{title} <small>（个）</small></h3><div className="pm-chart"><TeaChart option={chartOption(labels,values)} className="pm-chart"/></div></Card.Body></Card>;}
export default function PreheatMonitor(){
 const [seed,setSeed]=useState(()=>Math.floor(Math.random()*0xffffffff)),[updated,setUpdated]=useState(Date.now());
 const [range,setRange]=useState<RangeDateType>(()=>[moment().subtract(24,'hours'),moment()]);
 const [grain,setGrain]=useState('1m'),[tags,setTags]=useState<TagValue[]>([]);
 const tasks=useMemo(()=>generateTasks(seed,updated),[seed,updated]);
 const start=range[0].valueOf(),end=range[1].valueOf(),hours=(end-start)/3600000;
 const allowed=grainOptions(hours),effectiveGrain=allowed.includes(grain)?grain:allowed[0],step=grainMs[effectiveGrain];
 const selections=(key:string)=>tags.filter(t=>t.attr?.key===key).flatMap(t=>t.values||[]).map(v=>String(v.key));
 const sources=selections('source'),registries=selections('registry');
 const sourceAllowed=combinations.filter(([,r])=>!registries.length||registries.includes(r)).map(([s])=>s);
 const registryAllowed=combinations.filter(([s])=>!sources.length||sources.includes(s)).map(([,r])=>r);
 const attributes:AttributeValue[]=[{key:'source',name:'来源类型',type:'multiple',values:Object.entries(sourceNames).filter(([key])=>sourceAllowed.includes(key as keyof typeof sourceNames)).map(([key,name])=>({key,name}))},{key:'registry',name:'仓库类型',type:'multiple',values:Object.entries(registryNames).filter(([key])=>registryAllowed.includes(key as keyof typeof registryNames)).map(([key,name])=>({key,name}))}];
 const filtered=tasks.filter(t=>(!sources.length||sources.includes(t.source))&&(!registries.length||registries.includes(t.registry)));
 const recent=filtered.filter(t=>t.created>=start&&t.created<=end),completed=filtered.filter(t=>t.finished<=updated);
 const queued=filtered.filter(t=>t.created<=updated&&t.queuedUntil>updated).length,running=filtered.filter(t=>t.queuedUntil<=updated&&t.finished>updated).length,ready=filtered.filter(t=>t.outcome==='success'&&t.finished<=updated&&t.expires>updated).length;
 const queueP95=percentile(completed.map(t=>t.queuedUntil-t.created),.95),runP95=percentile(completed.map(t=>t.finished-t.queuedUntil),.95);
 const pointCount=Math.max(1,Math.ceil((end-start)/step)),requests=Array<number>(pointCount).fill(0),cacheDiff=Array<number>(pointCount+1).fill(0),index=(time:number)=>Math.floor((time-start)/step);
 for(const task of filtered){if(task.created>=start&&task.created<end)requests[Math.min(pointCount-1,index(task.created))]++;if(task.outcome==='success'&&task.finished<end&&task.expires>start){const from=Math.max(0,index(task.finished)),until=Math.min(pointCount,Math.ceil((task.expires-start)/step));cacheDiff[from]++;cacheDiff[until]--;}}
 let active=0;const cache=cacheDiff.slice(0,pointCount).map(v=>(active+=v));
 const labels=Array.from({length:pointCount},(_,i)=>{const d=moment(start+i*step);return effectiveGrain==='1d'?d.format('M/D'):hours<=24?d.format('HH:mm'):d.format('M/D HH:mm')});
 function changeTags(next:TagValue[]){const groups=new Map<string,TagValue>();for(const item of next){const key=String(item.attr?.key||'');const old=groups.get(key);groups.set(key,{...item,values:Array.from(new Map([...(old?.values||[]),...(item.values||[])].map(v=>[v.key,v])).values())})}setTags([...groups.values()]);}
 function changeRange(value:RangeDateType){setRange(value);setGrain(grainOptions(value[1].diff(value[0],'hours',true))[0]);}
 function refresh(){setSeed(Math.floor(Math.random()*0xffffffff));setUpdated(Date.now());}
 return <div className="pm-page" role="region" aria-label="预热任务监控">
  <div className="pm-top"><h2>预热任务监控</h2><span>最近更新：{new Date(updated).toLocaleTimeString('zh-CN',{hour12:false})}</span><Bubble content="刷新监控数据"><Button icon="refresh" aria-label="刷新监控数据" onClick={refresh}/></Bubble></div>
  <div className="pm-filters" role="group" aria-label="预热任务监控筛选"><div className="pm-search"><TagSearchBox attributes={attributes} value={tags} onChange={changeTags} onClearButtonClick={()=>setTags([])} hideHelp tips="选择来源类型或仓库类型进行查询（同键多值为或、跨键为且）" attributesSelectTips="请选择筛选字段"/></div><div className="pm-time"><MonitorTimeRange value={range} onChange={changeRange}/><Select className="pm-grain" appearance="button" value={effectiveGrain} onChange={setGrain} options={allowed.map(key=>({value:key,text:grainNames[key]}))}/></div></div>
  <div className="pm-metrics">
   <Metric label="创建请求总数" value={recent.length} unit="个" help="所选时间范围内提交的镜像预热任务创建请求数量"/>
   <Metric label="当前正在排队任务数" value={queued} unit="个" help="当前正在排队的镜像预热任务数量"/>
   <Metric label="当前正在预热任务数" value={running} unit="个" help="当前正在执行的镜像预热任务数量"/>
   <Metric label="当前已预热的镜像缓存数" value={ready} unit="个" help="当前已预热完成且尚未卸载的镜像缓存数量"/>
   <Metric label="P95 排队耗时" value={formatMinutes(queueP95)} help="已完成的镜像预热任务中，95% 的任务排队时长小于该值"/>
   <Metric label="P95 预热耗时" value={formatMinutes(runP95)} help="已完成的镜像预热任务中，95% 的任务执行时长小于该值"/>
  </div>
  <div className="pm-charts">
   <Chart title="创建请求量" labels={labels} values={requests}/>
   <Chart title="镜像缓存数量" labels={labels} values={cache}/>
  </div>
 </div>;
}
