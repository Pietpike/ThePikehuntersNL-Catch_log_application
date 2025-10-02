/*
================================================================================
GEOPTIMALISEERD: validation-core.js - Schone Versie Zonder Redundante Code
================================================================================
COMPREHENSIVE VALIDATION SYSTEM - ALLE FASEN BEHOUDEN, DEBUG CODE VERWIJDERD
- Phase A: Time validation (robust session boundaries)  
- Phase B: Number validation met decimal normalization
- Phase C: GPS coordinates, location names, species validation
- Phase V: Data completeness validation met export blocking
- Phase Cloud: Cloud sync validation integration
- OPGERUIMD: Test functies, debug code, en redundante implementaties verwijderd
================================================================================
*/

console.log('ThePikehunters Catchlog - Validation System Loading...');

// ================================
// VALIDATION STATE MANAGER - ANTI-RECURSION PROTECTION
// ================================

const ValidationStateManager = {
    isValidating: false,
    pendingUpdates: new Set(),
    
    canValidate() {
        return !this.isValidating;
    },
    
    startValidation() {
        this.isValidating = true;
        this.pendingUpdates.clear();
    },
    
    endValidation() {
        this.isValidating = false;
        if (this.pendingUpdates.size > 0) {
            setTimeout(() => this.processPendingUpdates(), 10);
        }
    },
    
    queueUIUpdate(updateType) {
        if (this.isValidating) {
            // Memory protection
            if (this.pendingUpdates.size >= 20) {
                this.pendingUpdates.clear();
            }
            this.pendingUpdates.add(updateType);
            return false;
        }
        return true;
    },
    
    processPendingUpdates() {
        const updates = [...this.pendingUpdates];
        this.pendingUpdates.clear();
        
        updates.forEach(update => {
            if (update === 'cloudSyncStatus' && typeof updateCloudSyncStatus === 'function') {
                updateCloudSyncStatus();
            }
        });
    },
    
    emergencyReset() {
        this.isValidating = false;
        this.pendingUpdates.clear();
    }
};

window.ValidationStateManager = ValidationStateManager;

// ================================
// GLOBAL STATE
// ================================

window.validationState = {
    enabled: true,
    lastReport: null,
    phases: ['A', 'B', 'C', 'V', 'Cloud'],
    exportBlocked: false,
    cloudSyncBlocked: false,
    lastValidationTime: 0,
    validationCooldown: 2000
};

// ================================
// UTILITY FUNCTIONS
// ================================

function normalizeDecimal(value) {
    if (!value && value !== 0) return value;
    return value.toString().replace(',', '.');
}

function parseNormalizedNumber(value) {
    if (!value && value !== 0) return null;
    const normalized = normalizeDecimal(value);
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
}

function getCloudSyncInfo() {
    if (typeof supabaseManager === 'undefined') {
        return { available: false, status: 'Offline', teamMember: null };
    }
    
    return {
        available: true,
        status: supabaseManager.isInitialized ? 
            (supabaseManager.teamMember ? 'Ready' : 'Setup Required') : 
            'Initializing',
        teamMember: supabaseManager.teamMember,
        initialized: supabaseManager.isInitialized
    };
}

// ================================
// PHASE A - TIME VALIDATION
// ================================

function validateTime(timeString) {
    if (!timeString || typeof timeString !== 'string') {
        return { valid: false, error: 'Tijd is verplicht', phase: 'A' };
    }
    
    const trimmedTime = timeString.trim();
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(trimmedTime)) {
        return { valid: false, error: 'Ongeldige tijd formaat! Gebruik HH:MM (bijv. 14:30)', phase: 'A' };
    }
    
    return { valid: true, error: '', phase: 'A', parsedTime: trimmedTime };
}

