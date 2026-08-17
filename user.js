import {
  addIncident,
  readUsers,
  findActiveSOS,
  resolveActiveSOS
} from './dataStore.js';

/* =====================================================
   RAKSHASUTRA USER APP
   FULL REPLACEMENT FILE
===================================================== */

const SESSION_KEY = 'rakshasutra-current-user';
const SOS_DURATION = 5 * 60 * 1000;

const $ = (id) => document.getElementById(id);

/* =====================================================
   ELEMENTS
===================================================== */

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
  endCallBtn: $('endCallBtn'),

  changePasswordForm: $('changePasswordForm'),
  currentPassword: $('currentPassword'),
  newPassword: $('newPassword'),
  confirmNewPassword: $('confirmNewPassword'),
  changePasswordMessage: $('changePasswordMessage'),
  clearPasswordFormBtn: $('clearPasswordFormBtn')
};

/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let lastPosition = null;

let sosActive = false;
let activeSosIncidentId = null;

let locationWatchId = null;

let sosStartedAt = null;
let sosTimerInterval = null;

let ringtoneTimer = null;
let audioContext = null;
let ringtoneStarted = false;


/* =====================================================
   SAFE EVENT LISTENER
===================================================== */

function on(element, event, handler) {
  if (!element) return;

  element.addEventListener(event, handler);
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {
  if (!els.toast) {
    alert(message);
    return;
  }

  els.toast.textContent = message;
  els.toast.classList.remove('hidden');

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    els.toast.classList.add('hidden');
  }, 3500);
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
   STORAGE HELPERS
===================================================== */

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}


/* =====================================================
   SESSION
===================================================== */

function saveSession(user) {
  const storage = getStorage();

  if (!storage || !user) return;

  const snapshot = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    guardianName: user.guardianName,
    guardianPhone: user.guardianPhone,
    trustedName: user.trustedName,
    trustedPhone: user.trustedPhone,
    trustedAddress: user.trustedAddress
  };

  storage.setItem(
    SESSION_KEY,
    JSON.stringify(snapshot)
  );
}


function loadSession() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const snapshot = JSON.parse(raw);

    if (!snapshot || !snapshot.id) {
      return null;
    }

    const users = readUsers();

    if (Array.isArray(users)) {
      const latest = users.find(
        (user) => user.id === snapshot.id
      );

      if (latest) {
        saveSession(latest);
        return latest;
      }
    }

    return snapshot;

  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}


function requireLogin() {
  if (currentUser) {
    return true;
  }

  showToast('Please log in first.');

  setTimeout(() => {
    window.location.href = 'login.html';
  }, 300);

  return false;
}


/* =====================================================
   CONTACTS
===================================================== */

function contact(kind) {
  if (!currentUser) {
    return null;
  }

  if (kind === 'guardian') {
    return {
      name:
        currentUser.guardianName ||
        'Guardian',

      phone:
        currentUser.guardianPhone ||
        ''
    };
  }

  return {
    name:
      currentUser.trustedName ||
      'Trusted Contact',

    phone:
      currentUser.trustedPhone ||
      ''
  };
}


function cleanPhone(phone) {
  return String(phone || '')
    .replace(/[^0-9+]/g, '');
}


/* =====================================================
   GPS
===================================================== */

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          'GPS is not available in this browser.'
        )
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
  if (!position?.coords) {
    return;
  }

  lastPosition = {
    latitude: Number(
      Number(position.coords.latitude).toFixed(6)
    ),

    longitude: Number(
      Number(position.coords.longitude).toFixed(6)
    ),

    accuracy: Math.round(
      Number(position.coords.accuracy || 0)
    ),

    timestamp: new Date().toISOString()
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

  return (
    `https://maps.google.com/?q=` +
    `${lastPosition.latitude},${lastPosition.longitude}`
  );
}


/* =====================================================
   SOS MESSAGE
===================================================== */

function buildMessage() {
  if (!currentUser) {
    return 'RakshaSutra SOS Alert';
  }

  return [
    '🚨 RAKSHASUTRA SOS ALERT',
    '',
    `${currentUser.fullName || 'User'} needs help.`,
    '',
    `Time: ${new Date().toLocaleString('en-IN')}`,
    '',
    lastPosition
      ? `Current location: ${mapsLink()}`
      : 'Location: GPS unavailable.',
    '',
    `GPS accuracy: ${
      lastPosition?.accuracy ?? 'unknown'
    }m`,
    '',
    'RakshaSutra SOS is active.',
    'Please contact the user immediately.'
  ].join('\n');
}


