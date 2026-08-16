```javascript
import {
  addIncident,
  readIncidents,
  readUsers
} from './dataStore.js';


/* =====================================================
   ADMIN CONFIGURATION
===================================================== */

const DEFAULT_ADMIN = {
  username: 'GOVIND',
  password: 'GOVIND#1'
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

    if (
      !entry ||
      typeof entry !== 'object'
    ) {
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

      userName:
        entry.userName ||
        null,

      latitude:
        entry.latitude ??
        null,

      longitude:
        entry.longitude ??
        null,

      accuracy:
        entry.accuracy ??
        null,

      createdAt:
        entry.createdAt ||
        new Date().toISOString(),

      startedAt:
        entry.startedAt ||
        null,

      resolvedAt:
        entry.resolvedAt ||
        null,

      stoppedAt:
        entry.stoppedAt ||
        null,

      lastLocationUpdate:
        entry.lastLocationUpdate ||
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
   * Resolved incidents are never active.
   */

  if (
    incident.status === 'resolved' ||
    incident.resolved === true ||
    Boolean(incident.resolvedAt)
  ) {
    return false;
  }


  /*
   * Stopped incidents are also not active.
   */

  if (
    incident.status === 'stopped' ||
    Boolean(incident.stoppedAt)
  ) {
    return false;
  }


  /*
   * Only SOS incidents count
   * as active emergency alerts.
   */

  return (
    String(
      incident.type || ''
    ).toLowerCase() === 'sos' &&
    incident.status === 'active'
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
        String(
          incident.type || ''
        ).toLowerCase() === 'sos' &&
        (
          incident.status === 'resolved' ||
          incident.resolved === true ||
          Boolean(incident.resolvedAt)
        )
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
   GET ADMIN USERNAME
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
```
