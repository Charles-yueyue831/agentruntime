import React, {useState,useRef,useEffect} from 'react';
import {Form,Input,Select,Button,Card,InputNumber} from '@tencent/tea-component';
import ImageLaunchFields, {parseImageReference} from '../gpu-reference/ImageLaunchFields';
import ImagePicker from '../gpu-reference/ImagePicker';
import NetworkOptions from '../gpu-reference/NetworkOptions';
import {findPreheatStatus,preheatLabels} from '../image-center/preheat-state';
import '../gpu-reference/style.css';
import {BuildConfig,configSections} from '../build-config';
export default function BuildConfigFields({value,onChange,onReset,errors={}}:{value:BuildConfig;onChange:(value:BuildConfig)=>void;onReset:()=>void;errors?:Record<string,string>}) {
 const live=useRef(value);live.current=value;
 const update=(patch:BuildConfig)=>{live.current={...live.current,...patch};onChange(live.current)};
 const [picker,setPicker]=useState('');
 const [healthOpen,setHealthOpen]=useState(false);
 const [dnsOpen,setDnsOpen]=useState(!!value.dns);
 useEffect(()=>setDnsOpen(value.dnsEnabled==='true'||!!value.dns),[value.dns,value.dnsEnabled]);
 useEffect(()=>{if(Object.keys(errors).some(k=>k.startsWith('health')))setHealthOpen(true);},[errors]);
 const healthReady=!!value.healthPath?.trim()&&Number(value.healthPort)>0&&Number(value.healthPort)<=65535;
 const ref=parseImageReference(value.image||'');
 const preheat=findPreheatStatus(ref.image,ref.version,value.digest);
 const set=(key:string,v:string)=>update({...((key==='image'&&v!==live.current.image)?{digest:'',useDigest:'false'}:{}),[key]:v});
 return <div className="_snap-build-config-fields">
 <p className="_snap-muted">已继承所选沙箱模板的配置。<Button type="link" onClick={onReset}>恢复模板配置</Button></p>
 <ImageLaunchFields image={ref.image} version={ref.version} digest={value.digest||''} useDigest={value.useDigest==='true'}
 onImage={(image:string)=>update({image: image.lastIndexOf(':')>image.lastIndexOf('/')||image.includes('@')?image:image+':'+parseImageReference(live.current.image||'').version,digest:'',useDigest:'false'})} onVersion={(version:string)=>update({image:parseImageReference(live.current.image||'').image+':'+version,digest:''})} onDigest={(digest:string)=>update({digest})} onUseDigest={(v:boolean)=>set('useDigest',String(v))}
 imageValidation={{status:errors.image?'error':undefined,message:errors.image}} onPickImage={()=>setPicker('image')} onPickVersion={()=>setPicker('version')}
 preheatStatus={preheat} preheatLabel={preheatLabels[preheat]||'未预热'} launchMode={value.launchMode} onLaunchMode={(v:string)=>set('launchMode',v)} commands={value.command?value.command.split('\n'):['']} onCommands={(v:string[])=>set('command',v.join('\n'))} args={value.args||''} onArgs={(v:string)=>set('args',v)} env={value.env||''} onEnv={(v:string)=>set('env',v)} envError={errors.env}/>
 {picker&&<ImagePicker kind={picker} region="广州" image={ref.image} onClose={()=>setPicker('')} onImage={(image,config)=>{onChange({...value,image,digest:'',useDigest:'false',imageRegistryConfig:JSON.stringify(config)});setPicker('')}} onVersion={(version,digest,replace)=>{onChange({...value,image:ref.image+':'+version,digest,useDigest:'true',...(replace?{env:'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'}:{})});setPicker('')}}/>}
 <Card className="_ags-create-section _snap-resource-health"><Card.Body><div className="_ags-create-section-grid">
 <h3>资源与健康</h3><div><Form layout="fixed" fixedLabelWidth={130}>
 <Form.Item label="资源规格" required showStatusIcon={false} status={errors.cpu||errors.memory?'error':undefined} message={errors.cpu||errors.memory}>
 <div className="_snap-resource-inline">{([
 ['cpu','CPU',['1','2','4','8','16'],'核'],
 ['memory','内存',['1Gi','2Gi','4Gi','8Gi','16Gi','32Gi'],''],
 ['disk','系统盘大小',['不设置（使用默认值）','1','5','10','20'],'Gi']
 ] as [string,string,string[],string][]).map(([key,label,options,unit])=><div className={'_snap-resource-control _snap-resource-'+key} key={key}><span className="_snap-resource-label">{label}</span><Select aria-label={label} appearance="button" value={value[key]} onChange={v=>set(key,v)} options={[...new Set([...options,value[key]].filter(Boolean))].map(v=>({value:v,text:v}))}/>{unit&&<span className="_snap-resource-unit">{unit}</span>}</div>)}</div>
 </Form.Item>
 <Form.Item label="健康检查" required showStatusIcon={false}><div className="_ags-health-summary"><span className="_ags-health-badge">{healthReady?'已配置':'待配置'}</span><Button type="link" aria-expanded={healthOpen} onClick={()=>setHealthOpen(!healthOpen)}>{healthOpen?'收起':'查看配置项'}</Button></div>
 {healthOpen&&<div className="_ags-health-panel"><Form layout="fixed" fixedLabelWidth={130}>{configSections[3][1].map(([key,label])=><Form.Item key={key} label={label.replace('（ms）','')} showStatusIcon={false} status={errors[key]?"error":undefined} message={errors[key]}>
 {key==='healthPath'?<Input size="l" aria-label={label} value={value[key]||''} onChange={v=>set(key,v)} placeholder="请输入健康检查路径，如：/health"/>:key==='healthProtocol'?<Select size="l" aria-label={label} appearance="button" value={value[key]} onChange={v=>set(key,v)} options={['HTTP','HTTPS','TCP'].map(v=>({value:v,text:v}))}/>:<InputNumber size="l" inputProps={{"aria-label":label}} precision={0} unit={['healthReadyTimeout','healthProbeTimeout','healthInterval'].includes(key)?'ms':undefined} min={1} max={key==='healthPort'?65535:Number.MAX_SAFE_INTEGER} value={Number(value[key])} onChange={v=>set(key,String(v??''))}/>}
 </Form.Item>)}</Form></div>}
 </Form.Item></Form></div></div></Card.Body></Card>
 <Card className="_ags-create-section"><Card.Body><div className="_ags-create-section-grid"><h3>网络配置</h3><div><Form layout="fixed" fixedLabelWidth={130}>
 <NetworkOptions ports={(value.ports||'').split('\n').filter(Boolean).map(row=>{const [name,rest]=row.split(':');const [port,protocol]=(rest||'').split('/');return {name,port,protocol:protocol||'TCP'}})} onPorts={rows=>set('ports',rows.map(r=>r.name+':'+r.port+'/'+r.protocol).join('\n'))} dns={{servers:value.dns||'',searches:value.dnsSearches||'',options:value.dnsOptions||''}} onDns={d=>update({dns:d.servers,dnsSearches:d.searches,dnsOptions:d.options})} enabled={dnsOpen} onEnabled={v=>{setDnsOpen(v);update({dnsEnabled:String(v),...(!v?{dns:'',dnsSearches:'',dnsOptions:''}:{})});}} portValidation={{status:errors.ports?'error':undefined,message:errors.ports}} dnsValidation={{status:errors.dns?'error':undefined,message:errors.dns}}/>
 </Form></div></div></Card.Body></Card>
 </div>;
}