function buildSafeMessage() {
  if (!currentUser) {
    return 'RakshaSutra safety update.';
  }

  return [
    '🟢 RAKSHASUTRA SAFETY UPDATE',
    '',
    `${currentUser.fullName || 'The user'} has confirmed that they are safe.`,
    '',
    `Time: ${new Date().toLocaleString('en-IN')}`,
    '',
    'The RakshaSutra SOS session has been resolved.',
    'Location sharing has been stopped.',
    'No further action is required.'
  ].join('\n');
}


/* =====================================================
   SMS
===================================================== */

function smsTo(kind, message = buildMessage()) {
  if (!requireLogin()) {
    return;
  }

  const c = contact(kind);

  if (!c?.phone) {
    showToast(
      kind === 'guardian'
        ? 'Guardian phone number is not saved.'
        : 'Trusted contact phone number is not saved.'
    );

    return;
  }

  const phone = cleanPhone(c.phone);

  if (!phone) {
    showToast('Invalid phone number.');
    return;
  }

  const body = encodeURIComponent(message);

  window.location.href =
    `sms:${phone}?body=${body}`;
}


/* =====================================================
   EMERGENCY MODAL
===================================================== */

function openEmergencyModal() {
  if (!els.emergencyModal) return;

  if (els.emergencySummary) {
    els.emergencySummary.textContent =
      lastPosition
        ? `SOS ACTIVE • GPS: ${lastPosition.latitude}, ${lastPosition.longitude} · ±${lastPosition.accuracy}m`
        : 'SOS ACTIVE • Waiting for GPS location.';
  }

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
   LIVE LOCATION
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

        if (sosActive && els.sosState) {
          els.sosState.textContent =
            '🔴 SOS ACTIVE • LIVE GPS';
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
   SOS TIMER
===================================================== */

function formatTime(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.ceil(milliseconds / 1000)
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

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

  if (els.safeBtn) {
    els.safeBtn.disabled = false;
    els.safeBtn.textContent =
      '🟢 ARE YOU SAFE NOW?';
  }

  if (els.sosTimer) {
    if (remaining > 0) {
      els.sosTimer.textContent =
        `SOS active • ${formatTime(remaining)} remaining`;
    } else {
      els.sosTimer.textContent =
        '⚠️ 5 minutes completed — confirm your safety when ready.';
    }
  }
}


function startSosTimer() {
  sosStartedAt = Date.now();

  clearInterval(sosTimerInterval);

  updateSosTimer();

  sosTimerInterval =
    setInterval(
      updateSosTimer,
      1000
    );
}


function stopSosTimer() {
  clearInterval(sosTimerInterval);

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

  if (els.sosBtn) {
    els.sosBtn.disabled = true;
    els.sosBtn.textContent =
      '⏳ Activating SOS...';
  }

  try {
    try {
      const position =
        await getPosition();

      setPosition(position);

    } catch (error) {
      console.warn(
        'GPS unavailable:',
        error
      );

      showToast(
        'SOS will continue without a fresh GPS fix.'
      );

      addActivity(
        '⚠️ SOS started without a fresh GPS fix.'
      );
    }

    sosActive = true;

    startLiveLocation();
    startSosTimer();

    if (els.sosBtn) {
      els.sosBtn.textContent =
        '🛑 STOP SOS';
    }

    if (els.statusNote) {
      els.statusNote.textContent =
        '🚨 SOS ACTIVE. Live GPS tracking is running.';
    }

    if (els.sosState) {
      els.sosState.textContent =
        '🔴 SOS ACTIVE • LIVE GPS';
    }

    if (els.safeBtn) {
      els.safeBtn.disabled = false;
      els.safeBtn.textContent =
        '🟢 ARE YOU SAFE NOW?';
    }

    const incident = addIncident({
      type: 'sos',
      userId: currentUser.id,

      message:
        'SOS activated. Live GPS session started.',

      latitude:
        lastPosition?.latitude ?? null,

      longitude:
        lastPosition?.longitude ?? null,

      accuracy:
        lastPosition?.accuracy ?? null,

      status: 'active',

      startedAt:
        new Date().toISOString()
    });

    activeSosIncidentId =
      incident?.id || null;

    addActivity(
      '🚨 SOS activated. Live GPS session started.'
    );

    showToast(
      'SOS is active. Send the prepared SOS message to your trusted contact.'
    );

    openEmergencyModal();

  } catch (error) {
    console.error(
      'SOS error:',
      error
    );

    sosActive = false;

    stopLiveLocation();
    stopSosTimer();

    showToast(
      'Could not activate SOS. Please try again.'
    );

  } finally {
    if (els.sosBtn) {
      els.sosBtn.disabled = false;

      if (sosActive) {
        els.sosBtn.textContent =
          '🛑 STOP SOS';
      } else {
        els.sosBtn.textContent =
          '🚨 One-Tap SOS';
      }
    }
  }
}


/* =====================================================
   CONFIRM SAFE
===================================================== */

function confirmSafe() {
  if (!sosActive) {
    showToast(
      'There is no active SOS session.'
    );

    return;
  }

  stopLiveLocation();
  stopSosTimer();

  sosActive = false;

  let resolved = null;

  try {
    resolved = resolveActiveSOS(
      currentUser?.id || null,
      lastPosition
    );
  } catch (error) {
    console.warn(
      'Could not resolve SOS:',
      error
    );
  }

  if (!resolved) {
    addIncident({
      type: 'sos-resolved',
      userId: currentUser.id,

      message:
        'User confirmed they are safe.',

      latitude:
        lastPosition?.latitude ?? null,

      longitude:
        lastPosition?.longitude ?? null,

      status: 'resolved',

      resolvedAt:
        new Date().toISOString()
    });
  }

  activeSosIncidentId = null;

  if (els.sosBtn) {
    els.sosBtn.textContent =
      '🚨 One-Tap SOS';
  }

  if (els.statusNote) {
    els.statusNote.textContent =
      '🟢 You are safe. SOS resolved and live location sharing stopped.';
  }

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

  addActivity(
    '🟢 Safety confirmed. Live GPS stopped.'
  );

  showToast(
    'You are safe. A safety confirmation message is ready.'
  );

  smsTo(
    'guardian',
    buildSafeMessage()
  );
}


/* =====================================================
   STOP SOS
===================================================== */

function stopSOS() {
  if (!sosActive) {
    return;
  }

  stopLiveLocation();
  stopSosTimer();

  sosActive = false;

  if (activeSosIncidentId) {
    try {
      resolveActiveSOS(
        currentUser?.id || null,
        lastPosition
      );
    } catch (error) {
      console.warn(error);
    }
  }

  activeSosIncidentId = null;

  if (els.sosBtn) {
    els.sosBtn.textContent =
      '🚨 One-Tap SOS';
  }

  if (els.statusNote) {
    els.statusNote.textContent =
      'SOS stopped on this device.';
  }

  if (els.sosState) {
    els.sosState.textContent =
      '🟡 SOS STOPPED';
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
    type: 'sos-stop',
    userId: currentUser?.id || null,

    message:
      'SOS manually stopped on the device.',

    status: 'stopped',

    stoppedAt:
      new Date().toISOString()
  });

  addActivity(
    'SOS manually stopped.'
  );

  showToast(
    'SOS stopped.'
  );
}


/* =====================================================
   EMERGENCY CALL
===================================================== */

function emergencyVoiceCall() {
  if (!requireLogin()) {
    return;
  }

  const c = contact('guardian');

  if (!c?.phone) {
    showToast(
      'Guardian phone number is not saved.'
    );

    return;
  }

  const phone =
    cleanPhone(c.phone);

  if (!phone) {
    showToast(
      'Guardian phone number is invalid.'
    );

    return;
  }

  addIncident({
    type: 'emergency-call',
    userId: currentUser.id,

    message:
      'Guardian call initiated.',

    status: 'initiated',

    createdAt:
      new Date().toISOString()
  });

  window.location.href =
    `tel:${phone}`;
}


/* =====================================================
   FAKE CALL VIBRATION
===================================================== */

function startFakeCallVibration() {
  if (!navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate([
      500,
      250,
      500,
      250,
      500,
      1000
    ]);
  } catch {
    // Ignore vibration errors.
  }
}


function stopFakeCallVibration() {
  if (!navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch {
    // Ignore vibration errors.
  }
}


/* =====================================================
   FAKE CALL RINGTONE
===================================================== */

function createRingtoneBeep() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    if (!audioContext) {
      audioContext =
        new AudioContextClass();
    }

    if (
      audioContext.state ===
      'suspended'
    ) {
      audioContext
        .resume()
        .catch(() => {});
    }

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = 'sine';

    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.06,
      audioContext.currentTime + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.45
    );

    oscillator.connect(gain);
    gain.connect(
      audioContext.destination
    );

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime + 0.5
    );

  } catch (error) {
    console.warn(
      'Fake ringtone error:',
      error
    );
  }
}