function validateCatchTimeWithinSession(catchTime, sessionStart, sessionEnd) {
    if (!catchTime || !sessionStart || !sessionEnd) {
        return {
            valid: false,
            error: 'Ontbrekende tijd informatie voor validatie',
            phase: 'A',
            severity: 'error'
        };
    }
    
    try {
        let catchDateTime, startDateTime, endDateTime;
        
        if (catchTime instanceof Date) {
            catchDateTime = catchTime;
        } else if (typeof catchTime === 'object') {
            catchDateTime = new Date(catchTime.datetime || catchTime.time || catchTime);
        } else if (typeof catchTime === 'string') {
            catchDateTime = new Date(catchTime);
        } else {
            throw new Error('Onbekend catchTime formaat: ' + typeof catchTime);
        }
        
        startDateTime = sessionStart instanceof Date ? sessionStart : new Date(sessionStart);
        endDateTime = sessionEnd instanceof Date ? sessionEnd : new Date(sessionEnd);
        
        if (isNaN(catchDateTime.getTime()) || isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            return {
                valid: false,
                error: 'Ongeldige datum/tijd formaten',
                phase: 'A',
                severity: 'error'
            };
        }
        
        const isWithinSession = catchDateTime >= startDateTime && catchDateTime <= endDateTime;
        
        if (!isWithinSession) {
            const catchTimeStr = catchDateTime.toLocaleString('nl-NL');
            const sessionStartStr = startDateTime.toLocaleString('nl-NL');
            const sessionEndStr = endDateTime.toLocaleString('nl-NL');
            
            return {
                valid: false,
                error: `Vangst tijd (${catchTimeStr}) valt buiten sessie tijden (${sessionStartStr} - ${sessionEndStr})`,
                phase: 'A',
                severity: 'error',
                timeOutsideSession: true
            };
        }
        
        return { valid: true, error: '', phase: 'A', severity: 'none' };
        
    } catch (error) {
        return {
            valid: false,
            error: `Tijd validatie fout: ${error.message}`,
            phase: 'A',
            severity: 'error'
        };
    }
}

function validateSessionTimes(startTime, endTime) {
    if (!startTime || !endTime) {
        return { valid: false, error: 'Start en eind tijd zijn verplicht', phase: 'A' };
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, error: 'Ongeldige datum/tijd formaten', phase: 'A' };
    }
    
    if (end <= start) {
        return { valid: false, error: 'Eindtijd moet na starttijd zijn', phase: 'A' };
    }
    
    const duration = (end - start) / (1000 * 60);
    if (duration > 24 * 60) {
        return { valid: false, error: 'Sessie duur mag niet meer dan 24 uur zijn', phase: 'A', warning: true };
    }
    
    return { valid: true, error: '', phase: 'A', duration: Math.round(duration) };
}

// ================================
// PHASE B - NUMBER VALIDATION + DECIMAL NORMALIZATION
// ================================

function validateNumber(value, min, max, decimals = 2, fieldName = 'waarde') {
    if (!value && value !== 0) {
        return { valid: true, error: '', phase: 'B' };
    }
    
    const normalizedValue = normalizeDecimal(value);
    const num = parseFloat(normalizedValue);
    
    if (isNaN(num)) {
        return {
            valid: false,
            error: `Voer een geldig nummer in voor ${fieldName} (gebruik komma of punt als decimaalscheider)`,
            phase: 'B'
        };
    }
    
    if (num < min) return { valid: false, error: `${fieldName} moet minimaal ${min} zijn`, phase: 'B' };
    if (num > max) return { valid: false, error: `${fieldName} moet maximaal ${max} zijn`, phase: 'B' };
    
    const decimalPlaces = (normalizedValue.toString().split('.')[1] || '').length;
    if (decimalPlaces > decimals) {
        return {
            valid: false,
            error: `${fieldName} mag maximaal ${decimals} decimalen hebben`,
            phase: 'B'
        };
    }
    
    return {
        valid: true,
        error: '',
        phase: 'B',
        normalizedValue: parseFloat(normalizedValue.toString()),
        originalValue: value.toString()
    };
}

function validateLength(cm) {
    const validation = validateNumber(cm, 0.1, 300, 1, 'Lengte');
    if (!validation.valid) {
        return {
            valid: false,
            error: 'Lengte moet tussen 0.1 en 300 cm zijn (gebruik komma of punt voor decimalen)',
            phase: 'B'
        };
    }
    return validation;
}

