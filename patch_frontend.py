from pathlib import Path
p=Path(__file__).parent/'site'/'app.js'
s=p.read_text()

def swap(a,b):
 global s
 if a not in s: raise ValueError('not found: '+a[:120])
 s=s.replace(a,b,1)

def interval(a,b,new):
 global s
 start=s.index(a);end=s.index(b,start)
 s=s[:start]+new+s[end:]

swap("const keys={guest:'rel-db-guest-v1',token:'rel-db-token-v1',user:'rel-db-user-v1'};", "const keys={guest:'rel-db-guest-v1',token:'rel-db-token-v1',user:'rel-db-user-v1',scores:'rel-db-team-scores-v2'};")
swap("sortDrag:null,toastTimer:null}","sortDrag:null,toastTimer:null,teamScores:read(keys.scores,[]),teamName:''}")
# Browser timecards and stats: visually colored to match the three-stage challenge
interval('function gameStats(){','function rankSolution(){',r'''function gameStats(){
 const counts=state.progress.game?.counts||[0,0,0,0];
 const rows=D.products.map((p,i)=>({...p,qty:counts[i]||0,db:p.price-p.kv}));
 const used=rows.reduce((s,p)=>s+p.qty*p.time,0),sum=rows.reduce((s,p)=>s+p.qty*p.db,0),rest=D.capacity-used;
 const colors=['#51a8d8','#6f8de4','#eea65c','#926aca'];
 let cur=0;const segments=rows.map((p,i)=>{const l=p.qty*p.time;const v={start:cur,end:cur+l,color:colors[i],name:p.name};cur+=l;return v});
 const width=D.capacity/20;
 const fragments=Array.from({length:20},(_,i)=>{
   const lo=i*width,hi=lo+width;
   const stops=[];for(const seg of segments){const a=Math.max(lo,seg.start),b=Math.min(hi,seg.end);
     if(b>a){stops.push(`${seg.color} ${((a-lo)/width*100).toFixed(3)}%`,`${seg.color} ${((b-lo)/width*100).toFixed(3)}%`);}}
   const bg=stops.length?`linear-gradient(90deg,${stops.join(',')})`:'transparent';
   const active=segments.filter(seg=>seg.end>lo&&seg.start<hi).map(seg=>seg.name).join(', ');
   return `<span class="timecard" style="background:${bg}" title="Abschnitt ${i+1}: ${htmlEscape(active||'frei')}"></span>`;
 }).join('');
 return `<div class="grid3 game-kpis"><div class="statbox"><span>🕒 Genutzte Maschinenzeit</span><b>${fmt(used)} min</b></div><div class="statbox"><span>⌛ Freie Maschinenzeit</span><b style="color:${rest<0?'#bc3445':'#247d65'}">${fmt(rest)} min</b></div><div class="statbox"><span>💰 Ihr Gesamtdeckungsbeitrag</span><b>${fmt(sum)} €</b></div></div><div class="game-meter"><div class="timecards" aria-label="Auslastungsanzeige mit 20 farbigen Feldern">${fragments}</div><div class="game-legend">${rows.map((p,i)=>`<span><i style="background:${colors[i]}"></i>${p.name}: ${fmt(p.qty*p.time)} min</span>`).join('')}</div></div><p class="mini">Die 20 Zeitkarten visualisieren die <b>9.250 Montageminuten proportional</b>. Bei der Produktion zählt jede einzelne Minute; die Karten sind keine zusätzlichen Produktionseinheiten.</p><div class="accent-banner ${rest<0?'warning':''}">${rest<0?'⚠️ Die Maschine ist überplant. Reduzieren Sie eine Produktionsmenge.':rest===0?'✅ Die gesamte Maschinenzeit ist eingeplant.':'ℹ️ Ihre Planung hat noch Restkapazität. Prüfen Sie, ob diese gewinnbringend genutzt werden kann.'}</div>`;
}
''')
# new game interface based on earlier game, independent scoreboard
interval('function gamePage(){','function answerFor(q)',r'''function gamePage(){
 const game=state.progress.game||{counts:[0,0,0,0],submitted:false};
 const icons=['💡','🏙️','🎨','🚀'];
 const controls=D.products.map((p,i)=>`<article class="product-card playcard tone-${i}"><div class="product-icon">${icons[i]}</div><div class="product-info"><strong>${p.name}</strong><small>Netto-Preis: <b>${fmt(p.price)} €</b> · var. Kosten: <b>${fmt(p.kv)} €</b></small><div class="play-chips"><span>Stück-DB: <b>${fmt(p.price-p.kv)} €</b></span><span>⏱ ${p.time} min/St.</span><span>Absatzgrenze: <b>${fmt(p.max)} St.</b></span></div></div><div class="qtybox"><div class="quantity-label">Ihre Menge</div><div class="qty-buttons">${btn('−10',`data-game-step="${i}" data-by="-10" aria-label="${p.name}: zehn weniger"`,'outline')}${btn('−1',`data-game-step="${i}" data-by="-1" aria-label="${p.name}: eins weniger"`,'outline')}<input aria-label="Produktionsmenge ${p.name}" type="number" min="0" max="${p.max}" step="1" data-game-qty="${i}" value="${game.counts[i]||0}">${btn('+1',`data-game-step="${i}" data-by="1" aria-label="${p.name}: eins mehr"`,'outline')}${btn('+10',`data-game-step="${i}" data-by="10" aria-label="${p.name}: zehn mehr"`,'outline')}</div></div></article>`).join('');
 const scores=(Array.isArray(state.teamScores)?state.teamScores:[]).slice().sort((a,b)=>b.db-a.db||b.time-a.time).slice(0,10);
 const yours=D.products.reduce((n,p,i)=>n+(game.counts[i]||0)*(p.price-p.kv),0),used=D.products.reduce((n,p,i)=>n+(game.counts[i]||0)*p.time,0);
 return hero('Kapitel 0 · Zeitkarten-Challenge','🎮 Eine Maschine. Vier Leuchten. Ihre Entscheidung!','Übernehmen Sie zu zweit die Produktionsplanung der Leipziger LichtForm GmbH. Entscheiden Sie zunächst selbst, wie Sie die knappe Montagezeit nutzen. Die optimalen Mengen und der relative Deckungsbeitrag werden erst nach der Abgabe gezeigt.',btn('Zum Lernkapitel','data-page="basis"','accent')+btn('Bisherige Antworten drucken','data-print','ghost'))+
 `<section class="game-mission"><div class="game-mission-heading"><span class="big-emoji">🤝</span><div><h2>Arbeiten Sie zu zweit</h2><p><b>Person A – Produktionsleitung:</b> Wählen Sie die Stückzahlen. <b>Person B – Controlling:</b> Prüfen Sie Zeitbudget und Gesamt-DB. <b>Danach tauschen Sie die Rollen</b> und verbessern gemeinsam die Entscheidung, bevor Sie abgeben.</p></div></div><div class="game-mission-stats"><span>🃏 <b>20 Zeitkarten-Felder</b> für das Zeitbudget</span><span>⏱ <b>9.250 Minuten</b> verfügbar</span><span>🎯 <b>So viel DB wie möglich</b></span></div></section>
 <section class="card"><h2>📋 Ausgangsdaten der Leuchtenfabrik</h2><p>Sie entscheiden über die Mengen der Modelle Basic, City, Studio und Pro. Die Nachfrage ist jeweils nach oben begrenzt; es können nur ganze Leuchten gefertigt werden. Die Maschine kann nicht über ihre Zeitkapazität hinaus belegt werden.</p><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Modell</th><th>Netto-Preis</th><th>Var. Kosten</th><th>Max. Absatz</th><th>min/St.</th></tr></thead><tbody>${D.products.map(p=>`<tr><td>${p.name}</td><td>${fmt(p.price)} €</td><td>${fmt(p.kv)} €</td><td>${fmt(p.max)}</td><td>${fmt(p.time)}</td></tr>`).join('')}</tbody></table></div></section>
 <section class="card"><h2>🏭 Ihr Produktionsspiel</h2><p>Verteilen Sie die verfügbare Zeit mit den Plus-/Minus-Schaltflächen oder geben Sie Mengen direkt ein. Die farbigen Zeitkarten zeigen Ihre Belegung sofort an.</p><div class="game-controls">${controls}</div><div id="game-stats">${gameStats()}</div><div class="foot-actions">${btn('🏁 Gemeinsamen Plan abgeben','data-game-submit','primary')}${btn('↺ Neu planen','data-game-zero','ghost')}</div>${game.submitted?`<div class="game-result"><h3>🏆 Ihre Team-Auswertung</h3><p><b>Ihr Ergebnis: ${fmt(yours)} € Gesamtdeckungsbeitrag</b> · Genutzte Montagezeit: ${fmt(used)} min</p><p>${yours===54450?'Sie haben das optimale Ergebnis erreicht.':`Bis zum optimalen Ergebnis fehlen ${fmt(54450-yours)} €. Vergleichen Sie jetzt Ihre Planung mit dem Rechenweg.`}</p><label class="game-team-label">Name Ihres Zweierteams (nur auf diesem Gerät sichtbar)<input class="field" id="team-name" maxlength="32" placeholder="z. B. Team Blau" value="${htmlEscape(state.teamName)}"></label><div class="foot-actions">${btn('In Gruppenwertung übernehmen','data-game-score','accent')}</div></div>${rankSolution()}`:''}</section>
 <section class="card"><h2>🏅 Gruppenwertung auf diesem Gerät</h2><p class="mini">Die Ergebnisse bleiben nur im aktuell verwendeten Browser. Verschiedene Smartphones synchronisieren diese Wertung nicht automatisch.</p><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Platz</th><th>Team</th><th>Gesamt-DB</th><th>Zeit</th></tr></thead><tbody>${scores.length?scores.map((v,i)=>`<tr><td>${i+1}</td><td>${htmlEscape(v.name)}</td><td>${fmt(v.db)} €</td><td>${fmt(v.time)} min</td></tr>`).join(''):'<tr><td colspan="4">Noch keine eingetragenen Teams</td></tr>'}</tbody></table></div></section>
 <section class="card"><h2>💬 Reflexion im Zweierteam</h2><p>Erklären Sie gemeinsam: Weshalb reicht der höchste Stückdeckungsbeitrag bei knappem Maschineneinsatz nicht als Entscheidungsregel aus?</p>${renderQuestion({id:'game-reflect',afb:3,type:'text',prompt:'Formulieren Sie Ihre gemeinsame Erklärung in eigenen Worten.',answer:'self',solution:'Entscheidend ist der <b>Deckungsbeitrag je knapper Montageminute</b>. Ein Modell kann viel DB pro Stück liefern, aber zugleich die Maschine sehr lange beanspruchen. Deshalb wird nach dem <b>relativen Deckungsbeitrag</b> geplant.',hint:'Denken Sie an die Kombination aus Deckungsbeitrag je Stück und benötigten Minuten je Stück.'})}</section>`;
}
''')

