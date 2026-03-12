# PHASE 4 — COMPLETE isFieldSession INVENTORY

**Gegeneerd:** 2026-03-03
**Totaal checks:** 47
**Modules:** 4 bestanden

---

## QUICK REFERENCE

| Bestand | Checks | Locatie |
|---------|--------|---------|
| phase4-manager.js | 5 | Overzicht + kaart weergave |
| phase4-enrichment.js | 17 | Formulier + catches tabel |
| phase4-mapper.js | 8 | Kaart + markers |
| phase4-validation.js | 12 | Validatie + finalisatie |

---

## 1. PHASE4-MANAGER.JS (5 checks)

### Check 1.1 — renderSessionCard() Origin Badge Styling
- **Regel:** 226-230
- **Patroon:** Ternary operator
- **TRUE (Veld):** `background: #FFF3E0; color: #E65100;` (Oranje)
- **FALSE (Handmatig):** `background: #E3F2FD; color: #0D47A1;` (Blauw)
- **Doel:** Visuele onderscheiding in sessie kaarten

### Check 1.2 — renderSessionCard() Badge Label
- **Regel:** 230
- **Patroon:** Ternary operator
- **TRUE:** `'🎯 Veld'`
- **FALSE:** `'📝 Handmatig'`
- **Doel:** Label voor sessie type

### Check 1.3 — renderSessionCard() Session ID Selection
- **Regel:** 256
- **Patroon:** Ternary operator
- **Code:** `const sessionId = session.origin === 'veld' ? session.id : session.session_id;`
- **TRUE:** Verwendet `session.id` (field_sessions PK)
- **FALSE:** Verwendet `session.session_id` (sessions PK)
- **Doel:** Juiste ID selecteren voor beide tabel types

### Check 1.4 — deleteSessionWithConfirm() Table Selection
- **Regel:** 295-315
- **Patroon:** If/else statement
- **TRUE:** UPDATE `field_sessions` set `genegeerd = true`
- **FALSE:** UPDATE `sessions` set `genegeerd = true`
- **Doel:** Verwijderen uit juiste tabel

### Check 1.5 — openEnrichmentScreen() Data Loading
- **Regel:** 342-360
- **Patroon:** If/else statement
- **TRUE:** SELECT alle kolommen uit `field_sessions` tabel
- **FALSE:** SELECT alle kolommen uit `sessions` tabel
- **Doel:** Laden van volledige sessie data voor enrichment

---

## 2. PHASE4-ENRICHMENT.JS (17 checks)

### Check 2.1 — loadSessionForEnrichment() Table Loading
- **Regel:** 101-151
- **Patroon:** If/else statement
- **TRUE:**
  - SELECT uit `field_sessions`
  - SELECT uit `field_catches`
- **FALSE:**
  - SELECT uit `sessions`
  - SELECT uit `catches`
- **Doel:** Laden van juiste sessie en catches voor enrichment

### Check 2.2 — renderSessionForm() Form Field Generation
- **Regel:** 178
- **Patroon:** Variable declaration
- **TRUE:** `isFieldSession = true`
- **FALSE:** `isFieldSession = false`
- **Doel:** Flag voor field mapping in formulier

### Checks 2.3-2.7 — renderSessionForm() Field Mapping
- **Regel:** 183, 190, 205, 211, 231, 237, 245, 253, 261
- **Patroon:** Ternary operator (multiple)
- **Mapping:**

| Veld | TRUE (veld) | FALSE (handmatig) |
|------|------------|-------------------|
| Datum | `datum` | `session_start_date` |
| Locatie | `locatie` | `null` (readonly) |
| Starttijd | `start_tijd` | `session_start_datetime` |
| Eindtijd | `eind_tijd` | `session_end_datetime` |
| Watersoort | `watersoort` | `watersoort` |
| Stroomsnelheid | `stroomsnelheid` | `stroomsnelheid` |
| Watertemp | `watertemperatuur` | `watertemperatuur_measured` |
| Helderheid | `helderheid` | `helderheid` |
| Diepte | `diepte` | `diepte` (hidden) |
| Bodemhardheid | `bodemhardheid` | `bodemhardheid` |
| Notities | `notities` | `notities` |

- **Doel:** Correct veld mapping van twee database schema's naar één formulier

