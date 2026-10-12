import type {Resource,Tool} from './types';
export const specs=[{id:'GN7.2XLARGE32',gpu:'NVIDIA T4',vram:16,cpu:8,memory:32,price:1529.28,stock:16},{id:'PNV4.7XLARGE116',gpu:'NVIDIA A10',vram:24,cpu:28,memory:116,price:4200,stock:8},{id:'PNV5b.12XLARGE192',gpu:'NVIDIA L20',vram:48,cpu:48,memory:192,price:6800,stock:16},{id:'L40.48.192',gpu:'NVIDIA L40',vram:48,cpu:48,memory:192,price:7200,stock:16},{id:'V100.10.40',gpu:'NVIDIA V100',vram:32,cpu:10,memory:40,price:3800,stock:16},{id:'H20.16.160',gpu:'NVIDIA H20',vram:96,cpu:16,memory:160,price:9600,stock:0},{id:'GC49d.20.92',gpu:'NVIDIA GC49d',vram:24,cpu:20,memory:92,price:3200,stock:16}];
export const initialResources:Resource[]=[
{id:'gpu-7f3a9c21',name:'image-generation-prod',spec:specs[1].id,region:'广州',scope:['production'],total:8,used:3,status:'ready',expiry:'2026-10-14',renew:true},
{id:'gpu-2d8b4e10',name:'code-interpreter-dev',spec:specs[0].id,region:'广州',scope:[],total:4,used:1,status:'ready',expiry:'2026-10-14',renew:true},
{id:'gpu-9c1e5a63',name:'vision-inference-pool',spec:specs[1].id,region:'广州',scope:[],total:2,used:2,status:'ready',expiry:'2026-11-14',renew:false},
{id:'gpu-6a4d0b82',name:'model-evaluation',spec:specs[0].id,region:'广州',scope:['development'],total:2,used:0,status:'preparing',expiry:'2026-10-14',renew:false},
{id:'gpu-1b5e8f34',name:'experiment-archive',spec:specs[0].id,region:'广州',scope:[],total:2,used:0,status:'expired',expiry:'2026-09-12',renew:false}];
export const statusText={ready:'可用',recovering:'恢复中',preparing:'准备中',expired:'已到期',failed:'准备失败',releasing:'停服中',released:'已释放'};
