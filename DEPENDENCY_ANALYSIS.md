# 📊 Afhankelijkheidsketen Analyse: addNewSession()

## 🎯 Entrypoint: `addNewSession()` (ui-sessions.js:1058)

```
addNewSession()
└─> addNewSessionWithCloudSync()
```

---

## 📋 VOLLEDIGE AFHANKELIJKHEIDSBOOM

### **Laag 1: Direct aangeroepen door addNewSession()**

```
addNewSession() [1058]
│
└─── addNewSessionWithCloudSync() [876]
     │
     ├─── EXTERNE FUNCTIES:
     │    ├─ getCloudSyncInfo() ❌ [validation-core.js:102]
     │    ├─ parseAndValidateDate() ✅ [ui-sessions.js:2017]
     │    ├─ validateTime() ❌ [validation-core.js:121] / [map-processing.js:882]
     │    ├─ showStatus() ❌ [map-processing.js:611]
     │    └─ supabaseManager.client (global Supabase object)
     │
     ├─── UI UPDATES (internal):
     │    ├─ updateSessionsList() ✅ [1040]
     │    ├─ updateTrackColors() ❌ [map-processing.js:414]
     │    ├─ updateStats() ✅ [1042]
     │    ├─ updateDataTable() ✅ [1043]
     │    ├─ updateValidationInRealTime() ❌ [validation-core.js:754]
     │    └─ updateCloudSyncStatus() ❌ [app-core.js:194]
     │
     ├─ DB_SCHEMA (global constant)
     ├─ sessions (global array)
     ├─ CONFIG.sessionColors (global array)
     └─ trackPoints (global array)
```

---

## 🌳 Laag 2: Functies aangeroepen door updateSessionsList()

```
updateSessionsList() [26]
│
├─── renderEmptySessionsMessage() ✅ [47]
│    └─ getCloudSyncInfo() ❌ [validation-core.js:102]
│
└─── createSessionElement() ✅ [60] (voor elke sessie)
     │
     ├─── getFilteredWaypoints() ✅ [97]
     │    ├─ parseWaypointName() ❌ [map-processing.js:628]
     │    └─ activeSpeciesFilter (global variable)
     │
     ├─── getCloudSyncInfo() ❌ [validation-core.js:102]
     │
     ├─── createSessionHeader() ✅ [105]
     │    └─ (no function calls, pure HTML generation)
     │
     ├─── createSessionInfo() ✅ [125]
     │    ├─ getCloudSyncInfo() ❌ [validation-core.js:102]
     │    └─ (mostly HTML, calls createLocationField, createWaterTypeField, etc.)
     │
     ├─── createSessionFields() ✅ [163]
     │    ├─ createLocationField() ✅ [188]
     │    │  └─ updateSessionField() ✅ [734]
     │    │     └─ (complex, see separate branch)
     │    │
     │    ├─ createWaterTypeField() ✅ [223]
     │    │  └─ updateSessionField() ✅ [734]
     │    │
     │    ├─ createCurrentField() ✅ [248]
     │    │  └─ updateSessionField() ✅ [734]
     │    │
     │    ├─ createTemperatureField() ✅ [273]
     │    │  └─ updateSessionField() ✅ [734]
     │    │
     │    └─ createClarityField() ✅ [299]
     │       └─ updateSessionField() ✅ [734]
     │
     ├─── createSessionButtons() ✅ [324]
     │    └─ getCloudSyncInfo() ❌ [validation-core.js:102]
     │
     └─── createWaypointEditor() ✅ [351]
          └─ generateWaypointEditor() ✅ [360]
             └─ (complex nested rendering)
```

---

## 🌳 Laag 3: Functies aangeroepen door updateDataTable()

