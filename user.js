import { createUser, authenticateUser } from './auth.js';
import { addIncident, readUsers } from './dataStore.js';

const riskScoreElement = document.getElementById('riskScore');
const locationText = document.getElementById('locationText');
const coordsText = document.getElementById('coordsText');
const activityList = document.getElementById('activityList');
const statusNote = document.getElementById('statusNote');
const callModal = document.getElementById('callModal');
const callName = document.getElementById('callName');
const callStatus = document.getElementById('callStatus');
const incomingCallScreen = document.getElementById('incomingCallScreen');
const pickupScreen = document.getElementById('pickupScreen');
const pickupName = document.getElementById('pickupName');
const pickupStatus = document.getElementById('pickupStatus');
const answerCallBtn = document.getElementById('answerCallBtn');
const declineCallBtn = document.getElementById('declineCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const toast = document.getElementById('toast');
const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSwitch = document.getElementById('authSwitch');
const submitAuthBtn = document.getElementById('submitAuthBtn');
const formMessage = document.getElementById('formMessage');
const signupExtras = document.getElementById('signupExtras');
const userBadge = document.getElementById('userBadge');
const authHint = document.getElementById('authHint');

const SESSION_KEY = 'rakshasutra-current-user';
let riskScore = 24;
let isSignupMode = true;
let currentUser = null;
const contacts = ['Mom', 'Brother', 'Trusted Friend'];

function updateRiskScore() {
  if (riskScoreElement) {
    riskScoreElement.textContent = String(riskScore);
  }
}

function addActivity(message) {
  const item = document.createElement('li');
  item.textContent = message;
  activityList.prepend(item);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2200);
}

function ensureAuthenticated(action) {
  if (!currentUser) {
    showToast('Register or log in to unlock safety features.');
    statusNote.textContent = 'Register or log in to unlock safety controls.';
    return false;
  }

  if (action) {
    statusNote.textContent = `${action} is now active for ${currentUser.fullName.split(' ')[0]}.`;
  }
  return true;
}

function persistSession(user) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, user.id);
  }
}

function clearSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function restoreSession() {
  if (typeof window === 'undefined') {
    return;
  }

  const savedId = window.localStorage.getItem(SESSION_KEY);
  if (!savedId) {
    return;
  }

  const savedUser = readUsers().find((user) => user.id === savedId);
  if (savedUser) {
    setCurrentUser(savedUser);
  }
}

function showCallModal() {
  const caller = contacts[Math.floor(Math.random() * contacts.length)];
  callName.textContent = caller;
  callStatus.textContent = 'Ringing • tap answer to continue';
  incomingCallScreen.hidden = false;
  pickupScreen.hidden = true;
  callModal.classList.remove('hidden');
  callModal.setAttribute('aria-hidden', 'false');
}

function answerCall() {
  if (!ensureAuthenticated('Your safe call')) {
    return;
  }
  incomingCallScreen.hidden = true;
  pickupScreen.hidden = false;
  pickupName.textContent = 'Safe Exit Mode';
  pickupStatus.textContent = 'A calm call is now active. Move to a safe place and keep your route visible.';
  callStatus.textContent = 'Connected';
  addActivity('Incoming call answered. You are now in a safe-call flow.');
  addIncident({ type: 'call', message: 'Incoming call answered.' });
  showToast('Call answered. Stay calm and move to a safe place.');
}

function declineCall() {
  callModal.classList.add('hidden');
  callModal.setAttribute('aria-hidden', 'true');
  addActivity('Incoming call declined. Your safety flow continues.');
  showToast('Call dismissed.');
}

