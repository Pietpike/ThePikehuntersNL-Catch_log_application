// ====================================
// DATABASE SCHEMA DEFINITIE
// Centrale definitie van alle tabel- en kolomnamen
// ====================================

const DB_SCHEMA = {
  catches: {
    table: 'catches',
    pk: 'catch_id',
    cols: {
      catch_id: 'catch_id',
      session_id: 'session_id',
      aas_id: 'aas_id',
      catch_datetime: 'catch_datetime',
      catch_hour: 'catch_hour',
      catch_month: 'catch_month',
      gps_lat: 'gps_lat',
      gps_long: 'gps_long',
      notities: 'notities',
      soort: 'soort',
      aantal: 'aantal',
      lengte: 'lengte',
      diepte: 'diepte',
      vangsthoogte: 'vangsthoogte',
      vissnelheid: 'vissnelheid',
      booster: 'booster',
      gewicht: 'gewicht',
      structuur: 'structuur',
      aasvis_op_stek: 'aasvis_op_stek',
      zon_schaduw: 'zon_schaduw',
      techniek: 'techniek',
      bodemhardheid: 'bodemhardheid',
      watertemperatuur_override: 'watertemperatuur_override',
      helderheid_override: 'helderheid_override',
      stroomsnelheid_override: 'stroomsnelheid_override',
      linked_catch_id: 'linked_catch_id',
      linked_sighting_id: 'linked_sighting_id'
    }
  },
  field_catches: {
    table: 'field_catches',
    pk: 'id',
    cols: {
      id: 'id',
      field_session_id: 'field_session_id',
      user_id: 'user_id',
      vangst_tijd: 'vangst_tijd',
      soort: 'soort',
      lengte: 'lengte',
      aantal: 'aantal',
      gps_lat: 'gps_lat',
      gps_long: 'gps_long',
      diepte: 'diepte',
      vangsthoogte: 'vangsthoogte',
      bodemhardheid: 'bodemhardheid',
      vissnelheid: 'vissnelheid',
      booster: 'booster',
      gewicht: 'gewicht',
      structuur: 'structuur',
      aasvis: 'aasvis',
      zon_schaduw: 'zon_schaduw',
      notities: 'notities',
      session_id: 'session_id',
      catch_id: 'catch_id'
    }
  },
  field_sessions: {
    table: 'field_sessions',
    pk: 'id',
    cols: {
      id: 'id',
      user_id: 'user_id',
      start_tijd: 'start_tijd',
      datum: 'datum',
      gps_lat: 'gps_lat',
      gps_long: 'gps_long',
      eind_tijd: 'eind_tijd',
      locatie: 'locatie',
      watertemperatuur: 'watertemperatuur',
      helderheid: 'helderheid',
      stroomsnelheid: 'stroomsnelheid',
      diepte: 'diepte',
      bodemhardheid: 'bodemhardheid',
      notities: 'notities',
      session_id: 'session_id',
      watersoort: 'watersoort',
      genegeerd: 'genegeerd',
      aantal_hengels: 'aantal_hengels'
    }
  },
  sessions: {
    table: 'sessions',
    pk: 'session_id',
    cols: {
      session_id: 'session_id',
      user_id: 'user_id',
      team_member: 'team_member',
      sessie_naam: 'sessie_naam',
      gpx_filename: 'gpx_filename',
      session_start_datetime: 'session_start_datetime',
      session_end_datetime: 'session_end_datetime',
      session_start_date: 'session_start_date',
      session_start_hour: 'session_start_hour',
      session_start_month: 'session_start_month',
      locatie: 'locatie',
      watersoort: 'watersoort',
      stroomsnelheid: 'stroomsnelheid',
      helderheid: 'helderheid',
      watertemperatuur_measured: 'watertemperatuur_measured',
      weather_id: 'weather_id',
      diepte: 'diepte',
      vangsthoogte: 'vangsthoogte',
      definitief: 'definitief',
      genegeerd: 'genegeerd',
      aantal_hengels: 'aantal_hengels'
    }
  }
};
