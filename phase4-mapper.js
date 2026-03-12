// ====================================
// FASE 4: ENRICHMENT MAP
// Kaart met vangsten & waarnemingen
// ====================================

let enrichmentMapInstance = null;
let enrichmentMapMarkers = {};

// ====================================
// STAP 1: Initialize Enrichment Map
// ====================================

/**
 * Initialiseert Leaflet kaart met sessie GPS + markers
 */
async function initEnrichmentMap(session) {
    try {
        console.log('🗺️ Initializing enrichment map...');

        // Cleanup existing map
        if (enrichmentMapInstance) {
            enrichmentMapInstance.remove();
            enrichmentMapInstance = null;
        }

        // Bepaal container
        let mapContainer = document.getElementById('enrichmentMapContainer');
        if (!mapContainer) {
            // Create container if not exists
            const contentDiv = document.getElementById('phase4EnrichmentContent');
            if (contentDiv) {
                // Create instruction div
                const instructionDiv = document.createElement('div');
                instructionDiv.style.cssText = 'font-size: 0.85em; color: #555; background: #f5f5f5; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px;';
                instructionDiv.innerHTML = '📍 Klik op de kaart om een vangst toe te voegen &nbsp;·&nbsp; Sleep een rode marker om de GPS-locatie aan te passen';

                mapContainer = document.createElement('div');
                mapContainer.id = 'enrichmentMapContainer';
                mapContainer.style.cssText = `
                    width: 100%;
                    height: 400px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    background: #f0f0f0;
                `;
                // Insert at beginning
                contentDiv.insertBefore(mapContainer, contentDiv.firstChild);
                contentDiv.insertBefore(instructionDiv, mapContainer);
            }
        }

        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Bepaal startpunt
        const s = Phase4Utils.normalizeSession(session, window.currentSession?.origin);

        const lat = s.gpsLat || 52.1326;
        const lng = s.gpsLng || 5.2913;

        // Initialize Leaflet map
        enrichmentMapInstance = L.map('enrichmentMapContainer').setView([lat, lng], 13);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(enrichmentMapInstance);

        // Add session location marker
        L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        })
            .bindPopup('📍 Sessie start')
            .addTo(enrichmentMapInstance);

        // Mark current session catches
        if (enrichmentCatches && enrichmentCatches.length > 0) {
            markCurrentSessionCatches(enrichmentCatches);
        }

        // Handle map clicks
        enrichmentMapInstance.on('click', (e) => {
            onMapClick(e.latlng);
        });

        console.log('✓ Enrichment map initialized');

    } catch (error) {
        console.error('❌ Error initializing map:', error);
    }
}

// ====================================
// STAP 3: Mark Current Session Catches
// ====================================

/**
 * Highlight vangsten van huidige sessie
 */
