const STORAGE_KEYS = {
  users: 'rakshasutra-users',
  incidents: 'rakshasutra-incidents'
};


/* =====================================================
   STORAGE
===================================================== */

function getStorage() {

  if (
    typeof window !== 'undefined' &&
    window.localStorage
  ) {
    return window.localStorage;
  }


  if (
    typeof globalThis !== 'undefined' &&
    globalThis.localStorage
  ) {
    return globalThis.localStorage;
  }


  const memoryStore = {};

  return {

    getItem(key) {

      return Object.prototype.hasOwnProperty.call(
        memoryStore,
        key
      )
        ? memoryStore[key]
        : null;
    },

    setItem(key, value) {

      memoryStore[key] =
        String(value);
    },

    removeItem(key) {

      delete memoryStore[key];
    }

  };
}


/* =====================================================
   USERS
===================================================== */

function readUsers() {

  try {

    const storage =
      getStorage();

    const raw =
      storage.getItem(
        STORAGE_KEYS.users
      );

    return raw
      ? JSON.parse(raw)
      : [];

  } catch {

    return [];
  }
}


function writeUsers(users) {

  const storage =
    getStorage();

  storage.setItem(
    STORAGE_KEYS.users,
    JSON.stringify(users)
  );
}


/* =====================================================
   INCIDENTS
===================================================== */

function readIncidents() {

  try {

    const storage =
      getStorage();

    const raw =
      storage.getItem(
        STORAGE_KEYS.incidents
      );

    return raw
      ? JSON.parse(raw)
      : [];

  } catch {

    return [];
  }
}


function writeIncidents(
  incidents
) {

  const storage =
    getStorage();

  storage.setItem(
    STORAGE_KEYS.incidents,
    JSON.stringify(incidents)
  );
}


/* =====================================================
   ADD INCIDENT
===================================================== */

function addIncident(entry) {

  const incidents =
    readIncidents();


  const record = {

    id:
      crypto.randomUUID(),

    createdAt:
      new Date().toISOString(),

    ...entry

  };


  incidents.unshift(
    record
  );


  writeIncidents(
    incidents
  );


  return record;
}


/* =====================================================
   FIND ACTIVE SOS
===================================================== */

function findActiveSOS(
  userId = null
) {

  const incidents =
    readIncidents();


  return incidents.find(
    (incident) => {

      if (
        incident.type !== 'sos' ||
        incident.status !== 'active'
      ) {
        return false;
      }


      /*
       * If a userId was supplied,
       * only match that user's SOS.
       */

      if (
        userId &&
        incident.userId !== userId
      ) {
        return false;
      }


      return true;

    }
  ) || null;
}


/* =====================================================
   RESOLVE ACTIVE SOS
===================================================== */

function resolveActiveSOS(
  userId = null,
  location = null
) {

  const incidents =
    readIncidents();


  const index =
    incidents.findIndex(
      (incident) => {

        if (
          incident.type !== 'sos' ||
          incident.status !== 'active'
        ) {
          return false;
        }


        if (
          userId &&
          incident.userId !== userId
        ) {
          return false;
        }


        return true;

      }
    );


  if (index === -1) {

    return null;
  }


  const resolvedAt =
    new Date().toISOString();


  const existing =
    incidents[index];


  incidents[index] = {

    ...existing,

    status:
      'resolved',

    resolved:
      true,

    resolvedAt,

    finalLatitude:
      location?.latitude ??
      existing.latitude ??
      null,

    finalLongitude:
      location?.longitude ??
      existing.longitude ??
      null,

    finalAccuracy:
      location?.accuracy ??
      existing.accuracy ??
      null

  };


  writeIncidents(
    incidents
  );


  return incidents[index];
}


/* =====================================================
   UPDATE INCIDENT
===================================================== */

function updateIncident(
  incidentId,
  updates
) {

  const incidents =
    readIncidents();


  const index =
    incidents.findIndex(
      (incident) =>
        incident.id === incidentId
    );


  if (index === -1) {

    return null;
  }


  incidents[index] = {

    ...incidents[index],

    ...updates

  };


  writeIncidents(
    incidents
  );


  return incidents[index];
}


/* =====================================================
   RESET STORAGE
===================================================== */

function resetStorage() {

  const storage =
    getStorage();


  storage.removeItem(
    STORAGE_KEYS.users
  );

  storage.removeItem(
    STORAGE_KEYS.incidents
  );
}


/* =====================================================
   ADMIN STATS
===================================================== */

function getAdminStats() {

  const users =
    readUsers();

  const incidents =
    readIncidents();


  const activeAlerts =
    incidents.filter(
      (incident) =>
        incident.type === 'sos' &&
        incident.status === 'active'
    );


  const resolvedAlerts =
    incidents.filter(
      (incident) =>
        incident.type === 'sos' &&
        (
          incident.status === 'resolved' ||
          incident.resolved === true
        )
    );


  return {

    userCount:
      users.length,

    incidentCount:
      incidents.length,

    activeAlerts:
      activeAlerts.length,

    resolvedAlerts:
      resolvedAlerts.length,

    lastIncident:
      incidents[0] || null

  };
}


/* =====================================================
   EXPORT
===================================================== */

export {

  addIncident,

  findActiveSOS,

  getAdminStats,

  readIncidents,

  readUsers,

  resetStorage,

  resolveActiveSOS,

  updateIncident,

  writeIncidents,

  writeUsers

};
