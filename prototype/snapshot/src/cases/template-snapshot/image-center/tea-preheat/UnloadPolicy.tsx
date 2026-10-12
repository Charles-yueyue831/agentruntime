import React,{useEffect,useState} from 'react';
import {Alert,Button,Form,InputNumber,Modal,Radio,message} from '@tencent/tea-component';
import {Task,updateTaskPolicy} from './adapter';
import BusinessPolicyLink from './BusinessPolicyLink';
import {autoUnloadStorageKey,matchingBusinessPolicy,strategyLabel} from '../autoUnloadModel';
import {ACCOUNT_POLICY_KEY,ACCOUNT_POLICY_CHANGED,AccountUnloadPolicy,PolicyDraft,TaskUnloadPolicy,daysFromSeconds,draftError,duration,effectiveDescription,readAccountPolicy,toDraft,toPolicy} from './unload-policy';

type DurationInputProps=Omit<React.ComponentProps<typeof InputNumber>,'value'|'onChange'> & {value:number|null;onChange:(value:number|null)=>void};
const DurationInput=InputNumber as React.ComponentType<DurationInputProps>;

export function useAccountPolicy(){
 const [account,setAccount]=useState<AccountUnloadPolicy>({}),[error,setError]=useState(false);
 useEffect(()=>{function refresh(){try{setAccount(readAccountPolicy());setError(false)}catch{setError(true)}}refresh();const changed=(event:StorageEvent)=>{if(event.key===ACCOUNT_POLICY_KEY||event.key===null)refresh()};window.addEventListener('storage',changed);window.addEventListener(ACCOUNT_POLICY_CHANGED,refresh);return()=>{window.removeEventListener('storage',changed);window.removeEventListener(ACCOUNT_POLICY_CHANGED,refresh)}},[]);
 return {account,error};
}
export function PolicySummary({policy}:{policy:TaskUnloadPolicy}){
 const {account,error}=useAccountPolicy();
 return error?<Alert type="warning">暂时无法读取账号级策略，请刷新后重试。</Alert>:<div className="tp-policy-effective" aria-live="polite"><strong>最终生效规则</strong>{effectiveDescription(policy,account).map(line=><p key={line}>{line}</p>)}</div>;
}
export function PolicyDetails({task}:{task:Task}){
 let business;try{business=matchingBusinessPolicy(task.image)}catch{}
 return <Form readonly layout="flex" fixedLabelWidth="168px" className="tp-detail-grid">
  <Form.Item label="业务级策略名称" className="tp-policy-detail-full"><BusinessPolicyLink image={task.image}/></Form.Item>
  {business?.idleEnabled&&<><Form.Item label="当前业务级自动卸载策略"><Form.Text>闲置超时自动卸载</Form.Text></Form.Item><Form.Item label="闲置超时阈值"><Form.Text>{business.idleDays} 天</Form.Text></Form.Item></>}
  {business?.lruEnabled&&<><Form.Item label="当前业务级自动卸载策略"><Form.Text>最近最少使用优先卸载</Form.Text></Form.Item><Form.Item label="镜像预热数量阈值"><Form.Text>{business.quantityThreshold} 个</Form.Text></Form.Item></>}
  {!business?.idleEnabled&&!business?.lruEnabled&&<Form.Item label="当前业务级自动卸载策略" className="tp-policy-detail-full"><Form.Text>—</Form.Text></Form.Item>}
  <Form.Item label="任务级自动卸载策略"><Form.Text>{task.unloadPolicy.strategy==='IdleTimeout'?'闲置超时卸载策略':'不启用（继承业务级策略）'}</Form.Text></Form.Item>
  {task.unloadPolicy.strategy==='IdleTimeout'&&<Form.Item label="任务级闲置超时阈值"><Form.Text>{task.unloadPolicy.idleTTL?duration(task.unloadPolicy.idleTTL):'—'}</Form.Text></Form.Item>}
 </Form>;
}
export function PolicyFields({value,onChange,validated,image,editMode=false,showBusinessName=false}:{value:PolicyDraft;onChange:(value:PolicyDraft)=>void;validated:boolean;image:string;editMode?:boolean;showBusinessName?:boolean}){
 const [touched,setTouched]=useState(false);const [,setRevision]=useState(0);const validation=draftError(value);const showError=(validated||touched)&&validation;
 useEffect(()=>{const refresh=(event:StorageEvent)=>{if(event.key===autoUnloadStorageKey||event.key===null)setRevision(revision=>revision+1)};window.addEventListener('storage',refresh);return()=>window.removeEventListener('storage',refresh)},[]);
 let business;try{business=matchingBusinessPolicy(image)}catch{}
 return <div className="tp-policy-fields"><Form readonly layout="flex" fixedLabelWidth="168px" className="tp-policy-business">
  {showBusinessName&&<Form.Item label="业务级策略名称"><BusinessPolicyLink image={image}/></Form.Item>}
  <Form.Item label="当前业务级自动卸载策略" extra={business?.lruEnabled?'镜像预热数量阈值仅支持在业务级配置，任务级不能关闭或覆盖。':undefined}><Form.Text>{business?strategyLabel(business):'—'}</Form.Text></Form.Item>
  {business?.idleEnabled&&<Form.Item label="闲置超时阈值"><Form.Text>{business.idleDays} 天</Form.Text></Form.Item>}
  {business?.lruEnabled&&<Form.Item label="镜像预热数量阈值"><Form.Text>{business.quantityThreshold} 个</Form.Text></Form.Item>}
 </Form><Form layout="flex" fixedLabelWidth="168px" className="tp-policy-task-settings">
  <Form.Item className="tp-policy-task-option" label="任务级自动卸载策略" extra={value.strategy==='Disabled'?'不单独配置任务级自动卸载策略，最终行为由业务级自动卸载策略决定。':editMode?'镜像预热缓存的闲置时间超过该时长时，自动卸载该镜像的预热缓存。':'当镜像预热缓存的闲置时间超过指定时长时，自动卸载该镜像的预热缓存。'}>
   <Radio.Group layout="column" value={value.strategy} onChange={strategy=>onChange({...value,strategy:strategy==='IdleTimeout'?'IdleTimeout':'Disabled'})}>
    <Radio name="Disabled">不启用自动卸载策略</Radio><Radio name="IdleTimeout">闲置超时卸载策略</Radio>
   </Radio.Group>
  </Form.Item>
  {value.strategy==='IdleTimeout'&&<Form.Item label="闲置超时阈值" required status={showError?'error':undefined} message={showError?validation:undefined} showStatusIcon={false} extra={showError?undefined:'任务级的闲置超时阈值优先于业务级的闲置超时阈值生效。'}>
   <DurationInput className="tp-policy-number" allowEmpty hideButton unit="天" min={0.000001} value={value.amount===''?null:Number(value.amount)} onChange={amount=>onChange({...value,amount:amount===null?'':String(amount),unit:'day'})} onInputChange={amount=>onChange({...value,amount,unit:'day'})} onBlur={()=>setTouched(true)} inputProps={{placeholder:"请输入闲置时长",'aria-label':"闲置超时阈值"}}/>
  </Form.Item>}
 </Form>
 </div>;
}
export function EditPolicyModal({task,onClose,onSaved}:{task:Task;onClose:()=>void;onSaved:()=>void}){
 const [draft,setDraft]=useState<PolicyDraft>(()=>{const initial=toDraft(task.unloadPolicy);return {...initial,amount:daysFromSeconds(task.unloadPolicy.idleTTL),unit:'day'}}),[validated,setValidated]=useState(false),[saving,setSaving]=useState(false);
 function save(){setValidated(true);if(draftError(draft))return;setSaving(true);try{updateTaskPolicy(task.id,toPolicy(draft));onSaved();message.success({content:'任务级自动卸载策略已更新，不会重新预热已有镜像缓存'});onClose()}catch(e){message.error({content:e instanceof Error?e.message:'策略保存失败，请重试'})}finally{setSaving(false)}}
 return <Modal visible caption="编辑任务级自动卸载策略" size="l" className="tp-policy-dialog preheat-console-dialog" scrollable onClose={onClose}><Modal.Body>
  <Form readonly layout="flex" fixedLabelWidth="168px" className="tp-policy-task"><Form.Item label="镜像预热 ID"><Form.Text>{task.id}</Form.Text></Form.Item><Form.Item label="镜像地址"><Form.Text>{task.image}</Form.Text></Form.Item><Form.Item label="业务级策略名称"><BusinessPolicyLink image={task.image}/></Form.Item></Form>
  <PolicyFields value={draft} onChange={setDraft} validated={validated} image={task.image} editMode/>
 </Modal.Body><Modal.Footer><Button type="primary" loading={saving} onClick={save}>保存</Button><Button disabled={saving} onClick={onClose}>取消</Button></Modal.Footer></Modal>;
}
