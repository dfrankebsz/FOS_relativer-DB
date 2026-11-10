import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const base = new URL('../site/', import.meta.url);
const contentSrc = readFileSync(new URL('content.js',base),'utf8');
const original = readFileSync(new URL('app.js',base),'utf8');
const script=original.replace(/\ninit\(\);\n\}\)\(\);\s*$/, '\nglobalThis.__test__={evaluate,solveProgram,gamePage,chapterPage,renderQuestion,renderMatrix,answerFor,solutionMatrix,state,normalizeNumber,completion};init();\n})();');
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
  const v=q.type==='number'?String(q.answer).replace('.',','):q.type==='table'?q.answer.map(x=>String(x)):q.type==='matrix'?Object.fromEntries(Object.entries(q.answer).map(([key,x])=>[key,String(x).replace('.',',')])):q.type==='truefalse'?String(q.answer):q.answer;
  assert.equal(t.evaluate(q,v),true,`Aufgabe ${q.id} wird nicht erkannt`);
 }
});
test('deutsche Zahlenschreibweise',()=>{
 assert.equal(t.normalizeNumber('16.450,00 €'),16450);
 assert.equal(t.normalizeNumber('6,5'),6.5);
 assert.equal(t.normalizeNumber('9.250'),9250);
});
test('HTML-Grundstruktur und Antworten',()=>{
 assert.match(app.innerHTML,/Zeitkarten-Challenge/);
 assert.match(app.innerHTML,/20 Zeitkarten/);
 assert.match(app.innerHTML,/zeitkarten-spiel\.html/);
 assert.match(t.chapterPage(ctx.window.COURSE.chapters[0]),/AFB I/);
 assert.match(t.renderQuestion(ctx.window.COURSE.chapters[0].questions[0]),/data-matrix-id="b01"/);
});

test('alle 66 Aufgaben haben sinnvolle Hinweise und alle mehrzeiligen Tabellen eigene Musterantworten',()=>{
 const all=[...ctx.window.COURSE.chapters.flatMap(c=>c.questions),...ctx.window.COURSE.bonus,...ctx.window.COURSE.final];
 assert.equal(all.length,66);
 const grids=all.filter(q=>q.type==='matrix');
 assert.ok(grids.length>=15,`Es sind nur ${grids.length} mehrzeilige Tabellen vorhanden`);
 for(const q of all){
   assert.ok(typeof q.hint==='string'&&q.hint.trim().length>=14,`${q.id}: Hinweis fehlt`);
   assert.ok(typeof q.solution==='string'&&q.solution.trim().length>=8,`${q.id}: Lösung fehlt`);
 }
 for(const q of grids){
   assert.ok(q.grid.rows.length>=3,`${q.id}: Zu wenige Tabellenzeilen`);
   assert.ok(q.grid.columns.length>=3,`${q.id}: Zu wenige Spalten`);
   assert.ok(Object.keys(q.answer).length>=2,`${q.id}: zu wenige Eingaben`);
   const partial=Object.fromEntries(Object.entries(q.answer).map(([k,v])=>[k,String(v)]));
   const firstKey=Object.keys(partial)[0];partial[firstKey]=String(Number(q.answer[firstKey])+1);
   assert.equal(t.evaluate(q,partial),false,`${q.id}: falsche Zelle wurde nicht erkannt`);
   const form=t.renderQuestion(q);
   assert.match(form,/matrix-table/,`${q.id} ohne Tabellenraster`);
   assert.match(form,/Musterlösung/,`${q.id} keine Lösungsschaltfläche`);
   if(q.grid.rows.length>=3&&Object.keys(q.answer).length>=6)assert.match(form,/Schrittweise Tabellenhilfe/,`${q.id} keine Zeilen-/Spaltenhilfen`);
 }
});
test('Original-Zeitkarten-Spiel ist eingebettet und ohne verratenes Produktionsprogramm',()=>{
 const game=t.gamePage();
 assert.match(game,/Arbeiten Sie zu zweit/);
 assert.match(game,/zeitkarten-spiel\.html/);
 assert.doesNotMatch(game,/rankSolution\(/);
 const child=readFileSync(new URL('zeitkarten-spiel.html',base),'utf8');
 const childJs=readFileSync(new URL('zeitkarten-game.js',base),'utf8');
 assert.match(child,/20 Zeitkarten/);
 assert.doesNotMatch(child,/bestBody|relativeBody|Ein optimales Produktionsprogramm/);
 assert.match(childJs,/Bestmöglicher Gesamtdeckungsbeitrag/);
 assert.doesNotMatch(childJs,/bestBody|relativeBody/);
 assert.match(childJs,/fos-zeitkarten-submit/);
});
