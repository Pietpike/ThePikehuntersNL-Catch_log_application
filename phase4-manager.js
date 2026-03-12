// ====================================
// FASE 4: CONCEPT SESSIES MANAGER
// Startscherm: Overzicht van onverwerkte sessies
// ====================================

// Huidige sessie in verwerking
window.currentSession = null;

// ====================================
// STAP 1: Load Unprocessed Sessions
// ====================================

/**
 * Laadt alle onverwerkte sessies:
 * - Uit field_sessions: session_id IS NULL AND genegeerd = FALSE
 * - Uit sessions: definitief = FALSE
 * Combineert in één array, gesorteerd op datum DESC
 */
async function loadUnprocessedSessions() {
    try {
        console.log('📋 Loading unprocessed sessions...');

        // Load veld-sessies (field_sessions)
        const { data: fieldSessions, error: fieldError } = await supabaseManager.client
            .from(DB_SCHEMA.field_sessions.table)
            .select('*, field_catches(count)')
            .eq(DB_SCHEMA.field_sessions.cols.genegeerd, false)
            .is(DB_SCHEMA.field_sessions.cols.session_id, null)
            .order(DB_SCHEMA.field_sessions.cols.datum, { ascending: false });

        if (fieldError) throw fieldError;

        // Load handmatig aangemaakte sessies (sessions tabel)
        // WHERE definitief = FALSE AND genegeerd = FALSE
        const { data: manualSessions, error: manualError } = await supabaseManager.client
            .from(DB_SCHEMA.sessions.table)
            .select('*, catches(count)')
            .eq(DB_SCHEMA.sessions.cols.definitief, false)
            .eq(DB_SCHEMA.sessions.cols.genegeerd, false)
            .order(DB_SCHEMA.sessions.cols.session_start_date, { ascending: false });

        if (manualError) throw manualError;

        // Combineer en transform
        const allSessions = [];

        // Helper: Normaliseer datum naar YYYY-MM-DD formaat
        const normalizeDateToISO = (dateValue) => {
            if (!dateValue) return null;

            // Als het al ISO formaat is (YYYY-MM-DD), return as-is
            if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
                return dateValue.split('T')[0]; // Verwijder tijd als aanwezig
            }

            // Probeer de datum te parsen als Date object
            if (dateValue instanceof Date) {
                return dateValue.toISOString().split('T')[0];
            }

            // Als het een string is, probeer het te parsen
            if (typeof dateValue === 'string') {
                const parsed = new Date(dateValue);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString().split('T')[0];
                }
            }

            return null;
        };

        // Voeg veld-sessies toe met origin = 'veld'
        if (fieldSessions && fieldSessions.length > 0) {
            fieldSessions.forEach(session => {
                const normalizedDate = normalizeDateToISO(session.datum);
                allSessions.push({
                    ...session,
                    origin: 'veld',
                    catchCount: session.field_catches?.[0]?.count || 0,
                    date: normalizedDate,
                    rawDateValue: session.datum, // Voor debugging
                    startTime: session.start_tijd,
                    endTime: session.eind_tijd,
                    location: session.locatie
                });
            });
        }

        // Voeg handmatige sessies toe met origin = 'handmatig'
        if (manualSessions && manualSessions.length > 0) {
            manualSessions.forEach(session => {
                const normalizedDate = normalizeDateToISO(session.session_start_date);
                allSessions.push({
                    ...session,
                    origin: 'handmatig',
                    catchCount: session.catches?.[0]?.count || 0,
                    date: normalizedDate,
                    rawDateValue: session.session_start_date, // Voor debugging
                    startTime: session.session_start_datetime,
                    endTime: session.session_end_datetime,
                    location: session.locatie
                });
            });
        }

        // Sorteer op datum DESC (dates zijn al in YYYY-MM-DD formaat, dus string compare werkt)
        allSessions.sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return b.date.localeCompare(a.date); // YYYY-MM-DD strings zijn lexicographisch sorteerbaar
        });

        renderSessionOverview(allSessions);

    } catch (error) {
        console.error('❌ Error loading sessions:', error);
        alert('Fout bij laden sessies: ' + error.message);
    }
}

