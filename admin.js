import { addIncident, readIncidents, readUsers, resetStorage } from './dataStore.js';

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'raksha2026'
};

let adminCredentials = { ...DEFAULT_ADMIN };

function setAdminCredentials(username, password) {
  adminCredentials = { username, password };
}

function authenticateAdmin(username, password) {
  return username === adminCredentials.username && password === adminCredentials.password;
}

function importIncidents(entries) {
  entries.forEach((entry) => {
    addIncident({
      type: entry.type || 'unknown',
      message: entry.message || 'Imported incident',
      source: 'import'
    });
  });
  return entries.length;
}

function exportIncidents() {
  const incidents = readIncidents();
  return JSON.stringify(incidents, null, 2);
}

function getAdminOverview() {
  const users = readUsers();
  const incidents = readIncidents();
  return {
    userCount: users.length,
    incidentCount: incidents.length,
    activeAlerts: incidents.filter((incident) => incident.type === 'sos').length,
    latestIncident: incidents[0] || null
  };
}

function resetAdminState() {
  setAdminCredentials(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password);
}

export {
  authenticateAdmin,
  exportIncidents,
  getAdminOverview,
  importIncidents,
  resetAdminState,
  setAdminCredentials
};
