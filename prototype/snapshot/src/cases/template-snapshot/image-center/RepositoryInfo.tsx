import React,{useState} from 'react';
import {Card,Form,Copy,Button,Input,Modal,Bubble} from '@tencent/tea-component';
import {EditIcon} from '@tencent/tea-icons-react';
import type {Repository} from './types';
export default function RepositoryInfo({repo,status,size,version,onUpdate}:{repo:Repository;status?:string;size?:string;version?:string;onUpdate:(r:Repository)=>void}){
 const [editing,setEditing]=useState<'brief'|'detail'>();const [draft,setDraft]=useState('');
 const canShowSize=status==='已预热'||status==='预热已卸载';
 function edit(which:'brief'|'detail'){setDraft(which==='brief'?repo.description:repo.detailedDescription||'');setEditing(which);}
 function save(){onUpdate({...repo,...(editing==='brief'?{description:draft}:{detailedDescription:draft}),updatedAt:new Date().toLocaleString('sv-SE')});setEditing(undefined);}
 function command(text:string){return <div className="_mirror-info-command"><code title={text}>{text}</code><Copy text={text}/></div>;}
 return <div className="_mirror-repository-info">
 <Card><div className="_mirror-info-card-heading">基本信息</div><div className="_mirror-info-columns">
 <div className="_mirror-info-properties"><Form readonly>
 <Form.Item label="仓库名称"><Form.Text>{repo.name}</Form.Text></Form.Item>
 <Form.Item label="仓库地址"><Form.Text><span className="_mirror-info-address">{repo.address}</span></Form.Text></Form.Item>
 <Form.Item label="加速目标"><Form.Text><span className="_mirror-scenarios">{repo.supportedScenarios.map(scene=><span key={scene}>{scene}</span>)}</span></Form.Text></Form.Item>
 <Form.Item label="预热状态"><Form.Text>{status||'—'}</Form.Text></Form.Item>
 <Form.Item label="预热大小"><Form.Text>{canShowSize?size||'—':'—'}</Form.Text></Form.Item>
 <Form.Item label="创建时间"><Form.Text>{repo.date}</Form.Text></Form.Item>
 <Form.Item label="更新时间"><Form.Text>{repo.updatedAt||repo.date}</Form.Text></Form.Item>
 <Form.Item label="简短描述"><Form.Text><span className="_mirror-info-description">{repo.description||'—'}</span><Bubble content="编辑简短描述"><button className="_mirror-info-edit" aria-label="编辑简短描述" onClick={()=>edit('brief')}><EditIcon size={16}/></button></Bubble></Form.Text></Form.Item>
 </Form></div>
 <div className="_mirror-info-guide">
 <section><h3>登录腾讯云容器镜像服务 Docker Registry</h3>{command(`docker login ${repo.address.split('/')[0]} --username [用户名] --password [临时访问凭证]`)}<p>当前临时登录指令有效期为 1 小时，如需长期保持登录状态，请创建并使用 <Button type="link" onClick={()=>Modal.alert({message:'访问凭证',description:'请在腾讯云容器镜像服务的访问凭证页面获取用户名及凭证，并替换指令中的占位内容。'})}>访问凭证</Button></p></section>
 <section><h3>向 Registry 中推送镜像</h3>{command(`docker tag [imageId] ${repo.address}:[tag]`)}{command(`docker push ${repo.address}:[tag]`)}<p>其中 [imageId] 请替换为实际镜像 ID，或使用本地镜像的完整路径。[tag] 请替换为期望的镜像版本。更多命令说明，请参看官方文档：<a href="https://docs.docker.com/reference/cli/docker/image/tag/" target="_blank" rel="noreferrer">docker tag</a>、<a href="https://docs.docker.com/reference/cli/docker/image/push/" target="_blank" rel="noreferrer">docker push</a></p></section>
 </div></div></Card>
 <Card><div className="_mirror-info-card-heading">详细描述<Bubble content="编辑详细描述"><button className="_mirror-info-edit" aria-label="编辑详细描述" onClick={()=>edit('detail')}><EditIcon size={16}/></button></Bubble></div><div className="_mirror-info-long-description">{repo.detailedDescription||''}</div></Card>
 <Modal visible={!!editing} caption={editing==='brief'?'编辑简短描述':'编辑详细描述'} onClose={()=>setEditing(undefined)} size="l"><Modal.Body><Input.TextArea value={draft} onChange={setDraft} size="full" rows={editing==='brief'?3:8} maxLength={editing==='brief'?200:5000} placeholder={editing==='brief'?'请输入简短描述':'请输入详细描述'}/></Modal.Body><Modal.Footer><Button type="primary" onClick={save}>保存</Button><Button onClick={()=>setEditing(undefined)}>取消</Button></Modal.Footer></Modal>
 </div>;
}
