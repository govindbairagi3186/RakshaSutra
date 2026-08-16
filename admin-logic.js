import {
  authenticateAdmin,
  exportIncidents,
  getAdminOverview,
  importIncidents
} from './admin.js';

import {
  readIncidents,
  readUsers
} from './dataStore.js';


/* =====================================================
   ELEMENTS
===================================================== */

const adminLoginPanel =
  document.getElementById('adminLoginPanel');

const adminDashboard =
  document.getElementById('adminDashboard');

const adminLoginForm =
  document.getElementById('adminLoginForm');

const adminLoginMessage =
  document.getElementById('adminLoginMessage');

const adminStats =
  document.getElementById('adminStats');

const adminOverview =
  document.getElementById('adminOverview');

const adminUsers =
  document.getElementById('adminUsers');

const adminIncidents =
  document.getElementById('adminIncidents');

const exportIncidentsBtn =
  document.getElementById('exportIncidentsBtn');

const importIncidentsInput =
  document.getElementById('importIncidentsInput');

const adminUsernameInput =
  document.getElementById('adminUsername');

const adminPasswordInput =
  document.getElementById('adminPassword');

const adminLogoutBtn =
  document.getElementById('adminLogoutBtn');

const toast =
  document.getElementById('toast');

const adminTabs =
  Array.from(
    document.querySelectorAll(
      '[data-admin-tab]'
    )
  );


/* =====================================================
   ADMIN SESSION
===================================================== */

const ADMIN_SESSION_KEY =
  'rakshasutra-admin-session';

let activeAdminTab =
  'overview';


/* =====================================================
   HELPERS
===================================================== */

function escapeHTML(value) {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function formatDate(value) {

  if (!value) {
    return 'Not available';
  }

  try {

    return new Date(value)
      .toLocaleString(
        undefined,
        {
          dateStyle: 'medium',
          timeStyle: 'short'
        }
      );

  } catch {

    return String(value);
  }
}


function isResolved(incident) {

  return (
    incident?.status === 'resolved' ||
    incident?.resolved === true ||
    Boolean(incident?.resolvedAt)
  );
}


function isSOS(incident) {

  return (
    String(incident?.type || '')
      .toLowerCase() === 'sos'
  );
}


function showToast(message) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.remove(
    'hidden'
  );

  window.setTimeout(() => {

    toast.classList.add(
      'hidden'
    );

  }, 2500);
}


/* =====================================================
   SHOW / HIDE DASHBOARD
===================================================== */

function showAdminDashboard() {

  if (!adminLoginPanel ||
      !adminDashboard) {
    return;
  }

  adminLoginPanel.hidden =
    true;

  adminDashboard.hidden =
    false;

  if (adminLogoutBtn) {

    adminLogoutBtn.hidden =
      false;
  }

  if (adminLoginMessage) {

    adminLoginMessage.textContent =
      'Access granted.';
  }

  localStorage.setItem(
    ADMIN_SESSION_KEY,
    'true'
  );

  renderAdminPanel();
}


function hideAdminDashboard() {

  if (adminLoginPanel) {

    adminLoginPanel.hidden =
      false;
  }

  if (adminDashboard) {

    adminDashboard.hidden =
      true;
  }

  if (adminLogoutBtn) {

    adminLogoutBtn.hidden =
      true;
  }

  if (adminLoginMessage) {

    adminLoginMessage.textContent =
      '';
  }
}


/* =====================================================
   RENDER STAT CARDS
===================================================== */

function renderStats(
  overview
) {

  if (!adminStats) {
    return;
  }

  adminStats.innerHTML = `

    <div class="admin-stat">
      <span>Registered Users</span>
      <strong>
        ${overview.userCount}
      </strong>
    </div>

    <div class="admin-stat">
      <span>Total Incidents</span>
      <strong>
        ${overview.incidentCount}
      </strong>
    </div>

    <div class="admin-stat">
      <span>Active SOS</span>
      <strong>
        ${overview.activeAlertCount}
      </strong>
    </div>

    <div class="admin-stat">
      <span>Resolved SOS</span>
      <strong>
        ${overview.resolvedAlertCount}
      </strong>
    </div>

  `;
}


/* =====================================================
   OVERVIEW
===================================================== */

