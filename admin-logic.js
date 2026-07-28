import { authenticateAdmin, exportIncidents, getAdminOverview, importIncidents } from './admin.js';
import { readIncidents, readUsers } from './dataStore.js';

const adminLoginPanel = document.getElementById('adminLoginPanel');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginMessage = document.getElementById('adminLoginMessage');
const adminStats = document.getElementById('adminStats');
const adminOverview = document.getElementById('adminOverview');
const adminUsers = document.getElementById('adminUsers');
const adminIncidents = document.getElementById('adminIncidents');
const exportIncidentsBtn = document.getElementById('exportIncidentsBtn');
const importIncidentsInput = document.getElementById('importIncidentsInput');
const toast = document.getElementById('toast');
const adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]'));

let activeAdminTab = 'overview';

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2200);
}

function renderAdminPanel() {
  const overview = getAdminOverview();
  const users = readUsers();
  const incidents = readIncidents();

  adminStats.innerHTML = `
    <div class="admin-stat"><span>Users</span><strong>${overview.userCount}</strong></div>
    <div class="admin-stat"><span>Incidents</span><strong>${overview.incidentCount}</strong></div>
    <div class="admin-stat"><span>Active alerts</span><strong>${overview.activeAlerts}</strong></div>
  `;

  adminOverview.innerHTML = `
    <div class="admin-list">
      <div class="admin-list-item">
        <strong>System status</strong>
        <p>Guardian mode and monitoring are active.</p>
      </div>
      <div class="admin-list-item">
        <strong>Latest event</strong>
        <p>${overview.latestIncident ? `${overview.latestIncident.type.toUpperCase()} • ${overview.latestIncident.createdAt}` : 'No incidents recorded yet.'}</p>
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

  adminTabs.forEach((button) => {
    const isActive = button.dataset.adminTab === activeAdminTab;
    button.classList.toggle('primary-btn', isActive);
    button.classList.toggle('ghost-button', !isActive);
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

adminLoginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;

  if (authenticateAdmin(username, password)) {
    adminLoginPanel.hidden = true;
    adminDashboard.hidden = false;
    adminLoginMessage.textContent = 'Access granted.';
    renderAdminPanel();
  } else {
    adminLoginMessage.textContent = 'Invalid admin credentials.';
  }
});

exportIncidentsBtn.addEventListener('click', () => {
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

renderAdminPanel();
