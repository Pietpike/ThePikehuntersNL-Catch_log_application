/*
================================================================================
UPDATED FILE: app-core.js - Database Sync Only Version with Feature Flags + Aas Management
================================================================================
APPLICATION CORE - DATABASE SYNC ONLY WORKFLOW + FEATURE FLAGS + AAS SYNC SUPPORT
- Excel export functionality preserved but hidden via feature flags
- Enhanced session naming for export functions (preserved for compatibility)
- Supabase cloud sync integration (primary workflow)
- Database-only user interface with hidden export options
- Feature flags for easy rollback and future configuration
- Enhanced time validation system initialization (preserved)
- Global function bindings for all export types (preserved for compatibility)
- Session button fixes for manual session functionality
- Database sync workflow as primary user path
- Updated button handlers for new 3-tabel database sync functions
- Aas sync button status management (Fase 3.3)
================================================================================
*/

// ================================
// FEATURE FLAGS - DATABASE SYNC CONFIGURATION
// ================================

const FEATURE_FLAGS = {
    EXCEL_EXPORT_ENABLED: false,     // Set to true to re-enable Excel export
    DATABASE_SYNC_ONLY: true,        // Primary workflow: database sync only
    SHOW_EXPORT_BUTTON: false,       // UI control: show/hide export button
    ENHANCED_CLOUD_SYNC: true,       // Enhanced cloud sync features
    AAS_SYNC_ENABLED: true,          // Enable separate aas sync functionality
    DEBUG_MODE: false                 // Debug logging control
};

// ================================
// HELPER FUNCTIONS - Session Naming for Export (PRESERVED FOR COMPATIBILITY)
// ================================

/**
 * Genereert specifieke sessienaam voor export doeleinden
 * Format: {locatie} - {datum} {tijd} - {team_member} - {sessie_nummer}
 */
function generateExportSessionName(session, sessionIndex) {
    // Locatie component
    const locatie = session.locatie || 'Onbekende locatie';
    
    // Datum component (DD/MM/YYYY formaat)
    const datum = session.startTime.toLocaleDateString('nl-NL', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
    });
    
    // Tijd component (HH:MM formaat)
    const tijd = session.startTime.toLocaleTimeString('nl-NL', {
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    // Team member component
    const teamMember = (typeof supabaseManager !== 'undefined' && supabaseManager.teamMember) 
        ? supabaseManager.teamMember 
        : 'Onbekende gebruiker';
    
    // Sessie nummer component
    const sessieNummer = `Sessie ${sessionIndex + 1}`;
    
    // Combineer alle componenten
    return `${locatie} - ${datum} ${tijd} - ${teamMember} - ${sessieNummer}`;
}

// ================================
// DATABASE SYNC WORKFLOW FUNCTIONS
// ================================

/**
 * Hide export button and configure database-only workflow
 */
function hideExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    const cloudBtn = document.getElementById('cloudSyncBtn');
    
    // Hide export button based on feature flag
    if (exportBtn && !FEATURE_FLAGS.SHOW_EXPORT_BUTTON) {
        exportBtn.style.display = 'none';
        if (FEATURE_FLAGS.DEBUG_MODE) {
            console.log('Export button hidden - database sync workflow active');
        }
    }
    
    // Update cloud sync button for prominence
    if (cloudBtn && FEATURE_FLAGS.DATABASE_SYNC_ONLY) {
        cloudBtn.innerHTML = '☁️ Sync naar Database';
        cloudBtn.title = 'Upload alle sessies naar nieuwe 3-tabel database structuur';
        
        // Enhance styling for primary workflow
        cloudBtn.style.fontWeight = '600';
        cloudBtn.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
    }
    
    if (FEATURE_FLAGS.DEBUG_MODE) {
        console.log('Database sync workflow configured:', {
            excelEnabled: FEATURE_FLAGS.EXCEL_EXPORT_ENABLED,
            databaseOnly: FEATURE_FLAGS.DATABASE_SYNC_ONLY,
            showExportBtn: FEATURE_FLAGS.SHOW_EXPORT_BUTTON,
            aasSyncEnabled: FEATURE_FLAGS.AAS_SYNC_ENABLED
        });
    }
}