### Check 2.8 — saveSessionData() Session Update
- **Regel:** 379-418
- **Patroon:** If/else statement
- **TRUE:** UPDATE `field_sessions` tabel
- **FALSE:** UPDATE `sessions` tabel
- **Doel:** Opslaan van gewijzigde sessie data naar correct tabel

### Check 2.9 — renderCatchesTable() Catch Data Loading
- **Regel:** 495
- **Patroon:** Variable declaration
- **TRUE:** Data uit field_catches
- **FALSE:** Data uit catches
- **Doel:** Selectie van correct catch array

### Check 2.10 — renderCatchesTable() Catch Time Field
- **Regel:** 499
- **Patroon:** Ternary operator
- **TRUE:** `vangst_tijd` (field_catches)
- **FALSE:** `catch_datetime` (catches)
- **Doel:** Correct tijd veld voor weergave

### Check 2.11 — renderCatchesTable() Edit Button Parameter
- **Regel:** 530
- **Patroon:** Template literal met ternary
- **TRUE:** onclick parameter is `catch_.id`
- **FALSE:** onclick parameter is `catch_.catch_id`
- **Doel:** Juiste ID doorgeeft aan editCatchModal()

### Check 2.12 — deleteCatch() Catch Deletion
- **Regel:** 632-646
- **Patroon:** If/else statement
- **TRUE:** DELETE uit `field_catches`
- **FALSE:** DELETE uit `catches`
- **Doel:** Verwijderen van vangst uit correcte tabel

### Check 2.13 — editCatchModal() Catch Lookup
- **Regel:** 678-684
- **Patroon:** If/else with find()
- **TRUE:** `enrichmentCatches.find(c => c.id === catchIdAsNumber)`
- **FALSE:** `enrichmentCatches.find(c => c.catch_id === catchIdAsNumber)`
- **Doel:** Vinden van correcte vangst in memory array

### Check 2.14 — editCatchModal() Diepte Fallback
- **Regel:** 825
- **Patroon:** Ternary operator
- **TRUE:** `catchToEdit.diepte ?? enrichmentSession.diepte`
- **FALSE:** `catchToEdit.diepte` (geen fallback)
- **Doel:** Fallback naar sessie-diepte voor veld-sessies

### Check 2.15 — editCatchModal() Bodemhardheid Fallback
- **Regel:** 833
- **Patroon:** Ternary operator
- **TRUE:** `catchToEdit.bodemhardheid ?? enrichmentSession.bodemhardheid`
- **FALSE:** `catchToEdit.bodemhardheid` (geen fallback)
- **Doel:** Fallback naar sessie-bodemhardheid

### Check 2.16 — editCatchModal() Database Update (Groep 1)
- **Regel:** 978-1016
- **Patroon:** If/else statement
- **TRUE:**
  - UPDATE `field_catches`
  - Sla `vangst_tijd` op
  - Sla `bodemhardheid` op
- **FALSE:**
  - UPDATE `catches`
  - Sla `catch_datetime` op
  - Sla `bodemhardheid` op
- **Doel:** Opslaan van directe vangst data naar juiste tabel

### Check 2.17 — editCatchModal() Session ID Retrieval
- **Regel:** 1052
- **Patroon:** Ternary operator
- **TRUE:** `enrichmentSession.id`
- **FALSE:** `enrichmentSession.session_id`
- **Doel:** Juiste session ID voor backref

---

## 3. PHASE4-MAPPER.JS (8 checks)

### Check 3.1 — initEnrichmentMap() Session Type Flag
- **Regel:** 59
- **Patroon:** Variable declaration
- **TRUE/FALSE:** Determines all subsequent map logic
- **Doel:** Flag voor kaart initialisatie

### Check 3.2 — initEnrichmentMap() Map Center Coordinates
- **Regel:** 60-61
- **Patroon:** Ternary operators (2)
- **TRUE:**
  - `session.gps_lat` voor latitude
  - `session.gps_long` voor longitude
- **FALSE:**
  - `session.session_start_latitude`
  - `session.session_start_longitude`
- **Doel:** Juiste startpunt van kaart (GPS vs sessie start)

### Check 3.3 — markCurrentSessionCatches() Catch Type Flag
- **Regel:** 115
- **Patroon:** Variable declaration
- **Doel:** Flag voor catch marker rendering

### Check 3.4 — markCurrentSessionCatches() Marker Drag Handler
- **Regel:** 164-185
- **Patroon:** If/else statement (twee parts)
- **Part A — Catch ID Selection (Regel 164):**
  - TRUE: `catch_.id`
  - FALSE: `catch_.catch_id`
