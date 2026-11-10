import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomBytes,pbkdf2Sync,createHmac,timingSafeEqual,createHash} from 'node:crypto';
const saved=new Map();
const blobMock={
 get:async(k)=>structuredClone(saved.get(k)??null),
 setJSON:async(k,v,opt={})=>{if(opt.onlyIfNew&&saved.has(k))return {modified:false};saved.set(k,structuredClone(v));return{modified:true}},
 delete:async(k)=>{saved.delete(k)},
 list:async({prefix='' }={})=>({blobs:[...saved.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key,etag:'mock'}))})
};
const getStore=()=>blobMock;
const p=new URL('../netlify/functions/api.mjs',import.meta.url);
let code=readFileSync(p,'utf8');
code=code.replace(/^import .*?;\n/gm,'').replace('export default async (req)=>{','globalThis.__backend = async (req)=>{').replace('export const config = { path: "/api/:action" };','');
const c={getStore,randomBytes,pbkdf2Sync,createHmac,timingSafeEqual,createHash,process:{env:{TEACHER_CODE:'FOS-2026-teacher-secret-Strong-6N1!9a7',SITE_ID:'my-site'}},Buffer,Response,Request,URL,Date,JSON,Math,console,Error,String,Array,Object,Number,RegExp};
vm.createContext(c);vm.runInContext(code,c);
const ask=async(path,b={},token='')=>{
 const req=new Request(`https://site.example/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(b)});
 const res=await c.__backend(req);return{status:res.status,data:await res.json()};
};
test('Schülerregistrierung, Login, Speicherung',async()=>{
 const register=await ask('register',{class:'FOS12A',nickname:'Lernfuchs',password:'1234Pass!'});
 assert.equal(register.status,200,register.data.error);assert.equal(register.data.user.role,'student');
 const dup=await ask('register',{class:'FOS12A',nickname:'Lernfuchs',password:'Abcd1234'});assert.equal(dup.status,409);
 const invalid=await ask('login',{class:'FOS12A',nickname:'Lernfuchs',password:'falsch'});assert.equal(invalid.status,401);
 const login=await ask('login',{class:'FOS12A',nickname:'Lernfuchs',password:'1234Pass!'});assert.equal(login.status,200);
 const progress={...login.data.progress,xp:125,answers:{b01:{value:'40',checked:true,correct:true}},owned:['start'],spent:0};
 const save=await ask('save',{progress},login.data.token);assert.equal(save.status,200,save.data.error);
 const after=await ask('me',{},login.data.token);assert.equal(after.data.progress.xp,125);
});
test('Lehrkraftcode, Klassentrennung, Passwortzurücksetzung',async()=>{
 const fail=await ask('register',{class:'FOS12A',nickname:'Lehrer01',password:'LongPass123!',teacher:true,teacherCode:'falsch'});assert.equal(fail.status,403);
 const reg=await ask('register',{class:'FOS12A',nickname:'Lehrer01',password:'LongPass123!',teacher:true,teacherCode:c.process.env.TEACHER_CODE});assert.equal(reg.status,200,reg.data.error);
 const teacher=reg.data.token;
 const list=await ask('teacher-list',{},teacher);assert.ok(list.data.users.some(u=>u.nickname==='Lernfuchs'));
 const studentInB=await ask('register',{class:'FOS12B',nickname:'Anderer',password:'1234Pass!'});assert.equal(studentInB.status,200);
 const listAgain=await ask('teacher-list',{},teacher);assert.ok(!listAgain.data.users.some(u=>u.nickname==='Anderer'));
 const reset=await ask('teacher-reset',{nickname:'Lernfuchs'},teacher);assert.equal(reset.status,200);assert.ok(reset.data.temporaryPassword.length>=8);
 const tempLogin=await ask('login',{class:'FOS12A',nickname:'Lernfuchs',password:reset.data.temporaryPassword});assert.equal(tempLogin.data.user.mustChange,true);
 const oldSession=await ask('me',{},(await ask('login',{class:'FOS12B',nickname:'Anderer',password:'1234Pass!'})).data.token);assert.equal(oldSession.status,200);
 const pw=await ask('change-password',{oldPassword:reset.data.temporaryPassword,newPassword:'NewStrong#2026'},tempLogin.data.token);assert.equal(pw.status,200);
 const oldTempToken=await ask('me',{},tempLogin.data.token);assert.equal(oldTempToken.status,401);
});
test('Klassenweiter Reset lässt Konto bestehen und sperrt alte Fortschrittsspeicherung',async()=>{
 const teacher=(await ask('login',{class:'FOS12A',nickname:'Lehrer01',password:'LongPass123!'})).data.token;
 const student=(await ask('login',{class:'FOS12A',nickname:'Lernfuchs',password:'NewStrong#2026'})).data;
 const wrong=await ask('teacher-clear',{confirm:'wrong'},teacher);assert.equal(wrong.status,400);
 const cleared=await ask('teacher-clear',{confirm:'LOESCHEN FOS12A'},teacher);assert.equal(cleared.status,200);
 const stale=await ask('save',{progress:{...student.progress,xp:999}},student.token);assert.equal(stale.status,409);
 const next=(await ask('login',{class:'FOS12A',nickname:'Lernfuchs',password:'NewStrong#2026'})).data;
 assert.equal(next.progress.xp,0);
 const okay=await ask('save',{progress:{...next.progress,xp:55}},next.token);assert.equal(okay.status,200);
 const deleted=await ask('teacher-delete',{nickname:'Lernfuchs'},teacher);assert.equal(deleted.status,200);
 const nonexistent=await ask('login',{class:'FOS12A',nickname:'Lernfuchs',password:'NewStrong#2026'});assert.equal(nonexistent.status,401);
});
