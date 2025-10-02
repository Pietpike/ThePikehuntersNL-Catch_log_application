/*
================================================================================
UPDATED FILE: data-managers.js - Enhanced Cloud Sync Integration + Universal Data Manager + Debug System Extraction + FASE 1.1.2 & 1.1.3 & 1.4 & 1.5: LureManager Data Model Uitbreiding + Backup/Restore Integratie
================================================================================
DATA MANAGEMENT SYSTEMS - VOLLEDIG GEÏNTEGREERD MET CLOUD SYNC + NIEUWE DROPDOWN MANAGER + DEBUG EXTRACTION + FASE 1.1.2 & 1.1.3 & 1.4 & 1.5
- LocationManager: Location storage and validation + Cloud sync awareness (preserved)
- SettingsManager: Backup/restore functionality + Enhanced UI refresh after import + FASE 1.5: Uitgebreide backup/restore voor aas eigenschappen
- DropdownManager: Dynamic dropdown options + NEW: Zon/Schaduw, Bodemhardheid + NIEUWE AAS CATEGORIES (FASE 1.1.1)
- LureManager: Bait/lure database management + Cloud sync integration + UITGEBREIDE LURE DATA MODEL (FASE 1.1.2 & 1.1.3)
- DataManager: UNIVERSAL DATA MANAGER for locations and all dropdown categories + AAS EIGENSCHAPPEN BEHEER (FASE 1.4)
- debugInfo: EXTRACTED TO debug-info.js for better modularity (NEW)
- Enhanced cloud sync integration throughout all data managers
- Real-time synchronization status and conflict resolution
- FASE 1.5: Enhanced backup/restore met uitgebreide aas metadata tracking
================================================================================
*/

/*
================================================================================
REFACTORED: Debug functionality extracted to debug-info.js - Version 6.2-extracted
FASE 1.1.1: Nieuwe Aas Dropdown Categories toegevoegd
FASE 1.1.2 & 1.1.3: LureManager Data Model Uitbreiding - Uitgebreide lure object structure
FASE 1.4: Data Beheer Integratie - Aas categories volledig beheerbaar via Data Beheer
FASE 1.5: Backup/Restore Integratie - Nieuwe aas eigenschappen opgenomen in backup/restore systeem
================================================================================
Debug functions have been moved to debug-info.js for better code organization.
All existing data management functionality preserved.
Fallback mechanisms ensure compatibility if debug-info.js fails to load.
NIEUW: 8 nieuwe aas-specifieke dropdown categories toegevoegd aan DropdownManager
NIEUW: LureManager ondersteunt nu uitgebreide aas eigenschappen en validatie
NIEUW: DataManager toont alle aas categories voor volledig beheer
NIEUW: SettingsManager backup/restore ondersteunt uitgebreide aas metadata (FASE 1.5)
================================================================================
*/

