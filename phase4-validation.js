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

        // ===== SESSIE VALIDATIE =====
        if (!enrichmentSession.locatie || enrichmentSession.locatie.trim() === '') {
            errors.push('Locatie is verplicht');
            console.log('❌ VALIDATION ERROR:', errors[errors.length-1]);
        }

        if (!enrichmentSession.start_tijd && !enrichmentSession.session_start_datetime) {
            errors.push('Starttijd is verplicht');
            console.log('❌ VALIDATION ERROR:', errors[errors.length-1]);
        }

        // ===== VANGST VALIDATIE =====
        enrichmentCatches.forEach((catch_, idx) => {
            const catchNum = idx + 1;

            if (!catch_.soort || catch_.soort.trim() === '') {
                errors.push(`Vangst ${catchNum}: Soort is verplicht`);
                console.log('❌ VALIDATION ERROR:', errors[errors.length-1]);
            }

            // Waarschuwingen (niet blokkerend)
            if (!catch_.lengte) {
                warnings.push(`Vangst ${catchNum}: Geen lengte opgegeven`);
            }

            console.log(`🔍 GPS DEBUG - Catch ${catchNum}:`, { catch_id: catch_.catch_id, gps_lat: catch_.gps_lat, gps_long: catch_.gps_long, full_catch: catch_ });

            // GPS check: veld-sessies en handmatige sessies gebruiken gps_long
            const hasGpsLng = catch_.gps_long;
            if (!catch_.gps_lat || !hasGpsLng) {
                const s = Phase4Utils.normalizeSession(enrichmentSession, window.currentSession?.origin);
                const hasSessionGps = s.gpsLat && s.gpsLng;

                if (!hasSessionGps) {
                    errors.push(`Vangst ${catchNum}: Geen GPS coördinaten beschikbaar`);
                    console.log('❌ VALIDATION ERROR:', errors[errors.length-1]);
                } else {
                    warnings.push(`Vangst ${catchNum}: Geen vangst-GPS, fallback naar sessie-GPS`);
                }
            }

            // Aas check
            const nc = Phase4Utils.normalizeCatch(catch_, window.currentSession?.origin);
            const enrichmentData = window.catchEnrichmentData[nc.id];
            if (!enrichmentData?.aas || enrichmentData.aas.trim() === '') {
                errors.push(`Vangst ${catchNum}: Aas is verplicht`);
                console.log('❌ VALIDATION ERROR:', errors[errors.length-1]);
            }

            // Techniek check
            if (!enrichmentData?.techniek || enrichmentData.techniek.trim() === '') {
                errors.push(`Vangst ${catchNum}: Techniek is verplicht`);
                console.log('❌ VALIDATION ERROR:', errors[errors.length-1]);
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
    console.log('🚨 makeSessionFinal CALLED', window.currentSession?.origin);

    if (!validationResult || !validationResult.isValid) {
        alert('Validatie eerst uitvoeren');
        return;
    }

    try {
        console.log('💾 Making session final...');

        console.log('🔍 makeSessionFinal START:', {
            origin: window.currentSession?.origin,
            isFieldSession: window.currentSession?.origin === 'veld',
            enrichmentSessionId: enrichmentSession?.id,
            enrichmentSessionSessionId: enrichmentSession?.session_id,
            currentSessionDbId: window.currentSession?.dbId
        });

        const session = validationResult.sessionData;
        const catches = validationResult.catchesData;

        // Bepaal huidige sessie ID en tijden voor exclusie in duplicate check
        const s = Phase4Utils.normalizeSession(enrichmentSession, window.currentSession?.origin);
        const currentSessionId = s.id;

        // ===== STAP 1: Check Duplicates with Time Overlap =====
        console.log('Step 1: Checking for duplicate sessions with time overlap...');

        // Bepaal start/eind tijden voor overlap check
        const checkStartDatetime = s.startDatetime;
        const checkEndDatetime = s.endDatetime;

        console.log('🔍 OVERLAP CHECK PARAMETERS:', {
            checkStartDatetime,
            checkEndDatetime,
            locatie: session.locatie,
            origin: window.currentSession?.origin
        });

        // Query: zoeek sessies met dezelfde locatie EN temporele overlap
        // Overlap occurs when: session_start_datetime < our_end AND session_end_datetime > our_start
        const query = supabaseManager.client
            .from(DB_SCHEMA.sessions.table)
            .select('session_id, locatie, session_start_datetime, session_end_datetime, sessie_naam')
            .eq(DB_SCHEMA.sessions.cols.locatie, session.locatie)
            .eq(DB_SCHEMA.sessions.cols.definitief, true)  // ⭐ Only match finalized sessions
            .neq(DB_SCHEMA.sessions.pk, currentSessionId);  // ⭐ Exclude current session

        // Voeg time overlap filters toe
        if (checkStartDatetime && checkEndDatetime) {
            query
                .lt(DB_SCHEMA.sessions.cols.session_start_datetime, checkEndDatetime)   // Sessie start vóór onze eind
                .gt(DB_SCHEMA.sessions.cols.session_end_datetime, checkStartDatetime);   // Sessie eind na onze start
        }

        const { data: duplicates, error: dupError } = await query.limit(5);

        if (dupError) throw dupError;

        let newSessionId = null;

        if (duplicates && duplicates.length > 0) {
            console.log(`⚠️ Found ${duplicates.length} overlapping session(s):`, duplicates);

            // Toon waarschuwing met details van gevonden sessies
            const overlapDetails = duplicates
                .map(dup => `  • ${dup.sessie_naam || dup.locatie} (${dup.session_start_datetime})`)
                .join('\n');

            const continueFinalization = confirm(
                `⚠️ Er ${duplicates.length === 1 ? 'bestaat' : 'bestaan'} al ${duplicates.length} sessie(s) op deze datum/locatie met overlappende tijden:\n\n${overlapDetails}\n\nWil je toch doorgaan met finaliseren?`
            );

            if (!continueFinalization) {
                console.log('❌ User cancelled finalization due to overlap warning');
                return;
            }

            console.log(`✓ User confirmed to proceed despite overlap warnings`);
        } else {
            console.log('✓ No overlapping sessions found');
        }

        // ===== STAP 2: Insert or Update Session =====
        const isFieldSession = window.currentSession?.origin === 'veld';
        if (isFieldSession) {
            // ===== STAP 2A: Insert New Session (Veld-sessies) =====
            console.log('Step 2A: Inserting new session (veld-sessie)...');

            // Map velden afhankelijk van origin
            const startDatetime = session.start_tijd;
            const startDate = new Date(startDatetime);

            // Extraheer datum/tijd componenten
            const startHour = startDate.getHours();
            const startMonth = startDate.getMonth() + 1;  // getMonth() is 0-indexed

            const sessionRecord = {
                team_member: supabaseManager?.teamMember || 'unknown',
                session_start_datetime: startDatetime,
                session_end_datetime: session.eind_tijd || null,
                session_start_date: session.datum,
                session_start_hour: startHour,
                session_start_month: startMonth,
                locatie: session.locatie || null,
                watersoort: session.watersoort || null,
                stroomsnelheid: session.stroomsnelheid || null,
                watertemperatuur_measured: session.watertemperatuur || null,
                helderheid: session.helderheid || null,
                aantal_hengels: session.aantal_hengels ? parseInt(session.aantal_hengels) : null,
                sessie_naam: `Veld - ${new Date(session.datum).toLocaleDateString('nl-NL')} ${session.locatie}`,
                gpx_filename: null,
                weather_id: null,
                definitief: true
            };

            console.log('📋 SESSION RECORD BEFORE INSERT:', JSON.stringify(sessionRecord, null, 2));

            const { data: newSession, error: sessionError } = await supabaseManager.client
                .from(DB_SCHEMA.sessions.table)
                .insert(sessionRecord)
                .select();

            if (sessionError) throw sessionError;

            if (!newSession || newSession.length === 0) {
                throw new Error('Session insert returned no data');
            }

            console.log('📊 SESSIONS INSERT RESPONSE:', JSON.stringify(newSession[0], null, 2));
            console.log('🔍 CHECKING SESSION ID FIELDS:', {
                id: newSession[0].id,
                session_id: newSession[0].session_id,
                id_type: typeof newSession[0].id,
                session_id_type: typeof newSession[0].session_id
            });

            // Probeer beide mogelijke velden
            newSessionId = newSession[0].session_id || newSession[0].id;
            console.log(`✓ Session inserted with ID: ${newSessionId} (using ${newSession[0].session_id ? 'session_id' : 'id'})`);
        } else {
            // ===== STAP 2B: Update Existing Session (Handmatige sessies) =====
            console.log('Step 2B: Updating existing concept session (handmatige sessie)...');

            const sessionId = enrichmentSession.session_id;
            console.log(`Updating session ${sessionId} to definitief=true with enriched data`);

            // Map velden voor handmatige sessies
            const startDatetime = session.session_start_datetime;
            const startDate = new Date(startDatetime);

            // Extraheer datum/tijd componenten
            const startHour = startDate.getHours();
            const startMonth = startDate.getMonth() + 1;

            const updateRecord = {
                session_start_datetime: startDatetime,
                session_end_datetime: session.session_end_datetime || null,
                session_start_date: session.session_start_date,
                session_start_hour: startHour,
                session_start_month: startMonth,
                locatie: session.locatie || null,
                watersoort: session.watersoort || null,
                stroomsnelheid: session.stroomsnelheid || null,
                watertemperatuur_measured: session.watertemperatuur_measured || null,
                helderheid: session.helderheid || null,
                definitief: true  // ⭐ KRITIEK: Zet concept sessie op definitief
            };

            console.log('📋 UPDATE RECORD:', JSON.stringify(updateRecord, null, 2));

            const { data: updatedSession, error: updateError } = await supabaseManager.client
                .from(DB_SCHEMA.sessions.table)
                .update(updateRecord)
                .eq(DB_SCHEMA.sessions.pk, sessionId)
                .select()
                .single();

            if (updateError) throw updateError;

            if (!updatedSession) {
                throw new Error('Session update returned no data');
            }

            console.log('📊 SESSIONS UPDATE RESPONSE:', JSON.stringify(updatedSession, null, 2));
            console.log('🔍 UPDATED SESSION ID FIELD:', {
                session_id: updatedSession.session_id,
                id: updatedSession.id
            });

            newSessionId = updatedSession.session_id;
            console.log(`✓ Session updated to definitief=true with ID: ${newSessionId}`);
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
                        waypoints: enrichmentCatches.map(catch_ => {
                            const nc = Phase4Utils.normalizeCatch(catch_, window.currentSession?.origin);
                            return {
                                catchData: window.catchEnrichmentData[nc.id] || {}
                            };
                        })
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
            const nc = Phase4Utils.normalizeCatch(catch_, window.currentSession?.origin);
            const fallbacks = Phase4Utils.getCatchFallbacks(catch_, enrichmentSession, window.currentSession?.origin);

            const vangstTijd = nc.vangstTijd;
            const catchDate = new Date(vangstTijd);

            const catchRecord = {
                session_id: newSessionId,
                soort: catch_.soort,
                lengte: catch_.lengte || null,
                aantal: catch_.aantal || 1,
                catch_datetime: vangstTijd,
                catch_hour: catchDate.getHours(),
                catch_month: catchDate.getMonth() + 1,
                gps_lat: fallbacks.gpsLat,
                gps_long: fallbacks.gpsLng,
                // Fallback naar sessie waarden als vangst-override leeg is
                diepte: fallbacks.diepte,
                vangsthoogte: catch_.vangsthoogte ?? null,
                bodemhardheid: fallbacks.bodemhardheid,
                notities: catch_.notities || null,
                linked_catch_id: catch_.linked_catch_id ?? null,
                linked_sighting_id: catch_.linked_sighting_id ?? null
            };

            // Voeg enrichment data toe van window.catchEnrichmentData (Groep 2 velden)
            const enrichmentData = window.catchEnrichmentData[nc.id];
            if (enrichmentData) {
                console.log(`💾 Adding enrichment data for catch ${catch_.catch_id}:`, enrichmentData);

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

                // Nieuwe verrijkingsvelden
                if (enrichmentData.vissnelheid) catchRecord.vissnelheid = enrichmentData.vissnelheid;
                if (enrichmentData.booster) catchRecord.booster = enrichmentData.booster;
                if (enrichmentData.gewicht) catchRecord.gewicht = enrichmentData.gewicht;
                if (enrichmentData.structuur) catchRecord.structuur = enrichmentData.structuur;
                if (enrichmentData.aasvis) catchRecord.aasvis_op_stek = enrichmentData.aasvis;
                if (enrichmentData.zon_schaduw) catchRecord.zon_schaduw = enrichmentData.zon_schaduw;

                // Override velden - schrijf naar specifieke override kolommen
                if (enrichmentData.helderheid_override) {
                    catchRecord.helderheid_override = enrichmentData.helderheid_override;
                    console.log(`   - helderheid_override: "${enrichmentData.helderheid_override}"`);
                }
                if (enrichmentData.stroomsnelheid_override) {
                    catchRecord.stroomsnelheid_override = enrichmentData.stroomsnelheid_override;
                    console.log(`   - stroomsnelheid_override: "${enrichmentData.stroomsnelheid_override}"`);
                }
                if (enrichmentData.watertemperatuur_override) {
                    catchRecord.watertemperatuur_override = enrichmentData.watertemperatuur_override;
                    console.log(`   - watertemperatuur_override: ${enrichmentData.watertemperatuur_override}`);
                }
            }

            return catchRecord;
        });

        let newCatches;
        const catchIdMap = {};

        if (isFieldSession) {
            // VELDSESSIES: INSERT nieuwe catches
            console.log('Step 3A: Inserting catches (field session)...');
            const { data: insertedCatches, error: catchError } = await supabaseManager.client
                .from(DB_SCHEMA.catches.table)
                .insert(catchRecords)
                .select();

            if (catchError) throw catchError;

            newCatches = insertedCatches;

            console.log('📊 COMPLETE CATCHES INSERT RESPONSE:', JSON.stringify(newCatches, null, 2));
            if (newCatches && newCatches.length > 0) {
                console.log('🔍 CHECKING CATCH ID FIELDS (first catch):', {
                    id: newCatches[0].id,
                    catch_id: newCatches[0].catch_id,
                    id_type: typeof newCatches[0].id,
                    catch_id_type: typeof newCatches[0].catch_id
                });

                console.log('🔍 CHECKING OVERRIDE FIELDS (first catch):', {
                    helderheid_override: newCatches[0].helderheid_override,
                    stroomsnelheid_override: newCatches[0].stroomsnelheid_override,
                    watertemperatuur_override: newCatches[0].watertemperatuur_override
                });
            }

            // Bouw ID map voor veldsessies: old field_catch_id → new catch_id
            if (newCatches) {
                newCatches.forEach((newCatch, idx) => {
                    const catchId = newCatch.catch_id || newCatch.id;
                    const fieldCatchId = catches[idx].id;  // field_catches.id
                    catchIdMap[fieldCatchId] = catchId;
                    console.log(`   Catch ${idx + 1}: fieldCatchId=${fieldCatchId} → catchId=${catchId} (using ${newCatch.catch_id ? 'catch_id' : 'id'})`);
                });
            }

            console.log(`✓ ${newCatches?.length || 0} catches inserted`);
        } else {
            // HANDMATIGE SESSIES: UPDATE bestaande catches met verrijkingsdata
            console.log('Step 3B: Updating catches (manual session)...');

            for (let idx = 0; idx < catches.length; idx++) {
                const catch_ = catches[idx];
                const catchRecord = catchRecords[idx];
                const catchPk = catch_.catch_id;

                const { error: updateError } = await supabaseManager.client
                    .from(DB_SCHEMA.catches.table)
                    .update(catchRecord)
                    .eq(DB_SCHEMA.catches.pk, catchPk);

                if (updateError) throw updateError;

                // ID map voor handmatige sessies: catch_id → catch_id (ID blijft hetzelfde)
                catchIdMap[catchPk] = catchPk;
                console.log(`   Catch ${idx + 1}: catch_id=${catchPk} updated with enrichment data`);
            }

            newCatches = catches.map(c => ({ ...c, catch_id: c.catch_id }));  // Voor consistentie
            console.log(`✓ ${newCatches?.length || 0} catches updated`);
        }

        console.log('📋 CATCH ID MAP:', catchIdMap);

        // ===== STAP 4: Update Field Tables =====
        if (window.currentSession?.origin === 'veld') {
            console.log('Step 4: Updating field_sessions...');

            // Update field_sessions
            const { error: fsError } = await supabaseManager.client
                .from(DB_SCHEMA.field_sessions.table)
                .update({ [DB_SCHEMA.field_sessions.cols.session_id]: newSessionId })
                .eq(DB_SCHEMA.field_sessions.pk, enrichmentSession.id);

            if (fsError) throw fsError;

            console.log('✓ field_sessions updated');

            // Update field_catches
            for (const fieldCatchId of Object.keys(catchIdMap)) {
                const { error: fcError } = await supabaseManager.client
                    .from(DB_SCHEMA.field_catches.table)
                    .update({
                        [DB_SCHEMA.field_catches.cols.session_id]: newSessionId,
                        [DB_SCHEMA.field_catches.cols.catch_id]: catchIdMap[fieldCatchId]
                    })
                    .eq(DB_SCHEMA.field_catches.pk, fieldCatchId);

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
 * KRITIEK: Sla alle sessie-gegevens op voordat naar validatie wordt gegaan
 * Dit zorgt dat even ongesaved veranderingen (b.v. locatie dropdown) worden opgeslagen
 */
async function goToValidation() {
    console.log('→ Switching to validation screen...');

    // ⭐ KRITIEK: Sla alle sessie-gegevens op VOORDAT we naar validatie gaan
    // Dit zorgt dat locatie-dropdown en andere velden worden opgeslagen zelfs als onchange niet triggerde
    if (typeof saveSessionData === 'function') {
        try {
            console.log('💾 Saving session data before validation...');
            await saveSessionData();
            console.log('✓ Session data saved');
        } catch (error) {
            console.error('⚠️ Warning: Could not save session data:', error);
            // Continue anyway - validation will show what's missing
        }
    }

    // Nu switchen naar validation screen
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

    // Export functions to window
    window.validateSession = validateSession;
    window.makeSessionFinal = makeSessionFinal;
    window.goToValidation = goToValidation;
    window.backToEnrichment = backToEnrichment;
});
