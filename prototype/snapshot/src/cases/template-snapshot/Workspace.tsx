import React,{useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import SnapshotPage from './Page';
import SandboxPage from './sandbox/Page';
import ImageCenter from './image-center/Page';
import preheatHtml from './image-center/preheat.html?raw';
import './workspace.css';
import {migratePrototypeData} from './sandbox/data';

export default function Workspace(){
  useState(()=>{migratePrototypeData();return true});
  const [params,setParams]=useSearchParams();
  const area=params.get('area')==='instances'?'instance':params.get('area');
  useEffect(()=>{if(params.get('area')==='instances'||(params.get('area')==='instance'&&params.get('section')==='instances')){const next=new URLSearchParams(params);next.set('area','instance');if(next.get('section')==='instances')next.delete('section');next.delete('tab');setParams(next,{replace:true});}},[params,setParams]);
  const sandboxActive=area==='templates'||area==='instance';
  const quotaActive=area==='quota';
  const [quotaOpened,setQuotaOpened]=useState(quotaActive);
  useEffect(()=>{if(quotaActive)setQuotaOpened(true)},[quotaActive]);
  const imageActive=area==='repositories'||area==='preheat';
  const [imageOpened,setImageOpened]=useState(imageActive);
  const [lastImageArea,setLastImageArea]=useState(imageActive?area:'repositories');
  useEffect(()=>{if(imageActive){setImageOpened(true);setLastImageArea(area)}},[imageActive,area]);
  const navigate=(next:string)=>{const p=new URLSearchParams(params);p.set('area',next);p.delete('view');setParams(p)};
  return <div className="_snapshot-workspace">
    {sandboxActive?<div className="_snapshot-workspace-panel"><SandboxPage/></div>:<div className="_snapshot-workspace-panel" hidden={imageActive||quotaActive}><SnapshotPage/></div>}
    {(imageOpened||imageActive)&&<div className="_snapshot-workspace-panel" hidden={!imageActive}><ImageCenter tab={imageActive?area:lastImageArea} setTab={navigate} preheatHtml={preheatHtml}/></div>}
    {(quotaOpened||quotaActive)&&<div className="_snapshot-workspace-panel _snapshot-quota-panel" hidden={!quotaActive}><iframe title="用量配额" src="https://julacliang.pages.woa.com/tencent/monitor/?embed=1"/></div>}
  </div>;
}
