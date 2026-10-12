import React,{useState} from 'react';
import {Modal,Form,Input,Checkbox,Radio,Button,Select} from '@tencent/tea-component';
import type {Repository} from './types';
import {networks,targets,parseRepositoryAddress,defaultRegistryHost} from './mock';

export default function RepositoryForm({initial,names,onClose,onSave}:{initial?:Repository;names:string[];onClose:()=>void;onSave:(r:Repository)=>void}){
 const [name,setName]=useState(initial?.name||'');
 const [namespace,setNamespace]=useState(initial?.namespace||'');
 const [selected,setSelected]=useState(initial?.targets||targets);
 const [strategy,setStrategy]=useState(initial?.unloadStrategies?.[0]||'');
 const [idleHours,setIdleHours]=useState(initial?.idleTimeoutHours?.toString()||'');
 const [imageCount,setImageCount]=useState(initial?.preheatImageLimit?.toString()||'');
 const [privateAccess,setPrivateAccess]=useState(initial?.privateAccess??false);
 const [vpc,setVpc]=useState(initial?.vpc||'');
 const [subnet,setSubnet]=useState(initial?.subnet||'');
 const subnets=networks.find(network=>network.id===vpc)?.subnets||[];
 const networkError=!initial&&privateAccess&&(!vpc||!subnets.some(item=>item.id===subnet));
 const [validated,setValidated]=useState(false);
 const idleEnabled=strategy==='idle';
 const lruEnabled=strategy==='lru';
 const positiveInteger=(value:string)=>/^[1-9]\d*$/.test(value)&&Number.isSafeInteger(Number(value));
 const idleError=idleEnabled&&!positiveInteger(idleHours);
 const countError=lruEnabled&&!positiveInteger(imageCount);
 const error=!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(name)?'请输入 2–64 位小写字母、数字、点、短横线或下划线':names.includes(name)&&name!==initial?.name?'仓库名称已存在，请更换名称':'';
 function save(){
  setValidated(true);
  if(error||!namespace.trim()||!selected.length||idleError||countError||networkError)return;
  const address=initial?.address||`${defaultRegistryHost}/${namespace.trim()}/${name}`;
  onSave({id:initial?.id||`repo-${Date.now()}`,address,...parseRepositoryAddress(address),supportedScenarios:[...selected],description:initial?.description||'',detailedDescription:initial?.detailedDescription,updatedAt:new Date().toLocaleString('sv-SE'),auto:initial?.auto??true,publicAccess:initial?.publicAccess??false,vpc:initial?initial.vpc:privateAccess?vpc:'',subnet:initial?initial.subnet:privateAccess?subnet:undefined,privateAccess:initial?initial.privateAccess:privateAccess,targets:selected,date:initial?.date||new Date().toLocaleString('sv-SE'),unloadStrategies:strategy?[strategy]:[],idleTimeoutHours:idleEnabled?Number(idleHours):undefined,preheatImageLimit:lruEnabled?Number(imageCount):undefined});
 }
 const basicInfo=<>  <h3>基本信息</h3><Form readonly={!!initial}>
   <Form.Item label="仓库名称" required={!initial} status={validated&&error?'error':undefined} message={validated?error:undefined}>{initial?<Form.Text>{initial.name}</Form.Text>:<Input value={name} onChange={setName} placeholder="例如 model-inference" size="l"/>}</Form.Item>
   <Form.Item label="命名空间" required={!initial} status={validated&&!namespace.trim()?'error':undefined} message={validated&&!namespace.trim()?'请输入命名空间':undefined}>{initial?<Form.Text>{initial.namespace}</Form.Text>:<Input value={namespace} onChange={setNamespace} placeholder="例如 agr-agent" size="l"/>}</Form.Item>
  </Form></>;
 return <Modal visible caption={initial?'编辑高性能仓库':'新建高性能仓库'} size="l" onClose={onClose}>
 <Modal.Body><div className="_mirror-form">
  {basicInfo}
  <h3>{initial?'自动预热至':'自动预热'}</h3>
  <Form><Form.Item label="自动预热至" required={!initial} status={validated&&!selected.length?'error':undefined} message={validated&&!selected.length?'请选择至少一个预热场景':undefined} extra={!(validated&&!selected.length)?<><span className="_mirror-preheat-hint">一次预热，全部生效</span></>:undefined}>
   <Checkbox.Group value={selected} onChange={setSelected} disabled={!!initial}>{targets.map(t=><Checkbox key={t} name={t}>{t}</Checkbox>)}</Checkbox.Group>
  </Form.Item></Form>
  <h3>自动卸载策略</h3>
  <Form>
   <Form.Item label="自动卸载策略" extra="可选，未选择时不自动卸载镜像的预热缓存"><Radio.Group value={strategy} onChange={setStrategy}>
    <Radio name="">不启用</Radio><Radio name="idle">闲置超时卸载</Radio><Radio name="lru">最近最少使用优先卸载</Radio>
   </Radio.Group></Form.Item>
   {idleEnabled&&<Form.Item label="闲置超时阈值" showStatusIcon={false} required status={validated&&idleError?'error':undefined} message={validated&&idleError?'请输入大于 0 的整数，单位为小时':undefined} extra={!(validated&&idleError)?'镜像连续闲置时间超过该阈值后，自动卸载其预热缓存。':undefined}>
    <div className="_mirror-threshold"><Input value={idleHours} onChange={setIdleHours} placeholder="请输入闲置超时阈值" size="m"/><span>小时</span></div>
   </Form.Item>}
   {lruEnabled&&<Form.Item label="镜像预热数量" showStatusIcon={false} required status={validated&&countError?'error':undefined} message={validated&&countError?'请输入大于 0 的整数':undefined} extra={!(validated&&countError)?'已预热镜像数量超过该值时，优先卸载最近最少使用的镜像预热缓存。':undefined}>
    <div className="_mirror-threshold"><Input value={imageCount} onChange={setImageCount} placeholder="请输入镜像预热数量" size="m"/><span>个</span></div>
   </Form.Item>}
  </Form>

  {!initial&&<><h3>网络策略</h3><Form>
   <Form.Item label="内网访问"><Checkbox value={privateAccess} onChange={enabled=>{setPrivateAccess(enabled);if(!enabled){setVpc('');setSubnet('');}}}>VPC 内网访问</Checkbox></Form.Item>
   {privateAccess&&<Form.Item label="私有网络" required showStatusIcon={false} status={validated&&networkError?'error':undefined} message={validated&&networkError?(!vpc?'请选择 VPC':'请选择子网'):undefined} extra={!(validated&&networkError)?'请先选择 VPC，再选择该 VPC 下的子网。':undefined}>
    <div className="_mirror-network-selectors"><Select value={vpc} onChange={value=>{setVpc(value);setSubnet('');}} options={networks.map(network=>({value:network.id,text:`${network.name} (${network.id})`}))} searchable placeholder="请选择 VPC" size="full"/><Select value={subnet} onChange={setSubnet} disabled={!vpc} options={subnets.map(item=>({value:item.id,text:`${item.name} (${item.id})`}))} searchable placeholder="请选择子网" size="full"/></div>
   </Form.Item>}
  </Form></>}

 </div></Modal.Body>
 <Modal.Footer><Button type="primary" onClick={save}>{initial?'保存':'创建仓库'}</Button><Button onClick={onClose}>取消</Button></Modal.Footer></Modal>;
}
