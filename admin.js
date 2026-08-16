import {
  addIncident,
  readIncidents,
  readUsers
} from './dataStore.js';


/* =====================================================
   ADMIN CONFIGURATION
===================================================== */

const DEFAULT_ADMIN = {
  username: 'govind',
  password: 'govindraksha1'
};

let adminCredentials = {
  ...DEFAULT_ADMIN
};


/* =====================================================
   ADMIN CREDENTIALS
===================================================== */

function setAdminCredentials(username, password) {

  if (!username || !password) {
    return false;
  }

  adminCredentials = {
    username: String(username),
    password: String(password)
  };

  return true;
}


function authenticateAdmin(username, password) {

  return (
    String(username || '') ===
      adminCredentials.username &&
    String(password || '') ===
      adminCredentials.password
  );
}


/* =====================================================
   IMPORT INCIDENTS
===================================================== */

function importIncidents(entries) {

  if (!Array.isArray(entries)) {
    return 0;
  }

  let imported = 0;

  entries.forEach((entry) => {

    if (!entry || typeof entry !== 'object') {
      return;
    }

    addIncident({

      id:
        entry.id ||
        crypto.randomUUID(),

      type:
        entry.type ||
        'unknown',

      message:
        entry.message ||
        'Imported incident',

      source:
        entry.source ||
        'import',

      status:
        entry.status ||
        'active',

      userId:
        entry.userId ||
        null,

      userEmail:
        entry.userEmail ||
        null,

      latitude:
        entry.latitude ??
        null,

      longitude:
        entry.longitude ??
        null,

      createdAt:
        entry.createdAt ||
        new Date().toISOString(),

      resolvedAt:
        entry.resolvedAt ||
        null
    });

    imported++;
  });

  return imported;
}


/* =====================================================
   EXPORT INCIDENTS
===================================================== */

function exportIncidents() {

  const incidents =
    readIncidents();

  return JSON.stringify(
    incidents,
    null,
    2
  );
}


/* =====================================================
   CHECK ACTIVE SOS
===================================================== */

function isIncidentActive(incident) {

  if (!incident) {
    return false;
  }


  /*
   * Explicitly resolved incidents
   * are NOT active.
   */

  if (
    incident.status === 'resolved' ||
    incident.resolved === true ||
    incident.resolvedAt
  ) {
    return false;
  }


  /*
   * Only SOS incidents count
   * as emergency alerts.
   */

  return (
    String(incident.type || '')
      .toLowerCase() === 'sos'
  );
}


/* =====================================================
   ADMIN OVERVIEW
===================================================== */

function getAdminOverview() {

  const users =
    readUsers();

  const incidents =
    readIncidents();


  const activeAlerts =
    incidents.filter(
      isIncidentActive
    );


  const resolvedAlerts =
    incidents.filter(
      (incident) =>
        incident.status === 'resolved' ||
        incident.resolved === true ||
        Boolean(incident.resolvedAt)
    );


  return {

    userCount:
      users.length,

    incidentCount:
      incidents.length,

    activeAlertCount:
      activeAlerts.length,

    resolvedAlertCount:
      resolvedAlerts.length,

    activeAlerts,

    resolvedAlerts,

    latestIncident:
      incidents[0] ||
      null
  };
}


/* =====================================================
   RESET ADMIN STATE
===================================================== */

function resetAdminState() {

  adminCredentials = {
    ...DEFAULT_ADMIN
  };

}


/* =====================================================
   GET ADMIN CREDENTIALS
===================================================== */

function getAdminUsername() {

  return adminCredentials.username;
}


/* =====================================================
   EXPORT
===================================================== */

export {

  authenticateAdmin,

  exportIncidents,

  getAdminOverview,

  importIncidents,

  resetAdminState,

  setAdminCredentials,

  getAdminUsername

};
