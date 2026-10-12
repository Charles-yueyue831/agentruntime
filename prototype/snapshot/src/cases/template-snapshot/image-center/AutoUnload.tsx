import React,{useEffect,useState} from 'react';
import {ArrowLeftIcon} from '@tencent/tea-icons-react';
import {Alert,Bubble,Button,Card,Checkbox,Copy,Form,Input,InputNumber,Modal,Radio,Table,Tag,TagSearchBox,message} from '@tencent/tea-component';
import {AutoUnloadPolicy,autoUnloadStorageKey,imagePatternError,loadAutoUnloadPolicies,positiveIntegerError,strategyLabel} from './autoUnloadModel';
import {FilterHeader,FilterTags,FilterAttribute} from './RepositoryFilters';
import './auto-preheat.css';
import './auto-unload.css';
import './preheat-console.css';

const region='gz';
const attributes:FilterAttribute[]=[
  {key:'name',name:'策略名称',type:'input'},
  {key:'id',name:'策略 ID',type:'input'},
  {key:'strategy',name:'自动卸载策略',type:'multiple',values:['不启用','闲置超时卸载','最近最少使用优先卸载','闲置超时卸载 + 最近最少使用优先卸载'].map(name=>({key:name,name}))},
  {key:'image',name:'适用镜像',type:'input'},
  {key:'status',name:'策略状态',type:'multiple',values:[{key:'启用',name:'启用'},{key:'停用',name:'停用'}]},
];
const State=({enabled}:{enabled:boolean})=><Tag theme={enabled?'success':'default'}>{enabled?'启用':'停用'}</Tag>;
const dateTime=()=>new Date().toLocaleString('sv-SE');
type NullableNumberProps=Omit<React.ComponentProps<typeof InputNumber>,'value'|'onChange'> & {value:number|null;onChange:(value:number|null)=>void};
const NullableInputNumber=InputNumber as React.ComponentType<NullableNumberProps>;