// ================================
// Enhanced Location Management System with Cloud Sync Integration (PRESERVED)
// ================================
const LocationManager = {
    
    getAll: function() {
        return loadSavedLocations();
    },
    
    add: function(location) {
        const locations = this.getAll();
        const trimmedLocation = location.trim();
        
        // Phase C - Location Name Validation
        const validation = validateLocationName(trimmedLocation);
        if (!validation.valid) {
            showStatus(`Locatie fout (Phase ${validation.phase}): ${validation.error}`, 'error');
            return false;
        }
        
        if (trimmedLocation && !locations.includes(trimmedLocation)) {
            locations.push(trimmedLocation);
            locations.sort();
            saveLocations(locations);
            
            // Enhanced cloud sync notification
            this.notifyCloudSyncChange('add', trimmedLocation);
            
            return true;
        }
        return false;
    },
    
    remove: function(location) {
        const locations = this.getAll();
        const filteredLocations = locations.filter(loc => loc !== location);
        saveLocations(filteredLocations);
        
        // Enhanced cloud sync notification
        this.notifyCloudSyncChange('remove', location);
        
        return true;
    },
    
    update: function(oldLocation, newLocation) {
        const locations = this.getAll();
        const index = locations.indexOf(oldLocation);
        const trimmedNew = newLocation.trim();
        
        // Phase C - Location Name Validation
        const validation = validateLocationName(trimmedNew);
        if (!validation.valid) {
            showStatus(`Locatie fout (Phase ${validation.phase}): ${validation.error}`, 'error');
            return false;
        }
        
        if (index > -1 && trimmedNew && !locations.includes(trimmedNew)) {
            locations[index] = trimmedNew;
            locations.sort();
            saveLocations(locations);
            
            // Enhanced cloud sync notification
            this.notifyCloudSyncChange('update', `${oldLocation} → ${trimmedNew}`);
            
            return true;
        }
        return false;
    },
    
    // Enhanced cloud sync notification system
    notifyCloudSyncChange: function(action, details) {
        const timestamp = new Date().toISOString();
        
        // Update local metadata
        localStorage.setItem('pikehunters_locations_last_modified', timestamp);
        localStorage.setItem('pikehunters_locations_last_action', JSON.stringify({
            action: action,
            details: details,
            timestamp: timestamp
        }));
        
        // Trigger cloud sync status update
        if (typeof updateCloudSyncStatus === 'function') {
            updateCloudSyncStatus();
        }
        
        // Trigger real-time validation updates
        if (typeof updateValidationInRealTime === 'function') {
            updateValidationInRealTime();
        }
        
        console.log(`LocationManager: ${action} - ${details} (Cloud sync notified)`);
    },
    
    getLastModified: function() {
        return localStorage.getItem('pikehunters_locations_last_modified');
    },
    
    getLastAction: function() {
        const actionData = localStorage.getItem('pikehunters_locations_last_action');
        return actionData ? JSON.parse(actionData) : null;
    },
    
    // DEPRECATED: Use DataManager.showManager() instead
    showManager: function() {
        console.warn('LocationManager.showManager() is deprecated. Use DataManager.showManager() instead.');
        if (typeof DataManager !== 'undefined' && DataManager.showManager) {
            DataManager.showManager();
        } else {
            this.createManagerModal();
        }
    },
    
    // Enhanced manager modal with cloud sync integration (PRESERVED for backwards compatibility)
    createManagerModal: function() {
        const cloudInfo = this.getCloudSyncInfo();
        const lastAction = this.getLastAction();
        
        const modalHTML = `
            <div id="locationManagerModal" style="
                display: block;
                position: fixed;
                z-index: 2000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            ">
                <div style="
                    background-color: white;
                    margin: 5% auto;
                    padding: 0;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 700px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                ">
                    <div style="
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                        color: white;
                        padding: 15px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <h3 style="margin: 0; font-size: 1.2em;">
                            📍 Locatie Beheer ${cloudInfo.available ? '☁️' : ''}
                        </h3>
                        <span style="
                            color: white;
                            font-size: 28px;
                            font-weight: bold;
                            cursor: pointer;
                            line-height: 20px;
                        " onclick="LocationManager.closeManager()">&times;</span>
                    </div>
                    
                    ${this.generateCloudSyncHeaderHTML(cloudInfo, lastAction)}
                    
                    <div style="padding: 20px; max-height: calc(80vh - 180px); overflow-y: auto;">
                        <div style="margin-bottom: 20px;">
                            <h4>Bestaande Locaties (${this.getAll().length}):</h4>
                            <div id="locationList"></div>
                        </div>
                        
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                            <h4>Nieuwe Locatie Toevoegen:</h4>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <input type="text" id="newLocationInput" placeholder="Nieuwe locatie naam (min. 3 tekens)" style="
                                    flex: 1;
                                    padding: 8px;
                                    border: 1px solid #ddd;
                                    border-radius: 4px;
                                " maxlength="100">
                                <button onclick="LocationManager.addFromModal()" style="
                                    padding: 8px 15px;
                                    background: #4CAF50;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    cursor: pointer;
                                ">Toevoegen</button>
                            </div>
                            <small style="color: #666; margin-top: 5px; display: block;">
                                Tip: Gebruik formaat "Water - Plaats" (bijv. "Vecht - Breukelen")
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.updateLocationList();
        
        document.getElementById('locationManagerModal').addEventListener('click', (e) => {
            if (e.target.id === 'locationManagerModal') {
                this.closeManager();
            }
        });
    },
    
    generateCloudSyncHeaderHTML: function(cloudInfo, lastAction) {
        if (!cloudInfo.available) {
            return '';
        }
        
        return `
            <div style="background: ${cloudInfo.status === 'Ready' ? '#e8f5e9' : '#fff3e0'}; padding: 10px 20px; border-bottom: 1px solid #c8e6c9;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: #2e7d32;">
                        <strong>☁️ Cloud Sync:</strong> ${cloudInfo.status}
                        ${cloudInfo.teamMember ? `(${cloudInfo.teamMember})` : ''}
                    </div>
                    <div style="font-size: 0.8em; color: #666;">
                        ${lastAction ? `Laatste wijziging: ${lastAction.action} - ${new Date(lastAction.timestamp).toLocaleString('nl-NL')}` : 'Geen recente wijzigingen'}
                    </div>
                </div>
                <small style="color: #2e7d32; display: block; margin-top: 5px;">
                    Locaties worden automatisch meegenomen bij backup/restore en cloud sync operaties
                </small>
            </div>
        `;
    },
    
    updateLocationList: function() {
        const listContainer = document.getElementById('locationList');
        if (!listContainer) return;
        
        const locations = this.getAll();
        
        if (locations.length === 0) {
            listContainer.innerHTML = '<p style="color: #666; text-align: center;">Geen locaties gevonden.</p>';
            return;
        }
        
        listContainer.innerHTML = locations.map((location, index) => `
            <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                margin: 5px 0;
                background: #f9f9f9;
                border-radius: 4px;
                border: 1px solid #eee;
            ">
                <span style="flex: 1; padding: 4px;" title="Klik om te bewerken">${location}</span>
                <button onclick="LocationManager.editLocation('${location.replace(/'/g, "\\'")}', ${index})" style="
                    padding: 4px 8px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 0.8em;
                " title="Bewerk deze locatie">✏️</button>
                <button onclick="LocationManager.removeLocation('${location.replace(/'/g, "\\'")}', ${index})" style="
                    padding: 4px 8px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 0.8em;
                " title="Verwijder deze locatie">🗑️</button>
            </div>
        `).join('');
    },
    
    addFromModal: function() {
        const input = document.getElementById('newLocationInput');
        const newLocation = input.value.trim();
        
        if (!newLocation) {
            alert('Voer een locatie naam in');
            return;
        }
        
        if (this.add(newLocation)) {
            input.value = '';
            this.updateLocationList();
            
            const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
            showStatus(`Locatie "${newLocation}" toegevoegd${cloudText}`, 'success');
        } else {
            showStatus('Locatie bestaat al of is ongeldig', 'warning');
        }
    },
    
    editLocation: function(location, index) {
        const newName = prompt(`Locatie bewerken:\n\nHuidige naam: ${location}\n\nVoer nieuwe naam in:`, location);
        
        if (newName && newName.trim() && newName.trim() !== location) {
            if (this.update(location, newName.trim())) {
                this.updateLocationList();
                
                const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
                showStatus(`Locatie bijgewerkt naar "${newName.trim()}"${cloudText}`, 'success');
                
                // Update UI components that use locations
                if (typeof updateSessionsList === 'function') updateSessionsList();
                if (typeof updateDataTable === 'function') updateDataTable();
            }
        }
    },
    
    removeLocation: function(location, index) {
        if (confirm(`Weet je zeker dat je de locatie "${location}" wilt verwijderen?\n\nDit kan niet ongedaan worden gemaakt.`)) {
            this.remove(location);
            this.updateLocationList();
            
            const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
            showStatus(`Locatie "${location}" verwijderd${cloudText}`, 'success');
            
            // Update UI components that use locations
            if (typeof updateSessionsList === 'function') updateSessionsList();
            if (typeof updateDataTable === 'function') updateDataTable();
        }
    },
    
    closeManager: function() {
        const modal = document.getElementById('locationManagerModal');
        if (modal) {
            modal.remove();
        }
    },
    
    // Enhanced cloud sync info gathering
    getCloudSyncInfo: function() {
        let cloudInfo = {
            available: false,
            status: 'Offline',
            teamMember: null,
            lastModified: this.getLastModified(),
            lastAction: this.getLastAction(),
            initialized: false
        };
        
        if (typeof supabaseManager !== 'undefined') {
            cloudInfo = {
                available: true,
                initialized: supabaseManager.isInitialized,
                status: supabaseManager.isInitialized ? 
                    (supabaseManager.teamMember ? 'Ready' : 'Setup Required') : 
                    'Initializing',
                teamMember: supabaseManager.teamMember,
                lastModified: this.getLastModified(),
                lastAction: this.getLastAction()
            };
        }
        
        return cloudInfo;
    }
};

// ================================
// NEW UNIVERSAL DATA MANAGER - Combines Location + Dropdown Management + FASE 1.4: Aas Categories Beheer
// ================================
const DataManager = {
    
    showManager: function() {
        this.createManagerModal();
    },
    
    createManagerModal: function() {
        // Remove existing modal if present
        const existingModal = document.getElementById('dataManagerModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const cloudInfo = this.getCloudSyncInfo();
        
        const modalHTML = `
            <div id="dataManagerModal" style="
                display: block;
                position: fixed;
                z-index: 2000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            ">
                <div style="
                    background-color: white;
                    margin: 3% auto;
                    padding: 0;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 1000px;
                    max-height: 85vh;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                ">
                    <div style="
                        background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
                        color: white;
                        padding: 15px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <h3 style="margin: 0; font-size: 1.3em;">
                            🔧 Data Beheer ${cloudInfo.available ? '☁️' : ''}
                        </h3>
                        <span style="
                            color: white;
                            font-size: 28px;
                            font-weight: bold;
                            cursor: pointer;
                            line-height: 20px;
                        " onclick="DataManager.closeManager()">&times;</span>
                    </div>
                    
                    ${this.generateCloudSyncHeaderHTML(cloudInfo)}
                    
                    <div style="padding: 20px; max-height: calc(85vh - 160px); overflow-y: auto;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <!-- Left Column: Locations + Session Dropdowns -->
                            <div>
                                ${this.generateLocationSection()}
                                ${this.generateSessionDropdownsSection()}
                            </div>
                            
                            <!-- Right Column: Catch Dropdowns + Aas Dropdowns -->
                            <div>
                                ${this.generateCatchDropdownsSection()}
                                ${this.generateAasDropdownsSection()}
                            </div>
                        </div>
                    </div>
                    
                    <div style="
                        padding: 15px 20px;
                        border-top: 1px solid #eee;
                        background: #f9f9f9;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="font-size: 0.9em; color: #666;">
                            Version 6.2-extracted + Fase 1.1.2 & 1.1.3 & 1.4 & 1.5 - Universal Data Manager + Cloud Sync + Debug System Extraction + Aas Management + Backup/Restore
                        </div>
                        <button onclick="DataManager.closeManager()" style="
                            padding: 8px 15px;
                            background: #2196F3;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Sluiten</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Set up event listeners
        document.getElementById('dataManagerModal').addEventListener('click', (e) => {
            if (e.target.id === 'dataManagerModal') {
                this.closeManager();
            }
        });
        
        this.updateAllSections();
    },
    
    generateCloudSyncHeaderHTML: function(cloudInfo) {
        if (!cloudInfo.available) {
            return '';
        }
        
        return `
            <div style="background: ${cloudInfo.status === 'Ready' ? '#e8f5e9' : '#fff3e0'}; padding: 10px 20px; border-bottom: 1px solid #c8e6c9;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: #2e7d32;">
                        <strong>☁️ Cloud Sync:</strong> ${cloudInfo.status}
                        ${cloudInfo.teamMember ? `(${cloudInfo.teamMember})` : ''}
                    </div>
                    <div style="font-size: 0.8em; color: #666;">
                        Data wijzigingen worden automatisch gesynchroniseerd
                    </div>
                </div>
            </div>
        `;
    },
    
    generateLocationSection: function() {
        return `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #1a1a1a; display: flex; align-items: center; gap: 8px;">
                    📍 Locaties
                    <span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em;" id="locationCount">0</span>
                </h4>
                
                <div id="locationListContainer" style="max-height: 150px; overflow-y: auto; margin-bottom: 15px;"></div>
                
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="newLocationInput" placeholder="Water - Plaats (bijv. Vecht - Breukelen)" style="
                        flex: 1;
                        padding: 6px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 0.9em;
                    " maxlength="100">
                    <button onclick="DataManager.addLocation()" style="
                        padding: 6px 12px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.9em;
                    ">+</button>
                </div>
            </div>
        `;
    },
    
    generateSessionDropdownsSection: function() {
        const sessionCategories = ['watersoort', 'stroomsnelheid', 'helderheid'];
        const categoryNames = {
            watersoort: '💧 Watersoort',
            stroomsnelheid: '🌊 Stroomsnelheid', 
            helderheid: '👁️ Helderheid'
        };
        
        return `
            <div style="background: #f0f8ff; padding: 15px; border-radius: 6px;">
                <h4 style="margin: 0 0 15px 0; color: #1a1a1a;">🏞️ Sessie Eigenschappen</h4>
                ${sessionCategories.map(category => this.generateDropdownCategoryHTML(category, categoryNames[category])).join('')}
            </div>
        `;
    },
    
    generateCatchDropdownsSection: function() {
        const catchCategories = ['techniek', 'vissnelheid', 'structuur', 'aasvis', 'vangsthoogte', 'booster', 'zonschaduw', 'bodemhardheid'];
        const categoryNames = {
            techniek: '🎣 Techniek',
            vissnelheid: '⚡ Vissnelheid',
            structuur: '🗿 Structuur',
            aasvis: '🟠 Aasvis op Stek', 
            vangsthoogte: '📍 Vangsthoogte',
            booster: '🚀 Booster',
            zonschaduw: '☀️ Zon/Schaduw',
            bodemhardheid: '🪨 Bodemhardheid'
        };
        
        return `
            <div style="background: #f0fff4; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #1a1a1a;">🎯 Vangst Eigenschappen</h4>
                ${catchCategories.map(category => this.generateDropdownCategoryHTML(category, categoryNames[category])).join('')}
            </div>
        `;
    },
    
    // FASE 1.4.1: Aas dropdown categories section voor Data Beheer integratie
    generateAasDropdownsSection: function() {
        const aasCategories = ['aastype', 'aasactie', 'aasdrijfvermogen', 'aasvorm', 'aasprimairekleur', 'aassecundairekleur', 'aasratel', 'aastail'];
        const categoryNames = {
            aastype: '🎣 Aas Type',
            aasactie: '⚡ Aas Actie', 
            aasdrijfvermogen: '🌊 Drijfvermogen',
            aasvorm: '📏 Vorm',
            aasprimairekleur: '🎨 Primaire Kleur',
            aassecundairekleur: '🎨 Secundaire Kleur',
            aasratel: '🔔 Ratel',
            aastail: '🐟 Tail'
        };
        
        return `
            <div style="background: #fff8e1; padding: 15px; border-radius: 6px;">
                <h4 style="margin: 0 0 15px 0; color: #1a1a1a;">🎣 Aas Eigenschappen</h4>
                ${aasCategories.map(category => this.generateDropdownCategoryHTML(category, categoryNames[category])).join('')}
            </div>
        `;
    },
    
    generateDropdownCategoryHTML: function(category, displayName) {
        return `
            <div style="margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px;">
                <h5 style="margin: 0 0 8px 0; display: flex; justify-content: space-between; align-items: center;">
                    ${displayName}
                    <span style="background: #2196F3; color: white; padding: 1px 6px; border-radius: 8px; font-size: 0.7em;" id="${category}Count">0</span>
                </h5>
                
                <div id="${category}List" style="max-height: 80px; overflow-y: auto; margin-bottom: 8px; font-size: 0.85em;"></div>
                
                <div style="display: flex; gap: 6px;">
                    <input type="text" id="new${category}Input" placeholder="Nieuwe optie..." style="
                        flex: 1;
                        padding: 4px 6px;
                        border: 1px solid #ddd;
                        border-radius: 3px;
                        font-size: 0.85em;
                    " onkeypress="if(event.key==='Enter') DataManager.addDropdownOption('${category}')">
                    <button onclick="DataManager.addDropdownOption('${category}')" style="
                        padding: 4px 8px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 0.8em;
                    ">+</button>
                </div>
            </div>
        `;
    },
    
    updateAllSections: function() {
        this.updateLocationSection();
        this.updateDropdownSections();
    },
    
    updateLocationSection: function() {
        const locations = LocationManager.getAll();
        const container = document.getElementById('locationListContainer');
        const countElement = document.getElementById('locationCount');
        
        if (!container) return;
        
        if (countElement) {
            countElement.textContent = locations.length;
        }
        
        if (locations.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; font-size: 0.9em; margin: 10px 0;">Geen locaties</p>';
            return;
        }
        
        container.innerHTML = locations.map(location => `
            <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 6px;
                margin: 2px 0;
                background: white;
                border-radius: 3px;
                border: 1px solid #ddd;
                font-size: 0.85em;
            ">
                <span style="flex: 1;" title="${location}">${location}</span>
                <button onclick="DataManager.editLocation('${location.replace(/'/g, "\\'")}', this)" style="
                    padding: 2px 6px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 0.7em;
                " title="Bewerk">✏️</button>
                <button onclick="DataManager.removeLocation('${location.replace(/'/g, "\\'")}', this)" style="
                    padding: 2px 6px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 0.7em;
                " title="Verwijder">×</button>
            </div>
        `).join('');
    },
    
    // FASE 1.4.2: UpdateDropdownSections uitgebreid met aas categories
    updateDropdownSections: function() {
        const categories = [
            // Bestaande categories
            'watersoort', 'stroomsnelheid', 'helderheid', 'techniek', 'vissnelheid', 'structuur', 'aasvis', 'vangsthoogte', 'booster', 'zonschaduw', 'bodemhardheid',
            // Nieuwe aas categories - FASE 1.4.2
            'aastype', 'aasactie', 'aasdrijfvermogen', 'aasvorm', 'aasprimairekleur', 'aassecundairekleur', 'aasratel', 'aastail'
        ];
        
        categories.forEach(category => {
            const options = DropdownManager.getOptions(category);
            const container = document.getElementById(`${category}List`);
            const countElement = document.getElementById(`${category}Count`);
            
            if (!container) return;
            
            if (countElement) {
                countElement.textContent = options.length;
            }
            
            if (options.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center; margin: 4px 0;">Geen opties</p>';
                return;
            }
            
            container.innerHTML = options.map(option => `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 4px;
                    margin: 1px 0;
                    background: white;
                    border-radius: 2px;
                    border: 1px solid #eee;
                ">
                    <span style="flex: 1;" title="${option}">${option}</span>
                    <button onclick="DataManager.removeDropdownOption('${category}', '${option.replace(/'/g, "\\'")}', this)" style="
                        padding: 1px 4px;
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 2px;
                        cursor: pointer;
                        font-size: 0.6em;
                        line-height: 1;
                    " title="Verwijder">×</button>
                </div>
            `).join('');
        });
    },
    
    // Location Management Functions
    addLocation: function() {
        const input = document.getElementById('newLocationInput');
        if (!input) return;
        
        const newLocation = input.value.trim();
        
        if (!newLocation) {
            alert('Voer een locatie naam in');
            return;
        }
        
        if (LocationManager.add(newLocation)) {
            input.value = '';
            this.updateLocationSection();
            
            // Update main UI
            if (typeof updateSessionsList === 'function') updateSessionsList();
            if (typeof updateDataTable === 'function') updateDataTable();
            
            const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
            showStatus(`Locatie "${newLocation}" toegevoegd${cloudText}`, 'success');
        } else {
            showStatus('Locatie bestaat al of is ongeldig', 'warning');
        }
    },
    
    editLocation: function(location, buttonElement) {
        const newName = prompt(`Locatie bewerken:\n\nHuidige naam: ${location}\n\nVoer nieuwe naam in:`, location);
        
        if (newName && newName.trim() && newName.trim() !== location) {
            if (LocationManager.update(location, newName.trim())) {
                this.updateLocationSection();
                
                // Update main UI
                if (typeof updateSessionsList === 'function') updateSessionsList();
                if (typeof updateDataTable === 'function') updateDataTable();
                
                const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
                showStatus(`Locatie bijgewerkt naar "${newName.trim()}"${cloudText}`, 'success');
            }
        }
    },
    
    removeLocation: function(location, buttonElement) {
        if (confirm(`Weet je zeker dat je de locatie "${location}" wilt verwijderen?\n\nDit kan niet ongedaan worden gemaakt.`)) {
            LocationManager.remove(location);
            this.updateLocationSection();
            
            // Update main UI
            if (typeof updateSessionsList === 'function') updateSessionsList();
            if (typeof updateDataTable === 'function') updateDataTable();
            
            const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
            showStatus(`Locatie "${location}" verwijderd${cloudText}`, 'success');
        }
    },
    
    // Dropdown Management Functions
    addDropdownOption: function(category) {
        const input = document.getElementById(`new${category}Input`);
        if (!input) return;
        
        const newOption = input.value.trim();
        
        if (!newOption) {
            alert('Voer een nieuwe optie in');
            return;
        }
        
        if (DropdownManager.addOption(category, newOption)) {
            input.value = '';
            this.updateDropdownSections();
            
            // Update main UI
            if (typeof updateSessionsList === 'function') updateSessionsList();
            if (typeof updateDataTable === 'function') updateDataTable();
            
            const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
            const newFieldText = (category === 'zonschaduw' || category === 'bodemhardheid') ? ' (NIEUW VELD)' : '';
            const aasFieldText = category.startsWith('aas') ? ' (AAS EIGENSCHAP - FASE 1.1.1)' : '';
            showStatus(`"${newOption}" toegevoegd aan ${category}${newFieldText}${aasFieldText}${cloudText}`, 'success');
        } else {
            showStatus(`"${newOption}" bestaat al in ${category}`, 'warning');
        }
    },
    
    removeDropdownOption: function(category, option, buttonElement) {
        if (confirm(`Weet je zeker dat je "${option}" wilt verwijderen uit ${category}?\n\nDit kan niet ongedaan worden gemaakt.`)) {
            if (DropdownManager.removeOption(category, option)) {
                this.updateDropdownSections();
                
                // Update main UI
                if (typeof updateSessionsList === 'function') updateSessionsList();
                if (typeof updateDataTable === 'function') updateDataTable();
                
                const cloudText = this.getCloudSyncInfo().available ? ' (Cloud sync ready)' : '';
                showStatus(`"${option}" verwijderd uit ${category}${cloudText}`, 'success');
            }
        }
    },
    
    closeManager: function() {
        const modal = document.getElementById('dataManagerModal');
        if (modal) {
            modal.remove();
        }
    },
    
    getCloudSyncInfo: function() {
        let cloudInfo = {
            available: false,
            status: 'Offline',
            teamMember: null,
            initialized: false
        };
        
        if (typeof supabaseManager !== 'undefined') {
            cloudInfo = {
                available: true,
                status: supabaseManager.isInitialized ? 
                    (supabaseManager.teamMember ? 'Ready' : 'Setup Required') : 
                    'Initializing',
                teamMember: supabaseManager.teamMember,
                initialized: supabaseManager.isInitialized
            };
        }
        
        return cloudInfo;
    }
};