// ====================================
// STAP 2: Render Overview
// ====================================

/**
 * Groepeert sessies op datum en rendert overzicht
 */
function renderSessionOverview(sessions) {
    const container = document.getElementById('phase4OverviewContent');
    if (!container) {
        console.error('phase4OverviewContent container not found');
        return;
    }

    container.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Geen onverwerkte sessies gevonden</div>';
        return;
    }

    // Groepeer op datum (zonder new Date() parsing om formaat-problemen te voorkomen)
    const groupedByDate = {};
    sessions.forEach(session => {
        // session.date is al genormaliseerd naar YYYY-MM-DD formaat
        if (!session.date) {
            return;
        }

        // Zet YYYY-MM-DD string om naar Nederlands datumformaat
        const [year, month, day] = session.date.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // Maanden zijn 0-indexed

        const dateKey = dateObj.toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(session);
    });

    // Render per datum-groep
    Object.entries(groupedByDate).forEach(([dateKey, sessionsInDate]) => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'phase4-date-group';
        dateGroup.style.marginBottom = '20px';

        // Datum header
        const header = document.createElement('h4');
        header.style.cssText = 'margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 8px;';
        header.textContent = dateKey;
        dateGroup.appendChild(header);

        // Sessiekaarten
        const cardsContainer = document.createElement('div');
        cardsContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 15px;';

        sessionsInDate.forEach(session => {
            cardsContainer.appendChild(renderSessionCard(session));
        });

        dateGroup.appendChild(cardsContainer);
        container.appendChild(dateGroup);
    });
}

/**
 * Rendert kaart voor één sessie
 */
function renderSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'phase4-session-card';
    card.style.cssText = `
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
    `;

    card.onmouseover = () => card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
    card.onmouseout = () => card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

    // Header met origin badge
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;';

    const titleDiv = document.createElement('div');
    const locationEl = document.createElement('h4');
    locationEl.style.cssText = 'margin: 0 0 5px 0; color: #1a1a1a; font-size: 1.1em;';
    locationEl.textContent = session.location || '(onbekend)';

    const originBadge = document.createElement('span');
    originBadge.className = 'phase4-origin-badge';
    const badge = Phase4Utils.getSessionBadge(session.origin);
    originBadge.style.cssText = `
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.75em;
        font-weight: 600;
        background: ${badge.backgroundColor}; color: ${badge.color};
    `;
    originBadge.textContent = badge.label;

    titleDiv.appendChild(locationEl);
    titleDiv.appendChild(originBadge);
    header.appendChild(titleDiv);
    card.appendChild(header);

    // Sessie details
    const details = document.createElement('div');
    details.style.cssText = 'font-size: 0.9em; color: #666; margin-bottom: 12px;';

    const startTimeStr = session.startTime ? new Date(session.startTime).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : '—';
    const endTimeStr = session.endTime ? new Date(session.endTime).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : '—';

    details.innerHTML = `
        <div>Start: ${startTimeStr}</div>
        <div>Eind: ${endTimeStr}</div>
        <div style="margin-top: 8px;"><strong>${session.catchCount || 0} vangsten</strong></div>
    `;
    card.appendChild(details);

    // Buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex; gap: 8px; margin-top: 12px;';

    // Bepaal session ID (veld-sessies hebben 'id', handmatige sessies hebben 'session_id')
    const s = Phase4Utils.normalizeSession(session, session.origin);
    const sessionId = s.id;

    // Verrijken button
    const enrichBtn = document.createElement('button');
    enrichBtn.className = 'btn btn-primary';
    enrichBtn.style.cssText = 'flex: 1; padding: 8px 12px; font-size: 0.9em;';
    enrichBtn.textContent = 'Verrijken →';
    enrichBtn.onclick = () => openEnrichmentScreen(sessionId, session.origin);

    // Verwijderen button (voor beide veld-sessies en handmatige sessies)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.style.cssText = 'flex: 1; padding: 8px 12px; font-size: 0.9em;';
    deleteBtn.textContent = '🗑️ Verwijderen';
    deleteBtn.onclick = () => deleteSessionWithConfirm(sessionId, session.origin);

    // Beide buttons altijd beschikbaar
    buttonGroup.appendChild(enrichBtn);
    buttonGroup.appendChild(deleteBtn);

    card.appendChild(buttonGroup);
    return card;
}

