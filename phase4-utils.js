// ====================================
// PHASE 4 UTILITIES
// Pure JavaScript helper functions
// No dependencies on other app modules
// ====================================

/**
 * Normaliseert sessiedata naar een unified object
 * Abstractueert weg het verschil tussen veld en handmatige sessies
 *
 * @param {Object} session - Het originele session object (field_sessions of sessions)
 * @param {string} origin - 'veld' of 'handmatig'
 * @returns {Object} Normalized session met consistent veld mapping
 */
function normalizeSession(session, origin) {
    if (!session) {
        console.warn('normalizeSession: session is null/undefined');
        return null;
    }

    const isField = origin === 'veld';

    return {
        // ID veld verschillend per type
        id: isField ? session.id : session.session_id,

        // Datetime velden verschillend
        startDatetime: isField ? session.start_tijd : session.session_start_datetime,
        endDatetime: isField ? session.eind_tijd : session.session_end_datetime,

        // Datum veld
        datum: isField ? session.datum : session.session_start_date,

        // GPS coördinaten verschillend
        gpsLat: isField ? session.gps_lat : session.session_start_latitude,
        gpsLng: isField ? session.gps_long : session.session_start_longitude,

        // Identieke velden
        locatie: session.locatie || null,
        watersoort: session.watersoort || null,
        stroomsnelheid: session.stroomsnelheid || null,

        // Watertemperatuur veld verschilt
        watertemperatuur: isField ? session.watertemperatuur : session.watertemperatuur_measured,

        // Identieke velden
        helderheid: session.helderheid || null,
        diepte: session.diepte ?? null,
        bodemhardheid: session.bodemhardheid ?? null,
        notities: session.notities || null,

        // Metadata
        origin: origin,
        isField: isField,
        raw: session  // Behoud origineel object
    };
}

/**
 * Normaliseert vangst data naar een unified object
 * Abstractueert weg het verschil tussen field_catches en catches
 *
 * @param {Object} catch_ - Het originele catch object (field_catches of catches)
 * @param {string} origin - 'veld' of 'handmatig'
 * @returns {Object} Normalized catch met consistent veld mapping
 */
function normalizeCatch(catch_, origin) {
    if (!catch_) {
        console.warn('normalizeCatch: catch_ is null/undefined');
        return null;
    }

    const isField = origin === 'veld';

    return {
        // ID veld verschilt
        id: isField ? catch_.id : catch_.catch_id,

        // Vangst tijd veld verschilt
        vangstTijd: isField ? catch_.vangst_tijd : catch_.catch_datetime,

        // Metadata
        origin: origin,
        isField: isField,
        raw: catch_  // Behoud origineel object
    };
}

/**
 * Geeft de correct database table namen voor een sessie type
 *
 * @param {string} origin - 'veld' of 'handmatig'
 * @returns {Object} Object met sessionTable en catchTable namen
 */
function getTableNames(origin) {
    const isField = origin === 'veld';

    return {
        sessionTable: isField ? 'field_sessions' : 'sessions',
        catchTable: isField ? 'field_catches' : 'catches'
    };
}

/**
 * Geeft de correct primary key kolom namen voor een sessie type
 *
 * @param {string} origin - 'veld' of 'handmatig'
 * @returns {Object} Object met sessionPk en catchPk kolom namen
 */
function getPrimaryKeys(origin) {
    const isField = origin === 'veld';

    return {
        sessionPk: isField ? 'id' : 'session_id',
        catchPk: isField ? 'id' : 'catch_id'
    };
}

/**
 * Geeft fallback waarden voor vangst velden
 * Gebruikt sessie defaults wanneer vangst specifieke waarden ontbreken
 *
 * @param {Object} catch_ - De vangst record
 * @param {Object} session - De sessie record (genormaliseerd of origineel)
 * @param {string} origin - 'veld' of 'handmatig'
 * @returns {Object} Object met fallback waarden
 */
function getCatchFallbacks(catch_, session, origin) {
    if (!catch_ || !session) {
        console.warn('getCatchFallbacks: catch_ of session is null/undefined');
        return {
            diepte: null,
            bodemhardheid: null,
            gpsLat: null,
            gpsLng: null
        };
    }

    const isField = origin === 'veld';

    // Bepaal session GPS velden (kan zowel genormaliseerd als origineel object zijn)
    const sessionGpsLat = isField
        ? (session.gps_lat ?? session.session_start_latitude)  // genormaliseerd of origineel
        : (session.session_start_latitude ?? session.gps_lat);

    const sessionGpsLng = isField
        ? (session.gps_long ?? session.session_start_longitude)
        : (session.session_start_longitude ?? session.gps_long);

    return {
        // Diepte: fallback naar sessie diepte alleen voor veld-sessies
        diepte: catch_.diepte ?? (isField ? session.diepte : null),

        // Bodemhardheid: fallback naar sessie bodemhardheid alleen voor veld-sessies
        bodemhardheid: catch_.bodemhardheid ?? (isField ? session.bodemhardheid : null),

        // GPS: fallback naar sessie GPS als vangst geen eigen GPS heeft
        gpsLat: catch_.gps_lat ?? sessionGpsLat ?? null,
        gpsLng: catch_.gps_long ?? sessionGpsLng ?? null
    };
}

/**
 * Geeft UI styling info voor een sessie type badge
 *
 * @param {string} origin - 'veld' of 'handmatig'
 * @returns {Object} Object met label, backgroundColor, en color
 */
function getSessionBadge(origin) {
    const isField = origin === 'veld';

    return {
        label: isField ? '🎯 Veld' : '📝 Handmatig',
        backgroundColor: isField ? '#FFF3E0' : '#E3F2FD',
        color: isField ? '#E65100' : '#0D47A1'
    };
}

/**
 * Zet een Date object om naar lokale ISO string (zonder UTC offset)
 * Slaat lokale tijd op in plaats van UTC
 *
 * @param {Date} date - De datum/tijd object
 * @returns {string} ISO string in lokale timezone (YYYY-MM-DDTHH:mm:ss)
 */
function toLocalISOString(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date - offset).toISOString().slice(0, 19);
}

// Export naar window (voor globale beschikbaarheid)
window.Phase4Utils = {
    normalizeSession,
    normalizeCatch,
    getTableNames,
    getPrimaryKeys,
    getCatchFallbacks,
    getSessionBadge,
    toLocalISOString
};

// Initialize logging
document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ phase4-utils.js loaded');
});
