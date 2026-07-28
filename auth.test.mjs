import test from 'node:test';
import assert from 'node:assert/strict';

import { createUser, authenticateUser, resetStorage } from './auth.js';

test('creates a new user account and authenticates it', () => {
  resetStorage();

  const profile = {
    fullName: 'Asha Rao',
    email: 'asha@example.com',
    phone: '+91-99999-00000',
    password: 'SafePass123',
    guardianName: 'Nikhil Rao',
    guardianPhone: '+91-88888-00000',
    trustedName: 'Priya',
    trustedAddress: '12, Gulmohar Lane',
    trustedPhone: '+91-77777-00000'
  };

  const created = createUser(profile);
  assert.ok(created.id);
  assert.equal(created.email, profile.email);

  const authenticated = authenticateUser(profile.email, profile.password);
  assert.ok(authenticated);
  assert.equal(authenticated.fullName, profile.fullName);
});

test('rejects invalid login credentials', () => {
  resetStorage();
  createUser({
    fullName: 'Ravi',
    email: 'ravi@example.com',
    phone: '+91-11111-11111',
    password: 'StrongPass1',
    guardianName: 'Meera',
    guardianPhone: '+91-22222-22222',
    trustedName: 'Arun',
    trustedAddress: '1, Main Road',
    trustedPhone: '+91-33333-33333'
  });

  assert.equal(authenticateUser('ravi@example.com', 'wrong-password'), null);
});
