import {
  addIncident,
  readIncidents,
  readUsers
} from "./dataStore.js";


/* =====================================================
   RAKSHASUTRA ADMIN PORTAL
   ===================================================== */

const DEFAULT_ADMIN = {
  username: "GOVIND",
  password: "GOVIND#1"
};

const ADMIN_SESSION_KEY =
  "rakshasutra-admin-authenticated";

let adminCredentials = {
  ...DEFAULT_ADMIN
};


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const els = {
  loginPanel: document.getElementById("adminLoginPanel"),
  dashboard: document.getElementById("adminDashboard"),

  loginForm: document.getElementById("adminLoginForm"),
  username: document.getElementById("adminUsername"),
  password: document.getElementById("adminPassword"),
  loginMessage: document.getElementById("adminLoginMessage"),

  logoutBtn: document.getElementById("adminLogoutBtn"),

  stats: document.getElementById("adminStats"),

  overview: document.getElementById("adminOverview"),
  users: document.getElementById("adminUsers"),
  incidents: document.getElementById("adminIncidents"),

  exportBtn: document.getElementById("exportIncidentsBtn"),
  importInput: document.getElementById("importIncidentsInput"),

  tabs: document.querySelectorAll("[data-admin-tab]"),

  toast: document.getElementById("toast")
};


/* =====================================================
   TOAST
   ===================================================== */

function showToast(message) {

  if (!els.toast) {
    return;
  }

  els.toast.textContent = message;

  els.toast.classList.remove("hidden");

  window.clearTimeout(
    showToast.timer
  );

  showToast.timer =
    window.setTimeout(() => {

      els.toast.classList.add("hidden");

    }, 3000);
}


/* =====================================================
   ADMIN AUTHENTICATION
   ===================================================== */

function authenticateAdmin(
  username,
  password
) {

  return (
    String(username || "") ===
      adminCredentials.username &&

    String(password || "") ===
      adminCredentials.password
  );
}


/* =====================================================
   ADMIN SESSION
   ===================================================== */

function isAdminAuthenticated() {

  try {

    return (
      localStorage.getItem(
        ADMIN_SESSION_KEY
      ) === "true"
    );

  } catch {

    return false;
  }
}


function setAdminAuthenticated(value) {

  try {

    if (value) {

      localStorage.setItem(
        ADMIN_SESSION_KEY,
        "true"
      );

    } else {

      localStorage.removeItem(
        ADMIN_SESSION_KEY
      );
    }

  } catch (error) {

    console.warn(
      "Unable to save admin session:",
      error
    );
  }
}


/* =====================================================
   LOGIN MESSAGE
   ===================================================== */

function showLoginMessage(
  message,
  type = "error"
) {

  if (!els.loginMessage) {
    return;
  }

  els.loginMessage.textContent =
    message;

  if (type === "success") {

    els.loginMessage.style.color =
      "#4ade80";

  } else {

    els.loginMessage.style.color =
      "#ff6b6b";
  }
}


/* =====================================================
   SHOW LOGIN
   ===================================================== */

function showLoginPanel() {

  if (els.loginPanel) {
    els.loginPanel.hidden = false;
  }

  if (els.dashboard) {
    els.dashboard.hidden = true;
  }

  if (els.logoutBtn) {
    els.logoutBtn.hidden = true;
  }
}


/* =====================================================
   SHOW DASHBOARD
   ===================================================== */

function showDashboard() {

  if (els.loginPanel) {
    els.loginPanel.hidden = true;
  }

  if (els.dashboard) {
    els.dashboard.hidden = false;
  }

  if (els.logoutBtn) {
    els.logoutBtn.hidden = false;
  }

  renderDashboard();
}


/* =====================================================
   LOGIN
   ===================================================== */

function handleAdminLogin(event) {

  event.preventDefault();

  const username =
    els.username?.value.trim() || "";

  const password =
    els.password?.value || "";


  if (!username) {

    showLoginMessage(
      "Please enter the admin username."
    );

    els.username?.focus();

    return;
  }


  if (!password) {

    showLoginMessage(
      "Please enter the admin password."
    );

    els.password?.focus();

    return;
  }


  const authenticated =
    authenticateAdmin(
      username,
      password
    );


  if (!authenticated) {

    showLoginMessage(
      "Invalid admin username or password."
    );

    if (els.password) {
      els.password.value = "";
      els.password.focus();
    }

    return;
  }


  /* ---------------------------------------------
     SUCCESS
  --------------------------------------------- */

  setAdminAuthenticated(true);

  showLoginMessage(
    "Admin login successful.",
    "success"
  );


  if (els.password) {
    els.password.value = "";
  }


  window.setTimeout(() => {

    showDashboard();

  }, 300);
}