function validateWeight(grams) {
    const validation = validateNumber(grams, 0.1, 50000, 1, 'Gewicht');
    if (!validation.valid) {
        return {
            valid: false,
            error: 'Gewicht moet tussen 0.1 en 50.000 gram zijn (gebruik komma of punt voor decimalen)',
            phase: 'B'
        };
    }
    return validation;
}

function validateTemperature(celsius) {
    const validation = validateNumber(celsius, -10, 40, 1, 'Temperatuur');
    if (!validation.valid) {
        return {
            valid: false,
            error: 'Temperatuur moet tussen -10 en 40 graden Celsius zijn (gebruik komma of punt voor decimalen)',
            phase: 'B'
        };
    }
    return validation;
}

function validateDepth(meters) {
    const validation = validateNumber(meters, 0, 100, 1, 'Diepte');
    if (!validation.valid) {
        return {
            valid: false,
            error: 'Diepte moet tussen 0 en 100 meter zijn (gebruik komma of punt voor decimalen)',
            phase: 'B'
        };
    }
    return validation;
}

function validateCount(count) {
    const validation = validateNumber(count, 1, 50, 0, 'Aantal');
    if (!validation.valid) {
        return { valid: false, error: 'Aantal moet tussen 1 en 50 zijn', phase: 'B' };
    }
    return validation;
}

// ================================
// PHASE C - GPS, LOCATION & SPECIES VALIDATION
// ================================

function validateGPSCoordinates(lat, lon) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
        return { valid: false, error: 'Ongeldige GPS coordinaten - geen geldige nummers', phase: 'C' };
    }
    
    if (latitude < -90 || latitude > 90) {
        return { valid: false, error: 'Latitude moet tussen -90 en 90 graden zijn', phase: 'C' };
    }
    
    if (longitude < -180 || longitude > 180) {
        return { valid: false, error: 'Longitude moet tussen -180 en 180 graden zijn', phase: 'C' };
    }
    
    const inNetherlands = (latitude >= 50.6 && latitude <= 53.8 && longitude >= 3.0 && longitude <= 7.3);
    const inEurope = (latitude >= 35.0 && latitude <= 72.0 && longitude >= -10.0 && longitude <= 40.0);
    
    if (!inNetherlands) {
        let warningMessage = 'GPS coordinaten lijken buiten Nederland te zijn';
        if (!inEurope) {
            warningMessage = 'GPS coordinaten lijken buiten Europa te zijn - controleer de coordinaten';
        }
        
        return {
            valid: true,
            error: '',
            warning: warningMessage,
            phase: 'C',
            inNetherlands: false,
            inEurope: inEurope
        };
    }
    
    return { valid: true, error: '', warning: null, phase: 'C', inNetherlands: true, inEurope: true };
}

function validateLocationName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Locatie naam is verplicht', phase: 'C' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length < 3) {
        return { valid: false, error: 'Locatie naam moet minimaal 3 tekens lang zijn', phase: 'C' };
    }
    
    if (trimmed.length > 100) {
        return { valid: false, error: 'Locatie naam mag maximaal 100 tekens lang zijn', phase: 'C' };
    }
    
    const validPattern = /^[a-zA-Z0-9\s\-\.\,\(\)\'\"À-ÿ]+$/;
    if (!validPattern.test(trimmed)) {
        return { valid: false, error: 'Locatie naam bevat ongeldige tekens', phase: 'C' };
    }
    
    if (!trimmed.includes('-') && !trimmed.includes(',') && trimmed.length > 10) {
        return {
            valid: true,
            error: '',
            phase: 'C',
            suggestion: 'Overweeg formaat "Water - Plaats" voor consistentie'
        };
    }
    
    return { valid: true, error: '', phase: 'C' };
}