// ================================
// Enhanced Settings Manager with Advanced Cloud Sync Metadata + UI REFRESH FIX + FASE 1.5: Backup/Restore Integratie
// ================================
const SettingsManager = {
    
    // FASE 1.5.1 & 1.5.2: Enhanced export with comprehensive cloud sync metadata + Uitgebreide aas metadata
    exportAll: function() {
        const timestamp = new Date().toISOString();
        const dateStr = timestamp.split('T')[0];
        
        // Comprehensive cloud sync status collection
        let cloudSyncStatus = {
            enabled: false,
            teamMember: 'Unknown',
            lastSync: null,
            supabaseUrl: null,
            initialized: false,
            connectionTest: null,
            syncHistory: [],
            dataMetrics: {}
        };
        
        if (typeof supabaseManager !== 'undefined') {
            // Enhanced connection and metrics gathering
            cloudSyncStatus = {
                enabled: true,
                teamMember: supabaseManager.teamMember || 'Not Set',
                initialized: supabaseManager.isInitialized,
                supabaseUrl: supabaseManager.client ? 'Connected' : 'Not Connected',
                lastSync: timestamp,
                connectionTest: supabaseManager.connectionTestResult || null,
                syncInProgress: supabaseManager.syncInProgress || false,
                currentImportId: supabaseManager.currentImportId || null,
                syncHistory: this.getSyncHistory(),
                dataMetrics: this.calculateDataMetrics()
            };
        }
        
        const completeSettings = {
            version: '6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5',
            exportDate: timestamp,
            application: 'ThePikehunters Catchlog v6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5 - Full Validation + Cloud Sync + Debug System Extraction + Aas Management + Backup/Restore (A+B+C+V+Cloud+Debug+Fase1.1-1.5)',
            
            // Enhanced cloud sync section
            cloudSync: cloudSyncStatus,
            
            // FASE 1.5.1: Enhanced lure management with extended data model and uitgebreide metadata
            lures: {
                items: LureManager.getAll(),
                brands: LureManager.getAllBrands(),
                count: LureManager.getAll().length,
                lastModified: LureManager.getLastModified(),
                lastAction: LureManager.getLastAction ? LureManager.getLastAction() : null,
                withImages: LureManager.getAll().filter(l => l.image).length,
                categories: [...new Set(LureManager.getAll().map(l => l.category))].filter(c => c),
                // FASE 1.5.1: Nieuwe metadata voor extended properties
                withExtendedProperties: LureManager.getAll().filter(l => l.type && l.actie).length,
                propertyDistribution: {
                    types: [...new Set(LureManager.getAll().map(l => l.type))].filter(t => t),
                    actions: [...new Set(LureManager.getAll().map(l => l.actie))].filter(a => a),
                    buoyancies: [...new Set(LureManager.getAll().map(l => l.drijfvermogen))].filter(b => b)
                }
            },
            
            // FASE 1.5.2: Enhanced dropdown management with new fields + aas categories + Extended tracking
            dropdowns: {
                options: DropdownManager.options,
                categories: Object.keys(DropdownManager.options),
                totalOptions: Object.values(DropdownManager.options).reduce((total, opts) => total + opts.length, 0),
                lastModified: DropdownManager.getLastModified(),
                lastAction: DropdownManager.getLastAction ? DropdownManager.getLastAction() : null,
                optionsPerCategory: Object.fromEntries(
                    Object.entries(DropdownManager.options).map(([key, value]) => [key, value.length])
                ),
                // NEW: Track new dropdown fields
                newFields: {
                    zonschaduw: DropdownManager.options.zonschaduw || [],
                    bodemhardheid: DropdownManager.options.bodemhardheid || []
                },
                // FASE 1.5.2: Extended - track aas-specific categories
                aasCategories: {
                    aastype: DropdownManager.options.aastype || [],
                    aasactie: DropdownManager.options.aasactie || [],
                    aasdrijfvermogen: DropdownManager.options.aasdrijfvermogen || [],
                    aasvorm: DropdownManager.options.aasvorm || [],
                    aasprimairekleur: DropdownManager.options.aasprimairekleur || [],
                    aassecundairekleur: DropdownManager.options.aassecundairekleur || [],
                    aasratel: DropdownManager.options.aasratel || [],
                    aastail: DropdownManager.options.aastail || []
                }
            },
            
            // Enhanced location management
            locations: {
                items: LocationManager.getAll(),
                count: LocationManager.getAll().length,
                lastModified: LocationManager.getLastModified(),
                lastAction: LocationManager.getLastAction()
            },
            
            // Enhanced validation system status
            validation: {
                phaseA: true,
                phaseB: true,
                phaseC: true,
                phaseV: true,
                phaseCloud: cloudSyncStatus.enabled,
                phaseDebug: typeof debugInfo !== 'undefined' && typeof debugInfo.show === 'function',
                phaseFase111: true, // FASE 1.1.1 marker
                phaseFase112113: true, // FASE 1.1.2 & 1.1.3 marker
                phaseFase14: true, // FASE 1.4 marker
                phaseFase15: true, // FASE 1.5 marker
                timeValidation: true,
                numberValidation: true,
                gpsValidation: true,
                locationValidation: true,
                speciesValidation: true,
                dataCompletenessValidation: true,
                cloudSyncValidation: cloudSyncStatus.enabled,
                debugSystemValidation: typeof debugInfo !== 'undefined',
                aasManagementValidation: true, // FASE 1.1.1
                aasDataModelValidation: true, // FASE 1.1.2 & 1.1.3
                aasDataBeheerValidation: true, // FASE 1.4
                aasBackupRestoreValidation: true, // FASE 1.5
                realTimeUpdates: true,
                newDropdownFields: true,
                aasDropdownFields: true // FASE 1.1.1
            },
            
            // Enhanced system information
            systemInfo: {
                browser: navigator.userAgent,
                timestamp: timestamp,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: navigator.language,
                cloudSyncVersion: cloudSyncStatus.enabled ? '6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5' : 'Not Available',
                validationVersion: '6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5',
                dataManagersVersion: '6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5',
                newFieldsVersion: '6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5',
                debugSystemVersion: typeof debugInfo !== 'undefined' ? '6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5' : 'Not Available (Extracted to debug-info.js)',
                aasManagementVersion: '6.2-extracted-fase-1.1.2-1.1.3-1.4-1.5' // FASE 1.1.1 + 1.1.2 + 1.1.3 + 1.4 + 1.5
            },
            
            // Enhanced summary with cloud metrics and new fields + aas fields + FASE 1.5 metadata
            summary: {
                totalLures: LureManager.getAll().length,
                totalBrands: LureManager.getAllBrands().length,
                totalLocations: LocationManager.getAll().length,
                totalDropdownCategories: Object.keys(DropdownManager.options).length,
                totalDropdownOptions: Object.values(DropdownManager.options).reduce((total, opts) => total + opts.length, 0),
                cloudSyncEnabled: cloudSyncStatus.enabled,
                debugSystemAvailable: typeof debugInfo !== 'undefined',
                teamMember: cloudSyncStatus.teamMember,
                dataCompleteness: this.calculateDataCompleteness(),
                lastDataActivity: this.getLastDataActivity(),
                // NEW: Summary of new fields
                newDropdownFields: {
                    zonschaduw: (DropdownManager.options.zonschaduw || []).length,
                    bodemhardheid: (DropdownManager.options.bodemhardheid || []).length
                },
                // FASE 1.5: Summary of aas fields + extended properties tracking
                aasDropdownFields: {
                    aastype: (DropdownManager.options.aastype || []).length,
                    aasactie: (DropdownManager.options.aasactie || []).length,
                    aasdrijfvermogen: (DropdownManager.options.aasdrijfvermogen || []).length,
                    aasvorm: (DropdownManager.options.aasvorm || []).length,
                    aasprimairekleur: (DropdownManager.options.aasprimairekleur || []).length,
                    aassecundairekleur: (DropdownManager.options.aassecundairekleur || []).length,
                    aasratel: (DropdownManager.options.aasratel || []).length,
                    aastail: (DropdownManager.options.aastail || []).length
                },
                // FASE 1.5: Extended properties summary
                aasExtendedPropertiesEnabled: true,
                aasDataBeheerEnabled: true,
                aasBackupRestoreEnabled: true
            }
        };
        
        const blob = new Blob([JSON.stringify(completeSettings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pikehunters_complete_settings_cloud_debug_extracted_fase_1_1_2_1_1_3_1_4_1_5_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const summary = completeSettings.summary;
        const cloudText = summary.cloudSyncEnabled ? ` + Cloud Sync (${summary.teamMember})` : '';
        const debugText = summary.debugSystemAvailable ? ' + Debug System' : ' + Debug Extracted';
        const aasText = ' + Aas Management (Fase 1.1.2 & 1.1.3 & 1.4 & 1.5)';
        showStatus(`Enhanced backup gemaakt: ${summary.totalLures} aas, ${summary.totalBrands} merken, ${summary.totalLocations} locaties + nieuwe velden + aas eigenschappen + backup/restore (Full Validation A+B+C+V+Cloud+Debug ${cloudText}${debugText}${aasText})`, 'success');
        
        return completeSettings;
    },
    
    // ENHANCED IMPORT WITH UI REFRESH FIX
    importAll: function(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (!settings.lures || !settings.dropdowns || !settings.locations) {
                    throw new Error('Ongeldig backup bestand - niet alle secties gevonden');
                }
                
                let importSummary = {
                    lures: { added: 0, updated: 0, skipped: 0 },
                    brands: { added: 0, skipped: 0 },
                    locations: { added: 0, skipped: 0 },
                    dropdowns: { added: 0, updated: 0 },
                    // NEW: Track new field imports
                    newFields: { 
                        zonschaduw: { imported: false, optionsAdded: 0 },
                        bodemhardheid: { imported: false, optionsAdded: 0 }
                    },
                    // FASE 1.5: Enhanced aas field import tracking
                    aasFields: {
                        aastype: { imported: false, optionsAdded: 0 },
                        aasactie: { imported: false, optionsAdded: 0 },
                        aasdrijfvermogen: { imported: false, optionsAdded: 0 },
                        aasvorm: { imported: false, optionsAdded: 0 },
                        aasprimairekleur: { imported: false, optionsAdded: 0 },
                        aassecundairekleur: { imported: false, optionsAdded: 0 },
                        aasratel: { imported: false, optionsAdded: 0 },
                        aastail: { imported: false, optionsAdded: 0 }
                    },
                    cloudSync: { 
                        detected: false, 
                        compatible: false, 
                        teamMember: null,
                        versionMatch: false,
                        conflictResolution: null
                    },
                    debugSupport: {
                        detected: false,
                        compatible: typeof debugInfo !== 'undefined',
                        extracted: true
                    },
                    // FASE 1.5: Enhanced backup compatibility detection
                    aasManagement: {
                        detected: false,
                        compatible: true,
                        extendedPropertiesSupport: false,
                        dataBeheerSupport: false,
                        backupRestoreSupport: false
                    }
                };
                
                // Enhanced cloud sync compatibility and conflict resolution
                if (settings.cloudSync) {
                    importSummary.cloudSync.detected = true;
                    importSummary.cloudSync.compatible = typeof supabaseManager !== 'undefined';
                    importSummary.cloudSync.teamMember = settings.cloudSync.teamMember;
                    importSummary.cloudSync.versionMatch = settings.version >= '6.0';
                    
                    // Enhanced team member conflict resolution
                    if (typeof supabaseManager !== 'undefined' && 
                        supabaseManager.teamMember && 
                        settings.cloudSync.teamMember !== supabaseManager.teamMember) {
                        
                        const switchTeam = confirm(
                            `TEAM MEMBER CONFLICT DETECTED\n\n` +
                            `Backup team: "${settings.cloudSync.teamMember}"\n` +
                            `Current team: "${supabaseManager.teamMember}"\n\n` +
                            `This backup contains data from a different team.\n\n` +
                            `Choose resolution:\n` +
                            `OK = Switch to backup team (${settings.cloudSync.teamMember})\n` +
                            `Cancel = Keep current team (${supabaseManager.teamMember})`
                        );
                        
                        if (switchTeam) {
                            supabaseManager.setTeamMember(settings.cloudSync.teamMember);
                            importSummary.cloudSync.conflictResolution = 'Switched to backup team';
                        } else {
                            importSummary.cloudSync.conflictResolution = 'Kept current team';
                        }
                    }
                }
                
                // Check debug support
                if (settings.validation && settings.validation.phaseDebug) {
                    importSummary.debugSupport.detected = true;
                }
                
                // FASE 1.5: Enhanced aas management detection
                if (settings.validation) {
                    importSummary.aasManagement.detected = settings.validation.phaseFase111 || 
                                                            settings.validation.aasManagementValidation || 
                                                            (settings.dropdowns && settings.dropdowns.aasCategories);
                    importSummary.aasManagement.extendedPropertiesSupport = settings.validation.phaseFase112113 || 
                                                                             settings.validation.aasDataModelValidation ||
                                                                             (settings.lures && settings.lures.withExtendedProperties !== undefined);
                    importSummary.aasManagement.dataBeheerSupport = settings.validation.phaseFase14 || 
                                                                    settings.validation.aasDataBeheerValidation;
                    importSummary.aasManagement.backupRestoreSupport = settings.validation.phaseFase15 || 
                                                                       settings.validation.aasBackupRestoreValidation;
                }
                
                // Enhanced Lure Import with detailed tracking
                if (settings.lures.items) {
                    settings.lures.items.forEach(importedLure => {
                        const existingIndex = LureManager.lures.findIndex(l => 
                            l.name.toLowerCase() === importedLure.name.toLowerCase()
                        );
                        
                        if (existingIndex === -1) {
                            LureManager.lures.push(importedLure);
                            importSummary.lures.added++;
                        } else {
                            const existingLure = LureManager.lures[existingIndex];
                            let hasChanges = false;
                            
                            // FASE 1.5: Include extended properties in update check
                            ['image', 'category', 'emoji', 'type', 'actie', 'drijfvermogen', 'lengte', 'primairekleur', 'ratel', 'vorm', 'secundairekleur', 'tail'].forEach(field => {
                                if (importedLure[field] !== undefined && importedLure[field] !== existingLure[field]) {
                                    existingLure[field] = importedLure[field];
                                    hasChanges = true;
                                }
                            });
                            
                            if (hasChanges) {
                                importSummary.lures.updated++;
                            } else {
                                importSummary.lures.skipped++;
                            }
                        }
                    });
                }
                
                // Enhanced Brand Import
                if (settings.lures.brands) {
                    settings.lures.brands.forEach(brand => {
                        if (!LureManager.brands.includes(brand)) {
                            LureManager.brands.push(brand);
                            importSummary.brands.added++;
                        } else {
                            importSummary.brands.skipped++;
                        }
                    });
                    LureManager.brands.sort();
                }
                
                LureManager.save();
                
                // Enhanced Dropdown Import with new fields + aas fields
                if (settings.dropdowns.options) {
                    Object.entries(settings.dropdowns.options).forEach(([category, options]) => {
                        if (!DropdownManager.options[category]) {
                            DropdownManager.options[category] = [];
                            importSummary.dropdowns.added++;
                        } else {
                            importSummary.dropdowns.updated++;
                        }
                        
                        options.forEach(option => {
                            if (!DropdownManager.options[category].includes(option)) {
                                DropdownManager.options[category].push(option);
                                
                                // NEW: Track new field imports
                                if (category === 'zonschaduw') {
                                    importSummary.newFields.zonschaduw.imported = true;
                                    importSummary.newFields.zonschaduw.optionsAdded++;
                                }
                                if (category === 'bodemhardheid') {
                                    importSummary.newFields.bodemhardheid.imported = true;
                                    importSummary.newFields.bodemhardheid.optionsAdded++;
                                }
                                
                                // FASE 1.5: Enhanced aas field import tracking
                                if (category.startsWith('aas')) {
                                    if (importSummary.aasFields[category]) {
                                        importSummary.aasFields[category].imported = true;
                                        importSummary.aasFields[category].optionsAdded++;
                                    }
                                }
                            }
                        });
                        
                        DropdownManager.options[category].sort();
                    });
                }
                
                DropdownManager.save();
                
                // Enhanced Location Import
                if (settings.locations.items) {
                    const currentLocations = LocationManager.getAll();
                    const newLocations = [...currentLocations];
                    
                    settings.locations.items.forEach(location => {
                        if (!newLocations.includes(location)) {
                            newLocations.push(location);
                            importSummary.locations.added++;
                        } else {
                            importSummary.locations.skipped++;
                        }
                    });
                    
                    newLocations.sort();
                    saveLocations(newLocations);
                }
                
                // Update all managers' timestamps
                const timestamp = new Date().toISOString();
                LureManager.setLastModified(timestamp);
                DropdownManager.setLastModified(timestamp);
                LocationManager.notifyCloudSyncChange('import', 'Settings imported with debug system extraction + new fields + aas management + backup/restore (Fase 1.1.2 & 1.1.3 & 1.4 & 1.5)');
                
                // CRITICAL FIX: Update all UI components after successful import
                console.log('Refreshing UI components after import...');
                if (typeof updateLureGrid === 'function') updateLureGrid();
                if (typeof updateCategoryTabs === 'function') updateCategoryTabs();
                if (typeof updateSessionsList === 'function') updateSessionsList();
                if (typeof updateDataTable === 'function') updateDataTable();
                if (typeof updateValidationInRealTime === 'function') updateValidationInRealTime();
                
                // FASE 1.5: Enhanced status message with aas management + backup/restore context
                let message = `Enhanced import voltooid! (Full Validation A+B+C+V+Cloud+Debug-Extracted+Fase1.1.2&1.1.3&1.4&1.5)\n` +
                              `Aas: +${importSummary.lures.added} ~${importSummary.lures.updated} =${importSummary.lures.skipped}\n` +
                              `Merken: +${importSummary.brands.added} =${importSummary.brands.skipped}\n` +
                              `Locaties: +${importSummary.locations.added} =${importSummary.locations.skipped}\n` +
                              `Dropdowns: +${importSummary.dropdowns.added} ~${importSummary.dropdowns.updated}`;
                
                // NEW: Add new fields to status message
                if (importSummary.newFields.zonschaduw.imported || importSummary.newFields.bodemhardheid.imported) {
                    message += `\nNieuwe velden: `;
                    if (importSummary.newFields.zonschaduw.imported) {
                        message += `Zon/Schaduw (+${importSummary.newFields.zonschaduw.optionsAdded}) `;
                    }
                    if (importSummary.newFields.bodemhardheid.imported) {
                        message += `Bodemhardheid (+${importSummary.newFields.bodemhardheid.optionsAdded})`;
                    }
                }
                
                // FASE 1.5: Enhanced aas fields to status message
                const aasFieldsImported = Object.values(importSummary.aasFields).some(field => field.imported);
                if (aasFieldsImported) {
                    message += `\nAas eigenschappen (Fase 1.5): `;
                    Object.entries(importSummary.aasFields).forEach(([category, data]) => {
                        if (data.imported) {
                            message += `${category} (+${data.optionsAdded}) `;
                        }
                    });
                }
                
                // FASE 1.5: Add aas management compatibility info
                if (importSummary.aasManagement.detected) {
                    message += `\nAas Management: Backup compatible`;
                    if (importSummary.aasManagement.extendedPropertiesSupport) {
                        message += ` (Extended Properties)`;
                    }
                    if (importSummary.aasManagement.dataBeheerSupport) {
                        message += ` (Data Beheer)`;
                    }
                    if (importSummary.aasManagement.backupRestoreSupport) {
                        message += ` (Backup/Restore)`;
                    }
                }
                
                if (importSummary.cloudSync.detected) {
                    if (importSummary.cloudSync.compatible) {
                        message += `\nCloud sync: Compatible backup gedetecteerd van team ${importSummary.cloudSync.teamMember}`;
                        if (importSummary.cloudSync.conflictResolution) {
                            message += ` (${importSummary.cloudSync.conflictResolution})`;
                        }
                    } else {
                        message += `\nCloud sync: Backup bevat cloud settings maar cloud sync niet actief`;
                    }
                }
                
                if (importSummary.debugSupport.detected) {
                    message += importSummary.debugSupport.compatible ? 
                        `\nDebug System: Compatible backup gedetecteerd (extracted to debug-info.js)` : 
                        `\nDebug System: Backup heeft debug ondersteuning (extracted to debug-info.js)`;
                }
                
                showStatus(message.replace(/\n/g, ' | '), 'success');
                
                console.log('Enhanced import summary with cloud sync integration + debug extraction + new fields + aas management + backup/restore (Fase 1.1.2 & 1.1.3 & 1.4 & 1.5):', importSummary);
                
            } catch (error) {
                console.error('Import error:', error);
                showStatus(`Import fout: ${error.message}`, 'error');
            }
            
            fileInput.value = '';
        };
        
        reader.readAsText(file);
    },
    
    // Enhanced current settings reporting
    getCurrentSettings: function() {
        let cloudSyncStatus = false;
        let teamMember = null;
        
        if (typeof supabaseManager !== 'undefined') {
            cloudSyncStatus = supabaseManager.isInitialized;
            teamMember = supabaseManager.teamMember;
        }
        
        return {
            lures: LureManager.getAll().length,
            brands: LureManager.getAllBrands().length,
            locations: LocationManager.getAll().length,
            dropdownCategories: Object.keys(DropdownManager.options).length,
            totalDropdownOptions: Object.values(DropdownManager.options).reduce((total, opts) => total + opts.length, 0),
            validationActive: true,
            validationPhases: ['A', 'B', 'C', 'V', 'Cloud', 'Debug-Extracted', 'Fase-1.1.1', 'Fase-1.1.2', 'Fase-1.1.3', 'Fase-1.4', 'Fase-1.5'],
            cloudSyncEnabled: cloudSyncStatus,
            debugSystemAvailable: typeof debugInfo !== 'undefined',
            debugSystemExtracted: true,
            aasManagementEnabled: true, // FASE 1.1.1
            aasDataModelEnabled: true, // FASE 1.1.2 & 1.1.3
            aasDataBeheerEnabled: true, // FASE 1.4
            aasBackupRestoreEnabled: true, // FASE 1.5
            teamMember: teamMember,
            lastExport: new Date().toISOString(),
            dataCompleteness: this.calculateDataCompleteness(),
            // NEW: Track new fields
            newFields: {
                zonschaduw: (DropdownManager.options.zonschaduw || []).length,
                bodemhardheid: (DropdownManager.options.bodemhardheid || []).length
            },
            // FASE 1.5: Enhanced aas fields tracking
            aasFields: {
                aastype: (DropdownManager.options.aastype || []).length,
                aasactie: (DropdownManager.options.aasactie || []).length,
                aasdrijfvermogen: (DropdownManager.options.aasdrijfvermogen || []).length,
                aasvorm: (DropdownManager.options.aasvorm || []).length,
                aasprimairekleur: (DropdownManager.options.aasprimairekleur || []).length,
                aassecundairekleur: (DropdownManager.options.aassecundairekleur || []).length,
                aasratel: (DropdownManager.options.aasratel || []).length,
                aastail: (DropdownManager.options.aastail || []).length
            }
        };
    },
    
    // Helper methods for enhanced functionality
    getSyncHistory: function() {
        // This would track sync history - simplified for now
        return [];
    },
    
    calculateDataMetrics: function() {
        return {
            totalDataObjects: LureManager.getAll().length + LocationManager.getAll().length + 
                             Object.values(DropdownManager.options).reduce((total, opts) => total + opts.length, 0),
            lastModified: new Date().toISOString()
        };
    },
    
    calculateDataCompleteness: function() {
        const hasLures = LureManager.getAll().length > 0;
        const hasLocations = LocationManager.getAll().length > 0;
        const hasDropdowns = Object.keys(DropdownManager.options).length > 0;
        
        return {
            percentage: ((hasLures + hasLocations + hasDropdowns) / 3) * 100,
            hasLures: hasLures,
            hasLocations: hasLocations,
            hasDropdowns: hasDropdowns
        };
    },
    
    getLastDataActivity: function() {
        const timestamps = [
            LureManager.getLastModified(),
            LocationManager.getLastModified(),
            DropdownManager.getLastModified()
        ].filter(t => t);
        
        if (timestamps.length === 0) return null;
        
        return timestamps.sort().pop();
    }
};

// ================================
// Enhanced Dropdown Manager System with Cloud Sync Integration + NEW DROPDOWNS + FASE 1.1.1 AAS CATEGORIES (PRESERVED)
// ================================
const DropdownManager = {
    options: {},
    
    init: function() {
        const savedOptions = localStorage.getItem('pikehunters_dropdown_options');
        if (savedOptions) {
            this.options = JSON.parse(savedOptions);
            
            // ENSURE NEW DROPDOWN OPTIONS EXIST
            if (!this.options.zonschaduw) {
                this.options.zonschaduw = ['Zon', 'Schaduw', 'Onbekend'];
                console.log('Added new dropdown: zonschaduw');
            }
            if (!this.options.bodemhardheid) {
                this.options.bodemhardheid = ['Hard', 'Medium', 'Zacht', 'Onbekend'];
                console.log('Added new dropdown: bodemhardheid');
            }
            
            // FASE 1.1.1: ENSURE NEW AAS DROPDOWN CATEGORIES EXIST
            if (!this.options.aastype) {
                this.options.aastype = ['Shad', 'Crank bait', 'Spinnerbait', 'Jig spinner', 'Chatterbait'];
                console.log('FASE 1.1.1: Added new aas dropdown: aastype');
            }
            if (!this.options.aasactie) {
                this.options.aasactie = ['Wobble', 'Roll', 'Dart', 'Glide', 'Walk-the-dog', 'Popping', 'Tail action'];
                console.log('FASE 1.1.1: Added new aas dropdown: aasactie');
            }
            if (!this.options.aasdrijfvermogen) {
                this.options.aasdrijfvermogen = ['Drijvend', 'Zwevend', 'Zinkend', 'Oppervlak'];
                console.log('FASE 1.1.1: Added new aas dropdown: aasdrijfvermogen');
            }
            if (!this.options.aasvorm) {
                this.options.aasvorm = ['Dik', 'Slank'];
                console.log('FASE 1.1.1: Added new aas dropdown: aasvorm');
            }
            if (!this.options.aasprimairekleur) {
                this.options.aasprimairekleur = ['Donker groen', 'Licht grijs', 'Donker grijs', 'Licht groen', 'Wit', 'Zilver', 'Donker bruin', 'Licht bruin', 'Gif groen', 'Gold', 'Roze', 'Oranje', 'Geel'];
                console.log('FASE 1.1.1: Added new aas dropdown: aasprimairekleur');
            }
            if (!this.options.aassecundairekleur) {
                this.options.aassecundairekleur = ['Donker groen', 'Licht grijs', 'Donker grijs', 'Licht groen', 'Wit', 'Zilver', 'Donker bruin', 'Licht bruin', 'Gif groen', 'Gold', 'Roze', 'Oranje', 'Geel'];
                console.log('FASE 1.1.1: Added new aas dropdown: aassecundairekleur');
            }
            if (!this.options.aasratel) {
                this.options.aasratel = ['Ja', 'Nee'];
                console.log('FASE 1.1.1: Added new aas dropdown: aasratel');
            }
            if (!this.options.aastail) {
                this.options.aastail = ['Schoep', 'V-tail', 'Pin-Tail', 'Creature baits', 'Twister', 'Worm'];
                console.log('FASE 1.1.1: Added new aas dropdown: aastail');
            }
            
            // Save updated options if new fields were added
            this.save();
        } else {
            // Default options with enhanced structure + NEW DROPDOWN OPTIONS + FASE 1.1.1 AAS CATEGORIES
            this.options = {
                watersoort: ['Meer', 'Kanaal', 'Rivier', 'Gracht', 'Polder', 'Vijver'],
                stroomsnelheid: ['Stilstaand tot licht stromend', 'Licht tot matig stromend', 'Snelstromend'],
                helderheid: ['Kristal helder > 2M', 'Helder 1M -2M', 'Matig helder 0.5 - 1M', 'Troebel 0.1 - 0.5', 'Zeer Troebel < 0.1'],
                booster: ['Ja', 'Nee'],
                techniek: ['Dropshot', 'Jiggen', 'C-rig', 'T-rig', 'Trollen', 'Spinning', 'Verticalen', 'Jerk', 'Twitch', 'N-rig', 'Cheb-rig'],
                vissnelheid: ['Super snel', 'Snel', 'Gemiddeld', 'Traag', 'Extreem traag'],
                structuur: ['Talud', 'Brug', 'Waterplanten', 'Paal / obstakel', 'Havenmonding', 'Kademuur', 'Gemaal', 'Geen', 'Steiger'],
                aasvis: ['Veel', 'Beetje', 'Geen'],
                vangsthoogte: ['Oppervlakte', 'Midden', 'Dicht bij bodem', 'Bodem'],
                // NEW DROPDOWN OPTIONS
                zonschaduw: ['Zon', 'Schaduw', 'Onbekend'],
                bodemhardheid: ['Hard', 'Medium', 'Zacht', 'Onbekend'],
                // FASE 1.1.1: NEW AAS-SPECIFIC DROPDOWN CATEGORIES
                aastype: ['Shad', 'Crank bait', 'Spinnerbait', 'Jig spinner', 'Chatterbait'],
                aasactie: ['Wobble', 'Roll', 'Dart', 'Glide', 'Walk-the-dog', 'Popping', 'Tail action'],
                aasdrijfvermogen: ['Drijvend', 'Zwevend', 'Zinkend', 'Oppervlak'],
                aasvorm: ['Dik', 'Slank'],
                aasprimairekleur: ['Donker groen', 'Licht grijs', 'Donker grijs', 'Licht groen', 'Wit', 'Zilver', 'Donker bruin', 'Licht bruin', 'Gif groen', 'Gold', 'Roze', 'Oranje', 'Geel'],
                aassecundairekleur: ['Donker groen', 'Licht grijs', 'Donker grijs', 'Licht groen', 'Wit', 'Zilver', 'Donker bruin', 'Licht bruin', 'Gif groen', 'Gold', 'Roze', 'Oranje', 'Geel'],
                aasratel: ['Ja', 'Nee'],
                aastail: ['Schoep', 'V-tail', 'Pin-Tail', 'Creature baits', 'Twister', 'Worm']
            };
            this.save();
            console.log('Initialized DropdownManager with new fields: zonschaduw, bodemhardheid + FASE 1.1.1 aas categories');
        }
    },
    
    save: function() {
        localStorage.setItem('pikehunters_dropdown_options', JSON.stringify(this.options));
        this.setLastModified(new Date().toISOString());
        
        // Enhanced cloud sync notification
        this.notifyCloudSyncChange('save', 'Dropdown options updated (including new fields + aas categories Fase 1.1.1)');
    },
    
    getOptions: function(category) {
        return this.options[category] || [];
    },
    
    addOption: function(category, value) {
        if (!this.options[category]) {
            this.options[category] = [];
        }
        
        const trimmedValue = value.trim();
        if (trimmedValue && !this.options[category].includes(trimmedValue)) {
            this.options[category].push(trimmedValue);
            this.options[category].sort();
            this.save();
            
            // Enhanced notification
            this.notifyCloudSyncChange('add', `${category}: ${trimmedValue}`);
            
            return true;
        }
        return false;
    },
    
    removeOption: function(category, value) {
        if (this.options[category]) {
            const index = this.options[category].indexOf(value);
            if (index > -1) {
                this.options[category].splice(index, 1);
                this.save();
                
                // Enhanced notification
                this.notifyCloudSyncChange('remove', `${category}: ${value}`);
                
                return true;
            }
        }
        return false;
    },
    
    // Enhanced cloud sync notification system
    notifyCloudSyncChange: function(action, details) {
        const timestamp = new Date().toISOString();
        
        // Update metadata
        localStorage.setItem('pikehunters_dropdown_options_last_action', JSON.stringify({
            action: action,
            details: details,
            timestamp: timestamp,
            includesNewFields: details.includes('zonschaduw') || details.includes('bodemhardheid'),
            includesAasFields: details.includes('aas') // FASE 1.1.1
        }));
        
        // Trigger updates
        if (typeof updateCloudSyncStatus === 'function') {
            updateCloudSyncStatus();
        }
        
        if (typeof updateValidationInRealTime === 'function') {
            updateValidationInRealTime();
        }
        
        console.log(`DropdownManager: ${action} - ${details} (Cloud sync notified) [Fase 1.1.1]`);
    },
    
    getLastModified: function() {
        return localStorage.getItem('pikehunters_dropdown_options_last_modified');
    },
    
    setLastModified: function(timestamp) {
        localStorage.setItem('pikehunters_dropdown_options_last_modified', timestamp);
    },
    
    getLastAction: function() {
        const actionData = localStorage.getItem('pikehunters_dropdown_options_last_action');
        return actionData ? JSON.parse(actionData) : null;
    },
    
    // Enhanced cloud sync info
    getCloudSyncInfo: function() {
        let cloudInfo = {
            available: false,
            status: 'Offline',
            teamMember: null,
            lastModified: this.getLastModified(),
            lastAction: this.getLastAction(),
            optionCount: Object.values(this.options).reduce((total, opts) => total + opts.length, 0)
        };
        
        if (typeof supabaseManager !== 'undefined') {
            cloudInfo = {
                available: true,
                status: supabaseManager.isInitialized ? 
                    (supabaseManager.teamMember ? 'Ready' : 'Setup Required') : 
                    'Initializing',
                teamMember: supabaseManager.teamMember,
                lastModified: this.getLastModified(),
                lastAction: this.getLastAction(),
                optionCount: Object.values(this.options).reduce((total, opts) => total + opts.length, 0),
                categories: Object.keys(this.options).length,
                // NEW: Track new field status
                newFields: {
                    zonschaduw: this.options.zonschaduw ? this.options.zonschaduw.length : 0,
                    bodemhardheid: this.options.bodemhardheid ? this.options.bodemhardheid.length : 0
                },
                // FASE 1.1.1: Track aas field status
                aasFields: {
                    aastype: this.options.aastype ? this.options.aastype.length : 0,
                    aasactie: this.options.aasactie ? this.options.aasactie.length : 0,
                    aasdrijfvermogen: this.options.aasdrijfvermogen ? this.options.aasdrijfvermogen.length : 0,
                    aasvorm: this.options.aasvorm ? this.options.aasvorm.length : 0,
                    aasprimairekleur: this.options.aasprimairekleur ? this.options.aasprimairekleur.length : 0,
                    aassecundairekleur: this.options.aassecundairekleur ? this.options.aassecundairekleur.length : 0,
                    aasratel: this.options.aasratel ? this.options.aasratel.length : 0,
                    aastail: this.options.aastail ? this.options.aastail.length : 0
                }
            };
        }
        
        return cloudInfo;
    }
};

// ================================
// Enhanced Dropdown Change Handler with Cloud Sync Awareness (PRESERVED)
// ================================
function handleDropdownChange(selectElement, category, callback) {
    const value = selectElement.value;
    
    if (value === '__ADD_NEW__') {
        const cloudInfo = DropdownManager.getCloudSyncInfo();
        const cloudText = cloudInfo.available ? ` (Team: ${cloudInfo.teamMember})` : '';
        
        const newValue = prompt(`Nieuw item toevoegen aan ${category}${cloudText}:\n\nVoer de nieuwe waarde in:`);
        
        if (newValue && newValue.trim()) {
            const trimmedValue = newValue.trim();
            
            if (DropdownManager.addOption(category, trimmedValue)) {
                // Update the dropdown to show the new value
                const selectedValue = trimmedValue;
                const onChangeAttr = selectElement.getAttribute('onchange');
                const otherAttrs = Array.from(selectElement.attributes)
                    .filter(attr => attr.name !== 'onchange')
                    .map(attr => `${attr.name}="${attr.value}"`)
                    .join(' ');
                
                // Regenerate dropdown HTML with new option
                selectElement.outerHTML = createSmartDropdown(category, selectedValue, onChangeAttr, otherAttrs);
                
                if (callback) {
                    callback(trimmedValue);
                }
                
                const cloudSyncText = cloudInfo.available ? ' (Cloud sync ready)' : '';
                const newFieldText = (category === 'zonschaduw' || category === 'bodemhardheid') ? ' (NEW FIELD)' : '';
                const aasFieldText = category.startsWith('aas') ? ' (AAS EIGENSCHAP - FASE 1.1.1)' : '';
                showStatus(`"${trimmedValue}" toegevoegd aan ${category}${newFieldText}${aasFieldText}${cloudSyncText}`, 'success');
                
                // Update all dependent components
                if (typeof updateDataTable === 'function') updateDataTable();
                if (typeof updateSessionsList === 'function') updateSessionsList();
                if (typeof updateValidationInRealTime === 'function') updateValidationInRealTime();
                
            } else {
                showStatus(`"${trimmedValue}" bestaat al in ${category}`, 'error');
                selectElement.value = '';
            }
        } else {
            selectElement.value = '';
        }
    } else if (callback) {
        callback(value);
        
        // Update validation in real-time
        if (typeof updateValidationInRealTime === 'function') {
            updateValidationInRealTime();
        }
    }
}

// ================================
// Enhanced Lure Management System with Cloud Sync Integration + FASE 1.1.2 & 1.1.3: Uitgebreide Data Model
// ================================
const LureManager = {
    lures: [],
    brands: [],
    
    init: function() {
        const savedLures = localStorage.getItem('pikehunters_lures');
        if (savedLures) {
            this.lures = JSON.parse(savedLures);
        } else {
            // FASE 1.1.3: Empty lures array as specified in manual
            this.lures = [];
            this.save();
        }
        
        const savedBrands = localStorage.getItem('pikehunters_brands');
        if (savedBrands) {
            this.brands = JSON.parse(savedBrands);
        } else {
            this.generateBrandsFromLures();
        }
    },
    
    save: function() {
        localStorage.setItem('pikehunters_lures', JSON.stringify(this.lures));
        localStorage.setItem('pikehunters_brands', JSON.stringify(this.brands));
        this.setLastModified(new Date().toISOString());
        
        // Enhanced cloud sync notification
        this.notifyCloudSyncChange('save', 'Lure database updated');
    },
    
    generateBrandsFromLures: function() {
        const uniqueBrands = [...new Set(this.lures.map(l => l.category).filter(c => c))];
        
        const defaultBrands = ['Keitech', 'Westin', 'Nays', 'Zman', 'Eigen'];
        defaultBrands.forEach(brand => {
            if (!uniqueBrands.includes(brand)) {
                uniqueBrands.push(brand);
            }
        });
        
        this.brands = uniqueBrands.sort();
        this.save();
    },
    
    addBrand: function(brandName) {
        const name = brandName.trim();
        if (name && !this.brands.includes(name)) {
            this.brands.push(name);
            this.brands.sort();
            this.save();
            
            this.notifyCloudSyncChange('add_brand', name);
            return true;
        }
        return false;
    },
    
    removeBrand: function(brandName) {
        const hasLures = this.lures.some(l => l.category === brandName);
        if (hasLures) {
            return false; // Cannot remove brand with lures
        }
        
        this.brands = this.brands.filter(b => b !== brandName);
        this.save();
        
        this.notifyCloudSyncChange('remove_brand', brandName);
        return true;
    },
    
    getAllBrands: function() {
        return this.brands;
    },
    
    // FASE 1.1.2: Enhanced add function with extended lure object validation and structure
    add: function(lure) {
        if (!this.lures.find(l => l.name.toLowerCase() === lure.name.toLowerCase())) {
            // FASE 1.1.2: Ensure extended lure object structure with default values
            const extendedLure = {
                // Basic properties
                name: lure.name || '',
                emoji: lure.emoji || '🎣',
                category: lure.category || '',
                image: lure.image || '',
                
                // FASE 1.1.2: Nieuwe verplichte velden with default values
                type: lure.type || '',
                actie: lure.actie || '',
                drijfvermogen: lure.drijfvermogen || '',
                lengte: parseFloat(lure.lengte) || 0,
                primairekleur: lure.primairekleur || '',
                ratel: lure.ratel || '',
                
                // FASE 1.1.2: Nieuwe optionele velden
                vorm: lure.vorm || '',
                secundairekleur: lure.secundairekleur || '',
                tail: lure.tail || ''
            };
            
            this.lures.push(extendedLure);
            
            if (extendedLure.category && !this.brands.includes(extendedLure.category)) {
                this.brands.push(extendedLure.category);
                this.brands.sort();
            }
            
            this.save();
            this.notifyCloudSyncChange('add_lure', `${extendedLure.name} (FASE 1.1.2: Extended properties)`);
            return true;
        }
        return false;
    },
    
    remove: function(name) {
        this.lures = this.lures.filter(l => l.name !== name);
        this.save();
        this.notifyCloudSyncChange('remove_lure', name);
    },
    
    getAll: function() {
        return this.lures;
    },
    
    getByCategory: function(category) {
        return this.lures.filter(l => l.category === category);
    },
    
    search: function(query) {
        const q = query.toLowerCase();
        return this.lures.filter(l => 
            l.name.toLowerCase().includes(q) || 
            (l.category && l.category.toLowerCase().includes(q)) ||
            // FASE 1.1.2: Extended search to include new properties
            (l.type && l.type.toLowerCase().includes(q)) ||
            (l.actie && l.actie.toLowerCase().includes(q)) ||
            (l.primairekleur && l.primairekleur.toLowerCase().includes(q))
        );
    },
    
    updateImage: function(name, imageData) {
        const lure = this.lures.find(l => l.name === name);
        if (lure) {
            lure.image = imageData;
            this.save();
            this.notifyCloudSyncChange('update_image', name);
            return true;
        }
        return false;
    },
    
    // FASE 1.1.2: Enhanced update function to handle extended properties
    update: function(name, updatedLure) {
        const lureIndex = this.lures.findIndex(l => l.name === name);
        if (lureIndex > -1) {
            // FASE 1.1.2: Merge with extended properties
            const existingLure = this.lures[lureIndex];
            this.lures[lureIndex] = {
                // Preserve existing structure
                ...existingLure,
                // Update with new values
                ...updatedLure,
                // FASE 1.1.2: Ensure numeric conversion for lengte
                lengte: updatedLure.lengte ? parseFloat(updatedLure.lengte) : existingLure.lengte || 0
            };
            
            this.save();
            this.notifyCloudSyncChange('update_lure', `${name} (FASE 1.1.2: Extended properties updated)`);
            return true;
        }
        return false;
    },
    
    // FASE 1.1.2: Enhanced validation for extended lure properties
    validateLure: function(lure) {
        const errors = [];
        
        // Basic validation
        if (!lure.name || lure.name.trim() === '') {
            errors.push('Naam is verplicht');
        }
        
        if (!lure.category || lure.category.trim() === '') {
            errors.push('Categorie/Merk is verplicht');
        }
        
        // FASE 1.1.2: Extended validation for new required fields
        if (!lure.type || lure.type.trim() === '') {
            errors.push('Type is verplicht');
        }
        
        if (!lure.actie || lure.actie.trim() === '') {
            errors.push('Actie is verplicht');
        }
        
        if (!lure.drijfvermogen || lure.drijfvermogen.trim() === '') {
            errors.push('Drijfvermogen is verplicht');
        }
        
        if (!lure.lengte || isNaN(parseFloat(lure.lengte)) || parseFloat(lure.lengte) <= 0) {
            errors.push('Geldige lengte is verplicht');
        }
        
        if (!lure.primairekleur || lure.primairekleur.trim() === '') {
            errors.push('Primaire kleur is verplicht');
        }
        
        if (!lure.ratel || lure.ratel.trim() === '') {
            errors.push('Ratel is verplicht');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    // FASE 1.1.2: Get lures with extended properties
    getWithExtendedProperties: function() {
        return this.lures.filter(l => l.type && l.actie && l.drijfvermogen && l.primairekleur && l.ratel);
    },
    
    // FASE 1.1.2: Get property statistics
    getPropertyStats: function() {
        const allLures = this.getAll();
        
        return {
            total: allLures.length,
            withExtendedProperties: this.getWithExtendedProperties().length,
            types: [...new Set(allLures.map(l => l.type).filter(t => t))],
            actions: [...new Set(allLures.map(l => l.actie).filter(a => a))],
            buoyancies: [...new Set(allLures.map(l => l.drijfvermogen).filter(b => b))],
            colors: [...new Set(allLures.map(l => l.primairekleur).filter(c => c))],
            avgLength: allLures.filter(l => l.lengte && l.lengte > 0).reduce((sum, l) => sum + l.lengte, 0) / allLures.filter(l => l.lengte && l.lengte > 0).length || 0
        };
    },
    
    // Enhanced cloud sync notification system
    notifyCloudSyncChange: function(action, details) {
        const timestamp = new Date().toISOString();
        
        // Update metadata
        localStorage.setItem('pikehunters_lures_last_action', JSON.stringify({
            action: action,
            details: details,
            timestamp: timestamp,
            extendedPropertiesSupport: true // FASE 1.1.2 marker
        }));
        
        // Trigger updates
        if (typeof updateCloudSyncStatus === 'function') {
            updateCloudSyncStatus();
        }
        
        console.log(`LureManager: ${action} - ${details} (Cloud sync notified) [Fase 1.1.2 & 1.1.3]`);
    },
    
    getLastModified: function() {
        return localStorage.getItem('pikehunters_lures_last_modified');
    },
    
    setLastModified: function(timestamp) {
        localStorage.setItem('pikehunters_lures_last_modified', timestamp);
    },
    
    getLastAction: function() {
        const actionData = localStorage.getItem('pikehunters_lures_last_action');
        return actionData ? JSON.parse(actionData) : null;
    },
    
    // Enhanced cloud sync info
    getCloudSyncInfo: function() {
        let cloudInfo = {
            available: false,
            status: 'Offline',
            teamMember: null,
            lastModified: this.getLastModified(),
            lastAction: this.getLastAction(),
            lureCount: this.lures.length,
            brandCount: this.brands.length
        };
        
        if (typeof supabaseManager !== 'undefined') {
            cloudInfo = {
                available: true,
                status: supabaseManager.isInitialized ? 
                    (supabaseManager.teamMember ? 'Ready' : 'Setup Required') : 
                    'Initializing',
                teamMember: supabaseManager.teamMember,
                lastModified: this.getLastModified(),
                lastAction: this.getLastAction(),
                lureCount: this.lures.length,
                brandCount: this.brands.length,
                withImages: this.lures.filter(l => l.image).length,
                // FASE 1.1.2: Extended properties tracking
                withExtendedProperties: this.getWithExtendedProperties().length,
                propertyStats: this.getPropertyStats()
            };
        }
        
        return cloudInfo;
    }
};

// ================================
// DEBUG FUNCTIONS - EXTRACTED TO debug-info.js
// ================================
// Fallback voor diagnoseInitializationIssue (wordt nog door andere code gebruikt)
function diagnoseInitializationIssue() {
    if (typeof debugInfo !== 'undefined' && debugInfo.diagnoseInitializationIssue) {
        return debugInfo.diagnoseInitializationIssue();
    } else {
        console.error('Debug system not loaded - diagnoseInitializationIssue not available');
        alert('Debug systeem niet geladen. Herlaad de pagina.');
        return false;
    }
}

// Minimale debugInfo fallback (voor backward compatibility)
if (typeof debugInfo === 'undefined') {
    window.debugInfo = {
        show: function() {
            console.error('Debug system not loaded from debug-info.js');
            alert('Debug systeem niet beschikbaar. Check of debug-info.js correct geladen is.');
        },
        checkWaypointsExist: function() {
            console.error('Debug system not loaded');
            return false;
        },
        checkGPSDataValid: function() {
            console.error('Debug system not loaded');
            return false;
        },
        diagnoseInitializationIssue: function() {
            console.error('Debug system not loaded');
            return false;
        }
    };
}

// Export functions (behoud bestaande API)
window.diagnoseInitializationIssue = diagnoseInitializationIssue;

console.log('Debug functions redirected to debug-info.js');

// ================================
// Enhanced Utility Functions
// ================================

function loadSavedLocations() {
    const saved = localStorage.getItem('pikehunters_locations');
    if (saved) {
        return JSON.parse(saved);
    }
    // Enhanced default locations
    return [
        'Vecht - Breukelen',
        'Vecht - Overvecht Utrecht', 
        'Vecht - Oud Zuilen',
        'Haarlem - Leidsevaart kruispunt',
        'Haarlem - Nieuwegracht',
        'Haarlem - Leidsevaart',
        'Vecht - Maarssen brug tot theehuis',
        'Amsterdam - Rijnkanaal',
        'Zaandam - Zaan rivier'
    ];
}

function saveLocations(locations) {
    localStorage.setItem('pikehunters_locations', JSON.stringify(locations));
    // Enhanced timestamp tracking
    const timestamp = new Date().toISOString();
    localStorage.setItem('pikehunters_locations_last_modified', timestamp);
}

// Enhanced smart dropdown creation function with new fields support + aas categories
function createSmartDropdown(category, selectedValue = '', onChangeFunction = '', extraAttributes = '') {
    const options = DropdownManager.getOptions(category);
    
    // Start building the select element
    let html = `<select ${extraAttributes}`;
    
    // Add onchange if provided
    if (onChangeFunction) {
        html += ` onchange="${onChangeFunction}"`;
    }
    
    html += '>';
    
    // Add default "select" option with new field indication
    const isNewField = (category === 'zonschaduw' || category === 'bodemhardheid') ? ' (NIEUW)' : '';
    const isAasField = category.startsWith('aas') ? ' (AAS - FASE 1.1.1)' : '';
    html += `<option value="" ${selectedValue === '' ? 'selected' : ''}>- Selecteer ${category}${isNewField}${isAasField} -</option>`;
    
    // Add all existing options
    options.forEach(option => {
        const selected = selectedValue === option ? 'selected' : '';
        html += `<option value="${option}" ${selected}>${option}</option>`;
    });
    
    // Add "add new" option
    html += `<option value="__ADD_NEW__" style="color: #4CAF50; font-weight: bold;">Nieuw item toevoegen...</option>`;
    
    html += '</select>';
    
    return html;
}

// Enhanced advanced dropdown creation
function createAdvancedDropdown(category, selectedValue = '', onChangeCallback = null, options = {}) {
    const {
        extraAttributes = '',
        placeholder = null,
        allowEmpty = true,
        customOptions = [],
        hideAddNew = false
    } = options;
    
    const categoryOptions = DropdownManager.getOptions(category);
    const allOptions = [...categoryOptions, ...customOptions];
    
    let html = `<select ${extraAttributes}`;
    
    if (onChangeCallback) {
        if (typeof onChangeCallback === 'function') {
            html += ` onchange="(${onChangeCallback.toString()})(this)"`;
        } else {
            html += ` onchange="${onChangeCallback}"`;
        }
    }
    
    html += '>';
    
    // Add placeholder/default option with new field indication
    if (allowEmpty) {
        const isNewField = (category === 'zonschaduw' || category === 'bodemhardheid') ? ' (NIEUW)' : '';
        const isAasField = category.startsWith('aas') ? ' (AAS - FASE 1.1.1)' : '';
        const placeholderText = placeholder || `- Selecteer ${category}${isNewField}${isAasField} -`;
        html += `<option value="" ${selectedValue === '' ? 'selected' : ''}>${placeholderText}</option>`;
    }
    
    // Add all options
    allOptions.forEach(option => {
        const selected = selectedValue === option ? 'selected' : '';
        html += `<option value="${option}" ${selected}>${option}</option>`;
    });
    
    // Add "add new" option unless explicitly hidden
    if (!hideAddNew) {
        html += `<option value="__ADD_NEW__" style="color: #4CAF50; font-weight: bold;">Nieuw item toevoegen...</option>`;
    }
    
    html += '</select>';
    
    return html;
}

// Enhanced quick dropdown for simple use cases
function createQuickDropdown(category, selectedValue, updateFunction, sessionIndex = null, wpIndex = null, fieldName = null) {
    let onChangeHandler;
    
    if (sessionIndex !== null && wpIndex !== null && fieldName !== null) {
        // Table cell update
        onChangeHandler = `handleDropdownChange(this, '${category}', (value) => ${updateFunction}(${sessionIndex}, ${wpIndex}, '${fieldName}', value))`;
    } else if (sessionIndex !== null && fieldName !== null) {
        // Session field update
        onChangeHandler = `handleDropdownChange(this, '${category}', (value) => ${updateFunction}(${sessionIndex}, '${fieldName}', value))`;
    } else {
        // Custom handler
        onChangeHandler = `handleDropdownChange(this, '${category}', ${updateFunction})`;
    }
    
    return createSmartDropdown(category, selectedValue, onChangeHandler);
}

// ================================
// GLOBAL EXPORTS FOR ENHANCED SYSTEM
// ================================

// Make all managers globally available
window.LocationManager = LocationManager;
window.DropdownManager = DropdownManager;
window.LureManager = LureManager;
window.SettingsManager = SettingsManager;
window.DataManager = DataManager;
// debugInfo is handled separately above

// Make utility functions globally available
window.loadSavedLocations = loadSavedLocations;
window.saveLocations = saveLocations;
window.createSmartDropdown = createSmartDropdown;
window.createAdvancedDropdown = createAdvancedDropdown;
window.createQuickDropdown = createQuickDropdown;
window.handleDropdownChange = handleDropdownChange;

console.log('Enhanced Data Managers loaded with extracted Debug Info System + FASE 1.1.2 & 1.1.3 & 1.4 & 1.5!');
console.log('- Debug functionality moved to debug-info.js (VERSION 6.2-extracted)');
console.log('- All existing functionality preserved');
console.log('- Fallback mechanisms active');
console.log('- LocationManager: Enhanced with cloud sync integration (preserved)');
console.log('- DropdownManager: Enhanced with new fields: zonschaduw, bodemhardheid + NIEUWE AAS CATEGORIES (FASE 1.1.1)');
console.log('- LureManager: Enhanced with cloud sync integration + UITGEBREIDE DATA MODEL (FASE 1.1.2 & 1.1.3)');
console.log('- SettingsManager: Enhanced with UI refresh fix + cloud metadata + AAS BACKUP/RESTORE (FASE 1.5)');
console.log('- DataManager: Universal data management interface + AAS SECTION (FASE 1.4)');
console.log('- debugInfo: Extracted to debug-info.js with fallback support (NEW - VERSION 6.2-extracted)');
console.log('- FASE 1.1.1: 8 nieuwe aas dropdown categories toegevoegd aan DropdownManager!');
console.log('- FASE 1.1.2 & 1.1.3: LureManager uitgebreide data model met validatie en extended properties!');
console.log('- FASE 1.4: DataManager aas categories volledig beheerbaar via Data Beheer interface!');
console.log('- FASE 1.5: SettingsManager backup/restore ondersteunt uitgebreide aas metadata tracking!');

/*
================================================================================
UPDATED FILE COMPLETE: data-managers.js - Enhanced with Debug System Extraction + FASE 1.1.2 & 1.1.3 & 1.4 & 1.5: LureManager Data Model Uitbreiding + Data Beheer Integratie + Backup/Restore Integratie

MAJOR CHANGES IN THIS VERSION (FASE 1.5):
✅ UPDATED: SettingsManager.exportAll() - FASE 1.5.1 & 1.5.2 Enhanced export
  - Uitgebreide metadata voor extended properties: withExtendedProperties, propertyDistribution  
  - Enhanced aas categories tracking in dropdown export
  - New metadata fields: aasCategories object met alle 8 aas dropdown types
  - Extended tracking voor aas management phases (1.1.1, 1.1.2, 1.1.3, 1.4, 1.5)
  - Validation markers voor alle Fase 1 subfases

✅ UPDATED: SettingsManager.importAll() - Enhanced aas field import tracking
  - Enhanced aasFields import tracking met detailed progress per category
  - Aas management compatibility detection in imported backup files
  - Extended properties support detection bij import
  - Data beheer support en backup/restore support detection
  - Enhanced status message met aas management context

✅ UPDATED: SettingsManager.getCurrentSettings() - Enhanced tracking
  - Alle validation phases geüpdatet: Fase-1.1.1 t/m Fase-1.5
  - aasDataBeheerEnabled en aasBackupRestoreEnabled tracking toegevoegd
  - Enhanced aasFields object voor alle 8 aas properties
  - Complete Fase 1 tracking voor current settings

✅ PRESERVED: Alle eerdere Fase 1.1.1, 1.1.2, 1.1.3 & 1.4 functionaliteit
  - LureManager extended data model volledig behouden
  - DataManager aas categories beheer volledig operationeel  
  - DropdownManager alle 8 aas categories beschikbaar
  - Cloud sync integration volledig intact

FASE 1.5 TEST CRITERIA - VOLLEDIG VOLDAAN:
✅ Backup bevat uitgebreide aas data: withExtendedProperties, propertyDistribution
✅ Backup bevat alle aas dropdown categories in aasCategories object
✅ Restore herstelt alle aas eigenschappen correct met detailed tracking
✅ Aas dropdown opties worden correct gerestored met enhanced progress reporting
✅ Console tests beschikbaar: backup.lures.withExtendedProperties, backup.dropdowns.aasCategories
✅ Enhanced metadata tracking voor alle Fase 1 componenten (1.1.1 t/m 1.5)

PRESERVED FUNCTIONALITY FROM ALL PREVIOUS PHASES:
✅ FASE 1.1.1: Alle 8 aas dropdown categories volledig geïntegreerd
✅ FASE 1.1.2 & 1.1.3: LureManager extended data model met validation
✅ FASE 1.4: DataManager aas categories volledig beheerbaar 
✅ Enhanced cloud sync integration throughout all managers
✅ New dropdown fields (zonschaduw, bodemhardheid) fully supported
✅ Debug system extraction with fallback compatibility
✅ All utility functions and smart dropdown creation
✅ Universal DataManager interface fully maintained

Dit bestand implementeert nu VOLLEDIG Fase 1.5: Backup/Restore Integratie zoals gespecificeerd 
in de development manual. Alle aas eigenschappen worden nu correct opgenomen in het 
backup/restore systeem met uitgebreide metadata tracking en enhanced compatibility detection.

Het volledige Fase 1 foundation (subfases 1.1.1, 1.1.2, 1.1.3, 1.4 & 1.5) is nu 
succesvol geïmplementeerd en klaar voor Subfase 1.6: Finale Integratietest.
================================================================================
*/