- **Part B — Database Update (Regel 167-184):**
  - TRUE: UPDATE `field_catches.gps_lat`, `field_catches.gps_long`
  - FALSE: UPDATE `catches.gps_lat`, `catches.gps_long`
- **Doel:** Opslaan van dragbare marker GPS naar correcte tabel

### Check 3.5 — markCurrentSessionCatches() In-Memory Update
- **Regel:** 191-193
- **Patroon:** Ternary with find()
- **TRUE:** `enrichmentCatches.find(c => c.id === catchId)`
- **FALSE:** `enrichmentCatches.find(c => c.catch_id === catchId)`
- **Doel:** Update in-memory catch array na marker drag

### Check 3.6 — onMapClick() Click Handler Flag
- **Regel:** 240
- **Patroon:** Variable declaration
- **Doel:** Bepaalt insert logic voor nieuwe vangst

### Check 3.7 — onMapClick() Catch Insertion
- **Regel:** 270-313
- **Patroon:** If/else statement
- **TRUE:**
  - INSERT in `field_catches`
  - Kolommen: `field_session_id`, `vangst_tijd`, `vangst_uur`, `vangst_maand`, `diepte` fallback
- **FALSE:**
  - INSERT in `catches`
  - Kolommen: `session_id`, `catch_datetime`, `catch_hour`, `catch_month`, `diepte: null`
- **Doel:** Opslaan van nieuwe vangst van kaart click

### Check 3.8 — onMapClick() Session Reload ID
- **Regel:** 318
- **Patroon:** Ternary operator
- **TRUE:** `enrichmentSession.id`
- **FALSE:** `enrichmentSession.session_id`
- **Doel:** Juiste ID voor reload van enrichment scherm

---

## 4. PHASE4-VALIDATION.JS (12 checks)

### Check 4.1 — validateSession() Type Flag
- **Regel:** 22
- **Patroon:** Variable declaration
- **Doel:** Flag voor validatie logica

### Check 4.2 — validateSession() GPS Validation
- **Regel:** 54-56
- **Patroon:** Ternary operator
- **TRUE:** Check `enrichmentSession.gps_lat && enrichmentSession.gps_long`
- **FALSE:** Check `enrichmentSession.session_start_latitude && enrichmentSession.session_start_longitude`
- **Doel:** Valideer juiste GPS velden voor sessie type

### Check 4.3 — validateSession() Enrichment Data Lookup
- **Regel:** 67
- **Patroon:** Ternary in array indexing
- **TRUE:** `window.catchEnrichmentData[catch_.id]`
- **FALSE:** `window.catchEnrichmentData[catch_.catch_id]`
- **Doel:** Lookup verrijkings data met juiste catch ID

### Check 4.4 — makeSessionFinal() Initialization Flag
- **Regel:** 240
- **Patroon:** Variable declaration
- **Doel:** Bepaalt gehele finalisatie flow

### Check 4.5 — makeSessionFinal() Current Session ID
- **Regel:** 245
- **Patroon:** Ternary operator
- **TRUE:** `enrichmentSession.id`
- **FALSE:** `enrichmentSession.session_id`
- **Doel:** Exclusie van current session in duplicate check

### Check 4.6 — makeSessionFinal() Time Range Detection
- **Regel:** 251-252
- **Patroon:** Ternary operators (2)
- **TRUE:**
  - Start: `session.start_tijd`
  - End: `session.eind_tijd`
- **FALSE:**
  - Start: `session.session_start_datetime`
  - End: `session.session_end_datetime`
- **Doel:** Correct time fields voor overlap check

### Check 4.7 — makeSessionFinal() Session Create Strategy
- **Regel:** 306-382
- **Patroon:** If/else statement (groot blok)
- **TRUE:**
  - INSERT nieuw record in `sessions`
  - Mapped field_sessions → sessions kolommen
  - Genereert sessie naam: "Veld - ..."
- **FALSE:**
  - UPDATE bestaand record in `sessions`
  - Zet `definitief = true`
  - Handelt concept sessie af
- **Doel:** Twee verschillende strategieën: insert (veld) vs update (handmatig)

### Check 4.8 — makeSessionFinal() Catch GPS Fallback
- **Regel:** 457-459
- **Patroon:** Ternary operator
- **TRUE:** Fallback naar `enrichmentSession.gps_long`
- **FALSE:** Fallback naar `enrichmentSession.session_start_longitude`
- **Doel:** Fallback naar sessie-locatie als vangst geen GPS heeft

