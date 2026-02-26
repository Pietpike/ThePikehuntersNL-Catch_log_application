// ====================================
// FASE 4C: VALIDATIE & DEFINITIEF MAKEN
// Valideer complete sessie, schrijf naar definitieve tabellen
// ====================================

let validationResult = null;

// ====================================
// STAP 1: Validate Session
// ====================================

/**
 * Valideert complete sessie en vangsten
 * Return: { isValid, errors: [], warnings: [] }
 */
async function validateSession() {
    try {
        console.log('🔍 Validating session...');

        const errors = [];
        const warnings = [];
        const isFieldSession = window.currentSession?.origin === 'veld';

        // ===== SESSIE VALIDATIE =====
        if (!enrichmentSession.locatie || enrichmentSession.locatie.trim() === '') {
            errors.push('Locatie is verplicht');
        }

        if (!enrichmentSession.start_tijd && !enrichmentSession.session_start_datetime) {
            errors.push('Starttijd is verplicht');
        }

        if (!enrichmentCatches || enrichmentCatches.length === 0) {
            errors.push('Minimaal 1 vangst is verplicht');
        }

        // ===== VANGST VALIDATIE =====
        enrichmentCatches.forEach((catch_, idx) => {
            const catchNum = idx + 1;

            if (!catch_.soort || catch_.soort.trim() === '') {
                errors.push(`Vangst ${catchNum}: Soort is verplicht`);
            }

            // Waarschuwingen (niet blokkerend)
            if (!catch_.lengte) {
                warnings.push(`Vangst ${catchNum}: Geen lengte opgegeven`);
            }

            console.log(`🔍 GPS DEBUG - Catch ${catchNum}:`, { id: catch_.id, gps_lat: catch_.gps_lat, gps_lng: catch_.gps_lng, gps_long: catch_.gps_long, full_catch: catch_ });

            // GPS check: veld-sessies gebruiken gps_lng, handmatige sessies gebruiken gps_long
            const hasGpsLng = isFieldSession ? catch_.gps_lng : catch_.gps_long;
            if (!catch_.gps_lat || !hasGpsLng) {
                const hasSessionGps = isFieldSession
                    ? (enrichmentSession.gps_lat && enrichmentSession.gps_lng)
                    : (enrichmentSession.session_start_latitude && enrichmentSession.session_start_longitude);

                if (!hasSessionGps) {
                    errors.push(`Vangst ${catchNum}: Geen GPS coördinaten beschikbaar`);
                } else {
                    warnings.push(`Vangst ${catchNum}: Geen vangst-GPS, fallback naar sessie-GPS`);
                }
            }
        });

        // ===== WAARSCHUWING: EIND_TIJD =====
        if (!enrichmentSession.eind_tijd && !enrichmentSession.session_end_datetime) {
            warnings.push('Sessie eindtijd niet ingesteld');
        }

        validationResult = {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            sessionData: enrichmentSession,
            catchesData: enrichmentCatches
        };

        console.log('✓ Validation complete:', validationResult);

        // Render rapport
        renderValidationReport(validationResult);

        return validationResult;

    } catch (error) {
        console.error('❌ Validation error:', error);
        alert('Validatiefout: ' + error.message);
        return { isValid: false, errors: [error.message], warnings: [] };
    }
}

// ====================================
// STAP 2: Render Validation Report
// ====================================

/**
 * Toont validatierapport in het validatie-scherm
 */
