// ====================================
// FASE 4: VERRIJKINGSSCHERM
// Edit sessiegegevens + vangsten + kaart
// ====================================

let enrichmentMap = null;
let enrichmentCatches = [];
let enrichmentSession = null;

// Window object voor opslag van verrijkingsdata die niet in field_catches bestaan
window.catchEnrichmentData = {};

// ====================================
// Helper: Load Locations from localStorage
// ====================================

/**
 * Laadt locaties uit localStorage (pikehunters_locations)
 */
function loadLocationsFromStorage() {
    try {
        const locationsJSON = localStorage.getItem('pikehunters_locations');
        if (locationsJSON) {
            const locations = JSON.parse(locationsJSON);
            return Array.isArray(locations) ? locations : [];
        }
    } catch (error) {
        console.warn('Error loading locations from localStorage:', error);
    }
    return [];
}

// ====================================
// STAP 1: Init Enrichment Screen
// ====================================

/**
 * Initialiseert verrijkingsscherm met sessie + vangsten + kaart
 */
async function initEnrichmentScreen(sessionId) {
    try {
        console.log('🔧 Initializing enrichment screen...');

        // Maak container schoon voordat opnieuw gerenderd wordt
        const container = document.getElementById('phase4EnrichmentContent');
        if (container) {
            container.innerHTML = '';
        }

        // Laad sessie en vangsten
        const sessionData = await loadSessionForEnrichment(sessionId);
        enrichmentSession = sessionData.session;
        enrichmentCatches = sessionData.catches;

        // ⭐ DEBUG: Log enrichmentSession volledig
        console.log('🔐 ENRICHMENT SESSION FULL DATA:', enrichmentSession);
        console.log('   - bodemhardheid:', enrichmentSession?.bodemhardheid);

        // ⭐ DEBUG: Log alle catches met ID velden (critical voor editCatchModal!)
        console.log('📋 ENRICHMENT SCREEN LOADED CATCHES:', enrichmentCatches.map(c => ({
            id: c.id,                          // field_catches primary key
            catch_id: c.catch_id,              // catches primary key
            soort: c.soort,
            origin: window.currentSession?.origin,
            bodemhardheid: c.bodemhardheid,
            gps_lat: c.gps_lat,
            gps_long: c.gps_long
        })));

        // Render formulier-blok rechtsboven
        renderSessionForm(enrichmentSession);

        // Render vangsten-tabel
        renderCatchesTable(enrichmentCatches);

        // Initialize kaart
        setTimeout(() => {
            if (typeof initEnrichmentMap === 'function') {
                initEnrichmentMap(enrichmentSession);
            }
        }, 100);

        console.log('✓ Enrichment screen initialized');

    } catch (error) {
        console.error('❌ Error initializing enrichment:', error);
        alert('Fout bij laden sessie: ' + error.message);
    }
}

// ====================================
// STAP 2: Load Session & Catches
// ====================================

/**
 * Laadt volledige sessie en bijbehorende vangsten
 */
async function loadSessionForEnrichment(sessionId) {
    const origin = window.currentSession?.origin;

    const tables = Phase4Utils.getTableNames(origin);
    const pks = Phase4Utils.getPrimaryKeys(origin);

    // Load session
    const { data: session, error: sessionError } = await supabaseManager.client
        .from(tables.sessionTable)
        .select('*')
        .eq(pks.sessionPk, sessionId)
        .single();

    if (sessionError) throw sessionError;

    // ⭐ DEBUG: Log session data
    console.log('📋 LOADED session:', session);
    console.log('🏗️ session.bodemhardheid:', session?.bodemhardheid);

    // Bepaal welke kolom voor session linking gebruiken (field_session_id vs session_id)
    const sessionLinkCol = origin === 'veld' ? DB_SCHEMA.field_catches.cols.field_session_id : DB_SCHEMA.catches.cols.session_id;
    const orderCol = origin === 'veld' ? DB_SCHEMA.field_catches.cols.vangst_tijd : DB_SCHEMA.catches.cols.catch_datetime;

    // Load catches
    const { data: catches, error: catchError } = await supabaseManager.client
        .from(tables.catchTable)
        .select('*')
        .eq(sessionLinkCol, sessionId)
        .order(orderCol, { ascending: true });

    if (catchError) throw catchError;

    console.log('🎣 LOADED catches:', catches);

    return {
        session: session,
        catches: catches || []
    };
}

// ====================================
// STAP 3: Render Session Form
// ====================================

/**
 * Rendert sessiegegevens formulier rechtsboven
 */
