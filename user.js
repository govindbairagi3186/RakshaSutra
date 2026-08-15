import { createUser, authenticateUser } from './auth.js';
import { addIncident, readUsers } from './dataStore.js';

const $ = (id) => document.getElementById(id);
const riskScoreElement = $('riskScore');
const locationText = $('locationText');
const coordsText = $('coordsText');
const activityList = $('activityList');
const statusNote = $('statusNote');
const callModal = $('callModal');
const callName = $('callName');
const callStatus = $('callStatus');
const incomingCallScreen = $('incomingCallScreen');
const pickupScreen = $('pickupScreen');
const pickupName = $('pickupName');
const pickupStatus = $('pickupStatus');
const answerCallBtn = $('answerCallBtn');
const declineCallBtn = $('declineCallBtn');
const endCallBtn = $('endCallBtn');
const toast = $('toast');
const authView = $('authView');
const dashboardView = $('dashboardView');
const authForm = $('authForm');
const authTitle = $('authTitle');
const authSwitch = $('authSwitch');
const submitAuthBtn = $('submitAuthBtn');
const formMessage = $('formMessage');
const signupExtras = $('signupExtras');
const userBadge = $('userBadge');
const authHint = $('authHint');
const logoutBtn = $('logoutBtn');
const guardianName = $('guardianName');
const guardianPhone = $('guardianPhone');
const trustedName = $('trustedName');
const trustedPhone = $('trustedPhone');
const trustedAddress = $('trustedAddress');

const SESSION_KEY = 'rakshasutra-current-user';
let riskScore = 24;
let isSignupMode = true;
let currentUser = null;
let sosActive = false;
let locationWatchId = null;
let lastPosition = null;
let lastLocationSentAt = 0;
const LOCATION_INTERVAL_MS = 30000;

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function addActivity(message) {
  const item = document.createElement('li');
  item.textContent = message;
  activityList.prepend(item);
}

function updateRiskScore() {
  if (riskScoreElement) riskScoreElement.textContent = String(riskScore);
}

function ensureAuthenticated(action) {
  if (!currentUser) {
    showToast('Register or log in first.');
    statusNote.textContent = 'Register or log in to unlock safety controls.';
    return false;
  }
  if (action) statusNote.textContent = `${action} is active for ${currentUser.fullName.split(' ')[0]}.`;
  return true;
}

function persistSession(user) {
  localStorage.setItem(SESSION_KEY, user.id);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function restoreSession() {
  const savedId = localStorage.getItem(SESSION_KEY);
  if (!savedId) return;
  const savedUser = readUsers().find((user) => user.id === savedId);
  if (savedUser) setCurrentUser(savedUser);
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This device/browser does not provide GPS.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
}

function positionPayload(position) {
  return {
    latitude: Number(position.coords.latitude.toFixed(6)),
    longitude: Number(position.coords.longitude.toFixed(6)),
    accuracy: Math.round(position.coords.accuracy || 0),
    timestamp: new Date().toISOString()
  };
}

function updateLocationUI(position) {
  const p = positionPayload(position);
  lastPosition = p;
  locationText.textContent = 'GPS location active';
  coordsText.textContent = `${p.latitude}, ${p.longitude} · ±${p.accuracy}m`;
}

async function sendEmergency(action, position = lastPosition) {
  if (!currentUser) throw new Error('Please log in first.');

  const payload = {
    action,
    contactName: currentUser.guardianName || currentUser.trustedName || 'Emergency contact',
    contactPhone: currentUser.guardianPhone || currentUser.trustedPhone,
    userName: currentUser.fullName,
    ...(position || {})
  };

  const response = await fetch('/api/sos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Emergency service is unavailable.');
  }
  return data;
}

