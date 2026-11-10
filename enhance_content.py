"""Erweitert die FOS-Kursaufgaben um mehrzeilige, teilvorgegebene Rechentabellen.
Berechnete Ergebnisse in expected werden unabhängig geprüft; Zeilen-/Spaltenhinweise
zeigen bewusst nur Methode/Einsetzen, keine fertigen Musterlösungen vor Abgabe.
"""
from copy import deepcopy

def apply_course_enhancements(course):
    qmap = {q['id']:q for c in course['chapters'] for q in c['questions']}
    qmap.update({q['id']:q for q in course['bonus']+course['final']})
    models = course['products']

    def col(key,title,method=''):
        return {'id':key, 'title':title, 'hint':method}
    def row(label,given=None,expected=None,hint=None):
        return {'id':label.lower().replace(' ','-').replace('ü','ue').replace('ä','ae'),
                'label':label,'given':given or {},'expected':expected or {},
                'hint':hint or 'Wählen Sie die passende Formel und setzen Sie ausschließlich die Angaben aus dieser Zeile ein.'}
    def matrix(id,prompt,columns,rows,solution,hint=None,lead=None):
        q=qmap[id]
        q['type']='matrix'
        q['prompt']=prompt
        q['grid']={'columns':columns,'rows':rows}
        q['solution']=solution
        q['answer']={f'{r["id"]}:{key}':value for r in rows for key,value in r['expected'].items()}
        q['hint']=hint or 'Bestimmen Sie zuerst, welche Größen bereits vorgegeben sind und welche Größe jede Tabellenspalte berechnet.'
        if lead:q['tableLead']=lead
        return q

    C_DB = [col('preis','Netto-Preis €/St.'),col('kv','Var. Kosten €/St.'),col('db','Stück-DB €/St.','db = Nettoverkaufspreis − variable Stückkosten. Prüfen Sie den Unterschied der beiden Werte.')]
    matrix('b01','Füllen Sie für die vier Leuchtenmodelle die noch offenen Stückdeckungsbeiträge in der Tabelle aus.',C_DB,
           [row(p['name'],{'preis':p['price'],'kv':p['kv']},{'db':p['price']-p['kv']},f'{p["name"]}: Ziehen Sie die variablen Stückkosten vom Nettoverkaufspreis ab; die Fixkosten werden hier noch nicht berücksichtigt.') for p in models],
           '<b>Stück-DB = Preis − variable Stückkosten:</b> Basic: 95 − 55 = <b>40 €/St.</b>; City: 145 − 80 = <b>65 €/St.</b>; Studio: 190 − 110 = <b>80 €/St.</b>; Pro: 240 − 135 = <b>105 €/St.</b>.')
    matrix('b03','Ein Betrieb prüft drei Varianten seiner LED-Arbeitsplatzleuchte. Berechnen Sie für jede Variante den Stückdeckungsbeitrag.',C_DB,
           [row('Eco',{'preis':198,'kv':123},{'db':75}),row('Flex',{'preis':172,'kv':112},{'db':60}),row('Plus',{'preis':245,'kv':160},{'db':85})],
           'Eco: 198 € (Preis) − 123 € (variable Stückkosten) = <b>75 €/St.</b>; Flex: 172 − 112 = <b>60 €/St.</b>; Plus: 245 − 160 = <b>85 €/St.</b>.',
           'In jeder Zeile wird derselbe Rechenweg angewandt. Es werden keine Fixkosten verteilt.')

    c_time=[col('max','Max. Absatz (St.)'),col('min','Zeit (min/St.)'),col('bedarf','Zeitbedarf (min)','Zeitbedarf = maximal absetzbare Menge · Montagezeit je Stück.')]
    matrix('e01','Berechnen Sie die noch offenen Montagezeitbedarfe bei vollständiger Ausschöpfung der Absatzgrenzen.',c_time,
           [row('Basic',{'max':400,'min':8,'bedarf':3200}),row('City',{'max':300,'min':10},{'bedarf':3000}),row('Studio',{'max':200,'min':20},{'bedarf':4000}),row('Pro',{'max':150,'min':15},{'bedarf':2250})],
           'Basic: 400 · 8 = <b>3.200 min</b> (vorgegeben); City: 300 · 10 = <b>3.000 min</b>; Studio: 200 · 20 = <b>4.000 min</b>; Pro: 150 · 15 = <b>2.250 min</b>.',
           'Die Zeile Basic ist als Orientierung bereits ausgefüllt. Berechnen Sie die übrigen Zeilen mit derselben Formel.')
    matrix('e03','Berechnen Sie alle Zeitbedarfe und den Gesamtbedarf für die vier Modelle. Nutzen Sie die zusätzliche Summenzeile.',c_time,
           [row(p['name'],{'max':p['max'],'min':p['time']},{'bedarf':p['max']*p['time']}) for p in models]+[row('SUMME',{}, {'bedarf':12450},'Addieren Sie nur die vier bereits ermittelten Minutenbedarfe und nicht die Stückzahlen.')],
           'Basic 400 · 8 = 3.200 min; City 300 · 10 = 3.000 min; Studio 200 · 20 = 4.000 min; Pro 150 · 15 = 2.250 min. <b>Summe:</b> 3.200 + 3.000 + 4.000 + 2.250 = <b>12.450 min</b>.',
           'Ermitteln Sie zuerst die vier Einzelbedarfe und danach die Summe. Vergleichen Sie bei der nächsten Frage Bedarf und Kapazität.')

    c_rel=[col('db','Stück-DB €/St.'),col('min','Zeit min/St.'),col('rel','Rel. DB €/min','Relativer DB = Stück-DB ÷ Zeit je Stück. Alle Zeiten müssen dieselbe Einheit haben.'),col('rang','Rang','Rang 1 erhält der höchste relative DB; anschließend absteigend ordnen.')]
    relmap={'Basic':(40,8,5,3),'City':(65,10,6.5,2),'Studio':(80,20,4,4),'Pro':(105,15,7,1)}
    matrix('r01','Tragen Sie für alle vier Leuchten den relativen Deckungsbeitrag sowie den Rang in der Montageplanung ein.',c_rel,
           [row(name,{'db':v[0],'min':v[1]}, {'rel':v[2],'rang':v[3]}) for name,v in relmap.items()],
           'Basic: 40 ÷ 8 = <b>5,00 €/min (Rang 3)</b>; City: 65 ÷ 10 = <b>6,50 €/min (Rang 2)</b>; Studio: 80 ÷ 20 = <b>4,00 €/min (Rang 4)</b>; Pro: 105 ÷ 15 = <b>7,00 €/min (Rang 1)</b>. Reihenfolge: Pro → City → Basic → Studio.',
           'Berechnen Sie zuerst alle €/min-Werte, erst danach vergeben Sie die Ränge.')
    matrix('r03','Prüfen Sie drei Leuchtenvarianten einer zweiten Fertigungslinie: Berechnen Sie die relativen Deckungsbeiträge und die Reihenfolge.',c_rel,
           [row('Urban',{'db':48,'min':8},{'rel':6,'rang':2}),row('Smart',{'db':72,'min':9},{'rel':8,'rang':1}),row('Mini',{'db':55,'min':11},{'rel':5,'rang':3})],
           'Urban: 48 € ÷ 8 min = <b>6 €/min (Rang 2)</b>; Smart: 72 € ÷ 9 min = <b>8 €/min (Rang 1)</b>; Mini: 55 € ÷ 11 min = <b>5 €/min (Rang 3)</b>.',
           'Ein höherer Stückdeckungsbeitrag führt nur dann zum höheren Rang, wenn er relativ zur benötigten Zeit ebenfalls höher ist.')
    matrix('r05','Ermitteln Sie aus Stückdeckungsbeitrag und Prüfzeit die relativen Deckungsbeiträge der LED-Platinen.',c_rel,
           [row('P1',{'db':78,'min':12},{'rel':6.5,'rang':2}),row('P2',{'db':60,'min':8},{'rel':7.5,'rang':1}),row('P3',{'db':105,'min':21},{'rel':5,'rang':3})],
           'P1: 78 ÷ 12 = <b>6,50 €/min (Rang 2)</b>; P2: 60 ÷ 8 = <b>7,50 €/min (Rang 1)</b>; P3: 105 ÷ 21 = <b>5 €/min (Rang 3)</b>.')

    # Alle Teilrechnungen in einer Tabelle, mit vorgerechneter erster Zeile
    c_rest=[col('rang','Rang'),col('model','Modell'),col('max','Max. Absatz St.'),col('min','min/St.'),col('menge','Planmenge St.','Nehmen Sie höchstens die Absatzgrenze und höchstens so viele Stück wie in die Restkapazität passen.'),col('used','Zeit genutzt (min)','Genutzte Zeit = Planmenge · Minuten je Stück.'),col('rest','Restzeit (min)','Restzeit = Rest aus vorheriger Zeile − genutzte Zeit.')]
    matrix('p03','Vervollständigen Sie die schrittweise Maschinenbelegung. Die erste Zeile (Pro) ist vorgerechnet. Startkapazität: 9.250 min.',c_rest,
           [row('Pro',{'rang':1,'model':'Pro','max':150,'min':15,'menge':150,'used':2250,'rest':7000}),
            row('City',{'rang':2,'model':'City','max':300,'min':10},{'menge':300,'used':3000,'rest':4000},'Die Restzeit nach Pro beträgt 7.000 min. Prüfen Sie, ob 300 City-Leuchten vollständig hineinpassen.'),
            row('Basic',{'rang':3,'model':'Basic','max':400,'min':8},{'menge':400,'used':3200,'rest':800}),
            row('Studio',{'rang':4,'model':'Studio','max':200,'min':20},{'menge':40,'used':800,'rest':0},'Prüfen Sie zuerst die noch freien Minuten, dann teilen Sie durch 20 min je Stück.')],
           'Pro: 150 · 15 = 2.250 min, Rest 7.000 min. City: 300 · 10 = 3.000 min, Rest <b>4.000 min</b>. Basic: 400 · 8 = 3.200 min, Rest <b>800 min</b>. Studio: 800 min ÷ 20 min/St. = <b>40 St.</b>; Zeit 40 · 20 = 800 min, Rest <b>0 min</b>.',
           'Arbeiten Sie in Rangfolge von oben nach unten. Die Restzeit wird nach jeder Produktgruppe neu berechnet.')
    c_program=[col('preis','Preis €/St.'),col('kv','Var. €/St.'),col('db','db €/St.','Stück-DB = Nettoverkaufspreis − variable Kosten je Stück.'),col('max','Max. Absatz'),col('min','min/St.'),col('rel','Rel. DB €/min','Stück-DB ÷ min/St.'),col('rang','Rang','Absteigend nach €/min ordnen.'),col('menge','Produktion St.','Verteilen Sie die Kapazität in Rangfolge, höchstens bis zur Absatzgrenze.'),col('used','Genutzte min','Produktionsmenge · min/St.')]
    matrix('p04','Füllen Sie die komplette Produktionstabelle aus: zuerst Stück-DB und relativen DB, danach Rangfolge, Produktionsmengen und tatsächlich genutzte Montagezeit. Es stehen 9.250 min zur Verfügung.',c_program,
           [row(p['name'],{'preis':p['price'],'kv':p['kv'],'max':p['max'],'min':p['time']},
                {'db':p['price']-p['kv'],'rel':relmap[p['name']][2],'rang':relmap[p['name']][3],
                 'menge':{'Basic':400,'City':300,'Studio':40,'Pro':150}[p['name']],
                 'used':{'Basic':3200,'City':3000,'Studio':800,'Pro':2250}[p['name']]}) for p in models],
           'Rangfolge: Pro (7 €/min), City (6,50 €/min), Basic (5 €/min), Studio (4 €/min). <b>Plan:</b> Pro 150 · 15 = 2.250 min; City 300 · 10 = 3.000 min; Basic 400 · 8 = 3.200 min; Studio 40 · 20 = 800 min. <b>9.250 min vollständig genutzt.</b>',
           'Zuerst DB und Rang berechnen. Planmengen erst im zweiten Schritt zuweisen; es gilt ein einziger Maschinenengpass.')
    c_scenario=[col('db','Stück-DB €/St.'),col('min','Zeit min/St.'),col('max','Max. Absatz'),col('rel','Rel. DB €/min','Stück-DB ÷ Zeit je Stück.'),col('rang','Rang','Nach relativen DB absteigend.'),col('menge','Planmenge St.','Zuerst Rang 1 vollständig, dann Rang 2, dann verbleibende Kapazität.'),col('used','Genutzte min','Menge · min/St.')]
    # 2.520 statt 2.500 min: vermeidet den in der Vorversion vorhandenen ganzzahligen Restzeitfehler.
    matrix('p08','Neue Modellreihe: Für P, Q und R sind 2.520 min Maschinenzeit verfügbar. Ermitteln Sie relativen DB, Rang, optimale Produktionsmengen und genutzte Zeit in der Tabelle.',c_scenario,
           [row('P',{'db':90,'min':15,'max':80},{'rel':6,'rang':3,'menge':44,'used':660}),
            row('Q',{'db':64,'min':8,'max':120},{'rel':8,'rang':1,'menge':120,'used':960}),
            row('R',{'db':70,'min':10,'max':90},{'rel':7,'rang':2,'menge':90,'used':900})],
           'Q: 64 ÷ 8 = 8 €/min, 120 · 8 = 960 min; Rest 1.560 min. R: 70 ÷ 10 = 7 €/min, 90 · 10 = 900 min; Rest 660 min. P: 90 ÷ 15 = 6 €/min, 660 ÷ 15 = <b>44 St.</b>; Rest 0 min. <b>Gesamt-DB:</b> 120 · 64 + 90 · 70 + 44 · 90 = <b>17.940 €</b>.',
           'Vergleichen Sie zuerst die drei DB je Minute. Die Absatzgrenzen legen die maximale mögliche Menge je Modell fest.')

    c_result=[col('menge','Planmenge (St.)'),col('db','Stück-DB (€)'),col('total','Gesamt-DB (€)','Gesamt-DB je Modell = optimale Produktionsmenge · Stück-DB.')]
    matrix('g01','Ermitteln Sie die Gesamtdeckungsbeiträge der vier Modelle für das optimale Produktionsprogramm.',c_result,
           [row('Basic',{'menge':400,'db':40},{'total':16000}),row('City',{'menge':300,'db':65},{'total':19500}),row('Studio',{'menge':40,'db':80},{'total':3200}),row('Pro',{'menge':150,'db':105},{'total':15750})],
           'Basic: 400 · 40 = <b>16.000 €</b>; City: 300 · 65 = <b>19.500 €</b>; Studio: 40 · 80 = <b>3.200 €</b>; Pro: 150 · 105 = <b>15.750 €</b>.',
           'Nur die tatsächlich geplante Produktionsmenge verwenden, nicht die maximale Absatzmenge.')
    matrix('g03','Berechnen Sie für jedes Modell den Gesamt-DB und ergänzen Sie danach die Summe in der letzten Tabellenzeile.',c_result,
           [row('Basic',{'menge':400,'db':40},{'total':16000}),row('City',{'menge':300,'db':65},{'total':19500}),row('Studio',{'menge':40,'db':80},{'total':3200}),row('Pro',{'menge':150,'db':105},{'total':15750}),row('SUMME',{}, {'total':54450},'Addieren Sie die vier Gesamt-DB-Werte; Stückdeckungsbeiträge werden nicht einfach addiert.')],
           'Basic: 400 · 40 = 16.000 €; City: 300 · 65 = 19.500 €; Studio: 40 · 80 = 3.200 €; Pro: 150 · 105 = 15.750 €. <b>Summe = 54.450 €</b>.',
           'Berechnen Sie zunächst die Deckungsbeiträge je Modell; addieren Sie danach die vier Produktbeiträge.')
    matrix('g05','Vervollständigen Sie die teilweise ausgefüllte Ergebnistabelle der LichtForm GmbH. Prüfen Sie die Werte je Modell und den gesamten DB.',c_result,
           [row('Basic',{'menge':400,'db':40,'total':16000}),row('City',{'menge':300,'db':65},{'total':19500}),row('Studio',{'menge':40,'db':80},{'total':3200}),row('Pro',{'menge':150,'db':105},{'total':15750}),row('SUMME',{}, {'total':54450})],
           'Basic: 400 · 40 = 16.000 € (vorgegeben); City: 300 · 65 = <b>19.500 €</b>; Studio: 40 · 80 = <b>3.200 €</b>; Pro: 150 · 105 = <b>15.750 €</b>; <b>Summe: 54.450 €</b>.',
           'Die Basic-Zeile ist ein Muster. Übertragen Sie das Verfahren auf die anderen drei Leuchten.')

    c_compare=[col('gesamt','Gesamt-DB (€)'),col('anzahl','Menge (St.)'),col('min','Zeit (min/St.)'),col('db','Stück-DB €/St.','Stück-DB = Gesamtdeckungsbeitrag ÷ produzierte Menge.'),col('rel','Rel. DB €/min','Relativer DB = Stück-DB ÷ Zeit je Stück.')]
    matrix('d05','Der Controllingbericht enthält nur Gesamtdeckungsbeiträge. Ermitteln Sie aus diesen Werten zunächst den Stück-DB und danach den relativen DB.',c_compare,
           [row('Helm X',{'gesamt':26400,'anzahl':220,'min':8},{'db':120,'rel':15}),row('Helm Y',{'gesamt':18700,'anzahl':170,'min':10},{'db':110,'rel':11}),row('Helm Z',{'gesamt':9900,'anzahl':45,'min':20},{'db':220,'rel':11})],
           'Helm X: 26.400 € (Gesamt-DB) ÷ 220 Stück = <b>120 €/St.</b>; 120 ÷ 8 = <b>15 €/min</b>. Helm Y: 18.700 ÷ 170 = <b>110 €/St.</b>; 110 ÷ 10 = <b>11 €/min</b>. Helm Z: 9.900 ÷ 45 = <b>220 €/St.</b>; 220 ÷ 20 = <b>11 €/min</b>.',
           'Die erste Größe entsteht aus Gesamtdeckungsbeitrag geteilt durch Menge. Danach berechnen Sie den DB je knapper Minute.')
    matrix('d06','Ein weiterer Fertigungsbereich meldet andere Gesamtdeckungsbeiträge. Vergleichen Sie die Produktivität der drei Modelle in €/Montageminute.',c_compare,
           [row('Helm A',{'gesamt':12000,'anzahl':100,'min':12},{'db':120,'rel':10}),row('Helm B',{'gesamt':22000,'anzahl':200,'min':10},{'db':110,'rel':11}),row('Helm C',{'gesamt':27000,'anzahl':150,'min':15},{'db':180,'rel':12})],
           'Helm A: 12.000 ÷ 100 = 120 €/St.; 120 ÷ 12 = <b>10 €/min</b>. Helm B: 22.000 ÷ 200 = 110 €/St.; 110 ÷ 10 = <b>11 €/min</b>. Helm C: 27.000 ÷ 150 = 180 €/St.; 180 ÷ 15 = <b>12 €/min</b>.',
           'Der größte Gesamtdeckungsbeitrag allein führt nicht zwangsläufig zum höchsten DB je Minute.')

    matrix('x05','Bonus: Eine Zubehörfertigung hat 594 min Kapazität. Planen Sie die Produkte A, B und C und ergänzen Sie die Tabelle einschließlich Rang, Menge und Zeit.',c_scenario,
           [row('A',{'db':32,'min':4,'max':60},{'rel':8,'rang':1,'menge':60,'used':240}),row('B',{'db':45,'min':9,'max':50},{'rel':5,'rang':3,'menge':16,'used':144}),row('C',{'db':24,'min':3,'max':70},{'rel':8,'rang':1,'menge':70,'used':210})],
           'A und C: 32 ÷ 4 = 24 ÷ 3 = <b>8 €/min</b>, gemeinsam 60 · 4 + 70 · 3 = 450 min. Rest 594 − 450 = 144 min. B: 45 ÷ 9 = <b>5 €/min</b>, 144 ÷ 9 = <b>16 Stück</b>. Genutzte Zeit = <b>594 min</b>. Gleichrangige Modelle A und C können in beliebiger Reihenfolge berücksichtigt werden.',
           'A und C haben denselben DB je Minute. Beide können zuerst bis zu ihrer jeweiligen Absatzgrenze eingeplant werden.')
    matrix('t08','Abschlusstest: Drei Produkte konkurrieren um 1.200 min Prüfzeit. Ermitteln Sie die relative Rangfolge, Produktionsmengen und genutzten Minuten.',c_scenario,
           [row('A',{'db':48,'min':8,'max':100},{'rel':6,'rang':2,'menge':100,'used':800}),row('B',{'db':50,'min':5,'max':80},{'rel':10,'rang':1,'menge':80,'used':400}),row('C',{'db':45,'min':9,'max':80},{'rel':5,'rang':3,'menge':0,'used':0})],
           'B: 50 ÷ 5 = 10 €/min; 80 · 5 = <b>400 min</b>. A: 48 ÷ 8 = 6 €/min; 100 · 8 = <b>800 min</b>. C: 45 ÷ 9 = 5 €/min, aber <b>0 Stück</b>, da keine Kapazität bleibt. Summe: <b>1.200 min</b>, Gesamt-DB: 80 · 50 + 100 · 48 = <b>8.800 €</b>.',
           'Tragen Sie zuerst die relativen Deckungsbeiträge ein; verteilen Sie danach die 1.200 Minuten ab Rang 1.')

    # Kein sofortiger Spoiler in den eingangs gezeigten Beispielen: andere Zahlen als in 1. Übung.
    course['chapters'][0]['example'] = '<b>Beispiel einer Werkstattleuchte:</b> 89,00 € (Nettoverkaufspreis) − 51,00 € (variable Stückkosten) = <b>38,00 €/Stück</b>. Berechnen Sie anschließend die anderen Modelle in der Übungsstation.'
    course['chapters'][1]['example'] = '<b>Beispiel:</b> 140 Geräte (Absatzgrenze) · 6 min/Stück (Montagezeit) = <b>840 Minuten</b> Bedarf. Erst die Summe aller Modelle zeigt, ob die verfügbare Kapazität ausreicht.'
    course['chapters'][2]['example'] = '<b>Beispiel:</b> 60 € (Stück-DB) ÷ 12 min/Stück (Montagezeit) = <b>5,00 €/min</b>. Der höhere relative DB erhält bei einem Engpass Vorrang.'
    course['gameRules'] = {'visualCards':20,'title':'Zeitkarten-Challenge','teamInstruction':'Bearbeiten Sie die Aufgabe zu zweit: Person A plant, Person B prüft. Tauschen Sie danach die Rollen und geben Sie gemeinsam ab.'}
    return course