/* =====================================================
   LOGOUT
   ===================================================== */

function logoutAdmin() {

  setAdminAuthenticated(false);

  showLoginPanel();

  if (els.username) {
    els.username.value = "";
  }

  if (els.password) {
    els.password.value = "";
  }

  showLoginMessage("");

  showToast(
    "Admin logged out."
  );
}


/* =====================================================
   ACTIVE SOS
   ===================================================== */

function isIncidentActive(
  incident
) {

  if (!incident) {
    return false;
  }


  if (
    incident.status === "resolved" ||
    incident.resolved === true ||
    incident.resolvedAt
  ) {
    return false;
  }


  return (
    String(
      incident.type || ""
    ).toLowerCase() === "sos"
  );
}


/* =====================================================
   ADMIN OVERVIEW DATA
   ===================================================== */

function getAdminOverview() {

  const users =
    readUsers();

  const incidents =
    readIncidents();


  const activeAlerts =
    incidents.filter(
      isIncidentActive
    );


  const resolvedAlerts =
    incidents.filter(
      (incident) =>
        incident.status === "resolved" ||
        incident.resolved === true ||
        Boolean(incident.resolvedAt)
    );


  return {

    userCount:
      users.length,

    incidentCount:
      incidents.length,

    activeAlertCount:
      activeAlerts.length,

    resolvedAlertCount:
      resolvedAlerts.length,

    activeAlerts,

    resolvedAlerts,

    latestIncident:
      incidents[0] || null
  };
}


/* =====================================================
   FORMAT DATE
   ===================================================== */

