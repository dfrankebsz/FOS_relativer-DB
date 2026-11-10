from pathlib import Path
p=Path(__file__).parents[1]/'site'
h=(p/'zeitkarten-spiel.html').read_text(); js=(p/'zeitkarten-game.js').read_text()
assert '20 Zeitkarten' in h and '100 Minuten' in h
for text in ('Premium','City','Basic'):
    assert text in h or text in js
assert "const CAPACITY=100" in js
assert "{id:'premium',name:'Premium',detail:'Design-Leuchte',emoji:'✨',min:20,db:56,max:3}" in js
assert "{id:'city',name:'City',detail:'Arbeitsplatz-Leuchte',emoji:'🏙️',min:10,db:38,max:5}" in js
assert "{id:'basic',name:'Basic',detail:'Kompakt-Leuchte',emoji:'💡',min:5,db:16,max:7}" in js
assert 'id="bestBody"' not in h and 'id="relativeBody"' not in h
assert 'Bestmöglicher Gesamtdeckungsbeitrag' in js
print('Zeitkarten-Spiel geprüft')