swap("q.type==='table'?q.fields.map(()=>''):q.type==='match'?", "q.type==='table'?q.fields.map(()=>''):q.type==='matrix'?{}:q.type==='match'?")
# insert custom new grid rendering before input function
insert=r'''function matrixCellId(r,c){return r.id+':'+c.id}
function correctMatrixCell(q,key,v){return Object.prototype.hasOwnProperty.call(q.answer,key)&&Number.isFinite(normalizeNumber(v))&&Math.abs(normalizeNumber(v)-q.answer[key])<.005}
function renderMatrix(q,v,a){
 const g=q.grid,visible=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const rows=g.rows.map(r=>`<tr><th scope="row">${htmlEscape(r.label)}</th>${g.columns.map(c=>{
   const key=matrixCellId(r,c);
   if(Object.prototype.hasOwnProperty.call(r.given,c.id))return `<td class="given-cell">${typeof r.given[c.id]==='number'?fmt(r.given[c.id],Number.isInteger(r.given[c.id])?0:2):htmlEscape(r.given[c.id])}</td>`;
   if(Object.prototype.hasOwnProperty.call(r.expected,c.id)){
     const bad=(a.attempts||0)>0&&!correctMatrixCell(q,key,visible[key]);
     return `<td class="edit-cell ${bad?'needs-correction':''}"><input class="matrix-input" inputmode="decimal" type="text" aria-label="${htmlEscape(r.label)} ${htmlEscape(c.title)}" data-matrix-id="${q.id}" data-cell="${htmlEscape(key)}" value="${htmlEscape(visible[key]??'')}" placeholder="?" autocomplete="off"></td>`;
   }
   return '<td class="empty-cell">–</td>';
 }).join('')}</tr>`).join('');
 const keys=Object.keys(q.answer),complex=g.rows.length>=3&&g.columns.length>=3&&keys.length>=6;
 const rowsWithBlanks=g.rows.filter(r=>Object.keys(r.expected).length);
 const colsWithBlanks=g.columns.filter(c=>g.rows.some(r=>Object.prototype.hasOwnProperty.call(r.expected,c.id)));
 const unlocked=a.matrixHints||{};
 const help=complex?`<div class="matrix-helper"><h4>🧩 Schrittweise Tabellenhilfe</h4><p class="mini">Wählen Sie eine einzelne Zeile oder Spalte. Die Hilfe zeigt einen Rechenansatz, <b>nicht die fertigen Ergebnisse</b>. Sie können mehrere Hilfen einzeln öffnen.</p><div class="hint-buttons"><b>Spalten:</b>${colsWithBlanks.map(c=>btn(`💡 ${htmlEscape(c.title)}`,`data-matrix-hint="${q.id}" data-axis="col" data-key="${htmlEscape(c.id)}"`,'outline small')).join('')}</div><div class="hint-buttons"><b>Zeilen:</b>${rowsWithBlanks.map(r=>btn(`↳ ${htmlEscape(r.label)}`,`data-matrix-hint="${q.id}" data-axis="row" data-key="${htmlEscape(r.id)}"`,'outline small')).join('')}</div>${Object.entries(unlocked).filter(([k,v])=>v).map(([key])=>{
 const [axis,id]=key.split(':');const part=axis==='col'?g.columns.find(c=>c.id===id):g.rows.find(r=>r.id===id);
 return part?`<div class="hint-bubble"><b>${axis==='col'?'Spalte':'Zeile'} ${htmlEscape(part.title||part.label)}:</b> ${htmlEscape(part.hint||'Prüfen Sie die vorgegebenen Größen und setzen Sie diese in die passende Formel ein.')}</div>`:'';
 }).join('')}</div>`:'';
 const total=keys.length,done=keys.filter(k=>String(visible[k]??'').trim()!=='').length;
 return `<div class="matrix-head"><span>📊 <b>Interaktive Rechentabelle</b></span><span class="bubble">${done}/${total} Felder ausgefüllt</span></div><div class="data-table-wrap"><table class="data-table matrix-table"><thead><tr><th scope="col">Modell / Größe</th>${g.columns.map(c=>`<th scope="col">${htmlEscape(c.title)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="mini">Graue Felder sind gegeben. Weiße Felder füllen Sie selbst aus. Deutsche Zahlenschreibweise (z. B. 6,50) ist möglich. Die Tabelle wird als Ganzes geprüft.</p>${help}`;
}
function solutionMatrix(q){
 const g=q.grid;return `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Modell / Größe</th>${g.columns.map(c=>`<th>${htmlEscape(c.title)}</th>`).join('')}</tr></thead><tbody>${g.rows.map(r=>`<tr><td>${htmlEscape(r.label)}</td>${g.columns.map(c=>{const k=matrixCellId(r,c);const value=Object.prototype.hasOwnProperty.call(r.given,c.id)?r.given[c.id]:r.expected[c.id];return `<td>${value===undefined?'–':typeof value==='number'?fmt(value,Number.isInteger(value)?0:2):htmlEscape(value)}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
'''
swap('function renderInput(q,v){',insert+'function renderInput(q,v){')
swap(" if(q.type==='table')return", " if(q.type==='matrix')return renderMatrix(q,v,answerFor(q));\n if(q.type==='table')return")
swap("q.type==='table'?'Tabelle':", "q.type==='matrix'?'Mehrzeilige Rechentabelle':q.type==='table'?'Tabelle':")
swap("${q.solution}</p></div>","${q.solution}</p>${q.type==='matrix'?solutionMatrix(q):''}</div>")

