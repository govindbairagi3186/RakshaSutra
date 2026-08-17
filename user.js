/* =====================================================
   RAKSHASUTRA PROFILE & SETTINGS
   ADD THIS CODE AT THE END OF user.js
===================================================== */

const profileEls = {
  profileButton: document.getElementById('profileButton'),
  profileDropdown: document.getElementById('profileDropdown'),

  profileAvatarText: document.getElementById('profileAvatarText'),
  profileDropdownAvatar: document.getElementById('profileDropdownAvatar'),
  profileDropdownName: document.getElementById('profileDropdownName'),
  profileDropdownEmail: document.getElementById('profileDropdownEmail'),

  profileInfoBtn: document.getElementById('profileInfoBtn'),
  editProfileBtn: document.getElementById('editProfileBtn'),
  changePasswordMenuBtn: document.getElementById('changePasswordMenuBtn'),
  themeMenuBtn: document.getElementById('themeMenuBtn'),
  rateAppBtn: document.getElementById('rateAppBtn'),

  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),

  settingsProfileName: document.getElementById('settingsProfileName'),
  settingsProfileEmail: document.getElementById('settingsProfileEmail'),
  settingsProfilePhone: document.getElementById('settingsProfilePhone'),
  settingsGuardianName: document.getElementById('settingsGuardianName'),
  settingsTrustedName: document.getElementById('settingsTrustedName'),
  settingsSafeAddress: document.getElementById('settingsSafeAddress'),

  editProfileSection: document.getElementById('editProfileSection'),
  editProfileForm: document.getElementById('editProfileForm'),
  editProfileMessage: document.getElementById('editProfileMessage'),

  editName: document.getElementById('editName'),
  editEmail: document.getElementById('editEmail'),
  editPhone: document.getElementById('editPhone'),
  editGuardianName: document.getElementById('editGuardianName'),
  editGuardianPhone: document.getElementById('editGuardianPhone'),
  editTrustedName: document.getElementById('editTrustedName'),
  editTrustedPhone: document.getElementById('editTrustedPhone'),
  editSafeAddress: document.getElementById('editSafeAddress'),

  themeSection: document.getElementById('themeSection'),
  themeOptions: document.querySelectorAll('.theme-option'),

  ratingStars: document.querySelectorAll('.rating-star'),
  ratingMessage: document.getElementById('ratingMessage'),

  openPasswordSectionBtn:
    document.getElementById('openPasswordSectionBtn'),

  settingsPasswordSection:
    document.getElementById('settingsPasswordSection'),

  securitySection:
    document.getElementById('securitySection')
};


/* =====================================================
   SETTINGS STORAGE
===================================================== */

const SETTINGS_THEME_KEY =
  'rakshasutra-theme';

const SETTINGS_RATING_KEY =
  'rakshasutra-rating';


/* =====================================================
   PROFILE MENU
===================================================== */

function toggleProfileMenu() {
  if (!profileEls.profileDropdown) return;

  const isOpen =
    profileEls.profileDropdown.classList.toggle('open');

  if (profileEls.profileButton) {
    profileEls.profileButton.setAttribute(
      'aria-expanded',
      String(isOpen)
    );
  }
}


function closeProfileMenu() {
  if (!profileEls.profileDropdown) return;

  profileEls.profileDropdown.classList.remove('open');

  if (profileEls.profileButton) {
    profileEls.profileButton.setAttribute(
      'aria-expanded',
      'false'
    );
  }
}


/* =====================================================
   SETTINGS MODAL
===================================================== */

