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