function validateSpeciesName(species) {
    if (!species || typeof species !== 'string') {
        return { valid: false, error: 'Soort naam is verplicht', phase: 'C' };
    }
    
    const trimmed = species.trim();
    
    if (trimmed.length < 2) {
        return { valid: false, error: 'Soort naam moet minimaal 2 tekens lang zijn', phase: 'C' };
    }
    
    if (trimmed.length > 50) {
        return { valid: false, error: 'Soort naam mag maximaal 50 tekens lang zijn', phase: 'C' };
    }
    
    const validPattern = /^[a-zA-Z\s\-À-ÿ]+$/;
    if (!validPattern.test(trimmed)) {
        return { valid: false, error: 'Soort naam mag alleen letters, spaties en koppeltekens bevatten', phase: 'C' };
    }
    
    const commonSpecies = [
        'snoek', 'baars', 'snoekbaars', 'karper', 'brasem', 'voorn', 'roach', 
        'pike', 'perch', 'zander', 'carp', 'bream', 'rudd', 'blankvoorn',
        'kolblei', 'zeelt', 'paling', 'meerval'
    ];
    
    const lowerSpecies = trimmed.toLowerCase();
    const isCommonSpecies = commonSpecies.some(common => 
        lowerSpecies.includes(common) || common.includes(lowerSpecies)
    );
    
    return {
        valid: true,
        error: '',
        phase: 'C',
        isCommonSpecies: isCommonSpecies,
        suggestion: isCommonSpecies ? null : 'Controleer spelling van soort naam'
    };
}

// ================================
// PHASE V - DATA COMPLETENESS VALIDATION
// ================================

function checkCatchCompleteness(waypoint) {
    let parsed = { soort: '', aantal: 0, lengte: '' };
    
    if (typeof parseWaypointName === 'function') {
        parsed = parseWaypointName(waypoint.name);
    } else if (waypoint.name) {
        const nameParts = waypoint.name.split('-').map(part => part.trim());
        if (nameParts.length > 0) {
            parsed.soort = nameParts[0] || '';
        }
    }
    
    const catchData = waypoint.catchData || {};
    
    const requiredFields = {
        soort: parsed.soort || catchData.soort || '',
        aantal: parsed.aantal || catchData.aantal || 0,
        lengte: parsed.lengte || catchData.lengte || '',
        aas: catchData.aas || '',
        diepte: catchData.diepte || '',
        techniek: catchData.techniek || ''
    };
    
    const missing = [];
    const validationErrors = [];
    
    if (!requiredFields.soort || requiredFields.soort.trim() === '') {
        missing.push('Soort');
    } else {
        const speciesValidation = validateSpeciesName(requiredFields.soort);
        if (!speciesValidation.valid) {
            validationErrors.push(`Soort: ${speciesValidation.error}`);
        }
    }
    
    if (!requiredFields.aantal || requiredFields.aantal < 1) {
        missing.push('Aantal');
    } else {
        const countValidation = validateCount(requiredFields.aantal);
        if (!countValidation.valid) {
            validationErrors.push(`Aantal: ${countValidation.error}`);
        }
    }
    
    if (!requiredFields.lengte || requiredFields.lengte === '') {
        missing.push('Lengte');
    } else {
        const lengthValidation = validateLength(requiredFields.lengte);
        if (!lengthValidation.valid) {
            validationErrors.push(`Lengte: ${lengthValidation.error}`);
        }
    }
    
    if (!requiredFields.aas || requiredFields.aas.trim() === '') missing.push('Aas');
    if (!requiredFields.diepte || requiredFields.diepte === '') missing.push('Diepte');
    if (!requiredFields.techniek || requiredFields.techniek.trim() === '') missing.push('Techniek');
    
    return {
        complete: missing.length === 0 && validationErrors.length === 0,
        missing: missing,
        validationErrors: validationErrors,
        completedFields: Object.keys(requiredFields).length - missing.length,
        totalFields: Object.keys(requiredFields).length,
        phase: 'V'
    };
}

