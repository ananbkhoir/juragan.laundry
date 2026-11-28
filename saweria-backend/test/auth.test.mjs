import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs'; import crypto from 'node:crypto';
import worker,{_test} from '../src/worker.js';
const sql=new DatabaseSync(':memory:'); sql.exec(fs.readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
const DB={prepare:(q)=>{let args=[];const st=sql.prepare(q.replace(/\?\d+/g,m=>'?'+m.slice(1)));const o={bind:(...a)=>{args=a;return o},
  run:async()=>{const r=st.run(...args);return{meta:{changes:Number(r.changes)}}},first:async()=>st.get(...args)??null,all:async()=>({results:st.all(...args)})};return o},batch:async(arr)=>{const out=[];for(const s of arr)out.push(await s.run());return out}};
const env={DB,SAWERIA_STREAM_KEY:'sk',ADMIN_KEY:'adm',ALLOWED_ORIGIN:'https://game.test,http://localhost:8099',GOOGLE_CLIENT_ID:'cid.apps.googleusercontent.com'};
const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'k1',alg:'RS256',use:'sig'};
globalThis.fetch=async(u)=>new Response(JSON.stringify({keys:[jwk]}),{status:200});
const b64=o=>Buffer.from(typeof o==='string'?o:JSON.stringify(o)).toString('base64url');
const idt=(p,key=privateKey,kid='k1')=>{const h=b64({alg:'RS256',kid,typ:'JWT'}),b=b64({iss:'https://accounts.google.com',aud:env.GOOGLE_CLIENT_ID,exp:Math.floor(Date.now()/1000)+600,iat:Math.floor(Date.now()/1000),email_verified:true,...p});
  const sig=crypto.sign('RSA-SHA256',Buffer.from(h+'.'+b),key).toString('base64url');return h+'.'+b+'.'+sig};
