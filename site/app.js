/* Produktionsmission – Frontend: no external frontend dependencies */
(()=>{
'use strict';
const D=window.COURSE;
const keys={guest:'rel-db-guest-v1',token:'rel-db-token-v1',user:'rel-db-user-v1'};
const $=s=>document.querySelector(s);
const blank=()=>({version:1,answers:{},xp:0,spent:0,owned:['start'],equipped:'start',achievements:[],checklist:{},game:null,completed:[]});
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const state={page:'game',progress:read(keys.guest,blank()),token:localStorage.getItem(keys.token)||'',user:read(keys.user,null),mode:'login',teacherRows:[],teacherDetail:null,teacherBusy:false,network:'',slider:9250,sortDrag:null,toastTimer:null};
const htmlEscape=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=(v,places=0)=>Number(v).toLocaleString('de-DE',{minimumFractionDigits:places,maximumFractionDigits:places});
const allQs=()=>[...D.chapters.flatMap(x=>x.questions),...D.bonus,...D.final];
const getQ=id=>allQs().find(q=>q.id===id);
const earned = q => q.id.startsWith('x')?65:q.id.startsWith('t')?48:({1:24,2:36,3:50}[q.afb]||30);
const wallet=()=>Math.max(0,state.progress.xp-state.progress.spent);
const equipped=()=>D.shop.find(x=>x.id===state.progress.equipped)||D.shop[0];
const finished=q=>{const a=state.progress.answers[q.id];return !!a&&(a.correct||a.selfChecked)};
const completion=()=>{const n=allQs().filter(x=>!x.id.startsWith('x')).length;return Math.round(allQs().filter(x=>!x.id.startsWith('x')&&finished(x)).length/n*100)};
const storeLocally=()=>{try{const key=state.user?`rel-db-backup-${state.user.class}-${state.user.nickname}`:keys.guest;localStorage.setItem(key,JSON.stringify(state.progress))}catch{}};
let debounce=0,writing=false,writeAgain=false;
const save=()=>{
 storeLocally();
 if(!state.token||state.user?.mustChange)return;
 clearTimeout(debounce);debounce=setTimeout(()=>sync(),800);
};
async function sync(){
 if(!state.token)return;
 if(writing){writeAgain=true;return;}
 writing=true;
 try { await api('save',{progress:state.progress},true);state.network='Gespeichert'; }
 catch(e){state.network='Speichern fehlgeschlagen – lokale Sicherung vorhanden';console.error(e);}
 finally{writing=false;if(writeAgain){writeAgain=false;sync();}updateBar();}
}
async function api(action,payload={},authenticate=true){
 const headers={'Content-Type':'application/json'};if(authenticate&&state.token)headers.Authorization=`Bearer ${state.token}`;
 const res=await fetch('/api/'+action,{method:'POST',headers,body:JSON.stringify(payload)});
 let obj;try{obj=await res.json();}catch{throw Error('Keine Antwort vom Server. Prüfen Sie die Netlify-Bereitstellung.');}
 if(!res.ok)throw Error(obj.error||`Serverfehler ${res.status}`);
 return obj;
}
const notice=(msg,kind='info')=>{
 let d=$('#toast');if(!d){d=document.createElement('div');d.id='toast';d.className='toast';document.body.append(d)}
 d.textContent=msg;d.setAttribute('role','status');
 if(state.toastTimer)clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>d.remove(),4300);
};
const navigate=(page)=>{state.page=page;state.teacherDetail=null;render();window.scrollTo({top:0,behavior:'smooth'});if(page==='teacher')loadTeacher()};
const navList=[['game','🎮','Einstiegsspiel'],...D.chapters.map((x,i)=>[x.id,x.icon,`${i+1}. ${x.title}`]),['bonus','🎁','Bonus-Missionen'],['test','🎓','Abschlusstest'],['check','✅','Kompetenz-Check'],['shop','🛍️','Avatar-Shop'],['lexikon','📖','Begriffslexikon'],['account','🔐','Anmeldung & Konto']];
function layout(content){
 const list=[...navList];if(state.user?.role==='teacher')list.push(['teacher','👩‍🏫','Lehrerbereich']);
 const nav=list.map(([id,icon,name])=>{const ch=D.chapters.find(c=>c.id===id);const n=ch?`${ch.questions.filter(finished).length}/8`:id==='test'?`${D.final.filter(finished).length}/${D.final.length}`:'';return `<button type="button" class="nav ${state.page===id?'active':''}" data-page="${id}"><span class="num">${icon}</span><span>${htmlEscape(name)}</span><span class="count">${n}</span></button>`}).join('');
 $('#app').innerHTML=`<a href="#main" class="skip-link">Zum Inhalt springen</a><div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-icon">⚙</span><div><span>FOS · VBWL-RW</span><b>PRODUKTIONS<br>MISSION</b></div></div><p class="side-kicker">Lernpfad</p><nav class="nav-items" aria-label="Kursnavigation">${nav}</nav><div class="side-footer">⚙️ Relativer Deckungsbeitrag<br>Sie-Form · Lernkurs für Klasse 12<br>Fortschritt ${completion()} %</div></aside><div class="main"><header class="topbar"><div><div class="eyebrow">Lernkurs · Relativer DB</div><div class="title">${htmlEscape(navList.find(n=>n[0]===state.page)?.[2]||'Lehrerbereich')}</div></div><div class="status-area"><span class="pill coin">✦ ${fmt(wallet())} XP</span><span class="pill">${state.user?htmlEscape(state.user.nickname)+' · '+htmlEscape(state.user.class):'Gastmodus'}</span><span class="avatar-display" title="Aktiver Avatar">${equipped().emoji}</span></div></header><main id="main" class="page">${content}</main><footer class="imprint"><b>KI-Nachweis:</b> Die Konzeption, Gestaltung und technische Überarbeitung dieses Kurses erfolgten am 10.11.2026 unter Nutzung von ChatGPT (GPT-6). Das KI-Werkzeug wurde insbesondere zur Strukturierung von Kursinhalten sowie zur Erstellung und Überarbeitung von HTML und CSS eingesetzt. Einzelne Grafiken wurden ebenfalls KI-gestützt erstellt. Die fachliche und redaktionelle Prüfung sowie die abschließende Auswahl und Anpassung der Inhalte erfolgten durch die kurserstellende Lehrkraft. Die Kennzeichnung orientiert sich an den Empfehlungen der Universität Hamburg zum Umgang mit generativer KI.<p class="mini">Datenschutzhinweis: Im Gastmodus speichert dieser Browser den Fortschritt lokal. Nach Anmeldung werden Nickname, Klasse, Passwortprüfsumme und Lernfortschritt in Netlify Blobs gespeichert. Passwörter werden nicht im Klartext gespeichert. Keine analytischen Drittanbieter und kein externer Datenbankdienst. Lehrkräfte sehen nur die Lernstände ihrer eigenen Klasse.</p></footer></div></div>`;
}
function updateBar(){const top=$('.topbar .pill.coin');if(top)top.textContent=`✦ ${fmt(wallet())} XP`}
const hero=(eyebrow,title,desc,buttons='')=>`<section class="hero"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${desc}</p>${buttons?`<div class="actions">${buttons}</div>`:''}</section>`;
const btn=(text,attrs='',klass='ghost')=>`<button class="btn ${klass}" type="button" ${attrs}>${text}</button>`;
function render(){
 if(state.page==='game')layout(gamePage());
 else if(D.chapters.find(x=>x.id===state.page))layout(chapterPage(D.chapters.find(x=>x.id===state.page)));
 else if(state.page==='bonus')layout(questionCollection('🎁 Bonus-Missionen','Für alle, die weiterdenken: zusätzliche Aufgaben mit höheren Anforderungen.',D.bonus));
 else if(state.page==='test')layout(testPage());
 else if(state.page==='check')layout(checkPage());
 else if(state.page==='shop')layout(shopPage());
 else if(state.page==='lexikon')layout(glossaryPage());
 else if(state.page==='account')layout(accountPage());
 else if(state.page==='teacher')layout(teacherPage());
 else layout(gamePage());
}
function gameStats(){
 const counts=state.progress.game?.counts||[0,0,0,0];const rows=D.products.map((p,i)=>({...p,qty:counts[i]||0,db:p.price-p.kv}));
 const used=rows.reduce((s,p)=>s+p.qty*p.time,0),sum=rows.reduce((s,p)=>s+p.qty*p.db,0);
 const rest=D.capacity-used;
 const fragments=Array.from({length:20},(_,i)=>{let percent=Math.max(0,Math.min(100,(used-i*D.capacity/20)/(D.capacity/20)*100));return `<span class="timecard ${rest<0?'over':''}"><b style="width:${percent}%"></b></span>`}).join('');
 return `<div class="grid3"><div class="statbox"><span>Genutzte Maschinenzeit</span><b>${fmt(used)} min</b></div><div class="statbox"><span>Freie Maschinenzeit</span><b style="color:${rest<0?'#bc3445':'#247d65'}">${fmt(rest)} min</b></div><div class="statbox"><span>Gesamtdeckungsbeitrag</span><b>${fmt(sum)} €</b></div></div><div class="timecards" aria-label="20 anteilig füllbare Zeitkarten">${fragments}</div><p class="mini">20 Zeitkarten stellen zusammen <b>9.250 min</b> dar; eine Karte entspricht <b>462,5 min</b>. Bei der Herstellung können Karten anteilig aufgebraucht werden. Der Gesamt-DB basiert auf Ihren eingegebenen Stückzahlen.</p><div class="accent-banner ${rest<0?'warning':''}">${rest<0?'⚠️ Die Maschine ist überplant. Reduzieren Sie eine Produktionsmenge.':rest===0?'✅ Die gesamte Maschinenzeit ist eingeplant.':'ℹ️ Ihre Planung hat noch Restkapazität – nutzen Sie sie wirtschaftlich.'}</div>`;
}
function rankSolution(){
 const o=solveProgram(D.capacity);const p=o.products;
 const rows=p.map(v=>`<tr><td>${v.name}</td><td>${fmt(v.price-v.kv,2)} €</td><td>${fmt((v.price-v.kv)/v.time,2)} €/min</td><td>${fmt(v.qty)} St.</td><td>${fmt(v.qty*v.time)} min</td><td>${fmt(v.qty*(v.price-v.kv))} €</td></tr>`).join('');
 return `<div class="solution"><h3>Optimale Fertigungsreihenfolge und Rechenweg</h3><p><b>Pro → City → Basic → Studio</b> (absteigend nach relativem DB).</p><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Modell</th><th>Stück-DB</th><th>Rel. DB</th><th>Menge</th><th>Genutzte Zeit</th><th>Gesamt-DB</th></tr></thead><tbody>${rows}</tbody></table></div><p><b>Restzeit:</b> Pro: 9.250 − 2.250 = 7.000 min; City: 7.000 − 3.000 = 4.000 min; Basic: 4.000 − 3.200 = 800 min; Studio: 800 ÷ 20 = 40 Stück, Rest 0 min.</p><p><b>Gesamt-DB:</b> ${fmt(o.total)} €; <b>Betriebsergebnis:</b> ${fmt(o.total)} € (DB) − ${fmt(D.fixed)} € (Fixkosten) = <b>${fmt(o.total-D.fixed)} €</b>.</p></div>`;
}
function solveProgram(capacity){
 let rest=capacity;const sorted=[...D.products].sort((a,b)=>(b.price-b.kv)/b.time-(a.price-a.kv)/a.time);
 const vals=sorted.map(p=>{const qty=Math.min(p.max,Math.floor((rest+1e-8)/p.time));rest-=qty*p.time;return {...p,qty}});
 return {products:vals,total:vals.reduce((s,p)=>s+p.qty*(p.price-p.kv),0),used:capacity-rest,rest};
}
function gamePage(){
 const game=state.progress.game||{counts:[0,0,0,0],submitted:false};let controls=D.products.map((p,i)=>`<div class="product-card"><div class="product-icon">${['💡','✨','🎨','🚀'][i]}</div><div class="product-info"><strong>${p.name}</strong><small>Preis ${fmt(p.price)} € · var. Kosten ${fmt(p.kv)} €</small><small><b>${p.time} min/St.</b> · maximal <b>${p.max} Stück</b></small></div><div class="qtybox">${btn('−',`data-game-step="${i}" data-by="-10" aria-label="${p.name} verringern"`,'outline')}<input aria-label="Produktionsmenge ${p.name}" type="number" min="0" max="${p.max}" step="1" data-game-qty="${i}" value="${game.counts[i]||0}">${btn('+',`data-game-step="${i}" data-by="10" aria-label="${p.name} erhöhen"`,'outline')}</div></div>`).join('');
 const count=game.counts.reduce((sum,n,i)=>sum+n*D.products[i].time,0),ok=count<=D.capacity;
 return hero('Kapitel 0 · Partner-Challenge','Eine Maschine. Vier Leuchten. Ihre Entscheidung!','Leipziger LichtForm GmbH: Sie sind zu zweit das Produktionsplanungsteam. Nutzen Sie die vorhandene Montagezeit so, dass möglichst viel Deckungsbeitrag entsteht. Die Lösung wird erst nach Ihrer Abgabe gezeigt.',btn('Erklärungen starten','data-page="basis"','accent')+btn('PDF mit Ihren Antworten','data-print','ghost'))+
 `<div class="grid2"><section class="card"><h2>🤝 Spiel zu zweit</h2><p><b>Person A – Produktionsleitung:</b> Legen Sie fest, welche Leuchten hergestellt werden sollen, und verändern Sie die Mengen.</p><p><b>Person B – Controlling:</b> Prüfen Sie laufend Maschinenzeit und Gesamtdeckungsbeitrag und hinterfragen Sie die Entscheidung.</p><p><b>Wechsel:</b> Tauschen Sie die Rollen und optimieren Sie den Plan gemeinsam. Erst danach geben Sie Ihre Lösung ab.</p><div class="accent-banner">Sie verfügen über <b>9.250 min</b> und <b>20 Zeitkarten</b> (zusammen 9.250 min). Jede produzierte Leuchte benötigt die angegebene Minutenanzahl. Maximaler Absatz und verfügbare Zeit dürfen nicht überschritten werden.</div></section><section class="card"><h2>Die Ausgangsdaten</h2><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Modell</th><th>Netto-Preis</th><th>Var. Kosten</th><th>Max. Absatz</th><th>min/St.</th></tr></thead><tbody>${D.products.map(p=>`<tr><td>${p.name}</td><td>${fmt(p.price)} €</td><td>${fmt(p.kv)} €</td><td>${fmt(p.max)}</td><td>${fmt(p.time)}</td></tr>`).join('')}</tbody></table></div><p class="mini">Alle Stückzahlen sind ganze Stückzahlen. Die Daten entsprechen dem ersten Grundfall des Kurses.</p></section></div><section class="card"><h2>🎮 Produktionsplan erstellen</h2><p>Ändern Sie die Mengen. Das Planungssystem berechnet Kapazität und Gesamtdeckungsbeitrag live.</p><div class="game-controls">${controls}</div><div id="game-stats">${gameStats()}</div><div class="foot-actions" style="margin-top:15px">${btn('Plan abgeben','data-game-submit','primary')}${btn('Mengen auf null','data-game-zero','ghost')}</div>${game.submitted?`<div class="accent-banner" style="margin-top:15px"><b>Ihr abgegebener Plan:</b> ${fmt(D.products.reduce((n,p,i)=>n+(game.counts[i]||0)*(p.price-p.kv),0))} € Gesamt-DB. ${D.products.reduce((n,p,i)=>n+(game.counts[i]||0)*(p.price-p.kv),0)===54450?'Ihr Plan entspricht dem errechneten Standardoptimum.':'Vergleichen Sie Ihre Entscheidung mit der optimalen Rangfolge.'}</div>${rankSolution()}`:''}</section><section class="card"><h2>💬 Gemeinsam begründen</h2><p>Beantworten Sie gemeinsam: Warum kann ein Produkt mit einem hohen Stück-DB trotzdem die knappe Maschinenzeit weniger wirtschaftlich nutzen?</p>${renderQuestion({id:'game-reflect',afb:3,type:'text',prompt:'Formulieren Sie Ihre gemeinsame Erklärung in eigenen Worten.',answer:'self',solution:'Entscheidend ist der <b>Deckungsbeitrag je knapper Montageminute</b>. Ein Produkt mit hohem Stück-DB kann viel Zeit beanspruchen. Der relative DB ermöglicht einen Vergleich der wirtschaftlichen Nutzung der Engpasseinheit.',hint:'Vergleichen Sie Stückbeitrag und Minutenbedarf.'})}</section>`;
}
function answerFor(q){return state.progress.answers[q.id]||{value:q.type==='order'?q.items.map(x=>x[0]):q.type==='table'?q.fields.map(()=>''):q.type==='match'?q.pairs.map(()=>''):q.type==='multi'?[]:'',attempts:0}};
function renderInput(q,v){
 if(q.type==='number')return `<input class="field narrow" type="text" inputmode="decimal" data-answer="${q.id}" autocomplete="off" placeholder="Zahl eingeben, z. B. 12,5" value="${htmlEscape(v??'')}">`;
 if(q.type==='text')return `<textarea class="field field-area" data-answer="${q.id}" placeholder="Ihre Begründung / Ihr Rechenweg">${htmlEscape(v??'')}</textarea>`;
 if(q.type==='single'||q.type==='multi')return `<div class="qoptions">${q.options.map(([id,label])=>`<label class="option"><input type="${q.type==='single'?'radio':'checkbox'}" name="answer-${q.id}" value="${id}" data-option="${q.id}" ${(q.type==='single'?v===id:(v||[]).includes(id))?'checked':''}><span>${htmlEscape(label)}</span></label>`).join('')}</div>`;
 if(q.type==='truefalse')return `<div class="qoptions">${[['true','Richtig'],['false','Falsch']].map(([id,lab])=>`<label class="option"><input type="radio" data-option="${q.id}" name="answer-${q.id}" value="${id}" ${String(v)===id?'checked':''}><span>${lab}</span></label>`).join('')}</div>`;
 if(q.type==='table')return `<div class="data-table-wrap"><table class="data-table"><thead><tr>${q.fields.map(f=>`<th>${htmlEscape(f)}</th>`).join('')}</tr></thead><tbody><tr>${q.fields.map((f,i)=>`<td><input class="field" style="min-width:75px" aria-label="${htmlEscape(f)}" inputmode="decimal" type="text" value="${htmlEscape(v?.[i]??'')}" data-table-id="${q.id}" data-index="${i}" placeholder="Zahl"></td>`).join('')}</tr></tbody></table></div>`;
 if(q.type==='order'){const ids=v?.length?q.items.map(x=>x[0]).filter(id=>v.includes(id)).sort((a,b)=>v.indexOf(a)-v.indexOf(b)):q.items.map(x=>x[0]);return `<p class="mini">Ziehen Sie die Einträge (Desktop) oder verwenden Sie die Pfeile (Smartphone).</p><div class="orderlist">${ids.map((id,i)=>{let label=q.items.find(x=>x[0]===id)?.[1]||id;return `<div class="orderitem" draggable="true" data-ordid="${q.id}" data-item="${id}"><b>${i+1}.</b><span class="grow">${htmlEscape(label)}</span><span class="order-buttons">${btn('↑',`data-ordmove="${q.id}" data-item="${id}" data-dir="-1"`,'outline')}${btn('↓',`data-ordmove="${q.id}" data-item="${id}" data-dir="1"`,'outline')}</span></div>`}).join('')}</div>`;}
 if(q.type==='match')return q.pairs.map(([id,label],i)=>`<div class="matchline"><b>${htmlEscape(id[0].toUpperCase()+id.slice(1))}</b><select class="field" data-match-id="${q.id}" data-index="${i}"><option value="">Beschreibung wählen</option>${q.pairs.map(([key,description])=>`<option value="${key}" ${v?.[i]===key?'selected':''}>${htmlEscape(description)}</option>`).join('')}</select></div>`).join('');
 return '';
}
function renderQuestion(q){const a=answerFor(q),done=finished(q);
 return `<article class="q ${done?'done':''}" id="q-${q.id}"><div class="qheader"><span class="qid">${q.id==='game-reflect'?'Team-Aufgabe':q.id.startsWith('t')?'Test '+q.id.substring(1):q.id.startsWith('x')?'Bonus '+q.id.substring(1):'Übung '+q.id.substring(1)}</span><span class="tag">AFB ${['','I','II','III'][q.afb]}</span><span class="tag">${q.type==='text'?'Freitext · Selbstkontrolle':q.type==='number'?'Zahleneingabe':q.type==='order'?'Sortieren':q.type==='table'?'Tabelle':q.type==='match'?'Zuordnen':q.type==='multi'?'Mehrfachauswahl':q.type==='single'?'Einfachauswahl':'Richtig / falsch'}</span>${done?'<span class="tag success">✓ Erledigt</span>':''}${q.id.startsWith('x')?'<span class="tag bonus">Bonus</span>':''}</div><div class="prompt">${q.prompt}</div>${renderInput(q,a.value)}<details class="hint"><summary>💡 Hinweis anzeigen</summary>${q.hint||'Prüfen Sie die Angaben und den gesuchten Zusammenhang.'}</details><div class="qactions">${btn(q.type==='text'?'Antwort vergleichen':'Antwort prüfen',`data-check="${q.id}"`,'primary')}${btn('Musterlösung',`data-reveal="${q.id}"`,'outline')}${q.type==='text'&&a.revealed?btn('✓ Fachlich richtig',`data-self="${q.id}"`,'accent')+btn('Antwort überarbeiten',`data-retry="${q.id}"`,'ghost'):''}</div>${a.attempts&&q.type!=='text'&&!done?`<div class="feedback bad">Noch nicht richtig. Prüfen Sie Ihre Eingabe und versuchen Sie es erneut. Sie können den Hinweis öffnen.</div>`:''}${done?`<div class="feedback good">✓ ${q.type==='text'?'Antwort von Ihnen selbst kontrolliert.':'Richtig. Gut gerechnet / zugeordnet.'} Aufgabe abgeschlossen.</div>`:''}${a.revealed?`<div class="solution"><b>Musterlösung / Rechenhinweis</b><p>${q.solution}</p></div>`:''}</article>`;
}
function chapterPage(ch){const achieved=ch.questions.filter(finished).length;
 return `${hero('Kapitel · Produktionsmission',ch.icon+' '+ch.title,ch.lead,btn('Zur Lernübersicht','data-page="lexikon"','ghost')+btn('Alle Antworten als PDF','data-print','ghost'))}
 <div class="grid2"><div class="definition"><h3>📘 Wichtig zu wissen</h3><p>${ch.definition}</p></div><div class="example"><h3>🔍 Vorgerechnetes Beispiel</h3><p>${ch.example}</p></div></div>${ch.id==='programm'?interactiveSlider():''}<section class="card"><div class="chapter-top"><div><h2>Übungsstation</h2><p class="step-note">Aufgaben mit unterschiedlichen Anforderungsbereichen. Sie können beliebig oft üben.</p></div><span class="bubble">${achieved} von ${ch.questions.length} Aufgaben erledigt</span></div><div class="progressbar"><i style="width:${achieved/ch.questions.length*100}%"></i></div></section><div class="question-list">${ch.questions.map(renderQuestion).join('')}</div><div class="foot-actions">${btn('Zum nächsten Kapitel',`data-page="${D.chapters[D.chapters.findIndex(x=>x.id===ch.id)+1]?.id||'bonus'}"`,'primary')}${btn('Fortschritt als PDF','data-print','ghost')}</div>`;
}
function interactiveSlider(){return `<section class="card"><h2>🎚️ Interaktives Schaubild: Wie verändert die Kapazität die Planung?</h2><p>Verschieben Sie den Regler. Die maximale Nachfrage und die relativen Deckungsbeiträge bleiben gleich.</p><div class="sliderbox"><label><b>Verfügbare Montagezeit: <span id="slider-text">${fmt(state.slider)} min</span></b><input type="range" min="6000" max="15000" step="50" value="${state.slider}" data-cap-slider></label><div id="slider-chart">${sliderChart()}</div></div></section>`}
function sliderChart(){const x=solveProgram(state.slider),palette=['#3a7cbb','#42a895','#d99533','#8a72c8'],segments=x.products.map((p,i)=>`<span title="${p.name}: ${p.qty} Stück" style="width:${p.qty*p.time/state.slider*100}%;background:${palette[i]}">${p.qty*p.time/state.slider*100>13?p.name:''}</span>`).join('');return `<div class="chartstack" role="img" aria-label="Auslastung der Montagezeit">${segments}</div><p class="mini">${x.products.map((p,i)=>`${p.name}: <b>${fmt(p.qty)} St.</b>`).join(' · ')}<br>Genutzte Zeit: <b>${fmt(x.used)} min</b> · Rest: <b>${fmt(x.rest)} min</b> · Gesamt-DB: <b>${fmt(x.total)} €</b>.</p>`}
function questionCollection(title,lead,questions){return hero('Übungsraum',title,lead,btn('Kompetenztest starten','data-page="test"','accent'))+`<div class="accent-banner">Bonusaufgaben helfen Ihnen, das Verfahren auf ungewohnte Sachverhalte zu übertragen. Auch hier gibt es Rechenhinweise und Musterlösungen.</div><div class="question-list">${questions.map(renderQuestion).join('')}</div>`}
function testPage(){const completed=D.final.filter(finished).length;return hero('Abschlussmission','🎓 Kompetenztest','Prüfen Sie, ob Sie Stück-DB, Engpass, Rangfolge, optimale Stückzahlen und Betriebsergebnis sicher anwenden können.',btn('Selbsteinschätzung öffnen','data-page="check"','accent'))+`<section class="card"><h2>Ihre Test-Übersicht</h2><div class="progressbar"><i style="width:${completed/D.final.length*100}%"></i></div><p>${completed} von ${D.final.length} Aufgaben erledigt. Die Lösungen können Sie nach einer Sicherheitsabfrage einsehen.</p>${completed===D.final.length?'<div class="accent-banner">🏆 Abschlusstest abgeschlossen! Überprüfen Sie nun Ihre Kompetenzen auf der Skala 1–5.</div>':''}</section><div class="question-list">${D.final.map(renderQuestion).join('')}</div>`}
function checkPage(){return hero('Ihre Kompetenzübersicht','✅ Selbsteinschätzung','Schätzen Sie sich für jede Kompetenz auf einer Skala von 1 (noch unsicher) bis 5 (sehr sicher) ein. Erledigte Punkte werden markiert und können zurückgesetzt werden.',btn('Alle Antworten als PDF','data-print','ghost'))+`<div class="card"><h2>Selbst-Check · 10 Kompetenzen</h2><p class="mini">Erledigte Punkte werden nach unten sortiert. Sie können die Erledigung jederzeit rückgängig machen.</p><div class="question-list">${D.checklist.map((text,i)=>({text,i,...state.progress.checklist[i]})).sort((a,b)=>(+!!a.done)-(+!!b.done)).map(c=>`<div class="checkitem ${c.done?'done':''}"><label><b>${c.done?'✓ ':''}${htmlEscape(c.text)}</b></label><select class="field" data-rating="${c.i}" aria-label="Kompetenz ${c.i+1} selbst einschätzen">${[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(c.rating||1)===n?'selected':''}>${n} / 5</option>`).join('')}</select>${btn(c.done?'↶ Zurücksetzen':'✓ Erledigt',`data-checkdone="${c.i}"`,c.done?'outline':'accent')}</div>`).join('')}</div></div>`}
function glossaryPage(){return hero('Wissensspeicher','📖 Begriffslexikon','Die wichtigsten Begriffe und Regeln des relativen Deckungsbeitrags – zum Nachschlagen.',btn('Zurück zum Kurs','data-page="basis"','accent'))+`<section class="card"><h2>Bildübersicht zum Lösungsweg</h2><img src="assets/lernuebersicht.png" alt="Infografik: sechs Schritte vom Stückdeckungsbeitrag bis zum Betriebsergebnis" style="width:100%;height:auto;border:1px solid #dce5f0;border-radius:13px" loading="lazy"><p class="mini">Die Grafik fasst das Standardverfahren bei einem Engpass zusammen.</p></section><section><h2>Begriffe von A bis Z</h2><dl class="glossary">${D.glossary.slice().sort((a,b)=>a[0].localeCompare(b[0],'de')).map(([x,y])=>`<div><dt>${htmlEscape(x)}</dt><dd>${htmlEscape(y)}</dd></div>`).join('')}</dl></section>`}
function shopPage(){return hero('Verdiente XP einsetzen','🛍️ Avatar-Shop & Galerie','Sammeln Sie XP durch gelöste Aufgaben. Kaufen Sie Avatare, Haustiere und Outfits und zeigen Sie Ihr Lieblingsstück oben rechts im Kurs.',btn('Weitere XP verdienen','data-page="bonus"','accent'))+`<div class="grid3"><div class="statbox"><span>Gesammelte XP</span><b>${fmt(state.progress.xp)}</b></div><div class="statbox"><span>Verfügbar</span><b>${fmt(wallet())}</b></div><div class="statbox"><span>Galerie</span><b>${state.progress.owned.length} / ${D.shop.length}</b></div></div><section><h2>🖼️ Ihre Sammlung</h2><div class="items">${D.shop.filter(i=>state.progress.owned.includes(i.id)).map(shopCard).join('')}</div></section><section><h2>Freischaltbare Figuren</h2><div class="items">${D.shop.filter(i=>!state.progress.owned.includes(i.id)).map(shopCard).join('')}</div></section><section class="card"><h2>🏅 Auszeichnungen</h2><div class="items">${[['Erstes Spiel',state.progress.completed.includes('game')],['Kapitel-Profi',D.chapters.some(c=>c.questions.every(finished))],['1000 XP',state.progress.xp>=1000],['Abschlusstest',D.final.every(finished)]].map(([label,on])=>`<div class="shop-item"><div class="symbol">${on?'🏆':'🔒'}</div><b>${label}</b><p>${on?'Freigeschaltet':'Noch offen'}</p></div>`).join('')}</div></section>`}
function shopCard(item){const own=state.progress.owned.includes(item.id),on=state.progress.equipped===item.id;return `<article class="shop-item"><div class="symbol">${item.emoji}</div><span class="tag">${item.kind}</span><h3>${htmlEscape(item.label)}</h3><p>${htmlEscape(item.description)}</p>${own?btn(on?'✓ Aktiv':'In Avatar-Feld zeigen',`data-equip="${item.id}"`,on?'outline':'primary'):btn('✦ '+item.cost+' XP freischalten',`data-buy="${item.id}"`,wallet()>=item.cost?'accent':'outline')}</article>`}
function accountPage(){const u=state.user;
 if(u) return hero('Ihr Profil','🔐 '+htmlEscape(u.nickname),`Klasse ${htmlEscape(u.class)} · ${u.role==='teacher'?'Lehrkraft':'Schülerkonto'} · Lernstand geräteübergreifend synchronisieren.`,btn('Abmelden','data-logout','outline')+(u.role==='teacher'?btn('Lehrerbereich','data-page="teacher"','accent'):''))+
 `<section class="card"><h2>Passwort ändern</h2>${u.mustChange?'<p class="feedback bad">Sie haben ein Einmalpasswort erhalten. Bitte legen Sie jetzt ein neues Passwort fest.</p>':''}<form id="password-form" class="auth-form"><label>Bisheriges Passwort<input class="field" type="password" autocomplete="current-password" name="oldPassword" required></label><label>Neues Passwort (mind. 8 Zeichen)<input class="field" type="password" autocomplete="new-password" name="newPassword" minlength="8" required></label><button class="btn primary" type="submit">Passwort ändern</button></form><p class="mini">Geräteübergreifende Speicherung ist bei Netlify angemeldet aktiv. Bei einem fehlgeschlagenen Speichervorgang bleibt eine lokale Sicherung erhalten.</p></section>`;
 return hero('Freiwillige Anmeldung','🔐 Mit oder ohne Konto lernen','Ohne Anmeldung können Sie alle Inhalte nutzen; Ihr Fortschritt bleibt in diesem Browser. Mit Konto speichern Sie Ihren Fortschritt unter Klasse, Nickname und Passwort auf Netlify.',btn('Ohne Anmeldung starten','data-page="game"','accent'))+
 `<div class="grid2"><section class="card"><div class="foot-actions">${btn('Anmelden','data-mode="login"',state.mode==='login'?'primary':'ghost')}${btn('Konto erstellen','data-mode="register"',state.mode==='register'?'primary':'ghost')}</div><form id="auth-form" class="auth-form"><label>Klasse / Kurskennung<input class="field" type="text" maxlength="48" name="class" placeholder="z. B. FOS12W1" autocomplete="organization" required></label><label>Selbst gewählter Nickname<input class="field" type="text" maxlength="32" name="nickname" placeholder="z. B. MatheFuchs" autocomplete="username" required></label><label>Passwort (mind. 8 Zeichen)<input class="field" type="password" minlength="8" name="password" autocomplete="${state.mode==='register'?'new-password':'current-password'}" required></label>${state.mode==='register'?`<label>Rolle<select class="field" name="role" id="role-select"><option value="student">Schüler/in</option><option value="teacher">Lehrkraft</option></select></label><label id="teacher-code-label" hidden>Lehrkraft-Code (in Netlify hinterlegt)<input class="field" type="password" name="teacherCode"></label>`:''}<button class="btn primary" type="submit">${state.mode==='register'?'Konto erstellen':'Anmelden'}</button></form></section><section class="card"><h2>ℹ️ Hinweise zur Anmeldung</h2><p><b>Schüler/innen:</b> Klasse, Nickname und Passwort wählen. Die Kombination aus <b>Klasse + Nickname</b> identifiziert das Konto.</p><p><b>Lehrkräfte:</b> bei der Registrierung „Lehrkraft“ auswählen. Der in Netlify eingerichtete <code>TEACHER_CODE</code> ist nur zur Registrierung erforderlich.</p><p><b>Klassenübersicht:</b> Lehrkräfte sehen die Schülerinnen und Schüler, die exakt dieselbe Klassenkennung verwenden.</p><p><b>Datenschutz:</b> Verwenden Sie keine Klarnamen als Nickname. Das System benötigt weder eine E-Mail-Adresse noch einen externen SQL-Dienst.</p></section></div>`;
}
function teacherPage(){if(state.user?.role!=='teacher')return `<section class="card"><h2>Lehrerbereich</h2><p>Dieser Bereich steht nur registrierten Lehrkräften zur Verfügung.</p>${btn('Anmelden','data-page="account"','primary')}</section>`;
 const rows=state.teacherRows||[];
 return hero('Nur für Lehrkräfte','👩‍🏫 Klassenübersicht',`Sie sehen ausschließlich die Lernstände Ihrer Klasse: ${htmlEscape(state.user.class)}.`,btn('Daten aktualisieren','data-teacher-refresh','accent')+btn('Alle Lernstände der Klasse löschen','data-teacher-clear','ghost'))+
 `<section class="card"><h2>Schülerkonten: ${rows.length}</h2><p class="mini">Fortschrittseinträge sind keine Leistungsbewertung; Freitextaufgaben werden durch die Lernenden selbst bewertet.</p>${rows.length?`<div class="data-table-wrap"><table class="data-table teacher-table"><thead><tr><th>Nickname</th><th>XP</th><th>Bearbeitete Aufgaben</th><th>Kapitel</th><th>Letzter Stand</th><th>Verwaltung</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${htmlEscape(r.nickname)}</b></td><td>${fmt(r.xp)}</td><td>${fmt(r.answered)}</td><td>${r.completed}</td><td>${r.updatedAt?new Date(r.updatedAt).toLocaleDateString('de-DE'):'–'}</td><td class="teacher-actions">${btn('Einsehen',`data-teacher-view="${htmlEscape(r.nickname)}"`,'outline')}${btn('Passwort',`data-teacher-reset="${htmlEscape(r.nickname)}"`,'ghost')}${btn('Entfernen',`data-teacher-delete="${htmlEscape(r.nickname)}"`,'red')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Noch keine Schülerkonten in dieser Klasse oder Daten werden geladen.</div>'}</section>${state.teacherDetail?teacherDetailPage(state.teacherDetail):''}`;
}
function teacherDetailPage(d){const a=d.progress.answers||{};const data=[{id:'game-reflect',type:'text',prompt:'Partnerreflexion zum Zeitkartenspiel'},...allQs()].filter(q=>a[q.id]&&(String(a[q.id].value??'').length>0||a[q.id].checked));return `<section class="card"><h2>🔎 Einzelansicht: ${htmlEscape(d.nickname)}</h2><p><b>${data.length}</b> Aufgaben mit Eingabe; ${fmt(d.progress.xp)} XP.</p>${data.map(q=>`<details style="border-bottom:1px solid #dae5ef;padding:9px 0"><summary>${htmlEscape(q.id)} · ${q.type==='text'?'Freitext':q.type} · ${a[q.id].correct||a[q.id].selfChecked?'erledigt':'offen'}</summary><p>${q.prompt}</p><p><b>Antwort:</b> ${htmlEscape(answerReadable(q,a[q.id].value))}</p><p class="mini">Bei Selbstkontrolle keine automatische inhaltliche Bewertung.</p></details>`).join('')}</section>`;}
function answerReadable(q,v){if(q.type==='single'||q.type==='multi'){const ids=Array.isArray(v)?v:[v];return ids.map(id=>q.options?.find(o=>o[0]===id)?.[1]||id).join('; ')}if(q.type==='truefalse')return String(v)==='true'?'Richtig':'Falsch';if(q.type==='order')return (v||[]).map(id=>q.items.find(o=>o[0]===id)?.[1]||id).join(' → ');if(q.type==='table')return (v||[]).map((x,i)=>`${q.fields[i]}: ${x}`).join('; ');if(q.type==='match')return (v||[]).map((x,i)=>`${q.pairs[i][0]}: ${q.pairs.find(o=>o[0]===x)?.[1]||'–'}`).join('; ');return String(v??'');}
function exportPDF(){
 const parts=[];const ans=state.progress.answers;
 const game=state.progress.game;if(game?.submitted){parts.push(`<section><h2>Einstiegsspiel – Produktionsplanung</h2><p>Produktionsmengen: ${D.products.map((x,i)=>`${x.name} ${game.counts[i]||0} Stück`).join(', ')}</p><p>Abgegebener Deckungsbeitrag: ${fmt(D.products.reduce((n,p,i)=>n+(game.counts[i]||0)*(p.price-p.kv),0))} €</p></section>`);}
 if(hasContent(ans['game-reflect']))parts.push(`<section><h2>Partnerreflexion</h2><p>Warum reicht der Stückdeckungsbeitrag als Entscheidungskriterium bei einem Engpass nicht aus?</p><div class="printanswer">${htmlEscape(ans['game-reflect'].value)}</div></section>`);
 for(const ch of D.chapters){const thisQs=ch.questions.filter(q=>hasContent(ans[q.id]));if(thisQs.length){parts.push(`<h2>${htmlEscape(ch.title)}</h2>`);for(const q of thisQs)parts.push(`<section><b>${htmlEscape(q.id)} – Aufgabe:</b> ${q.prompt}<p><b>Ihre Antwort:</b></p><div class="printanswer">${htmlEscape(answerReadable(q,ans[q.id].value))}</div><p><small>Status: ${ans[q.id].correct||ans[q.id].selfChecked?'Erledigt':'In Bearbeitung'}</small></p></section>`);}}
 for(const [name,items] of [['Bonus',D.bonus],['Abschlusstest',D.final]]){const thisQs=items.filter(q=>hasContent(ans[q.id]));if(thisQs.length){parts.push(`<h2>${name}</h2>`);for(const q of thisQs)parts.push(`<section><b>${htmlEscape(q.id)} – Aufgabe:</b> ${q.prompt}<p><b>Ihre Antwort:</b></p><div class="printanswer">${htmlEscape(answerReadable(q,ans[q.id].value))}</div></section>`);}}
 const checks=Object.entries(state.progress.checklist||{});if(checks.length){parts.push('<h2>Selbsteinschätzung</h2>');for(const [i,v] of checks)parts.push(`<section>${htmlEscape(D.checklist[Number(i)]||i)} – ${v.rating||1}/5; ${v.done?'Erledigt':'Offen'}</section>`)}
 $('#print-area').innerHTML=`<h1>Produktionsmission · Meine Aufgaben und Antworten</h1><p>${state.user?`Nickname: ${htmlEscape(state.user.nickname)} · Klasse: ${htmlEscape(state.user.class)}`:'Gastmodus'} · Stand: ${new Date().toLocaleDateString('de-DE')}</p><p>Zusammenhängende Dokumentation aller Aufgaben mit gespeicherten Eingaben.</p>${parts.length?parts.join(''):'<p>Noch keine bearbeiteten Aufgaben vorhanden.</p>'}`;
 window.print();
}
function hasContent(a){if(!a)return false;return typeof a.value==='string'?!!a.value.trim():Array.isArray(a.value)?a.value.some(x=>String(x).length):a.value!==undefined&&a.value!==null;}
function ensureAnswer(id){if(!state.progress.answers[id])state.progress.answers[id]={value:getQ(id)?.type==='multi'?[]:'',attempts:0,checked:false,correct:false,revealed:false,selfChecked:false};return state.progress.answers[id]}
function invalidate(a){if(a.correct||a.selfChecked){a.checked=false;a.correct=false;a.selfChecked=false;}}
function normalizeNumber(v){let s=String(v??'').trim().replace(/[€\s]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');return s===''?NaN:Number(s)}
function evaluate(q,v){
 if(q.type==='number')return Number.isFinite(normalizeNumber(v)) && Math.abs(normalizeNumber(v)-q.answer)<=Math.max(.005,Math.abs(q.answer)*.000001);
 if(q.type==='table')return Array.isArray(v)&&v.length===q.answer.length&&v.every((x,i)=>Number.isFinite(normalizeNumber(x))&&Math.abs(normalizeNumber(x)-q.answer[i])<.005);
 if(q.type==='single')return v===q.answer;
 if(q.type==='multi')return Array.isArray(v)&&v.length===q.answer.length&&v.slice().sort().join('|')===q.answer.slice().sort().join('|');
 if(q.type==='truefalse')return String(v)===String(q.answer);
 if(q.type==='order'||q.type==='match')return Array.isArray(v)&&v.join('|')===q.answer.join('|');
 return false;
}
function award(q){const a=ensureAnswer(q.id);if(a.rewarded)return;a.rewarded=true;const xp=q.id==='game-reflect'?50:earned(q);const credit=a?.revealed?Math.round(xp*.5):xp;state.progress.xp+=credit;notice(`+${credit} XP · Aufgabe abgeschlossen`);}
function checkTask(id){const q=getQ(id)|| (id==='game-reflect'?{id,afb:3,type:'text',solution:'Der DB je knapper Minute ist entscheidend.'}:null);if(!q)return;
 const a=ensureAnswer(id);
 if(q.type==='text'){
  if(!String(a.value??'').trim()){notice('Bitte schreiben Sie zuerst eine eigene Antwort.');return;}
  if(!a.revealed){if(!confirm('Möchten Sie die Musterlösung jetzt wirklich sehen oder Ihre Antwort noch einmal überarbeiten?'))return;a.revealed=true;}
  save();render();document.getElementById('q-'+id)?.scrollIntoView({block:'center'});return;
 }
 if(q.type==='number'&&!String(a.value??'').trim()){notice('Bitte zuerst eine Zahl eingeben.');return;}
 if(q.type==='table'&&(!Array.isArray(a.value)||a.value.some(x=>!String(x).trim()))){notice('Bitte alle Tabellenfelder ausfüllen.');return;}
 if(q.type==='match'&&(!Array.isArray(a.value)||a.value.some(x=>!x))){notice('Bitte alle Begriffe zuordnen.');return;}
 if(q.type==='single'&&!a.value){notice('Bitte eine Antwort auswählen.');return;}
 if(q.type==='multi'&&(!Array.isArray(a.value)||a.value.length===0)){notice('Bitte mindestens eine Antwort auswählen.');return;}
 if(q.type==='truefalse'&&String(a.value)!=='true'&&String(a.value)!=='false'){notice('Bitte Richtig oder Falsch auswählen.');return;}
 a.attempts=(a.attempts||0)+1;
 const correct=evaluate(q,a.value);if(correct&&!a.correct){a.correct=true;a.checked=true;award(q);}
 if(!correct)notice('Noch nicht korrekt. Sie können Ihre Eingabe überarbeiten.');
 save();render();document.getElementById('q-'+id)?.scrollIntoView({block:'center'});
}
function revealTask(id){const q=getQ(id)|| (id==='game-reflect'?{id}:null);if(!q)return;
 if(!confirm('Sind Sie sicher, dass Sie die Musterlösung sehen möchten? Möchten Sie es nicht lieber noch einmal versuchen?'))return;
 const a=ensureAnswer(id);a.revealed=true;save();render();document.getElementById('q-'+id)?.scrollIntoView({block:'center'});
}
function gameSubmit(){const g=state.progress.game||{counts:[0,0,0,0]};let used=D.products.reduce((s,p,i)=>s+(g.counts[i]||0)*p.time,0);
 if(used>D.capacity){notice('Ihre Planung überschreitet die verfügbare Maschinenzeit.');return;}
 if(!g.counts.some(n=>n>0)){notice('Produzieren Sie zunächst mindestens eine Leuchte.');return;}
 g.score=D.products.reduce((s,p,i)=>s+(g.counts[i]||0)*(p.price-p.kv),0);g.submitted=true;state.progress.game=g;
 if(!state.progress.completed.includes('game')){state.progress.completed.push('game');state.progress.xp+=120;notice('Einstiegsspiel abgeschlossen: +120 XP!');}
 save();render();document.getElementById('game-stats')?.scrollIntoView({block:'center'});
}
async function loadTeacher(){if(state.user?.role!=='teacher')return;try{const data=await api('teacher-list');state.teacherRows=data.users;state.teacherDetail=null;render()}catch(err){notice(err.message)}}
async function registerOrLogin(e){e.preventDefault();const form=e.target;const v=Object.fromEntries(new FormData(form).entries());const teacher=state.mode==='register'&&v.role==='teacher';
 try{const oldGuest=read(keys.guest,blank());const response=await api(state.mode==='register'?'register':'login',{...v,teacher},false);
 state.token=response.token;state.user=response.user;state.progress=response.progress||blank();
 // Guests may keep what they have accomplished when creating a NEW student account.
 if(state.mode==='register'&&!teacher&&oldGuest?.xp>0){state.progress={...oldGuest,resetRev:response.progress.resetRev};storeLocally();}
 localStorage.setItem(keys.token,state.token);localStorage.setItem(keys.user,JSON.stringify(state.user));if(state.mode==='register'&&!teacher&&oldGuest?.xp>0)save();
 notice('Anmeldung erfolgreich.');navigate(state.user.role==='teacher'?'teacher':'game');
 }catch(err){notice(err.message);}
}
async function changePassword(e){e.preventDefault();const v=Object.fromEntries(new FormData(e.target).entries());try{const d=await api('change-password',v);state.token=d.token;state.user=d.user;localStorage.setItem(keys.token,d.token);localStorage.setItem(keys.user,JSON.stringify(d.user));notice('Passwort geändert.');navigate('account');}catch(err){notice(err.message)}}
const logout=()=>{clearTimeout(debounce);state.token='';state.user=null;state.progress=read(keys.guest,blank());localStorage.removeItem(keys.token);localStorage.removeItem(keys.user);navigate('account');notice('Sie sind abgemeldet.');};
function init(){render();if(state.token){api('me',{}).then(r=>{state.user=r.user;state.progress=r.progress;storeLocally();render()}).catch(()=>{logout();notice('Sitzung abgelaufen. Bitte erneut anmelden.')})}}

// Event delegation permits re-render without leaving listeners behind.
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 const d=b.dataset;
 if(d.page){navigate(d.page);return}
 if(d.mode){state.mode=d.mode;render();return}
 if(d.print!==undefined){exportPDF();return}
 if(d.logout!==undefined){logout();return}
 if(d.check){checkTask(d.check);return}
 if(d.reveal){revealTask(d.reveal);return}
 if(d.self){let a=ensureAnswer(d.self);if(!a.revealed){notice('Vergleichen Sie zunächst mit der Musterlösung.');return;}if(!a.selfChecked){a.selfChecked=true;award(getQ(d.self)||{id:d.self,afb:3});}save();render();return}
 if(d.retry){const a=ensureAnswer(d.retry);a.revealed=false;save();render();return}
 if(d.ordmove){const q=getQ(d.ordmove),a=ensureAnswer(q.id);if(!Array.isArray(a.value))a.value=q.items.map(x=>x[0]);let i=a.value.indexOf(d.item),j=i+Number(d.dir);if(j>=0&&j<a.value.length){invalidate(a);[a.value[i],a.value[j]]=[a.value[j],a.value[i]];save();render();}return}
 if(d.gameStep!==undefined){const i=Number(d.gameStep),p=D.products[i],g=state.progress.game||{counts:[0,0,0,0]};g.counts[i]=Math.max(0,Math.min(p.max,Number(g.counts[i]||0)+Number(d.by)));g.submitted=false;state.progress.game=g;const field=document.querySelector(`[data-game-qty="${i}"]`);if(field)field.value=g.counts[i];$('#game-stats').innerHTML=gameStats();save();return}
 if(d.gameSubmit!==undefined){gameSubmit();return}
 if(d.gameZero!==undefined){state.progress.game={counts:[0,0,0,0],submitted:false};save();render();return}
 if(d.buy){const x=D.shop.find(s=>s.id===d.buy);if(!x)return;if(state.progress.owned.includes(x.id))return;if(wallet()<x.cost){notice('Noch nicht genug XP vorhanden.');return}if(!confirm(`Möchten Sie „${x.label}“ für ${x.cost} XP freischalten?`))return;state.progress.spent+=x.cost;state.progress.owned.push(x.id);state.progress.equipped=x.id;save();render();notice('Freigeschaltet: '+x.label);return}
 if(d.equip){if(state.progress.owned.includes(d.equip)){state.progress.equipped=d.equip;save();render()}return}
 if(d.checkdone!==undefined){const i=d.checkdone;const c=state.progress.checklist[i]||{rating:1,done:false};c.done=!c.done;state.progress.checklist[i]=c;save();render();return}
 if(d.teacherRefresh!==undefined){await loadTeacher();return}
 if(d.teacherView){try{const r=await api('teacher-progress',{nickname:d.teacherView});state.teacherDetail=r;render();document.querySelector('.card:last-child')?.scrollIntoView({block:'start'});}catch(err){notice(err.message)}return}
 if(d.teacherReset){if(!confirm(`Wirklich ein Einmalpasswort für „${d.teacherReset}“ ausstellen? Alte Sitzungen werden ungültig.`))return;try{const r=await api('teacher-reset',{nickname:d.teacherReset});prompt('Einmalpasswort – jetzt kopieren und persönlich weitergeben:',r.temporaryPassword);notice('Einmalpasswort wurde erstellt.');}catch(err){notice(err.message)}return}
 if(d.teacherDelete){if(!confirm(`Wollen Sie das Konto „${d.teacherDelete}“ samt Fortschritt wirklich dauerhaft löschen?`))return;try{await api('teacher-delete',{nickname:d.teacherDelete});notice('Konto entfernt.');await loadTeacher()}catch(err){notice(err.message)}return}
 if(d.teacherClear!==undefined){const target=`LOESCHEN ${state.user?.class}`;const answer=prompt(`Alle Fortschritte Ihrer Klasse löschen (Konten bleiben erhalten)?\nBestätigen Sie mit: ${target}`);if(answer!==target)return;try{const r=await api('teacher-clear',{confirm:answer});notice(`${r.count} Fortschrittsdatensätze gelöscht.`);await loadTeacher()}catch(err){notice(err.message)}return}
});
document.addEventListener('input',e=>{
 const el=e.target,d=el.dataset;
 if(d.answer){const a=ensureAnswer(d.answer);invalidate(a);a.value=el.value;save();return}
 if(d.option){const q=getQ(d.option)||{type:'text'},a=ensureAnswer(d.option);invalidate(a);if(q.type==='multi'){a.value=[...document.querySelectorAll(`input[data-option="${q.id}"]:checked`)].map(x=>x.value)}else{a.value=el.value}save();return}
 if(d.tableId){const q=getQ(d.tableId),a=ensureAnswer(d.tableId);if(!Array.isArray(a.value))a.value=q.fields.map(()=>'');invalidate(a);a.value[Number(d.index)]=el.value;save();return}
 if(d.matchId){const q=getQ(d.matchId),a=ensureAnswer(d.matchId);if(!Array.isArray(a.value))a.value=q.pairs.map(()=>'');invalidate(a);a.value[Number(d.index)]=el.value;save();return}
 if(d.gameQty!==undefined){const i=Number(d.gameQty),p=D.products[i],g=state.progress.game||{counts:[0,0,0,0]};g.counts[i]=Math.max(0,Math.min(p.max,Math.floor(Number(el.value)||0)));g.submitted=false;state.progress.game=g;if(String(g.counts[i])!==el.value)el.value=g.counts[i];$('#game-stats').innerHTML=gameStats();save();return}
 if(d.capSlider!==undefined){state.slider=Number(el.value);$('#slider-text').textContent=fmt(state.slider)+' min';$('#slider-chart').innerHTML=sliderChart();return}
 if(d.rating!==undefined){const x=state.progress.checklist[d.rating]||{rating:1,done:false};x.rating=Number(el.value);state.progress.checklist[d.rating]=x;save();return}
});
document.addEventListener('change',e=>{if(e.target.id==='role-select'){$('#teacher-code-label').hidden=e.target.value!=='teacher'}});
document.addEventListener('submit',e=>{if(e.target.id==='auth-form'){registerOrLogin(e)}else if(e.target.id==='password-form'){changePassword(e)}});
document.addEventListener('dragstart',e=>{const x=e.target.closest('.orderitem[draggable]');if(x){state.sortDrag={id:x.dataset.ordid,item:x.dataset.item};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',x.dataset.item)}});
document.addEventListener('dragover',e=>{if(e.target.closest('.orderitem[draggable]'))e.preventDefault()});
document.addEventListener('drop',e=>{const target=e.target.closest('.orderitem[draggable]');if(!target||!state.sortDrag||target.dataset.ordid!==state.sortDrag.id)return;e.preventDefault();const q=getQ(state.sortDrag.id),a=ensureAnswer(q.id);if(!Array.isArray(a.value))a.value=q.items.map(x=>x[0]);const from=a.value.indexOf(state.sortDrag.item),to=a.value.indexOf(target.dataset.item);if(from>=0&&to>=0&&from!==to){invalidate(a);a.value.splice(to,0,a.value.splice(from,1)[0]);save();render()}state.sortDrag=null});
window.addEventListener('beforeunload',()=>storeLocally());
init();
})();
