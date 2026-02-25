// ====================================
// FASE 4: VERRIJKINGSSCHERM
// Edit sessiegegevens + vangsten + kaart
// ====================================

let enrichmentMap = null;
let enrichmentCatches = [];
let enrichmentSession = null;

// ====================================
// STAP 1: Init Enrichment Screen
// ====================================

/**
 * Initialiseert verrijkingsscherm met sessie + vangsten + kaart
 */
async function initEnrichmentScreen(sessionId) {
    try {
        console.log('🔧 Initializing enrichment screen...');

        // Laad sessie en vangsten
        const sessionData = await loadSessionForEnrichment(sessionId);
        enrichmentSession = sessionData.session;
        enrichmentCatches = sessionData.catches;

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

    if (origin === 'veld') {
        // Load field_session + field_catches
        const { data: session, error: sessionError } = await supabaseManager.client
            .from('field_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError) throw sessionError;

        const { data: catches, error: catchError } = await supabaseManager.client
            .from('field_catches')
            .select('*')
            .eq('field_session_id', sessionId)
            .order('vangst_tijd', { ascending: true });

        if (catchError) throw catchError;

        return {
            session: session,
            catches: catches || []
        };
    } else {
        // Load manual session + catches
        const { data: session, error: sessionError } = await supabaseManager.client
            .from('sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (sessionError) throw sessionError;

        const { data: catches, error: catchError } = await supabaseManager.client
            .from('catches')
            .select('*')
            .eq('session_id', sessionId)
            .order('catch_datetime', { ascending: true });

        if (catchError) throw catchError;

        return {
            session: session,
            catches: catches || []
        };
    }
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

    // Bepaal welke velden aanwezig zijn
    const isFieldSession = window.currentSession?.origin === 'veld';

    // Map veld-sessie → display names
    const fields = [
        {
            key: isFieldSession ? 'datum' : 'session_start_date',
            label: 'Datum',
            type: 'date',
            readonly: true
        },
        {
            key: isFieldSession ? 'locatie' : 'locatie',
            label: 'Locatie',
            type: 'text',
            editable: true
        },
        {
            key: isFieldSession ? 'start_tijd' : 'session_start_datetime',
            label: 'Starttijd',
            type: 'datetime-local',
            readonly: true
        },
        {
            key: isFieldSession ? 'eind_tijd' : 'session_end_datetime',
            label: 'Eindtijd',
            type: 'datetime-local',
            editable: true
        },
        {
            key: isFieldSession ? 'watersoort' : 'watersoort',
            label: 'Watersoort',
            type: 'select',
            options: ['Rivier', 'Gracht', 'Meer', 'Kanaal', 'Polder', 'Park', 'Vijver'],
            editable: true
        },
        {
            key: isFieldSession ? 'stroomsnelheid' : 'stroomsnelheid',
            label: 'Stroomsnelheid',
            type: 'select',
            options: ['Stilstaand tot licht stromend', 'Licht tot matig stromend', 'Snelstromend'],
            editable: true
        },
        {
            key: isFieldSession ? 'watertemperatuur' : 'watertemperatuur_measured',
            label: 'Water temp (°C)',
            type: 'number',
            editable: true
        },
        {
            key: isFieldSession ? 'helderheid' : 'helderheid',
            label: 'Helderheid',
            type: 'select',
            options: ['Zeer troebel', 'Troebel', 'Matig helder', 'Helder', 'Kristal helder'],
            editable: true
        }
    ];

    // Render velden
    fields.forEach(field => {
        const value = session[field.key];
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; flex-direction: column;';

        const label = document.createElement('label');
        label.style.cssText = 'font-weight: 600; margin-bottom: 5px; color: #333; font-size: 0.9em;';
        label.textContent = field.label;

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

            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                option.selected = value === opt;
                select.appendChild(option);
            });

            if (field.editable && !field.readonly) {
                select.onchange = (e) => {
                    enrichmentSession[field.key] = e.target.value;
                    saveSessionData();
                };
            }

            div.appendChild(label);
            div.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = field.type;
            input.value = value || '';
            input.style.cssText = `
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9em;
                ${field.readonly ? 'background: #f0f0f0; cursor: not-allowed;' : ''}
            `;
            input.disabled = field.readonly;

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
        const isFieldSession = window.currentSession?.origin === 'veld';

        if (isFieldSession) {
            const { error } = await supabaseManager.client
                .from('field_sessions')
                .update({
                    locatie: enrichmentSession.locatie,
                    eind_tijd: enrichmentSession.eind_tijd,
                    watersoort: enrichmentSession.watersoort,
                    stroomsnelheid: enrichmentSession.stroomsnelheid,
                    watertemperatuur: enrichmentSession.watertemperatuur,
                    helderheid: enrichmentSession.helderheid
                })
                .eq('id', enrichmentSession.id);

            if (error) throw error;
        } else {
            const { error } = await supabaseManager.client
                .from('sessions')
                .update({
                    locatie: enrichmentSession.locatie,
                    session_end_datetime: enrichmentSession.session_end_datetime,
                    watersoort: enrichmentSession.watersoort,
                    stroomsnelheid: enrichmentSession.stroomsnelheid,
                    watertemperatuur_measured: enrichmentSession.watertemperatuur_measured,
                    helderheid: enrichmentSession.helderheid
                })
                .eq('id', enrichmentSession.id);

            if (error) throw error;
        }

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

        // Bepaal welke kolommen te gebruiken
        const isFieldCatch = window.currentSession?.origin === 'veld';
        const soort = catch_.soort;
        const lengte = isFieldCatch ? catch_.lengte : catch_.lengte;
        const aantal = catch_.aantal;
        const time = isFieldCatch ? catch_.vangst_tijd : catch_.catch_datetime;
        const notities = isFieldCatch ? catch_.notities : catch_.waypoint_naam;

        const timeStr = time ? new Date(time).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : '—';

        row.innerHTML = `
            <td style="padding: 10px;">${soort}</td>
            <td style="padding: 10px;">${lengte || '—'}</td>
            <td style="padding: 10px;">${aantal}</td>
            <td style="padding: 10px;">${timeStr}</td>
            <td style="padding: 10px;">${notities || '—'}</td>
            <td style="padding: 10px; text-align: center;">
                <button class="btn btn-primary" onclick="editCatchModal('${catch_.id}', '${isFieldCatch}')" style="padding: 4px 8px; font-size: 0.8em; margin-right: 5px;">Bewerk</button>
                <button class="btn btn-danger" onclick="deleteCatch('${catch_.id}', '${isFieldCatch}')" style="padding: 4px 8px; font-size: 0.8em;">Verwijder</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    section.appendChild(table);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-success';
    addBtn.textContent = '➕ Vangst Toevoegen';
    addBtn.style.cssText = 'margin-bottom: 15px;';
    addBtn.onclick = () => addNewCatchModal();
    section.appendChild(addBtn);

    container.appendChild(section);
}

// ====================================
// STAP 6: Add/Edit/Delete Catches
// ====================================

/**
 * Modal voor nieuwe vangst
 */
function addNewCatchModal() {
    console.log('Opening new catch modal...');
    alert('Klik op de kaart links om een vangst op die locatie toe te voegen');
}

/**
 * Verwijdert vangst met bevestiging
 */
async function deleteCatch(catchId, isFieldCatch) {
    if (!confirm('Weet je zeker dat je deze vangst wilt verwijderen?')) {
        return;
    }

    try {
        if (isFieldCatch === 'true') {
            const { error } = await supabaseManager.client
                .from('field_catches')
                .delete()
                .eq('id', catchId);

            if (error) throw error;
        } else {
            const { error } = await supabaseManager.client
                .from('catches')
                .delete()
                .eq('id', catchId);

            if (error) throw error;
        }

        console.log('✓ Catch deleted');

        // Reload
        enrichmentCatches = enrichmentCatches.filter(c => c.id !== catchId);
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
 * Modal voor bewerken vangst (placeholder)
 */
function editCatchModal(catchId, isFieldCatch) {
    alert('Bewerk functie niet geïmplementeerd in deze fase');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-enrichment.js loaded');
});
