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
// GLOBAL VARIABLES - Legacy from map-processing.js
// ================================

let sessions = [];           // Active sessions array
let waypoints = [];          // All waypoints from all sessions
let storedFiles = [];        // Stored GPX/files (legacy)
let activeSpeciesFilter = null;  // Current species filter for display

// ================================
// CONFIG OBJECT - Application Configuration
// ================================

const CONFIG = {
    // Session display colors (cycled for multiple sessions)
    sessionColors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#85C1E2'
    ],

    // Common pike species for validation
    commonSpecies: [
        'Baars', 'Snoek', 'Karper', 'Brasem', 'Schubkarper',
        'Alver', 'Rode oog', 'Winde', 'Blankvoorn', 'Aal',
        'Paling', 'Zeelt', 'Kolblei', 'Voorn', 'Modderaal'
    ],

    // UI settings
    ui: {
        statusTimeout: 4000  // Status message display timeout
    },

    // Validation settings
    batchSize: 50,
    similarity: {
        threshold: 0.7
    },
    duplicateDetection: {
        enabled: true
    },

    // Legacy - placeholder for removed Supabase config
    tables: {}
};

// ================================
// DATABASE SYNC WORKFLOW FUNCTIONS
// ================================

// Enhanced cloud sync status update function - UPDATED FOR FASE 3.3 AAS SYNC SUPPORT
function updateCloudSyncStatus() {
    const cloudBtn = document.getElementById('cloudSyncBtn');
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
// STATUS MESSAGE DISPLAY - Verplaatst van map-processing.js
// ================================

function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message status-${type}`;
    statusDiv.style.display = 'block';

    // Enhanced timeout met type-specific durations
    const timeout = type === 'error' ? 6000 : 4000;

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, timeout);

    // Log naar console voor debugging
    console.log(`Status (${type}): ${message}`);
}

// ================================
// ENHANCED INITIALIZATION - DATABASE SYNC WORKFLOW
// ================================

window.onload = function() {
    const version = FEATURE_FLAGS.DATABASE_SYNC_ONLY ? 'Database Sync Only v1.1' : 'Enhanced Export System';

    try {
        // Initialize cloud sync status monitoring
        if (typeof supabaseManager !== 'undefined') {
            setInterval(updateCloudSyncStatus, 5000);
        }

        updateCloudSyncStatus();

        // Initialize lure selector (load aasjes from localStorage)
        if (typeof initLureSelector === 'function') {
            initLureSelector();
        }

        // Initialize blocked attempts counter
        window.blockedCatchAttempts = 0;

        const statusMessage = FEATURE_FLAGS.DATABASE_SYNC_ONLY ?
            'ThePikehunters Catchlog - Database Sync Workflow + Aas Management geactiveerd!' :
            'ThePikehunters Catchlog geladen met Enhanced Export System!';

        // Use window.showStatus to ensure it's available
        if (typeof window.showStatus === 'function') {
            window.showStatus(statusMessage, 'success');
        } else {
            console.log(`Status: ${statusMessage}`);
        }

        if (FEATURE_FLAGS.DEBUG_MODE) {
            console.log('Feature flags configuration:', FEATURE_FLAGS);
        }

        // Start directly with Fase 4 overview
        if (typeof showPhase4Screen === 'function') {
            showPhase4Screen();
        }

    } catch (error) {
        console.error('Initialization error:', error);
        alert('Fout bij initialiseren: ' + error.message);
    }
};

// ================================
// GLOBAL EXPORTS - DATABASE SYNC FOCUSED
// ================================

// Status Display
window.showStatus = showStatus;

// Cloud Sync Status Update
window.updateCloudSyncStatus = updateCloudSyncStatus;

// Feature Flags (READ-ONLY)
window.FEATURE_FLAGS = Object.freeze({...FEATURE_FLAGS});

if (FEATURE_FLAGS.DEBUG_MODE) {
    console.log('=== DEBUG MODE ENABLED ===');
    console.log('Feature flags:', FEATURE_FLAGS);
    console.log('=== END DEBUG INFO ===');
}