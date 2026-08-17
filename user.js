import { addIncident, readUsers } from './dataStore.js';

const $ = (id) => document.getElementById(id);

const SESSION_KEY = 'rakshasutra-current-user';
const SOS_DURATION = 5 * 60 * 1000;

const els = {
  sosBtn: $('sosBtn'),
  voiceBtn: $('voiceBtn'),
  callBtn: $('callBtn'),
  shareBtn: $('shareBtn'),
  scanBtn: $('scanBtn'),
  logoutBtn: $('logoutBtn'),

  userBadge: $('userBadge'),
  riskScore: $('riskScore'),
  locationText: $('locationText'),
  coordsText: $('coordsText'),
  statusNote: $('statusNote'),
  activityList: $('activityList'),
  toast: $('toast'),

  guardianName: $('guardianNameDisplay'),
  guardianPhone: $('guardianPhoneDisplay'),
  trustedName: $('trustedNameDisplay'),
  trustedPhone: $('trustedPhoneDisplay'),
  trustedAddress: $('trustedAddressDisplay'),

  guardianSmsBtn: $('guardianSmsBtn'),
  trustedSmsBtn: $('trustedSmsBtn'),

  emergencyModal: $('emergencyModal'),
  emergencySummary: $('emergencySummary'),
  closeEmergencyBtn: $('closeEmergencyBtn'),
  guardianEmergencySmsBtn: $('guardianEmergencySmsBtn'),
  trustedEmergencySmsBtn: $('trustedEmergencySmsBtn'),

  safeBtn: $('safeNowBtn'),
  sosTimer: $('sosTimer'),
  sosState: $('sosState'),

  callModal: $('callModal'),
  callName: $('callName'),
  callStatus: $('callStatus'),
  incomingCallScreen: $('incomingCallScreen'),
  pickupScreen: $('pickupScreen'),
  answerCallBtn: $('answerCallBtn'),
  declineCallBtn: $('declineCallBtn'),
  endCallBtn: $('endCallBtn')
};

let currentUser = null;
let lastPosition = null;

let sosActive = false;
let locationWatchId = null;

let sosStartedAt = null;
let sosTimerInterval = null;

let ringtoneTimer = null;
let audioContext = null;


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {
  if (!els.toast) return;

  els.toast.textContent = message;
  els.toast.classList.remove('hidden');

  window.clearTimeout(showToast.timer);

  showToast.timer = window.setTimeout(() => {
    els.toast.classList.add('hidden');
  }, 3200);
}


/* =====================================================
   ACTIVITY
===================================================== */

function addActivity(message) {
  if (!els.activityList) return;

  const item = document.createElement('li');

  item.textContent = message;

  els.activityList.prepend(item);
}


/* =====================================================
   SESSION
===================================================== */

function saveSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,

      guardianName: user.guardianName,
      guardianPhone: user.guardianPhone,

      trustedName: user.trustedName,
      trustedPhone: user.trustedPhone,

      trustedAddress: user.trustedAddress
    })
  );
}


function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) return null;

    const snapshot = JSON.parse(raw);

    const users = readUsers();

    const latest = users.find(
      (user) => user.id === snapshot.id
    );

    return latest || snapshot;

  } catch {
    return null;
  }
}


function requireLogin() {
  if (!currentUser) {
    window.location.href = 'login.html';
    return false;
  }

  return true;
}


/* =====================================================
   CONTACTS
===================================================== */

function contact(kind) {
  if (!currentUser) return null;

  if (kind === 'guardian') {
    return {
      name: currentUser.guardianName || 'Guardian',
      phone: currentUser.guardianPhone || ''
    };
  }

  return {
    name: currentUser.trustedName || 'Trusted Contact',
    phone: currentUser.trustedPhone || ''
  };
}


function cleanPhone(phone) {
  return String(phone || '').replace(/[^0-9+]/g, '');
}


/* =====================================================
   GPS
===================================================== */