function renderOverview(
  overview
) {

  if (!adminOverview) {
    return;
  }


  const latest =
    overview.latestIncident;


  if (!latest) {

    adminOverview.innerHTML = `

      <div class="admin-list">

        <div class="admin-list-item">

          <strong>
            🛡️ System status
          </strong>

          <p>
            RakshaSutra admin monitoring
            is ready.
          </p>

        </div>

        <div class="admin-list-item">

          <strong>
            No incidents yet
          </strong>

          <p>
            SOS incidents will appear here
            when users activate SOS.
          </p>

        </div>

      </div>
    `;

    return;
  }


  const latestStatus =
    isResolved(latest)
      ? '🟢 Resolved'
      : isSOS(latest)
        ? '🔴 Active SOS'
        : '🟡 Recorded';


  adminOverview.innerHTML = `

    <div class="admin-list">

      <div class="admin-list-item">

        <strong>
          🛡️ System status
        </strong>

        <p>
          Guardian monitoring is active.
        </p>

      </div>


      <div class="admin-list-item">

        <strong>
          Latest event
        </strong>

        <p>
          ${escapeHTML(
            String(
              latest.type ||
              'Unknown'
            ).toUpperCase()
          )}
          •
          ${formatDate(
            latest.createdAt
          )}
        </p>

        <p>
          Status:
          <strong>
            ${latestStatus}
          </strong>
        </p>

      </div>


      <div class="admin-list-item">

        <strong>
          🚨 Active SOS
        </strong>

        <p>
          ${
            overview.activeAlertCount
          }
          active emergency incident(s).
        </p>

      </div>


      <div class="admin-list-item">

        <strong>
          🟢 Resolved SOS
        </strong>

        <p>
          ${
            overview.resolvedAlertCount
          }
          resolved emergency incident(s).
        </p>

      </div>

    </div>
  `;
}


/* =====================================================
   USERS
===================================================== */

function renderUsers(
  users
) {

  if (!adminUsers) {
    return;
  }


  if (!users.length) {

    adminUsers.innerHTML = `

      <div class="admin-list">

        <div class="admin-list-item">

          <strong>
            👥 No registered users
          </strong>

          <p>
            Registered accounts will
            appear here.
          </p>

        </div>

      </div>
    `;

    return;
  }


  adminUsers.innerHTML = `

    <div class="admin-list">

      ${users.map((user) => {

        const name =
          user.fullName ||
          user.name ||
          'User';


        const email =
          user.email ||
          'Email not available';


        const phone =
          user.phone ||
          'Phone not provided';


        const created =
          formatDate(
            user.createdAt
          );


        return `

          <div class="admin-list-item">

            <strong>
              👤 ${escapeHTML(name)}
            </strong>

            <p>
              📧 ${escapeHTML(email)}
            </p>

            <p>
              📱 ${escapeHTML(phone)}
            </p>

            <p>
              🕐 Registered:
              ${escapeHTML(created)}
            </p>

          </div>

        `;

      }).join('')}

    </div>
  `;
}


/* =====================================================
   INCIDENTS
===================================================== */

function renderIncidents(
  incidents
) {

  if (!adminIncidents) {
    return;
  }


  if (!incidents.length) {

    adminIncidents.innerHTML = `

      <div class="admin-list">

        <div class="admin-list-item">

          <strong>
            🚨 No incidents
          </strong>

          <p>
            No SOS or emergency incidents
            have been recorded yet.
          </p>

        </div>

      </div>
    `;

    return;
  }


  adminIncidents.innerHTML = `

    <div class="admin-list">

      ${incidents.map(
        (incident) => {

          const resolved =
            isResolved(
              incident
            );


          const sos =
            isSOS(
              incident
            );


          const status =
            resolved
              ? '🟢 RESOLVED'
              : sos
                ? '🔴 ACTIVE'
                : '🟡 RECORDED';


          const latitude =
            incident.latitude ??
            incident.location?.latitude;


          const longitude =
            incident.longitude ??
            incident.location?.longitude;


          let locationHTML =
            '📍 Location not available';


          if (
            latitude !== undefined &&
            latitude !== null &&
            longitude !== undefined &&
            longitude !== null
          ) {

            const mapsURL =
              `https://www.google.com/maps?q=${encodeURIComponent(
                `${latitude},${longitude}`
              )}`;


            locationHTML = `

              📍
              <a
                href="${mapsURL}"
                target="_blank"
                rel="noopener noreferrer"
              >
                View location
              </a>

              <br>

              <small>
                ${escapeHTML(latitude)},
                ${escapeHTML(longitude)}
              </small>
            `;
          }


          return `

            <div class="admin-list-item">

              <strong>
                ${status}
              </strong>

              <p>
                Type:
                ${escapeHTML(
                  String(
                    incident.type ||
                    'unknown'
                  ).toUpperCase()
                )}
              </p>

              <p>
                ${escapeHTML(
                  incident.message ||
                  'Emergency incident'
                )}
              </p>

              <p>
                🕐 Started:
                ${escapeHTML(
                  formatDate(
                    incident.createdAt
                  )
                )}
              </p>

              ${
                incident.resolvedAt
                  ? `
                    <p>
                      🟢 Resolved:
                      ${escapeHTML(
                        formatDate(
                          incident.resolvedAt
                        )
                      )}
                    </p>
                  `
                  : ''
              }

              <p>
                ${locationHTML}
              </p>

              ${
                incident.userEmail
                  ? `
                    <p>
                      👤 User:
                      ${escapeHTML(
                        incident.userEmail
                      )}
                    </p>
                  `
                  : ''
              }

            </div>

          `;

        }
      ).join('')}

    </div>
  `;
}