function PolicyForm({initial,policies,onClose,onSave}:{initial?:AutoUnloadPolicy;policies:AutoUnloadPolicy[];onClose:()=>void;onSave:(policy:AutoUnloadPolicy)=>void}){
  const [name,setName]=useState(initial?.name||'');
  const [imagePattern,setImagePattern]=useState(initial?.imagePattern||'');
  const [enabled,setEnabled]=useState(initial?.enabled??true);
  const [idleEnabled,setIdleEnabled]=useState(initial?.idleEnabled??false);
  const [lruEnabled,setLruEnabled]=useState(initial?.lruEnabled??false);
  const [idleDays,setIdleDays]=useState(initial?.idleDays?String(initial.idleDays):'');
  const [quantityThreshold,setQuantityThreshold]=useState(initial?.quantityThreshold?String(initial.quantityThreshold):'');
  const [validated,setValidated]=useState(false);
  const errors={
    name:!name.trim()?'请输入策略名称':name.trim().length>60?'策略名称不能超过 60 个字符':policies.some(policy=>!policy.deletedAt&&policy.region===region&&policy.id!==initial?.id&&policy.name===name.trim())?'当前地域下已存在同名策略':'',
    image:imagePatternError(imagePattern),
    strategy:enabled&&!idleEnabled&&!lruEnabled?'请至少选择一种自动卸载策略':'',
    idle:enabled&&idleEnabled?positiveIntegerError(idleDays,'天数'):'',
    quantity:enabled&&lruEnabled?positiveIntegerError(quantityThreshold,'镜像预热数量'):'',
  };
  const status=(key:keyof typeof errors)=>({status:validated&&errors[key]?'error' as const:undefined,message:validated?errors[key]:undefined,showStatusIcon:false});
  function save(){
    setValidated(true);
    if(Object.values(errors).some(Boolean))return;
    const now=dateTime();
    onSave({id:initial?.id||`au-${crypto.randomUUID().slice(0,8)}`,name:name.trim(),region,imagePattern:imagePattern.trim(),enabled,idleEnabled,lruEnabled,idleDays:idleEnabled?Number(idleDays):undefined,quantityThreshold:lruEnabled?Number(quantityThreshold):undefined,createdAt:initial?.createdAt||now,updatedAt:now});
  }
  return <Modal visible caption={initial?'编辑业务级自动卸载策略':'创建业务级自动卸载策略'} size="l" className="_unload-form-dialog preheat-console-dialog" scrollable onClose={onClose}><Modal.Body><div className="_unload-form">
    <Form layout="flex" fixedLabelWidth="140px">
      <Form.Item label="策略名称" required {...status('name')}><Input size="l" value={name} onChange={setName} placeholder="请输入策略名称，最多 60 个字符" aria-label="业务级自动卸载策略名称"/></Form.Item>
      <Form.Item label="适用镜像" required {...status('image')} extra={!(validated&&errors.image)?'使用正则表达式匹配镜像地址；输入 .* 可匹配所有镜像。':undefined}><Input size="l" value={imagePattern} onChange={setImagePattern} placeholder="例如 ^tcr\\.tencentcloudcr\\.com/ags/.*$" aria-label="适用镜像正则表达式"/></Form.Item>
      <Form.Item label="策略状态"><Radio.Group value={enabled?'enabled':'disabled'} onChange={value=>setEnabled(value==='enabled')}><Radio name="enabled">启用</Radio><Radio name="disabled" disabled={!initial}>停用</Radio></Radio.Group></Form.Item>
      {enabled&&<Form.Item label="自动卸载策略" required {...status('strategy')}><div className="_unload-options">
        <div className="_unload-option"><Checkbox value={idleEnabled} onChange={setIdleEnabled}>闲置超时卸载策略</Checkbox>{idleEnabled&&<div className="_unload-option-field"><label className="_unload-sub-label" htmlFor="au-idle-days">闲置超时阈值 <span>*</span></label><Form.Control {...status('idle')} extra={!(validated&&errors.idle)?'镜像预热缓存的闲置时间达到或超过该时长时，自动卸载该镜像的预热缓存。':undefined}><NullableInputNumber value={idleDays===''?null:Number(idleDays)} onChange={value=>setIdleDays(value===null?'':String(value))} onInputChange={setIdleDays} allowEmpty min={1} max={Number.MAX_SAFE_INTEGER} precision={0} unit="天" hideButton size="l" inputProps={{id:'au-idle-days',placeholder:'请输入天数','aria-label':'闲置超时阈值'}}/></Form.Control></div>}</div>
        <div className="_unload-option"><Checkbox value={lruEnabled} onChange={setLruEnabled}>最近最少使用优先卸载策略</Checkbox>{lruEnabled&&<div className="_unload-option-field"><label className="_unload-sub-label" htmlFor="au-quantity">镜像预热数量阈值 <span>*</span></label><Form.Control {...status('quantity')} extra={!(validated&&errors.quantity)?'镜像预热缓存的数量超过阈值时，优先卸载最近最少使用的镜像预热缓存，直到数量不超过该阈值。':undefined}><NullableInputNumber value={quantityThreshold===''?null:Number(quantityThreshold)} onChange={value=>setQuantityThreshold(value===null?'':String(value))} onInputChange={setQuantityThreshold} allowEmpty min={1} max={Number.MAX_SAFE_INTEGER} precision={0} unit="个" hideButton size="l" inputProps={{id:'au-quantity',placeholder:'请输入数量','aria-label':'镜像预热数量阈值'}}/></Form.Control></div>}</div>
      </div></Form.Item>}
    </Form>
  </div></Modal.Body><Modal.Footer><Button type="primary" onClick={save}>{initial?'保存':'创建'}</Button><Button onClick={onClose}>取消</Button></Modal.Footer></Modal>;
}

