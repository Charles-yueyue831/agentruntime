import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, Justify, Button, MetricsBoard, Table, Bubble, Alert, DatePicker, TagSearchBox, message } from '@tencent/tea-component';
import MonitorTimeRange, {parseMonitorTime} from './MonitorTimeRange';
import moment from 'moment';
import type {RangeDateType} from '@tencent/tea-component/lib/calendar/DateProps';
import ReactECharts from 'echarts-for-react';
import type {TagValue} from '@tencent/tea-component/lib/tagsearchbox';
import { Build, Snapshot } from '../types';


const descriptions:Record<string,string>={
'创建请求数':'统计一定时间范围内模板快照制作任务的创建请求数量',
'创建量趋势':'统计各采样时刻模板快照制作任务的创建请求数量',
'当前等待处理数量':'统计当前时刻等待执行的模板快照制作任务的数量',
'当前制作中数量':'统计当前时刻正在制作模板快照的模板快照制作任务的数量',
'制作成功数量':'统计一定时间范围内模板快照制作成功的数量',
'制作中数量趋势':'统计一定时间范围内正在制作模板快照的模板快照制作任务的数量',
'制作失败数量':'统计一定时间范围内模板快照制作任务执行失败的数量',
'取消数量':'统计一定时间范围内模板快照制作任务取消执行的数量',
'超时数量':'统计一定时间范围内模板快照制作任务执行超时的数量',
'当前模板快照总数':'统计当前模板快照列表中的快照总数，不受时间范围影响',
'当前可用快照':'统计当前状态为可用的模板快照数量，不受时间范围影响',
'制作成功率':'所选时间范围内完成的任务中，制作成功任务数占全部已结束任务数的比例'
};
function MetricTitle({name}:{name:string}){return <span className="_monitor-metric-label">{name}<Bubble content={descriptions[name]}><Button icon="info" aria-label={name+'说明'}/></Bubble></span>}
/** 图例色板：只用 Tea Design Token，禁止硬编码色值 */
type Tone = 'brand' | 'success' | 'error' | 'warning' | 'neutral';

/** 图表由与用量页一致的 ECharts 组件渲染。 */
function LineChart({ times, values, tone, unit, start, end, step }: { times: number[]; values: number[]; tone: Tone; unit: string; start:number; end:number; step:number }) {
  const formatTick=(value:number)=>{const edgeGap=(end-start)*0.15;if((value>start&&value<start+edgeGap)||(value<end&&value>end-edgeGap))return '';return end-start<=3600000?moment(value).format('HH:mm'):moment(value).format('MM-DD')+'\n'+moment(value).format('HH:mm');};
  return <ReactECharts notMerge style={{height:260,width:'100%'}} option={{
    animation:false,color:[tone==='success'?'#00a870':'#0052d9'],
    tooltip:{trigger:'axis',axisPointer:{label:{formatter:(p:{value:number})=>moment(p.value).format('YYYY-MM-DD HH:mm:ss')}},formatter:(items:{value:[number,number]}[])=>{const point=items[0]?.value;return point?`${moment(point[0]).format('YYYY-MM-DD HH:mm:ss')}<br/>任务数量：${point[1]} ${unit}`:'';}},
    grid:{left:44,right:32,top:24,bottom:56},
    xAxis:{type:'time',min:start,max:end,minInterval:step,splitNumber:3,boundaryGap:false,axisTick:{show:false},axisLine:{lineStyle:{color:'#ddd'}},axisLabel:{color:'#888',hideOverlap:true,showMinLabel:true,showMaxLabel:true,formatter:formatTick}},
    yAxis:{type:'value',min:0,minInterval:1,splitLine:{lineStyle:{color:'#eee'}},axisLabel:{color:'#888'}},
    series:[{name:'任务数量',type:'line',smooth:false,showSymbol:false,data:times.map((time,i)=>[time,values[i]]),encode:{x:0,y:1},lineStyle:{width:2}}]
  }}/>;
}

function BarChart({ items }: { items: { label: string; value: number; tone: Tone }[] }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="_snap-bars">
      {items.map(i => (
        <div key={i.label} className="_snap-bar-row">
          <span className="_snap-bar-label"><MetricTitle name={i.label}/></span>
          <progress className={`_snap-result-progress _snap-tone-${i.tone}`} max={max} value={i.value} aria-label={i.label} />
          <b className="_snap-bar-value">{i.value} <small>个</small></b>
        </div>
      ))}
    </div>
  );
}