function renderValidationReport(result) {
    const container = document.getElementById('phase4ValidationContent');
    if (!container) return;

    container.innerHTML = '';

    // Status indicator
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-weight: 600;
        ${result.isValid
            ? 'background: #e8f5e9; color: #2e7d32; border: 2px solid #4caf50;'
            : 'background: #ffebee; color: #c62828; border: 2px solid #f44336;'}
    `;
    statusDiv.innerHTML = result.isValid
        ? '✅ Validatie geslaagd - je kunt nu definitief maken'
        : '❌ Validatie mislukt - corrigeer de fouten hieronder';

    container.appendChild(statusDiv);

    // Errors (blokkerend)
    if (result.errors && result.errors.length > 0) {
        const errorsDiv = document.createElement('div');
        errorsDiv.style.cssText = 'margin-bottom: 20px;';

        const errorTitle = document.createElement('h4');
        errorTitle.textContent = '🔴 Fouten (verplicht op te lossen)';
        errorTitle.style.cssText = 'margin: 0 0 10px 0; color: #c62828;';
        errorsDiv.appendChild(errorTitle);

        const errorList = document.createElement('ul');
        errorList.style.cssText = 'margin: 0; padding-left: 20px; color: #d32f2f;';

        result.errors.forEach(err => {
            const li = document.createElement('li');
            li.textContent = err;
            li.style.cssText = 'margin-bottom: 5px;';
            errorList.appendChild(li);
        });

        errorsDiv.appendChild(errorList);
        container.appendChild(errorsDiv);
    }

    // Warnings (adviserend)
    if (result.warnings && result.warnings.length > 0) {
        const warningsDiv = document.createElement('div');
        warningsDiv.style.cssText = 'margin-bottom: 20px;';

        const warnTitle = document.createElement('h4');
        warnTitle.textContent = '⚠️ Waarschuwingen (adviserend)';
        warnTitle.style.cssText = 'margin: 0 0 10px 0; color: #f57f17;';
        warningsDiv.appendChild(warnTitle);

        const warnList = document.createElement('ul');
        warnList.style.cssText = 'margin: 0; padding-left: 20px; color: #f57c00;';

        result.warnings.forEach(warn => {
            const li = document.createElement('li');
            li.textContent = warn;
            li.style.cssText = 'margin-bottom: 5px;';
            warnList.appendChild(li);
        });

        warningsDiv.appendChild(warnList);
        container.appendChild(warningsDiv);
    }

    // Summary
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = `
        padding: 15px;
        background: #f5f5f5;
        border-radius: 8px;
        margin-top: 20px;
        font-size: 0.9em;
        color: #333;
    `;
    summaryDiv.innerHTML = `
        <strong>Sessie Samenvatting:</strong><br>
        📍 Locatie: ${result.sessionData?.locatie || '—'}<br>
        🕐 Vangsten: ${result.catchesData?.length || 0}<br>
        ✅ Status: ${result.isValid ? 'Klaar voor definitief maken' : 'Niet klaar'}
    `;

    container.appendChild(summaryDiv);

    // Enable/disable finalize button
    const finalizeBtn = document.getElementById('finalizeBtn');
    if (finalizeBtn) {
        finalizeBtn.disabled = !result.isValid;
        finalizeBtn.style.opacity = result.isValid ? '1' : '0.5';
        finalizeBtn.style.cursor = result.isValid ? 'pointer' : 'not-allowed';
    }
}

// ====================================
// STAP 3: Make Session Final
// ====================================

/**
 * Maakt sessie definitief: insert naar sessions + catches tabellen
 * KRITISCH: Atomaire operatie, alle-of-niks
 */
async function makeSessionFinal() {
    if (!validationResult || !validationResult.isValid) {
        alert('Validatie eerst uitvoeren');
        return;
    }

    try {
        console.log('💾 Making session final...');

        const isFieldSession = window.currentSession?.origin === 'veld';
        const session = validationResult.sessionData;
        const catches = validationResult.catchesData;

        // ===== STAP 1: Check Duplicates =====
        console.log('Step 1: Checking for duplicate sessions...');

        const { data: duplicates, error: dupError } = await supabaseManager.client
            .from('sessions')
            .select('id')
            .eq('locatie', session.locatie)
            .gte('session_start_date', isFieldSession ? session.datum : session.session_start_date)
            .lte('session_start_date', isFieldSession ? session.datum : session.session_start_date)
            .limit(1);

        if (dupError) throw dupError;

        let newSessionId = null;

        if (duplicates && duplicates.length > 0) {
            const merge = confirm(
                'Sessie met dezelfde datum/locatie bestaat al.\n\nWil je vangsten samenvoegen met bestaande sessie?'
            );

            if (!merge) {
                console.log('❌ User cancelled merge, stopped finalization');
                return;
            }

            newSessionId = duplicates[0].id;
            console.log(`✓ Will merge with existing session ${newSessionId}`);
        } else {
            // ===== STAP 2: Insert Session =====
            console.log('Step 2: Inserting new session...');

            // Map velden afhankelijk van origin
            const sessionRecord = {
                team_member: supabaseManager?.teamMember || 'unknown',
                session_start_datetime: isFieldSession ? session.start_tijd : session.session_start_datetime,
                session_end_datetime: isFieldSession ? session.eind_tijd : session.session_end_datetime,
                session_start_date: isFieldSession ? session.datum : session.session_start_date,
                locatie: session.locatie,
                watersoort: session.watersoort,
                stroomsnelheid: session.stroomsnelheid,
                watertemperatuur_measured: isFieldSession ? session.watertemperatuur : session.watertemperatuur_measured,
                helderheid: session.helderheid,
                sessie_naam: `Veld - ${new Date(isFieldSession ? session.datum : session.session_start_date).toLocaleDateString('nl-NL')} ${session.locatie}`,
                gpx_filename: null,
                definitief: true
            };

            const { data: newSession, error: sessionError } = await supabaseManager.client
                .from('sessions')
                .insert(sessionRecord)
                .select();

            if (sessionError) throw sessionError;

            if (!newSession || newSession.length === 0) {
                throw new Error('Session insert returned no data');
            }

            newSessionId = newSession[0].id;
            console.log(`✓ Session inserted with ID: ${newSessionId}`);
        }

        // ===== STAP 2.5: Process Aas Names to IDs =====
        console.log('Step 2.5: Processing aas names to IDs...');

        // Verzamel alle aas namen uit enrichmentData
        const aasNamesUsed = new Set();
        Object.values(window.catchEnrichmentData || {}).forEach(enrichData => {
            if (enrichData.aas) {
                aasNamesUsed.add(enrichData.aas);
            }
        });

        let aasIdMapping = {};
        if (aasNamesUsed.size > 0) {
            try {
                // Gebruiken bestaande processSessionAasjes logica als beschikbaar
                if (typeof processSessionAasjes === 'function') {
                    // Create temporary session object met aas data
                    const tempSession = {
                        waypoints: enrichmentCatches.map(catch_ => ({
                            catchData: window.catchEnrichmentData[catch_.id] || {}
                        }))
                    };
                    const aasResult = await processSessionAasjes(tempSession);
                    aasIdMapping = aasResult.idMapping || {};
                    console.log('✓ Aas names processed to IDs:', aasIdMapping);
                } else {
                    console.warn('processSessionAasjes not available, using aas names directly');
                }
            } catch (error) {
                console.warn('Error processing aas names:', error);
                // Fallback: continue without aas_id mapping
            }
        }

        // ===== STAP 3: Insert Catches =====
        console.log('Step 3: Inserting catches...');

        const catchRecords = catches.map(catch_ => {
            const vangstTijd = isFieldSession ? catch_.vangst_tijd : catch_.catch_datetime;
            const catchDate = new Date(vangstTijd);

            // Basis catch record
            // FIX: Voor veld-sessies leest uit gps_lng, voor handmatige uit gps_long
            const catchGpsLng = isFieldSession ?
                (catch_.gps_lng || enrichmentSession.gps_lng) :
                (catch_.gps_long || enrichmentSession.session_start_longitude);

            const catchRecord = {
                session_id: newSessionId,
                soort: catch_.soort,
                lengte: catch_.lengte || null,
                aantal: catch_.aantal || 1,
                catch_datetime: vangstTijd,
                catch_hour: catchDate.getHours(),
                catch_month: catchDate.getMonth() + 1,
                gps_lat: catch_.gps_lat || enrichmentSession.gps_lat || enrichmentSession.session_start_latitude,
                gps_long: catchGpsLng,
                waypoint_naam: isFieldSession ? catch_.notities : catch_.waypoint_naam,
                linked_catch_id: null,
                linked_sighting_id: null
            };

            // Voeg enrichment data toe van window.catchEnrichmentData (Groep 2 velden)
            const enrichmentData = window.catchEnrichmentData[catch_.id];
            if (enrichmentData) {
                console.log(`💾 Adding enrichment data for catch ${catch_.id}:`, enrichmentData);

                // Aas: Probeer aas_id te gebruiken, fallback naar naam
                if (enrichmentData.aas) {
                    const aasId = aasIdMapping[enrichmentData.aas];
                    if (aasId) {
                        catchRecord.aas_id = aasId;
                        console.log(`   - aas: "${enrichmentData.aas}" → aas_id: ${aasId}`);
                    } else {
                        // Fallback: opslaan als naam (niet ideal maar veilig)
                        catchRecord.aas = enrichmentData.aas;
                        console.log(`   - aas: "${enrichmentData.aas}" (no ID mapping found)`);
                    }
                }

                if (enrichmentData.techniek) catchRecord.techniek = enrichmentData.techniek;
                if (enrichmentData.diepte) catchRecord.diepte = enrichmentData.diepte;
                if (enrichmentData.bodem_hardheid) catchRecord.bodem_hardheid = enrichmentData.bodem_hardheid;

                // Override velden
                if (enrichmentData.helderheid_override) catchRecord.helderheid = enrichmentData.helderheid_override;
                if (enrichmentData.stroomsnelheid_override) catchRecord.stroomsnelheid = enrichmentData.stroomsnelheid_override;
                if (enrichmentData.watertemperatuur_override) catchRecord.watertemperatuur_measured = enrichmentData.watertemperatuur_override;
            }

            return catchRecord;
        });

        const { data: newCatches, error: catchError } = await supabaseManager.client
            .from('catches')
            .insert(catchRecords)
            .select();

        if (catchError) throw catchError;

        const catchIdMap = {};
        if (newCatches) {
            newCatches.forEach((newCatch, idx) => {
                catchIdMap[catches[idx].id] = newCatch.id;
            });
        }

        console.log(`✓ ${newCatches?.length || 0} catches inserted`);

        // ===== STAP 4: Update Field Tables =====
        if (isFieldSession) {
            console.log('Step 4: Updating field_sessions...');

            // Update field_sessions
            const { error: fsError } = await supabaseManager.client
                .from('field_sessions')
                .update({ session_id: newSessionId })
                .eq('id', enrichmentSession.id);

            if (fsError) throw fsError;

            console.log('✓ field_sessions updated');

            // Update field_catches
            for (const fieldCatchId of Object.keys(catchIdMap)) {
                const { error: fcError } = await supabaseManager.client
                    .from('field_catches')
                    .update({
                        session_id: newSessionId,
                        catch_id: catchIdMap[fieldCatchId]
                    })
                    .eq('id', fieldCatchId);

                if (fcError) throw fcError;
            }

            console.log('✓ field_catches updated');
        }

        // ===== STAP 5: Success =====
        console.log('✅ Session finalized successfully!');
        alert('✅ Sessie succesvol definitief gemaakt!\n\nVangsten zijn nu zichtbaar in de normale overzichtstabel.');

        // Terug naar startscherm
        backToOverview();

    } catch (error) {
        console.error('❌ Error finalizing session:', error);
        alert('Fout bij definitief maken: ' + error.message);
    }
}

// ====================================
// Helper: Go to Validation Screen
// ====================================

/**
 * Wisselt naar validatie-scherm
 */
function goToValidation() {
    const overview = document.getElementById('phase4OverviewScreen');
    const enrichment = document.getElementById('phase4Enrichment');
    const validation = document.getElementById('phase4Validation');

    if (overview) overview.style.display = 'none';
    if (enrichment) enrichment.style.display = 'none';
    if (validation) validation.style.display = 'block';

    // Auto-validate
    setTimeout(() => {
        validateSession();
    }, 100);
}

/**
 * Terug naar verrijkingsscherm
 */
function backToEnrichment() {
    const overview = document.getElementById('phase4OverviewScreen');
    const enrichment = document.getElementById('phase4Enrichment');
    const validation = document.getElementById('phase4Validation');

    if (overview) overview.style.display = 'none';
    if (enrichment) enrichment.style.display = 'block';
    if (validation) validation.style.display = 'none';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-validation.js loaded');
});
