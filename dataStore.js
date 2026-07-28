const STORAGE_KEYS = {
  users: 'rakshasutra-users',
  incidents: 'rakshasutra-incidents'
};

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  const memoryStore = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    },
    setItem(key, value) {
      memoryStore[key] = String(value);
    },
    removeItem(key) {
      delete memoryStore[key];
    }
  };
}

function readUsers() {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEYS.users);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  const storage = getStorage();
  storage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function readIncidents() {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEYS.incidents);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIncidents(incidents) {
  const storage = getStorage();
  storage.setItem(STORAGE_KEYS.incidents, JSON.stringify(incidents));
}

function addIncident(entry) {
  const incidents = readIncidents();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry
  };
  incidents.unshift(record);
  writeIncidents(incidents);
  return record;
}

function resetStorage() {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEYS.users);
  storage.removeItem(STORAGE_KEYS.incidents);
}

function getAdminStats() {
  const users = readUsers();
  const incidents = readIncidents();
  const activeAlerts = incidents.filter((incident) => incident.type === 'sos').length;
  const lastIncident = incidents[0];

  return {
    userCount: users.length,
    incidentCount: incidents.length,
    activeAlerts,
    lastIncident
  };
}

export {
  addIncident,
  getAdminStats,
  readIncidents,
  readUsers,
  resetStorage,
  writeIncidents,
  writeUsers
};
