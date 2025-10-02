/*
================================================================================
DEBUG INFORMATION SYSTEM - Uitgelicht uit data-managers.js
================================================================================
*/

/*
================================================================================
REFACTORED: Debug functionality extracted from data-managers.js - Version 6.2-extracted
================================================================================
Debug functions now loaded separately for better maintainability and performance.
All original functionality preserved with enhanced error handling and fallback mechanisms.
================================================================================
*/

(function() {
    'use strict';
    
    console.log('Debug Info System loading...');
    
    // Error handling wrapper
    function safeExecution(fn, functionName) {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                console.error(`Debug function ${functionName} failed:`, error);
                if (typeof showStatus === 'function') {
                    showStatus(`Debug functie ${functionName} gefaald: ${error.message}`, 'error');
                }
                return null;
            }
        };
    }
    
    // Dependency checker
    function checkDependency(name) {
        const exists = typeof window[name] !== 'undefined' && window[name] !== null;
        if (!exists) {
            console.warn(`Debug dependency missing: ${name}`);
        }
        return exists;
    }
    
    // Debug object met alle originele functies
    const debugInfo = {
        version: '6.2-extracted',
        
        // Hoofdfunctie - show()
        show: safeExecution(function() {
            console.log('Debug Info Show - Extracted Version Starting...');
            
            // Check validation function availability
            const hasValidation = typeof generateValidationReport === 'function';
            
            // Probeer eerst normale debug flow - de data is er blijkbaar wel
            try {
                const validationReport = hasValidation ? 
                    generateValidationReport() : this.generateBasicReport();
                
                const cloudSyncInfo = this.collectCloudSyncInfo();
                
                const debugData = {
                    version: '6.2-extracted',
                    timestamp: new Date().toISOString(),
                    
                    // Validation system status
                    validationPhases: {
                        phaseA: 'Time Validation - ACTIVE',
                        phaseB: 'Number Validation - ACTIVE',
                        phaseC: 'GPS & Location Validation - ACTIVE',
                        phaseV: 'Data Completeness Validation - ACTIVE',
                        phaseCloud: 'Cloud Sync Validation - ' + (cloudSyncInfo.available ? 'ACTIVE' : 'INACTIVE')
                    },
                    
                    // Cloud sync status
                    cloudSync: cloudSyncInfo,
                    
                    // Data status - gebruik de debug functies om data te checken
                    dataStatus: {
                        waypointsExist: this.checkWaypointsExist(),
                        gpsDataValid: this.checkGPSDataValid()
                    },
                    
                    // System health
                    systemHealth: {
                        allManagersInitialized: this.checkManagersInitialized(),
                        allFunctionsAvailable: this.checkCriticalFunctions(),
                        cloudSyncIntegration: cloudSyncInfo.available,
                        newDropdownFields: this.checkNewDropdownFields()
                    },
                    
                    // Enhanced function availability
                    functionsAvailable: {
                        // Validation functions
                        validateTime: typeof validateTime === 'function',
                        validateNumber: typeof validateNumber === 'function',
                        validateGPSCoordinates: typeof validateGPSCoordinates === 'function',
                        generateValidationReport: typeof generateValidationReport === 'function',
                        
                        // Smart dropdown functions
                        createSmartDropdown: typeof createSmartDropdown === 'function',
                        handleDropdownChange: typeof handleDropdownChange === 'function',
                        
                        // Cloud sync functions
                        syncToCloud: typeof syncToCloud === 'function',
                        testCloudConnection: typeof testCloudConnection === 'function'
                    },
                    
                    // Data managers status
                    dataManagers: {
                        lureManager: LureManager ? LureManager.getCloudSyncInfo() : { available: false },
                        dropdownManager: DropdownManager ? DropdownManager.getCloudSyncInfo() : { available: false },
                        locationManager: LocationManager ? LocationManager.getCloudSyncInfo() : { available: false },
                        dataManager: { available: typeof DataManager === 'object' }
                    },
                    
                    // Validation report
                    validationReport: this.processValidationReport(validationReport)
                };
                
                // Open debug window
                const debugWindow = window.open('', '_blank', 'width=1400,height=900,scrollbars=yes');
                if (debugWindow) {
                    debugWindow.document.write(this.generateDebugHTML(debugData));
                    console.log('Debug window opened successfully (extracted version)');
                } else {
                    this.showInlineDebug(debugData);
                }
                
                if (typeof showStatus === 'function') {
                    showStatus('Debug informatie geopend - Extracted Version', 'info');
                }
                
            } catch (error) {
                console.error('Debug show error:', error);
                this.showErrorDebug(error);
            }
        }, 'show'),
        
        // Check functions - deze werken blijkbaar wel
        checkWaypointsExist: safeExecution(function() {
            // Probeer verschillende manieren om waypoints te vinden
            // 1. Kijk naar globale sessions variabele
            if (typeof sessions !== 'undefined' && sessions) {
                return sessions.some(session => session.waypoints && session.waypoints.length > 0);
            }
            
            // 2. Kijk naar DOM elementen met waypoint data
            const waypointElements = document.querySelectorAll('[data-waypoint-id], .waypoint-item, .waypoint-row');
            if (waypointElements.length > 0) {
                return true;
            }
            
            // 3. Kijk naar beschikbare waypoint functies die data hebben
            if (typeof getFilteredWaypoints === 'function') {
                try {
                    const waypoints = getFilteredWaypoints();
                    return waypoints && waypoints.length > 0;
                } catch (e) {
                    // Functie bestaat maar geeft error, waarschijnlijk geen data
                }
            }
            
            return false;
        }, 'checkWaypointsExist'),
        
        checkGPSDataValid: safeExecution(function() {
            // Als checkWaypointsExist false is, kunnen we geen GPS data valideren
            if (!this.checkWaypointsExist()) {
                return false;
            }
            
            let validGPSCount = 0;
            let totalWaypoints = 0;
            
            try {
                // Probeer via sessions
                if (typeof sessions !== 'undefined' && sessions) {
                    sessions.forEach(session => {
                        if (session.waypoints) {
                            session.waypoints.forEach(waypoint => {
                                totalWaypoints++;
                                if (waypoint.lat && waypoint.lon && 
                                    typeof waypoint.lat === 'number' && typeof waypoint.lon === 'number' &&
                                    waypoint.lat >= -90 && waypoint.lat <= 90 &&
                                    waypoint.lon >= -180 && waypoint.lon <= 180) {
                                    validGPSCount++;
                                }
                            });
                        }
                    });
                } else {
                    // Probeer via DOM parsing als fallback
                    const latElements = document.querySelectorAll('[data-lat]');
                    const lonElements = document.querySelectorAll('[data-lon]');
                    
                    if (latElements.length > 0 && lonElements.length > 0) {
                        totalWaypoints = Math.min(latElements.length, lonElements.length);
                        
                        for (let i = 0; i < totalWaypoints; i++) {
                            const lat = parseFloat(latElements[i].dataset.lat);
                            const lon = parseFloat(lonElements[i].dataset.lon);
                            
                            if (!isNaN(lat) && !isNaN(lon) &&
                                lat >= -90 && lat <= 90 &&
                                lon >= -180 && lon <= 180) {
                                validGPSCount++;
                            }
                        }
                    }
                }
                
                return totalWaypoints > 0 ? (validGPSCount / totalWaypoints) >= 0.8 : false;
                
            } catch (error) {
                console.warn('GPS data validation failed:', error);
                return false;
            }
        }, 'checkGPSDataValid'),
        
        generateDebugHTML: safeExecution(function(debugData) {
            if (!debugData) {
                return '<html><body><h1>Error: No debug data available</h1></body></html>';
            }
            
            return `
                <html>
                <head><title>Debug Info - Extracted Version</title></head>
                <body style="font-family: monospace; padding: 20px; background: #f5f5f5; line-height: 1.4;">
                    <h2>ThePikehunters Catchlog Debug Information - Extracted Version</h2>
                    <h3>Enhanced Cloud Sync + Universal Data Manager</h3>
                    
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <h3>🩺 System Health Check:</h3>
                        <div style="background: ${this.getHealthColor(debugData.systemHealth)}; 
                                    padding: 10px; border-radius: 3px; margin: 10px 0;
                                    border-left: 4px solid ${this.getHealthBorderColor(debugData.systemHealth)};">
                            <strong>Managers Initialized:</strong> ${debugData.systemHealth.allManagersInitialized ? 'YES' : 'NO'}<br>
                            <strong>Critical Functions:</strong> ${debugData.systemHealth.allFunctionsAvailable ? 'YES' : 'NO'}<br>
                            <strong>Cloud Sync Integration:</strong> ${debugData.systemHealth.cloudSyncIntegration ? 'YES' : 'NO'}<br>
                            <strong>New Dropdown Fields:</strong> ${debugData.systemHealth.newDropdownFields ? 'YES' : 'NO'}
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <h3>📊 Data Status:</h3>
                        <div style="background: ${debugData.dataStatus.waypointsExist ? '#e8f5e9' : '#ffebee'}; 
                                    padding: 10px; border-radius: 3px; margin: 10px 0;
                                    border-left: 4px solid ${debugData.dataStatus.waypointsExist ? '#4CAF50' : '#f44336'};">
                            <strong>Waypoints Exist:</strong> ${debugData.dataStatus.waypointsExist ? 'YES' : 'NO'}<br>
                            <strong>GPS Data Valid:</strong> ${debugData.dataStatus.gpsDataValid ? 'YES' : 'NO'}
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <h3>☁️ Cloud Sync Status:</h3>
                        <div style="background: ${debugData.cloudSync.available ? '#e8f5e9' : '#fff3e0'}; 
                                    padding: 10px; border-radius: 3px; margin: 10px 0;
                                    border-left: 4px solid ${debugData.cloudSync.available ? '#4CAF50' : '#ff9800'};">
                            <strong>Cloud Sync Available:</strong> ${debugData.cloudSync.available ? 'YES' : 'NO'}<br>
                            <strong>Initialized:</strong> ${debugData.cloudSync.initialized ? 'YES' : 'NO'}<br>
                            <strong>Team Member:</strong> ${debugData.cloudSync.teamMember}<br>
                            <strong>Status:</strong> ${debugData.cloudSync.status}
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <h3>🔍 Complete State:</h3>
                        <pre style="max-height: 400px; overflow-y: auto; background: #f8f8f8; padding: 10px; border-radius: 3px; font-size: 0.9em;">${JSON.stringify(debugData, null, 2)}</pre>
                    </div>
                    
                    <button onclick="window.close()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; margin-top: 10px;">Sluiten</button>
                </body>
                </html>
            `;
        }, 'generateDebugHTML'),
        
        // Helper functies
        checkManagersInitialized: function() {
            return (typeof LureManager === 'object' && 
                    typeof DropdownManager === 'object' && 
                    typeof LocationManager === 'object' && 
                    typeof SettingsManager === 'object' &&
                    typeof DataManager === 'object');
        },
        
        checkCriticalFunctions: function() {
            const criticalFunctions = [
                'validateTime', 'validateNumber', 'validateGPSCoordinates',
                'generateValidationReport', 'createSmartDropdown'
            ];
            
            return criticalFunctions.every(func => typeof window[func] === 'function');
        },
        
        checkNewDropdownFields: function() {
            return (DropdownManager && DropdownManager.options && 
                    DropdownManager.options.zonschaduw && DropdownManager.options.zonschaduw.length > 0 &&
                    DropdownManager.options.bodemhardheid && DropdownManager.options.bodemhardheid.length > 0);
        },
        
        collectCloudSyncInfo: function() {
            let cloudInfo = {
                available: false,
                status: 'Offline',
                teamMember: null,
                initialized: false
            };
            
            if (typeof supabaseManager !== 'undefined') {
                cloudInfo = {
                    available: true,
                    initialized: supabaseManager.isInitialized,
                    status: supabaseManager.isInitialized ? 
                        (supabaseManager.teamMember ? 'Ready' : 'Setup Required') : 
                        'Initializing',
                    teamMember: supabaseManager.teamMember
                };
            }
            
            return cloudInfo;
        },
        
        processValidationReport: function(validationReport) {
            if (!validationReport || !validationReport.summary) {
                return {
                    overallComplete: false,
                    canExport: true,
                    canCloudSync: false
                };
            }
            
            return {
                overallComplete: validationReport.summary.overallComplete,
                canExport: validationReport.summary.canExport,
                canCloudSync: validationReport.summary.canCloudSync || false,
                sessionCompletionRate: validationReport.summary.sessionCompletionRate || 0,
                catchCompletionRate: validationReport.summary.catchCompletionRate || 0
            };
        },
        
        generateBasicReport: function() {
            return {
                summary: {
                    overallComplete: false,
                    canExport: true,
                    canCloudSync: false
                }
            };
        },
        
        getHealthColor: function(health) {
            const score = Object.values(health).filter(v => v === true).length;
            const total = Object.keys(health).length;
            const percentage = score / total;
            
            return percentage >= 0.8 ? '#e8f5e9' : percentage >= 0.6 ? '#fff3e0' : '#ffebee';
        },
        
        getHealthBorderColor: function(health) {
            const score = Object.values(health).filter(v => v === true).length;
            const total = Object.keys(health).length;
            const percentage = score / total;
            
            return percentage >= 0.8 ? '#4CAF50' : percentage >= 0.6 ? '#ff9800' : '#f44336';
        },
        
        // Fallback functionaliteit voor als er toch problemen zijn
        generateFallbackDebugData: function() {
            return {
                version: '6.2-extracted-fallback',
                timestamp: new Date().toISOString(),
                message: 'Limited debug info - some dependencies unavailable',
                availableDependencies: {
                    supabaseManager: typeof supabaseManager !== 'undefined',
                    LureManager: typeof LureManager !== 'undefined',
                    DropdownManager: typeof DropdownManager !== 'undefined'
                }
            };
        },
        
        showFallbackDebug: function(data) {
            const debugWindow = window.open('', '_blank', 'width=800,height=600');
            if (debugWindow) {
                debugWindow.document.write(`
                    <html>
                    <head><title>Debug Info - Limited Mode</title></head>
                    <body style="font-family: Arial; padding: 20px;">
                        <h2>Debug Information - Limited Mode</h2>
                        <p>Sommige data is niet beschikbaar, maar hier is wat we hebben:</p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                        <button onclick="window.close()">Sluiten</button>
                    </body>
                    </html>
                `);
            } else {
                alert('Popup geblokkeerd. Debug data:\n\n' + JSON.stringify(data, null, 2));
            }
        },
        
        showInlineDebug: function(data) {
            alert('Debug venster geblokkeerd. Check console voor debug data.');
            console.log('Debug data:', data);
        },
        
        showErrorDebug: function(error) {
            alert(`Debug systeem fout: ${error.message}\n\nCheck console voor details.`);
            console.error('Debug error details:', error);
        },
        
        diagnoseInitializationIssue: safeExecution(function() {
            console.log('Diagnosing initialization issues...');
            const issues = [];
            
            if (!this.checkManagersInitialized()) {
                issues.push('Some managers not properly initialized');
            }
            if (!this.checkCriticalFunctions()) {
                issues.push('Critical functions missing');
            }
            if (!this.checkWaypointsExist()) {
                issues.push('No waypoint data found');
            }
            
            if (issues.length > 0) {
                console.warn('Initialization issues found:', issues);
                return false;
            }
            
            console.log('System appears to be properly initialized');
            return true;
        }, 'diagnoseInitializationIssue')
    };
    
    // Globaal beschikbaar maken
    window.debugInfo = debugInfo;
    
    console.log('Debug Info System loaded successfully (extracted version)');
    
})();