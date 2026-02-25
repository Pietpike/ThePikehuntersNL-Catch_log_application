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
            .from('field_sessions')
            .select('*, field_catches(count)')
            .eq('genegeerd', false)
            .is('session_id', null)
            .order('datum', { ascending: false });

        if (fieldError) throw fieldError;
        console.log(`✓ Loaded ${fieldSessions?.length || 0} field sessions`);

        // Load handmatig aangemaakte sessies (sessions tabel)
        // WHERE definitief = FALSE AND genegeerd = FALSE
        const { data: manualSessions, error: manualError } = await supabaseManager.client
            .from('sessions')
            .select('*, catches(count)')
            .eq('definitief', false)
            .eq('genegeerd', false)
            .order('session_start_date', { ascending: false });

        if (manualError) throw manualError;
        console.log(`✓ Loaded ${manualSessions?.length || 0} manual sessions`);

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
                // 🔍 DEBUG: Log ruwe waarde en genormaliseerde waarde
                console.log('🎯 FIELD SESSION - RAW DATUM:', {
                    rawValue: session.datum,
                    type: typeof session.datum,
                    normalized: normalizedDate,
                    sessionName: session.sessie_naam
                });
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
                // 🔍 DEBUG: Log ruwe waarde en genormaliseerde waarde
                console.log('📝 MANUAL SESSION - RAW SESSION_START_DATE:', {
                    rawValue: session.session_start_date,
                    type: typeof session.session_start_date,
                    normalized: normalizedDate,
                    sessionName: session.sessie_naam
                });
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

        console.log(`📊 Total unprocessed sessions: ${allSessions.length}`);
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
            console.warn('⚠️ Session zonder geldige datum:', session);
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

        // 🔍 DEBUG: Log groeperings-informatie
        console.log(`📊 GROUPING [${session.origin}]: ${session.rawDateValue} → normalized: ${session.date} → dateKey: "${dateKey}"`);

        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(session);
    });

    // 🔍 DEBUG: Log finale groepering
    console.log('📋 FINAL GROUPED DATES:', Object.keys(groupedByDate));

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
    originBadge.style.cssText = `
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.75em;
        font-weight: 600;
        ${session.origin === 'veld'
            ? 'background: #FFF3E0; color: #E65100;'
            : 'background: #E3F2FD; color: #0D47A1;'}
    `;
    originBadge.textContent = session.origin === 'veld' ? '🎯 Veld' : '📝 Handmatig';

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
    const sessionId = session.origin === 'veld' ? session.id : session.session_id;

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
        if (origin === 'veld') {
            // Veld-sessie: UPDATE field_sessions SET genegeerd = TRUE
            const { error } = await supabaseManager.client
                .from('field_sessions')
                .update({ genegeerd: true })
                .eq('id', sessionId);

            if (error) throw error;

            console.log('✓ Veld-sessie gemarkeerd als genegeerd');
        } else {
            // Handmatige sessie: UPDATE sessions SET genegeerd = TRUE
            const { error } = await supabaseManager.client
                .from('sessions')
                .update({ genegeerd: true })
                .eq('session_id', sessionId);

            if (error) throw error;

            console.log('✓ Handmatige sessie gemarkeerd als genegeerd');
        }

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
        let sessionData;

        if (origin === 'veld') {
            const { data, error } = await supabaseManager.client
                .from('field_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            sessionData = data;
        } else {
            const { data, error } = await supabaseManager.client
                .from('sessions')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            if (error) throw error;
            sessionData = data;
        }

        // Sla op in global state
        window.currentSession = {
            ...sessionData,
            origin: origin,
            dbId: sessionId
        };

        console.log('✓ Current session set:', window.currentSession);

        // Switch naar enrichment scherm
        SectionController.loadSection('phase4');

        // Trigger enrichment scherm init
        if (typeof initEnrichmentScreen === 'function') {
            setTimeout(() => {
                initEnrichmentScreen(sessionId);
            }, 100);
        }

    } catch (error) {
        console.error('❌ Error opening enrichment:', error);
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
 */
function backToOverview() {
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-manager.js loaded');
});
