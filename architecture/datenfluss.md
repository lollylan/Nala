# Nala Tracker – Datenfluss-Architektur (SOP)

## Übersicht
Single-Page PWA mit Echtzeit-Synchronisation über Firebase Firestore.

## Datenfluss
```
[Florians Handy] ──┐
                    ├──► Firebase Firestore ──► onSnapshot() ──► UI-Update
[Evas Handy] ──────┘
```

## Firestore-Struktur
- **Collection:** `days`
- **Document-ID:** `YYYY-MM-DD` (ein Dokument pro Tag)
- **Felder:** siehe gemini.md Daten-Schema

## Operationen

### Tablette/Fütterung togglen
1. User tippt auf Karte
2. `setDoc(merge: true)` → setzt `given/done: true`, `time: HH:MM`, `by: Name`
3. Erneutes Tippen → setzt auf `given/done: false`, `time: null`, `by: null`
4. onSnapshot-Listener aktualisiert UI auf allen Geräten

### Haufen hinzufügen
1. User tippt "+" → Modal öffnet sich
2. Konsistenz wählen → neuer Eintrag wird zum `poops`-Array hinzugefügt
3. `setDoc(merge: true)` mit komplettem `poops`-Array
4. Uhrzeit wird automatisch gesetzt

### Haufen löschen
1. User wischt/tippt Löschen auf einem Haufen-Eintrag
2. Eintrag wird aus `poops`-Array entfernt
3. `setDoc(merge: true)` mit aktualisiertem Array

### Monatsübersicht laden
1. `getDocs()` mit Query: `date >= YYYY-MM-01` AND `date <= YYYY-MM-31`
2. Kalender-Grid rendern mit Status-Icons pro Tag

### Statistik berechnen
1. Gleiche Query wie Monatsübersicht
2. Client-seitige Aggregation (Durchschnitte, Verteilungen)

## Offline-Verhalten
- Service Worker cached App-Shell (HTML/CSS/JS)
- Firestore-Operationen funktionieren nur online
- App zeigt zuletzt geladene Daten an

## Edge Cases
- Dokument existiert noch nicht → `setDoc` mit merge erstellt es automatisch
- Beide User togglen gleichzeitig → letzter Write gewinnt (akzeptabel für 2 User)
- Datum-Wechsel um Mitternacht → User navigiert manuell
