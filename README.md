# Produktionsmission – Relativer Deckungsbeitrag (FOS 12)

Interaktiver deutschsprachiger Lernkurs mit Team-Einstiegsspiel, Erklärungen, Übungen, Bonusaufgaben, Abschlusstest, XP-Shop, Avatar-Galerie, Klassenkonten und Lehrkraftbereich.

## 1. Aufbau

- **Kapitel 0: Einstiegsspiel zu zweit.** Die aus dem Unterricht bekannte, originale **Zeitkarten-Challenge** mit **20 Karten à 5 Minuten = 100 Minuten** und den drei Modellen **Premium, City, Basic**. Es werden ganze Produkte über Plus-/Minus-Knöpfe gewählt. **Nach der Abgabe erscheint lediglich das eigene Ergebnis und der bestmögliche Gesamtdeckungsbeitrag**, nicht das optimale Produktionsprogramm oder die Rangfolge. Die vier Modelle der Leipziger LichtForm GmbH mit **9.250 Montageminuten** bleiben in den darauf folgenden Fachkapiteln erhalten.
- **Sechs Lernkapitel** zum Stückdeckungsbeitrag, Engpass, relativem DB, Produktionsprogramm, Betriebsergebnis und betriebswirtschaftlicher Beurteilung.
- **48 reguläre Übungsaufgaben** mit je zwei AFB-I-, vier AFB-II- und zwei AFB-III-Aufgaben pro Kapitel; **8 Bonusaufgaben** und **10 Abschlussaufgaben**.
- **17 mehrzeilige Rechentabellen** mit gegebenen und auszufüllenden Feldern, davon **10 umfangreiche Tabellen mit einzeln aufklappbaren Zeilen- und Spaltenhilfen**, dazu einfache Zahleneingaben, Einfach- und Mehrfachauswahl, Richtig/Falsch, Drag & Drop plus barriereärmere Pfeiltasten, Zuordnen, Freitext mit Selbstkontrolle.
- XP für abgeschlossene Übungen, Freischaltung von Avataren/Haustieren/Outfits, Galerie, Fortschrittsanzeige, Kompetenz-Checkliste und Glossar.
- Druckfunktion für ein zusammenhängendes Dokument der **bisher bearbeiteten Aufgaben samt eigenen Antworten**. Im Browser **„Als PDF speichern“** auswählen.

### Änderungen in Version 3

- Das Einstiegsspiel wurde **optisch und spielmechanisch aus der vom Nutzer bereitgestellten „Zeitkarten_Challenge(1).html“ übernommen**. Drei Produkte, 100 Minuten, 20 echte Zeitkarten, Plus-/Minus-Bedienung und lokale Gruppenwertung bleiben erhalten.
- **Nur die Ergebnisausgabe wurde gekürzt:** Nach der Abgabe werden der eigene Gesamtdeckungsbeitrag und als Vergleich **ausschließlich der maximal erreichbare Gesamtdeckungsbeitrag** gezeigt. Es werden keine optimalen Produktionsmengen, keine Rangfolge und keine Tabelle relativer Deckungsbeiträge eingeblendet. Die Rechenstrategie ist Gegenstand des anschließenden Plenums.
- Das Spiel ist innerhalb des bestehenden Kurses eingebettet. Eine abgeschlossene Runde wird zur Fortschrittsspeicherung und XP-Vergabe an den Kurs gemeldet; die Gruppenwertung des Spiels bleibt wie im Original **nur auf dem jeweiligen Gerät**.
- Alle sechs Lernkapitel, 66 Aufgaben, 17 mehrzeiligen Rechentabellen, 10 Zeilen-/Spaltenhilfen, Abschlussprüfung, Avatar-Shop, Lehrerbereich, Netlify Functions und Blobs bleiben unverändert.

## 2. Installation über GitHub und Netlify

1. Dieses ZIP **entpacken**. Bei GitHub ein neues Repository anlegen.
2. **Den entpackten Inhalt** (also `site/`, `netlify/functions/`, `netlify.toml`, `package.json`, `README.md` usw.) ins Wurzelverzeichnis des GitHub-Repositories laden. **Die ZIP-Datei selbst** nicht unverändert als einzelne Datei ins Repository hochladen.
3. Auf Netlify **Add new project → Import an existing project → GitHub** wählen und das Repository verbinden.
4. Die in `netlify.toml` festgelegten Werte werden automatisch übernommen:
   - Build: `npm run build`
   - Publish directory: `site`
   - Functions directory: `netlify/functions`
