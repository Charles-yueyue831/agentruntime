import {ToolVersion, imageRef} from './types';
import {fallbackMeta, read, ToolMeta} from './sandbox/data';

export type BuildConfig = Record<string,string>;
export const configSections: [string, [string,string][]][] = [
 ['基本配置', [['life','生命周期'],['ttl','超时时间'],['description','描述'],['cpu','CPU'],['memory','内存'],['disk','磁盘'],['resourceId','资源配置']]],
 ['镜像与启动', [['image','镜像地址'],['digest','镜像摘要'],['launchMode','启动方式'],['command','启动命令'],['args','启动参数'],['env','环境变量']]],
 ['网络与权限', [['network','网络策略'],['vpc','VPC'],['subnet','子网'],['securityGroups','安全组'],['role','角色 ARN'],['ports','端口配置'],['dns','DNS 服务器'],['dnsSearches','DNS 搜索域'],['dnsOptions','DNS 选项'],['launchAuthMode','鉴权方式'],['launchMetadata','Metadata']]],
 ['健康检查', [['healthPath','检查路径'],['healthPort','检查端口'],['healthProtocol','协议'],['healthReadyTimeout','就绪超时时间（ms）'],['healthProbeTimeout','探测超时时间（ms）'],['healthInterval','探测周期（ms）'],['healthSuccessThreshold','成功阈值'],['healthFailureThreshold','失败阈值']]],
 ['高级配置', [['storage','存储配置'],['logging','日志采集'],['logset','日志集'],['topic','日志主题'],['logPaths','采集路径'],['tags','腾讯云标签']]],
];
/** StartRequest 可覆盖字段，与模板自身的管理字段分离。 */
export const buildOverrideSections: [string, [string,string][]][] = [
 ['镜像与启动', [['image','镜像地址'],['digest','镜像摘要'],['launchMode','启动方式'],['command','启动命令'],['args','启动参数'],['env','环境变量'],['ports','端口配置']]],
 ['资源规格', [['cpu','CPU'],['memory','内存'],['disk','磁盘']]],
 ['健康检查', configSections[3][1]],
 ['DNS 与安全上下文', [['dns','DNS 服务器'],['dnsSearches','DNS 搜索域'],['dnsOptions','DNS 选项'],['securityContext','安全上下文']]],
 ['镜像准备', [['imageRegistryType','镜像仓库类型'],['imageRegistryConfig','镜像仓库配置']]],
 ['本次启动配置', [['network','网络策略'],['accessPolicy','访问策略'],['ttl','超时时间'],['autoPause','自动暂停'],['autoResume','自动恢复'],['launchMetadata','Metadata'],['mountOptions','挂载选项']]],
];
export const inheritedOnlyFields:[string,string][]=[['life','生命周期'],['description','模板描述'],['tags','腾讯云标签'],['resourceId','资源配置'],['vpc','VPC'],['subnet','子网'],['securityGroups','安全组'],['role','角色 ARN'],['launchAuthMode','鉴权方式'],['logging','日志采集'],['logset','日志集'],['topic','日志主题'],['logPaths','采集路径']];
export const overrideKeys=new Set([...buildOverrideSections.flatMap(([,fields])=>fields.map(([key])=>key)),'mounts','useDigest']);
export function mergeBuildConfig(inherited:BuildConfig,edited:BuildConfig):BuildConfig {
 return {...inherited,...Object.fromEntries(Object.entries(edited).filter(([key])=>overrideKeys.has(key)))};
}
export function validateBuildConfig(config:BuildConfig):Record<string,string>{
 const errors:Record<string,string>={};
 if(!config.image?.trim()) errors.image='请填写镜像地址';
 if(!Number.isFinite(Number(config.cpu))||Number(config.cpu)<=0) errors.cpu='CPU 必须大于 0';
 if(!config.memory?.trim()) errors.memory='请填写内存';
 if(!config.healthPath?.trim())errors.healthPath='请输入健康检查路径';
 for(const key of ['healthPort','healthReadyTimeout','healthProbeTimeout','healthInterval','healthSuccessThreshold','healthFailureThreshold']){
  const n=Number(config[key]);if(!Number.isInteger(n)||n<1||(key==='healthPort'&&n>65535))errors[key]=key==='healthPort'?'请输入 1～65535 的端口号':'请输入大于 0 的整数';
 }
 const envKeys=new Set<string>();
 for(const row of (config.env||'').split('\n').filter(Boolean)){const i=row.indexOf('=');const key=row.slice(0,i);if(i<1||!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)||envKeys.has(key))errors.env='变量名需以字母或下划线开头，仅包含字母、数字和下划线，且不可重复';envKeys.add(key);}
 const names=new Set<string>(),ports=new Set<string>();
 for(const row of (config.ports||'').split('\n').filter(Boolean)){const m=row.match(/^([^:]+):(\d+)\/(TCP|UDP)$/);if(!m||Number(m[2])<1||Number(m[2])>65535||names.has(m[1])||ports.has(m[2]+'/'+m[3]))errors.ports='请填写不重复的端口名称和 1～65535 的端口号';if(m){names.add(m[1]);ports.add(m[2]+'/'+m[3]);}}
 if(config.dnsEnabled==='true'&&!config.dns?.trim())errors.dns='启用 DNS 配置后，请填写 Servers';
 if(config.dns?.trim())for(const ip of config.dns.split(/[\s,]+/).filter(Boolean)){let valid=false;if(/^(\d{1,3}\.){3}\d{1,3}$/.test(ip))valid=ip.split('.').every(n=>Number(n)<=255);else if(ip.includes(':'))try{valid=!!new URL('http://['+ip+']/').hostname}catch{}if(!valid)errors.dns='请填写有效的 DNS 服务器 IP 地址';}
 return errors;
}
export function inheritedConfig(v:ToolVersion): BuildConfig {
 const meta={...fallbackMeta(v),...read<Record<string,ToolMeta>>('tool-meta',{})[v.toolId]};
 const c=meta.advancedConfig,h=c?.health;
 return {
  image:imageRef(v),digest:c?.digest??v.imageDigest, useDigest:String(c?.useDigest??false),
  command:meta.command,args:c?.args??'',env:c?.env??'',cpu:meta.cpu,memory:meta.memory,network:meta.network,
  life:meta.life,ttl:meta.life==='常驻沙箱'?'不限时':c?.ttl??'300秒',description:meta.description,tags:meta.tags,
  resourceId:meta.resourceId??'',disk:c?.disk??'不设置（使用默认值）',storage:c?.storage??'',mounts:JSON.stringify(c?.mounts??[]),
  launchMode:c?.launchMode??(meta.command?'custom':'image'),vpc:c?.vpc??'',subnet:c?.subnet??'',role:c?.role??'',
  securityGroups:c?.securityGroups?.join('\n')??'',ports:c?.launchPorts?.map(p=>`${p.name}:${p.port}/${p.protocol}`).join('\n')??c?.ports??'',
  dns:c?.launchDns?.servers??c?.dns??'',dnsSearches:c?.launchDns?.searches??'',dnsOptions:c?.launchDns?.options??'',
  healthPath:h?.path??'/health',healthPort:h?.port??'49983',healthProtocol:h?.protocol??'HTTP',
  healthReadyTimeout:h?.readyTimeout??'30000',healthProbeTimeout:h?.probeTimeout??'2000',healthInterval:h?.interval??'1000',healthSuccessThreshold:h?.successThreshold??'1',healthFailureThreshold:h?.failureThreshold??'100',
  logging:String(c?.logging??false),logset:c?.loggingConfig?.logset??'',topic:c?.loggingConfig?.topic??'',logPaths:c?.loggingConfig?.paths.map(p=>p.folder+'/'+p.file).join('\n')??'',
  securityContext:JSON.stringify(c?.securityContext??{}),mountOptions:JSON.stringify(c?.mountOptions??{}),accessPolicy:JSON.stringify(c?.accessPolicy??{}),autoPause:c?.autoPause===undefined?'':String(c.autoPause),autoResume:c?.autoResume===undefined?'':String(c.autoResume),imageRegistryType:c?.imageRegistryType??'',imageRegistryConfig:JSON.stringify(c?.imageConfig??{}),
  launchAuthMode:c?.launchAuthMode??'',launchMetadata:c?.launchMetadata??'', imageConfig:JSON.stringify(c?.imageConfig??{}),
 };
}
export function configFingerprint(config:BuildConfig):string {
 // 网络、外部挂载、超时与元数据不直接参与匹配；镜像使用解析后的身份。
 const keys=['digest','launchMode','command','args','env','ports','cpu','memory','disk','dns','dnsSearches','dnsOptions','securityContext',...configSections[3][1].map(([key])=>key),'logging','logset','topic','logPaths'];
 const effective:BuildConfig={...config,digest:config.digest||config.image,command:config.launchMode==='image'?'':config.command,args:config.launchMode==='image'?'':config.args};
 let hash=2166136261; const text=JSON.stringify(keys.sort().map(k=>[k,effective[k]??'']));
 for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
 return 'cfg-'+(hash>>>0).toString(16);
}