export default function MonitorPanel({ tools, builds, snapshots, onRefresh, active }: { tools: string[]; builds: Build[]; snapshots: Snapshot[]; onRefresh:()=>void; active:boolean }) {
  const [dateRange,setDateRange]=useState<RangeDateType>(()=>[moment().subtract(24,'hours'),moment()]);

  const hours=dateRange[1].diff(dateRange[0],'hours');
  const range=hours<=1?'1h':hours<=24?'24h':hours<=168?'7d':'30d';
  const allowed={ '1h':['1m','5m'],'24h':['1m','5m','1h'],'7d':['1h','1d'],'30d':['1h','1d']}[range];
  const [granularity,setGranularity]=useState('1m');
  const grainLabels:Record<string,string>={'1m':'1分钟','5m':'5分钟','1h':'1小时','1d':'1天'};
  const expression=useRef({from:'now-24h',to:'now'});
  const changeRange=(value:RangeDateType,next:{from:string;to:string})=>{expression.current=next;setAsOf(Date.now());const h=value[1].diff(value[0],'hours');setDateRange(value);setGranularity(h<=24?'1m':'1h');};
  const [tags,setTags]=useState<TagValue[]>([]);
  const [metadata,setMetadata]=useState<Record<string,{tags?:string;toolType?:string}>>(()=>{try{return JSON.parse(localStorage.getItem('snapshot-demo-v2-tool-meta')||'{}')}catch{return {}}});
  useEffect(()=>{const load=()=>{try{setMetadata(JSON.parse(localStorage.getItem('snapshot-demo-v2-tool-meta')||'{}'))}catch{}};window.addEventListener('storage',load);window.addEventListener('focus',load);load();return()=>{window.removeEventListener('storage',load);window.removeEventListener('focus',load)}},[builds,snapshots]);
  const tagPairs=(id:string)=>(metadata[id]?.tags??'env:demo').split(/[,，;；\n]+/).map(x=>{const at=x.search(/[:：=]/);return at<0?[]:[x.slice(0,at).trim(),x.slice(at+1).trim()]}).filter(x=>x.length===2&&x[0]);
  const ids=Array.from(new Set([...builds,...snapshots].map(b=>b.toolId)));
  const keys=Array.from(new Set(ids.flatMap(id=>tagPairs(id).map(p=>p[0]))));
  const toolType=(id:string)=>metadata[id]?.toolType||'自定义沙箱';
  const attributes=[{key:'type',name:'模板类型',type:'multiple' as const,values:Array.from(new Set(ids.map(toolType))).map(name=>({key:name,name}))},{key:'id',name:'模板编号',type:'multiple' as const,values:ids.map(id=>({key:id,name:id}))},{key:'tool',name:'沙箱模板',type:'multiple' as const,values:tools.map(t=>({key:t,name:t}))},...keys.map(key=>({key:'tag:'+key,name:'标签 · '+key,type:'multiple' as const,values:Array.from(new Set(ids.flatMap(id=>tagPairs(id).filter(p=>p[0]===key).map(p=>p[1])))).map(name=>({key:name,name}))}))];
  const changeTags=(value:TagValue[])=>{const grouped=new Map<string,TagValue>();value.forEach(t=>{const k=String(t.attr?.key||'');const previous=grouped.get(k);grouped.set(k,{...t,values:Array.from(new Map([...(previous?.values||[]),...(t.values||[])].map(v=>[v.key,v])).values())});});setTags([...grouped.values()])};
  const accepts=(b:Pick<Build,'tool'|'toolId'>)=>tags.every(t=>!t.values?.length||t.values.some(v=>{const key=String(t.attr?.key||'');return key==='type'?toolType(b.toolId)===v.key:key==='tool'?b.tool===v.key:key==='id'?b.toolId===v.key:key.startsWith('tag:')?tagPairs(b.toolId).some(p=>p[0]===key.slice(4)&&p[1]===v.key):b.tool.includes(String(v.key))}));

  const [asOf, setAsOf] = useState(Date.now());
  const refreshRef=useRef(onRefresh);refreshRef.current=onRefresh;
  const tick=()=>{const current=Date.now();setAsOf(current);setDateRange([parseMonitorTime(expression.current.from,current),parseMonitorTime(expression.current.to,current)]);};
  useEffect(()=>{tick();},[builds,snapshots]);
  useEffect(()=>{
    if(!active)return;
    const refresh=()=>{if(document.hidden)return;refreshRef.current();tick();};
    refresh();const timer=window.setInterval(refresh,5000);
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[active]);
  const start=dateRange[0].valueOf(), end=dateRange[1].valueOf();
  const duration=end-start;
  const step=({'1m':60000,'5m':300000,'1h':3600000,'1d':86400000})[granularity]||60000;
  const sampleCount=Math.ceil(duration/step)+1;
  const matching=builds.filter(accepts);
  const at=(b:Build)=>new Date(b.time.replace(' ','T')).getTime();
  const elapsed=(b:Build)=>((Number(b.duration.match(/(\d+)\s*分/)?.[1])||0)*60+(Number(b.duration.match(/(\d+)\s*秒/)?.[1])||0))*1000;
  const timestamp=(v:string)=>new Date(v.replace(' ','T')).getTime();
  const buildStart=(b:Build)=>b.startedAt===''?Infinity:b.startedAt?timestamp(b.startedAt):at(b);
  const buildEnd=(b:Build)=>b.finishedAt?timestamp(b.finishedAt):b.status==='Building'?asOf:b.status==='Success'&&snapshots.some(s=>s.build===b.id)?timestamp(snapshots.find(s=>s.build===b.id)!.time):at(b)+elapsed(b);
  const matchingSnapshots=snapshots.filter(accepts);
  const samples=Array.from({length:sampleCount},(_,i)=>Math.min(end,start+i*step));
  const filtered = matching.filter(b => new Date(b.time.replace(' ', 'T')).getTime() >= start && new Date(b.time.replace(' ', 'T')).getTime() <= end);
  const results=matching.filter(b=>['Success','Failed','Cancelled'].includes(b.status)&&buildEnd(b)>=start&&buildEnd(b)<=end);
  const count = (status: string) => results.filter(b => b.status === status).length;
  const metricTotals = {createRequests:filtered.length,pending:matching.filter(b=>b.status==='Pending'&&at(b)<=asOf).length,building:matching.filter(b=>b.status==='Building'&&at(b)<=asOf).length,success:count('Success'),failed:count('Failed'),cancelled:count('Cancelled'),timeout:results.filter(b => b.status === 'Failed' && /timeout/i.test(b.errorCode || '')).length};
  const metricSeries = {
    times:samples,
    created:samples.map((t,i)=>matching.filter(b=>at(b)>=t&&at(b)<(samples[i+1]||end+1)).length),
    concurrent:samples.map(t=>matching.filter(b=>b.status!=='Pending'&&buildStart(b)<=t&&(b.status==='Building'?t<=asOf:t<buildEnd(b))).length),
  };
  return (
    <div className="_snap-monitor">
      <Table.ActionPanel className="_snap-monitor-toolbar">
        <div className="_snap-monitor-filters">
          <TagSearchBox attributes={attributes} value={tags} onChange={changeTags} onClearButtonClick={()=>setTags([])} minWidth={180} hideHelp tips="选择模板类型、模板编号或标签进行查询"/>
          <MonitorTimeRange value={dateRange} onChange={changeRange}/>
          <Select className="_monitor-granularity" appearance="button" value={granularity} onChange={setGranularity} options={allowed.map(value=>({value,text:grainLabels[value]}))} button={<><span className="_snap-muted">时间粒度</span>　{grainLabels[granularity]}</>}/>
        </div>
        <div className="_snap-monitor-update"><span>实时更新 · 最近更新：{new Date(asOf).toLocaleTimeString('zh-CN',{hour12:false})}</span><Bubble content="刷新监控"><Button icon="refresh" aria-label="刷新监控" onClick={()=>{onRefresh();tick();}} /></Bubble></div>
      </Table.ActionPanel>
      {!filtered.length && !metricTotals.building && <Alert type="info">当前时间范围和模板下暂无制作任务，请调整筛选条件。</Alert>}

      <Card>
        <Card.Body>
          <div className="_snap-metrics">
            <MetricsBoard title={<MetricTitle name="创建请求数"/>} value={metricTotals.createRequests} unit="个" />
            <MetricsBoard title={<MetricTitle name="当前等待处理数量"/>} value={metricTotals.pending} unit="个" />
            <MetricsBoard title={<MetricTitle name="当前制作中数量"/>} value={metricTotals.building} unit="个" />
            
          </div>
          <div className="_snap-chart-grid">
            <div className="_snap-chart-card">
              <h3 className="_snap-chart-title"><MetricTitle name="创建量趋势"/><span className="_snap-muted">（个）</span></h3>
              <LineChart times={metricSeries.times} start={start} end={end} step={step} values={metricSeries.created} tone="brand" unit="个" />
            </div>
            <div className="_snap-chart-card">
              <h3 className="_snap-chart-title"><MetricTitle name="制作中数量趋势"/><span className="_snap-muted">（个）</span></h3>
              <LineChart times={metricSeries.times} start={start} end={end} step={step} values={metricSeries.concurrent} tone="success" unit="个" />
            </div>
          </div>
        </Card.Body>
        <Card.Body>
          <div className="_snap-metrics">
            <MetricsBoard title={<MetricTitle name="当前模板快照总数"/>} value={matchingSnapshots.length} unit="个"/>
            <MetricsBoard title={<MetricTitle name="当前可用快照"/>} value={matchingSnapshots.filter(s=>s.status==='Ready').length} unit="个"/>
            
            
          </div>
        </Card.Body>
        <Card.Body title="任务结果">
          <div className="_snap-result-grid">
            <BarChart
              items={[
                { label: '制作成功数量', value: metricTotals.success, tone: 'success' },
                { label: '制作失败数量', value: metricTotals.failed, tone: 'error' },
                { label: '取消数量', value: metricTotals.cancelled, tone: 'neutral' },
                { label: '超时数量', value: metricTotals.timeout, tone: 'warning' },
              ]}
            />
            <div className="_snap-result-side">
              <p className="_snap-chart-title"><MetricTitle name="制作成功率"/></p>
              <b className="_snap-big">{results.length ? ((metricTotals.success / results.length) * 100).toFixed(1) + '%' : '—'}</b>
            </div>
          </div>
        </Card.Body>
      </Card>

    </div>
  );
}