/* =====================================================
   MAIN RENDER
===================================================== */

function renderAdminPanel() {

  const overview =
    getAdminOverview();

  const users =
    readUsers();

  const incidents =
    readIncidents();


  renderStats(
    overview
  );

  renderOverview(
    overview
  );

  renderUsers(
    users
  );

  renderIncidents(
    incidents
  );


  /*
   * Tab buttons.
   */

  adminTabs.forEach(
    (button) => {

      const active =
        button.dataset.adminTab ===
        activeAdminTab;


      button.classList.toggle(
        'primary-btn',
        active
      );

      button.classList.toggle(
        'ghost-button',
        !active
      );

    }
  );


  /*
   * Hide all panels first.
   */

  [
    adminOverview,
    adminUsers,
    adminIncidents
  ].forEach(
    (panel) => {

      if (panel) {
        panel.hidden =
          true;
      }

    }
  );


  /*
   * Show selected panel.
   */

  if (
    activeAdminTab ===
    'users'
  ) {

    if (adminUsers) {
      adminUsers.hidden =
        false;
    }

  } else if (
    activeAdminTab ===
    'incidents'
  ) {

    if (adminIncidents) {
      adminIncidents.hidden =
        false;
    }

  } else {

    if (adminOverview) {
      adminOverview.hidden =
        false;
    }

  }
}


/* =====================================================
   RESTORE SESSION
===================================================== */

function restoreAdminSession() {

  if (
    localStorage.getItem(
      ADMIN_SESSION_KEY
    ) === 'true'
  ) {

    showAdminDashboard();
  }
}


/* =====================================================
   LOGIN
===================================================== */

if (adminLoginForm) {

  adminLoginForm.addEventListener(
    'submit',
    (event) => {

      event.preventDefault();


      const username =
        adminUsernameInput?.value
        .trim() || '';


      const password =
        adminPasswordInput?.value
        || '';


      if (
        authenticateAdmin(
          username,
          password
        )
      ) {

        showAdminDashboard();

        showToast(
          'Admin access granted.'
        );

      } else {

        if (adminLoginMessage) {

          adminLoginMessage.textContent =
            'Invalid admin credentials.';
        }

        showToast(
          'Invalid admin credentials.'
        );
      }

    }
  );
}


/* =====================================================
   LOGOUT
===================================================== */

if (adminLogoutBtn) {

  adminLogoutBtn.addEventListener(
    'click',
    () => {

      localStorage.removeItem(
        ADMIN_SESSION_KEY
      );


      if (adminUsernameInput) {
        adminUsernameInput.value =
          '';
      }


      if (adminPasswordInput) {
        adminPasswordInput.value =
          '';
      }


      hideAdminDashboard();

      showToast(
        'Admin logged out.'
      );

    }
  );
}


/* =====================================================
   EXPORT
===================================================== */

if (exportIncidentsBtn) {

  exportIncidentsBtn.addEventListener(
    'click',
    () => {

      const exported =
        exportIncidents();


      const blob =
        new Blob(
          [exported],
          {
            type:
              'application/json'
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          'a'
        );


      link.href =
        url;

      link.download =
        'rakshasutra-incidents.json';


      document.body.appendChild(
        link
      );

      link.click();

      link.remove();


      URL.revokeObjectURL(
        url
      );


      showToast(
        'Incident data exported.'
      );

    }
  );
}


/* =====================================================
   IMPORT
===================================================== */

if (importIncidentsInput) {

  importIncidentsInput.addEventListener(
    'change',
    (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      const reader =
        new FileReader();


      reader.onload =
        () => {

          try {

            const parsed =
              JSON.parse(
                reader.result
              );


            const entries =
              Array.isArray(parsed)
                ? parsed
                : [];


            const count =
              importIncidents(
                entries
              );


            renderAdminPanel();


            showToast(
              `${count} incidents imported.`
            );

          } catch {

            showToast(
              'Import failed. Please use valid JSON.'
            );

          }

        };


      reader.readAsText(
        file
      );

    }
  );
}


/* =====================================================
   TABS
===================================================== */

adminTabs.forEach(
  (button) => {

    button.addEventListener(
      'click',
      () => {

        activeAdminTab =
          button.dataset.adminTab ||
          'overview';

        renderAdminPanel();

      }
    );

  }
);


/* =====================================================
   INITIALIZE
===================================================== */

renderAdminPanel();

restoreAdminSession();
