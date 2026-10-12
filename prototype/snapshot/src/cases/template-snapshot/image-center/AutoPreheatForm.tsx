import React,{useState} from 'react';
import {Modal,Form,Input,Select,Radio,Button,Alert} from '@tencent/tea-component';
import {AutoPolicy,tcrInstances,ruleError,inferMatchMode} from './autoPreheatModel';
export default function AutoPreheatForm({initial,policies,region,onClose,onSave}:{initial?:AutoPolicy;policies:AutoPolicy[];region:string;onClose:()=>void;onSave:(p:AutoPolicy)=>void}) {
 const [name,setName]=useState(initial?.name||'');
 const [instance,setInstance]=useState(initial?.instance||'');
 const [namespace,setNamespace]=useState(initial?.namespace||'');
 const [repository,setRepository]=useState(initial?.repository||'');

 const [tag,setTag]=useState(initial?.tag||'');

 const [enabled,setEnabled]=useState(initial?.enabled??true);
 const repositoryMode=inferMatchMode(repository.trim(),'repository');
 const tagMode=inferMatchMode(tag.trim(),'tag');
 const [checked,setChecked]=useState(false);


 const instances=tcrInstances.filter(i=>i.region===region);
 const selected=instances.find(i=>i.id===instance);
 const errors={name:!name.trim()?'请输入策略名称':name.trim().length>60?'策略名称不能超过 60 个字符':policies.some(p=>!p.deletedAt&&p.region===region&&p.id!==initial?.id&&p.name===name.trim())?'当前地域下已存在同名策略，请更换名称':'',instance:!selected?'请选择当前地域的 TCR 实例':'',namespace:!selected?.namespaces.includes(namespace)?'请选择该实例中已有的命名空间':'',repository:ruleError(repositoryMode,repository.trim(),'repository'),tag:ruleError(tagMode,tag.trim(),'tag')};
 const status=(key:keyof typeof errors)=>({status:checked&&errors[key]?'error' as const:undefined,message:checked?errors[key]:undefined,showStatusIcon:false});
 function save(){setChecked(true);if(Object.values(errors).some(Boolean))return;const now=new Date().toLocaleString('sv-SE');onSave({id:initial?.id||`ap-${crypto.randomUUID().slice(0,8)}`,name:name.trim(),region,instance,namespace,repository:repository.trim(),repositoryMode,tag:tag.trim(),tagMode,enabled,createdAt:initial?.createdAt||now,updatedAt:now});}
 return <Modal visible caption={initial?'编辑镜像自动预热策略':'创建镜像自动预热策略'} size="l" onClose={onClose}><Modal.Body><div className="_auto-form">
 <Alert type="info">镜像推送后，匹配该策略的镜像将自动创建预热任务。{initial?'修改仅对后续推送生效，不影响已有预热任务和镜像缓存。':'仅支持当前地域的 TCR 实例。'}</Alert>
 <Form layout="fixed" fixedLabelWidth="110px">
 <Form.Item label="策略名称" required {...status('name')}><Input size="l" value={name} onChange={setName} placeholder="请输入策略名称，同一地域内名称唯一，最多 60 个字符" aria-label="策略名称"/></Form.Item>
 <Form.Item label="TCR 实例名称" required {...status('instance')}><Select appearance="button" size="l" searchable value={instance} onChange={v=>{setInstance(v);setNamespace('');}} options={instances.map(i=>({value:i.id,text:`${i.name}（${i.id}）`}))} placeholder="请选择 TCR 实例名称"/></Form.Item>
 <Form.Item label="命名空间" required {...status('namespace')}><Select appearance="button" size="l" value={namespace} onChange={setNamespace} disabled={!selected} searchable options={(selected?.namespaces||[]).map(n=>({value:n,text:n}))} placeholder={selected?'请选择命名空间':'请先选择 TCR 实例'}/></Form.Item>
 <Form.Item label="镜像仓库" {...status('repository')} extra={!(checked&&errors.repository)?'支持具体仓库名称或正则表达式，如 browser、^(browser|worker)$；不含命名空间，留空匹配全部仓库。':undefined}>
 <Input size="l" value={repository} onChange={setRepository} placeholder="请输入仓库名称或正则表达式（可选）" aria-label="镜像仓库匹配规则"/>
 </Form.Item>
 <Form.Item label="镜像版本" {...status('tag')} extra={!(checked&&errors.tag)?'支持具体镜像版本或正则表达式，如 latest、^v[0-9]+$；留空匹配全部版本。':undefined}>
 <Input size="l" value={tag} onChange={setTag} placeholder="请输入镜像版本或正则表达式（可选）" aria-label="镜像版本匹配规则"/>
 </Form.Item>
 <Form.Item label="策略状态"><Radio.Group value={enabled?'on':'off'} onChange={value=>setEnabled(value==='on')}><Radio name="on">启用</Radio><Radio name="off" disabled={!initial}>停用</Radio></Radio.Group></Form.Item>
 </Form>
 </div></Modal.Body><Modal.Footer><Button type="primary" onClick={save}>{initial?'保存':'创建'}</Button><Button onClick={onClose}>取消</Button></Modal.Footer></Modal>;
}