function startFakeCallRingtone() {
  stopFakeCallRingtone();

  ringtoneStarted = true;

  createRingtoneBeep();

  ringtoneTimer =
    setInterval(() => {
      if (ringtoneStarted) {
        createRingtoneBeep();
      }
    }, 1500);

  startFakeCallVibration();
}


function stopFakeCallRingtone() {
  ringtoneStarted = false;

  if (ringtoneTimer !== null) {
    clearInterval(ringtoneTimer);
    ringtoneTimer = null;
  }

  stopFakeCallVibration();
}


/* =====================================================
   OPEN FAKE CALL
===================================================== */

function openFakeCall() {
  if (!requireLogin()) {
    return;
  }

  const guardian =
    contact('guardian');

  const callerName =
    guardian?.name ||
    currentUser?.trustedName ||
    'Trusted Contact';

  if (els.callName) {
    els.callName.textContent =
      callerName;
  }

  if (els.callStatus) {
    els.callStatus.textContent =
      'Incoming call...';
  }

  if (els.incomingCallScreen) {
    els.incomingCallScreen.hidden =
      false;
  }

  if (els.pickupScreen) {
    els.pickupScreen.hidden =
      true;
  }

  if (els.callModal) {
    els.callModal.classList.remove(
      'hidden'
    );

    els.callModal.setAttribute(
      'aria-hidden',
      'false'
    );
  }

  startFakeCallRingtone();

  addIncident({
    type: 'fake-call',
    userId: currentUser.id,

    message:
      `Fake call started from ${callerName}.`,

    status: 'active'
  });

  addActivity(
    `📞 Incoming fake call from ${callerName}.`
  );
}


