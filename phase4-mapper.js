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
            }
        }

        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Bepaal startpunt
        const isFieldSession = window.currentSession?.origin === 'veld';
        const centerLat = isFieldSession ? session.gps_lat : session.session_start_latitude;
        const centerLng = isFieldSession ? session.gps_lng : session.session_start_longitude;

        const lat = centerLat || 52.1326;
        const lng = centerLng || 5.2913;

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

        // Load eerdere vangsten
        const { data: user } = await supabaseManager.client.auth.getSession();
        if (user.session?.user?.id) {
            await loadPreviousCatches(user.session.user.id);
            await loadPreviousSightings(user.session.user.id);
        }

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
// STAP 2: Load Previous Catches
// ====================================

/**
 * Laadt eerdere vangsten (vorige 30 dagen) als markers
 */
async function loadPreviousCatches(userId) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: catches, error } = await supabaseManager.client
            .from('catches')
            .select('id, soort, lengte, catch_datetime, gps_lat, gps_long')
            .eq('user_id', userId)
            .gte('catch_datetime', thirtyDaysAgo.toISOString())
            .limit(50);

        if (error) throw error;

        if (!catches || catches.length === 0) {
            console.log('No previous catches found');
            return;
        }

        catches.forEach(catch_ => {
            if (catch_.gps_lat && catch_.gps_long) {
                const marker = L.marker([catch_.gps_lat, catch_.gps_long], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [20, 33],
                        iconAnchor: [10, 33],
                        popupAnchor: [1, -30],
                        shadowSize: [35, 35]
                    })
                })
                    .bindPopup(`
                        <div style="font-size: 0.9em;">
                            <strong>${catch_.soort}</strong><br>
                            ${catch_.lengte ? `Lengte: ${catch_.lengte}cm<br>` : ''}
                            ${new Date(catch_.catch_datetime).toLocaleString('nl-NL')}
                        </div>
                    `)
                    .addTo(enrichmentMapInstance);

                enrichmentMapMarkers[`catch_${catch_.id}`] = marker;
            }
        });

        console.log(`✓ Loaded ${catches.length} previous catches`);

    } catch (error) {
        console.error('❌ Error loading previous catches:', error);
    }
}

// ====================================
// STAP 3: Load Previous Sightings
// ====================================

/**
 * Laadt eerdere waarnemingen (vorige 30 dagen) als markers
 */
async function loadPreviousSightings(userId) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Try to load sightings, but handle gracefully if table doesn't exist or schema is different
        const { data: sightings, error } = await supabaseManager.client
            .from('sightings')
            .select('*')
            .eq('user_id', userId)
            .gte('datetime_sighting', thirtyDaysAgo.toISOString())
            .limit(50);

        if (error) {
            console.warn('⚠️ Sightings tabel niet beschikbaar:', error.message);
            return;
        }

        if (!sightings || sightings.length === 0) {
            console.log('No previous sightings found');
            return;
        }

        sightings.forEach(sighting => {
            if (sighting.gps_lat && sighting.gps_long) {
                try {
                    const marker = L.marker([sighting.gps_lat, sighting.gps_long], {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                            iconSize: [20, 33],
                            iconAnchor: [10, 33],
                            popupAnchor: [1, -30],
                            shadowSize: [35, 35]
                        })
                    })
                        .bindPopup(`
                            <div style="font-size: 0.9em;">
                                <strong>${sighting.soort || '?'}</strong> (waarneming)<br>
                                ${sighting.datetime_sighting ? new Date(sighting.datetime_sighting).toLocaleString('nl-NL') : 'Onbekende tijd'}
                            </div>
                        `)
                        .addTo(enrichmentMapInstance);

                    // Apply opacity for sightings
                    if (marker._icon) marker._icon.style.opacity = '0.7';

                    enrichmentMapMarkers[`sighting_${sighting.id || Math.random()}`] = marker;
                } catch (e) {
                    console.warn('Error rendering sighting marker:', e);
                }
            }
        });

        console.log(`✓ Loaded ${sightings.length} previous sightings`);

    } catch (error) {
        console.error('❌ Error loading previous sightings:', error);
    }
}