function formatDate(value) {

  if (!value) {
    return "—";
  }

  try {

    return new Date(value)
      .toLocaleString("en-IN");

  } catch {

    return String(value);
  }
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   RENDER STATS
===================================================== */

function renderStats() {

  if (!els.stats) {
    return;
  }


  const overview =
    getAdminOverview();


  els.stats.innerHTML = `

    <div class="status-pill">
      <span>Total Users</span>
      <strong>${overview.userCount}</strong>
    </div>

    <div class="status-pill">
      <span>Total Incidents</span>
      <strong>${overview.incidentCount}</strong>
    </div>

    <div class="status-pill">
      <span>Active SOS</span>
      <strong>${overview.activeAlertCount}</strong>
    </div>

    <div class="status-pill">
      <span>Resolved</span>
      <strong>${overview.resolvedAlertCount}</strong>
    </div>

  `;
}


/* =====================================================
   RENDER OVERVIEW
===================================================== */

function renderOverview() {

  if (!els.overview) {
    return;
  }


  const data =
    getAdminOverview();


  let latestHTML =
    "<p>No incidents recorded yet.</p>";


  if (data.latestIncident) {

    const incident =
      data.latestIncident;


    latestHTML = `

      <div class="status-note">

        <strong>
          Latest Incident
        </strong>

        <p>
          ${escapeHTML(
            incident.message ||
            "Incident recorded"
          )}
        </p>

        <small>
          Type:
          ${escapeHTML(
            incident.type || "unknown"
          )}
          ·
          ${formatDate(
            incident.createdAt ||
            incident.startedAt
          )}
        </small>

      </div>

    `;
  }


  els.overview.innerHTML = `

    <div class="card-head">
      <h3>Admin Overview</h3>
    </div>

    <div class="admin-info-card">

      <p>RakshaSutra monitoring</p>

      <strong>
        ${data.activeAlertCount}
        active SOS alert(s)
      </strong>

    </div>

    ${latestHTML}

  `;
}


/* =====================================================
   RENDER USERS
===================================================== */

function renderUsers() {

  if (!els.users) {
    return;
  }


  const users =
    readUsers();


  if (!users.length) {

    els.users.innerHTML = `

      <div class="status-note">
        No registered users yet.
      </div>

    `;

    return;
  }


  const rows =
    users.map((user) => {

      return `

        <div class="status-note">

          <strong>
            ${escapeHTML(
              user.fullName ||
              "Unnamed User"
            )}
          </strong>

          <p>
            Email:
            ${escapeHTML(
              user.email || "—"
            )}
          </p>

          <p>
            Phone:
            ${escapeHTML(
              user.phone || "—"
            )}
          </p>

          <p>
            Guardian:
            ${escapeHTML(
              user.guardianName || "—"
            )}
            —
            ${escapeHTML(
              user.guardianPhone || "—"
            )}
          </p>

          <p>
            Trusted Contact:
            ${escapeHTML(
              user.trustedName || "—"
            )}
            —
            ${escapeHTML(
              user.trustedPhone || "—"
            )}
          </p>

          <small>
            Registered:
            ${formatDate(
              user.createdAt
            )}
          </small>

        </div>

      `;

    }).join("");


  els.users.innerHTML = `

    <div class="card-head">
      <h3>Registered Users</h3>
    </div>

    <div class="admin-list">
      ${rows}
    </div>

  `;
}


/* =====================================================
   RENDER INCIDENTS
===================================================== */

function renderIncidents() {

  if (!els.incidents) {
    return;
  }


  const incidents =
    readIncidents();


  if (!incidents.length) {

    els.incidents.innerHTML = `

      <div class="status-note">
        No incidents recorded yet.
      </div>

    `;

    return;
  }


  const rows =
    incidents.map((incident) => {

      const active =
        isIncidentActive(
          incident
        );


      return `

        <div class="status-note">

          <strong>
            ${active
              ? "🔴 ACTIVE SOS"
              : "📋 " +
                escapeHTML(
                  incident.type ||
                  "Incident"
                )}
          </strong>

          <p>
            ${escapeHTML(
              incident.message ||
              "No message"
            )}
          </p>

          <small>

            Status:
            ${escapeHTML(
              incident.status ||
              "unknown"
            )}

            ·

            Time:
            ${formatDate(
              incident.createdAt ||
              incident.startedAt ||
              incident.stoppedAt ||
              incident.resolvedAt
            )}

            ${
              incident.latitude !== null &&
              incident.latitude !== undefined
                ? ` · GPS:
                   ${escapeHTML(
                     incident.latitude
                   )},
                   ${escapeHTML(
                     incident.longitude
                   )}`
                : ""
            }

          </small>

        </div>

      `;

    }).join("");


  els.incidents.innerHTML = `

    <div class="card-head">
      <h3>Incident Monitoring</h3>
    </div>

    <div class="admin-list">
      ${rows}
    </div>

  `;
}


/* =====================================================
   RENDER DASHBOARD
===================================================== */

function renderDashboard() {

  renderStats();

  renderOverview();

  renderUsers();

  renderIncidents();

  updateChartBars();
}


/* =====================================================
   CHART BARS
===================================================== */

function updateChartBars() {

  const incidents =
    readIncidents();


  const sosCount =
    incidents.filter(
      (item) =>
        String(
          item.type || ""
        ).toLowerCase() === "sos"
    ).length;


  const voiceCount =
    incidents.filter(
      (item) =>
        String(
          item.type || ""
        ).toLowerCase().includes("voice")
    ).length;


  const locationCount =
    incidents.filter(
      (item) =>
        String(
          item.type || ""
        ).toLowerCase().includes("location")
    ).length;


  const max =
    Math.max(
      sosCount,
      voiceCount,
      locationCount,
      1
    );


  const sosBar =
    document.querySelector(
      ".bar-fill.sos"
    );

  const voiceBar =
    document.querySelector(
      ".bar-fill.voice"
    );

  const locationBar =
    document.querySelector(
      ".bar-fill.location"
    );


  if (sosBar) {
    sosBar.style.width =
      `${(sosCount / max) * 100}%`;
  }

  if (voiceBar) {
    voiceBar.style.width =
      `${(voiceCount / max) * 100}%`;
  }

  if (locationBar) {
    locationBar.style.width =
      `${(locationCount / max) * 100}%`;
  }
}


/* =====================================================
   ADMIN TABS
===================================================== */

function openAdminTab(tabName) {

  const tabs = {
    overview: els.overview,
    users: els.users,
    incidents: els.incidents
  };


  Object.entries(tabs)
    .forEach(([name, element]) => {

      if (!element) {
        return;
      }

      element.hidden =
        name !== tabName;

    });


  els.tabs.forEach((button) => {

    const active =
      button.dataset.adminTab ===
      tabName;

    button.setAttribute(
      "aria-selected",
      active ? "true" : "false"
    );

    if (active) {

      button.classList.add(
        "active"
      );

    } else {

      button.classList.remove(
        "active"
      );
    }
  });
}


/* =====================================================
   EXPORT INCIDENTS
===================================================== */

function exportIncidents() {

  const incidents =
    readIncidents();


  const json =
    JSON.stringify(
      incidents,
      null,
      2
    );


  const blob =
    new Blob(
      [json],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href = url;

  link.download =
    `rakshasutra-incidents-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;


  document.body.appendChild(
    link
  );

  link.click();

  link.remove();


  URL.revokeObjectURL(
    url
  );


  showToast(
    "Incidents exported successfully."
  );
}


/* =====================================================
   IMPORT INCIDENTS
===================================================== */

function importIncidents(
  entries
) {

  if (!Array.isArray(entries)) {
    return 0;
  }


  let imported = 0;


  entries.forEach((entry) => {

    if (
      !entry ||
      typeof entry !== "object"
    ) {
      return;
    }


    addIncident({

      id:
        entry.id ||
        (
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`
        ),

      type:
        entry.type ||
        "unknown",

      message:
        entry.message ||
        "Imported incident",

      source:
        entry.source ||
        "import",

      status:
        entry.status ||
        "active",

      userId:
        entry.userId ||
        null,

      userEmail:
        entry.userEmail ||
        null,

      latitude:
        entry.latitude ??
        null,

      longitude:
        entry.longitude ??
        null,

      createdAt:
        entry.createdAt ||
        new Date().toISOString(),

      resolvedAt:
        entry.resolvedAt ||
        null

    });


    imported++;
  });


  return imported;
}


