const STORAGE_KEY = 'rakshasutra-users';

const memoryStore = {};

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }

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
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  const storage = getStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function createUser(profile) {
  const users = readUsers();
  const existing = users.find((user) => user.email.toLowerCase() === profile.email.toLowerCase());

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const user = {
    id: crypto.randomUUID(),
    ...profile,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeUsers(users);
  return user;
}

function authenticateUser(email, password) {
  const users = readUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password) || null;
}

function resetStorage() {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEY);
}

if (typeof window !== 'undefined') {
  window.RakshaSutraAuth = {
    createUser,
    authenticateUser,
    resetStorage
  };
}

export { createUser, authenticateUser, resetStorage };
