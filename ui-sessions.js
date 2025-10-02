/*
================================================================================
ENHANCED FILE: ui-sessions.js - V6.3 Cloud Sync Integration + New Dropdown Fields + Decimal Normalization + Manual Sessions + Enhanced Date Input + Step 6 Reset Function Enhancement + DROPDOWN ALIGNMENT FIX + STEP 3 SAFE VALIDATION TRIGGERS + UNIFIED FUNCTIONS
================================================================================
USER INTERFACE & SESSION MANAGEMENT - WITH ENHANCED CLOUD SYNC INTEGRATION + NEW FIELDS + FIX 1 + MANUAL SESSION SUPPORT + DATE PARSING + STEP 6 RESET ENHANCEMENT + DROPDOWN ALIGNMENT FIX + STEP 3 SAFE VALIDATION TRIGGERS + REFACTORED UNIFIED FUNCTIONS
- REFACTORED: Large functions broken into focused, single-responsibility functions
- PRESERVED: All existing functionality, smart dropdown integration, validation systems
- ENHANCED: Full cloud sync integration throughout all session management operations
- BUG FIX: Parameter passing corrected in createBasicCatchInputs function
- CLOUD SYNC: Real-time status updates, team member awareness, enhanced user feedback
- NEW: Added Zon/Schaduw and Bodemhardheid dropdown fields to catch data inputs
- FIX 1: Nederlandse komma's (3,5) worden automatisch naar punten (3.5) geconverteerd
- NEW: Support for manual sessions without track points dependency
- ENHANCED: Improved date input with multiple formats and validation
- STEP 6: Enhanced reset function for blocked attempts counter with UI status updates
- ALIGNMENT FIX: Removed redundant time input column to fix dropdown alignment
- STEP 3: Safe validation triggers using ValidationStateManager to prevent infinite loops
- PHASE 1B: Added unified updateSessionField function to replace 4 duplicate functions
================================================================================
*/

// ================================
// FIX 1: DECIMAL NORMALIZATION HELPER FUNCTION
// ================================

function normalizeDecimal(value) {
    if (!value && value !== 0) return value;
    // Convert comma to dot for proper parseFloat processing
    return value.toString().replace(',', '.');
}

// ================================
// ENHANCED: updateSessionsList() - With Cloud Sync Integration
// ================================

function updateSessionsList() {
    const container = document.getElementById('sessionsList');
    container.innerHTML = '';
    
    if (sessions.length === 0) {
        renderEmptySessionsMessage(container);
        return;
    }
    
    sessions.forEach((session, sessionIndex) => {
        const sessionElement = createSessionElement(session, sessionIndex);
        container.appendChild(sessionElement);
    });
    
    // Enhanced cloud sync status update after sessions list update
    if (typeof updateCloudSyncStatus === 'function') {
        setTimeout(updateCloudSyncStatus, 100);
    }
    
    // Enhanced logging with cloud sync context
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available) {
        console.log(`Sessions list updated: ${sessions.length} sessions (Cloud sync: ${cloudInfo.status}) + new dropdown fields + decimal normalization`);
    }
}