/**
 * Enhanced database sync status message
 */
function showDatabaseSyncStatus() {
    const cloudInfo = typeof supabaseManager !== 'undefined' ? {
        teamMember: supabaseManager.teamMember,
        isReady: supabaseManager.isInitialized && supabaseManager.teamMember
    } : { teamMember: null, isReady: false };
    
    if (cloudInfo.isReady && sessions && sessions.length > 0) {
        const message = `Database sync ready: ${sessions.length} sessies voor ${cloudInfo.teamMember}`;
        if (typeof showStatus === 'function') {
            showStatus(message, 'success');
        }
    }
}

// ================================
// LEGACY EXPORT FUNCTIONS - PRESERVED FOR COMPATIBILITY
// ================================

// Updated Excel export function with new dropdown columns and session naming (PRESERVED)
function exportToExcelEnhanced() {
    // Redirect to database sync if Excel is disabled
    if (!FEATURE_FLAGS.EXCEL_EXPORT_ENABLED) {
        const confirmed = confirm(
            "Excel export is vervangen door database sync.\n\n" +
            "Wil je doorgaan naar database sync?"
        );
        if (confirmed && typeof syncSessionsToDatabase === 'function') {
            syncSessionsToDatabase();
        }
        return false;
    }
    
    console.log('=== EXCEL EXPORT DEBUG START ===');
    
    // Check if sessions exist
    console.log('Sessions check:', typeof sessions, sessions?.length);
    if (!sessions || sessions.length === 0) {
        console.error('No sessions available for export');
        alert('Geen sessies om te exporteren!');
        return false;
    }
    
    // Check if XLSX library is loaded
    console.log('XLSX library check:', typeof XLSX);
    if (typeof XLSX === 'undefined') {
        console.error('XLSX library not loaded');
        alert('Excel library niet geladen. Zorg dat SheetJS/XLSX beschikbaar is.');
        return false;
    }
    
    // Check helper functions
    console.log('parseWaypointName function check:', typeof parseWaypointName);
    console.log('showStatus function check:', typeof showStatus);
    
    const data = [];
    
    try {
        sessions.forEach((session, sessionIndex) => {
            console.log(`Processing session ${sessionIndex + 1}:`, session);
            
            const exportSessionName = generateExportSessionName(session, sessionIndex);
            console.log('Generated session name:', exportSessionName);
            
            if (session.waypoints.length === 0) {
                console.log('Empty session - adding empty record');
                data.push({
                    'Datum': session.startTime.toLocaleDateString('nl-NL'),
                    'Tijd': '',
                    'Locatie': session.locatie || '',
                    'Sessie Naam': exportSessionName,
                    'Starttijd': session.startTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}),
                    'Eindtijd': session.endTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}),
                    'GPS': '',
                    'Soort': '',
                    'Aantal': '',
                    'Lengte (cm)': '',
                    'Diepte (m)': '',
                    'Aas': '',
                    'Booster': '',
                    'Gewicht (g)': '',
                    'Techniek': '',
                    'Vissnelheid': '',
                    'Structuur': '',
                    'Aasvis op stek': '',
                    'Vangsthoogte': '',
                    'Zon/Schaduw': '',
                    'Bodemhardheid': '',
                    'Watersoort': session.watersoort || '',
                    'Stroomsnelheid': session.stroomsnelheid || '',
                    'Watertemperatuur': session.watertemperatuur || '',
                    'Helderheid': session.helderheid || ''
                });
            } else {
                console.log(`Session has ${session.waypoints.length} waypoints`);
                session.waypoints.forEach((wp, index) => {
                    console.log(`Processing waypoint ${index + 1}:`, wp);
                    
                    let parsed = { soort: '', aantal: 1, lengte: '' };
                    try {
                        if (typeof parseWaypointName === 'function' && wp.name) {
                            parsed = parseWaypointName(wp.name);
                        }
                    } catch (error) {
                        console.warn('parseWaypointName failed for:', wp.name, 'Error:', error.message);
                        parsed = { soort: wp.name || '', aantal: 1, lengte: '' };
                    }
                    
                    const catchData = wp.catchData || {};
                    
                    data.push({
                        'Datum': wp.datetime.toLocaleDateString('nl-NL'),
                        'Tijd': wp.datetime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}),
                        'Locatie': session.locatie || '',
                        'Sessie Naam': exportSessionName,
                        'Starttijd': index === 0 ? session.startTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : '',
                        'Eindtijd': index === session.waypoints.length - 1 ? session.endTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : '',
                        'GPS': wp.lat.toFixed(6) + ', ' + wp.lon.toFixed(6),
                        'Soort': parsed.soort || '',
                        'Aantal': parsed.aantal || 1,
                        'Lengte (cm)': parsed.lengte || '',
                        'Diepte (m)': catchData.diepte || '',
                        'Aas': catchData.aas || '',
                        'Booster': catchData.booster || '',
                        'Gewicht (g)': catchData.gewicht || '',
                        'Techniek': catchData.techniek || '',
                        'Vissnelheid': catchData.vissnelheid || '',
                        'Structuur': catchData.structuur || '',
                        'Aasvis op stek': catchData.aasvis || '',
                        'Vangsthoogte': catchData.vangsthoogte || '',
                        'Zon/Schaduw': catchData.zonschaduw || '',
                        'Bodemhardheid': catchData.bodemhardheid || '',
                        'Watersoort': session.watersoort || '',
                        'Stroomsnelheid': session.stroomsnelheid || '',
                        'Watertemperatuur': session.watertemperatuur || '',
                        'Helderheid': session.helderheid || ''
                    });
                });
            }
        });
        
        console.log(`Created ${data.length} records for export`);
        console.log('Sample record:', data[0]);
        
        // Create Excel file
        console.log('Creating worksheet...');
        const ws = XLSX.utils.json_to_sheet(data);
        console.log('Worksheet created');
        
        console.log('Creating workbook...');
        const wb = XLSX.utils.book_new();
        console.log('Workbook created');
        
        console.log('Adding sheet to workbook...');
        XLSX.utils.book_append_sheet(wb, ws, "Vangsten");
        console.log('Sheet added to workbook');
        
        const date = sessions[0]?.startTime || new Date();
        const dateStr = date.toISOString().split('T')[0];
        const filename = 'pikehunters_catchlog_' + dateStr + '_excel_export.xlsx';
        
        console.log('Writing file:', filename);
        XLSX.writeFile(wb, filename);
        console.log('File write completed');
        
        if (typeof showStatus === 'function') {
            showStatus('Excel bestand "' + filename + '" gedownload!', 'success');
        } else {
            console.log('showStatus function not available');
            alert('Excel bestand "' + filename + '" gedownload!');
        }
        
        console.log('=== EXCEL EXPORT DEBUG SUCCESS ===');
        return true;
        
    } catch (error) {
        console.error('=== EXCEL EXPORT ERROR ===');
        console.error('Error during export:', error);
        console.error('Error stack:', error.stack);
        alert('Fout bij Excel export: ' + error.message);
        return false;
    }
}

