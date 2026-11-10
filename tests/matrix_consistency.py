import json,math,pathlib
D=json.loads((pathlib.Path(__file__).parents[1]/'site/content.js').read_text().split(' = ',1)[1].rstrip(';\n'))
qs=[q for c in D['chapters'] for q in c['questions']]+D['bonus']+D['final']
ms=[q for q in qs if q['type']=='matrix']
for q in ms:
    grid=q['grid'];rows=grid['rows'];ids={c['id'] for c in grid['columns']}
    assert len(set(r['id'] for r in rows))==len(rows)
    for r in rows:
        e=r['expected'];g=r['given'];val={**g,**e}
        assert not (set(g)&set(e)),(q['id'],r['label'],'given vs expected overlap')
        for k in e:
            assert k in ids,(q['id'],k)
            assert math.isfinite(e[k]),(q['id'],r['label'],k)
        def ck(key,num):
            if key in e:assert abs(e[key]-num)<1e-6,(q['id'],r['label'],key,e[key],num)
        if 'db' in val and 'preis' in val and 'kv' in val:ck('db',val['preis']-val['kv'])
        if 'rel' in val and 'db' in val and 'min' in val:ck('rel',val['db']/val['min'])
        if 'bedarf' in val and 'max' in val and 'min' in val:ck('bedarf',val['max']*val['min'])
        if 'used' in val and 'menge' in val and 'min' in val:ck('used',val['menge']*val['min'])
        if 'total' in val and 'menge' in val and 'db' in val:ck('total',val['menge']*val['db'])
        if 'gesamt' in val and 'anzahl' in val and 'db' in val:ck('db',val['gesamt']/val['anzahl'])
    if q['id'] in {'p04','p08','x05','t08'}:
        sums=sum(r['expected'].get('used',0) for r in rows)
        cap={'p04':9250,'p08':2520,'x05':594,'t08':1200}[q['id']]
        assert sums==cap,(q['id'],sums,cap)
print(f'{len(ms)} Rechentabellen, {sum(len(q["answer"]) for q in ms)} bewertete Tabellenzellen fachlich geprüft.')
