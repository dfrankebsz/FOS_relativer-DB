import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site/content.js',import.meta.url),'utf8');
const context={window:{}};vm.createContext(context);vm.runInContext(source,context);
const course=context.window.COURSE;
const all=course.chapters.flatMap(c=>c.questions).concat(course.bonus,course.final);
test('Themenumfang ausschließlich relativer Deckungsbeitrag',()=>{
 assert.equal(all.length,66);
 assert.ok(!/zusatzauftrag|sonderauftrag|preisuntergrenze|opportunitätskosten/i.test(JSON.stringify(course)), 'fremdes Thema im Kurs');
 for(const q of all){
  assert.ok(q.hint?.trim(),q.id+' ohne Hinweis');
  assert.ok(q.solution?.trim(),q.id+' ohne Lösung');
 }
 assert.ok(all.find(q=>q.id==='g07').prompt.includes('optimalen Produktionsprogramm'));
 assert.ok(all.find(q=>q.id==='d08').prompt.includes('Sortiment'));
 assert.ok(all.find(q=>q.id==='x06').prompt.includes('Nettoverkaufspreisen'));
});
