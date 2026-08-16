```javascript
import {
  addIncident,
  readUsers
} from './dataStore.js';

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
let ringtoneStarted = false;


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

  if (!els.toast) {
    return;
  }

  els.toast.textContent = message;

  els.toast.classList.remove('hidden');

  window.clearTimeout(showToast.timer);

  showToast.timer =
    window.setTimeout(() => {

      els.toast.classList.add('hidden');

    }, 3200);
}


/* =====================================================
   ACTIVITY
===================================================== */

function addActivity(message) {

  if (!els.activityList) {
    return;
  }

  const item =
    document.createElement('li');

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

      guardianName:
        user.guardianName,

      guardianPhone:
        user.guardianPhone,

      trustedName:
        user.trustedName,

      trustedPhone:
        user.trustedPhone,

      trustedAddress:
        user.trustedAddress

    })
  );
}


function loadSession() {

  try {

    const raw =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!raw) {
      return null;
    }

    const snapshot =
      JSON.parse(raw);

    const users =
      readUsers();

    const latest =
      users.find(
        (user) =>
          user.id === snapshot.id
      );

    return latest || snapshot;

  } catch {

    return null;
  }
}


function requireLogin() {

  if (!currentUser) {

    window.location.href =
      'login.html';

    return false;
  }

  return true;
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

  return new Promise(
    (resolve, reject) => {

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
    }
  );
}


function setPosition(position) {

  lastPosition = {

    latitude:
      Number(
        position.coords.latitude
          .toFixed(6)
      ),

    longitude:
      Number(
        position.coords.longitude
          .toFixed(6)
      ),

    accuracy:
      Math.round(
        position.coords.accuracy || 0
      ),

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

  return (
    `https://maps.google.com/?q=` +
    `${lastPosition.latitude},` +
    `${lastPosition.longitude}`
  );
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

    `GPS accuracy: ${
      lastPosition?.accuracy ??
      'unknown'
    }m`,

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