function checkSessionCompleteness(session) {
    const requiredFields = {
        locatie: session.locatie,
        watersoort: session.watersoort,
        stroomsnelheid: session.stroomsnelheid,
        helderheid: session.helderheid
    };
    
    const missing = [];
    const validationErrors = [];
    
    if (!requiredFields.locatie || requiredFields.locatie.trim() === '') {
        missing.push('Locatie');
    } else {
        const locationValidation = validateLocationName(requiredFields.locatie);
        if (!locationValidation.valid) {
            validationErrors.push(`Locatie: ${locationValidation.error}`);
        }
    }
    
    if (!requiredFields.watersoort || requiredFields.watersoort.trim() === '') missing.push('Watersoort');
    if (!requiredFields.stroomsnelheid || requiredFields.stroomsnelheid.trim() === '') missing.push('Stroming');
    if (!requiredFields.helderheid || requiredFields.helderheid.trim() === '') missing.push('Helderheid');
    
    if (session.watertemperatuur) {
        const tempValidation = validateTemperature(session.watertemperatuur);
        if (!tempValidation.valid) {
            validationErrors.push(`Temperatuur: ${tempValidation.error}`);
        }
    }
    
    return {
        complete: missing.length === 0 && validationErrors.length === 0,
        missing: missing,
        validationErrors: validationErrors,
        completedFields: Object.keys(requiredFields).length - missing.length,
        totalFields: Object.keys(requiredFields).length,
        phase: 'V'
    };
}

// ================================
// COMPREHENSIVE VALIDATION REPORT
// ================================

function generateValidationReport() {
    const report = {
        overall: {
            totalSessions: sessions.length,
            totalCatches: 0,
            completeSessions: 0,
            completeCatches: 0,
            incompleteSessions: 0,
            incompleteCatches: 0,
            validationErrors: 0,
            timeValidationErrors: 0
        },
        sessions: [],
        catches: [],
        timeValidationIssues: [],
        cloudSync: getCloudSyncInfo(),
        summary: {
            sessionCompletionRate: 0,
            catchCompletionRate: 0,
            overallComplete: false,
            canExport: false,
            canCloudSync: false,
            hasValidationErrors: false,
            hasTimeValidationErrors: false
        }
    };
    
    let totalCatches = 0;
    let completeCatches = 0;
    let totalValidationErrors = 0;
    let timeValidationErrors = 0;
    
    sessions.forEach((session, sessionIndex) => {
        const sessionValidation = checkSessionCompleteness(session);
        
        if (sessionValidation.complete) {
            report.overall.completeSessions++;
        } else {
            report.overall.incompleteSessions++;
        }
        
        totalValidationErrors += sessionValidation.validationErrors.length;
        
        const sessionReport = {
            sessionIndex: sessionIndex,
            name: session.name,
            validation: sessionValidation,
            catches: []
        };
        
        if (session.waypoints && session.waypoints.length > 0) {
            session.waypoints.forEach((waypoint, waypointIndex) => {
                const catchValidation = checkCatchCompleteness(waypoint);
                totalCatches++;
                
                let timeValidation = { valid: true, error: '', severity: 'none' };
                
                const waypointTime = waypoint.datetime || waypoint.time;
                if (waypointTime && session.startTime && session.endTime) {
                    timeValidation = validateCatchTimeWithinSession(
                        waypointTime,
                        session.startTime,
                        session.endTime
                    );
                } else {
                    timeValidation = {
                        valid: false,
                        error: 'Ontbrekende tijd informatie voor vangst of sessie',
                        phase: 'A',
                        severity: 'error'
                    };
                }
                
                if (!timeValidation.valid) {
                    timeValidationErrors++;
                    catchValidation.validationErrors.push(timeValidation.error);
                    
                    report.timeValidationIssues.push({
                        sessionIndex: sessionIndex,
                        waypointIndex: waypointIndex,
                        sessionName: session.name,
                        waypointName: waypoint.name,
                        error: timeValidation.error,
                        waypointTime: waypointTime,
                        sessionStart: session.startTime,
                        sessionEnd: session.endTime
                    });
                }
                
                if (catchValidation.complete && timeValidation.valid) {
                    completeCatches++;
                    report.overall.completeCatches++;
                } else {
                    report.overall.incompleteCatches++;
                }
                
                totalValidationErrors += catchValidation.validationErrors.length;
                
                const catchReport = {
                    sessionIndex: sessionIndex,
                    waypointIndex: waypointIndex,
                    name: waypoint.name,
                    validation: catchValidation,
                    timeValidation: timeValidation
                };
                
                sessionReport.catches.push(catchReport);
                report.catches.push(catchReport);
            });
        }
        
        report.sessions.push(sessionReport);
    });
    
    report.overall.totalCatches = totalCatches;
    report.overall.validationErrors = totalValidationErrors;
    report.overall.timeValidationErrors = timeValidationErrors;
    
    if (sessions.length > 0) {
        report.summary.sessionCompletionRate = (report.overall.completeSessions / sessions.length) * 100;
    }
    
    if (totalCatches > 0) {
        report.summary.catchCompletionRate = (completeCatches / totalCatches) * 100;
    }
    
    report.summary.hasValidationErrors = totalValidationErrors > 0;
    report.summary.hasTimeValidationErrors = timeValidationErrors > 0;
    
    report.summary.overallComplete = (
        report.overall.incompleteSessions === 0 && 
        report.overall.incompleteCatches === 0 &&
        !report.summary.hasValidationErrors &&
        !report.summary.hasTimeValidationErrors &&
        sessions.length > 0 &&
        totalCatches > 0
    );
    
    report.summary.canExport = report.summary.overallComplete;
    
    report.summary.canCloudSync = report.summary.canExport && 
        report.cloudSync.available && 
        report.cloudSync.initialized && 
        report.cloudSync.teamMember;
    
    window.validationState.lastReport = report;
    window.validationState.exportBlocked = !report.summary.canExport;
    window.validationState.cloudSyncBlocked = !report.summary.canCloudSync;
    
    return report;
}