export default function AutoUnload(){
  const [loadError,setLoadError]=useState('');
  const [data,setData]=useState<AutoUnloadPolicy[]>(()=>{try{return loadAutoUnloadPolicies()}catch{return []}});
  const [tags,setTags]=useState<FilterTags>([]);
  const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(30);
  const [form,setForm]=useState<AutoUnloadPolicy|'new'>();
  const [detail,setDetail]=useState<string|undefined>(()=>new URLSearchParams(location.search).get('unloadPolicy')||undefined);
  const [pending,setPending]=useState<{action:'delete'|'toggle';policy:AutoUnloadPolicy}>();
  const records=data.filter(policy=>policy.region===region&&!policy.deletedAt);
  const active=records.find(policy=>policy.id===detail);
  useEffect(()=>{const sync=()=>setDetail(new URLSearchParams(location.search).get('unloadPolicy')||undefined);window.addEventListener('popstate',sync);window.addEventListener('preheat-policy-route-change',sync);return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('preheat-policy-route-change',sync)}},[]);
  function showDetail(id?:string){const params=new URLSearchParams(location.search);if(id)params.set('unloadPolicy',id);else params.delete('unloadPolicy');history.pushState(null,'',`${location.pathname}?${params.toString()}`);setDetail(id);}
  function persist(next:AutoUnloadPolicy[]){try{localStorage.setItem(autoUnloadStorageKey,JSON.stringify(next));setData(next);return true}catch{message.error({content:'保存失败，浏览器存储不可用。请检查后重试。'});return false}}
  function save(policy:AutoUnloadPolicy){const creating=form==='new';if(persist(creating?[policy,...data]:data.map(item=>item.id===policy.id?policy:item))){setForm(undefined);setTags([]);setPage(1);message.success({content:creating?'业务级自动卸载策略已创建':'业务级自动卸载策略已更新，不会重新预热已有缓存'});}}
  function confirm(){if(!pending)return;const {action,policy}=pending;const now=dateTime();const next=data.map(item=>item.id===policy.id?{...item,enabled:action==='delete'?false:!item.enabled,updatedAt:now,...(action==='delete'?{deletedAt:now}:{})}:item);if(persist(next)){setPending(undefined);if(action==='delete')showDetail();setPage(1);message.success({content:action==='delete'?'策略已删除':policy.enabled?'策略已停用':'策略已启用'});}}
  function refresh(){try{setData(loadAutoUnloadPolicies());setLoadError('');setPage(1);message.success({content:'策略列表已刷新'})}catch{setLoadError('自动卸载策略读取失败，请刷新重试。')}}
  function filter(value:FilterTags){setTags(value);setPage(1)}
  const filtered=records.filter(policy=>tags.every(tag=>{const values=tag.values?.map(value=>value.name.toLowerCase()).filter(Boolean)||[];const key=tag.attr?.key;const text=key==='name'?policy.name:key==='id'?policy.id:key==='strategy'?strategyLabel(policy):key==='image'?policy.imagePattern:key==='status'?(policy.enabled?'启用':'停用'):[policy.name,policy.id,strategyLabel(policy),policy.imagePattern].join(' ');return !values.length||values.some(value=>key==='strategy'||key==='status'?text.toLowerCase()===value:text.toLowerCase().includes(value))}));
  return <div className="console-list-body _auto-preheat _auto-unload" role="region" aria-label="自动卸载">
    {!active&&<>
    <Alert type="info" className="_auto-notice">按镜像地址配置业务级自动卸载策略。任务级可覆盖闲置超时阈值最近最少使用优先卸载的镜像预热数量阈值仅在业务级配置。</Alert>
    {loadError&&<Alert type="error">{loadError}</Alert>}
    <Table.ActionPanel><div className="_auto-toolbar"><Button type="primary" onClick={()=>setForm('new')}>创建自动卸载策略</Button><TagSearchBox attributes={attributes} value={tags} onChange={filter} onClearButtonClick={()=>filter([])} tips={tags.length?'继续筛选自动卸载策略':`搜索或筛选：${attributes.map(attribute=>attribute.name).join('、')}`} attributesSelectTips="请选择筛选内容" hideHelp/><Bubble content="刷新"><Button icon="refresh" aria-label="刷新自动卸载策略列表" onClick={refresh}/></Bubble></div></Table.ActionPanel>
    <Card><Table records={filtered} recordKey="id" columns={[
      {key:'name',header:'策略名称 / ID',width:230,render:policy=><div className="_auto-name"><Button type="link" onClick={()=>showDetail(policy.id)}>{policy.name}</Button><Button type="link" className="_auto-id-link" onClick={()=>showDetail(policy.id)}>{policy.id}</Button></div>},
      {key:'status',header:<FilterHeader attribute={attributes[4]} tags={tags} onChange={filter}/>,width:100,render:policy=><State enabled={policy.enabled}/>},
      {key:'strategy',header:'自动卸载策略',width:300,render:policy=><span>{strategyLabel(policy)}</span>},
      {key:'idleDays',header:'闲置超时阈值',width:130,render:policy=>policy.idleEnabled?`${policy.idleDays} 天`:'—'},
      {key:'quantityThreshold',header:'镜像预热数量阈值',width:150,render:policy=>policy.lruEnabled?`${policy.quantityThreshold} 个`:'—'},
      {key:'imagePattern',header:'适用镜像',width:270,render:policy=><span className="_auto-rule-value" title={policy.imagePattern}>{policy.imagePattern}</span>},
      {key:'createdAt',header:'创建时间',width:170},
      {key:'actions',header:'操作',width:170,fixed:'right',render:policy=><div className="_auto-actions"><Button type="link" onClick={()=>setForm(policy)}>编辑</Button><Button type="link" onClick={()=>setPending({action:'toggle',policy})}>{policy.enabled?'停用':'启用'}</Button><Button type="link" onClick={()=>setPending({action:'delete',policy})}>删除</Button></div>},
    ]} addons={[Table.addons.scrollable({minWidth:1520}),Table.addons.autotip({isLoading:false,emptyText:'暂无业务级自动卸载策略，点击“创建自动卸载策略”进行配置。',isFound:tags.length>0,foundKeyword:tags.length?'当前筛选条件':undefined,onClear:()=>filter([])}),Table.addons.pageable({pageIndex:page,pageSize,pageSizeOptions:[30,50,100,200],onPagingChange:value=>{setPage(value.pageIndex||1);if(value.pageSize)setPageSize(value.pageSize)}})]}/></Card></>}
    {form&&<PolicyForm initial={form==='new'?undefined:form} policies={data} onClose={()=>setForm(undefined)} onSave={save}/>}
    {active&&<div className="_auto-detail-page"><header className="_auto-detail-header"><Button type="text" aria-label="返回自动卸载策略列表" onClick={()=>showDetail()}><ArrowLeftIcon size={20}/></Button><h2>业务级自动卸载策略详情</h2></header><div className="_auto-detail-actions"><Button type="primary" onClick={()=>setForm(active)}>编辑策略</Button><Button onClick={()=>setPending({action:'toggle',policy:active})}>{active.enabled?'停用策略':'启用策略'}</Button></div><Card><div className="_auto-detail"><h3>基本信息</h3><Form readonly layout="flex" fixedLabelWidth="140px"><Form.Item label="配置 ID"><Form.Text>{active.id} <Copy text={active.id}/></Form.Text></Form.Item><Form.Item label="策略状态"><Form.Text><State enabled={active.enabled}/></Form.Text></Form.Item><Form.Item label="适用镜像"><Form.Text>{active.imagePattern}</Form.Text></Form.Item><Form.Item label="创建时间"><Form.Text>{active.createdAt}</Form.Text></Form.Item><Form.Item label="更新时间"><Form.Text>{active.updatedAt}</Form.Text></Form.Item></Form><h3>卸载规则</h3><Form readonly layout="flex" fixedLabelWidth="140px" className="_unload-rules"><Form.Item className="_unload-rule-strategy" label="自动卸载策略"><Form.Text>{strategyLabel(active)}</Form.Text></Form.Item>{active.idleEnabled&&<Form.Item label="闲置超时阈值"><Form.Text>{active.idleDays} 天</Form.Text></Form.Item>}{active.lruEnabled&&<Form.Item label="镜像预热数量阈值"><Form.Text>{active.quantityThreshold} 个</Form.Text></Form.Item>}</Form><Alert type="info">任务级闲置超时阈值可覆盖业务级闲置超时阈值；业务级镜像预热数量阈值不可在任务级修改。更新策略不会重新预热已有镜像缓存。</Alert></div></Card></div>}
    {pending&&<Modal className="preheat-console-dialog" scrollable visible caption={pending.action==='delete'?'删除业务级自动卸载策略':pending.policy.enabled?'停用业务级自动卸载策略':'启用业务级自动卸载策略'} size="m" onClose={()=>setPending(undefined)}><Modal.Body><Modal.Message icon={pending.action==='delete'||pending.policy.enabled?'warning':'infoblue'} message={`确定${pending.action==='delete'?'删除':pending.policy.enabled?'停用':'启用'}策略“${pending.policy.name}”吗？`} description={pending.action==='delete'?'删除后该策略将从列表移除，不会重新预热已有缓存。':pending.policy.enabled?'停用后，匹配的镜像缓存不再按照该业务级策略自动卸载；任务级闲置超时仍可生效。':'启用后，匹配的镜像缓存将按所配置的阈值参与自动卸载。'}/></Modal.Body><Modal.Footer><Button type="primary" onClick={confirm}>{pending.action==='delete'?'删除':pending.policy.enabled?'停用':'启用'}</Button><Button onClick={()=>setPending(undefined)}>取消</Button></Modal.Footer></Modal>}
  </div>;
}
