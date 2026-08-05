import { addIncident, readIncidents, readUsers } from './dataStore.js';
import { importIncidents as importFromAdmin } from './admin.js';

importIncidents; // placeholder to re-export the same function name in case other modules depended on it

// Make import tolerant: accept array or { incidents: [...] }
export function importIncidentsFlexible(content) {
  const toImport = Array.isArray(content)
    ? content
    : (content && Array.isArray(content.incidents) ? content.incidents : []);
  return importFromAdmin(toImport);
}
