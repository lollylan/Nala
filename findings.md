# Nala – Erkenntnisse & Recherche

## Discovery-Antworten (2026-03-16)
- **North Star:** App zum Tracken von Nalas täglicher Pflege (Tablette, Futter, Haufen)
- **Nutzer:** Florian & Eva
- **Tablette:** 1x täglich, immer die gleiche
- **Haufen:** Einzeln trackbar, mit Anzahl pro Tag und Konsistenz
- **Zugang:** Kein Login, nur Link kennen reicht
- **Hosting:** GitHub Pages (kostenlos, statisch)

## Backend-Recherche
- **Firebase Firestore (Spark-Plan):** Beste Option
  - 1 GB Speicher, 50K Reads/Tag, 20K Writes/Tag
  - Echtzeit-Sync nativ eingebaut
  - Kein Server nötig – funktioniert direkt mit statischem Hosting
  - Für 2 Nutzer mit ~100-200 Operationen/Tag mehr als ausreichend
- **Alternativen verworfen:**
  - Supabase: Komplexer, weniger Speicher (500MB)
  - MongoDB Atlas: Overkill
  - AWS Amplify: Zu komplex

## Technische Entscheidungen
- Vanilla JS statt Framework → kein Build-System nötig, direkt auf GitHub Pages
- PWA mit Service Worker → funktioniert wie native App auf dem Handy
- Firestore Document-ID = Datum (YYYY-MM-DD) → maximal 1 Dokument pro Tag
