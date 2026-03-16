# Nala – Projekt-Verfassung (gemini.md)

> **Dieses Dokument ist Gesetz.** Alle Architektur-Entscheidungen, Schemas und Regeln werden hier festgehalten.

## Projektübersicht
Eine mobile-optimierte PWA zum Tracken der täglichen Pflege von Hund Nala.
- **Nutzer:** Florian & Eva
- **Hosting:** GitHub Pages (statisch)
- **Backend:** Firebase Firestore (kostenloser Spark-Plan)
- **Auth:** Kein Login – Zugang nur über URL

## Daten-Schemas

### Tageseintrag (Collection: `days`, Document-ID: `YYYY-MM-DD`)
```json
{
  "date": "2026-03-16",
  "tablet": {
    "given": true,
    "time": "08:30",
    "by": "Florian"
  },
  "feeding": {
    "morning": {
      "done": true,
      "time": "07:00",
      "by": "Eva"
    },
    "evening": {
      "done": false,
      "time": null,
      "by": null
    }
  },
  "poops": [
    {
      "id": "uuid-1",
      "time": "09:15",
      "consistency": "normal",
      "by": "Florian"
    },
    {
      "id": "uuid-2",
      "time": "14:30",
      "consistency": "weich",
      "by": "Eva"
    }
  ]
}
```

### Felder-Definitionen
| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `date` | string (YYYY-MM-DD) | Ja | Datum des Eintrags |
| `tablet.given` | boolean | Ja | Tablette gegeben? |
| `tablet.time` | string (HH:MM) | Nein | Uhrzeit der Gabe |
| `tablet.by` | string | Nein | "Florian" oder "Eva" |
| `feeding.morning.done` | boolean | Ja | Morgens gefüttert? |
| `feeding.morning.time` | string (HH:MM) | Nein | Uhrzeit |
| `feeding.morning.by` | string | Nein | "Florian" oder "Eva" |
| `feeding.evening.done` | boolean | Ja | Abends gefüttert? |
| `feeding.evening.time` | string (HH:MM) | Nein | Uhrzeit |
| `feeding.evening.by` | string | Nein | "Florian" oder "Eva" |
| `poops` | Array | Ja | Liste aller Haufen des Tages |
| `poops[].id` | string | Ja | Eindeutige ID |
| `poops[].time` | string (HH:MM) | Ja | Uhrzeit |
| `poops[].consistency` | string (enum) | Ja | Konsistenz |
| `poops[].by` | string | Ja | "Florian" oder "Eva" |

### Konsistenz-Enum
- `fest` – Fest/hart
- `normal` – Normal geformt
- `weich` – Weich aber geformt
- `breiig` – Breiig/ungeformt
- `flüssig` – Flüssig/Durchfall

## Verhaltensregeln
1. **Nur 2 Nutzer:** Florian & Eva – keine Registrierung, kein Login
2. **Kein Zugangsschutz:** Sicherheit durch Obscurity (nur wer den Link kennt)
3. **Eine Tablette pro Tag:** Immer die gleiche, Toggle reicht
4. **Haufen einzeln:** Jeder Haufen wird einzeln hinzugefügt mit Uhrzeit + Konsistenz
5. **Echtzeit-Sync:** Änderungen sofort auf beiden Geräten sichtbar
6. **Mobile-First:** Design primär für Smartphone-Nutzung optimiert
7. **PWA:** Installierbar auf dem Homescreen, offline-fähig (mit Sync bei Reconnect)

## Architektur-Invarianten
- **Statisches Frontend** → GitHub Pages, kein Server
- **Firebase Firestore** → Echtzeit-Listener, kein Polling
- **Kein Build-System** → Vanilla HTML/CSS/JS oder minimales Framework
- **Document-ID = Datum** → Ein Dokument pro Tag, einfache Abfragen
- **PWA mit Service Worker** → Offline-Fähigkeit, Homescreen-Installation

## Tech-Stack
- HTML5 / CSS3 / Vanilla JavaScript (kein Framework-Overhead)
- Firebase SDK (Firestore + optional Analytics)
- Service Worker für PWA/Offline
- GitHub Pages für Hosting

## Änderungsprotokoll
| Datum | Änderung | Grund |
|-------|----------|-------|
| 2026-03-16 | Initiale Erstellung | Protokoll 0 |
| 2026-03-16 | Schema & Regeln definiert | Discovery abgeschlossen |