function startLiveLocation() {
  if (!navigator.geolocation || locationWatchId !== null) return;

  locationWatchId = navigator.geolocation.watchPosition(
    async (position) => {
      updateLocationUI(position);

      if (!sosActive) return;
      const now = Date.now();
      if (now - lastLocationSentAt < LOCATION_INTERVAL_MS) return;
      lastLocationSentAt = now;

      try {
        await sendEmergency('location', lastPosition);
        addActivity('Live GPS update sent to the emergency contact.');
      } catch (error) {
        addActivity(`GPS update could not be sent: ${error.message}`);
      }
    },
    (error) => {
      coordsText.textContent = `GPS error: ${error.message}`;
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );
}

function stopLiveLocation() {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
}

async function triggerRealSOS() {
  if (!ensureAuthenticated('Emergency SOS')) return;

  const emergencyPhone = currentUser.guardianPhone || currentUser.trustedPhone;
  if (!emergencyPhone) {
    showToast('Add a guardian or trusted phone number first.');
    statusNote.textContent = 'No emergency contact number is saved.';
    return;
  }

  const button = $('sosBtn');
  button.disabled = true;
  button.textContent = '⏳ Getting GPS...';

  try {
    let position;
    try {
      position = await getPosition();
      updateLocationUI(position);
    } catch {
      position = null;
      statusNote.textContent = 'GPS unavailable. Sending SOS without coordinates.';
    }

    button.textContent = '🚨 Sending SOS...';
    const result = await sendEmergency('sos', position ? lastPosition : null);

    sosActive = true;
    startLiveLocation();
    riskScore = Math.min(100, riskScore + 25);
    updateRiskScore();

    statusNote.textContent = 'REAL SOS sent. Emergency SMS sent and emergency call requested.';
    addActivity('REAL SOS activated. Emergency contact notified.');
    addIncident({
      type: 'sos',
      message: 'Real SOS activated and emergency contact notification requested.',
      latitude: lastPosition?.latitude ?? null,
      longitude: lastPosition?.longitude ?? null
    });

    showToast(result.message);
    button.textContent = '🛑 Stop SOS';
  } catch (error) {
    statusNote.textContent = error.message;
    showToast(error.message);
    button.textContent = '🚨 One-Tap SOS';
  } finally {
    button.disabled = false;
  }
}

async function stopSOS() {
  if (!currentUser || !sosActive) return;

  try {
    await sendEmergency('stop', lastPosition);
  } catch (error) {
    showToast(`SOS stop notification failed: ${error.message}`);
  }

  sosActive = false;
  stopLiveLocation();
  $('sosBtn').textContent = '🚨 One-Tap SOS';
  statusNote.textContent = 'SOS ended. Your emergency contact was notified.';
  addActivity('SOS ended.');
  addIncident({ type: 'sos-stop', message: 'SOS ended.' });
}

async function handleSOS() {
  if (sosActive) {
    await stopSOS();
  } else {
    await triggerRealSOS();
  }
}

function shareLocation() {
  if (!ensureAuthenticated('Location sharing')) return;

  getPosition().then(async (position) => {
    updateLocationUI(position);
    try {
      await sendEmergency('location', lastPosition);
      addActivity('Current GPS location sent to the emergency contact.');
      showToast('Location sent to your emergency contact.');
    } catch (error) {
      showToast(error.message);
    }
  }).catch((error) => {
    showToast(`GPS unavailable: ${error.message}`);
  });
}

function showCallModal() {
  callName.textContent = currentUser?.guardianName || currentUser?.trustedName || 'Emergency contact';
  callStatus.textContent = 'Demo call screen';
  incomingCallScreen.hidden = false;
  pickupScreen.hidden = true;
  callModal.classList.remove('hidden');
  callModal.setAttribute('aria-hidden', 'false');
}

function answerCall() {
  if (!ensureAuthenticated('Safe call')) return;
  incomingCallScreen.hidden = true;
  pickupScreen.hidden = false;
  pickupName.textContent = 'Safe Exit Mode';
  pickupStatus.textContent = 'This is the existing simulated call screen.';
  addActivity('Simulated safe-call screen opened.');
  addIncident({ type: 'call', message: 'Simulated call screen opened.' });
}

function declineCall() {
  callModal.classList.add('hidden');
  callModal.setAttribute('aria-hidden', 'true');
}

function renderAuthMode() {
  if (isSignupMode) {
    authTitle.textContent = 'Create your account';
    submitAuthBtn.textContent = 'Create account';
    authSwitch.textContent = 'Already have an account?';
    authHint.textContent = 'Create an account to unlock real SOS, GPS location, and emergency-contact alerts.';
  } else {
    authTitle.textContent = 'Log in to RakshaSutra';
    submitAuthBtn.textContent = 'Log in';
    authSwitch.textContent = 'Need to create an account?';
    authHint.textContent = 'Log in with your registered account.';
  }

  signupExtras.hidden = !isSignupMode;
  document.querySelectorAll('#authForm input[required]').forEach((input) => {
    input.required = isSignupMode ? true : input.id === 'email' || input.id === 'password';
  });
}

function showDashboard() {
  authView.hidden = true;
  dashboardView.hidden = false;
  logoutBtn.hidden = false;
}

function hideDashboard() {
  authView.hidden = false;
  dashboardView.hidden = true;
  logoutBtn.hidden = true;
}

function renderGuardianPanel() {
  if (!currentUser) {
    guardianName.textContent = '—';
    guardianPhone.textContent = '—';
    trustedName.textContent = '—';
    trustedPhone.textContent = '—';
    trustedAddress.textContent = '—';
    return;
  }

  guardianName.textContent = currentUser.guardianName || '—';
  guardianPhone.textContent = currentUser.guardianPhone || '—';
  trustedName.textContent = currentUser.trustedName || '—';
  trustedPhone.textContent = currentUser.trustedPhone || '—';
  trustedAddress.textContent = currentUser.trustedAddress || '—';
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    userBadge.textContent = `Welcome, ${user.fullName.split(' ')[0]}`;
    persistSession(user);
    showDashboard();
    renderGuardianPanel();
    statusNote.textContent = 'Account active. Real emergency controls are available after backend setup.';
  } else {
    hideDashboard();
    renderGuardianPanel();
  }
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const formData = new FormData(authForm);
  const profile = Object.fromEntries(formData.entries());

  if (isSignupMode) {
    try {
      const created = createUser(profile);
      setCurrentUser(created);
      formMessage.textContent = 'Account created successfully.';
      showToast('Account created successfully.');
      authForm.reset();
    } catch (error) {
      formMessage.textContent = error.message;
      showToast(error.message);
    }
    return;
  }

  const authenticated = authenticateUser(profile.email, profile.password);
  if (authenticated) {
    setCurrentUser(authenticated);
    formMessage.textContent = 'Login successful.';
    showToast('Welcome back.');
    authForm.reset();
  } else {
    formMessage.textContent = 'Invalid credentials.';
    showToast('Invalid credentials.');
  }
}

