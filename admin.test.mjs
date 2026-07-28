import test from 'node:test';
import assert from 'node:assert/strict';

import { authenticateAdmin, importIncidents, resetAdminState, setAdminCredentials } from './admin.js';
import { resetStorage } from './dataStore.js';

test('authenticates the default admin account', () => {
  resetStorage();
  resetAdminState();
  assert.equal(authenticateAdmin('govind', 'govindraksha1'), true);
  assert.equal(authenticateAdmin('govind', 'wrong-password'), false);
});

test('imports incident data into the shared store', () => {
  resetStorage();
  resetAdminState();

  const imported = importIncidents([
    { type: 'sos', message: 'Emergency triggered' },
    { type: 'voice', message: 'Voice help requested' }
  ]);

  assert.equal(imported, 2);
  assert.equal(authenticateAdmin('govind', 'govindraksha1'), true);
});
