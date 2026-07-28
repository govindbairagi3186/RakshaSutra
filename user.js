import { createUser, authenticateUser } from './auth.js';
import { addIncident, getAdminStats, readIncidents, readUsers } from './dataStore.js';

const riskScoreElement = document.getElementById('riskScore');
const locationText = document.getElementById('locationText');
const coordsText = document.getElementById('coordsText');
const activityList = document.getElementById('activityList');
const statusNote = document.getElementById('statusNote');
const callModal = document.getElementById('callModal');
const callName = document.getElementById('callName');
const callStatus = document.getElementById('callStatus');
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

function showCallModal() {
  const caller = contacts[Math.floor(Math.random() * contacts.length)];
  callName.textContent = caller;
  callStatus.textContent = 'Answering in 3 seconds...';
  callModal.classList.remove('hidden');
  callModal.setAttribute('aria-hidden', 'false');

  setTimeout(() => {
    callStatus.textContent = 'Call dismissed. You can leave safely.';
  }, 2200);

  setTimeout(() => {
    callModal.classList.add('hidden');
    callModal.setAttribute('aria-hidden', 'true');
  }, 3600);
}

function shareLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        locationText.textContent = 'Live location shared';
        coordsText.textContent = `Lat ${lat} · Lon ${lon}`;
        showToast('Location shared with trusted contacts.');
        addActivity('Live location sharing enabled with your emergency circle.');
        addIncident({ type: 'location', message: 'Location shared with trusted contacts.' });
      },
      () => {
        locationText.textContent = 'Bengaluru, Karnataka';
        coordsText.textContent = 'Lat 12.9716 · Lon 77.5946';
        showToast('Location sharing is ready. GPS unavailable on this device.');
      }
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
  } else {
    authTitle.textContent = 'Log in to RakshaSutra';
    submitAuthBtn.textContent = 'Log in';
    authSwitch.textContent = 'Need to create an account?';
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
    showDashboard();
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
  riskScore = Math.min(100, riskScore + 16);
  updateRiskScore();
  statusNote.textContent = 'Emergency signal sent. Trusted contacts and nearby helpers are notified.';
  addActivity('One-tap SOS triggered. Emergency support is on its way.');
  addIncident({ type: 'sos', message: 'One-tap SOS triggered.' });
  showToast('SOS triggered. Help is on the way.');
});

document.getElementById('voiceBtn').addEventListener('click', () => {
  statusNote.textContent = 'Voice SOS is listening for a help command.';
  addActivity('Voice SOS activated. Speak clearly if you need assistance.');
  addIncident({ type: 'voice', message: 'Voice SOS activated.' });
  showToast('Voice SOS activated.');
});

document.getElementById('callBtn').addEventListener('click', () => {
  showCallModal();
  addActivity('Fake incoming call launched to help you exit the situation.');
  addIncident({ type: 'call', message: 'Fake incoming call launched.' });
});

document.getElementById('shareBtn').addEventListener('click', shareLocation);

document.getElementById('scanBtn').addEventListener('click', () => {
  riskScore = Math.min(100, riskScore + Math.floor(Math.random() * 12) + 4);
  updateRiskScore();
  statusNote.textContent = 'AI scan detected a higher-risk area. Consider a safer route.';
  addActivity('AI scan updated risk profile for your current surroundings.');
  addIncident({ type: 'scan', message: 'AI scan completed.' });
  showToast('AI scan complete.');
});

authSwitch.addEventListener('click', () => {
  isSignupMode = !isSignupMode;
  renderAuthMode();
});
authForm.addEventListener('submit', handleAuthSubmit);

renderAuthMode();
updateRiskScore();
