import React,{useState,useRef,useEffect} from 'react';
import {Layout,Menu,Tabs,Button,Table,Card,Justify,TagSearchBox,Copy,Bubble,Select,Modal,PopConfirm,message} from '@tencent/tea-component';
import PreheatToolbar from './PreheatToolbar';
import AutoPreheat from './AutoPreheat';
import {useSearchParams} from 'react-router-dom';
import RepositoryForm from './RepositoryForm';
import RepositoryDetail,{Instructions} from './RepositoryDetail';
import {repositories,address,targets} from './mock';
import {FilterHeader,matchesRepository} from './RepositoryFilters';
import type {FilterTags,FilterAttribute} from './RepositoryFilters';
import type {Repository} from './types';
import './style.css';
const secondaryMenus=[{id:'repositories',label:'高性能仓库'},{id:'preheat',label:'镜像预热'},{id:'snapshots',label:'模板快照'},{id:'resources',label:'资源预热'}];
export default function Page({preheatHtml,tab,setTab}:{preheatHtml:string;tab:string;setTab:(tab:string)=>void}){
 const [searchParams,setSearchParams]=useSearchParams();
 const preheatTab=searchParams.get('preheatTab')==='auto'?'auto':'tasks';
 function selectPreheatTab(id:string){const next=new URLSearchParams(searchParams);if(id==='auto')next.set('preheatTab','auto');else next.delete('preheatTab');setSearchParams(next);}
 const [preheatHost,setPreheatHost]=useState<HTMLElement|null>(null);
 function preparePreheat(){const doc=frame.current?.contentDocument;if(!doc)return;const anchor=doc.querySelector('.primary-actions');if(anchor&&!doc.getElementById('tea-preheat-toolbar')){const host=doc.createElement('div');host.id='tea-preheat-toolbar';anchor.before(host);document.querySelectorAll('style,link[rel="stylesheet"]').forEach(style=>doc.head.prepend(style.cloneNode(true)));setPreheatHost(host);}frame.current?.contentWindow?.postMessage('snapshot-open-preheat',location.origin)}
 const [data,setData]=useState<Repository[]>(repositories);const [filters,setFilters]=useState<FilterTags>([]);const [page,setPage]=useState(1);const [selected,setSelected]=useState<string[]>([]);const [detail,setDetail]=useState<string>();const [form,setForm]=useState<Repository|'new'>();const [instructions,setInstructions]=useState<Repository>();const [pendingDelete,setPendingDelete]=useState<string[]>([]);const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{if(tab==='preheat')frame.current?.contentWindow?.postMessage('snapshot-open-preheat',location.origin)},[tab]);
 const attributes:FilterAttribute[]=[{key:'name',name:'仓库名称',type:'input'},{key:'namespace',name:'命名空间',type:'multiple',values:Array.from(new Set(data.map(r=>r.namespace))).map(name=>({key:name,name}))},{key:'address',name:'仓库地址',type:'input'},{key:'supportedScenarios',name:'加速目标',type:'multiple',values:targets.map(name=>({key:name,name}))}];
 function updateFilters(value:FilterTags){setFilters(value);setPage(1);setSelected([]);}
 const header=(key:string)=><FilterHeader attribute={attributes.find(a=>a.key===key)!} options={key==='name'?Array.from(new Set(data.map(r=>r.name))).map(name=>({key:name,name})):undefined} tags={filters} onChange={updateFilters}/>;
 const active=data.find(r=>r.id===detail);const filtered=data.filter(r=>matchesRepository(r,filters));
 function confirmRemove(ids:string[]){setData(v=>v.filter(r=>!ids.includes(r.id)));setSelected(v=>v.filter(id=>!ids.includes(id)));setPage(1);message.success({content:'仓库已删除'});}
 function remove(ids:string[]){if(ids.length)setPendingDelete([...ids]);}
 function save(r:Repository){setData(v=>v.some(x=>x.id===r.id)?v.map(x=>x.id===r.id?r:x):[r,...v]);const creating=form==='new';setForm(undefined);message.success({content:creating?'仓库创建成功':'修改已保存'});if(creating){setDetail(undefined);setInstructions(undefined);setTab('repositories');updateFilters([]);}}
 return <div className="_mirror-workspace"><Layout.Content>{!(active&&tab==='repositories')&&<Layout.Content.Header title={<span className="_mirror-header-line"><span>{secondaryMenus.find(item=>item.id===tab)?.label}</span><span className="_mirror-region"><span>地域</span><Select value="gz" options={[{value:'gz',text:'广州'}]} appearance="button"/></span></span>}/>}
 {tab==='preheat'&&<div className="_accel-list-tabs _auto-tabs"><Tabs tabs={[{id:'tasks',label:'预热任务'},{id:'auto',label:'自动预热'}]} activeId={preheatTab} onActive={item=>selectPreheatTab(item.id)}/></div>}
 <div className="_mirror-page-content">
 <section hidden={tab!=='repositories'} aria-label="高性能仓库"><Layout.Content.Body>{active?<RepositoryDetail key={active.id} repo={active} onUpdate={updated=>setData(rows=>rows.map(row=>row.id===updated.id?updated:row))} onBack={()=>setDetail(undefined)} onEdit={()=>setForm(active)} onInstructions={()=>setInstructions(active)} onPreheat={()=>{setTab('preheat');}}/>:<div className="_mirror-console-list-body _mirror-list">
 
 
 <div className="_accel-toolbar">
 <Table.ActionPanel><Justify left={<><Button type="primary" onClick={()=>setForm('new')}>新建</Button><Button disabled={selected.length===0} onClick={()=>remove(selected)}>删除</Button></>}/></Table.ActionPanel>
 <Table.ActionPanel><Justify left={<TagSearchBox attributes={attributes} value={filters} tips="请选择筛选条件" attributesSelectTips="请选择筛选字段" hideHelp onChange={updateFilters} onClearButtonClick={()=>updateFilters([])}/> } right={<><Bubble content="刷新"><Button icon="refresh" aria-label="刷新仓库列表" onClick={()=>message.success({content:'列表已刷新'})}/></Bubble></>}/></Table.ActionPanel>
 </div>
 <Card><Table records={filtered} recordKey="id" columns={[{key:'name',header:header('name'),width:210,render:r=><Button type="link" onClick={()=>setDetail(r.id)}>{r.name}</Button>},{key:'namespace',header:header('namespace'),width:175},{key:'address',header:'仓库地址',width:520,render:r=><span className="_mirror-address"><span className="_mirror-address-text" title={address(r)}>{address(r)}</span><Copy text={address(r)}/></span>},{key:'supportedScenarios',header:header('supportedScenarios'),width:200,render:r=><span className="_mirror-scenarios">{r.supportedScenarios.map(scene=><span key={scene}>{scene}</span>)}</span>},{key:'date',header:'创建时间',width:180},{key:'actions',header:'操作',width:220,fixed:'right',render:r=><div className="_mirror-actions"><Button type="link" onClick={()=>setInstructions(r)}>快捷指令</Button><Button type="link" onClick={()=>setForm(r)}>编辑</Button><PopConfirm placement="top-end" closeOnScroll className="_mirror-delete-confirm" title="确定要删除该镜像仓库吗？" message={`即将删除镜像仓库：${r.namespace}/${r.name}`} footer={close=><><Button type="link" onClick={()=>{close();confirmRemove([r.id]);}}>删除</Button><Button type="text" onClick={close}>取消</Button></>}><Button type="link">删除</Button></PopConfirm></div>}]} addons={[Table.addons.selectable({value:selected,onChange:setSelected}),Table.addons.scrollable({minWidth:1570}),Table.addons.autotip({isLoading:false,emptyText:'暂无镜像仓库',isFound:filters.length>0,foundKeyword:filters.length?'当前筛选条件':undefined,onClear:()=>updateFilters([])}),Table.addons.pageable({pageIndex:page,onPagingChange:({pageIndex})=>setPage(pageIndex||1),pageSize:30,pageSizeOptions:[30,50,100,200]})]}/></Card>
 </div>}</Layout.Content.Body></section>
 <section hidden={tab!=='preheat'||preheatTab!=='tasks'} aria-label="镜像预热"><div className="_mirror-preheat"><iframe onLoad={preparePreheat} ref={frame} title="镜像预热交互原型" src={preheatHtml?undefined:"/preheat/index.html"} srcDoc={preheatHtml}/>{preheatHost&&<PreheatToolbar host={preheatHost}/>}</div></section>
 <section hidden={tab!=='preheat'||preheatTab!=='auto'} aria-label="自动预热"><AutoPreheat/></section>
 {secondaryMenus.slice(2).map(t=><section key={t.id} hidden={tab!==t.id} aria-label={t.label}><Layout.Content.Body><Card><div className="_mirror-empty"><div className="_mirror-empty-icon">{t.id==='snapshots'?<svg viewBox="0 0 64 64"><path d="m32 8 24 12-24 12L8 20Zm-24 24 24 12 24-12M8 44l24 12 24-12"/></svg>:<svg viewBox="0 0 64 64"><path d="M12 12h40v40H12zM22 22h20v20H22zM24 4v8m16-8v8M24 52v8m16-8v8M4 24h8m-8 16h8m40-16h8m-8 16h8"/></svg>}</div><h2>{t.label}</h2><p>{t.id==='snapshots'?'保存模板运行环境，复用已准备的启动状态。':'提前准备运行所需资源，减少启动等待。'}</p><span className="_mirror-muted">功能入口预留，具体交互待方案补充。</span><Button onClick={()=>setTab('preheat')}>查看镜像预热</Button></div></Card></Layout.Content.Body></section>)}
 </div>
 {form&&<RepositoryForm initial={form==='new'?undefined:form} names={data.map(r=>r.name)} onClose={()=>setForm(undefined)} onSave={save}/>}{instructions&&<Instructions repo={instructions} onClose={()=>setInstructions(undefined)}/>}

 <Modal visible={pendingDelete.length>0} caption="批量删除仓库" size="l" className="_mirror-batch-delete" onClose={()=>setPendingDelete([])}>
 <Modal.Body><p className="_mirror-batch-warning">您将删除以下仓库，仓库内所有版本均将直接删除，且不可恢复，请谨慎操作</p>
 <div className="_mirror-batch-table"><Table records={data.filter(r=>pendingDelete.includes(r.id))} recordKey="id" bordered columns={[{key:'name',header:'仓库名称',render:r=><span className="_mirror-batch-name">{r.namespace}/{r.name}</span>},{key:'date',header:'仓库创建时间',width:280}]} /></div>
 </Modal.Body><Modal.Footer><Button type="primary" onClick={()=>{confirmRemove(pendingDelete);setPendingDelete([]);}}>确定</Button><Button onClick={()=>setPendingDelete([])}>取消</Button></Modal.Footer></Modal>

 </Layout.Content></div>;
}
