import {
  addIncident,
  readIncidents,
  readUsers
} from "./dataStore.js";


/* =====================================================
   ADMIN CONFIGURATION
   ===================================================== */

const DEFAULT_ADMIN = {
  username: "GOVIND",
  password: "GOVIND#1"
};

let adminCredentials = {
  ...DEFAULT_ADMIN
};


/* =====================================================
   ADMIN SESSION
   ===================================================== */

const ADMIN_SESSION_KEY =
  "rakshasutra-admin-authenticated";


/* =====================================================
   ADMIN AUTHENTICATION
   ===================================================== */

function authenticateAdmin(username, password) {

  return (
    String(username || "") ===
      adminCredentials.username &&

    String(password || "") ===
      adminCredentials.password
  );
}


/* =====================================================
   ADMIN SESSION
   ===================================================== */

function isAdminAuthenticated() {

  return (
    localStorage.getItem(
      ADMIN_SESSION_KEY
    ) === "true"
  );
}


function setAdminAuthenticated(value) {

  if (value) {

    localStorage.setItem(
      ADMIN_SESSION_KEY,
      "true"
    );

  } else {

    localStorage.removeItem(
      ADMIN_SESSION_KEY
    );
  }
}


/* =====================================================
   SET ADMIN CREDENTIALS
===================================================== */

function setAdminCredentials(
  username,
  password
) {

  if (!username || !password) {
    return false;
  }

  adminCredentials = {
    username: String(username),
    password: String(password)
  };

  return true;
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
      typeof entry !== "object"
    ) {
      return;
    }

    addIncident({

      id:
        entry.id ||
        (
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`
        ),

      type:
        entry.type ||
        "unknown",

      message:
        entry.message ||
        "Imported incident",

      source:
        entry.source ||
        "import",

      status:
        entry.status ||
        "active",

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

function isIncidentActive(
  incident
) {

  if (!incident) {
    return false;
  }

  if (
    incident.status === "resolved" ||
    incident.resolved === true ||
    incident.resolvedAt
  ) {
    return false;
  }

  return (
    String(
      incident.type || ""
    ).toLowerCase() === "sos"
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
        incident.status === "resolved" ||
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

  setAdminAuthenticated(false);
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

  isAdminAuthenticated,

  setAdminAuthenticated,

  exportIncidents,

  getAdminOverview,

  importIncidents,

  resetAdminState,

  setAdminCredentials,

  getAdminUsername

};