function renderSessionForm(session) {
    const container = document.getElementById('phase4EnrichmentContent');
    if (!container) return;

    // Normalize sessie velden
    const s = Phase4Utils.normalizeSession(enrichmentSession, window.currentSession?.origin);

    const form = document.createElement('div');
    form.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
        background: #f9f9f9;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #ddd;
    `;

    // Map veld-sessie → display names
    const fields = [
        {
            key: window.currentSession?.origin === 'veld' ? 'datum' : 'session_start_date',
            label: 'Datum',
            type: 'date',
            readonly: true
        },
        // TWEE LOCATIE VELDEN: één voor veldregistratie (read-only), één definitief (dropdown)
        {
            key: window.currentSession?.origin === 'veld' ? 'locatie' : null,
            label: 'Locatie op water (veldregistratie)',
            type: 'text',
            readonly: true,
            showOnlyIfFieldSession: window.currentSession?.origin === 'veld'
        },
        {
            key: 'locatie_definitief',
            label: 'Locatie (definitief)',
            type: 'select',
            options: loadLocationsFromStorage(),
            editable: true,
            required: true
        },
        {
            key: window.currentSession?.origin === 'veld' ? 'start_tijd' : 'session_start_datetime',
            label: 'Starttijd',
            type: 'datetime-local',
            readonly: true
        },
        {
            key: window.currentSession?.origin === 'veld' ? 'eind_tijd' : 'session_end_datetime',
            label: 'Eindtijd',
            type: 'datetime-local',
            editable: true
        },
        {
            key: 'watersoort',
            label: 'Watersoort',
            type: 'select',
            options: ['Rivier', 'Gracht', 'Meer', 'Kanaal', 'Polder', 'Park', 'Vijver'],
            editable: true
        },
        {
            key: 'stroomsnelheid',
            label: 'Stroomsnelheid',
            type: 'select',
            options: ['Stilstaand tot licht stromend', 'Licht tot matig stromend', 'Snelstromend'],
            editable: true
        },
        {
            key: window.currentSession?.origin === 'veld' ? 'watertemperatuur' : 'watertemperatuur_measured',
            label: 'Water temp (°C)',
            type: 'number',
            editable: true
        },
        {
            key: 'helderheid',
            label: 'Helderheid',
            type: 'select',
            options: ['Zeer troebel', 'Troebel', 'Matig helder', 'Helder', 'Kristal helder'],
            editable: true
        },
        {
            key: 'aantal_hengels',
            label: 'Aantal hengels',
            type: 'number',
            editable: true
        },
        // Sessie-eigenschap: Diepte (read-only, overrideable per vangst)
        {
            key: 'diepte',
            label: 'Sessie Diepte (m)',
            type: 'number',
            readonly: true,
            showOnlyIfFieldSession: window.currentSession?.origin === 'veld'
        },
        // Sessie-eigenschap: Bodemhardheid (read-only, overrideable per vangst)
        {
            key: 'bodemhardheid',
            label: 'Sessie Bodemhardheid',
            type: 'text',
            readonly: true,
            showOnlyIfFieldSession: window.currentSession?.origin === 'veld'
        },
        // Sessienotitie
        {
            key: 'notities',
            label: 'Sessienotitie',
            type: 'text',
            editable: true,
            showOnlyIfFieldSession: window.currentSession?.origin === 'veld'
        }
    ];

    // Render velden
    fields.forEach(field => {
        // Skip veld indien showOnlyIfFieldSession is true en dit is geen veld session
        if (field.showOnlyIfFieldSession && window.currentSession?.origin !== 'veld') {
            return;
        }

        // Bepaal value - speciale handling voor locatie_definitief
        let value = field.key ? session[field.key] : null;

        // Voor locatie_definitief, laad de opgeslagen waarde of gebruik default
        if (field.key === 'locatie_definitief') {
            value = enrichmentSession.locatie || '';
        }

        const div = document.createElement('div');
        div.style.cssText = 'display: flex; flex-direction: column;';

        const label = document.createElement('label');
        label.style.cssText = 'font-weight: 600; margin-bottom: 5px; color: #333; font-size: 0.9em;';
        label.textContent = field.label + (field.required ? ' *' : '');

        if (field.type === 'select') {
            const select = document.createElement('select');
            select.style.cssText = `
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9em;
                ${field.readonly ? 'background: #f0f0f0; cursor: not-allowed;' : ''}
            `;
            select.disabled = field.readonly;

            // Voeg lege optie toe voor verplichte velden
            if (field.required) {
                const emptyOpt = document.createElement('option');
                emptyOpt.value = '';
                emptyOpt.textContent = '— Selecteer locatie —';
                select.appendChild(emptyOpt);
            }

            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                option.selected = value === opt;
                select.appendChild(option);
            });

            if (field.editable && !field.readonly) {
                select.onchange = (e) => {
                    if (field.key === 'locatie_definitief') {
                        enrichmentSession.locatie = e.target.value;
                    } else {
                        enrichmentSession[field.key] = e.target.value;
                    }
                    saveSessionData();
                };
            }

            div.appendChild(label);
            div.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = field.type;
            input.style.cssText = `
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9em;
                ${field.readonly ? 'background: #f0f0f0; cursor: not-allowed;' : ''}
            `;
            input.disabled = field.readonly;

            // Fix datetime-local format (remove seconds/milliseconds/timezone)
            if (field.type === 'datetime-local' && value) {
                input.value = value.slice(0, 16);
            } else {
                input.value = value || '';
            }

            if (field.editable && !field.readonly) {
                input.onchange = (e) => {
                    enrichmentSession[field.key] = e.target.value;
                    saveSessionData();
                };
            }

            div.appendChild(label);
            div.appendChild(input);
        }

        form.appendChild(div);
    });

    // Voeg toe aan container
    container.appendChild(form);
}

// ====================================
// STAP 4: Save Session Data
// ====================================

/**
 * Slaat sessiegegevens op
 */
async function saveSessionData() {
    if (!enrichmentSession) return;

    try {
        const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
        const pks = Phase4Utils.getPrimaryKeys(window.currentSession?.origin);
        const isFieldOrigin = window.currentSession?.origin === 'veld';

        // Bepaal update data en session ID op basis van type
        const updateData = {};
        let sessionId;

        if (isFieldOrigin) {
            // Voor veld-sessies: update ook de definitieve locatie keuze
            updateData[DB_SCHEMA.field_sessions.cols.locatie] = enrichmentSession.locatie ?? null;
            updateData[DB_SCHEMA.field_sessions.cols.eind_tijd] = enrichmentSession.eind_tijd ?? null;
            updateData[DB_SCHEMA.field_sessions.cols.watersoort] = enrichmentSession.watersoort ?? null;
            updateData[DB_SCHEMA.field_sessions.cols.stroomsnelheid] = enrichmentSession.stroomsnelheid ?? null;
            updateData[DB_SCHEMA.field_sessions.cols.watertemperatuur] = enrichmentSession.watertemperatuur ? parseFloat(enrichmentSession.watertemperatuur) : null;
            updateData[DB_SCHEMA.field_sessions.cols.helderheid] = enrichmentSession.helderheid ?? null;
            updateData[DB_SCHEMA.field_sessions.cols.aantal_hengels] = enrichmentSession.aantal_hengels ? parseInt(enrichmentSession.aantal_hengels) : null;
            sessionId = enrichmentSession.id;
        } else {
            // Voor handmatige sessies
            updateData[DB_SCHEMA.sessions.cols.locatie] = enrichmentSession.locatie ?? null;
            updateData[DB_SCHEMA.sessions.cols.session_end_datetime] = enrichmentSession.session_end_datetime ?? null;
            updateData[DB_SCHEMA.sessions.cols.watersoort] = enrichmentSession.watersoort ?? null;
            updateData[DB_SCHEMA.sessions.cols.stroomsnelheid] = enrichmentSession.stroomsnelheid ?? null;
            updateData[DB_SCHEMA.sessions.cols.watertemperatuur_measured] = enrichmentSession.watertemperatuur_measured ? parseFloat(enrichmentSession.watertemperatuur_measured) : null;
            updateData[DB_SCHEMA.sessions.cols.helderheid] = enrichmentSession.helderheid ?? null;
            updateData[DB_SCHEMA.sessions.cols.aantal_hengels] = enrichmentSession.aantal_hengels ? parseInt(enrichmentSession.aantal_hengels) : null;
            sessionId = enrichmentSession.session_id;
        }

        console.log('💾 SAVING SESSION DATA:', JSON.stringify(updateData));

        const { error } = await supabaseManager.client
            .from(tables.sessionTable)
            .update(updateData)
            .eq(pks.sessionPk, sessionId);

        if (error) throw error;

        console.log('✓ Session data saved');

    } catch (error) {
        console.error('❌ Error saving session:', error);
        alert('Fout bij opslaan: ' + error.message);
    }
}

// ====================================
// STAP 5: Render Catches Table
// ====================================

/**
 * Rendert tabel met alle vangsten
 */
function renderCatchesTable(catches) {
    const container = document.getElementById('phase4EnrichmentContent');
    if (!container) return;

    const section = document.createElement('div');
    section.style.cssText = 'margin-top: 30px;';

    const title = document.createElement('h4');
    title.textContent = '🎣 Vangsten';
    title.style.cssText = 'margin: 0 0 15px 0; color: #1a1a1a;';
    section.appendChild(title);

    if (!catches || catches.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Geen vangsten. Klik op de kaart om een vangst toe te voegen.';
        empty.style.cssText = 'color: #999;';
        section.appendChild(empty);
        container.appendChild(section);
        return;
    }

    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9em;
        margin-bottom: 15px;
    `;

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
            <th style="padding: 10px; text-align: left; font-weight: 600;">Soort</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Lengte (cm)</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Aantal</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Tijd</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">GPS</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Diepte override (m)</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Bodemhardheid override</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Vangsthoogte</th>
            <th style="padding: 10px; text-align: left; font-weight: 600;">Notities</th>
            <th style="padding: 10px; text-align: center; font-weight: 600;">Acties</th>
        </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    catches.forEach((catch_, idx) => {
        const row = document.createElement('tr');
        row.style.cssText = `
            border-bottom: 1px solid #ddd;
            background: ${idx % 2 === 0 ? '#fff' : '#f9f9f9'};
            transition: background 0.2s;
        `;
        row.onmouseover = () => row.style.background = '#f0f7ff';
        row.onmouseout = () => row.style.background = idx % 2 === 0 ? '#fff' : '#f9f9f9';

        // Normalize vangst data
        const nc = Phase4Utils.normalizeCatch(catch_, window.currentSession?.origin);

        // Bepaal welke kolommen te gebruiken
        const soort = catch_.soort;
        const lengte = catch_.lengte;
        const aantal = catch_.aantal;
        const time = nc.vangstTijd;
        const notities = catch_.notities;
        const vangsthoogte = catch_.vangsthoogte;

        // Override kolommen - alleen tonen als ingevuld
        const diepteOverride = catch_.diepte;
        const bodemhardheidOverride = catch_.bodemhardheid;

        const timeStr = time ? new Date(time).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : '—';

        // GPS display logic
        const gpsLat = catch_.gps_lat;
        const gpsLng = catch_.gps_long;
        let gpsStr = '⚠️ Geen GPS';
        if (gpsLat !== null && gpsLat !== undefined && gpsLng !== null && gpsLng !== undefined) {
            const lat = parseFloat(gpsLat).toFixed(4);
            const lng = parseFloat(gpsLng).toFixed(4);
            gpsStr = `📍 ${lat}, ${lng}`;
        }

        row.innerHTML = `
            <td style="padding: 10px;">${soort}</td>
            <td style="padding: 10px;">${lengte || '—'}</td>
            <td style="padding: 10px;">${aantal}</td>
            <td style="padding: 10px;">${timeStr}</td>
            <td style="padding: 10px; font-size: 0.75em; color: #888;">${gpsStr}</td>
            <td style="padding: 10px; background: ${diepteOverride ? '#fff8f0' : '#f9f9f9'};">${diepteOverride || '—'}</td>
            <td style="padding: 10px; background: ${bodemhardheidOverride ? '#fff8f0' : '#f9f9f9'};">${bodemhardheidOverride || '—'}</td>
            <td style="padding: 10px;">${vangsthoogte || '—'}</td>
            <td style="padding: 10px;">${notities || '—'}</td>
            <td style="padding: 10px; text-align: center;">
                <button class="btn btn-primary" onclick="editCatchModal('${nc.id}', '${nc.isField}')" style="padding: 4px 8px; font-size: 0.8em; margin-right: 5px;">Bewerk</button>
                <button class="btn btn-danger" onclick="deleteCatch('${nc.id}', '${nc.isField}')" style="padding: 4px 8px; font-size: 0.8em;">Verwijder</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    section.appendChild(table);

    container.appendChild(section);
}

// ====================================
// Helper: Aas Selector voor Enrichment
// ====================================

/**
 * Opent aas selector modal voor enrichment formulier
 * Integreert met bestaande lure-interface.js
 */
function openLureModalForEnrichment(inputElement, catchId) {
    // Sla de huidige catchId op zodat selectLure deze kan gebruiken
    window.enrichmentCatchIdForLure = catchId;

    // Sla de originele selectLure functie op
    window.originalSelectLure = window.selectLure;

    // Markeert dat LureManager aan het werken is
    window.lureManagerActive = true;

    // Override selectLure temporair om in enrichmentData op te slaan
    window.selectLure = function(lureName) {
        console.log(`🎣 Selected lure: ${lureName} for catch ${catchId}`);

        // Update input element DIRECT (niet via change event)
        inputElement.value = lureName;
        inputElement.style.backgroundColor = '#e8f5e9';  // Licht groen voor visuele feedback

        // Reset background color na 1 seconde
        setTimeout(() => {
            inputElement.style.backgroundColor = '#f5f5f5';
        }, 1000);

        // Sla op in window.catchEnrichmentData
        if (!window.catchEnrichmentData[catchId]) {
            window.catchEnrichmentData[catchId] = {};
        }
        window.catchEnrichmentData[catchId].aas = lureName;

        console.log(`💾 Stored aas in enrichmentData[${catchId}]:`, window.catchEnrichmentData[catchId]);

        // Sluit ALLEEN de LureManager modal ZONDER andere handlers te triggeren
        // Doe dit DIRECT op de modal DOM element, niet via closeLureModal functie
        const lureModal = document.getElementById('lureModal');
        if (lureModal) {
            lureModal.style.display = 'none';
        }

        // Herstellen van z-index voor editCatchModal overlay
        if (window.currentEditCatchModalOverlay) {
            console.log('🔼 Restoring editCatchModal overlay z-index to 1000');
            window.currentEditCatchModalOverlay.style.zIndex = '1000';
        }

        // Restore originele selectLure functie
        window.selectLure = window.originalSelectLure;
        delete window.enrichmentCatchIdForLure;
        delete window.originalSelectLure;

        // Delay het 'lureManagerActive' flag resetten zodat event handlers het kunnen checken
        setTimeout(() => {
            window.lureManagerActive = false;
        }, 100);
    };

    // Verlaag z-index van editCatchModal overlay zodat LureManager (z-index 1000) zichtbaar is
    if (window.currentEditCatchModalOverlay) {
        console.log('📋 Reducing editCatchModal overlay z-index to 999 to show LureManager');
        window.currentEditCatchModalOverlay.style.zIndex = '999';
    }

    // Open de bestaande lure modal
    openLureModal(inputElement);
}

// ====================================
// STAP 6: Add/Edit/Delete Catches
// ====================================

/**
 * Verwijdert vangst met bevestiging
 */
async function deleteCatch(catchId, isFieldCatch) {
    if (!confirm('Weet je zeker dat je deze vangst wilt verwijderen?')) {
        return;
    }

    try {
        // Converteer catchId naar number voor consistentie
        const catchIdAsNumber = parseInt(catchId);

        const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
        const pks = Phase4Utils.getPrimaryKeys(window.currentSession?.origin);

        const { error } = await supabaseManager.client
            .from(tables.catchTable)
            .delete()
            .eq(pks.catchPk, catchIdAsNumber);

        if (error) throw error;

        console.log('✓ Catch deleted');

        // Reload - gebruik het juiste ID-veld voor beide sessietypes
        const nc = Phase4Utils.normalizeCatch({ id: catchIdAsNumber, catch_id: catchIdAsNumber }, window.currentSession?.origin);
        enrichmentCatches = enrichmentCatches.filter(c =>
            nc.isField ? c.id !== catchIdAsNumber : c.catch_id !== catchIdAsNumber
        );
        const container = document.getElementById('phase4EnrichmentContent');
        container.innerHTML = '';
        renderSessionForm(enrichmentSession);
        renderCatchesTable(enrichmentCatches);
        if (typeof initEnrichmentMap === 'function') {
            initEnrichmentMap(enrichmentSession);
        }

    } catch (error) {
        console.error('❌ Error deleting catch:', error);
        alert('Fout bij verwijderen: ' + error.message);
    }
}

/**
 * Modal voor bewerken vangst met ALLE velden
 * Groep 1 (field_catches/catches tabellen): soort, lengte, aantal, vangst_tijd/catch_datetime, notities/notities, diepte, vangsthoogte, bodemhardheid
 * Groep 2 (window.catchEnrichmentData): aas, techniek, vissnelheid, booster, gewicht, structuur, aasvis, zon_schaduw, helderheid override, stroomsnelheid override, watertemperatuur override
 */
async function editCatchModal(catchId, isFieldCatch) {
    console.log('✏️ EDIT BUTTON CLICKED!', { catchId, isFieldCatch });

    // Converteer catchId naar number omdat IDs in database numbers zijn
    const catchIdAsNumber = parseInt(catchId);

    // Normalize catch voor correcte ID lookup
    const nc = Phase4Utils.normalizeCatch({id: catchIdAsNumber, catch_id: catchIdAsNumber}, window.currentSession?.origin);

    // Vind de vangst in enrichmentCatches array
    // ⭐ KRITIEK: field_catches hebben 'id' veld, catches hebben 'catch_id' veld
    const catchToEdit = enrichmentCatches.find(c =>
        nc.isField ? c.id === catchIdAsNumber : c.catch_id === catchIdAsNumber
    );

    if (!catchToEdit) {
        console.error('❌ Vangst niet gevonden!', {
            catchId,
            isFieldOrigin: nc.isField,
            searchedFor: nc.isField ? 'c.id' : 'c.catch_id',
            arrayContents: enrichmentCatches.map(c => ({ id: c.id, catch_id: c.catch_id }))
        });
        alert('Vangst niet gevonden');
        return;
    }

    // Haal bestaande verrijkingsdata op voor deze vangst (als aanwezig)
    const existingEnrichment = window.catchEnrichmentData[catchIdAsNumber] || {};

    // Maak modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = `editCatchModal-overlay-${catchIdAsNumber}`;
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    // Sla referentie op zodat we dit kunnen manipuleren in openLureModalForEnrichment
    window.currentEditCatchModalOverlay = modalOverlay;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 650px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // Modal Header
    const header = document.createElement('h3');
    header.textContent = '✏️ Vangst Bewerken';
    header.style.cssText = 'margin: 0 0 20px 0; color: #1a1a1a;';
    modalContent.appendChild(header);

    // Formulier Grid
    const form = document.createElement('div');
    form.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
    `;

    // Helper function om input field toe te voegen
    const addField = (label, key, type = 'text', options = null, value = null) => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; flex-direction: column;';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-weight: 600; margin-bottom: 5px; font-size: 0.9em; color: #333;';
        div.appendChild(labelEl);

        let input;
        if (type === 'select' && options) {
            input = document.createElement('select');
            input.style.cssText = 'padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;';

            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '— Selecteer —';
            input.appendChild(emptyOpt);

            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
            input.value = value || '';
        } else {
            input = document.createElement('input');
            input.type = type;
            input.style.cssText = 'padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em;';
            // Fix datetime-local format (remove seconds/milliseconds/timezone)
            if (input.type === 'datetime-local' && value) {
                input.value = value.slice(0, 16);
            } else {
                input.value = value || '';
            }
        }

        input.id = `edit_${key}`;
        div.appendChild(input);
        form.appendChild(div);
        return input;
    };

    // Helper om section headers toe te voegen
    const addSectionHeader = (title) => {
        const header = document.createElement('div');
        header.style.cssText = 'grid-column: 1/-1; padding: 15px 0 0 0; border-top: 2px solid #ddd; margin-top: 10px;';
        const h4 = document.createElement('h4');
        h4.style.cssText = 'margin: 0 0 10px 0; color: #1a1a1a; font-size: 1em;';
        h4.textContent = title;
        header.appendChild(h4);
        form.appendChild(header);
    };

    // ============================================================
    // GROEP 1: Basis velden (opslaan in field_catches/catches)
    // ============================================================
    addSectionHeader('📝 Basis Gegevens (opslaan in database)');

    const fields = {};

    // Basis velden voor beide types
    fields.soort = addField('Soort *', 'soort', 'select', ['Snoek', 'Snoekbaars', 'Baars', 'Roofblei', 'Meerval', 'Winde', 'Grondel'], catchToEdit.soort);
    fields.lengte = addField('Lengte (cm) *', 'lengte', 'number', null, catchToEdit.lengte);
    fields.aantal = addField('Aantal', 'aantal', 'number', null, catchToEdit.aantal);

    // Tijd en notities velden - afhankelijk van type
    if (nc.isField) {
        fields.vangst_tijd = addField('Vangst Tijd', 'vangst_tijd', 'datetime-local', null, catchToEdit.vangst_tijd);
        fields.notities = addField('Notities', 'notities', 'text', null, catchToEdit.notities);
    } else {
        fields.catch_datetime = addField('Vangst Tijd', 'catch_datetime', 'datetime-local', null, catchToEdit.catch_datetime);
        fields.notities = addField('Notities', 'notities', 'text', null, catchToEdit.notities);
    }

    // Diepte en bodemhardheid fallback via Phase4Utils
    const fallbacks = Phase4Utils.getCatchFallbacks(catchToEdit, enrichmentSession, window.currentSession?.origin);

    // Diepte override - alleen invullen als afwijkend van sessiewaarde
    fields.diepte_catch = addField('Diepte override (m)', 'diepte_catch', 'number', null, fallbacks.diepte);
    fields.vangsthoogte = addField('Vangsthoogte', 'vangsthoogte', 'select',
        ['Bodem', 'Bijna bodem', 'Midden', 'Oppervlak'],
        catchToEdit.vangsthoogte
    );
    // Bodemhardheid override - alleen invullen als afwijkend van sessiewaarde
    fields.bodemhardheid = addField('Bodemhardheid override', 'bodemhardheid', 'select',
        ['Hard', 'Medium', 'Zacht', 'Onbekend'],
        fallbacks.bodemhardheid
    );

    // ============================================================
    // GROEP 2: Verrijkingsvelden (opslaan in window.catchEnrichmentData)
    // ============================================================
    addSectionHeader('✨ Verrijking (opslaan in sessie, nog niet in database)');

    // Aas veld met LureManager integratie (speciaal veld!)
    const aasDiv = document.createElement('div');
    aasDiv.style.cssText = 'display: flex; flex-direction: column;';

    const aasLabel = document.createElement('label');
    aasLabel.textContent = 'Aas';
    aasLabel.style.cssText = 'font-weight: 600; margin-bottom: 5px; font-size: 0.9em; color: #333;';
    aasDiv.appendChild(aasLabel);

    const aasInputWrapper = document.createElement('div');
    aasInputWrapper.style.cssText = 'display: flex; gap: 5px;';

    const aasInput = document.createElement('input');
    aasInput.id = `edit_aas`;
    aasInput.type = 'text';
    aasInput.value = existingEnrichment.aas || '';
    aasInput.placeholder = 'Klik "Kies aas" knop';
    aasInput.style.cssText = 'flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em; background: #f5f5f5;';
    aasInput.readOnly = true;
    aasInputWrapper.appendChild(aasInput);

    const aasBtn = document.createElement('button');
    aasBtn.type = 'button';
    aasBtn.textContent = '🔍 Kies aas';
    aasBtn.style.cssText = 'padding: 8px 12px; background: #1976D2; color: white; border: none; border-radius: 4px; font-size: 0.85em; cursor: pointer; white-space: nowrap;';
    aasBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openLureModalForEnrichment(aasInput, catchIdAsNumber);
        return false;
    };
    aasInputWrapper.appendChild(aasBtn);

    aasDiv.appendChild(aasInputWrapper);
    form.appendChild(aasDiv);

    fields.aas = aasInput;
    fields.techniek = addField('Techniek', 'techniek', 'select',
        ['Dropshot', 'Jiggen', 'C-rig', 'T-rig', 'Trollen', 'Spinning', 'Verticalen', 'Jerk', 'Twitch', 'N-rig', 'Cheb-rig'],
        existingEnrichment.techniek
    );

    // Nieuwe verrijkingsvelden
    fields.vissnelheid = addField('Vissnelheid', 'vissnelheid', 'select',
        ['Extreem traag', 'Traag', 'Gemiddeld', 'Snel', 'Extreem snel'],
        existingEnrichment.vissnelheid
    );
    fields.booster = addField('Booster', 'booster', 'select',
        ['Ja', 'Nee'],
        existingEnrichment.booster
    );
    fields.gewicht = addField('Gewicht (gr)', 'gewicht', 'number', null, existingEnrichment.gewicht);
    fields.structuur = addField('Structuur', 'structuur', 'select',
        ['Brug', 'Kademuur', 'Waterplanten', 'Talud', 'Havenmonding', 'Paal/obstakel', 'Steiger'],
        existingEnrichment.structuur
    );
    fields.aasvis = addField('Aasvis', 'aasvis', 'select',
        ['Veel', 'Beetje', 'Geen'],
        existingEnrichment.aasvis
    );
    fields.zon_schaduw = addField('Zon/Schaduw', 'zon_schaduw', 'select',
        ['Zon', 'Schaduw'],
        existingEnrichment.zon_schaduw
    );

    // Override velden voor sessions conditions
    fields.helderheid_override = addField('Helderheid (override)', 'helderheid_override', 'select',
        ['Zeer troebel', 'Troebel', 'Matig helder', 'Helder', 'Kristal helder'],
        existingEnrichment.helderheid_override
    );
    fields.stroomsnelheid_override = addField('Stroomsnelheid (override)', 'stroomsnelheid_override', 'select',
        ['Stilstaand tot licht stromend', 'Licht tot matig stromend', 'Snelstromend'],
        existingEnrichment.stroomsnelheid_override
    );
    fields.watertemperatuur_override = addField('Water temp (override)', 'watertemperatuur_override', 'number', null, existingEnrichment.watertemperatuur_override);

    // Info message
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'grid-column: 1/-1; padding: 12px; background: #f3e5f5; border-radius: 4px; font-size: 0.85em; color: #4a148c; margin-top: 10px;';
    infoDiv.innerHTML = `
        <strong>💡 Hoe werkt dit?</strong><br>
        • <strong>Basis Gegevens:</strong> Worden direct in de database opgeslagen<br>
        • <strong>Verrijking:</strong> Worden opgeslagen in de sessie. Bij "Definitief maken" worden ze meegenomen naar catches tabel
    `;
    form.appendChild(infoDiv);

    modalContent.appendChild(form);

    // ============================================================
    // LINKED CATCHES SECTION
    // ============================================================
    const linkedSection = document.createElement('div');
    linkedSection.style.cssText = 'margin-top: 20px; padding-top: 15px; border-top: 2px solid #ddd;';

    // Toon huidige koppeling als aanwezig
    if (catchToEdit.linked_sighting_id || catchToEdit.linked_catch_id) {
        const linkedInfo = document.createElement('div');
        linkedInfo.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px;';

        const linkedText = document.createElement('span');
        if (catchToEdit.linked_sighting_id) {
            linkedText.textContent = `🔗 Gekoppeld aan waarneming #${catchToEdit.linked_sighting_id}`;
        } else if (catchToEdit.linked_catch_id) {
            linkedText.textContent = `🔗 Gekoppeld aan vangst #${catchToEdit.linked_catch_id}`;
        }
        linkedText.style.cssText = 'flex: 1; color: #2e7d32;';
        linkedInfo.appendChild(linkedText);

        const unlinkBtn = document.createElement('button');
        unlinkBtn.type = 'button';
        unlinkBtn.textContent = '❌ Verwijder';
        unlinkBtn.style.cssText = 'padding: 6px 12px; background: #d32f2f; color: white; border: none; border-radius: 4px; font-size: 0.85em; cursor: pointer;';
        unlinkBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
                const pks = Phase4Utils.getPrimaryKeys(window.currentSession?.origin);

                const { error } = await supabaseManager.client
                    .from(tables.catchTable)
                    .update({
                        linked_sighting_id: null,
                        linked_catch_id: null
                    })
                    .eq(pks.catchPk, catchIdAsNumber);

                if (error) throw error;

                console.log('✓ Koppeling verwijderd');
                catchToEdit.linked_sighting_id = null;
                catchToEdit.linked_catch_id = null;
                linkedInfo.remove();
                showMessage('Koppeling verwijderd', 'success');
            } catch (error) {
                console.error('❌ Error removing link:', error);
                alert('Fout bij verwijderen koppeling: ' + error.message);
            }
        };
        linkedInfo.appendChild(unlinkBtn);
        linkedSection.appendChild(linkedInfo);
    }

    // Knop om linked catches modal te openen
    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.textContent = '🗺️ Koppel aan eerdere vis';
    linkBtn.style.cssText = 'width: 100%; padding: 10px; background: #FF9800; color: white; border: none; border-radius: 4px; font-size: 0.95em; cursor: pointer; font-weight: 500;';
    linkBtn.onclick = (e) => {
        e.preventDefault();
        openLinkedCatchMap(catchToEdit, enrichmentSession);
    };
    linkedSection.appendChild(linkBtn);
    modalContent.appendChild(linkedSection);

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Annuleren';
    cancelBtn.style.cssText = 'padding: 10px 20px;';
    cancelBtn.onclick = () => {
        if (modalOverlay && modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
        }
    };
    buttonContainer.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Opslaan';
    saveBtn.style.cssText = 'padding: 10px 20px;';
    saveBtn.onclick = async () => {
        // Validatie
        if (!fields.soort.value.trim()) {
            alert('Soort is verplicht');
            return;
        }
        if (!fields.lengte.value) {
            alert('Lengte is verplicht');
            return;
        }

        try {
            console.log('💾 Saving catch edit with two-tier strategy...');

            // ============================================================
            // GROEP 1: Basis velden → database
            // ============================================================
            const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
            const pks = Phase4Utils.getPrimaryKeys(window.currentSession?.origin);

            const updateData = {
                soort: fields.soort.value,
                lengte: parseInt(fields.lengte.value),
                aantal: parseInt(fields.aantal.value) || 1,
                diepte: fields.diepte_catch.value ? parseFloat(fields.diepte_catch.value) : null,
                vangsthoogte: fields.vangsthoogte.value || null,
            };

            // Voeg schema-specifieke kolommen toe
            updateData[DB_SCHEMA[nc.isField ? 'field_catches' : 'catches'].cols.bodemhardheid] = fields.bodemhardheid.value || null;

            // Handle time field (vangst_tijd vs catch_datetime)
            if (nc.isField) {
                if (fields.vangst_tijd.value) {
                    updateData.vangst_tijd = Phase4Utils.toLocalISOString(new Date(fields.vangst_tijd.value));
                }
            } else {
                if (fields.catch_datetime.value) {
                    updateData[DB_SCHEMA.catches.cols.catch_datetime] = Phase4Utils.toLocalISOString(new Date(fields.catch_datetime.value));
                }
            }

            if (fields.notities.value) {
                updateData[DB_SCHEMA[nc.isField ? 'field_catches' : 'catches'].cols.notities] = fields.notities.value;
            }

            console.log('💾 Groep 1: Updating', nc.isField ? 'field_catches' : 'catches', 'with:', updateData);

            const { error } = await supabaseManager.client
                .from(tables.catchTable)
                .update(updateData)
                .eq(pks.catchPk, catchIdAsNumber);

            if (error) throw error;

            // ============================================================
            // GROEP 2: Verrijkingsvelden → window.catchEnrichmentData
            // ============================================================
            const enrichmentData = {};

            // Aas naam (niet ID!)
            if (fields.aas.value) enrichmentData.aas = fields.aas.value;

            // Techniek
            if (fields.techniek.value) enrichmentData.techniek = fields.techniek.value;

            // Nieuwe verrijkingsvelden
            if (fields.vissnelheid.value) enrichmentData.vissnelheid = fields.vissnelheid.value;
            if (fields.booster.value) enrichmentData.booster = fields.booster.value;
            if (fields.gewicht.value) enrichmentData.gewicht = parseInt(fields.gewicht.value);
            if (fields.structuur.value) enrichmentData.structuur = fields.structuur.value;
            if (fields.aasvis.value) enrichmentData.aasvis = fields.aasvis.value;
            if (fields.zon_schaduw.value) enrichmentData.zon_schaduw = fields.zon_schaduw.value;

            // Override velden
            if (fields.helderheid_override.value) enrichmentData.helderheid_override = fields.helderheid_override.value;
            if (fields.stroomsnelheid_override.value) enrichmentData.stroomsnelheid_override = fields.stroomsnelheid_override.value;
            if (fields.watertemperatuur_override.value) enrichmentData.watertemperatuur_override = parseInt(fields.watertemperatuur_override.value);

            if (Object.keys(enrichmentData).length > 0) {
                window.catchEnrichmentData[catchIdAsNumber] = enrichmentData;
                console.log(`💾 Groep 2: Storing enrichment data for catch ${catchIdAsNumber}:`, enrichmentData);
            } else {
                console.log(`💾 Groep 2: No enrichment data to store for catch ${catchIdAsNumber}`);
            }

            console.log('✅ Catch updated successfully (Groep 1 → database, Groep 2 → window.catchEnrichmentData)');

            // Refresh enrichment screen
            const s = Phase4Utils.normalizeSession(enrichmentSession, window.currentSession?.origin);
            await initEnrichmentScreen(s.id);

            // Verwijder modal
            if (modalOverlay && modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }

        } catch (error) {
            console.error('❌ Error updating catch:', error);
            alert('Fout bij opslaan: ' + error.message);
        }
    };
    buttonContainer.appendChild(saveBtn);

    modalContent.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Sluit modal bij klik buiten
    // KRITIEK: Check dat LureManager niet actief is voordat je editCatchModal sluit
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            // Controleer dat LureManager niet bezig is
            if (window.lureManagerActive) {
                console.log('🔒 LureManager active, ignoring background click on editCatchModal');
                e.stopPropagation();
                e.preventDefault();
                return false;
            }

            // Controleer ook dat de LureManager modal gesloten is
            const lureModal = document.getElementById('lureModal');
            if (lureModal && lureModal.style.display !== 'none') {
                console.log('🔒 LureManager modal still visible, ignoring background click');
                e.stopPropagation();
                e.preventDefault();
                return false;
            }

            // Veilig om modal te sluiten
            document.body.removeChild(modalOverlay);
        }
    };
}