5. Unter **Netlify → Project configuration → Environment variables** die Variable **`TEACHER_CODE`** erstellen. Als Wert unbedingt einen langen, zufälligen und geheimen Code wählen (mindestens **16 Zeichen**, möglichst **32+ zufällige Zeichen**). **Scope: Functions** bzw. **All scopes**. **Nie im GitHub-Repository oder in der HTML-Datei hinterlegen.**
6. Nach dem Setzen dieser Variable **(erneut) deployen** (Trigger deploy / Deploy site). Die API ist unter `/api/health` (POST) und die Website unter Ihrer Netlify-Domain erreichbar.
7. Im Kurs **Anmeldung & Konto → Konto erstellen → Lehrkraft** wählen. **Klasse, Nickname, Passwort und den `TEACHER_CODE`** eingeben. So wird ein Lehrkraftkonto für genau diese Klasse angelegt.
8. Schülerinnen und Schüler wählen bei **Konto erstellen → Schüler/in** exakt dieselbe Klassenkennung, einen beliebigen Nicknamen und ein persönliches Passwort. Der Lehrkraftbereich listet nur Konten derselben Klasse.

**Kein Supabase, keine SQL-Installation und keine AUTH-Umgebungsvariable notwendig.** `@netlify/blobs` wird beim Netlify-Build über `npm install` verfügbar und liest den Netlify-Kontext automatisch. `TEACHER_CODE` wird ausschließlich serverseitig verarbeitet; daraus wird auch der Sitzungsschlüssel abgeleitet.

## 3. Gastmodus und Anmeldung

- **Gastmodus:** kein Login erforderlich, Fortschritt nur in der lokalen Speicherung dieses Browsers.
- **Angemeldet:** Fortschritt liegt in **Netlify Blobs** (im Code mit Speicherregion `eu-central-1`/Frankfurt konfiguriert), kann von mehreren Geräten gelesen und weitergeführt werden. Bei der erstmaligen Registrierung eines Schülerkontos wird ein bereits vorhandener Gastfortschritt übernommen.
- Achtung: Gleichzeitige Bearbeitung desselben Kontos auf **zwei Geräten bzw. Tabs** ist nicht zur synchronen Zusammenarbeit vorgesehen. Die zuletzt gespeicherte Version kann ältere Stände überschreiben. Das **Einstiegsspiel** ist als Zweierarbeit an **einem gemeinsamen Gerät** angelegt.
- Abmelden beendet die Sitzung in diesem Browser. Eine Sitzung ist normalerweise sieben Tage gültig. Wenn Sie `TEACHER_CODE` ändern, werden bestehende Sitzungen ungültig.
- Für die Nutzung auf unterschiedlichen Geräten müssen Schüler/innen **Klasse, Nickname und Passwort** kennen. Es werden keine E-Mail-Adressen benötigt.

## 4. Lehrkraft-Funktionen

Im Lehrerbereich derselben Klasse:

- Alle angemeldeten Schülerkonten, XP und Aufgabenzahlen ansehen.
- Einzelne Antworten ansehen (Freitextbewertungen stammen von den Schüler/innen selbst).
- **Einmalpasswort** für Schülerkonten erzeugen. Dieses wird **einmalig** angezeigt und muss persönlich weitergegeben werden. Beim nächsten Anmelden muss die betreffende Person das Passwort ändern.
- Schülerkonto **mit Fortschritt löschen**.
- **Alle Fortschritte der eigenen Klasse löschen**, wobei die Schülerkonten bestehen bleiben. Eine Bestätigung mit `LOESCHEN <Klasse>` ist erforderlich. Bereits geöffnete Schüler-Sitzungen müssen danach neu anmelden, bevor sie wieder speichern können.

Lehrkräfte sollten eine Klassenkennung verwenden, die alle zugeordneten Schüler/innen identisch eingeben. Eine andere Klassenkennung ergibt eine getrennte Klasse.

## 5. Fachlicher Hinweis zum Einstiegsspiel

Das Einstiegsspiel verwendet **exakt den vereinfachten Originalfall des hochgeladenen Spiels** (nicht die vier Skriptmodelle):

| Modell | Zeit/Stück | Stück-DB | Max. Absatz |
|---|---:|---:|---:|
| Premium | 20 min | 56 € | 3 |
| City | 10 min | 38 € | 5 |
| Basic | 5 min | 16 € | 7 |

Die 20 Karten entsprechen **100 Minuten**. Der höchste mögliche Gesamtdeckungsbeitrag ist im Spiel hinterlegt; die optimalen Stückzahlen werden **absichtlich nicht offengelegt**, damit die Teams ihre Programme im Plenum vergleichen können. Die Fachkapitel danach arbeiten mit dem eigenständigen, ausführlicheren Fall der Leipziger LichtForm GmbH (Basic/City/Studio/Pro und 9.250 min). Die beiden Fälle sind nicht zu verwechseln.