// ================================
// OPTIMIZED VALIDATION EXECUTION
// ================================

function runOptimizedValidation() {
    if (!ValidationStateManager.canValidate()) {
        return window.validationState.lastReport || generateEmptyReport();
    }
    
    const now = Date.now();
    if (now - window.validationState.lastValidationTime < window.validationState.validationCooldown) {
        return window.validationState.lastReport || generateEmptyReport();
    }
    
    ValidationStateManager.startValidation();
    
    try {
        window.validationState.lastValidationTime = now;
        const report = generateValidationReport();
        window.validationState.lastReport = report;
        
        ValidationStateManager.queueUIUpdate('exportButton');
        ValidationStateManager.queueUIUpdate('cloudSyncButton');
        
        return report;
        
    } catch (error) {
        console.error('Validation error:', error);
        return generateEmptyReport();
    } finally {
        ValidationStateManager.endValidation();
    }
}

function generateEmptyReport() {
    return {
        overall: { totalSessions: 0, totalCatches: 0, validationErrors: 0, timeValidationErrors: 0 },
        summary: { 
            canExport: false, 
            canCloudSync: false, 
            hasValidationErrors: true, 
            hasTimeValidationErrors: false,
            overallComplete: false
        },
        sessions: [],
        catches: [],
        timeValidationIssues: [],
        cloudSync: getCloudSyncInfo()
    };
}

function updateValidationInRealTime() {
    if (!ValidationStateManager.canValidate()) {
        setTimeout(() => {
            if (ValidationStateManager.canValidate()) {
                queueValidation('realtime-retry');
            }
        }, 100);
        return;
    }
    
    queueValidation('realtime');
}

// ================================
// DEBOUNCED VALIDATION
// ================================

let validationTimeout;
let validationQueue = new Set();

function debouncedValidation(delay = 1000) {
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => {
        if (validationQueue.size > 0) {
            runOptimizedValidation();
            validationQueue.clear();
        }
    }, delay);
}

function queueValidation(source = 'unknown') {
    validationQueue.add(source);
    
    const criticalSources = ['export', 'save', 'sync'];
    if (criticalSources.includes(source)) {
        runOptimizedValidation();
        validationQueue.clear();
    } else {
        debouncedValidation();
    }
}

// ================================
// VISUAL FEEDBACK SYSTEM
// ================================