```
updateDataTable() [412]
│
├─── renderEmptyDataTable() ✅ [438]
│    └─ getCloudSyncInfo() ❌ [validation-core.js:102]
│
├─── addEmptySessionRow() ✅ [452]
│    ├─ getCloudSyncInfo() ❌ [validation-core.js:102]
│    └─ createEmptySessionCells() ✅ [469]
│       └─ createEmptyMessage() ✅ [484]
│
├─── addSessionWaypointRows() ✅ [496]
│    └─ createWaypointDataRow() ✅ [503]
│       ├─ createSessionDataCells() ✅ [535]
│       │  └─ (HTML generation for session data)
│       │
│       └─ createCatchDataCells() ✅ [550]
│          ├─ createBasicCatchInputs() ✅ [558]
│          │  └─ (form inputs for catch data)
│          │
│          └─ createCatchDropdowns() ✅ [594]
│             └─ DropdownManager.getOptions() ❌ [data-managers.js]
│
└─── applyTableVisibilitySettings() ✅ [636]
     └─ (CSS manipulation, no function calls)
```

---

## 🌳 Laag 4: updateStats() Dependencies

```
updateStats() [699]
│
└─── parseWaypointName() ❌ [map-processing.js:628]
     └─ (extracts soort from waypoint names)
```

---

## 📊 SAMENVATTING AFHANKELIJKHEDEN

### **Uit ui-sessions.js (✅ INTERN)**
**34 functies gebruikt om sessies aan te maken en weer te geven:**

1. addNewSessionWithCloudSync() [876]
2. parseAndValidateDate() [2017]
3. updateSessionsList() [26]
4. updateStats() [699]
5. updateDataTable() [412]
6. renderEmptySessionsMessage() [47]
7. createSessionElement() [60]
8. getFilteredWaypoints() [97]
9. createSessionHeader() [105]
10. createSessionInfo() [125]
11. createSessionFields() [163]
12. createLocationField() [188]
13. createWaterTypeField() [223]
14. createCurrentField() [248]
15. createTemperatureField() [273]
16. createClarityField() [299]
17. createSessionButtons() [324]
18. createWaypointEditor() [351]
19. generateWaypointEditor() [360]
20. createWaypointItem() [373]
21. createWaypointControls() [390]
22. updateDataTable() [412]
23. renderEmptyDataTable() [438]
24. addEmptySessionRow() [452]
25. createEmptySessionCells() [469]
26. createEmptyMessage() [484]
27. addSessionWaypointRows() [496]
28. createWaypointDataRow() [503]
29. createSessionDataCells() [535]
30. createCatchDataCells() [550]
31. createBasicCatchInputs() [558]
32. createLureSelector() [573]
33. createCatchDropdowns() [594]
34. applyTableVisibilitySettings() [636]
35. updateSessionField() [734]
36. resetBlockedAttempts() [2114]

### **Van buitenaf ui-sessions.js (❌ EXTERN)**
**7 externe functies nodig:**

**Van map-processing.js:**
1. parseWaypointName() [628] - Gebruikt om vangstsoort te extraheren
2. updateTrackColors() [414] - Update kaart kleuren
3. validateTime() [882] - Valideer tijdnotatie (ook in validation-core.js)
4. showStatus() [611] - Toon status messages

**Van validation-core.js:**
1. getCloudSyncInfo() [102] - Cloud sync status ophalen
2. validateTime() [121] - Tijdvalidatie
3. updateValidationInRealTime() [754] - Real-time validatie triggeren
4. updateCloudSyncStatus() [194] - Cloud sync knop updaten

**Van app-core.js:**
1. updateCloudSyncStatus() [194] - Cloud sync status update

**Van data-managers.js:**
1. DropdownManager.getOptions() - Dropdown opties uit beheer

**Globale objecten:**
1. sessions (array)
2. trackPoints (array)
3. waypoints (array)
4. activeSpeciesFilter (variable)
5. CONFIG.sessionColors (array)
6. DB_SCHEMA (object)
7. supabaseManager (object)
8. ValidationStateManager (object)

---

## 🔗 KRITIEKE AFHANKELIJKHEIDSKETEN VOOR HANDMATIGE SESSIES

### Minimaal nodig om handmatige sessie aan te maken:

