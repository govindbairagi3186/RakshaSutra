```javascript
const STORAGE_KEY = 'rakshasutra-users';

const memoryStore = {};


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
   READ USERS
===================================================== */

function readUsers() {

  try {

    const storage =
      getStorage();

    const raw =
      storage.getItem(
        STORAGE_KEY
      );


    if (!raw) {
      return [];
    }


    const users =
      JSON.parse(raw);


    return Array.isArray(users)
      ? users
      : [];

  } catch (error) {

    console.error(
      'Unable to read users:',
      error
    );

    return [];
  }
}


/* =====================================================
   WRITE USERS
===================================================== */

function writeUsers(users) {

  const storage =
    getStorage();


  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(users)
  );
}


/* =====================================================
   CREATE USER
===================================================== */

function createUser(profile) {

  if (!profile) {

    throw new Error(
      'User information is required.'
    );
  }


  const users =
    readUsers();


  const email =
    String(
      profile.email || ''
    )
      .trim()
      .toLowerCase();


  if (!email) {

    throw new Error(
      'Email address is required.'
    );
  }


  const existing =
    users.find(
      (user) =>
        String(
          user.email || ''
        )
          .trim()
          .toLowerCase() === email
    );


  if (existing) {

    throw new Error(
      'An account with this email already exists.'
    );
  }


  const user = {

    id:
      crypto.randomUUID(),

    ...profile,

    email,

    createdAt:
      new Date().toISOString(),

    passwordChangedAt:
      new Date().toISOString()

  };


  users.push(user);

  writeUsers(users);


  return user;
}


/* =====================================================
   AUTHENTICATE USER
===================================================== */

function authenticateUser(
  email,
  password
) {

  const users =
    readUsers();


  const normalizedEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();


  return (
    users.find(
      (user) =>
        String(
          user.email || ''
        )
          .trim()
          .toLowerCase() ===
          normalizedEmail &&

        String(
          user.password || ''
        ) ===
          String(password || '')
    ) || null
  );
}


/* =====================================================
   FIND USER BY EMAIL
===================================================== */

function findUserByEmail(email) {

  const users =
    readUsers();


  const normalizedEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();


  return (
    users.find(
      (user) =>
        String(
          user.email || ''
        )
          .trim()
          .toLowerCase() ===
          normalizedEmail
    ) || null
  );
}


/* =====================================================
   CHANGE PASSWORD
===================================================== */

function changePassword(
  userId,
  currentPassword,
  newPassword
) {

  if (!userId) {

    return {
      success: false,
      message:
        'User account could not be identified.'
    };
  }


  if (!currentPassword) {

    return {
      success: false,
      message:
        'Please enter your current password.'
    };
  }


  if (!newPassword) {

    return {
      success: false,
      message:
        'Please enter a new password.'
    };
  }


  if (newPassword.length < 6) {

    return {
      success: false,
      message:
        'New password must contain at least 6 characters.'
    };
  }


  if (
    currentPassword ===
    newPassword
  ) {

    return {
      success: false,
      message:
        'Your new password must be different from your current password.'
    };
  }


  const users =
    readUsers();


  const index =
    users.findIndex(
      (user) =>
        user.id === userId
    );


  if (index === -1) {

    return {
      success: false,
      message:
        'User account was not found.'
    };
  }


  const user =
    users[index];


  if (
    String(user.password || '') !==
    String(currentPassword)
  ) {

    return {
      success: false,
      message:
        'Current password is incorrect.'
    };
  }


  users[index] = {

    ...user,

    password:
      newPassword,

    passwordChangedAt:
      new Date().toISOString()

  };


  writeUsers(users);


  return {

    success: true,

    message:
      'Password changed successfully.',

    user:
      users[index]

  };
}


/* =====================================================
   RESET PASSWORD
   -----------------------------------------------------
   Zero-cost/local version.

   This does NOT send an email because the current app
   has no backend/email service.

   The function is intentionally separate from
   changePassword() so a real email verification flow
   can be added later without changing the rest of
   the authentication system.
===================================================== */

function resetPassword(
  email,
  newPassword,
  verificationValue
) {

  const normalizedEmail =
    String(
      email || ''
    )
      .trim()
      .toLowerCase();


  if (!normalizedEmail) {

    return {
      success: false,
      message:
        'Please enter your registered email.'
    };
  }


  if (!newPassword) {

    return {
      success: false,
      message:
        'Please enter a new password.'
    };
  }


  if (newPassword.length < 6) {

    return {
      success: false,
      message:
        'New password must contain at least 6 characters.'
    };
  }


  const users =
    readUsers();


  const index =
    users.findIndex(
      (user) =>
        String(
          user.email || ''
        )
          .trim()
          .toLowerCase() ===
          normalizedEmail
    );


  if (index === -1) {

    return {
      success: false,
      message:
        'No account was found with this email.'
    };
  }


  const user =
    users[index];


  /*
   * For the current zero-cost/local version,
   * verificationValue can be the user's mobile
   * number OR their trusted contact number.
   *
   * This is NOT equivalent to secure email
   * verification and should not be used as a
   * production authentication system.
   */

  const verification =
    String(
      verificationValue || ''
    )
      .replace(
        /[^0-9+]/g,
        ''
      );


  const phone =
    String(
      user.phone || ''
    )
      .replace(
        /[^0-9+]/g,
        ''
      );


  const guardianPhone =
    String(
      user.guardianPhone || ''
    )
      .replace(
        /[^0-9+]/g,
        ''
      );


  const trustedPhone =
    String(
      user.trustedPhone || ''
    )
      .replace(
        /[^0-9+]/g,
        ''
      );


  const verificationMatched =
    verification === phone ||
    verification === guardianPhone ||
    verification === trustedPhone;


  if (!verificationMatched) {

    return {
      success: false,
      message:
        'Verification information does not match this account.'
    };
  }


  users[index] = {

    ...user,

    password:
      newPassword,

    passwordChangedAt:
      new Date().toISOString()

  };


  writeUsers(users);


  return {

    success: true,

    message:
      'Password reset successfully.',

    user:
      users[index]

  };
}


/* =====================================================
   UPDATE USER
===================================================== */

function updateUser(
  userId,
  updates
) {

  if (!userId || !updates) {

    return {
      success: false,
      message:
        'Invalid account information.'
    };
  }


  const users =
    readUsers();


  const index =
    users.findIndex(
      (user) =>
        user.id === userId
    );


  if (index === -1) {

    return {
      success: false,
      message:
        'User account was not found.'
    };
  }


  const existingUser =
    users[index];


  /*
   * Prevent accidental password replacement
   * through updateUser().
   *
   * Password changes should always go through
   * changePassword() or resetPassword().
   */

  const safeUpdates = {
    ...updates
  };


  delete safeUpdates.password;


  users[index] = {

    ...existingUser,

    ...safeUpdates

  };


  writeUsers(users);


  return {

    success: true,

    message:
      'Account updated successfully.',

    user:
      users[index]

  };
}


/* =====================================================
   RESET ALL STORAGE
===================================================== */

function resetStorage() {

  const storage =
    getStorage();


  storage.removeItem(
    STORAGE_KEY
  );
}


/* =====================================================
   GLOBAL ACCESS
===================================================== */

if (
  typeof window !== 'undefined'
) {

  window.RakshaSutraAuth = {

    createUser,

    authenticateUser,

    findUserByEmail,

    changePassword,

    resetPassword,

    updateUser,

    resetStorage

  };
}


/* =====================================================
   EXPORTS
===================================================== */

export {

  createUser,

  authenticateUser,

  findUserByEmail,

  changePassword,

  resetPassword,

  updateUser,

  resetStorage

};
```