function renderEmptySessionsMessage(container) {
    const cloudInfo = getCloudSyncInfo();
    const cloudIcon = cloudInfo.available && cloudInfo.teamMember ? ' ☁️' : '';
    
    container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
            <p>Geen sessies beschikbaar${cloudIcon}</p>
            <small>Upload eerst GPX bestanden of voeg handmatig een sessie toe</small>
            ${cloudInfo.available && cloudInfo.teamMember ? `<br><small style="color: #2196F3;">Cloud sync ready voor ${cloudInfo.teamMember}</small>` : ''}
        </div>
    `;
}

function createSessionElement(session, sessionIndex) {
    const filteredWaypoints = getFilteredWaypoints(session);
    const div = document.createElement('div');
    div.className = 'session-item';
    
    // Enhanced session element with cloud sync awareness
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available && cloudInfo.teamMember) {
        div.title = `Sessie ${sessionIndex + 1} - Cloud sync ready voor ${cloudInfo.teamMember}`;
    }
    
    const sessionHeader = createSessionHeader(session, filteredWaypoints.length, cloudInfo);
    const sessionInfo = createSessionInfo(session, cloudInfo);
    const sessionFields = createSessionFields(session, sessionIndex);
    const sessionButtons = createSessionButtons(sessionIndex, cloudInfo);
    const waypointEditor = createWaypointEditor(session, sessionIndex);
    
    div.innerHTML = sessionHeader + sessionInfo + sessionFields + sessionButtons + waypointEditor;
    return div;
}

function getFilteredWaypoints(session) {
    return activeSpeciesFilter ? 
        session.waypoints.filter(wp => {
            const parsed = parseWaypointName(wp.name);
            return parsed.soort === activeSpeciesFilter;
        }) : session.waypoints;
}

function createSessionHeader(session, waypointCount, cloudInfo) {
    const cloudIcon = cloudInfo.available && cloudInfo.teamMember ? ' ☁️' : '';
    const manualIcon = session.isManual ? ' 🖊️' : '';
    
    return `
        <div class="session-header">
            <div class="session-title">
                <div class="session-color" style="background: ${session.color}"></div>
                ${session.name}${cloudIcon}${manualIcon}
            </div>
            <span style="color: #666;">${waypointCount} vangsten</span>
        </div>
    `;
}

function createSessionInfo(session, cloudInfo) {
    const formatTime = (date) => date.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const duration = Math.round((session.endTime - session.startTime) / 60000);
    
    // Enhanced session info with cloud sync context
    const cloudStatus = cloudInfo.available && cloudInfo.teamMember ? 
        `<br><small style="color: #2196F3;">☁️ Cloud sync: ${cloudInfo.teamMember}</small>` : '';
    
    const trackInfo = session.isManual ? 
        '<small style="color: #999;">Handmatig toegevoegd</small>' :
        `<small style="color: #999;">Track points: ${session.trackPoints.length}</small>`;
    
    return `
        <div class="session-info">
            <strong>Start:</strong> ${formatTime(session.startTime)}<br>
            <strong>Eind:</strong> ${formatTime(session.endTime)}<br>
            <strong>Duur:</strong> ${duration} min<br>
            ${trackInfo}
            ${cloudStatus}
        </div>
    `;
}

function createSessionFields(session, sessionIndex) {
    const locationField = createLocationField(session, sessionIndex);
    const waterTypeField = createWaterTypeField(session, sessionIndex);
    const currentField = createCurrentField(session, sessionIndex);
    const temperatureField = createTemperatureField(session, sessionIndex);
    const clarityField = createClarityField(session, sessionIndex);
    
    return `
        <div style="border-top: 1px solid #e0e0e0; margin: 10px 0; padding-top: 10px;">
            <div style="display: grid; gap: 8px;">
                ${locationField}
                ${waterTypeField}
                ${currentField}
                ${temperatureField}
                ${clarityField}
            </div>
        </div>
    `;
}

function createLocationField(session, sessionIndex) {
    const locations = loadSavedLocations();
    const cloudInfo = getCloudSyncInfo();
    
    // Enhanced location field with cloud sync tooltip
    const locationTitle = cloudInfo.available && cloudInfo.teamMember ? 
        `Locatie selecteren - Cloud sync ready voor ${cloudInfo.teamMember}` : 'Locatie selecteren';
    
    return `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 20px;" title="${locationTitle}">📍</span>
            <select style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85em;" 
                    onchange="updateSessionFieldWithCloudSync(${sessionIndex}, 'locatie', this.value)"
                    title="${locationTitle}">
                <option value="">+ Nieuwe locatie...</option>
                <option value="" disabled>──────────</option>
                ${locations.map(loc => 
                    `<option value="${loc}" ${session.locatie === loc ? 'selected' : ''}>${loc}</option>`
                ).join('')}
            </select>
        </div>
    `;
}

function createWaterTypeField(session, sessionIndex) {
    const cloudInfo = getCloudSyncInfo();
    const waterTitle = cloudInfo.available && cloudInfo.teamMember ? 
        `Watersoort - Cloud sync ready voor ${cloudInfo.teamMember}` : 'Watersoort';
    
    return `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 20px;" title="${waterTitle}">💧</span>
            ${createSmartDropdown('watersoort', session.watersoort || '', 
                `handleDropdownChangeWithCloudSync(this, 'watersoort', (value) => updateSessionField(${sessionIndex}, 'watersoort', value))`,
                `style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85em;" title="${waterTitle}"`)}
        </div>
    `;
}

function createCurrentField(session, sessionIndex) {
    const cloudInfo = getCloudSyncInfo();
    const currentTitle = cloudInfo.available && cloudInfo.teamMember ? 
        `Stroomsnelheid - Cloud sync ready voor ${cloudInfo.teamMember}` : 'Stroomsnelheid';
    
    return `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 20px;" title="${currentTitle}">🌊</span>
            ${createSmartDropdown('stroomsnelheid', session.stroomsnelheid || '', 
                `handleDropdownChangeWithCloudSync(this, 'stroomsnelheid', (value) => updateSessionField(${sessionIndex}, 'stroomsnelheid', value))`,
                `style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85em;" title="${currentTitle}"`)}
        </div>
    `;
}

function createTemperatureField(session, sessionIndex) {
    const cloudInfo = getCloudSyncInfo();
    const tempTitle = cloudInfo.available && cloudInfo.teamMember ? 
        `Phase B: Temperature validation active + Decimal normalization - Cloud sync ready voor ${cloudInfo.teamMember}` : 
        'Phase B: Temperature validation active + Decimal normalization';
    
    return `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 20px;">🌡️</span>
            <input type="text" placeholder="Temp °C (3,5 of 3.5)" min="-5" max="35"
                   style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85em;"
                   value="${session.watertemperatuur || ''}"
                   onchange="updateSessionFieldWithValidationAndCloudSync(${sessionIndex}, 'watertemperatuur', this.value, this)"
                   title="${tempTitle}">
        </div>
    `;
}

function createClarityField(session, sessionIndex) {
    const cloudInfo = getCloudSyncInfo();
    const clarityTitle = cloudInfo.available && cloudInfo.teamMember ? 
        `Helderheid - Cloud sync ready voor ${cloudInfo.teamMember}` : 'Helderheid';
    
    return `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 20px;" title="${clarityTitle}">👁️</span>
            ${createSmartDropdown('helderheid', session.helderheid || '', 
                `handleDropdownChangeWithCloudSync(this, 'helderheid', (value) => updateSessionField(${sessionIndex}, 'helderheid', value))`,
                `style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85em;" title="${clarityTitle}"`)}
        </div>
    `;
}

function createSessionButtons(sessionIndex, cloudInfo) {
    // Enhanced session buttons with cloud sync context
    const cloudTooltip = cloudInfo.available && cloudInfo.teamMember ? 
        ` - Cloud sync ready voor ${cloudInfo.teamMember}` : '';
    
    return `
        <div style="margin-top: 10px;">
            <button class="session-edit-btn" onclick="editSessionTimeWithCloudSync(${sessionIndex})" 
                    title="Sessie tijden bewerken${cloudTooltip}">
                ⏰ Tijden
            </button>
            <button class="session-edit-btn" onclick="toggleWaypointEditor(${sessionIndex})" 
                    title="Vangsten bewerken${cloudTooltip}">
                ✏️ Vangsten
            </button>
            <button class="session-edit-btn success" onclick="splitSessionWithCloudSync(${sessionIndex})" 
                    title="Sessie splitsen${cloudTooltip}">
                ✂️ Splits
            </button>
            <button class="session-edit-btn danger" onclick="deleteSessionWithCloudSync(${sessionIndex})" 
                    title="Sessie verwijderen${cloudTooltip}">
                🗑️ Verwijder
            </button>
        </div>
    `;
}

function createWaypointEditor(session, sessionIndex) {
    return `
        <div class="waypoint-editor" id="editor-${sessionIndex}">
            ${generateWaypointEditor(session, sessionIndex)}
        </div>
    `;
}

// Enhanced generateWaypointEditor with cloud sync awareness
function generateWaypointEditor(session, sessionIndex) {
    if (session.waypoints.length === 0) {
        const cloudInfo = getCloudSyncInfo();
        const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
            ` - Cloud sync ready voor ${cloudInfo.teamMember}` : '';
        return `<p style="color: #666; text-align: center;">Geen vangsten in deze sessie${cloudText}</p>`;
    }
    
    return session.waypoints.map((wp, wpIndex) => 
        createWaypointItem(wp, sessionIndex, wpIndex)
    ).join('');
}

function createWaypointItem(wp, sessionIndex, wpIndex) {
    const parsed = parseWaypointName(wp.name);
    const cloudInfo = getCloudSyncInfo();
    
    return `
        <div class="waypoint-item" ${cloudInfo.available && cloudInfo.teamMember ? `title="Vangst - Cloud sync ready voor ${cloudInfo.teamMember}"` : ''}>
            <div class="waypoint-info">
                <strong>${parsed.soort || 'Onbekend'}</strong> - ${parsed.lengte || '-'} cm
                <br><small>${new Date(wp.time).toLocaleTimeString('nl-NL')}</small>
            </div>
            <div class="waypoint-controls">
                ${createWaypointControls(parsed, sessionIndex, wpIndex, cloudInfo)}
            </div>
        </div>
    `;
}

function createWaypointControls(parsed, sessionIndex, wpIndex, cloudInfo) {
    const speciesTitle = `Phase C: Species validation active${cloudInfo.available && cloudInfo.teamMember ? ` - Cloud sync ready voor ${cloudInfo.teamMember}` : ''}`;
    const lengthTitle = `Phase B: Length validation active + Decimal normalization${cloudInfo.available && cloudInfo.teamMember ? ` - Cloud sync ready voor ${cloudInfo.teamMember}` : ''}`;
    const countTitle = `Phase B: Count validation active${cloudInfo.available && cloudInfo.teamMember ? ` - Cloud sync ready voor ${cloudInfo.teamMember}` : ''}`;
    
    return `
        <input type="text" class="small-input" value="${parsed.soort}" 
               onchange="updateWaypointWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'soort', this.value, this)" 
               placeholder="Soort" title="${speciesTitle}">
        <input type="text" class="small-input" value="${parsed.lengte}" 
               onchange="updateWaypointWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'lengte', this.value, this)" 
               placeholder="cm (3,5 of 3.5)" title="${lengthTitle}">
        <input type="number" class="small-input" value="${parsed.aantal}" 
               onchange="updateWaypointWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'aantal', this.value, this)" 
               placeholder="#" min="1" title="${countTitle}">
    `;
}

// ================================
// ENHANCED: updateDataTable() - With Cloud Sync Integration + New Dropdown Fields
// ================================

function updateDataTable() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    
    if (sessions.length === 0) {
        renderEmptyDataTable(tbody);
        return;
    }
    
    sessions.forEach((session, sessionIndex) => {
        if (session.waypoints.length === 0) {
            addEmptySessionRow(tbody, session, sessionIndex);
        } else {
            addSessionWaypointRows(tbody, session, sessionIndex);
        }
    });
    
    applyTableVisibilitySettings();
    
    // Enhanced cloud sync status update after data table update
    if (typeof updateCloudSyncStatus === 'function') {
        setTimeout(updateCloudSyncStatus, 100);
    }
    
    // Enhanced logging with cloud sync context + new fields + decimal normalization
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available) {
        const totalRows = sessions.reduce((total, s) => total + Math.max(s.waypoints.length, 1), 0);
        console.log(`Data table updated: ${totalRows} rows (Cloud sync: ${cloudInfo.status}) + new dropdown fields + decimal normalization`);
    }
}

function renderEmptyDataTable(tbody) {
    const cloudInfo = getCloudSyncInfo();
    const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
        ` Cloud sync ready voor ${cloudInfo.teamMember}.` : '';
    
    tbody.innerHTML = `
        <tr>
            <td colspan="24" style="text-align: center; padding: 20px; color: #666;">
                Geen sessies beschikbaar. Upload eerst GPX bestanden of voeg handmatig een sessie toe.${cloudText}
            </td>
        </tr>
    `;
}

function addEmptySessionRow(tbody, session, sessionIndex) {
    const row = tbody.insertRow();
    row.className = 'empty-session';
    row.dataset.sessionIndex = sessionIndex;
    
    // Enhanced row with cloud sync context
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available && cloudInfo.teamMember) {
        row.title = `Lege sessie - Cloud sync ready voor ${cloudInfo.teamMember}`;
    }
    
    const sessionCells = createEmptySessionCells(session);
    const emptyCatchCells = createEmptyMessage();
    
    row.innerHTML = sessionCells + emptyCatchCells;
}

function createEmptySessionCells(session) {
    return `
        <td class="readonly">${session.startTime.toLocaleDateString('nl-NL')}</td>
        <td class="readonly">-</td>
        <td class="readonly">${session.locatie || ''}</td>
        <td class="readonly">${session.startTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})}</td>
        <td class="readonly">${session.endTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})}</td>
        <td class="readonly">-</td>
        <td class="readonly">${session.watersoort || ''}</td>
        <td class="readonly">${session.stroomsnelheid || ''}</td>
        <td class="readonly">${session.watertemperatuur || ''}</td>
        <td class="readonly">${session.helderheid || ''}</td>
    `;
}

function createEmptyMessage() {
    const cloudInfo = getCloudSyncInfo();
    const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
        ` (Cloud sync: ${cloudInfo.teamMember})` : '';
    
    return `
        <td class="empty-message" colspan="13" style="text-align: center; color: #999;">
            Geen vangsten - klik op de kaart om een vangst toe te voegen${cloudText}
        </td>
    `;
}

function addSessionWaypointRows(tbody, session, sessionIndex) {
    session.waypoints.forEach((wp, wpIndex) => {
        const row = createWaypointDataRow(tbody, session, sessionIndex, wp, wpIndex);
        tbody.appendChild(row);
    });
}

function createWaypointDataRow(tbody, session, sessionIndex, wp, wpIndex) {
    const parsed = parseWaypointName(wp.name);
    const row = tbody.insertRow();
    
    // Initialize catchData if not exists
    if (!wp.catchData) {
        wp.catchData = {};
    }
    
    // Apply highlighting if filtered
    if (activeSpeciesFilter && parsed.soort === activeSpeciesFilter) {
        row.className = 'highlighted';
    }
    
    // Set data attributes for identification
    row.dataset.sessionIndex = sessionIndex;
    row.dataset.waypointIndex = wpIndex;
    
    // Enhanced row with cloud sync context
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available && cloudInfo.teamMember) {
        row.title = `Vangst: ${parsed.soort || 'Onbekend'} - Cloud sync ready voor ${cloudInfo.teamMember}`;
    }
    
    // Create row content
    const sessionCells = createSessionDataCells(session, wp, wpIndex);
    const catchCells = createCatchDataCells(wp, parsed, sessionIndex, wpIndex);
    
    row.innerHTML = sessionCells + catchCells;
    return row;
}

function createSessionDataCells(session, wp, wpIndex) {
    return `
        <td class="auto-filled readonly">${wp.datetime.toLocaleDateString('nl-NL')}</td>
        <td class="auto-filled readonly">${wp.datetime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})}</td>
        <td class="auto-filled readonly">${session.locatie || ''}</td>
        <td class="auto-filled readonly">${wpIndex === 0 ? session.startTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : ''}</td>
        <td class="auto-filled readonly">${wpIndex === session.waypoints.length - 1 ? session.endTime.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) : ''}</td>
        <td class="auto-filled readonly">${wp.lat.toFixed(6)}, ${wp.lon.toFixed(6)}</td>
        <td class="auto-filled readonly">${session.watersoort || ''}</td>
        <td class="auto-filled readonly">${session.stroomsnelheid || ''}</td>
        <td class="auto-filled readonly">${session.watertemperatuur || ''}</td>
        <td class="auto-filled readonly">${session.helderheid || ''}</td>
    `;
}

function createCatchDataCells(wp, parsed, sessionIndex, wpIndex) {
    const basicCatchInputs = createBasicCatchInputs(wp, parsed, sessionIndex, wpIndex);
    const lureSelector = createLureSelector(wp, sessionIndex, wpIndex);
    const catchDropdowns = createCatchDropdowns(wp, sessionIndex, wpIndex);
    
    return basicCatchInputs + lureSelector + catchDropdowns;
}

function createBasicCatchInputs(wp, parsed, sessionIndex, wpIndex) {
    const cloudInfo = getCloudSyncInfo();
    const speciesTitle = `Phase C: Species validation active${cloudInfo.available && cloudInfo.teamMember ? ` - Cloud sync ready voor ${cloudInfo.teamMember}` : ''}`;
    const countTitle = `Phase B: Count validation active${cloudInfo.available && cloudInfo.teamMember ? ` - Cloud sync ready voor ${cloudInfo.teamMember}` : ''}`;
    const lengthTitle = `Phase B: Length validation active + Decimal normalization${cloudInfo.available && cloudInfo.teamMember ? ` - Cloud sync ready voor ${cloudInfo.teamMember}` : ''}`;
    const depthTitle = `Phase B: Depth validation active + Decimal normalization${cloudInfo.available && cloudInfo.teamMember ? ` - Cloud sync ready voor ${cloudInfo.teamMember}` : ''}`;
    
    return `
        <td><input type="text" value="${parsed.soort || ''}" onchange="updateTableCellWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'soort', this.value, this)" title="${speciesTitle}"></td>
        <td><input type="number" value="${parsed.aantal || 1}" min="1" max="50" onchange="updateTableCellWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'aantal', this.value, this)" title="${countTitle}"></td>
        <td><input type="text" value="${parsed.lengte || ''}" min="0" max="300" placeholder="cm (3,5 of 3.5)" onchange="updateTableCellWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'lengte', this.value, this)" title="${lengthTitle}"></td>
        <td><input type="text" min="0" max="100" placeholder="0,0 of 0.0" value="${wp.catchData.diepte || ''}" onchange="updateTableCellWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'diepte', this.value, this)" title="${depthTitle}"></td>
    `;
}

function createLureSelector(wp, sessionIndex, wpIndex) {
    const cloudInfo = getCloudSyncInfo();
    const lureTitle = cloudInfo.available && cloudInfo.teamMember ? 
        `Klik op 🔍 om aas te selecteren - Cloud sync ready voor ${cloudInfo.teamMember}` : 
        'Klik op 🔍 om aas te selecteren';
    
    return `
        <td>
            <div class="lure-input-wrapper" title="${lureTitle}">
                <span class="lure-input-icon">${wp.catchData.lureEmoji || '🎣'}</span>
                <input type="text" class="lure-input" 
                       value="${wp.catchData.aas || ''}" 
                       placeholder="Selecteer aas"
                       onchange="updateTableCellWithCloudSync(${sessionIndex}, ${wpIndex}, 'aas', this.value)"
                       readonly>
                <button class="lure-browse-btn" onclick="openLureModalWithCloudSync(this.parentElement.querySelector('.lure-input'), ${sessionIndex}, ${wpIndex})" title="${lureTitle}">🔍</button>
            </div>
        </td>
    `;
}

function createCatchDropdowns(wp, sessionIndex, wpIndex) {
    const cloudInfo = getCloudSyncInfo();
    const dropdownTitle = cloudInfo.available && cloudInfo.teamMember ? 
        ` - Cloud sync ready voor ${cloudInfo.teamMember}` : '';
    
    return `
        <td>${createSmartDropdown('booster', wp.catchData.booster || '', 
            `handleDropdownChangeWithCloudSync(this, 'booster', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'booster', value))`,
            `title="Booster${dropdownTitle}"`)}
        </td>
        <td><input type="text" min="0" max="50000" placeholder="0 (3,5 of 3.5)" value="${wp.catchData.gewicht || ''}" onchange="updateTableCellWithValidationAndCloudSync(${sessionIndex}, ${wpIndex}, 'gewicht', this.value, this)" title="Phase B: Weight validation active + Decimal normalization${dropdownTitle}"></td>
        <td>${createSmartDropdown('techniek', wp.catchData.techniek || '', 
            `handleDropdownChangeWithCloudSync(this, 'techniek', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'techniek', value))`,
            `title="Techniek${dropdownTitle}"`)}
        </td>
        <td>${createSmartDropdown('vissnelheid', wp.catchData.vissnelheid || '', 
            `handleDropdownChangeWithCloudSync(this, 'vissnelheid', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'vissnelheid', value))`,
            `title="Vissnelheid${dropdownTitle}"`)}
        </td>
        <td>${createSmartDropdown('structuur', wp.catchData.structuur || '', 
            `handleDropdownChangeWithCloudSync(this, 'structuur', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'structuur', value))`,
            `title="Structuur${dropdownTitle}"`)}
        </td>
        <td>${createSmartDropdown('aasvis', wp.catchData.aasvis || '', 
            `handleDropdownChangeWithCloudSync(this, 'aasvis', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'aasvis', value))`,
            `title="Aasvis op stek${dropdownTitle}"`)}
        </td>
        <td>${createSmartDropdown('vangsthoogte', wp.catchData.vangsthoogte || '', 
            `handleDropdownChangeWithCloudSync(this, 'vangsthoogte', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'vangsthoogte', value))`,
            `title="Vangsthoogte${dropdownTitle}"`)}
        </td>
        <td>${createSmartDropdown('zonschaduw', wp.catchData.zonschaduw || '', 
            `handleDropdownChangeWithCloudSync(this, 'zonschaduw', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'zonschaduw', value))`,
            `title="Zon/Schaduw${dropdownTitle}"`)}
        </td>
        <td>${createSmartDropdown('bodemhardheid', wp.catchData.bodemhardheid || '', 
            `handleDropdownChangeWithCloudSync(this, 'bodemhardheid', (value) => updateTableCell(${sessionIndex}, ${wpIndex}, 'bodemhardheid', value))`,
            `title="Bodemhardheid${dropdownTitle}"`)}
        </td>
    `;
}

function applyTableVisibilitySettings() {
    setTimeout(() => {
        if (document.getElementById('hideSessionColumns') && document.getElementById('hideSessionColumns').checked) {
            toggleSessionColumns();
        }
        if (document.getElementById('hideFilledColumns') && document.getElementById('hideFilledColumns').checked) {
            toggleFilledColumns();
        }
    }, 0);
}

// ================================
// ENHANCED: PRESERVED FUNCTIONS WITH CLOUD SYNC INTEGRATION
// ================================

function updateSpeciesFilter() {
    const filterContainer = document.getElementById('speciesFilter');
    filterContainer.innerHTML = '';
    
    const species = [...new Set(waypoints.map(wp => {
        const parsed = parseWaypointName(wp.name);
        return parsed.soort;
    }).filter(s => s))];
    
    const cloudInfo = getCloudSyncInfo();
    
    const allTag = document.createElement('span');
    allTag.className = `species-tag ${!activeSpeciesFilter ? 'active' : ''}`;
    allTag.textContent = 'Alle soorten';
    allTag.onclick = () => filterBySpeciesWithCloudSync(null);
    
    if (cloudInfo.available && cloudInfo.teamMember) {
        allTag.title = `Alle soorten tonen - Cloud sync ready voor ${cloudInfo.teamMember}`;
    }
    
    filterContainer.appendChild(allTag);
    
    species.forEach(spec => {
        const tag = document.createElement('span');
        tag.className = `species-tag ${activeSpeciesFilter === spec ? 'active' : ''}`;
        tag.textContent = spec;
        tag.onclick = () => filterBySpeciesWithCloudSync(spec);
        
        if (cloudInfo.available && cloudInfo.teamMember) {
            tag.title = `Filter op ${spec} - Cloud sync ready voor ${cloudInfo.teamMember}`;
        }
        
        filterContainer.appendChild(tag);
    });
}

function filterBySpeciesWithCloudSync(species) {
    activeSpeciesFilter = species;
    updateSpeciesFilter();
    updateSessionsList();
    updateDataTable();
    drawWaypoints();
    
    // Enhanced cloud sync logging
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available) {
        console.log(`Species filter: ${species || 'All'} (Cloud sync: ${cloudInfo.status}) + new dropdown fields + decimal normalization`);
    }
}

function filterBySpecies(species) {
    filterBySpeciesWithCloudSync(species);
}

function updateStats() {
    const totalCatches = waypoints.length;
    const uniqueSpecies = [...new Set(waypoints.map(wp => {
        const parsed = parseWaypointName(wp.name);
        return parsed.soort;
    }).filter(s => s))].length;
    
    const totalTime = sessions.reduce((total, session) => {
        return total + (session.endTime - session.startTime);
    }, 0);
    
    const totalHours = Math.round(totalTime / (1000 * 60 * 60) * 10) / 10;
    
    document.getElementById('sessionCount').textContent = sessions.length;
    document.getElementById('catchCount').textContent = totalCatches;
    document.getElementById('speciesCount').textContent = uniqueSpecies;
    document.getElementById('totalTime').textContent = `${totalHours}h`;
    
    // Enhanced stats update with cloud sync awareness
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available) {
        console.log(`Stats updated: ${sessions.length} sessions, ${totalCatches} catches (Cloud sync: ${cloudInfo.status}) + new dropdown fields + decimal normalization`);
    }
}

// ================================
// PHASE 1B: NIEUWE UNIFIED updateSessionField FUNCTIE
// ================================

/**
 * UNIFIED SESSION FIELD UPDATE FUNCTION - Replaces 4 old variants
 * @param {number} sessionIndex - Index of session to update
 * @param {string} field - Field name to update
 * @param {*} value - New field value  
 * @param {Object} options - Configuration options
 * @param {boolean} options.validate - Enable input validation
 * @param {boolean} options.cloudSync - Enable cloud sync updates
 * @param {HTMLElement} options.inputElement - Input element for validation feedback
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 */
function updateSessionField(sessionIndex, field, value, options = {}) {
    const {
        validate = false,
        cloudSync = false,
        inputElement = null,
        onSuccess = null,
        onError = null
    } = options;
    
    try {
        // 1. Core logic (from original updateSessionField)
        const session = sessions[sessionIndex];
        if (!session) {
            throw new Error(`Session ${sessionIndex} not found`);
        }
        
        const cloudInfo = getCloudSyncInfo();
        
        // 2. Special field handling
        if (field === 'locatie' && value === '') {
            // Handle new location creation
            const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
                `\n\nCloud sync: Nieuwe locatie wordt gedeeld met ${cloudInfo.teamMember} team.` : '';
            
            const newLocation = prompt(`Voer nieuwe locatie in:${cloudContext}\n(Bijvoorbeeld: Water - Plaats)`);
            if (newLocation && newLocation.trim()) {
                if (validate) {
                    const validation = validateLocationName(newLocation.trim());
                    if (!validation.valid) {
                        if (inputElement) applyValidationFeedback(inputElement, validation);
                        if (onError) onError(validation.error);
                        return false;
                    }
                }
                
                const locations = loadSavedLocations();
                if (!locations.includes(newLocation)) {
                    locations.push(newLocation);
                    saveLocations(locations);
                }
                session[field] = newLocation;
            } else {
                return false;
            }
        } else {
            // Regular field update
            session[field] = value;
        }
        
        // 3. Decimal normalization for temperature fields
        if (field === 'watertemperatuur' && value) {
            const normalizedValue = normalizeDecimal(value);
            session[field] = parseFloat(normalizedValue).toFixed(1);
        }
        
        // 4. Validation (if enabled)
        if (validate && inputElement && value) {
            let validationResult = { valid: true, error: '' };
            
            if (field === 'watertemperatuur') {
                const normalizedValue = normalizeDecimal(value);
                validationResult = validateTemperature(normalizedValue);
            }
            
            applyValidationFeedback(inputElement, validationResult);
            
            if (!validationResult.valid) {
                if (onError) onError(validationResult.error);
                return false;
            }
        }
        
        // 5. UI Updates (always happen)
        updateSessionsList();
        updateDataTable();
        
        // 6. Cloud sync updates (if enabled)
        if (cloudSync) {
            if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
                setTimeout(() => {
                    if (typeof updateCloudSyncStatus === 'function') {
                        updateCloudSyncStatus();
                    }
                }, 200);
            }
            
            const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
                ` (Cloud sync: ${cloudInfo.teamMember})` : '';
            
            if (typeof showStatus === 'function') {
                showStatus(`Sessie bijgewerkt${cloudText}`, 'success');
            }
        }
        
        // 7. Validation updates (if cloud sync enabled)
        if (cloudSync && !ValidationStateManager.isValidating) {
            setTimeout(() => {
                if (typeof updateValidationInRealTime === 'function') {
                    updateValidationInRealTime();
                }
            }, 100);
        }
        
        const cloudText = cloudInfo.available && cloudInfo.teamMember ? ` (Cloud sync: ${cloudInfo.teamMember})` : '';
        console.log(`Updated session ${sessionIndex} - ${field}: ${value}${cloudText} + new dropdown fields + decimal normalization support + memory protection`);
        
        if (onSuccess) onSuccess();
        return true;
        
    } catch (error) {
        console.error('updateSessionField error:', error);
        if (onError) onError(error.message);
        return false;
    }
}

// ================================
// COMPATIBILITY WRAPPER FUNCTIONS - Keep old API working
// ================================

// Old: updateSessionFieldWithCloudSync(sessionIndex, field, value)
function updateSessionFieldWithCloudSync(sessionIndex, field, value) {
    return updateSessionField(sessionIndex, field, value, { cloudSync: true });
}

// Old: updateSessionFieldWithValidation(sessionIndex, field, value, inputElement)
function updateSessionFieldWithValidation(sessionIndex, field, value, inputElement) {
    return updateSessionField(sessionIndex, field, value, { validate: true, inputElement: inputElement });
}

// Old: updateSessionFieldWithValidationAndCloudSync(sessionIndex, field, value, inputElement)
function updateSessionFieldWithValidationAndCloudSync(sessionIndex, field, value, inputElement) {
    return updateSessionField(sessionIndex, field, value, { 
        validate: true, 
        cloudSync: true, 
        inputElement: inputElement 
    });
}

// ================================
// ENHANCED SESSION MANAGEMENT FUNCTIONS WITH CLOUD SYNC INTEGRATION + FIX 1 + MANUAL SESSION SUPPORT + ENHANCED DATE INPUT
// ================================

function addNewSessionWithCloudSync() {
    const cloudInfo = getCloudSyncInfo();
    
    // Bepaal basis datum
    const baseDate = trackPoints.length > 0 ? new Date(trackPoints[0].datetime) : new Date();
    const defaultDateStr = baseDate.toLocaleDateString('nl-NL');
    
    const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
        `\n\nCloud sync: Nieuwe sessie wordt gedeeld met ${cloudInfo.teamMember} team.` : '';
    
    // STAP 1: Vraag om datum
    const dateInput = prompt(
        `Datum voor nieuwe sessie:${cloudContext}\n\n` +
        `Formaten:\n` +
        `• DD-MM-YYYY (bijv. 15-03-2024)\n` +
        `• DD/MM/YYYY (bijv. 15/03/2024)\n` +
        `• DD.MM.YYYY (bijv. 15.03.2024)\n` +
        `• Laat leeg voor vandaag (${defaultDateStr})`,
        ''
    );
    
    if (dateInput === null) return; // Geannuleerd
    
    // Parse datum
    let sessionDate;
    if (!dateInput.trim()) {
        // Gebruik default datum
        sessionDate = new Date(baseDate);
    } else {
        // Parse ingevoerde datum
        const dateValidation = parseAndValidateDate(dateInput.trim());
        if (!dateValidation.valid) {
            alert(`Datum fout: ${dateValidation.error}`);
            return;
        }
        sessionDate = dateValidation.date;
    }
    
    const dateStr = sessionDate.toLocaleDateString('nl-NL');
    
    // STAP 2: Vraag om starttijd
    const startTime = prompt(`Starttijd voor sessie op ${dateStr} (HH:MM):${cloudContext}`);
    if (!startTime) return;
    
    // STAP 3: Vraag om eindtijd
    const endTime = prompt(`Eindtijd voor sessie op ${dateStr} (HH:MM):${cloudContext}`);
    if (!endTime) return;
    
    // Valideer tijden
    const startValidation = validateTime(startTime);
    if (!startValidation.valid) {
        alert(`Starttijd fout (Phase ${startValidation.phase}): ${startValidation.error}`);
        return;
    }
    
    const endValidation = validateTime(endTime);
    if (!endValidation.valid) {
        alert(`Eindtijd fout (Phase ${endValidation.phase}): ${endValidation.error}`);
        return;
    }
    
    // Maak datum/tijd objecten
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const newStartDate = new Date(sessionDate);
    newStartDate.setHours(startHour, startMin, 0, 0);
    
    const newEndDate = new Date(sessionDate);
    newEndDate.setHours(endHour, endMin, 0, 0);
    
    // Als eindtijd voor starttijd is, ga naar volgende dag
    if (newEndDate <= newStartDate) {
        newEndDate.setDate(newEndDate.getDate() + 1);
    }
    
    const newSessionIndex = sessions.length;
    
    // Maak nieuwe sessie
    sessions.push({
        id: newSessionIndex + 1,
        name: `Sessie ${newSessionIndex + 1}`,
        startTime: newStartDate,
        endTime: newEndDate,
        trackPoints: [],
        waypoints: [],
        color: CONFIG.sessionColors[newSessionIndex % CONFIG.sessionColors.length],
        fileName: 'Handmatig toegevoegd',
        isManual: true
    });
    
    // Sorteer en hernummer sessies
    sessions.sort((a, b) => a.startTime - b.startTime);
    sessions.forEach((s, idx) => {
        s.id = idx + 1;
        s.name = `Sessie ${idx + 1}`;
        s.color = CONFIG.sessionColors[idx % CONFIG.sessionColors.length];
    });
    
    // Update UI
    updateSessionsList();
    updateTrackColors();
    updateStats();
    updateDataTable();
    
    if (typeof updateValidationInRealTime === 'function') {
        updateValidationInRealTime();
    }
    
    if (typeof updateCloudSyncStatus === 'function') {
        updateCloudSyncStatus();
    }
    
    const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
        ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
    showStatus(`Nieuwe sessie toegevoegd voor ${dateStr} (${startTime} - ${endTime})${cloudText}`, 'success');
}

function addNewSession() {
    addNewSessionWithCloudSync();
}

function editSessionTimeWithCloudSync(sessionIndex) {
    const session = sessions[sessionIndex];
    if (!session) return;
    
    const cloudInfo = getCloudSyncInfo();
    const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
        `\n\nCloud sync: Tijdwijzigingen worden gedeeld met ${cloudInfo.teamMember} team.` : '';
    
    const formatDateTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    
    const currentStart = formatDateTime(session.startTime);
    const currentEnd = formatDateTime(session.endTime);
    
    const newStart = prompt(`Starttijd voor ${session.name}:${cloudContext}\n(Huidige: ${currentStart})\nFormaat: HH:MM`, currentStart);
    if (!newStart) return;
    
    const newEnd = prompt(`Eindtijd voor ${session.name}:${cloudContext}\n(Huidige: ${currentEnd})\nFormaat: HH:MM`, currentEnd);
    if (!newEnd) return;
    
    const startValidation = validateTime(newStart);
    if (!startValidation.valid) {
        alert(`Starttijd fout (Phase ${startValidation.phase}): ${startValidation.error}`);
        return;
    }
    
    const endValidation = validateTime(newEnd);
    if (!endValidation.valid) {
        alert(`Eindtijd fout (Phase ${endValidation.phase}): ${endValidation.error}`);
        return;
    }
    
    const [startHour, startMin] = newStart.split(':').map(Number);
    const [endHour, endMin] = newEnd.split(':').map(Number);
    
    const newStartDate = new Date(session.startTime);
    newStartDate.setHours(startHour, startMin, 0, 0);
    
    const newEndDate = new Date(session.endTime);
    newEndDate.setHours(endHour, endMin, 0, 0);
    
    if (newEndDate <= newStartDate) {
        newEndDate.setDate(newEndDate.getDate() + 1);
    }
    
    session.startTime = newStartDate;
    session.endTime = newEndDate;
    
    updateSessionData();
    
    updateSessionsList();
    updateTrackColors();
    updateStats();
    updateDataTable();
    
    // STEP 3: Safe validation and cloud sync updates
    if (!ValidationStateManager.isValidating) {
        setTimeout(() => {
            if (typeof updateValidationInRealTime === 'function') {
                updateValidationInRealTime();
            }
        }, 100);
    }

    if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
        setTimeout(() => {
            if (typeof updateCloudSyncStatus === 'function') {
                updateCloudSyncStatus();
            }
        }, 200);
    }
    
    // STEP 6: Reset blocked attempts after session time changes
    resetBlockedAttempts();
    
    const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
        ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
    showStatus(`Tijden aangepast voor ${session.name}: ${newStart} - ${newEnd} (Phase A Validated)${cloudText} + memory protection`, 'success');
}

function editSessionTime(sessionIndex) {
    editSessionTimeWithCloudSync(sessionIndex);
}

function splitSessionWithCloudSync(sessionIndex) {
    const session = sessions[sessionIndex];
    if (!session) return;
    
    const cloudInfo = getCloudSyncInfo();
    const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
        `\n\nCloud sync: Gesplitste sessies worden gedeeld met ${cloudInfo.teamMember} team.` : '';
    
    if (session.waypoints.length === 0) {
        const duration = Math.round((session.endTime - session.startTime) / 60000);
        const splitMinutes = prompt(
            `Geen vangsten in deze sessie.${cloudContext}\nNa hoeveel minuten splitsen?\n\nTotale duur: ${duration} minuten`,
            Math.round(duration / 2)
        );
        
        if (!splitMinutes) return;
        
        const minutes = parseInt(splitMinutes);
        if (isNaN(minutes) || minutes <= 0 || minutes >= duration) {
            alert('Ongeldige tijd! Moet tussen 1 en ' + (duration - 1) + ' minuten zijn.');
            return;
        }
        
        const splitTime = new Date(session.startTime.getTime() + minutes * 60000);
        
        const session1 = {
            ...session,
            name: session.name + 'a',
            endTime: splitTime,
            waypoints: [],
            trackPoints: session.trackPoints.filter(tp => tp.datetime < splitTime)
        };
        
        const session2 = {
            ...session,
            id: session.id + 0.5,
            name: session.name + 'b',
            startTime: splitTime,
            waypoints: [],
            trackPoints: session.trackPoints.filter(tp => tp.datetime >= splitTime),
            color: CONFIG.sessionColors[(sessionIndex + 1) % CONFIG.sessionColors.length]
        };
        
        sessions.splice(sessionIndex, 1, session1, session2);
        
    } else {
        let splitOptions = `Waar wil je de sessie splitsen?${cloudContext}\n\n`;
        session.waypoints.forEach((wp, idx) => {
            const parsed = parseWaypointName(wp.name);
            const time = new Date(wp.time).toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'});
            splitOptions += `${idx + 1}. ${time} - ${parsed.soort || wp.name}\n`;
        });
        splitOptions += '\nVoer nummer in (splits NA deze vangst):';
        
        const splitAfter = prompt(splitOptions);
        if (!splitAfter) return;
        
        const splitIndex = parseInt(splitAfter) - 1;
        if (isNaN(splitIndex) || splitIndex < 0 || splitIndex >= session.waypoints.length) {
            alert('Ongeldige keuze!');
            return;
        }
        
        let splitTime;
        if (splitIndex === session.waypoints.length - 1) {
            splitTime = new Date(session.waypoints[splitIndex].datetime.getTime() + 5 * 60000);
        } else {
            const time1 = session.waypoints[splitIndex].datetime.getTime();
            const time2 = session.waypoints[splitIndex + 1].datetime.getTime();
            splitTime = new Date((time1 + time2) / 2);
        }
        
        const session1 = {
            ...session,
            name: session.name + 'a',
            endTime: splitTime,
            waypoints: session.waypoints.slice(0, splitIndex + 1),
            trackPoints: session.trackPoints.filter(tp => tp.datetime < splitTime)
        };
        
        const session2 = {
            ...session,
            id: session.id + 0.5,
            name: session.name + 'b',
            startTime: splitTime,
            waypoints: session.waypoints.slice(splitIndex + 1),
            trackPoints: session.trackPoints.filter(tp => tp.datetime >= splitTime),
            color: CONFIG.sessionColors[(sessionIndex + 1) % CONFIG.sessionColors.length]
        };
        
        sessions.splice(sessionIndex, 1, session1, session2);
    }
    
    sessions.sort((a, b) => a.startTime - b.startTime);
    
    sessions.forEach((s, idx) => {
        s.id = idx + 1;
        s.name = `Sessie ${idx + 1}`;
        s.color = CONFIG.sessionColors[idx % CONFIG.sessionColors.length];
    });
    
    updateSessionsList();
    updateTrackColors();
    updateStats();
    updateDataTable();
    
    // STEP 3: Safe validation and cloud sync updates
    if (!ValidationStateManager.isValidating) {
        setTimeout(() => {
            if (typeof updateValidationInRealTime === 'function') {
                updateValidationInRealTime();
            }
        }, 100);
    }

    if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
        setTimeout(() => {
            if (typeof updateCloudSyncStatus === 'function') {
                updateCloudSyncStatus();
            }
        }, 200);
    }
    
    const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
        ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
    showStatus(`Sessie gesplitst${cloudText} + memory protection`, 'success');
}

function splitSession(sessionIndex) {
    splitSessionWithCloudSync(sessionIndex);
}

function deleteSessionWithCloudSync(sessionIndex) {
    const cloudInfo = getCloudSyncInfo();
    const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
        `\n\nLet op: Cloud sync is actief - wijziging wordt gedeeld met ${cloudInfo.teamMember} team.` : '';
    
    if (confirm(`Sessie ${sessions[sessionIndex].name} verwijderen?${cloudContext}`)) {
        sessions.splice(sessionIndex, 1);
        
        sessions.sort((a, b) => a.startTime - b.startTime);
        
        sessions.forEach((session, idx) => {
            session.id = idx + 1;
            session.name = `Sessie ${idx + 1}`;
            session.color = CONFIG.sessionColors[idx % CONFIG.sessionColors.length];
        });
        
        updateSessionsList();
        updateTrackColors();
        updateStats();
        updateDataTable();
        
        // STEP 3: Safe validation and cloud sync updates
        if (!ValidationStateManager.isValidating) {
            setTimeout(() => {
                if (typeof updateValidationInRealTime === 'function') {
                    updateValidationInRealTime();
                }
            }, 100);
        }

        if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
            setTimeout(() => {
                if (typeof updateCloudSyncStatus === 'function') {
                    updateCloudSyncStatus();
                }
            }, 200);
        }
        
        const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
            ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
        showStatus(`Sessie verwijderd en hernummerd${cloudText} + memory protection`, 'success');
    }
}

function deleteSession(sessionIndex) {
    deleteSessionWithCloudSync(sessionIndex);
}

// ================================
// ENHANCED WAYPOINT MANAGEMENT FUNCTIONS WITH CLOUD SYNC INTEGRATION
// ================================

function toggleWaypointEditor(sessionIndex) {
    const editor = document.getElementById(`editor-${sessionIndex}`);
    editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
    
    // Enhanced toggle with cloud sync logging
    const cloudInfo = getCloudSyncInfo();
    if (cloudInfo.available) {
        console.log(`Waypoint editor toggled for session ${sessionIndex} (Cloud sync: ${cloudInfo.status}) + new dropdown fields + decimal normalization + memory protection`);
    }
}

function updateWaypointWithValidationAndCloudSync(sessionIndex, wpIndex, field, value, inputElement) {
    let validationResult = { valid: true, error: '' };
    
    switch(field) {
        case 'soort':
            validationResult = validateSpeciesName(value);
            break;
        case 'lengte':
            // FIX 1: Apply decimal normalization before validation
            const normalizedLength = normalizeDecimal(value);
            validationResult = validateLength(normalizedLength);
            break;
        case 'aantal':
            validationResult = validateNumber(value, 1, 50, 0);
            if (!validationResult.valid) {
                validationResult.error = 'Aantal moet tussen 1 en 50 zijn';
            }
            break;
    }
    
    applyValidationFeedback(inputElement, validationResult);
    
    if (validationResult.valid || (!value && field !== 'aantal' && field !== 'soort')) {
        updateWaypointWithCloudSync(sessionIndex, wpIndex, field, value);
    }
    
    const cloudInfo = getCloudSyncInfo();
    const cloudText = cloudInfo.available ? ` (Cloud sync: ${cloudInfo.status})` : '';
    console.log(`Waypoint validation for ${field}: ${validationResult.valid ? 'Valid' : validationResult.error}${cloudText} + new dropdown fields + decimal normalization + memory protection`);
}

function updateWaypointWithValidation(sessionIndex, wpIndex, field, value, inputElement) {
    updateWaypointWithValidationAndCloudSync(sessionIndex, wpIndex, field, value, inputElement);
}

function updateWaypointWithCloudSync(sessionIndex, wpIndex, field, value) {
    const session = sessions[sessionIndex];
    const waypoint = session.waypoints[wpIndex];
    
    const globalWpIndex = waypoints.findIndex(wp => 
        wp.lat === waypoint.lat && wp.lon === waypoint.lon && wp.time === waypoint.time
    );
    
    if (globalWpIndex !== -1) {
        const parsed = parseWaypointName(waypoint.name);
        
        if (field === 'soort') parsed.soort = value;
        if (field === 'lengte') {
            // FIX 1: Apply decimal normalization for length
            parsed.lengte = normalizeDecimal(value);
        }
        if (field === 'aantal') parsed.aantal = parseInt(value) || 1;
        
        let newName = '';
        if (parsed.aantal > 1) {
            newName = `${parsed.aantal}x ${parsed.soort} ${parsed.lengte}`;
        } else {
            newName = `${parsed.soort} ${parsed.lengte}`;
        }
        
        waypoints[globalWpIndex].name = newName;
        waypoints[globalWpIndex].catchData = session.waypoints[wpIndex].catchData || {};
        session.waypoints[wpIndex].name = newName;
        
        drawWaypoints();
        updateSpeciesFilter();
        
        // STEP 3: Safe validation and cloud sync updates
        if (!ValidationStateManager.isValidating) {
            setTimeout(() => {
                if (typeof updateValidationInRealTime === 'function') {
                    updateValidationInRealTime();
                }
            }, 150);
        }

        if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
            setTimeout(() => {
                if (typeof updateCloudSyncStatus === 'function') {
                    updateCloudSyncStatus();
                }
            }, 250);
        }
        
        const cloudInfo = getCloudSyncInfo();
        const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
            ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
        showStatus(`Vangst bijgewerkt: ${newName}${cloudText} + memory protection`, 'success');
    }
}

function updateWaypoint(sessionIndex, wpIndex, field, value) {
    updateWaypointWithCloudSync(sessionIndex, wpIndex, field, value);
}

function editWaypointWithCloudSync(index) {
    const waypoint = waypoints[index];
    const parsed = parseWaypointName(waypoint.name);
    const cloudInfo = getCloudSyncInfo();
    
    const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
        `\n\nCloud sync: Wijzigingen worden gedeeld met ${cloudInfo.teamMember} team.` : '';
    
    const newSoort = prompt(`Soort vis:${cloudContext}`, parsed.soort || '');
    if (newSoort === null) return;
    
    if (newSoort) {
        const speciesValidation = validateSpeciesName(newSoort);
        if (!speciesValidation.valid) {
            alert(`Soort naam fout (Phase ${speciesValidation.phase}): ${speciesValidation.error}`);
            return;
        }
    }
    
    const newLengte = prompt(`Lengte (cm) - gebruik komma of punt voor decimalen:${cloudContext}`, parsed.lengte || '');
    if (newLengte === null) return;
    
    if (newLengte) {
        // FIX 1: Apply decimal normalization before validation
        const normalizedLength = normalizeDecimal(newLengte);
        const lengthValidation = validateLength(normalizedLength);
        if (!lengthValidation.valid) {
            alert(`Lengte fout (Phase ${lengthValidation.phase}): ${lengthValidation.error}`);
            return;
        }
    }
    
    const newAantal = prompt(`Aantal:${cloudContext}`, parsed.aantal || '1');
    if (newAantal === null) return;
    
    const countValidation = validateNumber(newAantal, 1, 50, 0);
    if (!countValidation.valid) {
        alert(`Aantal fout (Phase ${countValidation.phase}): ${countValidation.error}`);
        return;
    }
    
    const aantal = parseInt(newAantal) || 1;
    // FIX 1: Use normalized length value
    const lengteNormalized = newLengte ? normalizeDecimal(newLengte) : '';
    
    let newName = '';
    if (aantal > 1) {
        newName = `${aantal}x ${newSoort} ${lengteNormalized}`;
    } else {
        newName = `${newSoort} ${lengteNormalized}`;
    }
    
    waypoints[index].name = newName;
    
    drawWaypoints();
    updateSessionData();
    updateSessionsList();
    updateSpeciesFilter();
    updateDataTable();
    
    // STEP 3: Safe validation and cloud sync updates
    if (!ValidationStateManager.isValidating) {
        setTimeout(() => {
            if (typeof updateValidationInRealTime === 'function') {
                updateValidationInRealTime();
            }
        }, 100);
    }

    if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
        setTimeout(() => {
            if (typeof updateCloudSyncStatus === 'function') {
                updateCloudSyncStatus();
            }
        }, 200);
    }
    
    map.closePopup();
    
    const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
        ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
    showStatus(`Vangst bijgewerkt: ${newName} (Validated + Decimal Normalized)${cloudText} + memory protection`, 'success');
}

function editWaypoint(index) {
    editWaypointWithCloudSync(index);
}

function deleteWaypointWithCloudSync(index) {
    const waypoint = waypoints[index];
    const parsed = parseWaypointName(waypoint.name);
    const cloudInfo = getCloudSyncInfo();
    
    const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
        `\n\nLet op: Cloud sync is actief - wijziging wordt gedeeld met ${cloudInfo.teamMember} team.` : '';
    
    if (confirm(`Weet je zeker dat je deze vangst wilt verwijderen?${cloudContext}\n\n${parsed.soort || waypoint.name} - ${parsed.lengte || '?'} cm`)) {
        waypoints.splice(index, 1);
        
        gpxData.forEach(gpx => {
            gpx.waypoints = gpx.waypoints.filter(wp => 
                !(wp.lat === waypoint.lat && wp.lon === waypoint.lon && wp.time === waypoint.time)
            );
        });
        
        map.closePopup();
        
        drawWaypoints();
        updateSessionData();
        updateSessionsList();
        updateSpeciesFilter();
        updateStats();
        updateDataTable();
        
        // STEP 3: Safe validation and cloud sync updates
        if (!ValidationStateManager.isValidating) {
            setTimeout(() => {
                if (typeof updateValidationInRealTime === 'function') {
                    updateValidationInRealTime();
                }
            }, 100);
        }

        if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
            setTimeout(() => {
                if (typeof updateCloudSyncStatus === 'function') {
                    updateCloudSyncStatus();
                }
            }, 200);
        }
        
        const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
            ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
        showStatus(`Vangst verwijderd: ${parsed.soort || waypoint.name}${cloudText} + memory protection`, 'success');
    }
}

function deleteWaypoint(index) {
    deleteWaypointWithCloudSync(index);
}

// ================================
// STEP 3: ENHANCED TABLE CELL UPDATE FUNCTIONS WITH SAFE VALIDATION TRIGGERS + NEW DROPDOWN FIELDS + FIX 1 + STEP 6 TIME VALIDATION
// ================================

function updateTableCellWithValidationAndCloudSync(sessionIndex, wpIndex, field, value, inputElement) {
    let validationResult = { valid: true, error: '' };
    
    // STEP 6: Enhanced validation for catch time fields
    if (field === 'tijd' || field === 'time') {
        // Get session for validation
        const session = sessions[sessionIndex];
        if (session && value) {
            try {
                const catchTime = new Date(`${session.startTime.toDateString()} ${value}`);
                const timeValidation = validateCatchTimeWithinSession(
                    catchTime, 
                    session.startTime, 
                    session.endTime
                );
                
                if (!timeValidation.valid) {
                    validationResult = timeValidation;
                    
                    // Track blocked attempt
                    window.blockedCatchAttempts = (window.blockedCatchAttempts || 0) + 1;
                    
                    // Update cloud sync status
                    if (typeof supabaseManager !== 'undefined') {
                        supabaseManager.updateUIStatus();
                    }
                }
            } catch (error) {
                validationResult = {
                    valid: false,
                    error: 'Ongeldige tijd formaat',
                    phase: 'A'
                };
            }
        }
    }
    
    switch(field) {
        case 'lengte':
            // FIX 1: Apply decimal normalization before validation
            const normalizedLength = normalizeDecimal(value);
            validationResult = validateLength(normalizedLength);
            break;
        case 'gewicht':
            // FIX 1: Apply decimal normalization before validation
            const normalizedWeight = normalizeDecimal(value);
            validationResult = validateWeight(normalizedWeight);
            break;
        case 'diepte':
            // FIX 1: Apply decimal normalization before validation
            const normalizedDepth = normalizeDecimal(value);
            validationResult = validateDepth(normalizedDepth);
            break;
        case 'aantal':
            validationResult = validateNumber(value, 1, 50, 0);
            if (!validationResult.valid) {
                validationResult.error = 'Aantal moet tussen 1 en 50 zijn';
            }
            break;
        case 'soort':
            validationResult = validateSpeciesName(value);
            break;
    }
    
    applyValidationFeedback(inputElement, validationResult);
    
    if (validationResult.valid || (!value && field !== 'aantal' && field !== 'soort')) {
        updateTableCellWithCloudSync(sessionIndex, wpIndex, field, value);
    }
    
    const cloudInfo = getCloudSyncInfo();
    const cloudText = cloudInfo.available ? ` (Cloud sync: ${cloudInfo.status})` : '';
    console.log(`Table validation for ${field}: ${validationResult.valid ? 'Valid' : validationResult.error}${cloudText} + new dropdown fields + decimal normalization + step 6 time validation + memory protection`);
}

function updateTableCellWithValidation(sessionIndex, wpIndex, field, value, inputElement) {
    updateTableCellWithValidationAndCloudSync(sessionIndex, wpIndex, field, value, inputElement);
}

// STEP 3: SAFE VALIDATION TRIGGERS - Updated updateTableCellWithCloudSync function
function updateTableCellWithCloudSync(sessionIndex, wpIndex, field, value) {
    const session = sessions[sessionIndex];
    const waypoint = session.waypoints[wpIndex];
    
    if (!waypoint.catchData) {
        waypoint.catchData = {};
    }
    
    if (field === 'soort' || field === 'lengte' || field === 'aantal') {
        const parsed = parseWaypointName(waypoint.name);
        
        if (field === 'soort') parsed.soort = value;
        if (field === 'lengte') {
            // FIX 1: Apply decimal normalization for length
            parsed.lengte = normalizeDecimal(value);
        }
        if (field === 'aantal') parsed.aantal = parseInt(value) || 1;
        
        let newName = '';
        if (parsed.aantal > 1) {
            newName = `${parsed.aantal}x ${parsed.soort} ${parsed.lengte}`;
        } else {
            newName = `${parsed.soort} ${parsed.lengte}`;
        }
        
        const globalWpIndex = waypoints.findIndex(wp => 
            wp.lat === waypoint.lat && wp.lon === waypoint.lon && wp.time === waypoint.time
        );
        
        if (globalWpIndex !== -1) {
            waypoints[globalWpIndex].name = newName;
            waypoints[globalWpIndex].catchData = waypoint.catchData;
        }
        
        waypoint.name = newName;
        
        drawWaypoints();
        updateSpeciesFilter();
        updateStats();
    } else if (field === 'aas') {
        waypoint.catchData[field] = value;
        
        const lure = LureManager.lures.find(l => l.name === value);
        if (lure) {
            waypoint.catchData.lureEmoji = lure.emoji || '🎣';
        }
        
        const globalWpIndex = waypoints.findIndex(wp => 
            wp.lat === waypoint.lat && wp.lon === waypoint.lon && wp.time === waypoint.time
        );
        
        if (globalWpIndex !== -1) {
            waypoints[globalWpIndex].catchData = waypoint.catchData;
        }
    } else {
        // Handle all dropdown fields including new ones: zonschaduw, bodemhardheid
        // FIX 1: Apply decimal normalization for numeric fields
        if (field === 'diepte' || field === 'gewicht') {
            waypoint.catchData[field] = normalizeDecimal(value);
        } else {
            waypoint.catchData[field] = value;
        }
        
        const globalWpIndex = waypoints.findIndex(wp => 
            wp.lat === waypoint.lat && wp.lon === waypoint.lon && wp.time === waypoint.time
        );
        
        if (globalWpIndex !== -1) {
            waypoints[globalWpIndex].catchData = waypoint.catchData;
        }
    }
    
    // STEP 3: SAFE validation and cloud sync updates
    if (!ValidationStateManager.queueUIUpdate('validation', {source: 'tableCell'})) {
        // If queued, schedule retry after current validation
        setTimeout(() => {
            if (typeof updateValidationInRealTime === 'function') {
                updateValidationInRealTime();
            }
        }, 200);
    } else {
        // Immediate execution allowed
        setTimeout(() => {
            if (typeof updateValidationInRealTime === 'function') {
                updateValidationInRealTime();
            }
        }, 50);
    }
    
    // Safe cloud sync status update
    if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
        setTimeout(() => {
            if (typeof updateCloudSyncStatus === 'function') {
                updateCloudSyncStatus();
            }
        }, 300);
    } else {
        setTimeout(() => {
            if (typeof updateCloudSyncStatus === 'function') {
                updateCloudSyncStatus();
            }
        }, 100);
    }
    
    const cloudInfo = getCloudSyncInfo();
    const cloudText = cloudInfo.available ? ` (Cloud sync: ${cloudInfo.status})` : '';
    console.log(`Updated ${field} for session ${sessionIndex}, waypoint ${wpIndex}: ${value}${cloudText} + memory protection + protected validation`);
}

function updateTableCell(sessionIndex, wpIndex, field, value) {
    updateTableCellWithCloudSync(sessionIndex, wpIndex, field, value);
}

// ================================
// ENHANCED DROPDOWN AND LURE FUNCTIONS WITH CLOUD SYNC INTEGRATION
// ================================

function handleDropdownChangeWithCloudSync(selectElement, category, callback) {
    const value = selectElement.value;
    
    if (value === '__ADD_NEW__') {
        const cloudInfo = getCloudSyncInfo();
        const cloudText = cloudInfo.available && cloudInfo.teamMember ? 
            ` (Team: ${cloudInfo.teamMember})` : '';
        
        const cloudContext = cloudInfo.available && cloudInfo.teamMember ? 
            `\n\nCloud sync: Nieuw item wordt gedeeld met ${cloudInfo.teamMember} team.` : '';
        
        // Enhanced prompt for new dropdown fields
        const isNewField = (category === 'zonschaduw' || category === 'bodemhardheid') ? ' (NIEUW VELD)' : '';
        const newValue = prompt(`Nieuw item toevoegen aan ${category}${isNewField}${cloudText}:${cloudContext}\n\nVoer de nieuwe waarde in:`);
        
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
                
                const cloudSyncText = cloudInfo.available && cloudInfo.teamMember ? 
                    ` (Cloud sync ready voor ${cloudInfo.teamMember})` : '';
                const newFieldText = isNewField ? ' (NIEUW VELD)' : '';
                showStatus(`"${trimmedValue}" toegevoegd aan ${category}${newFieldText}${cloudSyncText}`, 'success');
                
                // STEP 3: Safe updates with cloud sync + new fields + decimal normalization
                if (typeof updateDataTable === 'function') updateDataTable();
                if (typeof updateSessionsList === 'function') updateSessionsList();
                
                if (!ValidationStateManager.isValidating) {
                    setTimeout(() => {
                        if (typeof updateValidationInRealTime === 'function') {
                            updateValidationInRealTime();
                        }
                    }, 100);
                }
                
                if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
                    setTimeout(() => {
                        if (typeof updateCloudSyncStatus === 'function') {
                            updateCloudSyncStatus();
                        }
                    }, 200);
                }
                
            } else {
                showStatus(`"${trimmedValue}" bestaat al in ${category}`, 'error');
                selectElement.value = '';
            }
        } else {
            selectElement.value = '';
        }
    } else if (callback) {
        callback(value);
        
        // STEP 3: Safe updates with cloud sync
        if (!ValidationStateManager.isValidating) {
            setTimeout(() => {
                if (typeof updateValidationInRealTime === 'function') {
                    updateValidationInRealTime();
                }
            }, 100);
        }
        
        if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
            setTimeout(() => {
                if (typeof updateCloudSyncStatus === 'function') {
                    updateCloudSyncStatus();
                }
            }, 200);
        }
    }
}

function openLureModalWithCloudSync(inputElement, sessionIndex, wpIndex) {
    const cloudInfo = getCloudSyncInfo();
    
    if (cloudInfo.available) {
        console.log(`Lure modal opened for session ${sessionIndex}, waypoint ${wpIndex} (Cloud sync: ${cloudInfo.status}) + new dropdown fields + decimal normalization + step 6 time validation + memory protection`);
    }
    
    openLureModal(inputElement);
}

// ================================
// ENHANCED TABLE VISIBILITY FUNCTIONS (PRESERVED) + Updated for New Columns
// ================================

function toggleSessionColumns() {
    const hideToggle = document.getElementById('hideSessionColumns');
    const table = document.getElementById('dataInputTable');
    
    const sessionColumnIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    const headerRows = table.querySelectorAll('thead tr');
    headerRows.forEach(row => {
        const cells = row.querySelectorAll('th');
        sessionColumnIndices.forEach(index => {
            if (cells[index]) {
                cells[index].style.display = hideToggle.checked ? 'none' : '';
            }
        });
    });
    
    const groupHeader = table.querySelector('thead tr.group-header th:first-child');
    if (groupHeader) {
        if (hideToggle.checked) {
            groupHeader.style.display = 'none';
        } else {
            groupHeader.style.display = '';
            groupHeader.setAttribute('colspan', '10');
        }
    }
    
    const dataRows = table.querySelectorAll('tbody tr');
    dataRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        sessionColumnIndices.forEach(index => {
            if (cells[index] && !cells[index].classList.contains('empty-message')) {
                cells[index].style.display = hideToggle.checked ? 'none' : '';
            }
        });
    });
    
    if (hideToggle.checked) {
        showStatus('Sessie kolommen verborgen - focus op vangstgegevens + nieuwe dropdown velden + decimal normalization + step 6 time validation + memory protection', 'info');
    }
}

function toggleFilledColumns() {
    const hideToggle = document.getElementById('hideFilledColumns');
    const table = document.getElementById('dataInputTable');
    
    if (hideToggle.checked) {
        const hasAnyCatches = sessions.some(s => s.waypoints.length > 0);
        
        if (!hasAnyCatches) {
            showStatus('Geen vangsten om te filteren', 'info');
            hideToggle.checked = false;
            return;
        }
        
        const filledColumns = [];
        
        // Check catch columns (indices 14-22, updated for removed time column)
        for (let colIndex = 14; colIndex <= 22; colIndex++) {
            let hasData = false;
            const dataRows = table.querySelectorAll('tbody tr:not(.empty-session)');
            
            dataRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[colIndex]) {
                    const input = cells[colIndex].querySelector('input, select');
                    if (input && input.value && input.value !== '' && input.value !== '-') {
                        hasData = true;
                    }
                }
            });
            
            if (hasData) {
                filledColumns.push(colIndex);
            }
        }
        
        // Hide filled columns
        const headerRows = table.querySelectorAll('thead tr');
        headerRows.forEach(row => {
            const cells = row.querySelectorAll('th');
            filledColumns.forEach(index => {
                if (cells[index]) {
                    cells[index].style.display = 'none';
                }
            });
        });
        
        const dataRows = table.querySelectorAll('tbody tr');
        dataRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            filledColumns.forEach(index => {
                if (cells[index] && !cells[index].classList.contains('empty-message')) {
                    cells[index].style.display = 'none';
                }
            });
        });
        
        // Update catch header colspan
        const catchHeader = table.querySelector('thead tr.group-header th:last-child');
        if (catchHeader) {
            const visibleCatchColumns = 13 - filledColumns.length; // Updated from 15 to 13 (removed time column)
            catchHeader.setAttribute('colspan', visibleCatchColumns);
        }
        
        const hiddenCount = filledColumns.length;
        if (hiddenCount > 0) {
            const emptyCount = 9 - hiddenCount; // Updated for removed time column
            if (emptyCount > 0) {
                showStatus(`${hiddenCount} ingevulde kolommen verborgen - Focus op ${emptyCount} lege velden (incl. nieuwe dropdown velden + decimal normalization + memory protection)`, 'info');
            } else {
                showStatus(`Alle optionele velden zijn ingevuld! (inclusief nieuwe dropdown velden + decimal normalization + memory protection)`, 'success');
            }
        } else {
            showStatus(`Geen optionele velden ingevuld - alle kolommen zichtbaar (inclusief nieuwe dropdown velden + decimal normalization + memory protection)`, 'info');
        }
        
    } else {
        // Show all columns
        const headerRows = table.querySelectorAll('thead tr');
        headerRows.forEach(row => {
            const cells = row.querySelectorAll('th');
            cells.forEach(cell => {
                if (cell.style.display === 'none' && !document.getElementById('hideSessionColumns').checked) {
                    const cellIndex = Array.from(cell.parentNode.children).indexOf(cell);
                    if (cellIndex >= 10 || !document.getElementById('hideSessionColumns').checked) {
                        cell.style.display = '';
                    }
                }
            });
        });
        
        const dataRows = table.querySelectorAll('tbody tr');
        dataRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                if (!cell.classList.contains('empty-message')) {
                    const cellIndex = Array.from(cell.parentNode.children).indexOf(cell);
                    if (cellIndex >= 10 || !document.getElementById('hideSessionColumns').checked) {
                        cell.style.display = '';
                    }
                }
            });
        });
        
        // Reset catch header colspan
        const catchHeader = table.querySelector('thead tr.group-header th:last-child');
        if (catchHeader) {
            catchHeader.setAttribute('colspan', '13'); // Updated from '15' to '13'
        }
    }
}

// ================================
// ENHANCED DATE PARSING HELPER FUNCTION
// ================================

/**
 * Parse en valideer datum input in verschillende formaten
 */
function parseAndValidateDate(dateInput) {
    // Probeer verschillende datum formaten
    const formats = [
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY  
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/ // DD.MM.YYYY
    ];
    
    let day, month, year;
    let matched = false;
    
    // Probeer DD-MM-YYYY, DD/MM/YYYY en DD.MM.YYYY
    for (let i = 0; i < formats.length; i++) {
        if (formats[i].test(dateInput)) {
            const parts = dateInput.split(/[-\/\.]/);
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
            year = parseInt(parts[2]);
            matched = true;
            break;
        }
    }
    
    if (!matched) {
        return {
            valid: false,
            error: 'Ongeldig datum formaat. Gebruik DD-MM-YYYY, DD/MM/YYYY of DD.MM.YYYY'
        };
    }
    
    // Valideer datum waarden
    if (year < 2020 || year > 2030) {
        return {
            valid: false,
            error: 'Jaar moet tussen 2020 en 2030 zijn'
        };
    }
    
    if (month < 1 || month > 12) {
        return {
            valid: false,
            error: 'Maand moet tussen 1 en 12 zijn'
        };
    }
    
    if (day < 1 || day > 31) {
        return {
            valid: false,
            error: 'Dag moet tussen 1 en 31 zijn'
        };
    }
    
    // Maak datum object (let op: month is 0-based in JavaScript)
    const date = new Date(year, month - 1, day);
    
    // Check of datum geldig is (JavaScript corrigeert automatisch ongeldige datums)
    if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) {
        return {
            valid: false,
            error: 'Ongeldige datum (bijv. 31 februari bestaat niet)'
        };
    }
    
    // Check of datum niet te ver in het verleden of toekomst ligt
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    
    if (date < oneYearAgo) {
        return {
            valid: false,
            error: 'Datum mag niet meer dan een jaar geleden zijn'
        };
    }
    
    if (date > oneYearFromNow) {
        return {
            valid: false,
            error: 'Datum mag niet meer dan een jaar in de toekomst zijn'
        };
    }
    
    return {
        valid: true,
        date: date,
        formatted: date.toLocaleDateString('nl-NL')
    };
}

// ================================
// STEP 6: RESET FUNCTION ENHANCEMENT - COMPLETE IMPLEMENTATION
// ================================

/**
 * STEP 6: Reset blocked attempts counter and update UI status
 * This function is called when session times are changed to reset validation state
 */
function resetBlockedAttempts() {
    window.blockedCatchAttempts = 0;
    console.log('STEP 6: Blocked catch attempts counter reset');
    
    // Update UI immediately to reflect the reset state
    if (typeof supabaseManager !== 'undefined' && supabaseManager.updateUIStatus) {
        supabaseManager.updateUIStatus();
        console.log('STEP 6: UI status updated after blocked attempts reset');
    }
    
    // STEP 3: Safe cloud sync status update
    if (!ValidationStateManager.queueUIUpdate('cloudSyncStatus')) {
        setTimeout(() => {
            if (typeof updateCloudSyncStatus === 'function') {
                updateCloudSyncStatus();
            }
        }, 200);
    }
    
    // STEP 3: Safe validation update to ensure all systems are in sync
    if (!ValidationStateManager.isValidating) {
        setTimeout(() => {
            if (typeof updateValidationInRealTime === 'function') {
                updateValidationInRealTime();
            }
        }, 100);
    }
    
    console.log('STEP 6: Cloud sync and validation status updated after blocked attempts reset + memory protection');
}

// ================================
// ENHANCED HELPER FUNCTIONS FOR CLOUD SYNC INTEGRATION - COMPLETION
// ================================

function getCloudSyncInfo() {
    // Get cloud sync information for enhanced UI feedback
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

// Enhanced console logging for debugging
console.log('Enhanced UI Sessions loaded with Cloud Sync Integration + New Dropdown Fields + Decimal Normalization + Manual Session Support + Enhanced Date Input + Step 6 Reset Function Enhancement + DROPDOWN ALIGNMENT FIX + STEP 3 SAFE VALIDATION TRIGGERS + PHASE 1B UNIFIED FUNCTIONS!');
console.log('- PHASE 1B: Added unified updateSessionField function to replace 4 duplicate functions');
console.log('- PHASE 1B: Added compatibility wrapper functions to maintain backward compatibility');
console.log('- Cloud sync awareness in all session and waypoint operations');
console.log('- Enhanced status messages with team member context');
console.log('- Real-time cloud sync status updates triggered by all operations');
console.log('- Enhanced user prompts and confirmations with cloud context');
console.log('- NEW: Zon/Schaduw and Bodemhardheid dropdown fields added to catch data');
console.log('- FIX 1: Nederlandse komma input (3,5) automatisch geconverteerd naar punten (3.5)');
console.log('- NEW: Support for manual sessions without track points dependency');
console.log('- ENHANCED: Multi-format date input with comprehensive validation');
console.log('- Updated table handling for 13 catch columns (was 15, removed redundant time column)');
console.log('- STEP 6: Enhanced resetBlockedAttempts() function with comprehensive UI updates');
console.log('- STEP 6: Time field validation blocks invalid catch times before cleanup');
console.log('- STEP 6: Blocked attempts counter tracking and UI status integration');
console.log('- STEP 6: resetBlockedAttempts() called after session time changes');
console.log('- STEP 6: Enhanced editSessionTimeWithCloudSync() includes reset functionality');
console.log('- ALIGNMENT FIX: Removed redundant time input column to fix dropdown alignment');
console.log('- STEP 3: Safe validation triggers using ValidationStateManager to prevent infinite loops');
console.log('- STEP 3: ValidationStateManager.queueUIUpdate() protects against recursive validation');
console.log('- STEP 3: Memory protection through controlled UI update queuing');
console.log('- STEP 3: All validation calls protected with ValidationStateManager.isValidating checks');
console.log('- STEP 3: Enhanced updateTableCellWithCloudSync() with safe validation triggers');
console.log('- STEP 3: Enhanced session and waypoint management with ValidationStateManager integration');

/*
================================================================================
ENHANCED FILE COMPLETE: ui-sessions.js - V6.3 Cloud Sync Integration + New Dropdown Fields + Decimal Normalization + Manual Sessions + Enhanced Date Input + Step 6 Reset Function Enhancement + DROPDOWN ALIGNMENT FIX + STEP 3 SAFE VALIDATION TRIGGERS + PHASE 1B UNIFIED FUNCTIONS

PHASE 1B UNIFIED FUNCTIONS IMPLEMENTED:
✅ NEW: Unified updateSessionField() function replaces 4 duplicate functions
✅ NEW: Options-based approach with validate, cloudSync, inputElement, callbacks
✅ NEW: Compatibility wrapper functions maintain backward compatibility
✅ PRESERVED: All existing functionality and behavior patterns
✅ ENHANCED: Consolidated logic reduces code duplication
✅ MAINTAINED: Same logging patterns and cloud sync integration
✅ IMPROVED: Error handling with callbacks and return values
✅ DOCUMENTED: Comprehensive JSDoc documentation for new unified function

UNIFIED FUNCTION FEATURES:
✅ Single function handles all 4 previous variants
✅ Options object for validate, cloudSync, inputElement, callbacks
✅ Special handling for location field (new location creation)
✅ Decimal normalization for temperature fields
✅ Validation integration when requested
✅ UI updates always happen (updateSessionsList, updateDataTable)
✅ Cloud sync updates when requested
✅ Safe ValidationStateManager integration
✅ Enhanced error handling with try/catch
✅ Success/error callbacks for caller feedback
✅ Consistent logging with cloud sync context

COMPATIBILITY WRAPPERS:
✅ updateSessionFieldWithCloudSync() -> calls with { cloudSync: true }
✅ updateSessionFieldWithValidation() -> calls with { validate: true, inputElement }
✅ updateSessionFieldWithValidationAndCloudSync() -> calls with both options
✅ Maintains exact same API for existing code
✅ No breaking changes for other files
✅ Smooth transition path for refactoring

TECHNICAL IMPLEMENTATION:
✅ Unified function placed after UI component functions
✅ Compatibility wrappers placed after unified function
✅ All existing function calls continue to work
✅ Same validation and cloud sync behavior preserved
✅ Enhanced error handling and logging
✅ Memory protection through ValidationStateManager integration

NEXT STEPS FOR PHASE 1B:
🔄 Test the unified function with the test code provided
🔄 Verify all existing functionality still works
🔄 If successful, continue with waypoint and table cell function consolidation
🔄 Then proceed to remove old duplicate function bodies (keeping wrappers)

Contact: Development Team
Documentation: Internal Wiki - Phase 1B Unified Functions Implementation
================================================================================
*/
