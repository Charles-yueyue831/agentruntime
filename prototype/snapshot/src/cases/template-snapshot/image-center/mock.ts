import type { Repository } from './types';
export const defaultRegistryHost='tencentags-guangzhou-994-test.tencentcloudcr.com';
export const targets=['AGS','AGC','TKE','EKS'];
export const address=(r:Repository)=>r.address;
export function parseRepositoryAddress(value:string){
 const normalized=value.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i,'').replace(/[?#].*$/,'').replace(/\/+$/,'');
 const parts=normalized.split('/').filter(Boolean);
 const path=parts.slice(1);
 if(path.length<2) throw new Error('仓库地址需包含命名空间和仓库名称');
 const last=path.pop()!.replace(/@.*$/,'').replace(/:[^/]*$/,'');
 const host=parts[0].replace(/:\d+$/,'').toLowerCase();
 const repositoryType=/^[^.]+(?:\.[^.]+)*\.tencentcloudcr\.com$/.test(host)
  ?'容器镜像服务企业版'
  :host==='ccr.ccs.tencentyun.com'?'容器镜像服务个人版':'三方镜像仓库';
 return {name:last,namespace:path.join('/'),repositoryType};
}
const repositoryPaths=['preheat-bench/bench','agr-agent/julacliang-ags-image','nicklliao-test/nick-test','agr-agent/opencode','agr-agent/codex','agr-agent/claude-code','agr-agent/base','pengdrumli-osworld/osworld2-base','pengdrumli-osworld/osworld1-claude','pengdrumli-osworld/osworld1-base','ags.dev.private/nginx','ags-e2e/nexus-runtime'];
const repositoryAddresses=repositoryPaths.map(path=>`${defaultRegistryHost}/${path}`);
const targetCombinations=[targets,['AGS'],['AGC'],['TKE','EKS'],['AGS','AGC'],['AGS','TKE'],['EKS'],['AGC','TKE','EKS']];
export const networks=[
 {id:'vpc-ags-prod',name:'ags-production',subnets:[{id:'subnet-ags-gz7',name:'ags-production-gz7'},{id:'subnet-ags-gz6',name:'ags-production-gz6'}]},
 {id:'vpc-agent-dev',name:'agent-development',subnets:[{id:'subnet-agent-dev1',name:'agent-development-gz1'},{id:'subnet-agent-dev2',name:'agent-development-gz2'}]},
 {id:'vpc-tke-test',name:'tke-test',subnets:[{id:'subnet-tke-gz6',name:'tke-test-gz6'}]}
];
export const repositories:Repository[]=repositoryAddresses.map((address,i)=>{
 return {id:`repo-${i}`,address,...parseRepositoryAddress(address),supportedScenarios:[...targetCombinations[i%targetCombinations.length]],description:'用于沙箱启动与镜像加速',date:`2026-09-${String(16-Math.floor(i/2)).padStart(2,'0')} 16:23:34`,auto:i!==2,publicAccess:false,vpc:'vpc-ags-prod',targets:[...targetCombinations[i%targetCombinations.length]]};
});