function applyValidationFeedback(inputElement, validationResult) {
    if (!inputElement) return;
    
    inputElement.classList.remove('validation-error', 'validation-warning', 'validation-success', 'time-validation-error');
    inputElement.style.border = '';
    inputElement.style.backgroundColor = '';
    inputElement.title = '';
    
    if (validationResult.valid) {
        if (inputElement.value) {
            inputElement.classList.add('validation-success');
            inputElement.style.border = '2px solid #4CAF50';
            inputElement.style.backgroundColor = '#f1f8e9';
        }
        
        if (validationResult.suggestion) {
            inputElement.title = `✓ Valid • Tip: ${validationResult.suggestion}`;
        }
    } else {
        const isTimeError = validationResult.timeOutsideSession || validationResult.severity === 'error';
        
        if (isTimeError) {
            inputElement.classList.add('time-validation-error');
            inputElement.style.border = '2px solid #f44336';
            inputElement.style.backgroundColor = '#ffebee';
        } else {
            inputElement.classList.add('validation-error');
            inputElement.style.border = '2px solid #ff9800';
            inputElement.style.backgroundColor = '#fff8e1';
        }
        
        inputElement.title = `⚠ ${validationResult.error} (Phase ${validationResult.phase || 'Unknown'})`;
        
        if (typeof showStatus === 'function') {
            showStatus(`Phase ${validationResult.phase || 'Unknown'}: ${validationResult.error}`, 'error');
        }
    }
    
    if (typeof updateCloudSyncStatus === 'function') {
        setTimeout(updateCloudSyncStatus, 100);
    }
}

// ================================
// EXPORT BLOCKING SYSTEM
// ================================

function exportToExcelWithValidation() {
    const report = runOptimizedValidation();
    
    if (!report.summary.canExport) {
        if (report.summary.hasTimeValidationErrors) {
            if (typeof showStatus === 'function') {
                showStatus(`Export geblokkeerd: ${report.overall.timeValidationErrors} vangst(en) vallen buiten sessie tijden`, 'error');
            }
        }
        
        showValidationModal();
        return false;
    }
    
    if (typeof window.originalExportToExcel === 'function') {
        return window.originalExportToExcel();
    } else if (typeof exportToExcel === 'function') {
        return exportToExcel();
    } else {
        console.error('exportToExcel function not found');
        return false;
    }
}

function interceptExportFunctions() {
    if (typeof window.originalExportToExcel === 'undefined' && typeof exportToExcel === 'function') {
        window.originalExportToExcel = exportToExcel;
    }
    
    window.exportToExcel = function() {
        return exportToExcelWithValidation();
    };
}

// ================================
// VALIDATION MODAL - ESSENTIAL FUNCTIONS ONLY
// ================================

