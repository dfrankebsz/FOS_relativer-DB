(function(){
  'use strict';
  const PRODUCTS=[
    {id:'premium',name:'Premium',detail:'Design-Leuchte',emoji:'✨',min:20,db:56,max:3},
    {id:'city',name:'City',detail:'Arbeitsplatz-Leuchte',emoji:'🏙️',min:10,db:38,max:5},
    {id:'basic',name:'Basic',detail:'Kompakt-Leuchte',emoji:'💡',min:5,db:16,max:7}
  ];
  const CAPACITY=100;
  const KEY='zeitkarten-challenge-v1';
  const counts={premium:0,city:0,basic:0};
  let submitted=false,saved=false;
  let scores=[];
  const $=id=>document.getElementById(id);
  const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  
  const used=()=>PRODUCTS.reduce((a,p)=>a+counts[p.id]*p.min,0);
  const total=()=>PRODUCTS.reduce((a,p)=>a+counts[p.id]*p.db,0);
  const pieces=()=>PRODUCTS.reduce((a,p)=>a+counts[p.id],0);
  const productRoot=$('products');
  PRODUCTS.forEach(p=>{
    const card=document.createElement('article');
    card.className='product '+p.id;
    card.innerHTML='<div><div class="product-title"><div class="product-emoji" aria-hidden="true">'+p.emoji+'</div><div><h3>'+p.name+'</h3><small>'+p.detail+'</small></div></div><div class="chips"><span class="chip">Stück-DB: <strong>'+euro(p.db)+'</strong></span><span class="chip">Montage: <strong>'+p.min+' min</strong> / '+(p.min/5)+' Karten</span><span class="chip">Max. Absatz: <strong>'+p.max+' Stück</strong></span></div></div><div class="ctrls"><button type="button" class="step" data-id="'+p.id+'" data-action="minus" aria-label="Ein Stück '+p.name+' entfernen">−</button><span class="quantity" id="q-'+p.id+'" aria-live="polite">0</span><button type="button" class="step" data-id="'+p.id+'" data-action="plus" aria-label="Ein Stück '+p.name+' hinzufügen">+</button></div>';
    productRoot.appendChild(card);
  });
  const timeRoot=$('timecards');
  for(let i=0;i<20;i++){const c=document.createElement('div');c.className='timecard';c.setAttribute('aria-label','Zeitkarte '+(i+1)+': frei');c.title='Zeitkarte '+(i+1)+': frei';timeRoot.appendChild(c)}
  function showMessage(msg){$('message').textContent=msg;$('message').classList.remove('hidden')}
  function hideMessage(){$('message').classList.add('hidden')}
  function render(){
    for(const p of PRODUCTS){$('q-'+p.id).textContent=counts[p.id];document.querySelector('[data-id="'+p.id+'"][data-action="minus"]').disabled=submitted||counts[p.id]===0;document.querySelector('[data-id="'+p.id+'"][data-action="plus"]').disabled=submitted||counts[p.id]>=p.max||used()+p.min>CAPACITY}
    $('usedTime').textContent=used()+' / '+CAPACITY;
    $('freeTime').textContent=(CAPACITY-used())+' min';
    $('totalDb').textContent=euro(total());$('units').textContent=pieces()+' Stück';
    $('progressFill').style.width=used()+'%';$('progress').setAttribute('aria-valuenow',used());$('progressLabel').textContent=(used()/5)+' von 20 Karten belegt.';
    const allocations=[];
    for(const p of PRODUCTS)for(let i=0;i<counts[p.id]*p.min/5;i++)allocations.push(p.id);
    [...timeRoot.children].forEach((c,i)=>{const id=allocations[i];c.className='timecard'+(id?' used '+id:'');const label='Zeitkarte '+(i+1)+': '+(id?(PRODUCTS.find(p=>p.id===id).name):'frei');c.setAttribute('aria-label',label);c.title=label});
    $('submitBtn').disabled=submitted;
    $('saveScore').disabled=!submitted||saved;
  }
  productRoot.addEventListener('click',event=>{
    const btn=event.target.closest('button[data-action]');if(!btn||submitted)return;
    const p=PRODUCTS.find(x=>x.id===btn.dataset.id);if(!p)return;
    if(btn.dataset.action==='plus'&&counts[p.id]<p.max&&used()+p.min<=CAPACITY)counts[p.id]++;
    if(btn.dataset.action==='minus'&&counts[p.id]>0)counts[p.id]--;
    hideMessage();render();
  });
  function solve(){
    let best={db:-1,time:0,counts:{}};
    for(let a=0;a<=PRODUCTS[0].max;a++)for(let b=0;b<=PRODUCTS[1].max;b++)for(let c=0;c<=PRODUCTS[2].max;c++){
      const quantity=[a,b,c];const time=quantity.reduce((s,n,i)=>s+n*PRODUCTS[i].min,0);
      if(time>CAPACITY)continue;
      const db=quantity.reduce((s,n,i)=>s+n*PRODUCTS[i].db,0);
      if(db>best.db||(db===best.db&&time>best.time))best={db,time,counts:{premium:a,city:b,basic:c}};
    }
    return best;
  }
  const BEST=solve();
  $('submitBtn').addEventListener('click',()=>{
    if(pieces()===0){showMessage('Wählt zuerst mindestens eine Leuchte aus.');return}
    submitted=true;saved=false;hideMessage();render();
    const diff=BEST.db-total();
    $('resultTitle').textContent=diff===0?'Perfekt geplant!':'Euer Produktionsprogramm ist ausgewertet';
    $('resultDb').textContent=euro(total())+' Gesamtdeckungsbeitrag';
    $('resultText').textContent='Vergleichen Sie die unterschiedlichen Produktionsprogramme der Teams später gemeinsam im Plenum.';
    $('summary').innerHTML='<div><small>Euer Ergebnis</small><div class="number">'+euro(total())+'</div></div><div><small>Bestmöglicher Gesamtdeckungsbeitrag</small><div class="number">'+euro(BEST.db)+'</div></div>';
    $('result').classList.remove('hidden');
    if (window.parent !== window) window.parent.postMessage({type:'fos-zeitkarten-submit',version:1,mode:'zeitkarten-original',counts:PRODUCTS.map(p=>counts[p.id]),score:total(),used:used(),best:BEST.db}, window.location.origin);
    $('result').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
  $('resetBtn').addEventListener('click',()=>{
    for(const p of PRODUCTS)counts[p.id]=0;
    submitted=false;saved=false;$('result').classList.add('hidden');hideMessage();render();
  });
  try{const raw=localStorage.getItem(KEY);if(raw){const old=JSON.parse(raw);if(Array.isArray(old))scores=old.filter(x=>x&&typeof x.name==='string'&&typeof x.db==='number'&&typeof x.time==='number').slice(0,100)}}catch(e){scores=[]}
  function store(){try{localStorage.setItem(KEY,JSON.stringify(scores))}catch(e){showMessage('Das Speichern ist in diesem Browser nicht verfügbar. Die aktuelle Wertung bleibt bis zum Neuladen sichtbar.')}}
  function renderScores(){
    const root=$('scoreBody');root.replaceChildren();
    const sorted=[...scores].sort((a,b)=>b.db-a.db||b.time-a.time);
    if(!sorted.length){const row=document.createElement('tr');const td=document.createElement('td');td.colSpan=4;td.textContent='Noch keine Ergebnisse gespeichert.';row.appendChild(td);root.appendChild(row);return}
    sorted.forEach((s,i)=>{const row=document.createElement('tr');
      const cols=[(i+1)+'.',s.name,euro(s.db),s.time+' min'];
      cols.forEach((v,j)=>{const td=document.createElement('td');td.textContent=v;if(j>=2)td.className='n';row.appendChild(td)});root.appendChild(row)})
  }
  $('saveScore').addEventListener('click',()=>{
    if(!submitted||saved)return;
    const name=$('groupName').value.trim()||('Gruppe '+(scores.length+1));
    scores.push({name,db:total(),time:used()});saved=true;store();renderScores();render();
    showMessage('Das Ergebnis von „'+name+'“ wurde zur Gruppenwertung hinzugefügt.');
  });
  $('clearScores').addEventListener('click',()=>{if(!scores.length)return;if(confirm('Alle gespeicherten Gruppenergebnisse auf diesem Gerät löschen?')){scores=[];store();renderScores()}});
  render();renderScores();
})();