// Enhanced export function with validation check (PRESERVED)
function exportToExcelWithValidation() {
    console.log('=== EXPORT WITH VALIDATION ===');
    
    // Redirect to database sync if Excel is disabled
    if (!FEATURE_FLAGS.EXCEL_EXPORT_ENABLED) {
        const confirmed = confirm(
            "Excel export is niet beschikbaar in database-only modus.\n\n" +
            "Gebruik database sync voor data export.\n\n" +
            "Wil je doorgaan naar database sync?"
        );
        if (confirmed && typeof syncSessionsToDatabase === 'function') {
            syncSessionsToDatabase();
        }
        return false;
    }
    
    if (typeof ValidationStateManager !== 'undefined' && !ValidationStateManager.canValidate()) {
        console.warn('Validation system busy - retrying export...');
        setTimeout(() => exportToExcelWithValidation(), 500);
        return false;
    }
    
    try {
        let report;
        if (typeof runOptimizedValidation === 'function') {
            report = runOptimizedValidation();
        } else if (typeof generateValidationReport === 'function') {
            console.warn('Protected validation not available - using direct validation');
            report = generateValidationReport();
        } else {
            console.error('No validation function available');
            alert('Validatiesysteem niet beschikbaar');
            return false;
        }
        
        if (!report.summary.canExport) {
            console.error('Export blocked by validation');
            if (typeof showValidationModal === 'function') {
                showValidationModal();
            } else {
                alert('Data is niet compleet voor export. Controleer de validatiefouten.');
            }
            return false;
        }
        
        console.log('Validation passed - proceeding with Excel export');
        return exportToExcelEnhanced();
        
    } catch (error) {
        console.error('Protected export validation failed:', error);
        
        if (typeof ValidationStateManager !== 'undefined') {
            ValidationStateManager.emergencyReset();
        }
        
        if (typeof showStatus === 'function') {
            showStatus('Export validation failed - system reset', 'error');
        } else {
            alert('Export validatie gefaald - systeem gereset');
        }
        return false;
    }
}