function openSettings(section = 'profile') {
  if (!requireLogin()) return;

  closeProfileMenu();

  if (!profileEls.settingsModal) return;

  profileEls.settingsModal.classList.add('open');

  profileEls.settingsModal.setAttribute(
    'aria-hidden',
    'false'
  );

  renderSettingsProfile();
  fillEditProfileForm();
  loadSavedRating();
  applySavedTheme();

  setTimeout(() => {
    const target =
      document.getElementById(
        section === 'edit'
          ? 'editProfileSection'
          : section === 'password'
            ? 'settingsPasswordSection'
            : section === 'theme'
              ? 'themeSection'
              : section === 'rating'
                ? 'ratingSection'
                : 'profileInfoSection'
      );

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, 50);
}


function closeSettings() {
  if (!profileEls.settingsModal) return;

  profileEls.settingsModal.classList.remove('open');

  profileEls.settingsModal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/* =====================================================
   PROFILE AVATAR
===================================================== */

function getProfilePhoto(user) {
  if (!user) return '';

  return (
    user.profilePhoto ||
    user.avatar ||
    user.photoURL ||
    user.photo ||
    ''
  );
}


function renderProfileAvatar() {
  if (!currentUser) return;

  const photo =
    getProfilePhoto(currentUser);

  if (
    profileEls.profileAvatarText
  ) {
    if (photo) {
      profileEls.profileAvatarText.innerHTML =
        '';

      const img =
        document.createElement('img');

      img.src = photo;
      img.alt = 'Profile photo';

      profileEls.profileAvatarText.appendChild(
        img
      );
    } else {
      profileEls.profileAvatarText.textContent =
        '👤';
    }
  }

  if (
    profileEls.profileDropdownAvatar
  ) {
    if (photo) {
      profileEls.profileDropdownAvatar.innerHTML =
        '';

      const img =
        document.createElement('img');

      img.src = photo;
      img.alt = 'Profile photo';

      profileEls.profileDropdownAvatar.appendChild(
        img
      );
    } else {
      profileEls.profileDropdownAvatar.textContent =
        '👤';
    }
  }
}


/* =====================================================
   PROFILE INFORMATION
===================================================== */

function renderSettingsProfile() {
  if (!currentUser) return;

  if (
    profileEls.profileDropdownName
  ) {
    profileEls.profileDropdownName.textContent =
      currentUser.fullName ||
      currentUser.name ||
      'User';
  }

  if (
    profileEls.profileDropdownEmail
  ) {
    profileEls.profileDropdownEmail.textContent =
      currentUser.email ||
      'No email available';
  }

  if (
    profileEls.settingsProfileName
  ) {
    profileEls.settingsProfileName.textContent =
      currentUser.fullName ||
      currentUser.name ||
      '—';
  }

  if (
    profileEls.settingsProfileEmail
  ) {
    profileEls.settingsProfileEmail.textContent =
      currentUser.email ||
      '—';
  }

  if (
    profileEls.settingsProfilePhone
  ) {
    profileEls.settingsProfilePhone.textContent =
      currentUser.phone ||
      '—';
  }

  if (
    profileEls.settingsGuardianName
  ) {
    profileEls.settingsGuardianName.textContent =
      currentUser.guardianName ||
      '—';
  }

  if (
    profileEls.settingsTrustedName
  ) {
    profileEls.settingsTrustedName.textContent =
      currentUser.trustedName ||
      '—';
  }

  if (
    profileEls.settingsSafeAddress
  ) {
    profileEls.settingsSafeAddress.textContent =
      currentUser.trustedAddress ||
      '—';
  }

  renderProfileAvatar();
}


/* =====================================================
   EDIT PROFILE FORM
===================================================== */

function fillEditProfileForm() {
  if (!currentUser) return;

  if (profileEls.editName) {
    profileEls.editName.value =
      currentUser.fullName ||
      currentUser.name ||
      '';
  }

  if (profileEls.editEmail) {
    profileEls.editEmail.value =
      currentUser.email ||
      '';
  }

  if (profileEls.editPhone) {
    profileEls.editPhone.value =
      currentUser.phone ||
      '';
  }

  if (profileEls.editGuardianName) {
    profileEls.editGuardianName.value =
      currentUser.guardianName ||
      '';
  }

  if (profileEls.editGuardianPhone) {
    profileEls.editGuardianPhone.value =
      currentUser.guardianPhone ||
      '';
  }

  if (profileEls.editTrustedName) {
    profileEls.editTrustedName.value =
      currentUser.trustedName ||
      '';
  }

  if (profileEls.editTrustedPhone) {
    profileEls.editTrustedPhone.value =
      currentUser.trustedPhone ||
      '';
  }

  if (profileEls.editSafeAddress) {
    profileEls.editSafeAddress.value =
      currentUser.trustedAddress ||
      '';
  }
}


function setEditProfileMessage(
  message,
  success = false
) {
  if (!profileEls.editProfileMessage) {
    return;
  }

  profileEls.editProfileMessage.textContent =
    message;

  profileEls.editProfileMessage.style.color =
    success
      ? '#22c55e'
      : '#ef4444';
}


function saveEditedProfile(event) {
  event.preventDefault();

  if (!requireLogin()) return;

  const fullName =
    profileEls.editName?.value.trim() || '';

  const email =
    profileEls.editEmail?.value.trim() || '';

  const phone =
    profileEls.editPhone?.value.trim() || '';

  const guardianName =
    profileEls.editGuardianName?.value.trim() || '';

  const guardianPhone =
    profileEls.editGuardianPhone?.value.trim() || '';

  const trustedName =
    profileEls.editTrustedName?.value.trim() || '';

  const trustedPhone =
    profileEls.editTrustedPhone?.value.trim() || '';

  const trustedAddress =
    profileEls.editSafeAddress?.value.trim() || '';

  if (!fullName) {
    setEditProfileMessage(
      'Please enter your full name.'
    );

    return;
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setEditProfileMessage(
      'Please enter a valid email address.'
    );

    return;
  }

  const users =
    readUsers();

  if (!Array.isArray(users)) {
    setEditProfileMessage(
      'Unable to access account data.'
    );

    return;
  }

  const index =
    users.findIndex(
      (user) =>
        user.id === currentUser.id
    );

  if (index === -1) {
    setEditProfileMessage(
      'Your account could not be found.'
    );

    return;
  }

  const updatedUser = {
    ...users[index],

    fullName,
    email,
    phone,

    guardianName,
    guardianPhone,

    trustedName,
    trustedPhone,

    trustedAddress
  };

  users[index] =
    updatedUser;

  try {
    localStorage.setItem(
      'rakshasutra-users',
      JSON.stringify(users)
    );

    currentUser =
      updatedUser;

    saveSession(
      currentUser
    );

    renderUser();
    renderSettingsProfile();

    setEditProfileMessage(
      'Profile updated successfully.',
      true
    );

    showToast(
      'Profile updated successfully.'
    );

    addActivity(
      '👤 Profile information was updated.'
    );

  } catch (error) {
    console.error(
      'Profile update error:',
      error
    );

    setEditProfileMessage(
      'Could not save profile changes.'
    );
  }
}


/* =====================================================
   THEME
===================================================== */

function applyTheme(theme) {
  if (
    theme !== 'dark' &&
    theme !== 'light' &&
    theme !== 'system'
  ) {
    theme = 'dark';
  }

  document.documentElement.setAttribute(
    'data-theme',
    theme
  );

  document.body.setAttribute(
    'data-theme',
    theme
  );

  try {
    localStorage.setItem(
      SETTINGS_THEME_KEY,
      theme
    );
  } catch (error) {
    console.warn(
      'Could not save theme:',
      error
    );
  }

  updateThemeButtons(
    theme
  );
}


function getSavedTheme() {
  try {
    return (
      localStorage.getItem(
        SETTINGS_THEME_KEY
      ) ||
      'dark'
    );
  } catch {
    return 'dark';
  }
}


function applySavedTheme() {
  applyTheme(
    getSavedTheme()
  );
}


function updateThemeButtons(theme) {
  if (!profileEls.themeOptions) {
    return;
  }

  profileEls.themeOptions.forEach(
    (button) => {
      const buttonTheme =
        button.dataset.theme;

      button.classList.toggle(
        'active',
        buttonTheme === theme
      );
    }
  );
}


function setupThemeButtons() {
  if (!profileEls.themeOptions) {
    return;
  }

  profileEls.themeOptions.forEach(
    (button) => {
      button.addEventListener(
        'click',
        () => {
          const theme =
            button.dataset.theme;

          applyTheme(theme);

          showToast(
            `Theme changed to ${
              theme.charAt(0).toUpperCase() +
              theme.slice(1)
            }.`
          );
        }
      );
    }
  );
}


/* =====================================================
   RATING
===================================================== */

function updateRatingStars(rating) {
  if (!profileEls.ratingStars) {
    return;
  }

  profileEls.ratingStars.forEach(
    (star) => {
      const value =
        Number(
          star.dataset.rating
        );

      star.classList.toggle(
        'active',
        value <= rating
      );
    }
  );
}


function saveRating(rating) {
  try {
    localStorage.setItem(
      SETTINGS_RATING_KEY,
      String(rating)
    );
  } catch (error) {
    console.warn(
      'Could not save rating:',
      error
    );
  }

  updateRatingStars(
    rating
  );

  if (profileEls.ratingMessage) {
    profileEls.ratingMessage.textContent =
      `Thank you! You rated RakshaSutra ${rating}/5.`;

    profileEls.ratingMessage.style.color =
      '#22c55e';
  }

  showToast(
    `Thanks for rating RakshaSutra ${rating}/5 ⭐`
  );
}


function loadSavedRating() {
  let rating = 0;

  try {
    rating =
      Number(
        localStorage.getItem(
          SETTINGS_RATING_KEY
        ) || 0
      );
  } catch {
    rating = 0;
  }

  updateRatingStars(
    rating
  );
}


function setupRating() {
  if (!profileEls.ratingStars) {
    return;
  }

  profileEls.ratingStars.forEach(
    (star) => {
      star.addEventListener(
        'click',
        () => {
          const rating =
            Number(
              star.dataset.rating
            );

          saveRating(
            rating
          );
        }
      );
    }
  );
}


/* =====================================================
   PASSWORD MENU
===================================================== */

function openPasswordFromSettings() {
  openSettings(
    'password'
  );

  setTimeout(
    () => {
      if (
        profileEls.securitySection
      ) {
        profileEls.securitySection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }

      if (
        els.currentPassword
      ) {
        els.currentPassword.focus();
      }
    },
    100
  );
}


/* =====================================================
   SETTINGS EVENTS
===================================================== */

function setupProfileSettings() {

  on(
    profileEls.profileButton,
    'click',
    (event) => {
      event.stopPropagation();

      toggleProfileMenu();
    }
  );


  on(
    profileEls.profileInfoBtn,
    'click',
    () => {
      openSettings(
        'profile'
      );
    }
  );


  on(
    profileEls.editProfileBtn,
    'click',
    () => {
      openSettings(
        'edit'
      );
    }
  );


  on(
    profileEls.changePasswordMenuBtn,
    'click',
    () => {
      openPasswordFromSettings();
    }
  );


  on(
    profileEls.themeMenuBtn,
    'click',
    () => {
      openSettings(
        'theme'
      );
    }
  );


  on(
    profileEls.rateAppBtn,
    'click',
    () => {
      openSettings(
        'rating'
      );
    }
  );


  on(
    profileEls.closeSettingsBtn,
    'click',
    closeSettings
  );


  on(
    profileEls.settingsModal,
    'click',
    (event) => {
      if (
        event.target ===
        profileEls.settingsModal
      ) {
        closeSettings();
      }
    }
  );


  on(
    profileEls.editProfileForm,
    'submit',
    saveEditedProfile
  );


  on(
    profileEls.openPasswordSectionBtn,
    'click',
    openPasswordFromSettings
  );


  document.addEventListener(
    'click',
    (event) => {

      if (
        !profileEls.profileDropdown ||
        !profileEls.profileButton
      ) {
        return;
      }

      const clickedInside =
        profileEls.profileDropdown.contains(
          event.target
        ) ||
        profileEls.profileButton.contains(
          event.target
        );

      if (!clickedInside) {
        closeProfileMenu();
      }
    }
  );


  document.addEventListener(
    'keydown',
    (event) => {

      if (
        event.key === 'Escape'
      ) {
        closeProfileMenu();
        closeSettings();
      }

    }
  );

}


/* =====================================================
   START PROFILE SETTINGS
===================================================== */

setupProfileSettings();
setupThemeButtons();
setupRating();
applySavedTheme();

if (currentUser) {
  renderSettingsProfile();
  fillEditProfileForm();
}