// ====================================
// LINKED CATCHES MAP
// ====================================

/**
 * Opent kaartmodal om eerdere vangsten/waarnemingen te koppelen aan huidge vangst
 * @param {Object} catch_ - Huidge vangst object
 * @param {Object} session - Sessie object voor context
 */
async function openLinkedCatchMap(catch_, session) {
    console.log('🗺️ Opening linked catches map for catch:', catch_);

    try {
        // Helper functie: bereken afstand tussen twee GPS punten
        const calculateDistance = (lat1, lng1, lat2, lng2) => {
            const R = 6371e3; // meters
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lng2-lng1) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c; // in meters
        };

        // Haal vangst GPS op
        const catchLat = catch_.gps_lat;
        const catchLng = catch_.gps_long;
        const catchTime = catch_.vangst_tijd || catch_.catch_datetime;

        if (!catchLat || !catchLng) {
            alert('Vangst heeft geen GPS coördinaten');
            return;
        }

        // Haal sightings op (waarnemingen)
        const { data: sightings, error: sightingsError } = await supabaseManager.client
            .from('sightings')
            .select('*')
            .eq('soort', catch_.soort)
            .lt('sighting_datetime', catchTime)
            .order('sighting_datetime', { ascending: false });

        if (sightingsError) throw sightingsError;

        // Filter sightings op afstand < 500m
        const nearbySightings = (sightings || []).filter(s => {
            const dist = calculateDistance(catchLat, catchLng, s.gps_lat, s.gps_long);
            return dist < 500;
        });

        // Haal catches op (eerdere vangsten)
        const { data: catches, error: catchesError } = await supabaseManager.client
            .from('catches')
            .select('*')
            .eq('soort', catch_.soort)
            .lt('catch_datetime', catchTime)
            .order('catch_datetime', { ascending: false });

        if (catchesError) throw catchesError;

        // Filter catches op afstand < 500m EN exclude huidge vangst
        const currentCatchId = catch_.id || catch_.catch_id;
        const nearbyCatches = (catches || []).filter(c => {
            const dist = calculateDistance(catchLat, catchLng, c.gps_lat, c.gps_long);
            return dist < 500 && c.catch_id !== currentCatchId;
        });

        console.log(`🗺️ Found ${nearbySightings.length} sightings and ${nearbyCatches.length} catches nearby`);

        // Maak modal overlay
        const mapModal = document.createElement('div');
        mapModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const mapContainer = document.createElement('div');
        mapContainer.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 900px;
            height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding: 15px 20px; border-bottom: 1px solid #ddd; flex-shrink: 0;';
        header.innerHTML = `
            <h3 style="margin: 0 0 5px 0; color: #1a1a1a;">🔗 Eerdere vangsten/waarnemingen</h3>
            <p style="margin: 0; color: #666; font-size: 0.85em;">Klik op een marker om deze aan de huidge vangst te koppelen</p>
        `;
        mapContainer.appendChild(header);

        // Kaart div
        const mapDiv = document.createElement('div');
        mapDiv.id = 'linkedCatchesMap';
        mapDiv.style.cssText = 'flex: 1; position: relative;';
        mapContainer.appendChild(mapDiv);

        // Footer met buttons
        const footer = document.createElement('div');
        footer.style.cssText = 'padding: 15px 20px; border-top: 1px solid #ddd; flex-shrink: 0; text-align: right;';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Sluit';
        closeBtn.style.cssText = 'padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;';
        closeBtn.onclick = () => {
            mapModal.remove();
        };
        footer.appendChild(closeBtn);
        mapContainer.appendChild(footer);

        mapModal.appendChild(mapContainer);
        document.body.appendChild(mapModal);

        // Initialiseer Leaflet kaart
        setTimeout(() => {
            const map = L.map('linkedCatchesMap').setView([catchLat, catchLng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            // Huidge vangst als groen marker
            L.marker([catchLat, catchLng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).bindPopup('📍 Huidge vangst (huisnummer)').addTo(map);

            // Waarnemingen als oranje markers
            nearbySightings.forEach(sighting => {
                L.marker([sighting.gps_lat, sighting.gps_long], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).bindPopup(`
                    <div style="font-size: 0.9em;">
                        <strong>🔍 Waarneming #${sighting.sighting_id}</strong><br>
                        Datum: ${sighting.sighting_datetime?.substring(0, 10)}<br>
                        ${sighting.zekerheid ? `Zekerheid: ${sighting.zekerheid}<br>` : ''}
                        <button onclick="linkCatchToSighting(${sighting.sighting_id})"
                                style="margin-top: 8px; padding: 6px 12px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 0.85em;">
                            🔗 Koppel aan deze
                        </button>
                    </div>
                `).addTo(map);
            });

            // Eerdere vangsten als blauwe markers
            nearbyCatches.forEach(previousCatch => {
                L.marker([previousCatch.gps_lat, previousCatch.gps_long], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).bindPopup(`
                    <div style="font-size: 0.9em;">
                        <strong>🎣 Vangst #${previousCatch.catch_id}</strong><br>
                        Datum: ${previousCatch.catch_datetime?.substring(0, 10)}<br>
                        ${previousCatch.lengte ? `Lengte: ${previousCatch.lengte}cm<br>` : ''}
                        <button onclick="linkCatchToCatch(${previousCatch.catch_id})"
                                style="margin-top: 8px; padding: 6px 12px; background: #1976D2; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 0.85em;">
                            🔗 Koppel aan deze
                        </button>
                    </div>
                `).addTo(map);
            });

        }, 100);

        // Stel global functies in voor popup buttons
        window.linkCatchToSighting = async (sightingId) => {
            try {
                const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
                const pks = Phase4Utils.getPrimaryKeys(window.currentSession?.origin);

                const { error } = await supabaseManager.client
                    .from(tables.catchTable)
                    .update({
                        linked_sighting_id: sightingId,
                        linked_catch_id: null
                    })
                    .eq(pks.catchPk, catch_.id || catch_.catch_id);

                if (error) throw error;

                console.log(`✓ Catch linked to sighting #${sightingId}`);
                alert(`Gekoppeld aan waarneming #${sightingId}`);
                mapModal.remove();

                // Refresh enrichment screen
                const s = Phase4Utils.normalizeSession(session, window.currentSession?.origin);
                await initEnrichmentScreen(s.id);
            } catch (error) {
                console.error('❌ Error linking catch to sighting:', error);
                alert('Fout bij koppelen: ' + error.message);
            }
        };

        window.linkCatchToCatch = async (previousCatchId) => {
            try {
                const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
                const pks = Phase4Utils.getPrimaryKeys(window.currentSession?.origin);

                const { error } = await supabaseManager.client
                    .from(tables.catchTable)
                    .update({
                        linked_sighting_id: null,
                        linked_catch_id: previousCatchId
                    })
                    .eq(pks.catchPk, catch_.id || catch_.catch_id);

                if (error) throw error;

                console.log(`✓ Catch linked to catch #${previousCatchId}`);
                alert(`Gekoppeld aan vangst #${previousCatchId}`);
                mapModal.remove();

                // Refresh enrichment screen
                const s = Phase4Utils.normalizeSession(session, window.currentSession?.origin);
                await initEnrichmentScreen(s.id);
            } catch (error) {
                console.error('❌ Error linking catch to catch:', error);
                alert('Fout bij koppelen: ' + error.message);
            }
        };

    } catch (error) {
        console.error('❌ Error in openLinkedCatchMap:', error);
        alert('Fout bij openen kaart: ' + error.message);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-enrichment.js loaded');
});