/* =====================================================
   ANSWER FAKE CALL
===================================================== */

function answerFakeCall() {
  stopFakeCallRingtone();

  if (els.incomingCallScreen) {
    els.incomingCallScreen.hidden =
      true;
  }

  if (els.pickupScreen) {
    els.pickupScreen.hidden =
      false;
  }

  if (els.callStatus) {
    els.callStatus.textContent =
      'Connected';
  }

  addActivity(
    '📞 Fake call answered.'
  );
}


/* =====================================================
   CLOSE FAKE CALL
===================================================== */

function closeFakeCall() {
  stopFakeCallRingtone();

  if (els.callModal) {
    els.callModal.classList.add(
      'hidden'
    );

    els.callModal.setAttribute(
      'aria-hidden',
      'true'
    );
  }

  if (els.incomingCallScreen) {
    els.incomingCallScreen.hidden =
      false;
  }

  if (els.pickupScreen) {
    els.pickupScreen.hidden =
      true;
  }

  if (els.callStatus) {
    els.callStatus.textContent =
      'Incoming call...';
  }

  addActivity(
    '📞 Fake call ended.'
  );
}


/* =====================================================
   LOCATION SHARE
===================================================== */

async function shareLocation() {
  if (!requireLogin()) {
    return;
  }

  if (els.shareBtn) {
    els.shareBtn.disabled = true;
    els.shareBtn.textContent =
      '📍 Getting location...';
  }

  try {
    const position =
      await getPosition();

    setPosition(position);

    addIncident({
      type: 'location-share',
      userId: currentUser.id,

      message:
        'Location SMS prepared.',

      latitude:
        lastPosition.latitude,

      longitude:
        lastPosition.longitude,

      accuracy:
        lastPosition.accuracy,

      status: 'prepared'
    });

    addActivity(
      '📍 Location SMS prepared.'
    );

    showToast(
      'Location found. Opening SMS composer.'
    );

    smsTo(
      'guardian',
      buildMessage()
    );

  } catch (error) {
    console.error(
      'Location error:',
      error
    );

    showToast(
      `GPS unavailable: ${error.message}`
    );

  } finally {
    if (els.shareBtn) {
      els.shareBtn.disabled = false;
      els.shareBtn.textContent =
        '📍 Share Location';
    }
  }
}