## 6. PDF-Ausgabe

Im Kurs **„PDF mit Ihren Antworten“** oder **„Fortschritt als PDF“** auswählen. Die App öffnet den **Druckdialog** mit einem gesondert formatierten Dokument, das die bereits beantworteten Aufgaben und Originalantworten aufeinanderfolgend enthält. Anschließend in Chrome, Edge oder Safari die Druckausgabe **„Als PDF sichern / Save as PDF“** verwenden. Auf Apple-Geräten stehen entsprechende Druck- und Teilen-Funktionen zur Verfügung. Es erfolgt **keine serverseitige PDF-Speicherung**.

## 7. Datenschutz und Grenzen

Das ist ein **unterrichtsbezogenes Lernsystem**, keine zertifizierte Schulverwaltungs- oder Prüfungssoftware. Bitte vor dem Einsatz mit echten Schulklassen die einschlägigen schulischen Datenschutz- und IT-Vorgaben prüfen, insbesondere geeignete AV-Verträge, Speicherregion, Aufbewahrungsfristen, Zustimmung bzw. Rechtsgrundlage und Rechte der Nutzerinnen und Nutzer.

- Nur **Pseudonyme** verwenden; keine Klarnamen als Nickname.
- Authentifizierung verwendet gesalzene PBKDF2-SHA256-Prüfsummen der Passwörter. Authentifizierte, signierte Sitzungstoken werden für API-Aufrufe verwendet. Passwörter liegen nicht im Klartext in Blobs.
- Die Webseite verwendet keinen externen Frontend-CDN, keine Tracking-Bibliothek und keine analytischen Drittdienste.
- **XP sind Spielpunkte, keine Prüfungsergebnisse.** Die Antwortprüfung läuft auf dem Client; sie ist ausdrücklich nicht manipulationssicher. Freitext wird von den Lernenden selbst kontrolliert. Für eine benotete Klausur ist die App nicht geeignet.
- Netlify Blobs ist **Objektspeicher**, kein vollwertiges relationales Datenbanksystem. Bei sehr großen Klassenverbünden, intensivem parallelem Schreiben und anspruchsvollen Datenschutzanforderungen sind zusätzliche Skalierungs- und Sicherheitsprüfungen erforderlich.
- Passwortrücksetzungen, Löschungen und Fortschritts-Reset sind serverseitig ausschließlich für Lehrkräfte der betreffenden Klasse erlaubt.
- Die URL der Netlify-Seite muss HTTPS verwenden (Netlify stellt dies normalerweise bereit).

## 8. Technische Prüfungen

Die Projektdateien enthalten Tests (`tests/`), die mit Node.js ausgeführt werden können:

```bash
npm test
```

Die Tests prüfen Rechenlogik und sämtliche automatischen Musterantworten sowie API-Abläufe mit einem simulierten Blobs-Speicher: Registrierung, Login, getrennte Klassen, Lehrerrechte, Passwortreset und Klassenreset. **Das ist kein vollständiger End-to-End-Test in einer echten Netlify-Umgebung.** Nach der ersten Bereitstellung sollten Registrierung, Speichern auf einem zweiten Gerät, Lehrerübersicht, Reset und PDF-Druck anhand von Testkonten geprüft werden.

## 9. Dateien

- `site/index.html`, `site/styles.css`, `site/app.js`, `site/content.js`: Website und Übungsinhalte.
- `site/zeitkarten-spiel.html`, `site/zeitkarten-game.css`, `site/zeitkarten-game.js`: Original-Einstiegsspiel, mit reduzierter Ergebnisausgabe und Kursfortschritt-Meldung.
- `site/assets/`: Lernübersicht und Favicon.
- `netlify/functions/api.mjs`: alle serverseitigen Funktionen für Registrierung, Authentifizierung, Speicherung und Lehrerbereich.
- `netlify.toml`: Netlify-Projektkonfiguration.
- `make_content.py` + `enhance_content.py`: lesbare Inhaltsgeneratoren für Fragen, Tabellen, Hinweise, Lösungen und Glossar. Nach inhaltlichen Änderungen mit `python make_content.py` neu erzeugen; die Erweiterungen werden dabei automatisch mitgeladen.
- `tests/`: automatisierte Prüffälle.

Stand: 10. November 2026 · Kursversion 3 · generiertes Unterrichtsprojekt. Die automatisierten Tests und ein lokaler Browser-Test mit simuliertem Speicher wurden durchgeführt. Der Live-Deploy und die reale Netlify-Blobs-Anbindung müssen nach der Veröffentlichung mit Testkonten geprüft werden.