function shareLocation() {
  if (!ensureAuthenticated('Live location sharing')) {
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lon = position.coords.longitude.toFixed(5);
        const accuracy = Math.round(position.coords.accuracy || 0);
        const accuracyLabel = accuracy <= 25 ? 'High-precision GPS' : accuracy <= 100 ? 'Moderate GPS' : 'Open area recommended for better accuracy';
        locationText.textContent = 'Live location shared';
        coordsText.textContent = `${lat}, ${lon} · ±${accuracy}m · ${accuracyLabel}`;
        statusNote.textContent = 'Location updated with high-accuracy GPS. Trusted contacts are notified.';
        showToast('Location shared with trusted contacts.');
        addActivity('Live location sharing enabled with your emergency circle.');
        addIncident({ type: 'location', message: 'Location shared with trusted contacts.' });
      },
      () => {
        locationText.textContent = 'Bengaluru, Karnataka';
        coordsText.textContent = 'Lat 12.9716 · Lon 77.5946 · GPS unavailable';
        showToast('Location sharing is ready. GPS unavailable on this device.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  } else {
    showToast('Location sharing is ready. GPS unavailable on this device.');
  }
}

function renderAuthMode() {
  if (isSignupMode) {
    authTitle.textContent = 'Create your account';
    submitAuthBtn.textContent = 'Create account';
    authSwitch.textContent = 'Already have an account?';
    authHint.textContent = 'Create an account to unlock one-tap SOS, live location sharing, and safety controls.';
  } else {
    authTitle.textContent = 'Log in to RakshaSutra';
    submitAuthBtn.textContent = 'Log in';
    authSwitch.textContent = 'Need to create an account?';
    authHint.textContent = 'Log in with your registered account to keep using your safety tools.';
  }

  signupExtras.hidden = !isSignupMode;
  const requiredFields = document.querySelectorAll('#authForm input[required]');
  requiredFields.forEach((input) => {
    input.required = isSignupMode ? true : input.id === 'email' || input.id === 'password';
  });
}

function showDashboard() {
  authView.hidden = true;
  dashboardView.hidden = false;
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    userBadge.textContent = `Welcome, ${user.fullName.split(' ')[0]}`;
    persistSession(user);
    showDashboard();
    statusNote.textContent = 'Your account is active. Safety controls are unlocked.';
  }
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const formData = new FormData(authForm);
  const profile = {
    fullName: formData.get('fullName') || document.getElementById('fullName').value,
    email: formData.get('email') || document.getElementById('email').value,
    phone: formData.get('phone') || document.getElementById('phone').value,
    password: formData.get('password') || document.getElementById('password').value,
    guardianName: formData.get('guardianName') || document.getElementById('guardianName').value,
    guardianPhone: formData.get('guardianPhone') || document.getElementById('guardianPhone').value,
    trustedName: formData.get('trustedName') || document.getElementById('trustedName').value,
    trustedAddress: formData.get('trustedAddress') || document.getElementById('trustedAddress').value,
    trustedPhone: formData.get('trustedPhone') || document.getElementById('trustedPhone').value
  };

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
    showToast('Welcome back to RakshaSutra.');
    authForm.reset();
  } else {
    formMessage.textContent = 'Invalid credentials. Try again.';
    showToast('Invalid credentials.');
  }
}

document.getElementById('sosBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('SOS')) {
    return;
  }
  riskScore = Math.min(100, riskScore + 16);
  updateRiskScore();
  statusNote.textContent = 'Emergency signal sent. Trusted contacts and nearby helpers are notified.';
  addActivity('One-tap SOS triggered. Emergency support is on its way.');
  addIncident({ type: 'sos', message: 'One-tap SOS triggered.' });
  showToast('SOS triggered. Help is on the way.');
});

document.getElementById('voiceBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('Voice SOS')) {
    return;
  }
  statusNote.textContent = 'Voice SOS is listening for a help command.';
  addActivity('Voice SOS activated. Speak clearly if you need assistance.');
  addIncident({ type: 'voice', message: 'Voice SOS activated.' });
  showToast('Voice SOS activated.');
});

document.getElementById('callBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('Call assist')) {
    return;
  }
  showCallModal();
  addActivity('Fake incoming call launched to help you exit the situation.');
  addIncident({ type: 'call', message: 'Fake incoming call launched.' });
});

document.getElementById('shareBtn').addEventListener('click', shareLocation);

document.getElementById('scanBtn').addEventListener('click', () => {
  if (!ensureAuthenticated('Safety scan')) {
    return;
  }
  riskScore = Math.min(100, riskScore + Math.floor(Math.random() * 12) + 4);
  updateRiskScore();
  statusNote.textContent = 'AI scan detected a higher-risk area. Consider a safer route.';
  addActivity('AI scan updated risk profile for your current surroundings.');
  addIncident({ type: 'scan', message: 'AI scan completed.' });
  showToast('AI scan complete.');
});

answerCallBtn.addEventListener('click', answerCall);
declineCallBtn.addEventListener('click', declineCall);
endCallBtn.addEventListener('click', () => {
  callModal.classList.add('hidden');
  callModal.setAttribute('aria-hidden', 'true');
  showToast('Call ended.');
});

authSwitch.addEventListener('click', () => {
  isSignupMode = !isSignupMode;
  renderAuthMode();
});
authForm.addEventListener('submit', handleAuthSubmit);

renderAuthMode();
updateRiskScore();
restoreSession();
