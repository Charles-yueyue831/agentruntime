import React,{useState} from 'react';
import {Table,Card,Button,TagSearchBox,Bubble,Alert,Tag,Modal,Drawer,Form,Copy,message} from '@tencent/tea-component';
import {AutoPolicy,tcrInstances,loadPolicies,policyStorageKey} from './autoPreheatModel';
import AutoPreheatForm from './AutoPreheatForm';
import {FilterHeader,FilterTags,FilterAttribute} from './RepositoryFilters';
import './auto-preheat.css';
const region='gz';
const instanceName=(id:string)=>tcrInstances.find(i=>i.id===id)?.name||id;
const State=({enabled}:{enabled:boolean})=><Tag theme={enabled?'success':'default'}>{enabled?'启用':'停用'}</Tag>;
const attrs:FilterAttribute[]=[{key:'name',name:'策略名称',type:'input'},{key:'id',name:'策略 ID',type:'input'},{key:'status',name:'策略状态',type:'multiple',values:[{key:'启用',name:'启用'},{key:'停用',name:'停用'}]},{key:'instance',name:'TCR 实例名称',type:'multiple',values:tcrInstances.filter(i=>i.region===region).map(i=>({key:i.name,name:i.name}))},{key:'namespace',name:'命名空间',type:'input'}];
export default function AutoPreheat(){
 const [loadError,setLoadError]=useState('');
 const [data,setData]=useState<AutoPolicy[]>(()=>{try{return loadPolicies();}catch{return [];}});
 const [tags,setTags]=useState<FilterTags>([]);const [page,setPage]=useState(1);const [pageSize,setPageSize]=useState(30);
 const [form,setForm]=useState<AutoPolicy|'new'>();const [detail,setDetail]=useState<string>();
 const [pending,setPending]=useState<{action:'delete'|'toggle';policy:AutoPolicy}>();
 React.useEffect(()=>{try{loadPolicies();}catch{setLoadError('自动预热策略读取失败，请刷新重试。');}},[]);
 const records=data.filter(p=>p.region===region&&!p.deletedAt);
 const active=records.find(p=>p.id===detail);
 function persist(next:AutoPolicy[]){try{localStorage.setItem(policyStorageKey,JSON.stringify(next));setData(next);return true;}catch{message.error({content:'保存失败，浏览器存储不可用。请检查后重试。'});return false;}}
 function save(policy:AutoPolicy){const creating=form==='new';if(persist(creating?[policy,...data]:data.map(p=>p.id===policy.id?policy:p))){setForm(undefined);setTags([]);setPage(1);message.success({content:creating?'自动预热策略已创建':'自动预热策略已更新'});}}
 function confirm(){if(!pending)return;const {policy,action}=pending;const now=new Date().toLocaleString('sv-SE');const next=data.map(p=>p.id===policy.id?{...p,enabled:action==='delete'?false:!p.enabled,updatedAt:now,...(action==='delete'?{deletedAt:now}:{})}:p);if(persist(next)){if(action==='delete'){setDetail(undefined);setPage(1);}setPending(undefined);message.success({content:action==='delete'?'策略已删除，已有任务与镜像缓存不受影响':policy.enabled?'策略已停用':'策略已启用'});}}
 const filtered=records.filter(p=>tags.every(t=>{const values=t.values?.map(v=>v.name.toLowerCase()).filter(Boolean)||[];const key=t.attr?.key;const text=key==='name'?p.name:key==='id'?p.id:key==='status'?(p.enabled?'启用':'停用'):key==='instance'?instanceName(p.instance):key==='namespace'?p.namespace:[p.name,p.id,instanceName(p.instance),p.namespace,p.repository,p.tag].join(' ');return !values.length||values.some(v=>key==='status'||key==='instance'?text.toLowerCase()===v:text.toLowerCase().includes(v));}));
 function filter(value:FilterTags){setTags(value);setPage(1);}
 const rule=(p:AutoPolicy,field:'repository'|'tag')=><div className="_auto-rule-cell"><span className="_auto-rule-value" title={p[field]||'未指定，匹配全部'}>{p[field]||(field==='repository'?'全部仓库':'全部版本')}</span><span className="_auto-secondary">{!p[field]?'未指定':p[field==='repository'?'repositoryMode':'tagMode']==='exact'?'精确匹配':'正则表达式'}</span></div>;
 return <div className="console-list-body _auto-preheat">
 <Alert type="info" className="_auto-notice">向 TCR 推送镜像后，符合已启用策略的镜像将自动预热。重复推送镜像或镜像推送命中多条策略时，按“镜像地址 + 镜像 Digest”对镜像的自动预热任务进行去重。</Alert>
 {loadError&&<Alert type="error">{loadError}</Alert>}
 <Table.ActionPanel><div className="_auto-toolbar"><Button type="primary" onClick={()=>setForm('new')}>创建自动预热策略</Button><TagSearchBox attributes={attrs} value={tags} onChange={filter} onClearButtonClick={()=>filter([])} tips={tags.length?`继续筛选：${attrs.filter(a=>!tags.some(t=>t.attr?.key===a.key)).map(a=>a.name).join('、')||'输入关键词'}`:`搜索或筛选：${attrs.map(a=>a.name).join('、')}`} attributesSelectTips="请选择筛选内容" hideHelp/><Bubble content="刷新"><Button icon="refresh" aria-label="刷新策略列表" onClick={()=>{try{setData(loadPolicies());setLoadError('');setPage(1);message.success({content:'策略列表已刷新'});}catch{setLoadError('自动预热策略读取失败，请刷新重试。');}}}/></Bubble></div></Table.ActionPanel>
 <Card><Table records={filtered} recordKey="id" columns={[
 {key:'name',header:'策略名称 / ID',width:220,render:p=><div className="_auto-name"><Button type="link" onClick={()=>setDetail(p.id)}>{p.name}</Button><span className="_auto-secondary">{p.id}</span></div>},
 {key:'status',header:<FilterHeader attribute={attrs[2]} tags={tags} onChange={filter}/>,width:100,render:p=><State enabled={p.enabled}/>},
 {key:'instance',header:'TCR 实例名称',width:175,render:p=><div className="_auto-rule-cell"><span>{instanceName(p.instance)}</span><span className="_auto-secondary">{p.instance}</span></div>},
 {key:'namespace',header:'命名空间',width:120},
 {key:'repository',header:'镜像仓库',width:200,render:p=>rule(p,'repository')},
 {key:'tag',header:'镜像版本',width:170,render:p=>rule(p,'tag')},
 {key:'createdAt',header:'创建时间',width:170},
 {key:'actions',header:'操作',width:170,fixed:'right',render:p=><div className="_auto-actions"><Button type="link" onClick={()=>setForm(p)}>编辑</Button><Button type="link" onClick={()=>setPending({action:'toggle',policy:p})}>{p.enabled?'停用':'启用'}</Button><Button type="link" onClick={()=>setPending({action:'delete',policy:p})}>删除</Button></div>},
 ]} addons={[Table.addons.scrollable({minWidth:1325}),Table.addons.autotip({isLoading:false,emptyText:'暂无自动预热策略，点击“创建自动预热策略”配置镜像推送后的自动预热。',isFound:tags.length>0,foundKeyword:tags.length?'当前筛选条件':undefined,onClear:()=>filter([])}),Table.addons.pageable({pageIndex:page,pageSize,pageSizeOptions:[30,50,100,200],onPagingChange:p=>{setPage(p.pageIndex||1);if(p.pageSize)setPageSize(p.pageSize);}})]}/></Card>
 {form&&<AutoPreheatForm initial={form==='new'?undefined:form} policies={data} region={region} onClose={()=>setForm(undefined)} onSave={save}/>}
 {active&&<Drawer visible showMask size="l" title="自动预热策略详情" subtitle={active.name} onClose={()=>setDetail(undefined)} footer={<div className="_auto-actions"><Button type="primary" onClick={()=>{setForm(active);setDetail(undefined);}}>编辑策略</Button><Button onClick={()=>setPending({action:'toggle',policy:active})}>{active.enabled?'停用策略':'启用策略'}</Button><Button onClick={()=>setDetail(undefined)}>关闭</Button></div>}><div className="_auto-detail">
 <h3>基本信息</h3><Form readonly layout="fixed" fixedLabelWidth="110px">
 <Form.Item label="策略 ID"><Form.Text>{active.id} <Copy text={active.id}/></Form.Text></Form.Item><Form.Item label="策略名称"><Form.Text>{active.name}</Form.Text></Form.Item><Form.Item label="策略状态"><Form.Text><State enabled={active.enabled}/></Form.Text></Form.Item><Form.Item label="地域"><Form.Text>广州</Form.Text></Form.Item><Form.Item label="创建时间"><Form.Text>{active.createdAt}</Form.Text></Form.Item><Form.Item label="更新时间"><Form.Text>{active.updatedAt}</Form.Text></Form.Item></Form>
 <h3>镜像匹配规则</h3><Form readonly layout="fixed" fixedLabelWidth="110px"><Form.Item label="TCR 实例名称"><Form.Text>{instanceName(active.instance)}（{active.instance}）</Form.Text></Form.Item><Form.Item label="命名空间"><Form.Text>{active.namespace}</Form.Text></Form.Item><Form.Item label="镜像仓库"><Form.Text>{rule(active,'repository')}</Form.Text></Form.Item><Form.Item label="镜像版本"><Form.Text>{rule(active,'tag')}</Form.Text></Form.Item></Form>
 <Alert type="info">{active.enabled?'策略已启用，匹配的镜像推送将自动创建预热任务。':'策略已停用，后续镜像推送不会通过该策略创建任务。'}<br/>相同镜像地址和 Digest 仅创建一个预热任务，命中多个策略也不会重复创建。</Alert>
 </div></Drawer>}
 {pending&&<Modal visible caption={pending.action==='delete'?'删除自动预热策略':pending.policy.enabled?'停用镜像自动预热策略':'启用自动预热策略'} onClose={()=>setPending(undefined)}><Modal.Body><p className="_auto-confirm">确定{pending.action==='delete'?'删除':pending.policy.enabled?'停用':'启用'}策略“{pending.policy.name}”吗？</p><Alert type={pending.action==='delete'||pending.policy.enabled?'warning':'info'}>{pending.action==='delete'?'删除后该策略将停用并从列表移除，后续镜像推送将无法命中该策略，':pending.policy.enabled?'停用后，该策略不再匹配后续镜像推送。':'启用后，符合匹配规则的后续镜像推送将自动创建预热任务。'}已有预热任务和镜像缓存不受影响。</Alert></Modal.Body><Modal.Footer><Button type="primary" onClick={confirm}>{pending.action==='delete'?'删除':pending.policy.enabled?'停用':'启用'}</Button><Button onClick={()=>setPending(undefined)}>取消</Button></Modal.Footer></Modal>}
 </div>;
}