// ====================================
// STAP 3: Delete Session
// ====================================

/**
 * Verwijdert sessie met bevestigingsdialoog
 * Voor veld-sessies: UPDATE field_sessions SET genegeerd = TRUE
 * Voor handmatige sessies: UPDATE sessions SET genegeerd = TRUE
 */
async function deleteSessionWithConfirm(sessionId, origin) {
    if (!confirm('Weet je zeker dat je deze sessie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        return;
    }

    try {
        const tables = Phase4Utils.getTableNames(origin);
        const pks = Phase4Utils.getPrimaryKeys(origin);

        // UPDATE session als genegeerd
        const { error } = await supabaseManager.client
            .from(tables.sessionTable)
            .update({ [DB_SCHEMA.field_sessions.cols.genegeerd]: true })
            .eq(pks.sessionPk, sessionId);

        if (error) throw error;

        console.log(`✓ ${origin === 'veld' ? 'Veld' : 'Handmatige'}-sessie gemarkeerd als genegeerd`);

        showStatus('Sessie verwijderd', 'success');

        // Refresh overzicht
        loadUnprocessedSessions();

    } catch (error) {
        console.error('❌ Error deleting session:', error);
        alert('Fout bij verwijderen: ' + error.message);
    }
}

// ====================================
// STAP 4: Open Enrichment Screen
// ====================================

/**
 * Slaat sessie op in window.currentSession en navigeert naar verrijkingsscherm
 */
async function openEnrichmentScreen(sessionId, origin) {
    try {
        console.log(`🔧 Opening enrichment screen for ${origin} session: ${sessionId}`);

        // Laad volledige sessie-data
        const tables = Phase4Utils.getTableNames(origin);
        const pks = Phase4Utils.getPrimaryKeys(origin);

        const { data: sessionData, error } = await supabaseManager.client
            .from(tables.sessionTable)
            .select('*')
            .eq(pks.sessionPk, sessionId)
            .single();

        if (error) throw error;

        // Sla op in global state
        window.currentSession = {
            ...sessionData,
            origin: origin,
            dbId: sessionId
        };

        console.log('✓ Current session set:', window.currentSession);

        // Switch naar enrichment scherm
        showPhase4Screen();

        // Zet enrichment scherm zichtbaar
        const enrichment = document.getElementById('phase4Enrichment');
        const overview = document.getElementById('phase4OverviewScreen');
        if (enrichment) enrichment.style.display = 'block';
        if (overview) overview.style.display = 'none';

        // Trigger enrichment scherm init
        if (typeof initEnrichmentScreen === 'function') {
            setTimeout(() => {
                initEnrichmentScreen(sessionId);
            }, 100);
        }

    } catch (error) {
        // 🔍 DEBUG: Volledige error details voor troubleshooting
        console.error('❌ Error opening enrichment - FULL DETAILS:');
        console.error('Error object:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('Error name:', error?.name);
        console.error('Current session state:', window.currentSession);
        console.error('SessionId:', sessionId);
        alert('Fout bij openen sessie: ' + error.message);
    }
}

// ====================================
// Helper: Show/Hide Phase4 Screen
// ====================================

/**
 * Toont fase4-container en verbergt rest van app
 */
function showPhase4Screen() {
    const phase4 = document.getElementById('phase4Container');
    const mainContent = document.querySelector('.main-content');
    const dataInput = document.querySelector('.data-input-section');
    const overview = document.getElementById('phase4OverviewScreen');

    if (phase4) {
        phase4.style.display = 'block';
    }
    if (mainContent) mainContent.style.display = 'none';
    if (dataInput) dataInput.style.display = 'none';

    // Load overzicht
    loadUnprocessedSessions();

    // Show overview scherm
    const enrichment = document.getElementById('phase4Enrichment');
    const validation = document.getElementById('phase4Validation');

    if (overview) overview.style.display = 'block';
    if (enrichment) enrichment.style.display = 'none';
    if (validation) validation.style.display = 'none';
}

/**
 * Verbergt fase4 en toont rest van app
 */
function hidePhase4Screen() {
    const phase4 = document.getElementById('phase4Container');
    const mainContent = document.querySelector('.main-content');
    const dataInput = document.querySelector('.data-input-section');

    if (phase4) {
        phase4.style.display = 'none';
    }
    if (mainContent) {
        mainContent.style.display = 'grid';
    }
    if (dataInput) {
        dataInput.style.display = 'block';
    }

    window.currentSession = null;
    enrichmentSession = null;
    enrichmentCatches = [];

    console.log('✓ Phase 4 hidden, app view restored');
}

/**
 * Terug naar fase4-overview scherm
 * KRITIEK: Sla alle sessie-gegevens op voordat terug wordt gegaan
 * Dit zorgt dat even ongesaved veranderingen (b.v. locatie dropdown) worden opgeslagen
 */
async function backToOverview() {
    console.log('← Going back to overview...');

    // ⭐ KRITIEK: Sla alle sessie-gegevens op VOORDAT we teruggaan
    // Dit zorgt dat locatie-dropdown en andere velden worden opgeslagen zelfs als onchange niet triggerde
    if (typeof saveSessionData === 'function') {
        try {
            console.log('💾 Saving session data before returning to overview...');
            await saveSessionData();
            console.log('✓ Session data saved');
        } catch (error) {
            console.error('⚠️ Warning: Could not save session data:', error);
            // Continue anyway - we're just going back to overview
        }
    }

    // Nu teruggaan naar overview
    window.currentSession = null;

    // Zet visibility
    const overview = document.getElementById('phase4OverviewScreen');
    const enrichment = document.getElementById('phase4Enrichment');
    const validation = document.getElementById('phase4Validation');

    if (overview) overview.style.display = 'block';
    if (enrichment) enrichment.style.display = 'none';
    if (validation) validation.style.display = 'none';

    // Refresh overview
    loadUnprocessedSessions();
}

// ====================================
// NIEUWE SESSIE MODAL
// ====================================

/**
 * Toon modal voor aanmaken nieuwe handmatige sessie
 * Integreert met Phase 4 workflow
 */
function showNewSessionModal() {
    console.log('📋 Opening new session modal...');

    // Maak modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'newSessionModal-overlay';
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

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // Modal Header
    const header = document.createElement('h3');
    header.textContent = '➕ Nieuwe Handmatige Sessie';
    header.style.cssText = 'margin: 0 0 20px 0; color: #1a1a1a;';
    modalContent.appendChild(header);

    // Formulier
    const form = document.createElement('div');
    form.style.cssText = `
        display: grid;
        gap: 15px;
        margin-bottom: 20px;
    `;

    // Helper: Maak een form field
    const addField = (label, type, name, value = '', required = false) => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; flex-direction: column;';

        const labelEl = document.createElement('label');
        labelEl.textContent = label + (required ? ' *' : '');
        labelEl.style.cssText = 'font-weight: 600; margin-bottom: 5px; color: #333;';
        div.appendChild(labelEl);

        let input;
        if (type === 'select') {
            input = document.createElement('select');
            input.style.cssText = 'padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95em;';

            // Voeg lege optie toe
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '— Selecteer —';
            input.appendChild(emptyOpt);

            // Voeg locaties toe
            const locations = typeof LocationManager !== 'undefined' ? LocationManager.getAll() : [];
            locations.forEach(loc => {
                const opt = document.createElement('option');
                opt.value = loc;
                opt.textContent = loc;
                input.appendChild(opt);
            });
        } else {
            input = document.createElement('input');
            input.type = type;
            input.style.cssText = 'padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.95em;';
            input.value = value;
        }

        input.name = name;
        if (required) input.required = true;
        div.appendChild(input);
        form.appendChild(div);
        return input;
    };

    // Velden
    const fields = {};

    // Vandaag als default datum
    const today = new Date().toISOString().split('T')[0];
    fields.datum = addField('Datum', 'date', 'datum', today, true);
    fields.startTijd = addField('Starttijd', 'time', 'startTijd', '09:00', true);
    fields.eindTijd = addField('Eindtijd', 'time', 'eindTijd', '17:00', true);
    fields.locatie = addField('Locatie', 'select', 'locatie', '', true);

    modalContent.appendChild(form);

    // Knoppen
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Annuleren';
    cancelBtn.onclick = () => {
        if (modalOverlay && modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
        }
    };
    buttonContainer.appendChild(cancelBtn);

    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-primary';
    createBtn.textContent = 'Aanmaken';
    createBtn.onclick = async () => {
        // Validatie
        if (!fields.datum.value.trim()) {
            alert('Datum is verplicht');
            return;
        }
        if (!fields.startTijd.value.trim()) {
            alert('Starttijd is verplicht');
            return;
        }
        if (!fields.eindTijd.value.trim()) {
            alert('Eindtijd is verplicht');
            return;
        }
        if (!fields.locatie.value.trim()) {
            alert('Locatie is verplicht');
            return;
        }

        try {
            console.log('💾 Creating new session...');

            const datum = fields.datum.value;
            const startTijd = fields.startTijd.value;
            const eindTijd = fields.eindTijd.value;
            const locatie = fields.locatie.value;

            // Construeer datetimes als lokale strings (zonder UTC conversie)
            const startDatetimeStr = `${datum}T${startTijd}:00`;
            const endDatetimeStr = `${datum}T${eindTijd}:00`;

            // Valideer dat eindtijd na starttijd is (string compare genoeg voor HH:MM format)
            if (endDatetimeStr <= startDatetimeStr) {
                alert('Eindtijd moet na starttijd liggen');
                return;
            }

            // Extraheer uur en maand
            const startHour = parseInt(startTijd.split(':')[0]);
            const startDateObj = new Date(datum);  // Alleen voor maand extractie
            const startMonth = startDateObj.getMonth() + 1;

            // Genereer sessie naam met starttijd en unieke code voor uniciteit
            const datumFormatted = new Date(datum).toLocaleDateString('nl-NL');
            const uniqueCode = Math.floor(1000 + Math.random() * 9000);
            const sessionName = `Handmatig - ${datumFormatted} ${startTijd} ${locatie} ${uniqueCode}`;

            // Insert naar database
            const insertData = {
                session_start_date: datum,
                session_start_datetime: startDatetimeStr,  // ← Lokale tijd string, geen UTC conversie
                session_end_datetime: endDatetimeStr,      // ← Lokale tijd string, geen UTC conversie
                session_start_hour: startHour,
                session_start_month: startMonth,
                locatie: locatie,
                definitief: false,
                genegeerd: false,
                sessie_naam: sessionName,
                team_member: supabaseManager?.teamMember || 'unknown',
                gpx_filename: null,
                watertemperatuur_measured: null,
                helderheid: null,
                stroomsnelheid: null,
                watersoort: null,
                weather_id: null
            };

            console.log('📋 Insert data:', insertData);

            const { data: newSession, error } = await supabaseManager.client
                .from(DB_SCHEMA.sessions.table)
                .insert(insertData)
                .select();

            if (error) throw error;

            console.log('✅ Session created:', newSession[0]);

            // Sluit modal
            if (modalOverlay && modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }

            // Toon succes bericht
            if (typeof showStatus === 'function') {
                showStatus(`✅ Sessie aangemaakt: ${sessionName}`, 'success');
            }

            // Refresh overview
            loadUnprocessedSessions();

        } catch (error) {
            console.error('❌ Error creating session:', error);
            alert('Fout bij aanmaken sessie: ' + error.message);
        }
    };
    buttonContainer.appendChild(createBtn);

    modalContent.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Sluit modal bij klik buiten
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-manager.js loaded');

    // Export function to window
    window.showNewSessionModal = showNewSessionModal;
});
