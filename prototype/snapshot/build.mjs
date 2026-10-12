import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const out='dist';
mkdirSync(out,{recursive:true});
await build({entryPoints:['portable.tsx'],bundle:true,format:'iife',outfile:out+'/bundle.js',loader:{'.html':'text','.svg':'dataurl','.png':'dataurl','.woff':'dataurl','.woff2':'dataurl','.ttf':'dataurl','.gif':'dataurl'},define:{'process.env.NODE_ENV':'"production"'},minify:true});
const js=readFileSync(out+'/bundle.js','utf8').replace(/<\/script/gi,'<\\/script');
const css=readFileSync(out+'/bundle.css','utf8');
writeFileSync('index.html','<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>模板快照 · Agent Runtime 交互原型</title><style>'+css+'</style></head><body><div id="root"></div><script>'+js+'</script></body></html>');
console.log('Standalone prototype built');