// ====================================
// STAP 4: Mark Current Session Catches
// ====================================

/**
 * Highlight vangsten van huidige sessie
 */
function markCurrentSessionCatches(catches) {
    try {
        const isFieldCatch = window.currentSession?.origin === 'veld';

        // ⭐ DEBUG: Log alle catches met GPS status
        const catchesWithGpsStatus = catches.map(c => {
            const hasGps = c.gps_lat && (isFieldCatch ? c.gps_lng : c.gps_long);
            return {
                id: c.id,
                soort: c.soort,
                gps_lat: c.gps_lat,
                gps_lng: c.gps_lng,
                gps_long: c.gps_long,
                has_gps: hasGps,
                marker_status: hasGps ? '✅ RODE marker' : '❌ GEEN marker'
            };
        });
        console.log('🔴 CURRENT SESSION CATCHES - GPS STATUS:', catchesWithGpsStatus);
        console.log(`🗺️ ${catchesWithGpsStatus.filter(c => c.has_gps).length}/${catchesWithGpsStatus.length} vangsten hebben GPS`);

        catches.forEach(catch_ => {
            const lat = catch_.gps_lat;
            const lng = isFieldCatch ? catch_.gps_lng : catch_.gps_long;

            if (lat && lng) {
                const marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [30, 45],
                        iconAnchor: [15, 45],
                        popupAnchor: [1, -40],
                        shadowSize: [45, 45]
                    })
                })
                    .bindPopup(`
                        <div style="font-size: 0.9em;">
                            <strong>${catch_.soort}</strong> (deze sessie)<br>
                            ${catch_.lengte ? `Lengte: ${catch_.lengte}cm<br>` : ''}
                            ${catch_.aantal ? `Aantal: ${catch_.aantal}` : ''}
                        </div>
                    `)
                    .addTo(enrichmentMapInstance);

                enrichmentMapMarkers[`current_${catch_.id}`] = marker;
            }
        });

        console.log(`✓ Marked ${catches.length} current session catches`);

    } catch (error) {
        console.error('❌ Error marking catches:', error);
    }
}

// ====================================
// STAP 5: Map Click Handler
// ====================================

/**
 * Wanneer gebruiker op kaart klikt: toon formulier voor nieuwe vangst
 */
async function onMapClick(latlng) {
    console.log(`🎯 Map clicked at ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);

    // Toon modal voor nieuwe vangst
    const isFieldSession = window.currentSession?.origin === 'veld';

    const species = prompt('Vissoort:');
    if (!species) return;

    const length = prompt('Lengte (cm):');
    const count = prompt('Aantal:', '1') || '1';

    try {
        if (isFieldSession) {
            const insertData = {
                field_session_id: enrichmentSession.id,
                soort: species,
                lengte: length ? parseInt(length) : null,
                aantal: parseInt(count),
                vangst_tijd: new Date().toISOString(),
                gps_lat: latlng.lat,
                gps_lng: latlng.lng,
                user_id: window.currentSession.user_id
            };
            console.log('📍 Inserting VELD catch with GPS:', insertData);

            const { error } = await supabaseManager.client
                .from('field_catches')
                .insert(insertData);

            if (error) throw error;
        } else {
            const insertData = {
                session_id: enrichmentSession.id,
                soort: species,
                lengte: length ? parseInt(length) : null,
                aantal: parseInt(count),
                catch_datetime: new Date().toISOString(),
                gps_lat: latlng.lat,
                gps_long: latlng.lng,
                user_id: window.currentSession.user_id
            };
            console.log('📍 Inserting HANDMATIG catch with GPS:', insertData);

            const { error } = await supabaseManager.client
                .from('catches')
                .insert(insertData);

            if (error) throw error;
        }

        console.log('✓ Catch added with GPS', { lat: latlng.lat, lng: latlng.lng });

        // Reload enrichment screen
        await initEnrichmentScreen(enrichmentSession.id);

    } catch (error) {
        console.error('❌ Error adding catch:', error);
        alert('Fout bij toevoegen vangst: ' + error.message);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-mapper.js loaded');
});
