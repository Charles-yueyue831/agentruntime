import React,{useState,useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Layout,Card,Table,Button,Form,Input,Select,Tag,Copy,Tabs,TabPanel,Modal,Alert,StatusTip,TagSearchBox,Dropdown,DropdownBox,Drawer,SearchBox,message,Bubble} from '@tencent/tea-component';
import type {TableColumn} from '@tencent/tea-component';
import type {TagValue} from '@tencent/tea-component/lib/tagsearchbox';
import {ToolVersion,Snapshot,imageRef} from '../types';
import {matchSnapshot,snapshotName} from '../model';
import {snapshots as initialSnapshots} from '../mock';
import {read,save,versions,fallbackMeta,ToolMeta,Instance,initialInstances,now,dateText,download} from './data';
import Monitor from './Monitor';
import ToolDetail from './ToolDetail';
import PlatformSummary from './PlatformSummary';
import './style.css';
const {Content}=Layout;
export default function SandboxPage(){
 const [params,P]=useSearchParams(); const area=params.get('area'),toolId=params.get('tool'),active=params.get('section')||(toolId?'detail':'instances');
 const [vs,V]=useState(versions),[metas,M]=useState<Record<string,ToolMeta>>(()=>read('tool-meta',{})),[instances,I]=useState<Instance[]>(()=>read('instances',initialInstances()));
 const [snapshotRows,SetSnapshots]=useState<Snapshot[]>(()=>read('snapshots',initialSnapshots));
 useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key==='snapshot-demo-v2-snapshots')SetSnapshots(read('snapshots',initialSnapshots));if(event.key==='snapshot-demo-v2-versions')V(versions());};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[]);
 const [tags,T]=useState<TagValue[]>([]),[selected,SS]=useState<string[]>([]),[days,Days]=useState('all'),[page,PG]=useState(1),[size,SZ]=useState(area==='templates'?30:10),[status,ST]=useState('all');
 const [draftQuery,DQ]=useState(''),[query,Q]=useState(''),[network,NW]=useState('all'),[lifeFilter,LF]=useState('all');
 const [modal,MO]=useState(''),[target,Target]=useState<Instance|null>(null),[launchTool,LT]=useState(toolId||''),[launchVersion,LV]=useState('default'),[timeout,TO]=useState('300'),[metadata,MD]=useState(''),[command,CMD]=useState(''),[image,IM]=useState(''),[tagText,TT]=useState(''),[editMeta,EM]=useState<ToolMeta|null>(null);
 useEffect(()=>save('instances',instances),[instances]);useEffect(()=>{save('versions',vs)},[vs]);useEffect(()=>save('tool-meta',metas),[metas]);
 useEffect(()=>{T([]);DQ('');Q('');NW('all');LF('all');PG(1);ST('all')},[area,toolId,active]);
 const tools=vs.filter((v,i,a)=>a.findIndex(x=>x.toolId===v.toolId)===i),tool=tools.find(t=>t.toolId===toolId),meta=tool?(metas[tool.toolId]||fallbackMeta(tool)):null;
 const navigate=(next:Record<string,string>)=>P(next);const openTool=(id:string,section='detail')=>navigate({area:'templates',tool:id,section});
 const openInstances=(id:string)=>navigate({area:'instance',filterTool:id});
 const filterTool=toolId||params.get('filterTool')||'all';
 const searched=(item:unknown)=>query.trim().toLowerCase().split(/\s+/).every(word=>JSON.stringify(item).toLowerCase().includes(word));
 const templateAttributes:import('@tencent/tea-component/lib/tagsearchbox').AttributeValue[]=[{key:'keyword',name:'关键词',type:'input'},{key:'toolId',name:'模板 ID',type:'input'},{key:'tool',name:'模板名称',type:'input'},{key:'network',name:'网络策略',type:'multiple',values:['公网','沙箱内网','VPC网络'].map(name=>({key:name,name}))},{key:'life',name:'生命周期',type:'multiple',values:['限时沙箱','常驻沙箱'].map(name=>({key:name,name}))},{key:'tags',name:'腾讯云标签',type:'input'}];
 const matchesTags=(v:ToolVersion)=>{const data={...v,...(metas[v.toolId]||fallbackMeta(v))};return tags.every(tag=>{const key=tag.attr?.key;const content=key&&key!=='keyword'?String(data[key as keyof typeof data]||''):JSON.stringify(data);return (tag.values||[]).some(value=>content.toLowerCase().includes(value.name.toLowerCase()))})};
 const filteredTools=tools.filter(v=>matchesTags(v)&&searched({...v,...(metas[v.toolId]||fallbackMeta(v))})&&(network==='all'||(metas[v.toolId]||fallbackMeta(v)).network===network)&&(lifeFilter==='all'||(metas[v.toolId]||fallbackMeta(v)).life===lifeFilter));
 const instanceAttributes:import('@tencent/tea-component/lib/tagsearchbox').AttributeValue[]=[
  {key:'keyword',name:'关键词',type:'input'},
  {key:'id',name:'实例 ID',type:'input'},
  {key:'toolId',name:'沙箱模板',type:'multiple',values:tools.map(v=>({key:v.toolId,name:v.tool}))},
  {key:'status',name:'状态',type:'multiple',values:['运行中','已暂停','已停止'].map(name=>({key:name,name}))},
  {key:'created',name:'创建时间',type:'single',values:[{key:'1',name:'近1天'},{key:'7',name:'近7天'},{key:'30',name:'近30天'}]},
  {key:'metadata',name:'Metadata',type:'input'}
 ];
 const instanceTags:TagValue[]=filterTool==='all'?tags:[{attr:instanceAttributes.find(a=>a.key==='toolId'),values:[{key:filterTool,name:tools.find(t=>t.toolId===filterTool)?.tool||filterTool}]},...tags];
 const changeInstanceTags=(value:TagValue[])=>{T(value);PG(1);Q('');DQ('');ST('all');Days('all');if(params.has('filterTool')){const next=new URLSearchParams(params);next.delete('filterTool');P(next,{replace:true})}};
 const matchesInstanceTags=(item:Instance)=>tags.every(tag=>(tag.values||[]).some(value=>{
  const key=tag.attr?.key;
  if(key==='toolId')return item.toolId===value.key;
  if(key==='status')return item.status===(value.key||value.name);
  if(key==='created')return Date.parse(item.created)>=Date.now()-Number(value.key)*86400000;
  const content=key==='id'?item.id:key==='metadata'?item.metadata:JSON.stringify({...item,tool:tools.find(t=>t.toolId===item.toolId)?.tool});
  return value.name.toLowerCase().trim().split(/\s+/).every(word=>String(content||'').toLowerCase().includes(word));
 }));
 const rows=instances.filter(i=>(active==='monitor'||matchesInstanceTags(i))&&(filterTool==='all'||i.toolId===filterTool)&&(!params.get('instance')||i.id===params.get('instance'))&&(status==='all'||i.status===status)&&searched({...i,tool:tools.find(t=>t.toolId===i.toolId)?.tool})&&(active==='monitor'||days==='all'||Date.parse(i.created)>=Date.now()-Number(days)*86400000));
 /** 列表规范：筛选无结果时必须给出「清空筛选条件」入口，而不是只显示"暂无数据" */
 const hasFilter=(area==='instance'&&filterTool!=='all')||tags.length>0||!!query||network!=='all'||lifeFilter!=='all'||status!=='all';
 const resetFilters=()=>{T([]);DQ('');Q('');NW('all');LF('all');ST('all');Days('all');PG(1);if(area==='instance'&&active==='instances'&&params.has('filterTool')){const next=new URLSearchParams(params);next.delete('filterTool');P(next,{replace:true})}};
 const addons=(width:number,emptyText:React.ReactNode='暂无数据')=>[Table.addons.autotip({isLoading:false,emptyText,isFound:hasFilter,foundKeyword:hasFilter?'当前筛选条件':undefined,onClear:resetFilters}),Table.addons.pageable({pageIndex:page,pageSize:size,pageSizeOptions:area==='templates'?[30,50,100,200]:[10,20,50,100],onPagingChange:n=>{PG(n.pageIndex||1);SZ(n.pageSize||(area==='templates'?30:10))}}),Table.addons.scrollable({minWidth:width})];
 const search=<><label className="_platform-filter-field"><span>{area==='templates'?'模板 ID / 名称':'实例 ID / 关键词'}</span><Input value={draftQuery} onChange={DQ} placeholder={area==='templates'?'搜索模板 ID、名称或标签':'搜索实例 ID 或 Metadata'} onKeyDown={e=>{if(e.key==='Enter'){Q(draftQuery);PG(1)}}}/></label>{area==='templates'&&!toolId&&<><label className="_platform-filter-field"><span>网络策略</span><Select appearance="button" value={network} onChange={v=>{NW(v);PG(1)}} options={['all','公网','沙箱内网','VPC网络'].map(v=>({value:v,text:v==='all'?'全部':v}))}/></label><label className="_platform-filter-field"><span>生命周期</span><Select appearance="button" value={lifeFilter} onChange={v=>{LF(v);PG(1)}} options={['all','限时沙箱','常驻沙箱'].map(v=>({value:v,text:v==='all'?'全部':v}))}/></label></>}<Button type="primary" onClick={()=>{Q(draftQuery);PG(1)}}>查询</Button><Button onClick={resetFilters}>重置</Button></>;

 const launchTemplate=vs.find(v=>v.toolId===launchTool&&v.toolTag===launchVersion);
 const defaultCommand=launchTemplate?(metas[launchTemplate.toolId]||fallbackMeta(launchTemplate)).command:'';
 const matchedSnapshot=matchSnapshot(launchTemplate,snapshotRows,image,command,defaultCommand);
 const start=(id=filterTool)=>{const v=vs.find(v=>v.toolId===id)||tools[0];if(!v)return;LT(v.toolId);LV(v.toolTag);TO('300');MD('');CMD((metas[v.toolId]||fallbackMeta(v)).command);IM(imageRef(v));SetSnapshots(read('snapshots',initialSnapshots));MO('launch')};
 const refresh=()=>{V(versions());I(read('instances',initialInstances()));M(read('tool-meta',{}));message.success({content:'列表已刷新'})};
 const saveInstance=()=>{
  if(!Number.isInteger(Number(timeout))||Number(timeout)<=0){message.error({content:'请输入大于 0 的超时时间（秒）'});return}
  const v=vs.find(v=>v.toolId===launchTool&&v.toolTag===launchVersion);
  if(!v||!v.imageRepo){message.error({content:'请选择镜像配置完整的模板及版本'});return}
  const t=now(),freshSnapshots=read<Snapshot[]>('snapshots',initialSnapshots);
  const hit=matchSnapshot(v,freshSnapshots,image,command,(metas[v.toolId]||fallbackMeta(v)).command);
  I(old=>[{id:'sbi-'+Date.now().toString(16),toolId:v.toolId,toolTag:v.toolTag,status:'运行中',created:t,updated:t,expires:dateText(Date.now()+Number(timeout)*1000),timeout:Number(timeout),metadata,image:image||imageRef(v),command:command||(metas[v.toolId]||fallbackMeta(v)).command,snapshot:hit?.id},...old]);
  if(hit){const next=freshSnapshots.map(s=>s.id===hit.id?{...s,uses:s.uses+1,lastUseTime:t}:s);save('snapshots',next);SetSnapshots(next)}
  MO('');navigate({area:'instance',filterTool:v.toolId});message.success({content:hit?'实例已启动，已命中模板快照（演示）':'实例已启动，未命中模板快照（演示）'});
 };
 const changeInstance=async(i:Instance,next:string)=>{if(!await Modal.confirm({message:`确认${next==='已停止'?'停止':next==='已暂停'?'暂停':'恢复'}实例 ${i.id}？`,description:'此操作仅更新原型中的演示实例。'}))return;I(list=>list.map(x=>x.id===i.id?{...x,status:next,updated:now(),expires:next==='已停止'?'—':dateText(Date.now()+x.timeout*1000)}:x))};
 const clone=(v:ToolVersion)=>navigate({view:'create',clone:v.toolId});
 const remove=async(v:ToolVersion)=>{if(instances.some(i=>i.toolId===v.toolId&&i.status!=='已停止')){Modal.alert({message:'该模板仍有运行中或已暂停的实例，请先停止相关实例。'});return}if(await Modal.confirm({message:`删除沙箱模板「${v.tool}」？`,description:'删除后该模板将从原型列表移除。'})){V(old=>old.filter(x=>x.toolId!==v.toolId));I(old=>old.filter(x=>x.toolId!==v.toolId))}};
 const toolColumns:TableColumn<ToolVersion>[]=[
 {key:'name',header:'ID/名称',width:215,render:v=><div><Button type="link" onClick={()=>openTool(v.toolId)}>{v.toolId}</Button> <Copy text={v.toolId}/><p className="_ags-muted">{v.tool} <Copy text={v.tool}/></p></div>},
 {key:'status',header:'状态',width:85,render:v=><StatusTip.InstanceTip status="running">{(metas[v.toolId]||fallbackMeta(v)).status}</StatusTip.InstanceTip>},
 {key:'type',header:'类型',width:110,render:()=> '自定义沙箱'},
 {key:'life',header:'生命周期类型',width:110,render:v=><Tag>{(metas[v.toolId]||fallbackMeta(v)).life}</Tag>},
 {key:'image',header:'镜像',width:270,render:v=><span className="_sandbox-wrap _gpu-tool-image" title={v.imageRepo+':'+v.imageTag}>{v.imageRepo}:{v.imageTag}</span>},
 {key:'network',header:'网络策略',width:100,render:v=>(metas[v.toolId]||fallbackMeta(v)).network},
 {key:'tags',header:'腾讯云标签',width:120,render:v=><Tag>{(metas[v.toolId]||fallbackMeta(v)).tags||'—'}</Tag>},
 {key:'created',header:'创建时间',width:170,render:v=>(metas[v.toolId]||fallbackMeta(v)).created},
 {key:'updated',header:'更新时间',width:170},
 {key:'actions',header:'操作',width:220,fixed:'right',render:v=><div className="_snap-actions"><Button type="link" onClick={()=>openInstances(v.toolId)}>实例管理</Button><Button type="link" onClick={()=>clone(v)}>克隆</Button><Button type="link" onClick={()=>remove(v)}>删除</Button></div>}];
 const instanceColumns:TableColumn<Instance>[]=[
 {key:'id',header:'实例ID',width:210,render:i=><div><Button type="link" onClick={()=>{Target(i);MO('config')}}>{i.id}</Button> <Copy text={i.id}/><p><Button type="link" onClick={()=>{Target(i);MO('config')}}>查看配置</Button></p></div>},
 {key:'tool',header:'沙箱模板',width:165,render:i=><Button type="link" onClick={()=>openTool(i.toolId)}>{tools.find(t=>t.toolId===i.toolId)?.tool||i.toolId}</Button>},
 {key:'toolTag',header:'模板版本',width:110},{key:'snapshot',header:'模板快照',width:160,render:i=>i.snapshot?<Button type="link" onClick={()=>navigate({tab:'snapshots',snapshot:i.snapshot!})}>{i.snapshot}</Button>:'—'},
 {key:'monitor',header:'监控',width:70,render:i=><Button type="link" onClick={()=>navigate({area:'instance',filterTool:i.toolId,section:'monitor',instance:i.id})}>监控</Button>},
 {key:'status',header:'状态',width:95,render:i=><StatusTip.InstanceTip status={i.status==='运行中'?'running':i.status==='已暂停'?'warning':'closed'}>{i.status}</StatusTip.InstanceTip>},
 {key:'created',header:'创建时间',width:170},{key:'updated',header:'更新时间',width:170},{key:'expires',header:'过期时间',width:170},
 {key:'timeout',header:'超时时间',width:90,render:i=>i.timeout+'秒'},{key:'metadata',header:'Metadata',width:150},
 {key:'actions',header:'操作',width:260,fixed:'right',render:i=><div className="_snap-actions"><Button type="link" disabled={i.status!=='运行中'} onClick={()=>{Target(i);MO('terminal')}}>登录实例</Button><Button type="link" disabled={i.status!=='运行中'} onClick={()=>{Target(i);MO('token')}}>获取 Token</Button><Dropdown button="更多" appearance="link"><DropdownBox><Button type="link" disabled={i.status==='已停止'} onClick={()=>changeInstance(i,i.status==='已暂停'?'运行中':'已暂停')}>{i.status==='已暂停'?'恢复':'暂停'}</Button><Button type="link" disabled={i.status==='已停止'} onClick={()=>{Target(i);TO(String(i.timeout));MO('timeout')}}>修改超时时间</Button><Button type="link" disabled={i.status==='已停止'} onClick={()=>changeInstance(i,'已停止')}>停止实例</Button></DropdownBox></Dropdown></div>}];
 const scopedInstances=instances.filter(i=>filterTool==='all'||i.toolId===filterTool);
 const instanceList=<div className="console-list-body _instance-console-list"><Table.ActionPanel><div className="_instance-actions"><Button type="primary" onClick={()=>start()}>启动实例</Button><div className="_instance-search-tools"><TagSearchBox attributes={instanceAttributes} value={instanceTags} onChange={changeInstanceTags} onClearButtonClick={()=>changeInstanceTags([])} tips="搜索实例 ID、模板名称或选择筛选条件" attributesSelectTips="选择筛选字段" minWidth="100%" hideHelp/><Button icon="refresh" aria-label="刷新实例列表" onClick={refresh}/><Button icon="download" aria-label="下载实例列表" onClick={()=>download('沙箱实例.json',rows)}/></div></div></Table.ActionPanel><Card><Table records={rows} columns={instanceColumns} recordKey="id" addons={addons(1650)}/></Card></div>;
 return <Content className="_sandbox-page"><Content.Header title={tool?'沙箱模板详情':area==='instance'?'沙箱实例':'沙箱模板'} showBackButton={!!tool} onBackButtonClick={()=>navigate({area:'templates'})}><span>地域</span> <Select appearance="button" value="gz" options={[{value:'gz',text:'广州'}]}/></Content.Header><Content.Body full>
 {area==='templates'&&!toolId?<div className="console-list-body _gpu-tools-list _tea-template-list"><Table.ActionPanel><div className="_tea-template-primary"><Button type="primary" onClick={()=>navigate({view:'create'})}>新建沙箱模板</Button><Bubble content={!selected.length?'请先选择沙箱模板':undefined}><Button disabled={!selected.length} onClick={()=>{TT('');MO('tags')}}>批量编辑标签{selected.length?' ('+selected.length+')':''}</Button></Bubble></div><div className="_tea-template-search"><TagSearchBox attributes={templateAttributes} value={tags} onChange={v=>{T(v);PG(1);SS([])}} onClearButtonClick={()=>{resetFilters();SS([])}} minWidth="360px" hideHelp tips="搜索模板 ID、名称、网络策略或标签" attributesSelectTips="选择筛选字段"/><div className="_tea-template-tools"><Bubble content="刷新"><Button icon="refresh" aria-label="刷新" onClick={refresh}/></Bubble><Bubble content="下载列表"><Button icon="download" aria-label="下载列表" onClick={()=>download('沙箱模板.json',filteredTools)}/></Bubble></div></div></Table.ActionPanel><Card><Table records={filteredTools} columns={toolColumns} recordKey="toolId" addons={[Table.addons.selectable({value:selected,onChange:SS}),...addons(1550)]}/></Card></div>:toolId&&!tool?<Card><Card.Body><Alert type="warning">关联的沙箱模板不存在或已删除。</Alert><Button onClick={()=>navigate({area:'templates'})}>返回沙箱模板</Button></Card.Body></Card>:tool&&meta?<ToolDetail tool={tool} meta={meta} versions={vs} navigate={navigate} onEdit={()=>{EM({...meta});MO('edit')}}/>:<Tabs activeId={active} onActive={t=>{const n=new URLSearchParams(params);if(t.id==='instances')n.delete('section');else n.set('section',t.id);n.delete('instance');P(n)}} tabs={[{id:'instances',label:'实例列表'},{id:'monitor',label:'监控'}]}>

 <TabPanel id="instances">{instanceList}</TabPanel><TabPanel id="monitor"><div className="console-list-body"><div className="_sandbox-toolbar"><Select appearance="button" value={filterTool} onChange={v=>navigate({area:'instance',filterTool:v,section:'monitor'})} options={[{value:'all',text:'全部沙箱模板'},...tools.map(v=>({value:v.toolId,text:v.tool}))]}/><Select appearance="button" value={params.get('instance')||'all'} onChange={v=>{const n=new URLSearchParams(params);v==='all'?n.delete('instance'):n.set('instance',v);P(n)}} options={[{value:'all',text:'全部实例'},...instances.filter(i=>filterTool==='all'||i.toolId===filterTool).map(i=>({value:i.id,text:i.id}))]}/></div><Monitor instances={rows}/></div></TabPanel></Tabs>}
 </Content.Body>
 <Modal visible={modal==='launch'} caption="启动实例" size="l" onClose={()=>MO('')}><Modal.Body>
  <Alert type="info">沿用沙箱模板默认配置，填写非空内容后覆盖对应配置。</Alert>
  <Form layout="flex" fixedLabelWidth={140}>
   <Form.Item label="模板名称" required><Select appearance="button" size="l" value={launchTool} onChange={id=>{const v=vs.find(x=>x.toolId===id);if(!v)return;LT(id);LV(v.toolTag);IM(imageRef(v));CMD((metas[id]||fallbackMeta(v)).command)}} options={tools.map(t=>({value:t.toolId,text:t.tool}))}/></Form.Item>
   <Form.Item label="模板版本"><Select appearance="button" size="l" value={launchVersion} onChange={tag=>{const v=vs.find(x=>x.toolId===launchTool&&x.toolTag===tag);if(!v)return;LV(tag);IM(imageRef(v));CMD((metas[v.toolId]||fallbackMeta(v)).command)}} options={vs.filter(v=>v.toolId===launchTool).map(v=>({value:v.toolTag,text:v.toolTag}))}/></Form.Item>
   {launchTemplate&&<Form.Item label="命中模板快照"><Form.Text><Tag theme={matchedSnapshot?'success':'default'}>{matchedSnapshot?'已命中':'未命中'}</Tag></Form.Text></Form.Item>}
   {matchedSnapshot&&<Form.Item label="模板快照"><Form.Text><Button type="link" onClick={()=>{MO('');navigate({tab:'snapshots',snapshot:matchedSnapshot.id})}}>{snapshotName(matchedSnapshot)}</Button></Form.Text></Form.Item>}
   <Form.Item label="认证模式"><Form.Text>继承沙箱配置</Form.Text></Form.Item>
   <Form.Item label="超时时间（秒）"><Input value={timeout} onChange={TO}/></Form.Item>
   <Form.Item label="镜像"><Input size="full" value={image} onChange={IM}/></Form.Item>
   <Form.Item label="启动命令"><Input multiline value={command} onChange={CMD}/></Form.Item>
   <Form.Item label="Metadata"><Input value={metadata} onChange={MD} placeholder="例如 env: test"/></Form.Item>
  </Form>
 </Modal.Body><Modal.Footer><Button type="primary" onClick={saveInstance}>确认启动</Button><Button onClick={()=>MO('')}>取消</Button></Modal.Footer></Modal>
 <Modal visible={modal==='tags'} caption="批量编辑标签" onClose={()=>MO('')}><Modal.Body><Form><Form.Item label="腾讯云标签"><Input value={tagText} onChange={TT} placeholder="例如 env: prod"/></Form.Item></Form></Modal.Body><Modal.Footer><Button type="primary" onClick={()=>{M(old=>{const n={...old};tools.filter(t=>selected.includes(t.toolId)).forEach(t=>n[t.toolId]={...(old[t.toolId]||fallbackMeta(t)),tags:tagText});return n});MO('')}}>保存</Button><Button onClick={()=>MO('')}>取消</Button></Modal.Footer></Modal>
 <Modal visible={modal==='edit'} caption="更新自定义配置" onClose={()=>MO('')}><Modal.Body>{editMeta&&<Form layout="flex" fixedLabelWidth={120}>{(['cpu','memory','network','command','description','tags'] as const).map((key,i)=><Form.Item key={key} label={['CPU','内存','网络策略','启动命令','描述','腾讯云标签'][i]}><Input value={editMeta[key]} onChange={v=>EM({...editMeta,[key]:v})}/></Form.Item>)}</Form>}</Modal.Body><Modal.Footer><Button type="primary" onClick={()=>{if(tool&&editMeta){M(old=>({...old,[tool.toolId]:{...editMeta,advancedConfig:editMeta.advancedConfig?{...editMeta.advancedConfig,cpu:editMeta.cpu,memory:editMeta.memory,network:editMeta.network,commands:editMeta.command.split('\n'),description:editMeta.description,tagText:editMeta.tags}:undefined}}));V(old=>old.map(v=>v.toolId===tool.toolId?{...v,hash:Date.now().toString(16),updated:now()}:v))}MO('')}}>保存</Button><Button onClick={()=>MO('')}>取消</Button></Modal.Footer></Modal>
 <Modal visible={['token','terminal','timeout'].includes(modal)} caption={modal==='config'?'实例自定义配置':modal==='token'?'获取 Token':modal==='terminal'?'登录实例':'修改超时时间'} size="l" onClose={()=>MO('')}><Modal.Body>{target&&<><p className="_sandbox-instance-heading">{target.id}</p>{modal==='config'?<Form readonly layout="flex" fixedLabelWidth={140}><Form.Item label="沙箱模板"><Form.Text><Button type="link" onClick={()=>{MO('');openTool(target.toolId)}}>{tools.find(t=>t.toolId===target.toolId)?.tool}</Button></Form.Text></Form.Item><Form.Item label="模板版本"><Form.Text>{target.toolTag}</Form.Text></Form.Item><Form.Item label="模板快照"><Form.Text>{target.snapshot?<Button type="link" onClick={()=>{MO('');navigate({tab:'snapshots',snapshot:target.snapshot!})}}>{target.snapshot}</Button>:'未使用模板快照'}</Form.Text></Form.Item><Form.Item label="制作任务"><Form.Text>{(()=>{const snap=read<any[]>('snapshots',[]).find(s=>s.id===target.snapshot);return snap?<Button type="link" onClick={()=>{MO('');navigate({tab:'builds',build:snap.build})}}>{snap.build}</Button>:'—'})()}</Form.Text></Form.Item><Form.Item label="镜像地址"><Form.Text>{target.image}</Form.Text></Form.Item><Form.Item label="CPU / 内存"><Form.Text>{metas[target.toolId]?.cpu||'2'} 核 / {metas[target.toolId]?.memory||'4Gi'}</Form.Text></Form.Item><Form.Item label="启动命令"><Form.Text>{target.command}</Form.Text></Form.Item><Form.Item label="Metadata"><Form.Text>{target.metadata||'—'}</Form.Text></Form.Item></Form>:modal==='timeout'?<Input value={timeout} onChange={TO}/>:modal==='token'?<><Alert type="info">以下为演示 Token，仅用于展示，不具备真实访问权限。</Alert><code>demo-token-{target.id}</code> <Copy text={'demo-token-'+target.id}/></>:<><Alert type="info">原型终端预览，不连接真实云实例。</Alert><pre className="_sandbox-terminal">{`Connected to ${target.id}\n$ hostname\n${target.id}\n$ _`}</pre></>}</>}</Modal.Body><Modal.Footer>{modal==='timeout'&&<Button type="primary" onClick={()=>{if(!Number.isInteger(Number(timeout))||Number(timeout)<=0){message.error({content:'请输入正整数秒数'});return}I(old=>old.map(i=>i.id===target?.id?{...i,timeout:Number(timeout),expires:dateText(Date.now()+Number(timeout)*1000),updated:now()}:i));MO('')}}>保存</Button>}<Button onClick={()=>MO('')}>关闭</Button></Modal.Footer></Modal>
 <Drawer visible={modal==='config'} title="实例自定义配置" subtitle={target?.id} size="xm" showMask onClose={()=>MO('')} className="_platform-detail-drawer" footer={<Button onClick={()=>MO('')}>关闭</Button>}>
 {target&&<Form readonly layout="flex" fixedLabelWidth={140}><Form.Item label="沙箱模板"><Form.Text><Button type="link" onClick={()=>{MO('');openTool(target.toolId)}}>{tools.find(t=>t.toolId===target.toolId)?.tool}</Button></Form.Text></Form.Item><Form.Item label="模板版本"><Form.Text>{target.toolTag}</Form.Text></Form.Item><Form.Item label="模板快照"><Form.Text>{target.snapshot?<Button type="link" onClick={()=>{MO('');navigate({tab:'snapshots',snapshot:target.snapshot!})}}>{target.snapshot}</Button>:'未使用模板快照'}</Form.Text></Form.Item><Form.Item label="制作任务"><Form.Text>{(()=>{const snap=read<any[]>('snapshots',[]).find(s=>s.id===target.snapshot);return snap?<Button type="link" onClick={()=>{MO('');navigate({tab:'builds',build:snap.build})}}>{snap.build}</Button>:'—'})()}</Form.Text></Form.Item><Form.Item label="镜像地址"><Form.Text>{target.image}</Form.Text></Form.Item><Form.Item label="CPU / 内存"><Form.Text>{metas[target.toolId]?.cpu||'2'} 核 / {metas[target.toolId]?.memory||'4Gi'}</Form.Text></Form.Item><Form.Item label="启动命令"><Form.Text>{target.command}</Form.Text></Form.Item><Form.Item label="Metadata"><Form.Text>{target.metadata||'—'}</Form.Text></Form.Item></Form>}</Drawer>
 </Content>
}