// Export choice system (REDIRECTS TO DATABASE SYNC)
function exportWithChoice() {
    console.log('=== EXPORT WITH CHOICE - DATABASE SYNC REDIRECT ===');
    
    // Database sync only workflow
    if (FEATURE_FLAGS.DATABASE_SYNC_ONLY) {
        if (typeof syncSessionsToDatabase === 'function') {
            syncSessionsToDatabase();
        } else {
            if (typeof showStatus === 'function') {
                showStatus('Database sync niet beschikbaar', 'error');
            } else {
                alert('Database sync niet beschikbaar');
            }
        }
        return;
    }
    
    // Legacy choice system (if Excel is re-enabled)
    if (typeof ValidationStateManager !== 'undefined' && !ValidationStateManager.canValidate()) {
        console.warn('Validation system busy - retrying export choice...');
        setTimeout(() => exportWithChoice(), 500);
        return false;
    }
    
    try {
        let report;
        if (typeof runOptimizedValidation === 'function') {
            report = runOptimizedValidation();
        } else if (typeof generateValidationReport === 'function') {
            console.warn('Protected validation not available - using direct validation');
            report = generateValidationReport();
        } else {
            console.error('No validation function available');
            alert('Validatiesysteem niet beschikbaar');
            return false;
        }
        
        if (!report.summary.canExport) {
            console.error('Export choice blocked by validation');
            if (typeof showValidationModal === 'function') {
                showValidationModal();
            } else {
                alert('Data is niet compleet voor export. Controleer de validatiefouten.');
            }
            return false;
        }
        
        // Check if cloud sync is available
        const cloudSyncAvailable = typeof supabaseManager !== 'undefined' && 
                                  supabaseManager.isInitialized && 
                                  supabaseManager.teamMember;
        
        if (cloudSyncAvailable && FEATURE_FLAGS.EXCEL_EXPORT_ENABLED) {
            // Show choice modal (legacy)
            showExportChoiceModal();
        } else {
            // Only database sync available
            if (typeof syncSessionsToDatabase === 'function') {
                syncSessionsToDatabase();
            } else {
                if (typeof showStatus === 'function') {
                    showStatus('Database sync niet beschikbaar', 'error');
                } else {
                    alert('Database sync niet beschikbaar');
                }
            }
        }
        
    } catch (error) {
        console.error('Protected export choice validation failed:', error);
        
        if (typeof ValidationStateManager !== 'undefined') {
            ValidationStateManager.emergencyReset();
        }
        
        if (typeof showStatus === 'function') {
            showStatus('Export validation failed - system reset', 'error');
        } else {
            alert('Export validatie gefaald - systeem gereset');
        }
        return false;
    }
}