const call=async(path,opt={},tok)=>{const r=await worker.fetch(new Request('https://w.test'+path,{...opt,headers:{'Content-Type':'application/json','Origin':'http://localhost:8099',...(tok?{Authorization:'Bearer '+tok}:{}),...(opt.headers||{})}}),env);let j=null;try{j=await r.json()}catch{};return{s:r.status,j,cors:r.headers.get('Access-Control-Allow-Origin')}};
const login=(p)=>call('/api/auth/google',{method:'POST',body:JSON.stringify({credential:idt(p)})});
let r=await login({sub:'111',email:'a@x.com',name:'Andi Pratama',given_name:'Andi',picture:'https://p/a.png'});console.log('login',r.s,r.j.user,r.cors);const A=r.j.token;
console.log('code match client fn',r.j.user.code===_test.playerCode('g:111'));
r=await login({sub:'222',email:'b@x.com',name:'Budi',given_name:'Budi'});const B=r.j.token,codeB=r.j.user.code;
r=await login({sub:'333',name:'Citra'});const C=r.j.token,codeC=r.j.user.code;
console.log('bad aud',(await call('/api/auth/google',{method:'POST',body:JSON.stringify({credential:idt({sub:'9',aud:'other'})})})).s);
console.log('expired',(await call('/api/auth/google',{method:'POST',body:JSON.stringify({credential:idt({sub:'9',exp:100})})})).s);
const evil=crypto.generateKeyPairSync('rsa',{modulusLength:2048}).privateKey;
console.log('forged',(await call('/api/auth/google',{method:'POST',body:JSON.stringify({credential:idt({sub:'9'},evil)})})).s);
console.log('me',(await call('/api/me',{},A)).j.user.name,'noauth',(await call('/api/me')).s);
console.log('save put',(await call('/api/save',{method:'PUT',body:JSON.stringify({blob:'{"a":1}',savedAt:1000,v:9})},A)).j);
console.log('save older',(await call('/api/save',{method:'PUT',body:JSON.stringify({blob:'{"a":0}',savedAt:500,v:9})},A)));
console.log('save get',(await call('/api/save',{},A)).j);
await call('/api/leaderboard',{method:'POST',body:JSON.stringify({shop:'Kilat A',score:5000000,lvl:2,rep:3.5,done:10,day:3})},A);
await call('/api/leaderboard',{method:'POST',body:JSON.stringify({shop:'Bersih B',score:9000000,lvl:4,rep:4.1,done:30,day:6})},B);
await call('/api/leaderboard',{method:'POST',body:JSON.stringify({shop:'Citra C',score:7000000,lvl:3,rep:4.8,done:5,day:2})},C);
r=await call('/api/leaderboard?scope=global',{},A);console.log('global',r.j.rows.map(x=>x.shop+':'+x.name),'rank',r.j.myRank,'total',r.j.total);
console.log('friends before',(await call('/api/leaderboard?scope=friends',{},A)).j.rows.map(x=>x.shop));
console.log('req',(await call('/api/friends/request',{method:'POST',body:JSON.stringify({code:codeB})},A)).j);
console.log('self',(await call('/api/friends/request',{method:'POST',body:JSON.stringify({code:r.j.rows.find(x=>x.shop==='Kilat A').code})},A)).s);
console.log('unknown',(await call('/api/friends/request',{method:'POST',body:JSON.stringify({code:'JL-ZZZZZZ'})},A)).s);
console.log('B incoming',(await call('/api/friends',{},B)).j.incoming.map(x=>x.name));
console.log('B accept',(await call('/api/friends/respond',{method:'POST',body:JSON.stringify({code:(await call('/api/me',{},A)).j.user.code,accept:true})},B)).j);
console.log('C req A then A req C → auto',(await call('/api/friends/request',{method:'POST',body:JSON.stringify({code:(await call('/api/me',{},A)).j.user.code})},C)).j.status,(await call('/api/friends/request',{method:'POST',body:JSON.stringify({code:codeC})},A)).j.status);
r=await call('/api/leaderboard?scope=friends&sort=rep',{},A);console.log('friends lb by rep',r.j.rows.map(x=>x.shop+':'+x.rep));
console.log('A friends',(await call('/api/friends',{},A)).j.friends.map(x=>x.name+'/'+x.shop));
await call('/api/friends/remove',{method:'POST',body:JSON.stringify({code:codeB})},A);
console.log('after remove',(await call('/api/leaderboard?scope=friends',{},A)).j.rows.map(x=>x.shop));
// top-up dengan sesi Google
const p={version:'2022.01',id:'tx9',type:'donation',amount_raw:15000,donator_name:'A',donator_email:'a',message:'isi '+codeB};
await worker.fetch(new Request('https://w.test/saweria/webhook',{method:'POST',headers:{'Saweria-Callback-Signature':crypto.createHmac('sha256','sk').update(['version','id','amount_raw','donator_name','donator_email'].map(k=>p[k]).join('')).digest('hex')},body:JSON.stringify(p)}),env);
console.log('credits B',(await call('/api/credits',{},B)).j,'ack',(await call('/api/credits/ack',{method:'POST',body:JSON.stringify({ids:['tx9']})},B)).j,'A cannot ack',(await call('/api/credits/ack',{method:'POST',body:JSON.stringify({ids:['tx9']})},A)).s);
console.log('logout',(await call('/api/logout',{method:'POST'},A)).j,(await call('/api/me',{},A)).s);
console.log('unverified email',(await call('/api/auth/google',{method:'POST',body:JSON.stringify({credential:idt({sub:'9',email:'x@x.com',email_verified:false})})})).s); // 403
console.log('legacy register',(await call('/api/register',{method:'POST',body:JSON.stringify({code:'JL-AAAAAA',token:'x'.repeat(30)})})).s); // 404
console.log('legacy token credits',(await call('/api/credits?player=JL-AAAAAA')).s); // 401
console.log('webhook tanpa key',(await worker.fetch(new Request('https://w.test/saweria/webhook',{method:'POST',headers:{'Saweria-Callback-Signature':'x'},body:'{}'}),{...env,SAWERIA_STREAM_KEY:''})).status); // 500
