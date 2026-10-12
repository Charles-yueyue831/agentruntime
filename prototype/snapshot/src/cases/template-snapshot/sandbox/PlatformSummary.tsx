import React from 'react';
/** Adapted from platform/web/src/components/StatCard.vue. */
export default function PlatformSummary({items}:{items:{label:string;value:number;color?:string}[]}) {
 return <div className="_platform-stats">{items.map((item,index)=><section key={item.label} className={'_platform-stat _platform-stat-'+(item.color||index)}><span>{item.label}</span><strong>{item.value.toLocaleString()}</strong></section>)}</div>;
}
