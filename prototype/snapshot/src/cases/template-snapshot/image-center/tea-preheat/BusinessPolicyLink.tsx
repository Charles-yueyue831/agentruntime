import React,{useEffect,useState} from 'react';
import {Button,Form} from '@tencent/tea-component';
import {autoUnloadStorageKey,matchingBusinessPolicy} from '../autoUnloadModel';

export default function BusinessPolicyLink({image}:{image:string}){
  const [,setVersion]=useState(0);
  useEffect(()=>{const refresh=(event:StorageEvent)=>{if(event.key===autoUnloadStorageKey||event.key===null)setVersion(version=>version+1)};window.addEventListener('storage',refresh);return()=>window.removeEventListener('storage',refresh)},[]);
  let policy;try{policy=matchingBusinessPolicy(image)}catch{return <Form.Text>—</Form.Text>}
  if(!policy)return <Form.Text>—</Form.Text>;
  return <Button type="link" onClick={()=>{
    const url=new URL(parent.location.href);
    url.searchParams.set('area','preheat');
    url.searchParams.set('preheatTab','unload');
    url.searchParams.set('unloadPolicy',policy!.id);
    parent.location.href=url.href;
  }}>{policy.name}</Button>;
}
