# Produktionsmission – Relativer Deckungsbeitrag (FOS 12)

Interaktiver deutschsprachiger Lernkurs mit Team-Einstiegsspiel, Erklärungen, Übungen, Bonusaufgaben, Abschlusstest, XP-Shop, Avatar-Galerie, Klassenkonten und Lehrkraftbereich.

## 1. Aufbau

- **Kapitel 0: Einstiegsspiel zu zweit.** Die Leipziger LichtForm GmbH aus dem einführenden Fall: vier Leuchtenmodelle, Originalpreise, Originalkosten, Originalabsatzgrenzen, Originalmontagezeiten und **9.250 Montageminuten**. Die 20 Zeitkarten teilen exakt die verfügbare Zeit auf (je 462,5 Minuten). Für die Produktion können sie anteilig verbraucht werden; die Berechnungen verwenden minutengenaue Werte.
- **Sechs Lernkapitel** zum Stückdeckungsbeitrag, Engpass, relativem DB, Produktionsprogramm, Betriebsergebnis und betriebswirtschaftlicher Beurteilung.
- **48 reguläre Übungsaufgaben** mit je zwei AFB-I-, vier AFB-II- und zwei AFB-III-Aufgaben pro Kapitel; **8 Bonusaufgaben** und **10 Abschlussaufgaben**.
- Eingaben: Zahlen, komplexe Tabellen, Einfach- und Mehrfachauswahl, Richtig/Falsch, Drag & Drop plus barriereärmere Pfeiltasten, Zuordnen, Freitext mit Selbstkontrolle.
- XP für abgeschlossene Übungen, Freischaltung von Avataren/Haustieren/Outfits, Galerie, Fortschrittsanzeige, Kompetenz-Checkliste und Glossar.
- Druckfunktion für ein zusammenhängendes Dokument der **bisher bearbeiteten Aufgaben samt eigenen Antworten**. Im Browser **„Als PDF speichern“** auswählen.

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

Die konkreten Originalwerte des Grundfalls:

| Modell | Netto-Preis | Variable Kosten | Max. Absatz | Zeit/St. | Stück-DB | Relativer DB |
|---|---:|---:|---:|---:|---:|---:|
| Basic | 95 € | 55 € | 400 | 8 min | 40 € | 5,00 €/min |
| City | 145 € | 80 € | 300 | 10 min | 65 € | 6,50 €/min |
| Studio | 190 € | 110 € | 200 | 20 min | 80 € | 4,00 €/min |
| Pro | 240 € | 135 € | 150 | 15 min | 105 € | 7,00 €/min |

Optimale Reihenfolge **Pro → City → Basic → Studio**, optimale Produktionsmengen **150 / 300 / 400 / 40**. Genutzte Zeit **9.250 min**; Gesamt-DB **54.450 €**; bei 38.000 € Fixkosten **16.450 € Betriebsergebnis**. Das Spiel lässt zunächst eigene Pläne zu und zeigt diese Ergebnisse erst nach Abgabe.

Der Lernkurs konzentriert sich auf das Verfahren mit **einem Engpass, konstanten Stückdeckungsbeiträgen, bekannten Absatzgrenzen und ganzen Produkteinheiten**. Komplexere Optimierung mit mehreren gleichzeitigen Engpässen ist nicht Gegenstand dieses Kurses. Die Standard-Rangfolgeregel kann bei diskreten Stückzahlen Restkapazitäten erzeugen; daher werden die ganzzahligen Mengen und die Restzeit kontrolliert.

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
- `site/assets/`: Lernübersicht und Favicon.
- `netlify/functions/api.mjs`: alle serverseitigen Funktionen für Registrierung, Authentifizierung, Speicherung und Lehrerbereich.
- `netlify.toml`: Netlify-Projektkonfiguration.
- `make_content.py`: lesbarer Quellgenerator für Fragen, Beispiele, Lösungen und Glossar. Nach Änderungen mit `python make_content.py` neu erzeugen.
- `tests/`: automatisierte Prüffälle.

Stand: 10. November 2026 · generiertes Unterrichtsprojekt, vor Veröffentlichung redaktionell prüfen.
