import React,{useMemo,useState} from 'react';
import {Card,Input,Select,Button,Checkbox,Tag} from '@tencent/tea-component';
import ReactECharts from 'echarts-for-react';
import {Instance,download} from './data';
import PlatformSummary from './PlatformSummary';
const metrics=[['CPU 使用率百分比','%'],['CPU 使用核数','核'],['磁盘读取速率','Bytes/s'],['磁盘写入速率','Bytes/s'],['文件系统使用率','%'],['文件系统使用量','Bytes'],['内存使用率','%'],['内存使用量','Bytes'],['网络入流量','Bytes/s'],['网络出流量','Bytes/s']];
/** ECharts interactions adapted from platform SystemDiskObserve.vue. */
export default function Monitor({instances}:{instances:Instance[]}){
 const [draft,D]=useState(''),[query,Q]=useState(''),[range,R]=useState('1'),[grain,G]=useState('1'),[compare,C]=useState(false),[short,S]=useState(true),[refreshed,F]=useState(Date.now());
 const running=instances.filter(i=>i.status==='运行中');
 const seed=running.reduce((n,i)=>n+[...i.id].reduce((s,c)=>s+c.charCodeAt(0),0),0);
 const series=useMemo(()=>{
  const minutes=Number(range)*60,step=Math.max(Number(grain),Math.ceil(minutes/1500)),count=Math.floor(minutes/step)+1;
  return metrics.map(([name,unit],m)=>({name,unit,points:running.length?Array.from({length:count},(_,i)=>{
   const wave=25+m*2+Math.sin(i/4+m+seed/17)*11+Math.cos(i/7+refreshed/100000)*4;
   const value=unit==='%'?Math.max(0,Math.min(100,wave)):unit==='核'?Math.max(0,wave/50*running.length):wave*(unit==='Bytes'?1024*1024:1024)*running.length;
   return [refreshed-(count-1-i)*step*60000,Number(value.toFixed(2))];
  }):[]}));
 },[range,grain,seed,refreshed,running.length]);
 const format=(v:number)=>short&&Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'M':short&&Math.abs(v)>=1000?(v/1000).toFixed(1)+'K':Number(v.toFixed(2)).toLocaleString();
 const visible=series.filter(m=>m.name.toLowerCase().includes(query.toLowerCase()));
 const reset=()=>{D('');Q('');R('1');G('1');C(false)};
 return <><PlatformSummary items={[{label:'监控实例',value:instances.length},{label:'运行中',value:running.length},{label:'监控指标',value:metrics.length},{label:'已停止',value:instances.filter(i=>i.status==='已停止').length}]}/><Card><Card.Body>
 <div className="_platform-monitor-title"><h3>实例资源监控</h3><span className="_snap-muted">更新于 {new Date(refreshed).toLocaleTimeString('zh-CN',{hour12:false})}</span></div>
 <div className="_sandbox-monitor-bar _platform-monitor-filter"><label className="_platform-filter-field"><span>指标名称</span><Input value={draft} onChange={D} onKeyDown={e=>e.key==='Enter'&&Q(draft)} placeholder="搜索指标名称"/></label><label className="_platform-filter-field"><span>时间范围</span><Select appearance="button" value={range} onChange={v=>{R(v);G(v==='168'?'60':v==='24'?'5':'1')}} options={[{value:'1',text:'近 1 小时'},{value:'24',text:'近 24 小时'},{value:'168',text:'近 7 天'}]}/></label><label className="_platform-filter-field"><span>时间粒度</span><Select appearance="button" value={grain} onChange={G} options={[{value:'1',text:'1 分钟'},{value:'5',text:'5 分钟'},{value:'60',text:'1 小时'}]}/></label><Button type="primary" onClick={()=>Q(draft)}>查询</Button><Button onClick={reset}>重置</Button></div>
 <div className="_sandbox-monitor-bar"><Button onClick={()=>C(!compare)}>{compare?'取消时间对比':'时间对比'}</Button><Button icon="refresh" onClick={()=>F(Date.now())}>刷新</Button><Button onClick={()=>download('实例监控.json',{range,grain,instances:instances.map(i=>i.id),metrics:visible})}>下载数据</Button><Checkbox value={short} onChange={S}>数值自动缩写</Checkbox><Tag>演示数据</Tag></div>
 {!visible.length?<div className="_platform-empty">未找到匹配指标 <Button type="link" onClick={reset}>重置筛选</Button></div>:<div className="_sandbox-charts">{visible.map(({name,unit,points})=><section className="_sandbox-chart" key={name}><h4>{name}({unit})</h4><div className="_platform-chart-value">{points.length?format(points[points.length-1][1]):'—'} <small>{unit}</small></div><ReactECharts className="_platform-chart" style={{height:260,width:'100%'}} notMerge option={{animation:false,color:['#0052d9','#00a870'],tooltip:{trigger:'axis',valueFormatter:(value:number)=>format(value)+' '+unit},legend:{show:compare,data:['当前周期','上一周期'],top:0,right:0},grid:{left:58,right:18,top:32,bottom:55},xAxis:{type:'time',axisLabel:{color:'#909399',fontSize:10},axisLine:{lineStyle:{color:'#dcdfe6'}}},yAxis:{type:'value',max:unit==='%'?100:undefined,axisLabel:{color:'#909399',formatter:format},splitLine:{lineStyle:{color:'#ebeef5',type:'dashed'}}},dataZoom:[{type:'inside',filterMode:'none'},{type:'slider',height:14,bottom:5,borderColor:'#ebeef5'}],series:[{name:'当前周期',type:'line',smooth:true,showSymbol:false,data:points,areaStyle:{opacity:.06}},...(compare?[{name:'上一周期',type:'line',smooth:true,showSymbol:false,lineStyle:{type:'dashed'},data:points.map(([t,v])=>[t,Number((v*.84).toFixed(2))])}]:[])],graphic:points.length?[]:[{type:'text',left:'center',top:'middle',style:{text:'暂无运行中实例的数据',fill:'#909399',fontSize:12}}]}}/></section>)}</div>}
 </Card.Body></Card></>
}