$('sosBtn').addEventListener('click', handleSOS);
$('voiceBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('Voice SOS')) return;
  showToast('Voice SOS is available as the next upgrade.');
  addActivity('Voice SOS control activated.');
});
$('callBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('Call assist')) return;
  showCallModal();
});
$('shareBtn').addEventListener('click', shareLocation);
$('scanBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('Safety scan')) return;
  riskScore = Math.min(100, riskScore + Math.floor(Math.random() * 12) + 4);
  updateRiskScore();
  statusNote.textContent = 'Safety scan completed.';
  addActivity('Safety scan updated your risk profile.');
  addIncident({ type: 'scan', message: 'Safety scan completed.' });
  showToast('Safety scan complete.');
});

answerCallBtn.addEventListener('click', answerCall);
declineCallBtn.addEventListener('click', declineCall);
endCallBtn.addEventListener('click', () => {
  callModal.classList.add('hidden');
  callModal.setAttribute('aria-hidden', 'true');
});

logoutBtn.addEventListener('click', () => {
  stopLiveLocation();
  sosActive = false;
  currentUser = null;
  clearSession();
  authForm.reset();
  setCurrentUser(null);
  showToast('Logged out successfully.');
});

authSwitch.addEventListener('click', () => {
  isSignupMode = !isSignupMode;
  renderAuthMode();
});
authForm.addEventListener('submit', handleAuthSubmit);

renderAuthMode();
updateRiskScore();
restoreSession();
