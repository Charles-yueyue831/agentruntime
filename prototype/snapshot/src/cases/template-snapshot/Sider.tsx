import React from 'react';
import {Menu} from '@tencent/tea-component';
import {AppIcon} from '@tencent/tea-icons-react';
import {useSearchParams} from 'react-router-dom';
import './sider.css';

export default function Sider(){
  const [params,setParams]=useSearchParams();
  const area=params.get('area');
  const create=params.get('view')==='create'&&!area;
  const sandbox=area==='templates'||area==='instance';
  const quota=area==='quota';
  const navigate=(area?:string)=>{const p=new URLSearchParams(params);p.delete('view');if(area)p.set('area',area);else p.delete('area');setParams(p)};
  const item=(title:string,selected=false,onClick?:()=>void,external=false)=><Menu.Item key={title} title={title} icon={<AppIcon size={16}/>} selected={selected} onClick={onClick} external={external}/>;
  return <div className={'_snap-navigation'+(create||sandbox||quota?' _snap-navigation--create':'')}>
    <Menu className="_snap-primary-menu" theme="light" title="Agent Runtime">
      {item('快速开始')}
      <Menu.Group title="Agent 沙箱">
        {item('沙箱模板',create||area==='templates',()=>setParams({area:'templates'}))}
        {item('沙箱实例',area==='instance',()=>setParams({area:'instance'}))}
        {item('存储管理')}
        {item('加速中心',!create&&!sandbox&&!quota,()=>setParams({tab:'builds'}))}
        {item('Agent Cluster',false,undefined,true)}
      </Menu.Group>
      <Menu.Group title="Agent 引擎">
        {item('弹性部署')}{item('会话管理')}{item('注册中心')}
      </Menu.Group>
      <Menu.Group title="Agent 治理">
        {item('API Keys')}{item('身份凭证')}{item('网络连接器')}{item('策略组')}
      </Menu.Group>
      <Menu.Group title="运维中心">
        {item('用量配额',quota,()=>setParams({area:'quota'}))}{item('事件中心')}
      </Menu.Group>
    </Menu>
    {!create&&!sandbox&&!quota&&<Menu className="_snap-secondary-menu" theme="light" title="加速中心">
      <Menu.Item title="高性能仓库" selected={area==='repositories'} onClick={()=>navigate('repositories')}/>
      <Menu.Item title="镜像预热" selected={area==='preheat'} onClick={()=>navigate('preheat')}/>
      <Menu.Item title="模板快照" selected={!area} onClick={()=>navigate()}/>
      <Menu.Item title="沙箱预创"/>
    </Menu>}
  </div>;
}