/* =====================================================
   HANDLE IMPORT
===================================================== */

async function handleImport(
  event
) {

  const file =
    event.target.files?.[0];


  if (!file) {
    return;
  }


  try {

    const text =
      await file.text();


    const data =
      JSON.parse(text);


    const count =
      importIncidents(data);


    showToast(
      `${count} incident(s) imported.`
    );


    renderDashboard();


    openAdminTab(
      "incidents"
    );

  } catch (error) {

    console.error(
      "Import error:",
      error
    );


    showToast(
      "Unable to import incidents. Please select a valid JSON file."
    );

  } finally {

    event.target.value = "";
  }
}


/* =====================================================
   SET ADMIN CREDENTIALS
===================================================== */

function setAdminCredentials(
  username,
  password
) {

  if (!username || !password) {
    return false;
  }


  adminCredentials = {

    username:
      String(username),

    password:
      String(password)

  };


  return true;
}


/* =====================================================
   RESET ADMIN STATE
===================================================== */

function resetAdminState() {

  adminCredentials = {
    ...DEFAULT_ADMIN
  };

  setAdminAuthenticated(
    false
  );
}


/* =====================================================
   GET ADMIN USERNAME
===================================================== */

function getAdminUsername() {

  return adminCredentials.username;
}


/* =====================================================
   EVENT LISTENERS
===================================================== */

if (els.loginForm) {

  els.loginForm.addEventListener(
    "submit",
    handleAdminLogin
  );
}


if (els.logoutBtn) {

  els.logoutBtn.addEventListener(
    "click",
    logoutAdmin
  );
}


if (els.exportBtn) {

  els.exportBtn.addEventListener(
    "click",
    exportIncidents
  );
}


if (els.importInput) {

  els.importInput.addEventListener(
    "change",
    handleImport
  );
}


els.tabs.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      openAdminTab(
        button.dataset.adminTab
      );

    }
  );

});


/* =====================================================
   INITIALIZE ADMIN PORTAL
===================================================== */

function initializeAdminPortal() {

  if (
    isAdminAuthenticated()
  ) {

    showDashboard();

    openAdminTab(
      "overview"
    );

  } else {

    showLoginPanel();
  }
}


initializeAdminPortal();


/* =====================================================
   EXPORT
===================================================== */

export {

  authenticateAdmin,

  isAdminAuthenticated,

  setAdminAuthenticated,

  exportIncidents,

  getAdminOverview,

  importIncidents,

  resetAdminState,

  setAdminCredentials,

  getAdminUsername

};