/* =====================================================
   AI SAFETY SCAN
===================================================== */

function runSafetyScan() {
  if (!requireLogin()) {
    return;
  }

  let currentScore =
    Number(
      els.riskScore?.textContent || 24
    );

  if (!Number.isFinite(currentScore)) {
    currentScore = 24;
  }

  const newScore =
    Math.min(
      100,
      Math.max(
        0,
        currentScore + 5
      )
    );

  if (els.riskScore) {
    els.riskScore.textContent =
      String(newScore);
  }

  addIncident({
    type: 'scan',
    userId: currentUser.id,

    message:
      'Safety scan completed.',

    riskScore:
      newScore,

    status: 'completed'
  });

  addActivity(
    `🤖 Safety scan completed. Risk score: ${newScore}.`
  );

  showToast(
    'Safety scan complete.'
  );
}


/* =====================================================
   RENDER USER
===================================================== */

function renderUser() {
  if (!currentUser) {
    return;
  }

  if (els.userBadge) {
    els.userBadge.textContent =
      `Welcome, ${
        currentUser.fullName?.split(' ')[0] ||
        'User'
      }`;
  }

  if (els.guardianName) {
    els.guardianName.textContent =
      currentUser.guardianName ||
      '—';
  }

  if (els.guardianPhone) {
    els.guardianPhone.textContent =
      currentUser.guardianPhone ||
      '—';
  }

  if (els.trustedName) {
    els.trustedName.textContent =
      currentUser.trustedName ||
      '—';
  }

  if (els.trustedPhone) {
    els.trustedPhone.textContent =
      currentUser.trustedPhone ||
      '—';
  }

  if (els.trustedAddress) {
    els.trustedAddress.textContent =
      currentUser.trustedAddress ||
      '—';
  }

  if (els.statusNote) {
    els.statusNote.textContent =
      'Account active. Your emergency controls are ready.';
  }

  if (els.locationText) {
    els.locationText.textContent =
      'Waiting for GPS';
  }

  if (els.coordsText) {
    els.coordsText.textContent =
      'Location permission required';
  }
}


/* =====================================================
   CHANGE PASSWORD
===================================================== */

function setPasswordMessage(
  message,
  success = false
) {
  if (!els.changePasswordMessage) {
    return;
  }

  els.changePasswordMessage.textContent =
    message;

  els.changePasswordMessage.style.color =
    success
      ? '#22c55e'
      : '#ef4444';
}


function clearPasswordForm() {
  if (els.currentPassword) {
    els.currentPassword.value = '';
  }

  if (els.newPassword) {
    els.newPassword.value = '';
  }

  if (els.confirmNewPassword) {
    els.confirmNewPassword.value = '';
  }

  setPasswordMessage('');
}


function changePassword(event) {
  event.preventDefault();

  if (!requireLogin()) {
    return;
  }

  const current =
    els.currentPassword?.value || '';

  const next =
    els.newPassword?.value || '';

  const confirm =
    els.confirmNewPassword?.value || '';

  if (!current || !next || !confirm) {
    setPasswordMessage(
      'Please fill in all password fields.'
    );

    return;
  }

  if (next.length < 6) {
    setPasswordMessage(
      'New password must contain at least 6 characters.'
    );

    return;
  }

  if (next !== confirm) {
    setPasswordMessage(
      'New password and confirmation do not match.'
    );

    return;
  }

  if (
    currentUser.password !== current
  ) {
    setPasswordMessage(
      'Current password is incorrect.'
    );

    return;
  }

  const users =
    readUsers();

  if (!Array.isArray(users)) {
    setPasswordMessage(
      'Could not access account data.'
    );

    return;
  }

  const index =
    users.findIndex(
      (user) =>
        user.id === currentUser.id
    );

  if (index === -1) {
    setPasswordMessage(
      'Account could not be found.'
    );

    return;
  }

  users[index] = {
    ...users[index],
    password: next
  };

  try {
    localStorage.setItem(
      'rakshasutra-users',
      JSON.stringify(users)
    );

    currentUser =
      users[index];

    saveSession(currentUser);

    clearPasswordForm();

    setPasswordMessage(
      'Password changed successfully.',
      true
    );

    showToast(
      'Password changed successfully.'
    );

  } catch (error) {
    console.error(error);

    setPasswordMessage(
      'Could not save the new password.'
    );
  }
}


