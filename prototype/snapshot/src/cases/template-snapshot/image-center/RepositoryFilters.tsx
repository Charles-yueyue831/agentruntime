import React,{useState} from 'react';
import {TagSearchBox,Popover,DropdownBox} from '@tencent/tea-component';
import {FilterIcon} from '@tencent/tea-icons-react';
import type {Repository} from './types';
export type FilterTags=NonNullable<React.ComponentProps<typeof TagSearchBox>['value']>;
export type FilterAttribute=NonNullable<React.ComponentProps<typeof TagSearchBox>['attributes']>[number];
export function matchesRepository(record:Repository,tags:FilterTags){
 return tags.every(tag=>{
  const key=tag.attr?.key;
  const values=tag.values?.map(v=>v.name.toLowerCase()).filter(Boolean)||[];
  if(!values.length)return true;
  if(key==='supportedScenarios')return values.some(v=>record.supportedScenarios.some(scene=>scene.toLowerCase()===v));
  if(key==='namespace')return values.some(v=>record[key].toLowerCase()===v);
  const text=key==='address'?record.address:key==='name'?record.name:[record.name,record.namespace,record.address,...record.supportedScenarios].join(' ');
  return values.some(v=>text.toLowerCase().includes(v));
 });
}
export function FilterHeader({attribute,tags,onChange,label,options:providedOptions}:{attribute:FilterAttribute;tags:FilterTags;onChange:(tags:FilterTags)=>void;label?:string;options?:{key:string;name:string}[]}){
 const [visible,setVisible]=useState(false);
 const current=tags.find(t=>t.attr?.key===attribute.key);
 const options=providedOptions||(Array.isArray(attribute.values)?attribute.values:[]);
 const selected=current?.values?.map(v=>v.name)||[];
 function apply(name?:string){onChange([...tags.filter(t=>t.attr?.key!==attribute.key),...(name?[{attr:attribute,values:[{name,key:name}]}]:[])]);setVisible(false);}
 return <span className="_mirror-filter-heading">{label||attribute.name}<Popover trigger="click" placement="bottom-start" visible={visible} onVisibleChange={setVisible} overlay={<DropdownBox><div className="_mirror-filter-menu" role="menu" aria-label={`筛选${label||attribute.name}`} onKeyDown={event=>{if(event.key==='Escape')setVisible(false);}}><button type="button" role="menuitemradio" aria-checked={!selected.length} className={!selected.length?'is-selected':''} onClick={()=>apply()}>全部</button>{options.map(option=><button type="button" role="menuitemradio" aria-checked={selected.includes(option.name)} className={selected.includes(option.name)?'is-selected':''} key={option.key||option.name} onClick={()=>apply(option.name)}>{option.name}</button>)}</div></DropdownBox>}><button type="button" aria-label={`筛选${label||attribute.name}`} aria-pressed={!!current} aria-expanded={visible} aria-haspopup="menu" className={`_mirror-filter-trigger${current?' is-active':''}`}><FilterIcon size={14}/></button></Popover></span>;
}
