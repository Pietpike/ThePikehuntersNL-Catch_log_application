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
        const { data: fieldSessions, error: fieldError } = await supabaseClient
            .from('field_sessions')
            .select('*, field_catches(count)')
            .eq('genegeerd', false)
            .is('session_id', null)
            .order('datum', { ascending: false });

        if (fieldError) throw fieldError;
        console.log(`✓ Loaded ${fieldSessions?.length || 0} field sessions`);

        // Load handmatig aangemaakte sessies (sessions tabel)
        const { data: manualSessions, error: manualError } = await supabaseClient
            .from('sessions')
            .select('*, catches(count)')
            .eq('definitief', false)
            .order('session_start_date', { ascending: false });

        if (manualError) throw manualError;
        console.log(`✓ Loaded ${manualSessions?.length || 0} manual sessions`);

        // Combineer en transform
        const allSessions = [];

        // Voeg veld-sessies toe met origin = 'veld'
        if (fieldSessions && fieldSessions.length > 0) {
            fieldSessions.forEach(session => {
                allSessions.push({
                    ...session,
                    origin: 'veld',
                    catchCount: session.field_catches?.[0]?.count || 0,
                    date: session.datum,
                    startTime: session.start_tijd,
                    endTime: session.eind_tijd,
                    location: session.locatie
                });
            });
        }

        // Voeg handmatige sessies toe met origin = 'handmatig'
        if (manualSessions && manualSessions.length > 0) {
            manualSessions.forEach(session => {
                allSessions.push({
                    ...session,
                    origin: 'handmatig',
                    catchCount: session.catches?.[0]?.count || 0,
                    date: session.session_start_date,
                    startTime: session.session_start_datetime,
                    endTime: session.session_end_datetime,
                    location: session.locatie
                });
            });
        }

        // Sorteer op datum DESC
        allSessions.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
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

    // Groepeer op datum
    const groupedByDate = {};
    sessions.forEach(session => {
        const dateKey = new Date(session.date).toLocaleDateString('nl-NL', {
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

    // Verrijken button
    const enrichBtn = document.createElement('button');
    enrichBtn.className = 'btn btn-primary';
    enrichBtn.style.cssText = 'flex: 1; padding: 8px 12px; font-size: 0.9em;';
    enrichBtn.textContent = 'Verrijken →';
    enrichBtn.onclick = () => openEnrichmentScreen(session.id, session.origin);

    // Verwijderen button (alleen voor veld-sessies)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.style.cssText = 'flex: 1; padding: 8px 12px; font-size: 0.9em;';
    deleteBtn.textContent = '🗑️ Verwijderen';
    deleteBtn.onclick = () => deleteSessionWithConfirm(session.id, session.origin);

    // Verwijder-knop is alleen voor veld-sessies
    if (session.origin === 'veld') {
        buttonGroup.appendChild(enrichBtn);
        buttonGroup.appendChild(deleteBtn);
    } else {
        enrichBtn.style.flex = '1';
        buttonGroup.appendChild(enrichBtn);
    }

    card.appendChild(buttonGroup);
    return card;
}

// ====================================
// STAP 3: Delete Session
// ====================================

/**
 * Verwijdert sessie met bevestigingsdialoog
 * Voor veld-sessies: SET genegeerd = TRUE
 */
async function deleteSessionWithConfirm(sessionId, origin) {
    if (origin !== 'veld') {
        alert('Handmatige sessies kunnen niet worden verwijderd');
        return;
    }

    if (!confirm('Weet je zeker dat je deze sessie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        return;
    }

    try {
        // UPDATE field_sessions SET genegeerd = TRUE
        const { error } = await supabaseClient
            .from('field_sessions')
            .update({ genegeerd: true })
            .eq('id', sessionId);

        if (error) throw error;

        console.log('✓ Sessie gemarkeerd als genegeerd');
        alert('Sessie verwijderd');

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
            const { data, error } = await supabaseClient
                .from('field_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            sessionData = data;
        } else {
            const { data, error } = await supabaseClient
                .from('sessions')
                .select('*')
                .eq('id', sessionId)
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
