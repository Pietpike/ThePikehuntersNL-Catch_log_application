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
        // Converteer catchId naar number voor consistentie
        const catchIdAsNumber = parseInt(catchId);

        if (isFieldCatch === 'true') {
            const { error } = await supabaseManager.client
                .from('field_catches')
                .delete()
                .eq('id', catchIdAsNumber);

            if (error) throw error;
        } else {
            const { error } = await supabaseManager.client
                .from('catches')
                .delete()
                .eq('id', catchIdAsNumber);

            if (error) throw error;
        }

        console.log('✓ Catch deleted');

        // Reload
        enrichmentCatches = enrichmentCatches.filter(c => c.id !== catchIdAsNumber);
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
 * Groep 1 (field_catches/catches tabellen): soort, lengte, aantal, vangst_tijd/catch_datetime, notities/waypoint_naam
 * Groep 2 (window.catchEnrichmentData): aas, techniek, diepte, bodemhardheid, helderheid override, stroomsnelheid override, watertemperatuur override
 */
async function editCatchModal(catchId, isFieldCatch) {
    console.log('✏️ EDIT BUTTON CLICKED!', { catchId, isFieldCatch });

    // Converteer catchId naar number omdat c.id in database een number is
    const catchIdAsNumber = parseInt(catchId);

    // Vind de vangst in enrichmentCatches array op id veld
    const catchToEdit = enrichmentCatches.find(c => c.id === catchIdAsNumber);

    if (!catchToEdit) {
        console.error('❌ Vangst niet gevonden! catchId:', catchId);
        alert('Vangst niet gevonden');
        return;
    }

    // Bepaal tabel en origin
    const isFieldOrigin = isFieldCatch === 'true' || isFieldCatch === true;

    // Haal bestaande verrijkingsdata op voor deze vangst (als aanwezig)
    const existingEnrichment = window.catchEnrichmentData[catchIdAsNumber] || {};

    // Maak modal overlay
    const modalOverlay = document.createElement('div');
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
            input.value = value || '';
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
    if (isFieldOrigin) {
        fields.vangst_tijd = addField('Vangst Tijd', 'vangst_tijd', 'datetime-local', null, catchToEdit.vangst_tijd);
        fields.notities = addField('Notities', 'notities', 'text', null, catchToEdit.notities);
    } else {
        fields.catch_datetime = addField('Vangst Tijd', 'catch_datetime', 'datetime-local', null, catchToEdit.catch_datetime);
        fields.waypoint_naam = addField('Notities', 'waypoint_naam', 'text', null, catchToEdit.waypoint_naam);
    }

    // ============================================================
    // GROEP 2: Verrijkingsvelden (opslaan in window.catchEnrichmentData)
    // ============================================================
    addSectionHeader('✨ Verrijking (opslaan in sessie, nog niet in database)');

    // Velden die voorkomen in beide types
    fields.aas = addField('Aas', 'aas', 'select',
        ['Kunstaaas', 'Natuurlijke aas', 'Paste', 'Corn', 'Boilie', 'Lever', 'Bloedworm'],
        existingEnrichment.aas
    );
    fields.techniek = addField('Techniek', 'techniek', 'select',
        ['Dropshot', 'Jiggen', 'C-rig', 'T-rig', 'Trollen', 'Spinning', 'Verticalen', 'Jerk', 'Twitch', 'N-rig', 'Cheb-rig'],
        existingEnrichment.techniek
    );
    fields.diepte = addField('Diepte (m)', 'diepte', 'number', null, existingEnrichment.diepte);
    fields.bodemhardheid = addField('Bodemhardheid', 'bodemhardheid', 'select',
        ['Hard', 'Medium', 'Zacht', 'Onbekend'],
        existingEnrichment.bodemhardheid
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

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Annuleren';
    cancelBtn.style.cssText = 'padding: 10px 20px;';
    cancelBtn.onclick = () => document.body.removeChild(modalOverlay);
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
            const updateData = {
                soort: fields.soort.value,
                lengte: parseInt(fields.lengte.value),
                aantal: parseInt(fields.aantal.value) || 1,
            };

            if (isFieldOrigin) {
                if (fields.vangst_tijd.value) {
                    updateData.vangst_tijd = new Date(fields.vangst_tijd.value).toISOString();
                }
                if (fields.notities.value) {
                    updateData.notities = fields.notities.value;
                }

                console.log('💾 Groep 1: Updating field_catches with:', updateData);

                const { error } = await supabaseManager.client
                    .from('field_catches')
                    .update(updateData)
                    .eq('id', catchIdAsNumber);

                if (error) throw error;
            } else {
                if (fields.catch_datetime.value) {
                    updateData.catch_datetime = new Date(fields.catch_datetime.value).toISOString();
                }
                if (fields.waypoint_naam.value) {
                    updateData.waypoint_naam = fields.waypoint_naam.value;
                }

                console.log('💾 Groep 1: Updating catches with:', updateData);

                const { error } = await supabaseManager.client
                    .from('catches')
                    .update(updateData)
                    .eq('id', catchIdAsNumber);

                if (error) throw error;
            }

            // ============================================================
            // GROEP 2: Verrijkingsvelden → window.catchEnrichmentData
            // ============================================================
            const enrichmentData = {};

            if (fields.aas.value) enrichmentData.aas = fields.aas.value;
            if (fields.techniek.value) enrichmentData.techniek = fields.techniek.value;
            if (fields.diepte.value) enrichmentData.diepte = parseInt(fields.diepte.value);
            if (fields.bodemhardheid.value) enrichmentData.bodemhardheid = fields.bodemhardheid.value;
            if (fields.helderheid_override.value) enrichmentData.helderheid_override = fields.helderheid_override.value;
            if (fields.stroomsnelheid_override.value) enrichmentData.stroomsnelheid_override = fields.stroomsnelheid_override.value;
            if (fields.watertemperatuur_override.value) enrichmentData.watertemperatuur_override = parseInt(fields.watertemperatuur_override.value);

            if (Object.keys(enrichmentData).length > 0) {
                window.catchEnrichmentData[catchIdAsNumber] = enrichmentData;
                console.log(`💾 Groep 2: Storing enrichment data for catch ${catchIdAsNumber}:`, enrichmentData);
            }

            console.log('✅ Catch updated successfully (Groep 1 → database, Groep 2 → window.catchEnrichmentData)');

            // Refresh enrichment screen
            await initEnrichmentScreen(enrichmentSession.id);

            // Verwijder modal
            document.body.removeChild(modalOverlay);

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
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-enrichment.js loaded');
});