// Legacy modal functions (PRESERVED FOR COMPATIBILITY)
function showExportChoiceModal() {
    // Only show if Excel export is enabled
    if (!FEATURE_FLAGS.EXCEL_EXPORT_ENABLED) {
        if (typeof syncSessionsToDatabase === 'function') {
            syncSessionsToDatabase();
        }
        return;
    }
    
    const cloudInfo = typeof supabaseManager !== 'undefined' ? {
        teamMember: supabaseManager.teamMember,
        isReady: supabaseManager.isInitialized && supabaseManager.teamMember
    } : { teamMember: 'Unknown', isReady: false };
    
    const totalSessions = sessions.length;
    const totalCatches = sessions.reduce((total, session) => total + session.waypoints.length, 0);
    
    const modalHTML = '<div id="exportChoiceModal" style="' +
        'display: block;' +
        'position: fixed;' +
        'z-index: 2000;' +
        'left: 0;' +
        'top: 0;' +
        'width: 100%;' +
        'height: 100%;' +
        'background-color: rgba(0, 0, 0, 0.5);' +
        'animation: fadeIn 0.3s ease;">' +
            '<div style="' +
                'background-color: white;' +
                'margin: 10% auto;' +
                'padding: 0;' +
                'border-radius: 8px;' +
                'width: 90%;' +
                'max-width: 600px;' +
                'overflow: hidden;' +
                'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);">' +
                '<div style="' +
                    'background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);' +
                    'color: white;' +
                    'padding: 20px;' +
                    'text-align: center;">' +
                    '<h3 style="margin: 0; font-size: 1.4em;">Kies Export Methode</h3>' +
                    '<p style="margin: 10px 0 0 0; opacity: 0.9;">' +
                        totalSessions + ' sessies • ' + totalCatches + ' vangsten • Data gevalideerd' +
                    '</p>' +
                '</div>' +
                '<div style="padding: 30px;">' +
                    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">' +
                        '<div onclick="selectExportMethod(\'excel\')" style="' +
                            'border: 2px solid #4CAF50;' +
                            'border-radius: 8px;' +
                            'padding: 20px;' +
                            'text-align: center;' +
                            'cursor: pointer;' +
                            'transition: all 0.3s ease;' +
                            'background: #f8fdf8;" ' +
                            'onmouseover="this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 4px 12px rgba(76,175,80,0.3)\'" ' +
                            'onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'none\'">' +
                            '<div style="font-size: 3em; margin-bottom: 10px;">📊</div>' +
                            '<h4 style="margin: 0 0 10px 0; color: #4CAF50;">Excel Bestand</h4>' +
                            '<p style="margin: 0; font-size: 0.9em; color: #666; line-height: 1.4;">' +
                                'Download lokaal Excel bestand (.xlsx)<br>' +
                                '• Werkt offline<br>' +
                                '• Geen account vereist<br>' +
                                '• Direct openen in Excel<br>' +
                                '• Inclusief nieuwe kolommen' +
                            '</p>' +
                        '</div>' +
                        '<div onclick="selectExportMethod(\'cloud\')" style="' +
                            'border: 2px solid #2196F3;' +
                            'border-radius: 8px;' +
                            'padding: 20px;' +
                            'text-align: center;' +
                            'cursor: pointer;' +
                            'transition: all 0.3s ease;' +
                            'background: #f8fbff;" ' +
                            'onmouseover="this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 4px 12px rgba(33,150,243,0.3)\'" ' +
                            'onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'none\'">' +
                            '<div style="font-size: 3em; margin-bottom: 10px;">☁️</div>' +
                            '<h4 style="margin: 0 0 10px 0; color: #2196F3;">Cloud Database</h4>' +
                            '<p style="margin: 0; font-size: 0.9em; color: #666; line-height: 1.4;">' +
                                'Sync naar team database<br>' +
                                '• Team: ' + cloudInfo.teamMember + '<br>' +
                                '• Realtime delen<br>' +
                                '• Automatische backup<br>' +
                                '• Inclusief nieuwe velden' +
                            '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div style="text-align: center; margin-top: 20px;">' +
                        '<button onclick="closeExportChoiceModal()" style="' +
                            'padding: 10px 20px;' +
                            'background: #666;' +
                            'color: white;' +
                            'border: none;' +
                            'border-radius: 4px;' +
                            'cursor: pointer;' +
                            'margin-right: 10px;">Annuleren</button>' +
                        '<button onclick="selectExportMethod(\'cloud\')" style="' +
                            'padding: 10px 20px;' +
                            'background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);' +
                            'color: white;' +
                            'border: none;' +
                            'border-radius: 4px;' +
                            'cursor: pointer;">☁️ Database Sync (Aanbevolen)</button>' +
                    '</div>' +
                    '<div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 0.9em; color: #666;">' +
                        '<strong>💡 Aanbeveling:</strong> Database sync is de toekomst van ThePikehunters. ' +
                        'Het bewaart je data veilig online en maakt teamwerk mogelijk.' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function selectExportMethod(method) {
    closeExportChoiceModal();
    
    switch(method) {
        case 'excel':
            if (FEATURE_FLAGS.EXCEL_EXPORT_ENABLED) {
                exportToExcelEnhanced();
            } else {
                if (typeof showStatus === 'function') {
                    showStatus('Excel export is uitgeschakeld - gebruik database sync', 'warning');
                }
                if (typeof syncSessionsToDatabase === 'function') {
                    syncSessionsToDatabase();
                }
            }
            break;
        case 'cloud':
            if (typeof syncSessionsToDatabase === 'function') {
                syncSessionsToDatabase();
            } else {
                if (typeof showStatus === 'function') {
                    showStatus('Database sync niet beschikbaar', 'error');
                }
            }
            break;
        case 'both':
            // Database sync only in current mode
            if (typeof syncSessionsToDatabase === 'function') {
                syncSessionsToDatabase();
            }
            break;
    }
}

function closeExportChoiceModal() {
    const modal = document.getElementById('exportChoiceModal');
    if (modal) {
        modal.remove();
    }
}

// Enhanced cloud sync status update function - UPDATED FOR FASE 3.3 AAS SYNC SUPPORT
function updateCloudSyncStatus() {
    const cloudBtn = document.getElementById('cloudSyncBtn');
    const exportBtn = document.getElementById('exportBtn');
    const cloudStatusElement = document.getElementById('cloudSyncStatus');
    const cloudStatusText = document.getElementById('cloudSyncStatusText');
    
    if (typeof supabaseManager === 'undefined') {
        if (cloudBtn) {
            cloudBtn.innerHTML = 'Cloud Sync (Offline)';
            cloudBtn.disabled = true;
            cloudBtn.title = 'Cloud sync niet beschikbaar';
        }
        if (cloudStatusElement) cloudStatusElement.style.display = 'none';
        return;
    }
    
    const isReady = supabaseManager.isInitialized && supabaseManager.teamMember;
    const sessionCount = (typeof sessions !== 'undefined' && sessions) ? sessions.length : 0;
    
    if (cloudBtn) {
        if (supabaseManager.syncInProgress) {
            cloudBtn.innerHTML = 'Database Syncing...';
            cloudBtn.disabled = true;
            cloudBtn.title = 'Database synchronisatie is bezig...';
        } else if (isReady) {
            cloudBtn.innerHTML = FEATURE_FLAGS.DATABASE_SYNC_ONLY ? 
                '☁️ Sync naar Database' : 
                `Cloud Sync (${supabaseManager.teamMember})`;
            cloudBtn.disabled = sessionCount === 0;
            cloudBtn.title = sessionCount > 0 ? 
                `Synchroniseer ${sessionCount} sessie(s) naar database` : 
                'Geen sessies om te synchroniseren';
                
            // Update onClick handler naar nieuwe functie voor DATABASE_SYNC_ONLY mode
            if (FEATURE_FLAGS.DATABASE_SYNC_ONLY) {
                cloudBtn.onclick = syncSessionsToDatabase; // In plaats van syncToCloud
                cloudBtn.title = 'Upload alle sessies naar nieuwe 3-tabel database structuur';
                
                // Enhance styling for primary workflow
                cloudBtn.style.fontWeight = '600';
                cloudBtn.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
            }
        } else if (supabaseManager.isInitialized) {
            cloudBtn.innerHTML = 'Database Sync (Setup Required)';
            cloudBtn.disabled = false;
            cloudBtn.title = 'Klik om team member in te stellen';
        } else {
            cloudBtn.innerHTML = 'Database Sync (Initializing...)';
            cloudBtn.disabled = true;
            cloudBtn.title = 'Database sync wordt geïnitialiseerd...';
        }
    }
    
    // Update cloud sync status indicator
    if (cloudStatusElement && cloudStatusText) {
        if (isReady) {
            cloudStatusElement.style.display = 'flex';
            cloudStatusText.textContent = `${supabaseManager.teamMember} - Database Ready`;
            cloudStatusElement.style.color = '#2e7d32';
        } else if (supabaseManager.isInitialized) {
            cloudStatusElement.style.display = 'flex';
            cloudStatusText.textContent = 'Setup Required';
            cloudStatusElement.style.color = '#ff9800';
        } else {
            cloudStatusElement.style.display = 'none';
        }
    }
    
    // Update export button based on feature flags
    if (exportBtn) {
        if (FEATURE_FLAGS.SHOW_EXPORT_BUTTON && FEATURE_FLAGS.EXCEL_EXPORT_ENABLED && isReady) {
            exportBtn.onclick = exportWithChoice;
            exportBtn.title = 'Kies tussen Excel export of Database sync (met validatie)';
            exportBtn.style.display = 'inline-flex';
        } else if (FEATURE_FLAGS.SHOW_EXPORT_BUTTON && FEATURE_FLAGS.EXCEL_EXPORT_ENABLED) {
            exportBtn.onclick = exportToExcelWithValidation;
            exportBtn.title = 'Export naar Excel bestand (met validatie)';
            exportBtn.style.display = 'inline-flex';
        } else {
            exportBtn.style.display = 'none';
        }
    }
    
    // === FASE 3.3: AAS SYNC BUTTON STATUS MANAGEMENT ===
    // Update aas sync button status
    const aasBtn = document.getElementById('cloudSyncAasjesBtn');
    if (aasBtn && FEATURE_FLAGS.AAS_SYNC_ENABLED) {
        if (isReady) {
            const aasCount = (typeof LureManager !== 'undefined' && LureManager.lures) ? LureManager.lures.length : 0;
            aasBtn.disabled = aasCount === 0;
            aasBtn.title = aasCount > 0 ? 
                `Upload ${aasCount} lokale aasjes naar database` : 
                'Geen lokale aasjes om te uploaden';
        } else {
            aasBtn.disabled = true;
            aasBtn.title = 'Database sync niet geïnitialiseerd';
        }
    } else if (aasBtn && !FEATURE_FLAGS.AAS_SYNC_ENABLED) {
        // Hide aas sync button if feature is disabled
        aasBtn.style.display = 'none';
    }
}

// ================================
// RESET FUNCTION
// ================================

function clearAll() {
    if (!confirm('Weet je zeker dat je alles wilt resetten?')) return;
    
    gpxData = [];
    sessions = [];
    trackPoints = [];
    waypoints = [];
    storedFiles = [];
    activeSpeciesFilter = null;
    
    clearMap();
    closeLureModal();
    
    // Close any modals
    if (document.getElementById('validationModal')) {
        closeValidationModal();
    }
    if (document.getElementById('exportChoiceModal')) {
        closeExportChoiceModal();
    }
    
    document.getElementById('sessionsList').innerHTML = '';
    document.getElementById('speciesFilter').innerHTML = '';
    document.getElementById('dataTableBody').innerHTML = '';
    document.getElementById('sessionCount').textContent = '0';
    document.getElementById('catchCount').textContent = '0';
    document.getElementById('speciesCount').textContent = '0';
    document.getElementById('totalTime').textContent = '0h';
    document.getElementById('fileCount').textContent = '';
    
    // Enable export button based on feature flags
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.disabled = true;
        if (FEATURE_FLAGS.SHOW_EXPORT_BUTTON) {
            exportBtn.style.display = 'inline-flex';
        } else {
            exportBtn.style.display = 'none';
        }
    }
    
    document.getElementById('addSessionBtn').disabled = false;
    document.getElementById('gpxInput').value = '';
    
    // Reset validation state
    window.validationState = {
        lastReport: null,
        enabled: true,
        phases: ['A', 'B', 'C', 'V']
    };
    
    window.blockedCatchAttempts = 0;
    
    if (typeof ValidationStateManager !== 'undefined') {
        ValidationStateManager.emergencyReset();
    }
    
    updateCloudSyncStatus();
    
    showStatus(FEATURE_FLAGS.DATABASE_SYNC_ONLY ? 
        'Alles gereset - Database sync ready' : 
        'Alles gereset', 'info');
}

