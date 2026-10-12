import React,{useState} from 'react';
import {Button,Tabs,TabPanel,Form,Table,Card,Copy,Modal,Justify,Input,Bubble,message,PopConfirm,TagSearchBox} from '@tencent/tea-component';
import type {Repository} from './types';
import {address} from './mock';
import RepositoryInfo from './RepositoryInfo';
import {FilterHeader} from './RepositoryFilters';
import type {FilterTags,FilterAttribute} from './RepositoryFilters';
function CommandBlock({command}:{command:string}) {
 return <div className="_mirror-command-block"><code>{command}</code><Copy text={command}/></div>;
}
export function Instructions({repo,onClose}:{repo:Repository;onClose:()=>void}){
 const a=address(repo);const host=a.split('/')[0];
 const thirdParty=repo.repositoryType==='三方镜像仓库';
 return <Modal visible caption="快捷指令" size="xl" className="_mirror-instructions-modal" onClose={onClose}>
 <Modal.Body><div className="_mirror-instructions">
 <section><h3>{thirdParty?'登录 Docker Registry':'登录腾讯云容器镜像服务 Docker Registry'}</h3>
 <CommandBlock command={`docker login ${host} --username [用户名]`}/>
 <p>{thirdParty?'请使用当前仓库的用户名和访问凭证登录。':'当前临时登录指令有效期为 1 小时，如需长期保持登录状态，请创建并使用 '}
 <Button type="link" onClick={()=>Modal.alert({message:'访问凭证',description:thirdParty?'请在镜像仓库的访问管理页面获取用户名及访问凭证，替换命令中的 [用户名]，执行后按提示输入密码。':'请在腾讯云容器镜像服务的访问凭证页面获取用户名及凭证，替换命令中的 [用户名]，执行后按提示输入密码。'})}>访问凭证</Button></p></section>
 <section><h3>向 Registry 中推送镜像</h3><CommandBlock command={`docker tag [imageId] ${a}:[tag]`}/><CommandBlock command={`docker push ${a}:[tag]`}/>
 <p>其中 [imageId] 请替换为您所要推送的实际镜像 ID，或使用本地镜像的完整路径。[tag] 请替换为您期望的镜像版本。更多命令说明，请参看官方文档：<a href="https://docs.docker.com/reference/cli/docker/image/tag/" target="_blank" rel="noreferrer">docker tag</a>、<a href="https://docs.docker.com/reference/cli/docker/image/push/" target="_blank" rel="noreferrer">docker push</a></p></section>
 </div></Modal.Body></Modal>;
}
const preheatStatusLabels={pending:'排队中',processing:'预热中',success:'已预热',failed:'预热失败',cancelled:'预热已取消',unloaded:'预热已卸载'};
type PreheatStatus=keyof typeof preheatStatusLabels;
const versionStatuses:PreheatStatus[]=['success','processing','pending','failed','unloaded','cancelled'];
interface ImageVersion {id:string;tag:string;size:string;digest:string;updated:string;preheatStatus:PreheatStatus;}
function initialVersions(repo:Repository):ImageVersion[]{
 if(!/^repo-\d{1,2}$/.test(repo.id))return [];
 return [13,5,23,1,16,22,24,25,20,2,11,7,12,3,17,15,19].map((n,i)=>({id:`${repo.id}-v${i}`,tag:`diag3-w${n}-${1789551887272023620n+BigInt(i)*119722846n}`,size:'2.11 MB',preheatStatus:versionStatuses[i%versionStatuses.length],digest:`sha256:b7f3d86d6e84fc17718c48b${String(i).padStart(43,'0')}`,updated:repo.date}));
}
export default function RepositoryDetail({repo,onBack,onEdit,onUpdate,onPreheat}:{repo:Repository;onBack:()=>void;onEdit:()=>void;onInstructions:()=>void;onPreheat:(url:string)=>void;onUpdate:(r:Repository)=>void}){
 const [tab,setTab]=useState('versions');const [versions,setVersions]=useState(()=>initialVersions(repo));const [selected,setSelected]=useState<string[]>([]);const [versionFilters,setVersionFilters]=useState<FilterTags>([]);const [page,setPage]=useState(1);
 const [dialog,setDialog]=useState<{type:'login';version?:ImageVersion}>();const [deleting,setDeleting]=useState<string[]>([]);
 const registryHost=address(repo).split('/')[0];
 const instanceName=registryHost.replace(/\.tencentcloudcr\.com$/,'');
 const loginCommand=`docker login ${registryHost} --username [用户名] --password [临时访问凭证]`;
 const latestVersion=[...versions].sort((a,b)=>b.updated.localeCompare(a.updated))[0];
 const versionAttributes:FilterAttribute[]=[{key:'tag',name:'镜像版本',type:'input'},{key:'preheatStatus',name:'镜像预热状态',type:'multiple',values:Object.values(preheatStatusLabels).map(name=>({key:name,name}))}];
 function updateVersionFilters(value:FilterTags){setVersionFilters(value);setPage(1);setSelected([]);}
 const visible=versions.filter(v=>versionFilters.every(filter=>{
  const terms=filter.values?.map(value=>value.name.trim().toLowerCase()).filter(Boolean)||[];
  if(!terms.length)return true;
  if(filter.attr?.key==='preheatStatus')return terms.includes(preheatStatusLabels[v.preheatStatus].toLowerCase());
  return terms.some(term=>v.tag.toLowerCase().includes(term));
 }));
 function deleteVersions(ids:string[]){setVersions(rows=>rows.filter(v=>!ids.includes(v.id)));setSelected(keys=>keys.filter(k=>!ids.includes(k)));setDeleting([]);setPage(1);message.success({content:'镜像版本已删除'});}
 return <div className="_mirror-version-detail">
 <div className="_mirror-version-header"><Button type="link" onClick={onBack} aria-label="返回高性能仓库列表">←</Button><h2>{repo.namespace}/{repo.name}</h2></div>
 <Tabs tabs={[{id:'versions',label:'版本管理'},{id:'info',label:'仓库信息'}]} activeId={tab} onActive={t=>setTab(String(t.id))}>
 <TabPanel id="versions"><div className="console-list-body _mirror-version-list">
 <Table.ActionPanel><Justify left={<><Button type="primary" onClick={()=>setDialog({type:'login'})}>临时登录指令</Button><Button disabled={!selected.length} onClick={()=>setDeleting([...selected])}>删除</Button></>} right={<><TagSearchBox attributes={versionAttributes} value={versionFilters} tips="请选择筛选条件" attributesSelectTips="请选择筛选字段" hideHelp onChange={updateVersionFilters} onClearButtonClick={()=>updateVersionFilters([])}/><Bubble content="刷新"><Button icon="refresh" onClick={()=>message.success({content:'版本列表已刷新'})}/></Bubble></>}/></Table.ActionPanel>
 <Card><Table records={visible} recordKey="id" columns={[
 {key:'tag',header:'镜像版本',width:300,render:r=><span className="_mirror-version-copy"><span title={r.tag}>{r.tag}</span><Copy text={r.tag}/></span>},
 {key:'preheatStatus',header:<FilterHeader attribute={versionAttributes[1]} label="预热状态" tags={versionFilters} onChange={updateVersionFilters}/>,width:150,render:r=><span className={`_mirror-preheat-state _mirror-preheat-state--${r.preheatStatus}`}>{preheatStatusLabels[r.preheatStatus]}</span>},
 {key:'size',header:'预热大小',width:110,render:r=>['success','unloaded'].includes(r.preheatStatus)?r.size:'—'},
 {key:'digest',header:'摘要(SHA256)',width:270,render:r=><span className="_mirror-version-copy"><span title={r.digest}>{r.digest}</span><Copy text={r.digest}/></span>},
 {key:'updated',header:'更新时间',width:180},
 {key:'actions',header:'操作',width:160,fixed:'right',render:r=><div className="_mirror-version-actions"><Button type="link" onClick={()=>onPreheat(`${address(repo)}:${r.tag}`)}>预热信息</Button><PopConfirm placement="top-end" title="确定要删除该镜像版本吗？" message={r.tag} footer={close=><><Button type="link" onClick={()=>{close();deleteVersions([r.id]);}}>删除</Button><Button type="text" onClick={close}>取消</Button></>}><Button type="link">删除</Button></PopConfirm></div>}
 ]} addons={[Table.addons.selectable({value:selected,onChange:setSelected}),Table.addons.scrollable({minWidth:1300}),Table.addons.autotip({isLoading:false,emptyText:'暂无镜像版本',isFound:versionFilters.length>0,foundKeyword:versionFilters.length?'当前筛选条件':undefined,onClear:()=>{setVersionFilters([]);setPage(1)}}),Table.addons.pageable({pageIndex:page,onPagingChange:({pageIndex})=>setPage(pageIndex||1),pageSize:30,pageSizeOptions:[30,50,100,200]})]}/></Card>
 </div></TabPanel>
 <TabPanel id="info"><div className="_mirror-version-panel"><RepositoryInfo repo={repo} status={latestVersion?preheatStatusLabels[latestVersion.preheatStatus]:undefined} size={latestVersion?.size} version={latestVersion?.tag} onUpdate={onUpdate}/></div></TabPanel>
 </Tabs>
 <Modal visible={!!dialog} caption="临时登录指令" size={dialog?.type==='login'?'xl':'l'} className={dialog?.type==='login'?'_mirror-login-modal':undefined} onClose={()=>setDialog(undefined)}><Modal.Body>
 {dialog?.type==='login'&&<Form readonly className="_mirror-login-form"><Form.Item label="所属实例"><Form.Text>{instanceName}</Form.Text></Form.Item><Form.Item label="登录指令" align="top"><Input.TextArea readonly value={loginCommand} rows={12} size="full" aria-label="登录指令"/></Form.Item></Form>}
 </Modal.Body><Modal.Footer>{dialog?.type==='login'?<Copy text={loginCommand} onCopy={(_,ctx)=>{if(!ctx.result)message.error({content:'复制失败，请选中登录指令手动复制'});}}>{copied=><Button type="primary">{copied?'已复制':'复制登录指令'}</Button>}</Copy>:<Button type="primary" onClick={()=>setDialog(undefined)}>关闭</Button>}</Modal.Footer></Modal>
 <Modal visible={!!deleting.length} caption="批量删除镜像版本" size="l" onClose={()=>setDeleting([])}><Modal.Body><p className="_mirror-dialog-lead">您将删除以下镜像版本，且不可恢复，请谨慎操作。</p><Table records={versions.filter(v=>deleting.includes(v.id))} columns={[{key:'tag',header:'镜像版本'},{key:'updated',header:'更新时间',width:180}]}/></Modal.Body><Modal.Footer><Button type="primary" onClick={()=>deleteVersions(deleting)}>确定</Button><Button onClick={()=>setDeleting([])}>取消</Button></Modal.Footer></Modal>
 </div>;
}