# update PDF and printable text to include typed matrix cells with their exact row/column names
swap("if(q.type==='table')return (v||[]).map((x,i)=>`${q.fields[i]}: ${x}`).join('; ');", "if(q.type==='table')return (v||[]).map((x,i)=>`${q.fields[i]}: ${x}`).join('; ');if(q.type==='matrix')return q.grid.rows.map(r=>r.label+': '+q.grid.columns.filter(c=>Object.prototype.hasOwnProperty.call(r.expected,c.id)).map(c=>c.title+' = '+(v?.[matrixCellId(r,c)]||'–')).join(', ')).join('; ');")

swap("function exportPDF(){", r'''function printAnswer(q,v){
 if(q.type!=='matrix')return `<div class="printanswer">${htmlEscape(answerReadable(q,v))}</div>`;
 return `<table class="printmatrix"><thead><tr><th>Modell</th>${q.grid.columns.map(c=>`<th>${htmlEscape(c.title)}</th>`).join('')}</tr></thead><tbody>${q.grid.rows.map(r=>`<tr><td>${htmlEscape(r.label)}</td>${q.grid.columns.map(c=>{const key=matrixCellId(r,c);const given=r.given[c.id];const val=given===undefined?v?.[key]:given;return `<td>${htmlEscape(val===undefined||val===''?'—':val)}</td>`}).join('')}</tr>`).join('')}</tbody></table>`;
}
function exportPDF(){''')
swap('<div class="printanswer">${htmlEscape(answerReadable(q,ans[q.id].value))}</div>','${printAnswer(q,ans[q.id].value)}')
swap('<div class="printanswer">${htmlEscape(answerReadable(q,ans[q.id].value))}</div>','${printAnswer(q,ans[q.id].value)}')
swap("a.value!==undefined&&a.value!==null;}","typeof a.value==='object'&&a.value!==null?Object.values(a.value).some(x=>String(x??'').trim().length):a.value!==undefined&&a.value!==null;}")
swap("getQ(id)?.type==='multi'?[]:''", "getQ(id)?.type==='multi'?[]:getQ(id)?.type==='matrix'?{}:''")
swap(" if(q.type==='table')return Array.isArray(v)"," if(q.type==='matrix')return v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(q.answer).every(k=>correctMatrixCell(q,k,v[k]));\n if(q.type==='table')return Array.isArray(v)")
swap(" if(q.type==='table'&&(!Array.isArray(a.value)||a.value.some(x=>!String(x).trim()))){", " if(q.type==='matrix'&&(!a.value||Object.keys(q.answer).some(k=>!String(a.value[k]??'').trim()))){notice('Bitte alle weißen Tabellenfelder ausfüllen. Verwenden Sie die Zeilen- oder Spaltenhilfen, wenn Sie nicht weiterkommen.');return;}\n if(q.type==='table'&&(!Array.isArray(a.value)||a.value.some(x=>!String(x).trim()))){")
# event additions
swap(" if(d.gameSubmit!==undefined){gameSubmit();return}",r''' if(d.matrixHint){const q=getQ(d.matrixHint);if(q?.type!=='matrix')return;const a=ensureAnswer(q.id);if(!a.matrixHints)a.matrixHints={};const k=d.axis+':'+d.key;a.matrixHints[k]=!a.matrixHints[k];save();render();document.getElementById('q-'+q.id)?.scrollIntoView({block:'nearest'});return}
 if(d.gameScore!==undefined){const game=state.progress.game;if(!game?.submitted){notice('Geben Sie zunächst Ihre Planung ab.');return;}const name=(state.teamName||'').trim();if(!name){notice('Geben Sie zuerst einen Teamnamen ein.');return;}const record={name:name.slice(0,32),db:Number(game.score)||0,time:D.products.reduce((n,p,i)=>n+(game.counts[i]||0)*p.time,0)};state.teamScores=Array.isArray(state.teamScores)?state.teamScores:[];state.teamScores.push(record);state.teamScores.sort((a,b)=>b.db-a.db||b.time-a.time);state.teamScores=state.teamScores.slice(0,60);try{localStorage.setItem(keys.scores,JSON.stringify(state.teamScores))}catch{}notice('Teamwertung wurde lokal gespeichert.');render();return}
 if(d.gameSubmit!==undefined){gameSubmit();return}''')
swap(" const el=e.target,d=el.dataset;", " const el=e.target,d=el.dataset;\n if(el.id==='team-name'){state.teamName=el.value;return}")
swap(" if(d.tableId){", " if(d.matrixId){const q=getQ(d.matrixId),a=ensureAnswer(d.matrixId);if(!a.value||Array.isArray(a.value)||typeof a.value!=='object')a.value={};invalidate(a);a.value[d.cell]=el.value;save();return}\n if(d.tableId){")
# physical bug: pressing +10 can exceed capacity; cap max per item currently yes, cumulative may exceed. Game submit rejects.
# Prior scoreboard after submit should only be added after an actual submitted score. Good.
p.write_text(s)
print('patched',p,len(s))
