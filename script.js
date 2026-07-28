import { createUser, authenticateUser } from './auth.js';
import { addIncident, getAdminStats, readIncidents, readUsers } from './dataStore.js';
import { authenticateAdmin, exportIncidents, importIncidents } from './admin.js';

const riskScoreElement = document.getElementById("riskScore");
const locationText = document.getElementById("locationText");
const coordsText = document.getElementById("coordsText");
const activityList = document.getElementById("activityList");
const statusNote = document.getElementById("statusNote");
const callModal = document.getElementById("callModal");
const callName = document.getElementById("callName");
const callStatus = document.getElementById("callStatus");
const toast = document.getElementById("toast");
const landingView = document.getElementById("landingView");
const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSwitch = document.getElementById("authSwitch");
const submitAuthBtn = document.getElementById("submitAuthBtn");
const formMessage = document.getElementById("formMessage");
const signupExtras = document.getElementById("signupExtras");
const logoutBtn = document.getElementById("logoutBtn");
const switchModeBtn = document.getElementById("switchModeBtn");
const getStartedBtn = document.getElementById("getStartedBtn");
const userBadge = document.getElementById("userBadge");
const adminView = document.getElementById("adminView");
const adminLoginPanel = document.getElementById("adminLoginPanel");
const adminDashboard = document.getElementById("adminDashboard");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginMessage = document.getElementById("adminLoginMessage");
const adminStats = document.getElementById("adminStats");
const adminOverview = document.getElementById("adminOverview");
const adminUsers = document.getElementById("adminUsers");
const adminIncidents = document.getElementById("adminIncidents");
const adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]'));
const exportIncidentsBtn = document.getElementById("exportIncidentsBtn");
const importIncidentsInput = document.getElementById("importIncidentsInput");

let riskScore = 24;
let isSignupMode = true;
let currentUser = null;
let activeAdminTab = 'overview';
const contacts = ["Mom", "Brother", "Trusted Friend"];

function updateRiskScore() {
  riskScoreElement.textContent = String(riskScore);
}

function addActivity(message) {
  const item = document.createElement("li");
  item.textContent = message;
  activityList.prepend(item);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

function showCallModal() {
  const caller = contacts[Math.floor(Math.random() * contacts.length)];
  callName.textContent = caller;
  callStatus.textContent = "Answering in 3 seconds...";
  callModal.classList.remove("hidden");
  callModal.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    callStatus.textContent = "Call dismissed. You can leave safely.";
  }, 2200);

  setTimeout(() => {
    callModal.classList.add("hidden");
    callModal.setAttribute("aria-hidden", "true");
  }, 3600);
}

function shareLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        locationText.textContent = "Live location shared";
        coordsText.textContent = `Lat ${lat} · Lon ${lon}`;
        showToast("Location shared with trusted contacts.");
        addActivity("Live location sharing enabled with your emergency circle.");
      },
      () => {
        locationText.textContent = "Bengaluru, Karnataka";
        coordsText.textContent = "Lat 12.9716 · Lon 77.5946";
        showToast("Location sharing is ready. GPS unavailable on this device.");
      }
    );
  } else {
    showToast("Location sharing is ready. GPS unavailable on this device.");
  }
}

function renderAuthMode() {
  if (isSignupMode) {
    authTitle.textContent = "Create your account";
    submitAuthBtn.textContent = "Create account";
    authSwitch.textContent = "Already have an account?";
  } else {
    authTitle.textContent = "Log in to RakshaSutra";
    submitAuthBtn.textContent = "Log in";
    authSwitch.textContent = "Need to create an account?";
  }

  signupExtras.hidden = !isSignupMode;

  const requiredFields = document.querySelectorAll('#authForm input[required]');
  requiredFields.forEach((input) => {
    input.required = isSignupMode ? true : input.id === 'email' || input.id === 'password';
  });
}

function showAuthView() {
  landingView.hidden = true;
  authView.hidden = false;
  dashboardView.hidden = true;
  formMessage.textContent = "";
  renderAuthMode();
}

function showDashboard() {
  landingView.hidden = true;
  authView.hidden = true;
  dashboardView.hidden = false;
  adminView.hidden = false;
  logoutBtn.hidden = false;
  switchModeBtn.textContent = "Profile";
  renderAdminPanel();
}

function showAdminDashboard() {
  adminLoginPanel.hidden = true;
  adminDashboard.hidden = false;
  renderAdminPanel();
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    userBadge.textContent = `Welcome, ${user.fullName.split(' ')[0]}`;
    showDashboard();
  }
}

