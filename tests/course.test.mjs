import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const base = new URL('../site/', import.meta.url);
const contentSrc = readFileSync(new URL('content.js',base),'utf8');
const original = readFileSync(new URL('app.js',base),'utf8');
const script=original.replace(/\ninit\(\);\n\}\)\(\);\s*$/, '\nglobalThis.__test__={evaluate,solveProgram,gamePage,chapterPage,renderQuestion,state,normalizeNumber,completion};init();\n})();');
const app={innerHTML:''};
const kv=new Map();
const ls={getItem:k=>kv.get(k)||null,setItem:(k,v)=>kv.set(k,v),removeItem:k=>kv.delete(k)};
const ctx={console,window:{addEventListener:()=>{},scrollTo:()=>{}},localStorage:ls,document:{querySelector:(sel)=>sel==='#app'?app:sel==='#print-area'?{innerHTML:''}:null,addEventListener:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},Intl,Date,Math,Number,String,Array,Object,Map,Set,Boolean,JSON};
vm.createContext(ctx);
vm.runInContext(contentSrc,ctx);
vm.runInContext(script,ctx);
const {__test__:t}=ctx;
test('kapitel und anforderungsbereiche',()=>{
 assert.equal(ctx.window.COURSE.chapters.length,6);
 for(const c of ctx.window.COURSE.chapters){assert.equal(c.questions.length,8);assert.equal(c.questions.filter(x=>x.afb===1).length,2);assert.equal(c.questions.filter(x=>x.afb===2).length,4);assert.equal(c.questions.filter(x=>x.afb===3).length,2)}
 assert.equal(ctx.window.COURSE.bonus.length,8);
 assert.equal(ctx.window.COURSE.final.length,10);
});
test('Grunddaten und gewinnoptimale Planung',()=>{
 const x=t.solveProgram(9250);
 assert.equal(x.total,54450);
 assert.equal(x.used,9250);
 assert.equal(x.rest,0);
 assert.deepEqual(Array.from(x.products,p=>[p.id,p.qty]),[['pro',150],['city',300],['basic',400],['studio',40]]);
});
test('alle Musterantworten werden vom Korrektursystem als richtig erkannt',()=>{
 const all=[...ctx.window.COURSE.chapters.flatMap(c=>c.questions),...ctx.window.COURSE.bonus,...ctx.window.COURSE.final];
 for(const q of all){if(q.type==='text')continue;
  const v=q.type==='number'?String(q.answer).replace('.',','):q.type==='table'?q.answer.map(x=>String(x)):q.type==='truefalse'?String(q.answer):q.answer;
  assert.equal(t.evaluate(q,v),true,`Aufgabe ${q.id} wird nicht erkannt`);
 }
});
test('deutsche Zahlenschreibweise',()=>{
 assert.equal(t.normalizeNumber('16.450,00 €'),16450);
 assert.equal(t.normalizeNumber('6,5'),6.5);
 assert.equal(t.normalizeNumber('9.250'),9250);
});
test('HTML-Grundstruktur und Antworten',()=>{
 assert.match(app.innerHTML,/Partner-Challenge/);
 assert.match(app.innerHTML,/9\.250 min/);
 assert.match(app.innerHTML,/Basic/);
 assert.match(app.innerHTML,/City/);
 assert.match(app.innerHTML,/Studio/);
 assert.match(app.innerHTML,/Pro/);
 assert.match(t.chapterPage(ctx.window.COURSE.chapters[0]),/AFB I/);
 assert.match(t.renderQuestion(ctx.window.COURSE.chapters[0].questions[0]),/data-answer="b01"/);
});