function showValidationModal() {
    const report = runOptimizedValidation();
    
    const existingModal = document.getElementById('validationModal');
    if (existingModal) existingModal.remove();
    
    const hasTimeErrors = report.summary.hasTimeValidationErrors;
    const modalColor = hasTimeErrors ? '#f44336' : (report.summary.overallComplete ? '#4CAF50' : '#FF9800');
    
    const modalHTML = `
        <div id="validationModal" style="
            display: block; position: fixed; z-index: 2000; left: 0; top: 0; 
            width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5);
        ">
            <div style="
                background-color: white; margin: 2% auto; padding: 0; border-radius: 8px;
                width: 90%; max-width: 1000px; max-height: 90vh; overflow: hidden;
            ">
                <div style="background: ${modalColor}; color: white; padding: 15px 20px; display: flex; justify-content: space-between;">
                    <h3 style="margin: 0;">Validatie Rapport ${report.summary.overallComplete ? '✅' : hasTimeErrors ? '⏰🚫' : '⚠️'}</h3>
                    <span style="cursor: pointer; font-size: 28px;" onclick="closeValidationModal()">&times;</span>
                </div>
                <div style="padding: 20px; max-height: calc(90vh - 160px); overflow-y: auto;">
                    ${generateValidationContent(report)}
                </div>
                <div style="padding: 15px 20px; border-top: 1px solid #eee; background: #f9f9f9; display: flex; justify-content: space-between;">
                    <div style="font-size: 0.9em; color: #666;">ThePikehunters Validation System</div>
                    <button onclick="closeValidationModal()" style="padding: 8px 15px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Sluiten</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function generateValidationContent(report) {
    const sessionProgress = report.summary.sessionCompletionRate;
    const catchProgress = report.summary.catchCompletionRate;
    
    let content = `
        <div style="margin-bottom: 25px;">
            <h4>Validatie Overzicht</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: #f0f8ff; padding: 15px; border-radius: 6px;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #2196F3;">${report.overall.totalSessions}</div>
                    <div>Totaal Sessies</div>
                    <div style="font-size: 0.8em;">✓ ${report.overall.completeSessions} compleet • ⚠ ${report.overall.incompleteSessions} incompleet</div>
                </div>
                <div style="background: #f0fff4; padding: 15px; border-radius: 6px;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #4CAF50;">${report.overall.totalCatches}</div>
                    <div>Totaal Vangsten</div>
                    <div style="font-size: 0.8em;">✓ ${report.overall.completeCatches} compleet • ⚠ ${report.overall.incompleteCatches} incompleet</div>
                    ${report.overall.timeValidationErrors > 0 ? `<div style="font-size: 0.8em; color: #f44336;">⏰ ${report.overall.timeValidationErrors} TIJD FOUTEN</div>` : ''}
                </div>
            </div>
        </div>
    `;
    
    if (report.summary.hasTimeValidationErrors) {
        content += `
            <div style="background: #ffebee; color: #c62828; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #f44336;">
                <h4>🚫 KRITIEKE FOUT: Vangsten buiten sessie tijden</h4>
                <div style="margin-bottom: 10px;">
                    <strong>${report.overall.timeValidationErrors} vangst(en) hebben tijdstempels die buiten hun sessie tijden vallen</strong>
                </div>
                <div>Dit blokkeert alle export functionaliteit. Pas sessie tijden aan of verwijder problematische vangsten.</div>
            </div>
        `;
    }
    
    return content;
}

function closeValidationModal() {
    const modal = document.getElementById('validationModal');
    if (modal) modal.remove();
}

// ================================
// INITIALIZATION
// ================================

function initializeValidation() {
    interceptExportFunctions();
    
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[type="time"], input[type="number"], select')) {
            queueValidation('field-change');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeValidation);
} else {
    initializeValidation();
}

// ================================
// GLOBAL EXPORTS
// ================================

window.validateTime = validateTime;
window.validateCatchTimeWithinSession = validateCatchTimeWithinSession;
window.validateSessionTimes = validateSessionTimes;
window.validateNumber = validateNumber;
window.validateLength = validateLength;
window.validateWeight = validateWeight;
window.validateTemperature = validateTemperature;
window.validateDepth = validateDepth;
window.validateCount = validateCount;
window.validateGPSCoordinates = validateGPSCoordinates;
window.validateLocationName = validateLocationName;
window.validateSpeciesName = validateSpeciesName;
window.checkCatchCompleteness = checkCatchCompleteness;
window.checkSessionCompleteness = checkSessionCompleteness;
window.generateValidationReport = generateValidationReport;
window.runOptimizedValidation = runOptimizedValidation;
window.showValidationModal = showValidationModal;
window.closeValidationModal = closeValidationModal;
window.applyValidationFeedback = applyValidationFeedback;
window.updateValidationInRealTime = updateValidationInRealTime;
window.exportToExcelWithValidation = exportToExcelWithValidation;
window.normalizeDecimal = normalizeDecimal;
window.parseNormalizedNumber = parseNormalizedNumber;
window.queueValidation = queueValidation;

console.log('✅ ThePikehunters Validation System - GEOPTIMALISEERD Ready!');
console.log('📊 Alle validatie fasen beschikbaar: A(Time) + B(Numbers) + C(GPS/Location/Species) + V(Completeness) + Cloud');
console.log('🧹 Redundante code verwijderd: test functies, debug logging, duplicate implementaties');