function renderAdminPanel() {
  const stats = getAdminStats();
  const users = readUsers();
  const incidents = readIncidents();

  adminStats.innerHTML = `
    <div class="admin-stat"><span>Users</span><strong>${stats.userCount}</strong></div>
    <div class="admin-stat"><span>Incidents</span><strong>${stats.incidentCount}</strong></div>
    <div class="admin-stat"><span>Active alerts</span><strong>${stats.activeAlerts}</strong></div>
  `;

  adminOverview.innerHTML = `
    <div class="admin-list">
      <div class="admin-list-item">
        <strong>System status</strong>
        <p>Guardian mode and monitoring are active.</p>
      </div>
      <div class="admin-list-item">
        <strong>Latest event</strong>
        <p>${stats.lastIncident ? `${stats.lastIncident.type.toUpperCase()} • ${stats.lastIncident.createdAt}` : 'No incidents recorded yet.'}</p>
      </div>
    </div>
  `;

  adminUsers.innerHTML = `
    <div class="admin-list">
      ${users.length ? users.map((user) => `
        <div class="admin-list-item">
          <strong>${user.fullName}</strong>
          <p>${user.email}</p>
          <p>${user.phone}</p>
        </div>
      `).join('') : '<div class="admin-list-item"><p>No users registered yet.</p></div>'}
    </div>
  `;

  adminIncidents.innerHTML = `
    <div class="admin-list">
      ${incidents.length ? incidents.map((incident) => `
        <div class="admin-list-item">
          <strong>${incident.type.toUpperCase()}</strong>
          <p>${incident.message}</p>
          <p>${incident.createdAt}</p>
        </div>
      `).join('') : '<div class="admin-list-item"><p>No incidents recorded yet.</p></div>'}
    </div>
  `;

  adminTabs.forEach((tabButton) => {
    const isActive = tabButton.dataset.adminTab === activeAdminTab;
    tabButton.classList.toggle('primary-btn', isActive);
    tabButton.classList.toggle('ghost-button', !isActive);
  });

  [adminOverview, adminUsers, adminIncidents].forEach((panel) => {
    panel.hidden = true;
  });

  if (activeAdminTab === 'users') {
    adminUsers.hidden = false;
  } else if (activeAdminTab === 'incidents') {
    adminIncidents.hidden = false;
  } else {
    adminOverview.hidden = false;
  }
}

function recordEvent(type, message) {
  addIncident({ type, message });
  if (!adminDashboard.hidden) {
    renderAdminPanel();
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

document.getElementById("sosBtn").addEventListener("click", () => {
  riskScore = Math.min(100, riskScore + 16);
  updateRiskScore();
  statusNote.textContent = "Emergency signal sent. Trusted contacts and nearby helpers are notified.";
  addActivity("One-tap SOS triggered. Emergency support is on its way.");
  recordEvent('sos', 'One-tap SOS triggered.');
  showToast("SOS triggered. Help is on the way.");
});

document.getElementById("voiceBtn").addEventListener("click", () => {
  statusNote.textContent = "Voice SOS is listening for a help command.";
  addActivity("Voice SOS activated. Speak clearly if you need assistance.");
  recordEvent('voice', 'Voice SOS activated.');
  showToast("Voice SOS activated.");
});

document.getElementById("callBtn").addEventListener("click", () => {
  showCallModal();
  addActivity("Fake incoming call launched to help you exit the situation.");
  recordEvent('call', 'Fake incoming call launched.');
});

document.getElementById("shareBtn").addEventListener("click", () => {
  shareLocation();
  recordEvent('location', 'Location shared with trusted contacts.');
});

document.getElementById("scanBtn").addEventListener("click", () => {
  riskScore = Math.min(100, riskScore + Math.floor(Math.random() * 12) + 4);
  updateRiskScore();
  statusNote.textContent = "AI scan detected a higher-risk area. Consider a safer route.";
  addActivity("AI scan updated risk profile for your current surroundings.");
  recordEvent('scan', 'AI scan completed.');
  showToast("AI scan complete.");
});

getStartedBtn.addEventListener("click", showAuthView);
switchModeBtn.addEventListener("click", () => {
  if (currentUser) {
    showDashboard();
    return;
  }
  isSignupMode = !isSignupMode;
  renderAuthMode();
  showAuthView();
});
authSwitch.addEventListener("click", () => {
  isSignupMode = !isSignupMode;
  renderAuthMode();
});
logoutBtn.addEventListener("click", () => {
  currentUser = null;
  logoutBtn.hidden = true;
  switchModeBtn.textContent = "Login / Signup";
  landingView.hidden = false;
  authView.hidden = true;
  dashboardView.hidden = true;
  showToast("You have logged out.");
});
authForm.addEventListener("submit", handleAuthSubmit);

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;

  if (authenticateAdmin(username, password)) {
    adminLoginMessage.textContent = "Access granted.";
    showAdminDashboard();
  } else {
    adminLoginMessage.textContent = "Invalid admin credentials.";
  }
});

exportIncidentsBtn.addEventListener("click", () => {
  const exported = exportIncidents();
  const blob = new Blob([exported], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rakshasutra-incidents.json';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Incident data exported.');
});

importIncidentsInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const count = importIncidents(Array.isArray(parsed) ? parsed : []);
      renderAdminPanel();
      showToast(`${count} incidents imported.`);
    } catch {
      showToast('Import failed. Please use a valid JSON file.');
    }
  };
  reader.readAsText(file);
});

adminTabs.forEach((button) => {
  button.addEventListener('click', () => {
    activeAdminTab = button.dataset.adminTab;
    renderAdminPanel();
  });
});

updateRiskScore();
renderAuthMode();
renderAdminPanel();