function smsTo(
  kind,
  message = buildMessage()
) {

  const c =
    contact(kind);

  if (!c?.phone) {

    showToast(

      `${
        kind === 'guardian'
          ? 'Guardian'
          : 'Trusted contact'
      } phone number is not saved.`

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

  if (!els.emergencyModal) {
    return;
  }

  els.emergencySummary.textContent =

    lastPosition

      ? `SOS ACTIVE • GPS: ${lastPosition.latitude}, ${lastPosition.longitude} · ±${lastPosition.accuracy}m`

      : 'SOS ACTIVE • Waiting for GPS location.';


  els.emergencyModal.classList.remove(
    'hidden'
  );


  els.emergencyModal.setAttribute(
    'aria-hidden',
    'false'
  );
}


function closeEmergencyModal() {

  if (!els.emergencyModal) {
    return;
  }

  els.emergencyModal.classList.add(
    'hidden'
  );

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
   SOS TIMER
===================================================== */

function formatTime(milliseconds) {

  const totalSeconds =
    Math.max(
      0,
      Math.ceil(
        milliseconds / 1000
      )
    );

  const minutes =
    Math.floor(
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

  if (
    !sosActive ||
    !sosStartedAt
  ) {
    return;
  }

  const elapsed =
    Date.now() -
    sosStartedAt;

  const remaining =
    SOS_DURATION -
    elapsed;


  /*
   * IMPORTANT:
   *
   * The Safe button is intentionally
   * enabled immediately.
   *
   * The timer is only informational.
   */

  if (els.safeBtn) {

    els.safeBtn.disabled =
      false;

    els.safeBtn.textContent =
      '🟢 ARE YOU SAFE NOW?';
  }


  if (remaining > 0) {

    if (els.sosTimer) {

      els.sosTimer.textContent =
        `SOS active • ${formatTime(remaining)} remaining`;
    }

    return;
  }


  /*
   * FIVE MINUTES COMPLETED
   */

  if (els.sosTimer) {

    els.sosTimer.textContent =
      '⚠️ 5 minutes completed — confirm your safety when ready.';
  }


  if (els.safeBtn) {

    els.safeBtn.disabled =
      false;

    els.safeBtn.textContent =
      '🟢 ARE YOU SAFE NOW?';
  }
}


function startSosTimer() {

  sosStartedAt =
    Date.now();

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

  els.sosBtn.disabled =
    true;

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
       START LIVE GPS
    --------------------------------------------- */

    startLiveLocation();


    /* ---------------------------------------------
       START TIMER
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


    /*
     * SAFE BUTTON:
     *
     * It is available immediately.
     */

    if (els.safeBtn) {

      els.safeBtn.disabled =
        false;

      els.safeBtn.textContent =
        '🟢 ARE YOU SAFE NOW?';
    }


    /* ---------------------------------------------
       RECORD INCIDENT
    --------------------------------------------- */

    addIncident({

      type:
        'sos',

      message:
        'SOS activated. Live GPS session started.',

      latitude:
        lastPosition?.latitude ??
        null,

      longitude:
        lastPosition?.longitude ??
        null,

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

    els.sosBtn.disabled =
      false;
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


  /*
   * IMPORTANT:
   *
   * There is NO 5-minute restriction here.
   *
   * The user can confirm safety at any time.
   */


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
     UPDATE SOS BUTTON
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

    els.safeBtn.disabled =
      true;

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
      lastPosition?.latitude ??
      null,

    longitude:
      lastPosition?.longitude ??
      null,

    status:
      'resolved',

    resolvedAt:
      new Date().toISOString()
  });


  addActivity(
    '🟢 Safety confirmed. Live GPS stopped.'
  );


  /* ---------------------------------------------
     PREPARE SAFE NOTIFICATION
  --------------------------------------------- */

  showToast(
    'You are safe. Prepare the safety confirmation message for your trusted contacts.'
  );


  /*
   * Browser security prevents the website
   * from silently sending an SMS.
   *
   * The phone's SMS composer is opened with
   * the safety message already prepared.
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

    els.safeBtn.disabled =
      true;

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
   FAKE CALL — RINGTONE + VIBRATION
===================================================== */

function startFakeCallVibration() {

  if (!navigator.vibrate) {
    return;
  }

  navigator.vibrate([
    500,
    250,
    500,
    250,
    500,
    1000
  ]);
}


function stopFakeCallVibration() {

  if (navigator.vibrate) {

    navigator.vibrate(0);
  }
}


function createRingtoneBeep() {

  try {

    if (!audioContext) {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      audioContext =
        new AudioContext();
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


    oscillator.type =
      'sine';


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
      'Fake ringtone could not start:',
      error
    );
  }
}


function startFakeCallRingtone() {

  stopFakeCallRingtone();

  ringtoneStarted =
    true;


  createRingtoneBeep();


  ringtoneTimer =
    window.setInterval(
      () => {

        if (!ringtoneStarted) {
          return;
        }

        createRingtoneBeep();

      },
      1500
    );


  startFakeCallVibration();
}


function stopFakeCallRingtone() {

  ringtoneStarted =
    false;


  if (
    ringtoneTimer !== null
  ) {

    window.clearInterval(
      ringtoneTimer
    );

    ringtoneTimer =
      null;
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
      'Incoming call…';
  }


  if (
    els.incomingCallScreen
  ) {

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


  addActivity(
    `📞 Incoming fake call from ${callerName}.`
  );
}


/* =====================================================
   ANSWER FAKE CALL
===================================================== */

function answerFakeCall() {

  stopFakeCallRingtone();


  if (
    els.incomingCallScreen
  ) {

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
   CLOSE / DECLINE FAKE CALL
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


  if (
    els.incomingCallScreen
  ) {

    els.incomingCallScreen.hidden =
      false;
  }


  if (els.pickupScreen) {

    els.pickupScreen.hidden =
      true;
  }


  if (els.callStatus) {

    els.callStatus.textContent =
      'Incoming call…';
  }


  addActivity(
    '📞 Fake call ended.'
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
    currentUser.guardianName ||
    '—';


  els.guardianPhone.textContent =
    currentUser.guardianPhone ||
    '—';


  els.trustedName.textContent =
    currentUser.trustedName ||
    '—';


  els.trustedPhone.textContent =
    currentUser.trustedPhone ||
    '—';


  els.trustedAddress.textContent =
    currentUser.trustedAddress ||
    '—';


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
        els.riskScore.textContent ||
        24
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

    stopFakeCallRingtone();

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
```
