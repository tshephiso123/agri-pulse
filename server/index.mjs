import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),publicRoot=path.join(root,'public'),dataFile=path.join(root,'mock-data','entries.json');
let records=[];try{records=JSON.parse(await readFile(dataFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let writes=Promise.resolve();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const publicFiles=new Set(['index.html','js/app.js','js/data.js','js/storage.js','css/style.css','sw.js','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png']);
http.createServer(async(req,res)=>{const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/entries'){
 if(req.method==='GET')return send(200,records);
 if(req.method!=='POST')return send(405,{error:'Method not allowed'});
 let body='';for await(const chunk of req){body+=chunk;if(body.length>16000)return send(413,{error:'Too large'});}
 let record;try{record=JSON.parse(body);}catch{return send(400,{error:'Invalid JSON'});}
 if(!record||typeof record.id!=='string'||record.id.length>100||!['maize','beans','tomato'].includes(record.crop)||typeof record.field!=='string'||!record.field.trim()||record.field.length>100||typeof record.notes!=='string'||!record.notes.trim()||record.notes.length>2000||typeof record.createdAt!=='string'||!Number.isFinite(Date.parse(record.createdAt)))return send(400,{error:'Invalid record'});
 const clean={id:record.id,crop:record.crop,field:record.field,notes:record.notes,createdAt:record.createdAt};
 const operation=writes.then(async()=>{if(!records.some(r=>r.id===clean.id)){const next=[...records,clean];await mkdir(path.dirname(dataFile),{recursive:true});await writeFile(dataFile,JSON.stringify(next,null,2));records=next;}});writes=operation.catch(()=>{});await operation;return send(200,{id:clean.id});
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Method not allowed'});
 const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);if(!publicFiles.has(name))return send(404,{error:'Not found'});
 const content=await readFile(path.join(publicRoot,name));res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch(e){send(500,{error:'Server error'});}}).listen(Number(process.env.PORT)||4173,'0.0.0.0',()=>console.log('AgriPulse running at http://localhost:4173'));
