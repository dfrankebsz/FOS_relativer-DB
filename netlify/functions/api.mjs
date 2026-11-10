import { getStore } from '@netlify/blobs';
import { randomBytes, pbkdf2Sync, createHmac, timingSafeEqual, createHash } from 'node:crypto';

const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const store = () => getStore({name:'fos-relativedb-course',consistency:'strong',region:'eu-central-1'});
const parseName = (value,kind) => {
  const x=String(value??'').trim().replace(/\s+/g,' ');
  const max=kind==='class'?48:32;
  if(x.length<(kind==='class'?2:3)||x.length>max || !/^[\p{L}\p{N} _.-]+$/u.test(x)) throw Error(`${kind==='class'?'Klasse':'Nickname'}: ${kind==='class'?'2':'3'}–${max} Zeichen, nur Buchstaben, Zahlen, Leerzeichen, Punkt, Minus und Unterstrich.`);
  return x;
};
const canon = s => s.normalize('NFKC').toLocaleLowerCase('de');
const hash = s => createHash('sha256').update(s).digest('hex');
const classId = s => hash(`class:${canon(s)}`).slice(0,24);
const userId = s => hash(`name:${canon(s)}`).slice(0,24);
const userKey = (cls,nick) => `classes/${classId(cls)}/users/${userId(nick)}`;
const progressKey = (cls,nick) => `classes/${classId(cls)}/progress/${userId(nick)}`;
const metaKey = cls => `classes/${classId(cls)}/meta`;
const getResetRev = async(st,cls) => (await st.get(metaKey(cls),{type:'json'}))?.rev||'initial';
const random = n => randomBytes(n).toString('base64url');
const passHash = (pass,salt) => pbkdf2Sync(pass,salt,210000,32,'sha256').toString('hex');
const signSecret = () => {
  // A separate AUTH_SECRET is not necessary. TEACHER_CODE must be a long unpredictable secret.
  const code=process.env.TEACHER_CODE;
  if (!code || code.length < 16) throw Error('Bitte in Netlify zuerst TEACHER_CODE mit mindestens 16 zufälligen Zeichen (Scope: Functions) eintragen.');
  return createHmac('sha256',code).update(`fos-db-session-v1:${process.env.SITE_ID??'local'}`).digest();
};
const equal = (a,b) => {
  const x=Buffer.from(String(a)),y=Buffer.from(String(b));
  return x.length===y.length && timingSafeEqual(x,y);
};
const tokenFor = u => {
  const payload={c:u.class,n:u.nickname,r:u.role,v:u.rev,e:Date.now()+7*24*60*60*1000};
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${createHmac('sha256',signSecret()).update(body).digest('base64url')}`;
};
async function auth(req,st){
  const t=(req.headers.get('authorization')??'').replace(/^Bearer\s+/i,'');
  const [body,signature]=t.split('.');
  if(!body||!signature||body.length>4000) throw Error('Bitte erneut anmelden.');
  const expected=createHmac('sha256',signSecret()).update(body).digest('base64url');
  if(!equal(signature,expected)) throw Error('Sitzung ungültig. Bitte erneut anmelden.');
  let p;
  try{p=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));}catch{throw Error('Ungültige Sitzung.');}
  if(p.e<Date.now()||p.e>Date.now()+8*24*60*60*1000) throw Error('Sitzung abgelaufen.');
  const u=await st.get(userKey(p.c,p.n),{type:'json'});
  if(!u||u.rev!==p.v||u.role!==p.r) throw Error('Zugang nicht mehr gültig.');
  return u;
}
const publicUser = u => ({nickname:u.nickname,class:u.class,role:u.role,mustChange:!!u.mustChange});
const emptyProgress = () => ({version:1,answers:{},xp:0,spent:0,owned:['start'],equipped:'start',achievements:[],checklist:{},game:null,completed:[],updatedAt:0});
const clean = p => {
  if(!p || typeof p!=='object'||Array.isArray(p)) throw Error('Ungültiger Fortschritt.');
  const capObj=(o,max=250)=> Object.fromEntries(Object.entries(o&&typeof o==='object'&&!Array.isArray(o)?o:{}).slice(0,max).map(([k,v])=>[String(k).slice(0,90),v]));
  const answers={};
  for(const [id,v] of Object.entries(capObj(p.answers,180))){
    if(!v || typeof v!=='object') continue;
    let val=v.value;
    if(typeof val==='string') val=val.slice(0,4000);
    else if(Array.isArray(val)) val=val.slice(0,12).map(x=>String(x).slice(0,60));
    else if(typeof val!=='number' && typeof val!=='boolean') val='';
    answers[id]={value:val,checked:!!v.checked,correct:!!v.correct,revealed:!!v.revealed,selfChecked:!!v.selfChecked,rewarded:!!v.rewarded,attempts:Math.max(0,Math.min(99,Number(v.attempts)||0))};
  }
  const checklist={};
  for(const [k,v] of Object.entries(capObj(p.checklist,12))) checklist[k]={rating:Math.max(1,Math.min(5,Number(v?.rating)||1)),done:!!v?.done};
  const owned=Array.from(new Set((Array.isArray(p.owned)?p.owned:[]).map(String).filter(x=>/^[a-z0-9-]{1,32}$/.test(x)))).slice(0,40);
  if(!owned.includes('start')) owned.unshift('start');
  const cleanProgress={version:1,answers,xp:Math.max(0,Math.min(100000,Number(p.xp)||0)),spent:Math.max(0,Math.min(100000,Number(p.spent)||0)),owned,equipped:owned.includes(p.equipped)?p.equipped:'start',achievements:(Array.isArray(p.achievements)?p.achievements:[]).slice(0,40).map(String),checklist,game:p.game&&typeof p.game==='object'?{counts:(Array.isArray(p.game.counts)?p.game.counts:[]).slice(0,4).map(x=>Math.max(0,Math.min(500,Math.floor(Number(x)||0)))),submitted:!!p.game.submitted}:null,completed:(Array.isArray(p.completed)?p.completed:[]).slice(0,35).map(String),resetRev:typeof p.resetRev==='string'?p.resetRev.slice(0,48):'initial',updatedAt:Date.now()};
  if(JSON.stringify(cleanProgress).length>110000) throw Error('Zu viele Fortschrittsdaten.');
  return cleanProgress;
};
const validPass = pass => typeof pass==='string'&&pass.length>=8&&pass.length<=128;
const secureCode = value => { const code=process.env.TEACHER_CODE; if(!code || code.length<16) throw Error('TEACHER_CODE muss in Netlify gesetzt sein (mindestens 16 Zeichen).');return equal(value,code); };
const onlyTeacher = u => {if(u.role!=='teacher') throw Error('Nur mit Lehrkraftzugang möglich.');};
const readBody=async req => { const str=await req.text();if(str.length>140000) throw Error('Anfrage zu groß.');return JSON.parse(str||'{}'); };
const pathFrom = url => new URL(url).pathname.replace(/^\/(?:api\/|\.netlify\/functions\/api\/?)/,'').replace(/^\//,'');

export default async (req)=>{
 if(req.method==='OPTIONS') return json({ok:true});
 const path=pathFrom(req.url), st=store();
 try {
  if(req.method!=='POST' && path!=='health') return json({error:'Nur POST erlaubt.'},405);
  if(path==='health') return json({ok:true,storage:'netlify-blobs'});
  const b=await readBody(req);
  if(path==='register'){
    const cls=parseName(b.class,'class'),nick=parseName(b.nickname,'nickname');
    if(!validPass(b.password)) return json({error:'Das Passwort muss zwischen 8 und 128 Zeichen lang sein.'},400);
    const role=b.teacher?'teacher':'student';
    if(role==='teacher'&&!secureCode(b.teacherCode)) return json({error:'Lehrkraft-Code ungültig.'},403);
    const salt=random(20); const u={class:cls,nickname:nick,role,salt,passHash:passHash(b.password,salt),rev:random(12),mustChange:false,createdAt:Date.now()};
    const r=await st.setJSON(userKey(cls,nick),u,{onlyIfNew:true});
    if(!r.modified) return json({error:'Dieser Nickname ist in dieser Klasse bereits vergeben.'},409);
    const start={...emptyProgress(),resetRev:await getResetRev(st,cls)};
    await st.setJSON(progressKey(cls,nick),start,{onlyIfNew:true});
    return json({token:tokenFor(u),user:publicUser(u),progress:start});
  }
  if(path==='login'){
    const cls=parseName(b.class,'class'),nick=parseName(b.nickname,'nickname');
    const u=await st.get(userKey(cls,nick),{type:'json'});
    if(!u||typeof b.password!=='string'||b.password.length>128||!equal(passHash(b.password,u.salt),u.passHash)) return json({error:'Klasse, Nickname oder Passwort stimmen nicht überein.'},401);
    const p=await st.get(progressKey(u.class,u.nickname),{type:'json'})||{...emptyProgress(),resetRev:await getResetRev(st,u.class)};
    return json({token:tokenFor(u),user:publicUser(u),progress:p});
  }
  const u=await auth(req,st);
  if(path==='me'){
    const p=await st.get(progressKey(u.class,u.nickname),{type:'json'})||{...emptyProgress(),resetRev:await getResetRev(st,u.class)};
    return json({user:publicUser(u),progress:p});
  }
  if(path==='save'){
    if(u.mustChange) return json({error:'Bitte ändern Sie zunächst Ihr Passwort.'},403);
    const p=clean(b.progress);
    if(p.resetRev!==await getResetRev(st,u.class)) return json({error:'Die Lehrkraft hat die Klassenfortschritte zurückgesetzt. Melden Sie sich erneut an, um mit einem leeren Lernstand weiterzuarbeiten.'},409);
    await st.setJSON(progressKey(u.class,u.nickname),p);
    return json({ok:true,savedAt:p.updatedAt});
  }
  if(path==='change-password'){
    if(!validPass(b.newPassword)) return json({error:'Das neue Passwort muss mindestens 8 Zeichen enthalten.'},400);
    if(!equal(passHash(String(b.oldPassword??''),u.salt),u.passHash)) return json({error:'Bisheriges Passwort falsch.'},403);
    const salt=random(20);u.salt=salt;u.passHash=passHash(b.newPassword,salt);u.mustChange=false;u.rev=random(12);
    await st.setJSON(userKey(u.class,u.nickname),u);
    return json({ok:true,token:tokenFor(u),user:publicUser(u)});
  }
  if(path==='teacher-list'){
    onlyTeacher(u);
    const prefix=`classes/${classId(u.class)}/users/`;
    const found=await st.list({prefix});
    const users=await Promise.all(found.blobs.slice(0,250).map(async entry=>{
      const item=await st.get(entry.key,{type:'json'});
      if(!item||item.role!=='student') return null;
      const p=await st.get(progressKey(item.class,item.nickname),{type:'json'})||emptyProgress();
      return {nickname:item.nickname,class:item.class,xp:p.xp,spent:p.spent,answered:Object.values(p.answers||{}).filter(a=>a.checked||a.selfChecked).length,completed:(p.completed||[]).length,checkDone:Object.values(p.checklist||{}).filter(x=>x.done).length,updatedAt:p.updatedAt||0};
    }));
    return json({class:u.class,users:users.filter(Boolean).sort((a,b)=>a.nickname.localeCompare(b.nickname,'de'))});
  }
  if(path==='teacher-progress'){
    onlyTeacher(u);
    const nick=parseName(b.nickname,'nickname');
    const s=await st.get(userKey(u.class,nick),{type:'json'});
    if(!s||s.role!=='student') return json({error:'Schülerkonto nicht gefunden.'},404);
    const p=await st.get(progressKey(s.class,s.nickname),{type:'json'})||emptyProgress();
    return json({nickname:s.nickname,progress:p});
  }
  if(path==='teacher-reset'){
    onlyTeacher(u);
    const nick=parseName(b.nickname,'nickname');
    const s=await st.get(userKey(u.class,nick),{type:'json'});
    if(!s||s.role!=='student') return json({error:'Schülerkonto nicht gefunden.'},404);
    const temp=random(12)+'Aa1!';const salt=random(20);
    s.salt=salt;s.passHash=passHash(temp,salt);s.mustChange=true;s.rev=random(12);
    await st.setJSON(userKey(s.class,s.nickname),s);
    return json({ok:true,nickname:s.nickname,temporaryPassword:temp,notice:'Einmalpasswort jetzt sicher an die betreffende Person weitergeben.'});
  }
  if(path==='teacher-delete'){
    onlyTeacher(u);
    const nick=parseName(b.nickname,'nickname');
    const s=await st.get(userKey(u.class,nick),{type:'json'});
    if(!s||s.role!=='student') return json({error:'Schülerkonto nicht gefunden.'},404);
    await st.delete(userKey(s.class,s.nickname));
    await st.delete(progressKey(s.class,s.nickname));
    return json({ok:true});
  }
  if(path==='teacher-clear'){
    onlyTeacher(u);
    if(b.confirm!==`LOESCHEN ${u.class}`) return json({error:`Bestätigung muss genau „LOESCHEN ${u.class}“ lauten.`},400);
    const prefix=`classes/${classId(u.class)}/progress/`;
    await st.setJSON(metaKey(u.class),{rev:random(16),updatedAt:Date.now()});
    const all=await st.list({prefix});
    let count=0;
    for(const entry of all.blobs){await st.delete(entry.key);count++;}
    return json({ok:true,count});
  }
  return json({error:'Aktion unbekannt.'},404);
 }catch(err){
  const s=String(err?.message||'Unerwarteter Fehler');
  console.error('[course]',path,s);
  const status=/^(Bitte erneut|Sitzung |Ungültige Sitzung|Zugang nicht)/.test(s)?401:400;
  return json({error:s},status);
 }
};

// Direktes Netlify-Routing: /api/register, /api/login usw.
export const config = { path: "/api/:action" };