### Check 4.9 — makeSessionFinal() Catch Diepte Fallback
- **Regel:** 472
- **Patroon:** Ternary with nullish coalescing
- **TRUE:** `catch_.diepte ?? enrichmentSession.diepte`
- **FALSE:** `catch_.diepte ?? null`
- **Doel:** Fallback naar sessie-diepte alleen voor veld-sessies

### Check 4.10 — makeSessionFinal() Catch Bodemhardheid Fallback
- **Regel:** 474
- **Patroon:** Ternary with nullish coalescing
- **TRUE:** `catch_.bodemhardheid ?? enrichmentSession.bodemhardheid`
- **FALSE:** `catch_.bodemhardheid ?? null`
- **Doel:** Fallback naar sessie-bodemhardheid

### Check 4.11 — makeSessionFinal() Enrichment Data Lookup
- **Regel:** 481
- **Patroon:** Ternary in array indexing
- **TRUE:** `window.catchEnrichmentData[catch_.id]`
- **FALSE:** `window.catchEnrichmentData[catch_.catch_id]`
- **Doel:** Lookup Groep 2 verrijkings data

### Check 4.12 — makeSessionFinal() Field Table Backwrite
- **Regel:** 580-607
- **Patroon:** If block (only TRUE branch)
- **TRUE:**
  - UPDATE `field_sessions` set `session_id = newSessionId`
  - Loop over `field_catches`, UPDATE met `session_id` en `catch_id`
- **FALSE:** Niets (handmatige sessies zijn al in definitieve tabellen)
- **Doel:** Terugschrijven van nieuwe session/catch IDs naar field tables

---

## PATROON ANALYSE

### Meest Gebruikte Conditionele Types

**1. If/else statement (28 checks):**
- Gebruikt voor significante logica branches
- Bijvoorbeeld: table selection, data loading, large updates

**2. Ternary operator (19 checks):**
- Gebruikt voor eenvoudige veld/waarde selecties
- Bijvoorbeeld: `TRUE ? field1 : field2` patterns

### Voornaamste Use Cases

| Use Case | Checks | Modules |
|----------|--------|---------|
| Database tabel selectie | 12 | Alle 4 |
| Veld/kolom mapping | 11 | enrichment, mapper, validation |
| ID field selectie | 10 | Alle 4 |
| Data loading/querying | 6 | manager, enrichment, mapper |
| Fallback/defaults | 5 | enrichment, validation |
| GPS coordinate mapping | 3 | mapper, validation |
| UI styling/labels | 2 | manager |

### Critical Checks (moet altijd correct zijn)

| Check | Impact | Bestand | Regel |
|-------|--------|---------|-------|
| Session ID selection | Bepaalt welke record wordt geupdate | Alle | 245, 256, 318, 1052 |
| Catch ID selection | Bepaalt welke vangst wordt bewerkt | enrichment, validation | 164, 530, 570, 678 |
| Table selection | Data gaat naar wrong tabel | Alle | 104, 309, 363, 580 |
| Field mapping | Data in wrong kolom | enrichment, validation | 183-261 |
| GPS fallback | Verliest coördinaten | mapper, validation | 60, 457 |

---

## TESTING CHECKLIST

Voor elke isFieldSession check:
- [ ] Veld-sessies gebruiken correct field_sessions / field_catches tabel
- [ ] Handmatige sessies gebruiken correct sessions / catches tabel
- [ ] Juiste ID velden geselecteerd (id vs session_id vs catch_id)
- [ ] Fallback logica (diepte, bodemhardheid, GPS) werkt
- [ ] Terugschrijven naar field tables gebeurt ALLEEN voor veld-sessies
- [ ] Ternary operators hebben beide branches implemented

---

## NOTES

- **session_id variabele naam:** Verwarrend - gebruiken we op twee plekken:
  - `enrichmentSession.session_id` = PK van sessions tabel
  - `field_catches.session_id` = FK naar sessions tabel (ingevuld na finalisatie)

- **Null handling:** Veel `?? null` fallbacks - verificatie dat deze intentioneel zijn

- **Groep 2 enrichment data:** Stored in `window.catchEnrichmentData[id]` - moet correct ID (id vs catch_id) gebruiken

---

*Laaste update: 2026-03-03*