function getPosition() {
  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject(
        new Error('GPS is not available in this browser.')
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}


function setPosition(position) {

  lastPosition = {
    latitude:
      Number(position.coords.latitude.toFixed(6)),

    longitude:
      Number(position.coords.longitude.toFixed(6)),

    accuracy:
      Math.round(position.coords.accuracy || 0),

    timestamp:
      new Date().toISOString()
  };


  if (els.locationText) {
    els.locationText.textContent =
      'LIVE GPS ACTIVE';
  }


  if (els.coordsText) {
    els.coordsText.textContent =
      `${lastPosition.latitude}, ${lastPosition.longitude} · ±${lastPosition.accuracy}m`;
  }
}


function mapsLink() {

  if (!lastPosition) {
    return '';
  }

  return `https://maps.google.com/?q=${lastPosition.latitude},${lastPosition.longitude}`;
}


/* =====================================================
   SOS MESSAGE
===================================================== */

function buildMessage() {

  return [
    '🚨 RAKSHASUTRA SOS ALERT',

    `${currentUser.fullName || 'User'} needs help.`,

    `Time: ${new Date().toLocaleString('en-IN')}`,

    lastPosition
      ? `Current location: ${mapsLink()}`
      : 'Location: GPS unavailable.',

    `GPS accuracy: ${lastPosition?.accuracy ?? 'unknown'}m`,

    'RakshaSutra SOS is active.',

    'Please contact the user immediately.'
  ].join('\n');
}


/* =====================================================
   SAFE MESSAGE
===================================================== */

function buildSafeMessage() {

  return [
    '🟢 RAKSHASUTRA SAFETY UPDATE',

    `${currentUser.fullName || 'The user'} has confirmed that they are safe.`,

    `Time: ${new Date().toLocaleString('en-IN')}`,

    'The RakshaSutra SOS session has been resolved.',

    'Location sharing has been stopped.',

    'No further action is required.'
  ].join('\n');
}


/* =====================================================
   SMS
===================================================== */

function smsTo(kind, message = buildMessage()) {

  const c = contact(kind);

  if (!c?.phone) {

    showToast(
      `${kind === 'guardian'
        ? 'Guardian'
        : 'Trusted contact'} phone number is not saved.`
    );

    return;
  }


  const body =
    encodeURIComponent(message);


  window.location.href =
    `sms:${cleanPhone(c.phone)}?body=${body}`;
}


/* =====================================================
   EMERGENCY MODAL
===================================================== */

function openEmergencyModal() {

  if (!els.emergencyModal) return;

  els.emergencySummary.textContent =
    lastPosition

      ? `SOS ACTIVE • GPS: ${lastPosition.latitude}, ${lastPosition.longitude} · ±${lastPosition.accuracy}m`

      : 'SOS ACTIVE • Waiting for GPS location.';


  els.emergencyModal.classList.remove('hidden');

  els.emergencyModal.setAttribute(
    'aria-hidden',
    'false'
  );
}


function closeEmergencyModal() {

  if (!els.emergencyModal) return;

  els.emergencyModal.classList.add('hidden');

  els.emergencyModal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/* =====================================================
   LIVE LOCATION WATCH
===================================================== */

function startLiveLocation() {

  if (
    !navigator.geolocation ||
    locationWatchId !== null
  ) {
    return;
  }


  locationWatchId =
    navigator.geolocation.watchPosition(

      (position) => {

        setPosition(position);

        if (sosActive) {

          if (els.sosState) {
            els.sosState.textContent =
              '🔴 SOS ACTIVE • LIVE GPS';
          }
        }
      },

      (error) => {

        console.warn(
          'Live GPS error:',
          error
        );
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );
}


function stopLiveLocation() {

  if (locationWatchId !== null) {

    navigator.geolocation.clearWatch(
      locationWatchId
    );

    locationWatchId = null;
  }
}


/* =====================================================
   5-MINUTE TIMER
===================================================== */

function formatTime(milliseconds) {

  const totalSeconds =
    Math.max(
      0,
      Math.ceil(milliseconds / 1000)
    );


  const minutes =
    Math.floor(totalSeconds / 60);


  const seconds =
    totalSeconds % 60;


  return (
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}`
  );
}


function updateSosTimer() {

  if (!sosActive || !sosStartedAt) {
    return;
  }


  const elapsed =
    Date.now() - sosStartedAt;


  const remaining =
    SOS_DURATION - elapsed;


  if (remaining > 0) {

    if (els.sosTimer) {

      els.sosTimer.textContent =
        `Safety confirmation available in ${formatTime(remaining)}`;
    }


    if (els.safeBtn) {

      els.safeBtn.disabled = true;

      els.safeBtn.textContent =
        `🟢 ARE YOU SAFE NOW? (${formatTime(remaining)})`;
    }


    return;
  }


  /* ---------------------------------------------
     FIVE MINUTES COMPLETED
  --------------------------------------------- */

  if (els.sosTimer) {

    els.sosTimer.textContent =
      '⚠️ 5 minutes completed — please confirm your safety.';
  }


  if (els.safeBtn) {

    els.safeBtn.disabled = false;

    els.safeBtn.textContent =
      '🟢 ARE YOU SAFE NOW?';
  }
}


function startSosTimer() {

  sosStartedAt = Date.now();


  window.clearInterval(
    sosTimerInterval
  );


  updateSosTimer();


  sosTimerInterval =
    window.setInterval(
      updateSosTimer,
      1000
    );
}


function stopSosTimer() {

  window.clearInterval(
    sosTimerInterval
  );

  sosTimerInterval = null;

  sosStartedAt = null;
}


/* =====================================================
   ACTIVATE SOS
===================================================== */

async function triggerSOS() {

  if (!requireLogin()) {
    return;
  }


  if (sosActive) {
    return;
  }


  els.sosBtn.disabled = true;

  els.sosBtn.textContent =
    '⏳ Activating SOS…';


  try {

    /* ---------------------------------------------
       GET FIRST GPS FIX
    --------------------------------------------- */

    try {

      const position =
        await getPosition();

      setPosition(position);

    } catch (error) {

      showToast(
        `GPS unavailable: ${error.message}`
      );

      addActivity(
        'SOS started without a fresh GPS fix.'
      );
    }


    /* ---------------------------------------------
       ACTIVATE SOS
    --------------------------------------------- */

    sosActive = true;


    /* ---------------------------------------------
       START LIVE GPS IMMEDIATELY
    --------------------------------------------- */

    startLiveLocation();


    /* ---------------------------------------------
       START 5-MINUTE SAFETY TIMER
    --------------------------------------------- */

    startSosTimer();


    /* ---------------------------------------------
       UPDATE UI
    --------------------------------------------- */

    els.sosBtn.textContent =
      '🛑 SOS ACTIVE';


    els.statusNote.textContent =
      '🚨 SOS ACTIVE. Live GPS tracking is running.';


    if (els.sosState) {

      els.sosState.textContent =
        '🔴 SOS ACTIVE • LIVE GPS';
    }


    /* ---------------------------------------------
       RECORD INCIDENT
    --------------------------------------------- */

    addIncident({

      type: 'sos',

      message:
        'SOS activated. Live GPS session started.',

      latitude:
        lastPosition?.latitude ?? null,

      longitude:
        lastPosition?.longitude ?? null,

      status:
        'active',

      startedAt:
        new Date().toISOString()
    });


    addActivity(
      '🚨 SOS activated. Live GPS session started.'
    );


    /* ---------------------------------------------
       PREPARE SOS SMS
    --------------------------------------------- */

    showToast(
      'SOS active. Send the prepared SOS message to trusted contacts.'
    );


    /* ---------------------------------------------
       OPEN EMERGENCY CENTER
    --------------------------------------------- */

    openEmergencyModal();


  } finally {

    els.sosBtn.disabled = false;
  }
}


/* =====================================================
   CONFIRM USER IS SAFE
===================================================== */

function confirmSafe() {

  if (!sosActive) {

    showToast(
      'There is no active SOS session.'
    );

    return;
  }


  const elapsed =
    Date.now() - sosStartedAt;


  /* ---------------------------------------------
     REQUIRE FIVE MINUTES
  --------------------------------------------- */

  if (elapsed < SOS_DURATION) {

    const remaining =
      SOS_DURATION - elapsed;


    showToast(
      `Please wait ${formatTime(remaining)} before confirming safety.`
    );

    return;
  }


  /* ---------------------------------------------
     STOP LIVE GPS
  --------------------------------------------- */

  stopLiveLocation();


  /* ---------------------------------------------
     STOP TIMER
  --------------------------------------------- */

  stopSosTimer();


  /* ---------------------------------------------
     CHANGE SOS STATE
  --------------------------------------------- */

  sosActive = false;


  /* ---------------------------------------------
     UPDATE BUTTON
  --------------------------------------------- */

  els.sosBtn.textContent =
    '🚨 One-Tap SOS';


  /* ---------------------------------------------
     UPDATE STATUS
  --------------------------------------------- */

  els.statusNote.textContent =
    '🟢 You are safe. SOS resolved and live location sharing stopped.';


  if (els.sosState) {

    els.sosState.textContent =
      '🟢 YOU ARE SAFE';
  }


  if (els.sosTimer) {

    els.sosTimer.textContent =
      'SOS resolved. Live location sharing stopped.';
  }


  if (els.safeBtn) {

    els.safeBtn.disabled = true;

    els.safeBtn.textContent =
      '🟢 YOU ARE SAFE';
  }


  /* ---------------------------------------------
     RECORD RESOLUTION
  --------------------------------------------- */

  addIncident({

    type:
      'sos-resolved',

    message:
      'User confirmed they are safe. Live GPS stopped.',

    latitude:
      lastPosition?.latitude ?? null,

    longitude:
      lastPosition?.longitude ?? null,

    status:
      'resolved',

    resolvedAt:
      new Date().toISOString()
  });


  addActivity(
    '🟢 Safety confirmed. Live GPS stopped.'
  );


  /* ---------------------------------------------
     NOTIFY TRUSTED CONTACTS
  --------------------------------------------- */

  showToast(
    'You are safe. Prepare the safety confirmation message for your trusted contacts.'
  );


  /*
   * We intentionally use the phone's SMS composer here.
   * A browser cannot silently send SMS messages without
   * user permission.
   */

  smsTo(
    'guardian',
    buildSafeMessage()
  );
}


/* =====================================================
   STOP SOS MANUALLY
===================================================== */

function stopSOS() {

  if (!sosActive) {
    return;
  }


  stopLiveLocation();

  stopSosTimer();

  sosActive = false;


  els.sosBtn.textContent =
    '🚨 One-Tap SOS';


  els.statusNote.textContent =
    'SOS stopped on this device.';


  if (els.sosState) {

    els.sosState.textContent =
      'SOS STOPPED';
  }


  if (els.sosTimer) {

    els.sosTimer.textContent =
      'SOS stopped.';
  }


  if (els.safeBtn) {

    els.safeBtn.disabled = true;

    els.safeBtn.textContent =
      '🟢 ARE YOU SAFE NOW?';
  }


  addIncident({

    type:
      'sos-stop',

    message:
      'SOS manually stopped on the device.',

    status:
      'stopped',

    stoppedAt:
      new Date().toISOString()
  });


  addActivity(
    'SOS manually stopped.'
  );
}


/* =====================================================
   EMERGENCY CALL
===================================================== */

function emergencyVoiceCall() {

  if (!requireLogin()) {
    return;
  }


  const c =
    contact('guardian');


  if (!c?.phone) {

    showToast(
      'Guardian phone number is not saved.'
    );

    return;
  }


  window.location.href =
    `tel:${cleanPhone(c.phone)}`;
}


/* =====================================================
   FAKE CALL RINGTONE
===================================================== */

function playRingtone() {

  stopRingtone();


  if (navigator.vibrate) {

    navigator.vibrate(
      [350, 180, 350, 180, 350, 180, 350]
    );
  }


  try {

    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();


    const beep = () => {

      if (!audioContext) {
        return;
      }


      const osc =
        audioContext.createOscillator();


      const gain =
        audioContext.createGain();


      osc.frequency.value = 880;

      gain.gain.value = 0.045;


      osc.connect(gain);

      gain.connect(
        audioContext.destination
      );


      osc.start();

      osc.stop(
        audioContext.currentTime + 0.25
      );
    };


    beep();


    ringtoneTimer =
      window.setInterval(
        beep,
        1200
      );

  } catch {
    // Browser may block synthesized audio.
  }
}


function stopRingtone() {

  if (ringtoneTimer) {

    window.clearInterval(
      ringtoneTimer
    );

    ringtoneTimer = null;
  }


  if (audioContext) {

    audioContext
      .close()
      .catch(() => {});

    audioContext = null;
  }


  if (navigator.vibrate) {

    navigator.vibrate(0);
  }
}


/* =====================================================
   FAKE CALL
===================================================== */

function openFakeCall() {

  if (!requireLogin()) {
    return;
  }


  const c =
    contact('guardian') || {
      name: 'Trusted Contact'
    };


  els.callName.textContent =
    c.name || 'Trusted Contact';


  els.callStatus.textContent =
    'Ringing…';


  els.incomingCallScreen.hidden =
    false;


  els.pickupScreen.hidden =
    true;


  els.callModal.classList.remove(
    'hidden'
  );


  els.callModal.setAttribute(
    'aria-hidden',
    'false'
  );


  playRingtone();
}


function answerFakeCall() {

  stopRingtone();


  els.incomingCallScreen.hidden =
    true;


  els.pickupScreen.hidden =
    false;


  els.callStatus.textContent =
    'Connected';


  addActivity(
    'Fake safety call answered.'
  );
}


function closeFakeCall() {

  stopRingtone();


  els.callModal.classList.add(
    'hidden'
  );


  els.callModal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/* =====================================================
   RENDER USER
===================================================== */

function renderUser() {

  els.userBadge.textContent =
    `Welcome, ${
      currentUser.fullName?.split(' ')[0] ||
      'User'
    }`;


  els.guardianName.textContent =
    currentUser.guardianName || '—';


  els.guardianPhone.textContent =
    currentUser.guardianPhone || '—';


  els.trustedName.textContent =
    currentUser.trustedName || '—';


  els.trustedPhone.textContent =
    currentUser.trustedPhone || '—';


  els.trustedAddress.textContent =
    currentUser.trustedAddress || '—';


  els.statusNote.textContent =
    'Account active. Your emergency controls are ready.';
}


/* =====================================================
   EVENT LISTENERS
===================================================== */

els.sosBtn.addEventListener(
  'click',
  () => {

    if (sosActive) {

      stopSOS();

    } else {

      triggerSOS();
    }
  }
);


els.safeBtn?.addEventListener(
  'click',
  confirmSafe
);


els.voiceBtn.addEventListener(
  'click',
  emergencyVoiceCall
);


els.callBtn.addEventListener(
  'click',
  openFakeCall
);


els.shareBtn.addEventListener(
  'click',
  async () => {

    if (!requireLogin()) {
      return;
    }


    try {

      setPosition(
        await getPosition()
      );


      addIncident({

        type:
          'location-share',

        message:
          'Location SMS prepared.',

        latitude:
          lastPosition.latitude,

        longitude:
          lastPosition.longitude,

        status:
          'prepared'
      });


      addActivity(
        'Location SMS prepared.'
      );


      smsTo('guardian');

    } catch (error) {

      showToast(
        `GPS unavailable: ${error.message}`
      );
    }
  }
);


els.guardianSmsBtn.addEventListener(
  'click',
  () => smsTo('guardian')
);


els.trustedSmsBtn.addEventListener(
  'click',
  () => smsTo('trusted')
);


els.guardianEmergencySmsBtn.addEventListener(
  'click',
  () => smsTo('guardian')
);


els.trustedEmergencySmsBtn.addEventListener(
  'click',
  () => smsTo('trusted')
);


els.closeEmergencyBtn.addEventListener(
  'click',
  closeEmergencyModal
);


els.declineCallBtn.addEventListener(
  'click',
  closeFakeCall
);


els.answerCallBtn.addEventListener(
  'click',
  answerFakeCall
);


els.endCallBtn.addEventListener(
  'click',
  closeFakeCall
);


els.scanBtn.addEventListener(
  'click',
  () => {

    if (!requireLogin()) {
      return;
    }


    const score =
      Number(
        els.riskScore.textContent || 24
      );


    els.riskScore.textContent =
      String(
        Math.min(
          100,
          score + 5
        )
      );


    addIncident({

      type:
        'scan',

      message:
        'Safety scan completed.'
    });


    addActivity(
      'Safety scan completed.'
    );


    showToast(
      'Safety scan complete.'
    );
  }
);


/* =====================================================
   LOGOUT
===================================================== */

els.logoutBtn.addEventListener(
  'click',
  () => {

    stopLiveLocation();

    stopSosTimer();

    stopRingtone();

    localStorage.removeItem(
      SESSION_KEY
    );

    window.location.href =
      'login.html';
  }
);


/* =====================================================
   INITIALIZE
===================================================== */

currentUser =
  loadSession();


if (!currentUser) {

  window.location.replace(
    'login.html'
  );

} else {

  renderUser();
}



/* =====================================================
   RAKSHASUTRA SETTINGS FIXES
   Safe event binding + password change
===================================================== */

function on(element, eventName, handler) {
  if (!element) return;
  element.addEventListener(eventName, handler);
}

function setPasswordMessage(message, success = false) {
  const messageEl = document.getElementById('changePasswordMessage');
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.style.color = success ? '#38d996' : '#ff7188';
}

function setupPasswordControls() {
  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-password-toggle');
      const input = document.getElementById(id);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.textContent = showing ? '👁️' : '🙈';
      button.setAttribute(
        'aria-label',
        showing ? 'Show password' : 'Hide password'
      );
    });
  });

  const form = document.getElementById('changePasswordForm');
  const clearBtn = document.getElementById('clearPasswordFormBtn');

  on(form, 'submit', (event) => {
    event.preventDefault();

    if (!requireLogin()) return;

    const current = document.getElementById('currentPassword')?.value || '';
    const next = document.getElementById('newPassword')?.value || '';
    const confirm = document.getElementById('confirmNewPassword')?.value || '';

    if (!current || !next || !confirm) {
      setPasswordMessage('Please fill in all password fields.');
      return;
    }

    if (next.length < 6) {
      setPasswordMessage('New password must contain at least 6 characters.');
      return;
    }

    if (next !== confirm) {
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }

    const users = readUsers();
    const index = users.findIndex((user) => user.id === currentUser.id);

    if (index === -1) {
      setPasswordMessage('Your account could not be found.');
      return;
    }

    if (String(users[index].password || '') !== String(current)) {
      setPasswordMessage('Current password is incorrect.');
      return;
    }

    users[index] = {
      ...users[index],
      password: next,
      passwordChangedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('rakshasutra-users', JSON.stringify(users));
      currentUser = users[index];
      saveSession(currentUser);

      form.reset();
      setPasswordMessage('Password changed successfully.', true);
      showToast('Password changed successfully.');
      addActivity('🔐 Account password was changed.');
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordMessage('Could not save the new password.');
    }
  });

  on(clearBtn, 'click', () => {
    form?.reset();
    setPasswordMessage('');
  });
}

/* Re-bind settings safely after the original dashboard has initialized. */
setupPasswordControls();

/* =====================================================
   RAKSHASUTRA PROFILE & SETTINGS
   ADD THIS CODE AT THE END OF user.js
===================================================== */

const profileEls = {
  profileButton: document.getElementById('profileButton'),
  profileDropdown: document.getElementById('profileDropdown'),

  profileAvatarText: document.getElementById('profileAvatarText'),
  profileDropdownAvatar: document.getElementById('profileDropdownAvatar'),
  profileDropdownName: document.getElementById('profileDropdownName'),
  profileDropdownEmail: document.getElementById('profileDropdownEmail'),

  profileInfoBtn: document.getElementById('profileInfoBtn'),
  editProfileBtn: document.getElementById('editProfileBtn'),
  changePasswordMenuBtn: document.getElementById('changePasswordMenuBtn'),
  themeMenuBtn: document.getElementById('themeMenuBtn'),
  rateAppBtn: document.getElementById('rateAppBtn'),

  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),

  settingsProfileName: document.getElementById('settingsProfileName'),
  settingsProfileEmail: document.getElementById('settingsProfileEmail'),
  settingsProfilePhone: document.getElementById('settingsProfilePhone'),
  settingsGuardianName: document.getElementById('settingsGuardianName'),
  settingsTrustedName: document.getElementById('settingsTrustedName'),
  settingsSafeAddress: document.getElementById('settingsSafeAddress'),

  editProfileSection: document.getElementById('editProfileSection'),
  editProfileForm: document.getElementById('editProfileForm'),
  editProfileMessage: document.getElementById('editProfileMessage'),

  editName: document.getElementById('editName'),
  editEmail: document.getElementById('editEmail'),
  editPhone: document.getElementById('editPhone'),
  editGuardianName: document.getElementById('editGuardianName'),
  editGuardianPhone: document.getElementById('editGuardianPhone'),
  editTrustedName: document.getElementById('editTrustedName'),
  editTrustedPhone: document.getElementById('editTrustedPhone'),
  editSafeAddress: document.getElementById('editSafeAddress'),

  themeSection: document.getElementById('themeSection'),
  themeOptions: document.querySelectorAll('.theme-option'),

  ratingStars: document.querySelectorAll('.rating-star'),
  ratingMessage: document.getElementById('ratingMessage'),

  openPasswordSectionBtn:
    document.getElementById('openPasswordSectionBtn'),

  settingsPasswordSection:
    document.getElementById('settingsPasswordSection'),

  securitySection:
    document.getElementById('securitySection')
};


/* =====================================================
   SETTINGS STORAGE
===================================================== */

const SETTINGS_THEME_KEY =
  'rakshasutra-theme';

const SETTINGS_RATING_KEY =
  'rakshasutra-rating';


/* =====================================================
   PROFILE MENU
===================================================== */

function toggleProfileMenu() {
  if (!profileEls.profileDropdown) return;

  const isOpen =
    profileEls.profileDropdown.classList.toggle('open');

  if (profileEls.profileButton) {
    profileEls.profileButton.setAttribute(
      'aria-expanded',
      String(isOpen)
    );
  }
}


function closeProfileMenu() {
  if (!profileEls.profileDropdown) return;

  profileEls.profileDropdown.classList.remove('open');

  if (profileEls.profileButton) {
    profileEls.profileButton.setAttribute(
      'aria-expanded',
      'false'
    );
  }
}


/* =====================================================
   SETTINGS MODAL
===================================================== */

function openSettings(section = 'profile') {
  if (!requireLogin()) return;

  closeProfileMenu();

  if (!profileEls.settingsModal) return;

  profileEls.settingsModal.classList.add('open');

  profileEls.settingsModal.setAttribute(
    'aria-hidden',
    'false'
  );

  renderSettingsProfile();
  fillEditProfileForm();
  loadSavedRating();
  applySavedTheme();

  setTimeout(() => {
    const target =
      document.getElementById(
        section === 'edit'
          ? 'editProfileSection'
          : section === 'password'
            ? 'settingsPasswordSection'
            : section === 'theme'
              ? 'themeSection'
              : section === 'rating'
                ? 'ratingSection'
                : 'profileInfoSection'
      );

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, 50);
}


function closeSettings() {
  if (!profileEls.settingsModal) return;

  profileEls.settingsModal.classList.remove('open');

  profileEls.settingsModal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/* =====================================================
   PROFILE AVATAR
===================================================== */

function getProfilePhoto(user) {
  if (!user) return '';

  return (
    user.profilePhoto ||
    user.avatar ||
    user.photoURL ||
    user.photo ||
    ''
  );
}


function renderProfileAvatar() {
  if (!currentUser) return;

  const photo =
    getProfilePhoto(currentUser);

  if (
    profileEls.profileAvatarText
  ) {
    if (photo) {
      profileEls.profileAvatarText.innerHTML =
        '';

      const img =
        document.createElement('img');

      img.src = photo;
      img.alt = 'Profile photo';

      profileEls.profileAvatarText.appendChild(
        img
      );
    } else {
      profileEls.profileAvatarText.textContent =
        '👤';
    }
  }

  if (
    profileEls.profileDropdownAvatar
  ) {
    if (photo) {
      profileEls.profileDropdownAvatar.innerHTML =
        '';

      const img =
        document.createElement('img');

      img.src = photo;
      img.alt = 'Profile photo';

      profileEls.profileDropdownAvatar.appendChild(
        img
      );
    } else {
      profileEls.profileDropdownAvatar.textContent =
        '👤';
    }
  }
}


/* =====================================================
   PROFILE INFORMATION
===================================================== */

function renderSettingsProfile() {
  if (!currentUser) return;

  if (
    profileEls.profileDropdownName
  ) {
    profileEls.profileDropdownName.textContent =
      currentUser.fullName ||
      currentUser.name ||
      'User';
  }

  if (
    profileEls.profileDropdownEmail
  ) {
    profileEls.profileDropdownEmail.textContent =
      currentUser.email ||
      'No email available';
  }

  if (
    profileEls.settingsProfileName
  ) {
    profileEls.settingsProfileName.textContent =
      currentUser.fullName ||
      currentUser.name ||
      '—';
  }

  if (
    profileEls.settingsProfileEmail
  ) {
    profileEls.settingsProfileEmail.textContent =
      currentUser.email ||
      '—';
  }

  if (
    profileEls.settingsProfilePhone
  ) {
    profileEls.settingsProfilePhone.textContent =
      currentUser.phone ||
      '—';
  }

  if (
    profileEls.settingsGuardianName
  ) {
    profileEls.settingsGuardianName.textContent =
      currentUser.guardianName ||
      '—';
  }

  if (
    profileEls.settingsTrustedName
  ) {
    profileEls.settingsTrustedName.textContent =
      currentUser.trustedName ||
      '—';
  }

  if (
    profileEls.settingsSafeAddress
  ) {
    profileEls.settingsSafeAddress.textContent =
      currentUser.trustedAddress ||
      '—';
  }

  renderProfileAvatar();
}


/* =====================================================
   EDIT PROFILE FORM
===================================================== */

function fillEditProfileForm() {
  if (!currentUser) return;

  if (profileEls.editName) {
    profileEls.editName.value =
      currentUser.fullName ||
      currentUser.name ||
      '';
  }

  if (profileEls.editEmail) {
    profileEls.editEmail.value =
      currentUser.email ||
      '';
  }

  if (profileEls.editPhone) {
    profileEls.editPhone.value =
      currentUser.phone ||
      '';
  }

  if (profileEls.editGuardianName) {
    profileEls.editGuardianName.value =
      currentUser.guardianName ||
      '';
  }

  if (profileEls.editGuardianPhone) {
    profileEls.editGuardianPhone.value =
      currentUser.guardianPhone ||
      '';
  }

  if (profileEls.editTrustedName) {
    profileEls.editTrustedName.value =
      currentUser.trustedName ||
      '';
  }

  if (profileEls.editTrustedPhone) {
    profileEls.editTrustedPhone.value =
      currentUser.trustedPhone ||
      '';
  }

  if (profileEls.editSafeAddress) {
    profileEls.editSafeAddress.value =
      currentUser.trustedAddress ||
      '';
  }
}


function setEditProfileMessage(
  message,
  success = false
) {
  if (!profileEls.editProfileMessage) {
    return;
  }

  profileEls.editProfileMessage.textContent =
    message;

  profileEls.editProfileMessage.style.color =
    success
      ? '#22c55e'
      : '#ef4444';
}


function saveEditedProfile(event) {
  event.preventDefault();

  if (!requireLogin()) return;

  const fullName =
    profileEls.editName?.value.trim() || '';

  const email =
    profileEls.editEmail?.value.trim() || '';

  const phone =
    profileEls.editPhone?.value.trim() || '';

  const guardianName =
    profileEls.editGuardianName?.value.trim() || '';

  const guardianPhone =
    profileEls.editGuardianPhone?.value.trim() || '';

  const trustedName =
    profileEls.editTrustedName?.value.trim() || '';

  const trustedPhone =
    profileEls.editTrustedPhone?.value.trim() || '';

  const trustedAddress =
    profileEls.editSafeAddress?.value.trim() || '';

  if (!fullName) {
    setEditProfileMessage(
      'Please enter your full name.'
    );

    return;
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setEditProfileMessage(
      'Please enter a valid email address.'
    );

    return;
  }

  const users =
    readUsers();

  if (!Array.isArray(users)) {
    setEditProfileMessage(
      'Unable to access account data.'
    );

    return;
  }

  const index =
    users.findIndex(
      (user) =>
        user.id === currentUser.id
    );

  if (index === -1) {
    setEditProfileMessage(
      'Your account could not be found.'
    );

    return;
  }

  const updatedUser = {
    ...users[index],

    fullName,
    email,
    phone,

    guardianName,
    guardianPhone,

    trustedName,
    trustedPhone,

    trustedAddress
  };

  users[index] =
    updatedUser;

  try {
    localStorage.setItem(
      'rakshasutra-users',
      JSON.stringify(users)
    );

    currentUser =
      updatedUser;

    saveSession(
      currentUser
    );

    renderUser();
    renderSettingsProfile();

    setEditProfileMessage(
      'Profile updated successfully.',
      true
    );

    showToast(
      'Profile updated successfully.'
    );

    addActivity(
      '👤 Profile information was updated.'
    );

  } catch (error) {
    console.error(
      'Profile update error:',
      error
    );

    setEditProfileMessage(
      'Could not save profile changes.'
    );
  }
}


/* =====================================================
   THEME
===================================================== */

function applyTheme(theme) {
  if (
    theme !== 'dark' &&
    theme !== 'light' &&
    theme !== 'system'
  ) {
    theme = 'dark';
  }

  document.documentElement.setAttribute(
    'data-theme',
    theme
  );

  document.body.setAttribute(
    'data-theme',
    theme
  );

  try {
    localStorage.setItem(
      SETTINGS_THEME_KEY,
      theme
    );
  } catch (error) {
    console.warn(
      'Could not save theme:',
      error
    );
  }

  updateThemeButtons(
    theme
  );
}


function getSavedTheme() {
  try {
    return (
      localStorage.getItem(
        SETTINGS_THEME_KEY
      ) ||
      'dark'
    );
  } catch {
    return 'dark';
  }
}


function applySavedTheme() {
  applyTheme(
    getSavedTheme()
  );
}


function updateThemeButtons(theme) {
  if (!profileEls.themeOptions) {
    return;
  }

  profileEls.themeOptions.forEach(
    (button) => {
      const buttonTheme =
        button.dataset.theme;

      button.classList.toggle(
        'active',
        buttonTheme === theme
      );
    }
  );
}


function setupThemeButtons() {
  if (!profileEls.themeOptions) {
    return;
  }

  profileEls.themeOptions.forEach(
    (button) => {
      button.addEventListener(
        'click',
        () => {
          const theme =
            button.dataset.theme;

          applyTheme(theme);

          showToast(
            `Theme changed to ${
              theme.charAt(0).toUpperCase() +
              theme.slice(1)
            }.`
          );
        }
      );
    }
  );
}


/* =====================================================
   RATING
===================================================== */

function updateRatingStars(rating) {
  if (!profileEls.ratingStars) {
    return;
  }

  profileEls.ratingStars.forEach(
    (star) => {
      const value =
        Number(
          star.dataset.rating
        );

      star.classList.toggle(
        'active',
        value <= rating
      );
    }
  );
}


function saveRating(rating) {
  try {
    localStorage.setItem(
      SETTINGS_RATING_KEY,
      String(rating)
    );
  } catch (error) {
    console.warn(
      'Could not save rating:',
      error
    );
  }

  updateRatingStars(
    rating
  );

  if (profileEls.ratingMessage) {
    profileEls.ratingMessage.textContent =
      `Thank you! You rated RakshaSutra ${rating}/5.`;

    profileEls.ratingMessage.style.color =
      '#22c55e';
  }

  showToast(
    `Thanks for rating RakshaSutra ${rating}/5 ⭐`
  );
}


function loadSavedRating() {
  let rating = 0;

  try {
    rating =
      Number(
        localStorage.getItem(
          SETTINGS_RATING_KEY
        ) || 0
      );
  } catch {
    rating = 0;
  }

  updateRatingStars(
    rating
  );
}


function setupRating() {
  if (!profileEls.ratingStars) {
    return;
  }

  profileEls.ratingStars.forEach(
    (star) => {
      star.addEventListener(
        'click',
        () => {
          const rating =
            Number(
              star.dataset.rating
            );

          saveRating(
            rating
          );
        }
      );
    }
  );
}


/* =====================================================
   PASSWORD MENU
===================================================== */

function openPasswordFromSettings() {
  closeProfileMenu();
  closeSettings();

  setTimeout(() => {
    const security = document.getElementById('securitySection');
    if (security) {
      security.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    const passwordInput = document.getElementById('currentPassword');
    if (passwordInput) {
      setTimeout(() => passwordInput.focus(), 250);
    }
  }, 50);
}


/* =====================================================
   SETTINGS EVENTS
===================================================== */

function setupProfileSettings() {

  on(
    profileEls.profileButton,
    'click',
    (event) => {
      event.stopPropagation();

      toggleProfileMenu();
    }
  );


  on(
    profileEls.profileInfoBtn,
    'click',
    () => {
      openSettings(
        'profile'
      );
    }
  );


  on(
    profileEls.editProfileBtn,
    'click',
    () => {
      openSettings(
        'edit'
      );
    }
  );


  on(
    profileEls.changePasswordMenuBtn,
    'click',
    () => {
      openPasswordFromSettings();
    }
  );


  on(
    profileEls.themeMenuBtn,
    'click',
    () => {
      openSettings(
        'theme'
      );
    }
  );


  on(
    profileEls.rateAppBtn,
    'click',
    () => {
      openSettings(
        'rating'
      );
    }
  );


  on(
    profileEls.closeSettingsBtn,
    'click',
    closeSettings
  );


  on(
    profileEls.settingsModal,
    'click',
    (event) => {
      if (
        event.target ===
        profileEls.settingsModal
      ) {
        closeSettings();
      }
    }
  );


  on(
    profileEls.editProfileForm,
    'submit',
    saveEditedProfile
  );


  on(
    profileEls.openPasswordSectionBtn,
    'click',
    openPasswordFromSettings
  );


  document.addEventListener(
    'click',
    (event) => {

      if (
        !profileEls.profileDropdown ||
        !profileEls.profileButton
      ) {
        return;
      }

      const clickedInside =
        profileEls.profileDropdown.contains(
          event.target
        ) ||
        profileEls.profileButton.contains(
          event.target
        );

      if (!clickedInside) {
        closeProfileMenu();
      }
    }
  );


  document.addEventListener(
    'keydown',
    (event) => {

      if (
        event.key === 'Escape'
      ) {
        closeProfileMenu();
        closeSettings();
      }

    }
  );

}


/* =====================================================
   START PROFILE SETTINGS
===================================================== */

setupProfileSettings();
setupThemeButtons();
setupRating();
applySavedTheme();

if (currentUser) {
  renderSettingsProfile();
  fillEditProfileForm();
}
