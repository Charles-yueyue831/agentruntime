import React,{useState} from 'react';
import {Alert,Button,Checkbox,Form,Input,Modal,Radio,message} from '@tencent/tea-component';
import {AccountPolicyDraft,accountDraft,accountErrors,daysFromSeconds,readAccountPolicy,saveAccountPolicy} from './unload-policy';

export function AccountPolicyModal({onClose}:{onClose:()=>void}){
 const [initial]=useState(()=>{try{const policy=readAccountPolicy();return {draft:{...accountDraft(policy),amount:daysFromSeconds(policy.idleTTL),unit:'day' as const},error:false}}catch{return {draft:{...accountDraft({}),unit:'day' as const},error:true}}});
 const [draft,setDraft]=useState<AccountPolicyDraft>(initial.draft),[validated,setValidated]=useState(false),[saving,setSaving]=useState(false);
 const errors=accountErrors(draft);
 function change(patch:Partial<AccountPolicyDraft>){setDraft(current=>({...current,...patch}))}
 function save(){setValidated(true);if(Object.values(errors).some(Boolean))return;setSaving(true);try{saveAccountPolicy(draft);message.success({content:'账号级自动卸载策略已保存，不会重新预热已预热的镜像缓存'});onClose()}catch(e){message.error({content:e instanceof Error?e.message:'配置保存失败，请重试'})}finally{setSaving(false)}}
 return <Modal visible caption="账号级自动卸载策略配置" size="l" className="tp-policy-dialog" scrollable onClose={onClose}>
  <Modal.Body>
   {initial.error&&<Alert type="error">无法读取已有账号级配置，请关闭弹窗并刷新后重试。</Alert>}
   <Form layout="fixed" fixedLabelWidth="138px">
    <Form.Item label="账号级自动卸载策略"><Radio.Group value={draft.enabled?'enabled':'disabled'} onChange={value=>change({enabled:value==='enabled'})}>
     <Radio name="disabled">不启用自动卸载策略</Radio><Radio name="enabled">启用自动卸载策略</Radio>
    </Radio.Group></Form.Item>
    {draft.enabled&&<>
     <Form.Item label="卸载策略" required status={validated&&errors.strategies?'error':undefined} message={validated?errors.strategies:undefined} showStatusIcon={false}><Checkbox value={draft.idleEnabled} onChange={idleEnabled=>change({idleEnabled})}>闲置超时卸载策略</Checkbox></Form.Item>
     {draft.idleEnabled&&<Form.Item label="闲置超时阈值" required status={validated&&errors.idle?'error':undefined} message={validated?errors.idle:undefined} showStatusIcon={false} extra="镜像预热缓存的闲置时间超过该时长时，自动卸载该镜像的预热缓存。"><div className="tp-policy-duration"><Input value={draft.amount} onChange={amount=>change({amount})} inputMode="decimal" placeholder="请输入闲置时长" aria-label="账号级闲置超时阈值"/><span>天</span></div></Form.Item>}
     <Form.Item label=" "><Checkbox value={draft.lruEnabled} onChange={lruEnabled=>change({lruEnabled})}>最近最少使用优先卸载策略（LRU）</Checkbox></Form.Item>
     {draft.lruEnabled&&<Form.Item label="镜像预热数量阈值" required status={validated&&errors.quantity?'error':undefined} message={validated?errors.quantity:undefined} showStatusIcon={false} extra="镜像预热缓存的数量超过阈值时，优先卸载最近最少使用的镜像预热缓存，直到数量不超过该阈值。"><div className="tp-policy-duration"><Input value={draft.quantity} onChange={quantity=>change({quantity})} inputMode="numeric" placeholder="请输入镜像预热数量" aria-label="镜像预热数量阈值"/><span>个</span></div></Form.Item>}
    </>}
   </Form>
  </Modal.Body><Modal.Footer><Button type="primary" loading={saving} disabled={initial.error} onClick={save}>保存</Button><Button disabled={saving} onClick={onClose}>取消</Button></Modal.Footer>
 </Modal>;
}