function markCurrentSessionCatches(catches) {
    try {
        // ⭐ DEBUG: Log alle catches met GPS status
        const catchesWithGpsStatus = catches.map(c => {
            const hasGps = c.gps_lat && c.gps_long;
            return {
                id: c.id,
                soort: c.soort,
                gps_lat: c.gps_lat,
                gps_long: c.gps_long,
                has_gps: hasGps,
                marker_status: hasGps ? '✅ RODE marker' : '❌ GEEN marker'
            };
        });
        console.log('🔴 CURRENT SESSION CATCHES - GPS STATUS:', catchesWithGpsStatus);
        console.log(`🗺️ ${catchesWithGpsStatus.filter(c => c.has_gps).length}/${catchesWithGpsStatus.length} vangsten hebben GPS`);

        catches.forEach(catch_ => {
            const lat = catch_.gps_lat;
            const lng = catch_.gps_long;

            if (lat && lng) {
                // ⭐ STAP 1: Detecteer gekoppelde vangsten
                const isLinked = catch_.linked_catch_id || catch_.linked_sighting_id;

                // ⭐ STAP 2: Custom icon met badge voor gekoppelde vangsten
                let markerIcon;
                if (isLinked) {
                    markerIcon = L.divIcon({
                        className: '',
                        html: `<div style="position:relative;">
                            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
                                 style="width:30px;height:45px;">
                            <span style="position:absolute;top:-4px;right:-8px;background:white;border-radius:50%;font-size:14px;line-height:18px;width:18px;height:18px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.4);">🔗</span>
                        </div>`,
                        iconSize: [30, 45],
                        iconAnchor: [15, 45],
                        popupAnchor: [1, -40]
                    });
                } else {
                    markerIcon = L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [30, 45],
                        iconAnchor: [15, 45],
                        popupAnchor: [1, -40],
                        shadowSize: [45, 45]
                    });
                }

                const marker = L.marker([lat, lng], {
                    draggable: true,
                    icon: markerIcon
                });

                // ⭐ STAP 3: Popup met koppelingsinfo
                let popupHtml = `
                    <div style="font-size: 0.9em;">
                        <strong>${catch_.soort}</strong> (deze sessie)<br>
                        ${catch_.lengte ? `Lengte: ${catch_.lengte}cm<br>` : ''}
                        ${catch_.aantal ? `Aantal: ${catch_.aantal}` : ''}
                        📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

                // Voeg koppelingsinfo toe
                if (catch_.linked_catch_id) {
                    // Zoek gekoppelde vangst in enrichmentCatches
                    const linkedCatch = enrichmentCatches?.find(c => {
                        const nc = Phase4Utils.normalizeCatch(c, window.currentSession?.origin);
                        return nc.isField ? c.id === catch_.linked_catch_id : c.catch_id === catch_.linked_catch_id;
                    });

                    if (linkedCatch) {
                        const linkedTime = linkedCatch.vangst_tijd || linkedCatch.catch_datetime;
                        const linkedDate = linkedTime?.substring(0, 10) || '?';
                        const linkedLength = linkedCatch.lengte ? `${linkedCatch.lengte}cm` : '?';
                        popupHtml += `<br><br><span style="color:#1976D2;font-weight:600;">🔗 Eerder gevangen op ${linkedDate} — ${linkedLength}</span>`;
                    }
                } else if (catch_.linked_sighting_id) {
                    // Voor waarnemingen: toon apenas "Eerder waargenomen op [datum]"
                    // (Volledig ophalen via Supabase kan hier, maar we houden het eenvoudig)
                    popupHtml += `<br><br><span style="color:#FF9800;font-weight:600;">🔍 Eerder waargenomen</span>`;
                }

                popupHtml += `</div>`;
                marker.bindPopup(popupHtml);
                marker.addTo(enrichmentMapInstance);

                // Handle marker drag events
                marker.on('dragend', async function(e) {
                    const newLatLng = e.target.getLatLng();

                    // ⭐ KRITIEK: Gebruik correct ID veld gebaseerd op sessie type
                    // field_catches hebben 'id' veld, catches hebben 'catch_id' veld
                    const nc = Phase4Utils.normalizeCatch(catch_, window.currentSession?.origin);
                    const catchId = nc.id;

                    try {
                        const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
                        const pks = Phase4Utils.getPrimaryKeys(window.currentSession?.origin);
                        const { error } = await supabaseManager.client
                            .from(tables.catchTable)
                            .update({
                                [DB_SCHEMA.field_catches.cols.gps_lat]: newLatLng.lat,
                                [DB_SCHEMA.field_catches.cols.gps_long]: newLatLng.lng
                            })
                            .eq(pks.catchPk, catchId);
                        if (error) throw error;

                        console.log(`✓ GPS updated for catch ${catchId}:`, newLatLng.lat, newLatLng.lng);

                        // Update in-memory enrichmentCatches array
                        // ⭐ KRITIEK: Zoek op correct ID veld gebaseerd op sessie type
                        const catchInMemory = enrichmentCatches?.find(c =>
                            nc.isField ? c.id === catchId : c.catch_id === catchId
                        );
                        if (catchInMemory) {
                            catchInMemory.gps_lat = newLatLng.lat;
                            catchInMemory.gps_long = newLatLng.lng;
                            console.log(`✓ In-memory catch ${catchId} updated:`, { gps_lat: catchInMemory.gps_lat, gps_long: catchInMemory.gps_long });
                        }

                        // Update popup met nieuwe coördinaten (inclusief koppelingsinfo)
                        let updatedPopupHtml = `
                            <div style="font-size: 0.9em;">
                                <strong>${catch_.soort}</strong> (deze sessie)<br>
                                ${catch_.lengte ? `Lengte: ${catch_.lengte}cm<br>` : ''}
                                📍 ${newLatLng.lat.toFixed(4)}, ${newLatLng.lng.toFixed(4)}`;

                        if (catch_.linked_catch_id) {
                            const linkedCatch = enrichmentCatches?.find(c => {
                                const nc = Phase4Utils.normalizeCatch(c, window.currentSession?.origin);
                                return nc.isField ? c.id === catch_.linked_catch_id : c.catch_id === catch_.linked_catch_id;
                            });
                            if (linkedCatch) {
                                const linkedTime = linkedCatch.vangst_tijd || linkedCatch.catch_datetime;
                                const linkedDate = linkedTime?.substring(0, 10) || '?';
                                const linkedLength = linkedCatch.lengte ? `${linkedCatch.lengte}cm` : '?';
                                updatedPopupHtml += `<br><br><span style="color:#1976D2;font-weight:600;">🔗 Eerder gevangen op ${linkedDate} — ${linkedLength}</span>`;
                            }
                        } else if (catch_.linked_sighting_id) {
                            updatedPopupHtml += `<br><br><span style="color:#FF9800;font-weight:600;">🔍 Eerder waargenomen</span>`;
                        }

                        updatedPopupHtml += `</div>`;
                        marker.bindPopup(updatedPopupHtml);

                    } catch (error) {
                        console.error('❌ Error updating GPS:', error);
                        alert('Fout bij opslaan GPS: ' + error.message);
                    }
                });

                enrichmentMapMarkers[`current_${catch_.id}`] = marker;
            }
        });

        console.log(`✓ Marked ${catches.length} current session catches`);

    } catch (error) {
        console.error('❌ Error marking catches:', error);
    }
}

// ====================================
// STAP 4: Map Click Handler
// ====================================

/**
 * Wanneer gebruiker op kaart klikt: toon formulier voor nieuwe vangst
 */
async function onMapClick(latlng) {
    console.log(`🎯 Map clicked at ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);

    // Constante voor toegestane vissoorten
    const ALLOWED_SPECIES = ['Snoek', 'Snoekbaars', 'Baars', 'Roofblei', 'Meerval', 'Winde', 'Grondel'];

    // Vissoort selectie via keuzemenu
    const speciesChoice = prompt(
        'Kies vissoort (1-7):\n' +
        '1. Snoek\n' +
        '2. Snoekbaars\n' +
        '3. Baars\n' +
        '4. Roofblei\n' +
        '5. Meerval\n' +
        '6. Winde\n' +
        '7. Grondel'
    );

    // Validatie: check of input 1-7 is
    if (!speciesChoice) return;
    const speciesIndex = parseInt(speciesChoice);
    if (isNaN(speciesIndex) || speciesIndex < 1 || speciesIndex > 7) {
        alert('Ongeldige keuze. Voer een getal 1-7 in.');
        return;
    }

    const species = ALLOWED_SPECIES[speciesIndex - 1];

    const length = prompt('Lengte (cm):');
    const count = prompt('Aantal:', '1') || '1';

    try {
        const now = new Date();

        const tables = Phase4Utils.getTableNames(window.currentSession?.origin);
        const isFieldOrigin = window.currentSession?.origin === 'veld';

        const insertData = isFieldOrigin ? {
            field_session_id: enrichmentSession.id,
            soort: species,
            lengte: length ? parseInt(length) : null,
            aantal: parseInt(count),
            vangst_tijd: Phase4Utils.toLocalISOString(now),
            gps_lat: latlng.lat,
            gps_long: latlng.lng,
            diepte: enrichmentSession.diepte ?? null,
            user_id: window.currentSession.user_id
        } : {
            session_id: enrichmentSession.session_id,
            soort: species,
            lengte: length ? parseInt(length) : null,
            aantal: parseInt(count),
            catch_datetime: Phase4Utils.toLocalISOString(now),
            catch_hour: now.getHours(),
            catch_month: now.getMonth() + 1,
            gps_lat: latlng.lat,
            gps_long: latlng.lng,
            diepte: null,
            vangsthoogte: null,
            user_id: window.currentSession.user_id
        };
        console.log(`📍 Inserting ${isFieldOrigin ? 'VELD' : 'HANDMATIG'} catch with GPS:`, insertData);

        const { error } = await supabaseManager.client
            .from(tables.catchTable)
            .insert(insertData);

        if (error) throw error;

        console.log('✓ Catch added with GPS', { lat: latlng.lat, lng: latlng.lng });

        // Reload enrichment screen with correct session ID
        const s = Phase4Utils.normalizeSession(enrichmentSession, window.currentSession?.origin);
        await initEnrichmentScreen(s.id);

    } catch (error) {
        console.error('❌ Error adding catch:', error);
        alert('Fout bij toevoegen vangst: ' + error.message);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-mapper.js loaded');
});