// ================================
// ENHANCED INITIALIZATION - DATABASE SYNC WORKFLOW
// ================================
window.onload = function() {
    const version = FEATURE_FLAGS.DATABASE_SYNC_ONLY ? 'Database Sync Only v1.1' : 'Enhanced Export System';
    console.log(`ThePikehunters Catchlog v6.3 - ${version} - Initializing...`);
    
    try {
        initMap();
        initLureSelector();
        
        const fileInput = document.getElementById('gpxInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }
        
        // Initialize cloud sync status monitoring
        if (typeof supabaseManager !== 'undefined') {
            setInterval(updateCloudSyncStatus, 5000);
        }
        
        updateCloudSyncStatus();
        
        // Configure UI based on feature flags
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('addSessionBtn').style.display = 'inline-block';
        
        // Initialize blocked attempts counter
        window.blockedCatchAttempts = 0;
        
        // Configure database sync workflow after DOM is loaded
        setTimeout(() => {
            hideExportButton();
            showDatabaseSyncStatus();
        }, 100);
        
        console.log(`ThePikehunters Catchlog ready with ${version}!`);
        
        const statusMessage = FEATURE_FLAGS.DATABASE_SYNC_ONLY ? 
            'ThePikehunters Catchlog - Database Sync Workflow + Aas Management geactiveerd!' :
            'ThePikehunters Catchlog geladen met Enhanced Export System!';
            
        showStatus(statusMessage, 'success');
        
        if (FEATURE_FLAGS.DEBUG_MODE) {
            console.log('Feature flags configuration:', FEATURE_FLAGS);
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Fout bij initialiseren: ' + error.message);
    }
};

// ================================
// GLOBAL EXPORTS - DATABASE SYNC FOCUSED
// ================================

// Session Naming Helper
window.generateExportSessionName = generateExportSessionName;

// Database Sync Functions (PRIMARY)
window.hideExportButton = hideExportButton;
window.showDatabaseSyncStatus = showDatabaseSyncStatus;

// Legacy Export Functions (PRESERVED FOR COMPATIBILITY)
window.exportToExcel = exportToExcelEnhanced;
window.exportToExcelWithValidation = exportToExcelWithValidation;
window.exportWithChoice = exportWithChoice;
window.showExportChoiceModal = showExportChoiceModal;
window.selectExportMethod = selectExportMethod;
window.closeExportChoiceModal = closeExportChoiceModal;
window.updateCloudSyncStatus = updateCloudSyncStatus;

// Core Functions
window.clearAll = clearAll;

// Feature Flags (READ-ONLY)
window.FEATURE_FLAGS = Object.freeze({...FEATURE_FLAGS});

console.log('ThePikehunters Catchlog - Database Sync Workflow + Aas Management loaded!');
console.log('- hideExportButton() - Configures database-only workflow');
console.log('- showDatabaseSyncStatus() - Enhanced status for database sync');
console.log('- exportWithChoice() - Redirects to database sync');
console.log('- Database sync integration with real-time status updates');
console.log('- Feature flags configured for database-only workflow');
console.log('- Excel export functions preserved but redirected to database sync');
console.log('- Updated button handlers for new 3-tabel database sync functions');
console.log('- Aas sync button status management (Fase 3.3)');

if (FEATURE_FLAGS.DEBUG_MODE) {
    console.log('=== DEBUG MODE ENABLED ===');
    console.log('Feature flags:', FEATURE_FLAGS);
    console.log('=== END DEBUG INFO ===');
}