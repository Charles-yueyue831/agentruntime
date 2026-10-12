import React,{useState} from 'react';
import {createPortal} from 'react-dom';
import {Button,Bubble,ConfigProvider,Table,Justify,TagSearchBox,Modal} from '@tencent/tea-component';
import type {TagValue,AttributeValue} from '@tencent/tea-component/lib/tagsearchbox';
const attributes:AttributeValue[]=[
 {key:'id',name:'镜像预热 ID',type:'input'},
 {key:'image',name:'镜像地址',type:'input'},
 {key:'digest',name:'镜像摘要',type:'input'},
 {key:'status',name:'状态',type:'multiple',values:[['pending','排队中'],['processing','预热中'],['success','已预热'],['failed','预热失败'],['cancelled','预热已取消'],['unloaded','预热已卸载']].map(([key,name])=>({key,name}))},
 {key:'registry',name:'仓库类型',type:'multiple',values:[['enterprise','容器镜像服务企业版'],['personal','容器镜像服务个人版'],['custom','三方镜像仓库']].map(([key,name])=>({key,name}))},
 {key:'source',name:'来源类型',type:'multiple',values:['手动创建','自动创建','TCR自动预热'].map(name=>({key:name,name}))}
];
export default function PreheatToolbar({host}:{host:HTMLElement}){
 const [tags,setTags]=useState<TagValue[]>([]);const [download,setDownload]=useState(false);
 const send=(action:string,value?:TagValue[])=>host.ownerDocument.defaultView?.postMessage({type:'tea-preheat',action,value},location.origin);
 const filter=(value:TagValue[])=>{setTags(value);send('filter',value)};
 return createPortal(<ConfigProvider popupContainer={host.ownerDocument.body}><div className="preheat-tea-toolbar">
 <Table.ActionPanel><Button type="primary" onClick={()=>send('create')}>新建预热任务</Button></Table.ActionPanel>
 <Table.ActionPanel><Justify left={<TagSearchBox attributes={attributes} value={tags} onChange={filter} onClearButtonClick={()=>filter([])} tips="搜索预热 ID、镜像地址或选择筛选条件" minWidth={280} hideHelp/>} right={<div className="preheat-tea-tools"><Bubble content="刷新"><Button icon="refresh" aria-label="刷新任务列表" onClick={()=>send('refresh')}/></Bubble><Bubble content="下载"><Button icon="download" aria-label="下载任务列表" onClick={()=>setDownload(true)}/></Bubble></div>}/></Table.ActionPanel>
 {tags.length>0&&<div className="preheat-filter-summary">已应用 {tags.length} 项筛选条件<Button type="link" onClick={()=>filter([])}>清空筛选条件</Button></div>}
 <Modal visible={download} caption="下载预热任务列表" onClose={()=>setDownload(false)}><Modal.Body>将下载当前筛选条件下的全部任务，包含预热 ID、镜像地址、摘要、状态及创建时间，文件格式为 CSV。</Modal.Body><Modal.Footer><Button type="primary" onClick={()=>{send('export');setDownload(false)}}>下载</Button><Button onClick={()=>setDownload(false)}>取消</Button></Modal.Footer></Modal>
 </div></ConfigProvider>,host);
}