```
index.html onclick="addNewSession()"
    ↓
ui-sessions.js:addNewSession()
    ↓
ui-sessions.js:addNewSessionWithCloudSync()
    ├─ validation-core.js:getCloudSyncInfo() [EXTERN]
    ├─ ui-sessions.js:parseAndValidateDate() [INTERN]
    ├─ validation-core.js:validateTime() [EXTERN]
    ├─ map-processing.js:showStatus() [EXTERN]
    └─ Supabase client (voor database save)

    DAARNA UI UPDATE:
    ├─ ui-sessions.js:updateSessionsList()
    │  ├─ ui-sessions.js:createSessionElement()
    │  │  └─ ui-sessions.js:getFilteredWaypoints()
    │  │  └─ ui-sessions.js:createSessionHeader()
    │  │  └─ ui-sessions.js:createSessionInfo()
    │  │  └─ ui-sessions.js:createSessionFields()
    │  │  └─ ui-sessions.js:createSessionButtons()
    │  │  └─ ui-sessions.js:createWaypointEditor()
    │  └─ map-processing.js:showStatus()
    │
    ├─ map-processing.js:updateTrackColors()
    ├─ ui-sessions.js:updateStats()
    │  └─ map-processing.js:parseWaypointName()
    │
    ├─ ui-sessions.js:updateDataTable()
    │  ├─ ui-sessions.js:addEmptySessionRow()
    │  ├─ ui-sessions.js:applyTableVisibilitySettings()
    │  └─ map-processing.js:showStatus()
    │
    └─ validation-core.js:updateValidationInRealTime() [defensive]
    └─ app-core.js:updateCloudSyncStatus() [defensive]
```

---

## 📈 STATISTIEKEN

### Functies uit ui-sessions.js die gebruikt worden:
- **36 functies** zijn direct of indirect nodig
- Dit is **55%** van alle ui-sessions.js functies (36/65)

### Externe afhankelijkheden:
- **4 functies** uit map-processing.js
- **4 functies** uit validation-core.js
- **1 functie** uit app-core.js
- **1 object** uit data-managers.js
- **7 globale variabelen/objecten**

### Kritieke afhankelijkheden:
1. ✅ `parseAndValidateDate()` - **ENIGE** datum parser in ui-sessions.js
2. ❌ `validateTime()` - Van validation-core.js (NOT in ui-sessions.js)
3. ❌ `getCloudSyncInfo()` - Van validation-core.js (NOT in ui-sessions.js)
4. ❌ `showStatus()` - Van map-processing.js (NOT in ui-sessions.js)
5. ❌ `supabaseManager` - Globale Supabase client

---

## 🚨 POTENTIËLE RISICO'S

### Als volgende bestanden verwijderd/verbroken worden:
1. **map-processing.js** → `addNewSession()` breekt (showStatus, updateTrackColors, parseWaypointName)
2. **validation-core.js** → `addNewSession()` breekt (getCloudSyncInfo, validateTime, updateValidationInRealTime)
3. **app-core.js** → `addNewSession()` breekt (updateCloudSyncStatus)
4. **supabase-integration.js** → Sessies kunnen niet opgeslagen naar database

### Functies in ui-sessions.js die NIET gebruikt worden:
- **29 functies zijn dood code** (45% van ui-sessions.js)
- Deze worden ALLEEN aangeroepen vanuit legacy code

---

## 💡 AANBEVELINGEN

1. **Voor onderhoud**: ui-sessions.js is dicht verweven met map-processing.js en validation-core.js. Wijzigingen in één bestand beïnvloeden alle anderen.

2. **Voor refactoring**: De 36 gebruikte functies kunnen worden geïsoleerd in een aparte "session-ui.js" module, gescheiden van de 29 ongebruikte functies.

3. **Voor Phase 4**: Phase 4 modules (phase4-enrichment.js, phase4-validation.js, etc.) gebruiken GEEN functies uit ui-sessions.js. Ze hebben een eigen implementatie.

4. **Voor legacy code**: De 29 ongebruikte functies kunnen (voorzichtig) verwijderd worden als er geen index.html onclick handlers naar verwijzen.

