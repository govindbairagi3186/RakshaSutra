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

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

function addActivity(message) {
  if (!activityList) return;
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
    if (statusNote) statusNote.textContent = 'Register or log in to unlock safety controls.';
    return false;
  }
  if (action && statusNote) {
    statusNote.textContent = `${action} is active for ${currentUser.fullName.split(' ')[0]}.`;
  }
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

function getEmergencyContact() {
  if (!currentUser) return null;
  const phone = currentUser.guardianPhone || currentUser.trustedPhone || '';
  const name = currentUser.guardianName || currentUser.trustedName || 'Emergency contact';
  return { name, phone: String(phone).trim() };
}

function cleanPhoneForUri(phone) {
  return String(phone || '').replace(/[^0-9+]/g, '');
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This phone/browser does not provide GPS.'));
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

function mapsLink(position = lastPosition) {
  if (!position) return '';
  return `https://maps.google.com/?q=${position.latitude},${position.longitude}`;
}

function updateLocationUI(position) {
  const p = positionPayload(position);
  lastPosition = p;

  if (locationText) locationText.textContent = 'GPS location active';
  if (coordsText) coordsText.textContent = `${p.latitude}, ${p.longitude} · ±${p.accuracy}m`;
}

function buildSOSMessage() {
  const firstName = currentUser?.fullName?.split(' ')[0] || 'User';
  const location = mapsLink();

  return [
    '🚨 RAKSHASUTRA SOS ALERT',
    `${firstName} needs help.`,
    `Time: ${new Date().toLocaleString('en-IN')}`,
    location ? `Current location: ${location}` : 'Current location: GPS unavailable.',
    'Please contact me immediately.'
  ].join('\n');
}

function openSMS(message) {
  const contact = getEmergencyContact();
  if (!contact?.phone) {
    showToast('Add a guardian or trusted phone number first.');
    return false;
  }

  const phone = cleanPhoneForUri(contact.phone);
  const body = encodeURIComponent(message);
  window.location.href = `sms:${phone}?body=${body}`;
  return true;
}

function openPhoneCall() {
  const contact = getEmergencyContact();
  if (!contact?.phone) {
    showToast('Add a guardian or trusted phone number first.');
    return false;
  }

  const phone = cleanPhoneForUri(contact.phone);
  window.location.href = `tel:${phone}`;
  return true;
}

async function sendLocationBySMS() {
  if (!ensureAuthenticated('Location sharing')) return;

  try {
    const position = await getPosition();
    updateLocationUI(position);

    const message = [
      '📍 RakshaSutra location update',
      `${currentUser.fullName.split(' ')[0]} is sharing their current location.`,
      `Time: ${new Date().toLocaleString('en-IN')}`,
      `Location: ${mapsLink()}`
    ].join('\n');

    addIncident({
      type: 'location-share',
      message: 'GPS location prepared for emergency contact.',
      latitude: lastPosition.latitude,
      longitude: lastPosition.longitude
    });

    addActivity('GPS location prepared in the phone SMS app.');
    showToast('Your SMS app will open with the location message. Tap Send.');
    openSMS(message);
  } catch (error) {
    showToast(`GPS unavailable: ${error.message}`);
    if (statusNote) statusNote.textContent = 'Allow location permission and try again.';
  }
}

function startLiveLocation() {
  if (!navigator.geolocation || locationWatchId !== null) return;

  locationWatchId = navigator.geolocation.watchPosition(
    (position) => updateLocationUI(position),
    (error) => {
      if (coordsText) coordsText.textContent = `GPS error: ${error.message}`;
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

  const contact = getEmergencyContact();
  if (!contact?.phone) {
    showToast('Add a guardian or trusted phone number first.');
    if (statusNote) statusNote.textContent = 'No emergency contact number is saved.';
    return;
  }

  const button = $('sosBtn');
  if (button) {
    button.disabled = true;
    button.textContent = '⏳ Getting GPS...';
  }

  try {
    try {
      const position = await getPosition();
      updateLocationUI(position);
    } catch (gpsError) {
      lastPosition = null;
      addActivity(`GPS unavailable: ${gpsError.message}`);
    }

    const message = buildSOSMessage();

    addIncident({
      type: 'sos',
      message: 'SOS activated. Emergency SMS prepared for the saved contact.',
      latitude: lastPosition?.latitude ?? null,
      longitude: lastPosition?.longitude ?? null
    });

    sosActive = true;
    startLiveLocation();
    riskScore = Math.min(100, riskScore + 25);
    updateRiskScore();

    if (statusNote) {
      statusNote.textContent = 'SOS ready. SMS will open with your GPS location. Tap Send, then call the contact.';
    }

    addActivity('SOS activated. Emergency SMS prepared.');
    showToast('SOS message ready. Tap Send in your SMS app.');

    if (button) button.textContent = '🛑 Stop SOS';

    setTimeout(() => openSMS(message), 250);
  } catch (error) {
    if (statusNote) statusNote.textContent = error.message;
    showToast(error.message);
    if (button) button.textContent = '🚨 One-Tap SOS';
  } finally {
    if (button) button.disabled = false;
  }
}

function stopSOS() {
  sosActive = false;
  stopLiveLocation();

  const button = $('sosBtn');
  if (button) button.textContent = '🚨 One-Tap SOS';

  if (statusNote) statusNote.textContent = 'SOS stopped on this device.';
  addActivity('SOS stopped.');
  addIncident({ type: 'sos-stop', message: 'SOS stopped on the device.' });
  showToast('SOS stopped.');
}

async function handleSOS() {
  if (sosActive) stopSOS();
  else await triggerRealSOS();
}

function showCallModal() {
  const contact = getEmergencyContact();
  if (!contact?.phone) {
    showToast('Add a guardian or trusted phone number first.');
    return;
  }

  callName.textContent = contact.name;
  callStatus.textContent = contact.phone;
  incomingCallScreen.hidden = false;
  pickupScreen.hidden = true;
  callModal.classList.remove('hidden');
  callModal.setAttribute('aria-hidden', 'false');
}

function answerCall() {
  if (!ensureAuthenticated('Emergency call')) return;

  const contact = getEmergencyContact();
  callModal.classList.add('hidden');
  callModal.setAttribute('aria-hidden', 'true');

  addActivity(`Calling ${contact.name}.`);
  addIncident({ type: 'call', message: `Emergency call started for ${contact.name}.` });
  openPhoneCall();
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
    authHint.textContent = 'Create an account to unlock SOS, GPS location and emergency-contact tools.';
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
    statusNote.textContent = 'Account active. Free SOS, GPS, call and SMS tools are ready.';
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
  const contact = getEmergencyContact();
  if (!contact?.phone) {
    showToast('Add a guardian or trusted phone number first.');
    return;
  }
  showToast('Opening the phone call option.');
  addActivity('Voice SOS requested a phone call.');
  openPhoneCall();
});

$('callBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('Emergency call')) return;
  showCallModal();
});

$('shareBtn').addEventListener('click', sendLocationBySMS);

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