/* =====================================================
   PASSWORD SHOW / HIDE
===================================================== */

function setupPasswordToggles() {
  const toggles =
    document.querySelectorAll(
      '[data-password-toggle]'
    );

  toggles.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        const targetId =
          button.getAttribute(
            'data-password-toggle'
          );

        const input =
          document.getElementById(
            targetId
          );

        if (!input) {
          return;
        }

        if (
          input.type === 'password'
        ) {
          input.type = 'text';
          button.textContent = '🙈';
        } else {
          input.type = 'password';
          button.textContent = '👁️';
        }
      }
    );
  });
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {
  stopLiveLocation();
  stopSosTimer();
  stopFakeCallRingtone();

  const storage =
    getStorage();

  if (storage) {
    storage.removeItem(
      SESSION_KEY
    );
  }

  currentUser = null;

  window.location.href =
    'login.html';
}


/* =====================================================
   EVENT LISTENERS
===================================================== */

on(
  els.sosBtn,
  'click',
  () => {
    if (sosActive) {
      stopSOS();
    } else {
      triggerSOS();
    }
  }
);


on(
  els.safeBtn,
  'click',
  confirmSafe
);


on(
  els.voiceBtn,
  'click',
  emergencyVoiceCall
);


on(
  els.callBtn,
  'click',
  openFakeCall
);


on(
  els.shareBtn,
  'click',
  shareLocation
);


on(
  els.scanBtn,
  'click',
  runSafetyScan
);


on(
  els.guardianSmsBtn,
  'click',
  () => {
    smsTo('guardian');
  }
);


on(
  els.trustedSmsBtn,
  'click',
  () => {
    smsTo('trusted');
  }
);


on(
  els.guardianEmergencySmsBtn,
  'click',
  () => {
    smsTo('guardian');
  }
);


on(
  els.trustedEmergencySmsBtn,
  'click',
  () => {
    smsTo('trusted');
  }
);


on(
  els.closeEmergencyBtn,
  'click',
  closeEmergencyModal
);


on(
  els.declineCallBtn,
  'click',
  closeFakeCall
);


on(
  els.answerCallBtn,
  'click',
  answerFakeCall
);


on(
  els.endCallBtn,
  'click',
  closeFakeCall
);


on(
  els.logoutBtn,
  'click',
  logout
);


on(
  els.changePasswordForm,
  'submit',
  changePassword
);


on(
  els.clearPasswordFormBtn,
  'click',
  clearPasswordForm
);


/* =====================================================
   CLOSE MODALS BY BACKDROP
===================================================== */

on(
  els.emergencyModal,
  'click',
  (event) => {
    if (
      event.target ===
      els.emergencyModal
    ) {
      closeEmergencyModal();
    }
  }
);


on(
  els.callModal,
  'click',
  (event) => {
    if (
      event.target ===
      els.callModal
    ) {
      closeFakeCall();
    }
  }
);


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    closeEmergencyModal();
    closeFakeCall();
  }
);


/* =====================================================
   INITIALIZE
===================================================== */

function initialize() {
  try {
    currentUser =
      loadSession();

    if (!currentUser) {
      window.location.replace(
        'login.html'
      );

      return;
    }

    renderUser();
    setupPasswordToggles();

    try {
      const active =
        findActiveSOS(
          currentUser.id
        );

      if (active) {
        sosActive = true;
        activeSosIncidentId =
          active.id || null;

        if (els.sosBtn) {
          els.sosBtn.textContent =
            '🛑 STOP SOS';
        }

        if (els.sosState) {
          els.sosState.textContent =
            '🔴 SOS ACTIVE';
        }

        if (els.safeBtn) {
          els.safeBtn.disabled =
            false;
        }

        startLiveLocation();
        startSosTimer();

        addActivity(
          '🚨 An active SOS session was restored.'
        );
      }
    } catch (error) {
      console.warn(
        'Could not restore SOS:',
        error
      );
    }

  } catch (error) {
    console.error(
      'RakshaSutra initialization failed:',
      error
    );

    showToast(
      'RakshaSutra could not start. Please log in again.'
    );

    setTimeout(() => {
      window.location.href =
        'login.html';
    }, 1000);
  }
}


if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    initialize,
    { once: true }
  );
} else {
  initialize();
}
