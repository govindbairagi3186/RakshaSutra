```javascript
/* =========================================================
   RAKSHASUTRA PROFILE + SETTINGS
   REPLACE THE PREVIOUS PROFILE/SETTINGS CODE WITH THIS
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     ELEMENTS
     ======================================================= */

  const $ = (id) => document.getElementById(id);

  const profileButton = $("profileButton");
  const profileDropdown = $("profileDropdown");

  const profileAvatarText = $("profileAvatarText");
  const profileDropdownAvatar = $("profileDropdownAvatar");
  const profileDropdownName = $("profileDropdownName");
  const profileDropdownEmail = $("profileDropdownEmail");

  const profileInfoBtn = $("profileInfoBtn");
  const editProfileBtn = $("editProfileBtn");
  const changePasswordMenuBtn = $("changePasswordMenuBtn");
  const themeMenuBtn = $("themeMenuBtn");
  const rateAppBtn = $("rateAppBtn");

  const settingsModal = $("settingsModal");
  const closeSettingsBtn = $("closeSettingsBtn");

  const settingsProfileName = $("settingsProfileName");
  const settingsProfileEmail = $("settingsProfileEmail");
  const settingsProfilePhone = $("settingsProfilePhone");
  const settingsGuardianName = $("settingsGuardianName");
  const settingsTrustedName = $("settingsTrustedName");
  const settingsSafeAddress = $("settingsSafeAddress");

  const editProfileForm = $("editProfileForm");
  const editProfileMessage = $("editProfileMessage");

  const editName = $("editName");
  const editEmail = $("editEmail");
  const editPhone = $("editPhone");
  const editGuardianName = $("editGuardianName");
  const editGuardianPhone = $("editGuardianPhone");
  const editTrustedName = $("editTrustedName");
  const editTrustedPhone = $("editTrustedPhone");
  const editSafeAddress = $("editSafeAddress");

  const openPasswordSectionBtn = $("openPasswordSectionBtn");

  const themeOptions =
    document.querySelectorAll(".theme-option");

  const ratingStars =
    document.querySelectorAll(".rating-star");

  const ratingMessage = $("ratingMessage");

  const SETTINGS_THEME_KEY = "rakshasutra-theme";
  const SETTINGS_RATING_KEY = "rakshasutra-rating";


  /* =======================================================
     CURRENT USER
     USE EXISTING GLOBAL IF AVAILABLE
     ======================================================= */

  function getCurrentUserSafe() {
    try {
      if (
        typeof currentUser !== "undefined" &&
        currentUser
      ) {
        return currentUser;
      }
    } catch (error) {}

    try {
      const possibleKeys = [
        "rakshasutra-current-user",
        "rakshasutra-currentUser",
        "currentUser",
        "loggedInUser",
        "user"
      ];

      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);

        if (!value) continue;

        try {
          const parsed = JSON.parse(value);

          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        } catch (error) {}
      }
    } catch (error) {}

    return null;
  }


  /* =======================================================
     TOAST
     ======================================================= */

  function safeToast(message) {
    try {
      if (
        typeof showToast === "function"
      ) {
        showToast(message);
        return;
      }
    } catch (error) {}

    let toast = document.getElementById(
      "rakshasutraSettingsToast"
    );

    if (!toast) {
      toast = document.createElement("div");

      toast.id =
        "rakshasutraSettingsToast";

      toast.style.position = "fixed";
      toast.style.bottom = "25px";
      toast.style.left = "50%";
      toast.style.transform =
        "translateX(-50%)";
      toast.style.zIndex = "99999";
      toast.style.padding = "12px 18px";
      toast.style.borderRadius = "12px";
      toast.style.background = "#111827";
      toast.style.color = "#fff";
      toast.style.fontSize = "14px";
      toast.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.35)";

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(
      window.rakshaToastTimer
    );

    window.rakshaToastTimer =
      setTimeout(() => {
        toast.style.display = "none";
      }, 2500);
  }


  /* =======================================================
     PROFILE MENU
     ======================================================= */

  function openProfileMenu() {
    if (!profileDropdown) return;

    profileDropdown.classList.add("open");

    if (profileButton) {
      profileButton.setAttribute(
        "aria-expanded",
        "true"
      );
    }
  }


  function closeProfileMenu() {
    if (!profileDropdown) return;

    profileDropdown.classList.remove("open");

    if (profileButton) {
      profileButton.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  }


  function toggleProfileMenu() {
    if (!profileDropdown) return;

    if (
      profileDropdown.classList.contains("open")
    ) {
      closeProfileMenu();
    } else {
      openProfileMenu();
    }
  }


  /* =======================================================
     PROFILE PHOTO
     ======================================================= */

  function getProfilePhoto(user) {
    if (!user) return "";

    return (
      user.profilePhoto ||
      user.profilePicture ||
      user.avatar ||
      user.photoURL ||
      user.photo ||
      ""
    );
  }


  function renderAvatar(element, photo) {
    if (!element) return;

    element.innerHTML = "";

    if (photo) {
      const img =
        document.createElement("img");

      img.src = photo;
      img.alt = "Profile photo";

      img.onerror = function () {
        element.textContent = "👤";
      };

      element.appendChild(img);
    } else {
      element.textContent = "👤";
    }
  }


  /* =======================================================
     RENDER PROFILE
     ======================================================= */

  function renderProfile() {
    const user =
      getCurrentUserSafe();

    if (!user) {
      if (profileDropdownName) {
        profileDropdownName.textContent =
          "User";
      }

      if (profileDropdownEmail) {
        profileDropdownEmail.textContent =
          "";
      }

      renderAvatar(
        profileAvatarText,
        ""
      );

      renderAvatar(
        profileDropdownAvatar,
        ""
      );

      return;
    }

    const name =
      user.fullName ||
      user.name ||
      user.username ||
      "User";

    const email =
      user.email ||
      "No email available";

    if (profileDropdownName) {
      profileDropdownName.textContent =
        name;
    }

    if (profileDropdownEmail) {
      profileDropdownEmail.textContent =
        email;
    }

    if (settingsProfileName) {
      settingsProfileName.textContent =
        name;
    }

    if (settingsProfileEmail) {
      settingsProfileEmail.textContent =
        email;
    }

    if (settingsProfilePhone) {
      settingsProfilePhone.textContent =
        user.phone ||
        user.mobile ||
        "—";
    }

    if (settingsGuardianName) {
      settingsGuardianName.textContent =
        user.guardianName ||
        user.guardian?.name ||
        "—";
    }

    if (settingsTrustedName) {
      settingsTrustedName.textContent =
        user.trustedName ||
        user.trustedPerson?.name ||
        "—";
    }

    if (settingsSafeAddress) {
      settingsSafeAddress.textContent =
        user.trustedAddress ||
        user.safeAddress ||
        "—";
    }

    const photo =
      getProfilePhoto(user);

    renderAvatar(
      profileAvatarText,
      photo
    );

    renderAvatar(
      profileDropdownAvatar,
      photo
    );
  }


  /* =======================================================
     SETTINGS MODAL
     ======================================================= */

  function openSettings(section) {
    if (!settingsModal) return;

    closeProfileMenu();

    settingsModal.classList.add("open");

    settingsModal.setAttribute(
      "aria-hidden",
      "false"
    );

    renderProfile();
    fillEditForm();
    loadRating();
    applySavedTheme();

    setTimeout(() => {
      let targetId =
        "profileInfoSection";

      if (section === "edit") {
        targetId =
          "editProfileSection";
      }

      if (section === "password") {
        targetId =
          "settingsPasswordSection";
      }

      if (section === "theme") {
        targetId =
          "themeSection";
      }

      if (section === "rating") {
        targetId =
          "ratingSection";
      }

      const target =
        document.getElementById(
          targetId
        );

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 100);
  }


  function closeSettings() {
    if (!settingsModal) return;

    settingsModal.classList.remove(
      "open"
    );

    settingsModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  /* =======================================================
     EDIT PROFILE
     ======================================================= */

  function fillEditForm() {
    const user =
      getCurrentUserSafe();

    if (!user) return;

    if (editName) {
      editName.value =
        user.fullName ||
        user.name ||
        "";
    }

    if (editEmail) {
      editEmail.value =
        user.email ||
        "";
    }

    if (editPhone) {
      editPhone.value =
        user.phone ||
        user.mobile ||
        "";
    }

    if (editGuardianName) {
      editGuardianName.value =
        user.guardianName ||
        user.guardian?.name ||
        "";
    }

    if (editGuardianPhone) {
      editGuardianPhone.value =
        user.guardianPhone ||
        user.guardian?.phone ||
        "";
    }

    if (editTrustedName) {
      editTrustedName.value =
        user.trustedName ||
        user.trustedPerson?.name ||
        "";
    }

    if (editTrustedPhone) {
      editTrustedPhone.value =
        user.trustedPhone ||
        user.trustedPerson?.phone ||
        "";
    }

    if (editSafeAddress) {
      editSafeAddress.value =
        user.trustedAddress ||
        user.safeAddress ||
        "";
    }
  }


  function setEditMessage(
    message,
    success
  ) {
    if (!editProfileMessage) return;

    editProfileMessage.textContent =
      message;

    editProfileMessage.style.color =
      success
        ? "#22c55e"
        : "#ef4444";
  }


  function getUsers() {
    const keys = [
      "rakshasutra-users",
      "users",
      "rakshaSutraUsers"
    ];

    for (const key of keys) {
      try {
        const data =
          localStorage.getItem(key);

        if (!data) continue;

        const users =
          JSON.parse(data);

        if (Array.isArray(users)) {
          return {
            key,
            users
          };
        }
      } catch (error) {}
    }

    return {
      key: "rakshasutra-users",
      users: []
    };
  }


  function saveCurrentUser(
    updatedUser
  ) {
    try {
      if (
        typeof saveSession ===
        "function"
      ) {
        saveSession(
          updatedUser
        );
      }
    } catch (error) {
      console.warn(error);
    }

    try {
      localStorage.setItem(
        "rakshasutra-current-user",
        JSON.stringify(
          updatedUser
        )
      );
    } catch (error) {}

    try {
      localStorage.setItem(
        "currentUser",
        JSON.stringify(
          updatedUser
        )
      );
    } catch (error) {}
  }


  function saveEditedProfile(event) {
    event.preventDefault();

    const user =
      getCurrentUserSafe();

    if (!user) {
      setEditMessage(
        "Please log in again.",
        false
      );
      return;
    }

    const name =
      editName?.value.trim() ||
      "";

    const email =
      editEmail?.value.trim() ||
      "";

    const phone =
      editPhone?.value.trim() ||
      "";

    const guardianName =
      editGuardianName?.value.trim() ||
      "";

    const guardianPhone =
      editGuardianPhone?.value.trim() ||
      "";

    const trustedName =
      editTrustedName?.value.trim() ||
      "";

    const trustedPhone =
      editTrustedPhone?.value.trim() ||
      "";

    const safeAddress =
      editSafeAddress?.value.trim() ||
      "";

    if (!name) {
      setEditMessage(
        "Please enter your name.",
        false
      );
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setEditMessage(
        "Please enter a valid email.",
        false
      );
      return;
    }

    const updatedUser = {
      ...user,

      fullName: name,
      name: name,

      email,
      phone,

      guardianName,
      guardianPhone,

      trustedName,
      trustedPhone,

      trustedAddress: safeAddress,
      safeAddress
    };

    const result =
      getUsers();

    const users =
      result.users;

    let index =
      users.findIndex(
        (item) => {

          if (
            user.id &&
            item.id
          ) {
            return (
              item.id ===
              user.id
            );
          }

          return (
            item.email &&
            user.email &&
            item.email.toLowerCase() ===
              user.email.toLowerCase()
          );
        }
      );

    if (index === -1) {
      users.push(
        updatedUser
      );

      index =
        users.length - 1;
    }

    users[index] =
      updatedUser;

    try {
      localStorage.setItem(
        result.key,
        JSON.stringify(users)
      );

      saveCurrentUser(
        updatedUser
      );

      try {
        if (
          typeof renderUser ===
          "function"
        ) {
          renderUser();
        }
      } catch (error) {}

      renderProfile();

      setEditMessage(
        "Profile updated successfully.",
        true
      );

      safeToast(
        "Profile updated successfully."
      );

    } catch (error) {
      console.error(error);

      setEditMessage(
        "Unable to save profile.",
        false
      );
    }
  }


  /* =======================================================
     THEME
     ======================================================= */

  function applyTheme(theme) {
    if (
      theme !== "dark" &&
      theme !== "light" &&
      theme !== "system"
    ) {
      theme = "dark";
    }

    if (theme === "system") {
      const dark =
        window.matchMedia &&
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      document.documentElement.setAttribute(
        "data-theme",
        dark ? "dark" : "light"
      );

      document.body.setAttribute(
        "data-theme",
        dark ? "dark" : "light"
      );
    } else {
      document.documentElement.setAttribute(
        "data-theme",
        theme
      );

      document.body.setAttribute(
        "data-theme",
        theme
      );
    }

    try {
      localStorage.setItem(
        SETTINGS_THEME_KEY,
        theme
      );
    } catch (error) {}

    themeOptions.forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.theme ===
            theme
        );
      }
    );
  }


  function applySavedTheme() {
    let theme = "dark";

    try {
      theme =
        localStorage.getItem(
          SETTINGS_THEME_KEY
        ) || "dark";
    } catch (error) {}

    applyTheme(theme);
  }


  /* =======================================================
     RATING
     ======================================================= */

  function updateRatingStars(
    rating
  ) {
    ratingStars.forEach(
      (star) => {
        const value =
          Number(
            star.dataset.rating
          );

        star.classList.toggle(
          "active",
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
    } catch (error) {}

    updateRatingStars(
      rating
    );

    if (ratingMessage) {
      ratingMessage.textContent =
        `Thank you! You rated RakshaSutra ${rating}/5 ⭐`;

      ratingMessage.style.color =
        "#22c55e";
    }

    safeToast(
      `Thank you for rating RakshaSutra ${rating}/5 ⭐`
    );
  }


  function loadRating() {
    let rating = 0;

    try {
      rating =
        Number(
          localStorage.getItem(
            SETTINGS_RATING_KEY
          ) || 0
        );
    } catch (error) {}

    updateRatingStars(
      rating
    );
  }


  /* =======================================================
     EVENT LISTENERS
     ======================================================= */

  if (profileButton) {
    profileButton.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();

        toggleProfileMenu();
      }
    );
  }


  if (profileInfoBtn) {
    profileInfoBtn.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        openSettings(
          "profile"
        );
      }
    );
  }


  if (editProfileBtn) {
    editProfileBtn.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        openSettings(
          "edit"
        );
      }
    );
  }


  if (changePasswordMenuBtn) {
    changePasswordMenuBtn.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        openSettings(
          "password"
        );
      }
    );
  }


  if (themeMenuBtn) {
    themeMenuBtn.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        openSettings(
          "theme"
        );
      }
    );
  }


  if (rateAppBtn) {
    rateAppBtn.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        openSettings(
          "rating"
        );
      }
    );
  }


  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener(
      "click",
      closeSettings
    );
  }


  if (settingsModal) {
    settingsModal.addEventListener(
      "click",
      function (event) {
        if (
          event.target ===
          settingsModal
        ) {
          closeSettings();
        }
      }
    );
  }


  if (editProfileForm) {
    editProfileForm.addEventListener(
      "submit",
      saveEditedProfile
    );
  }


  if (openPasswordSectionBtn) {
    openPasswordSectionBtn.addEventListener(
      "click",
      function () {
        openSettings(
          "password"
        );
      }
    );
  }


  themeOptions.forEach(
    (button) => {
      button.addEventListener(
        "click",
        function () {
          applyTheme(
            button.dataset.theme
          );

          safeToast(
            "Theme changed successfully."
          );
        }
      );
    }
  );


  ratingStars.forEach(
    (star) => {
      star.addEventListener(
        "click",
        function () {
          saveRating(
            Number(
              star.dataset.rating
            )
          );
        }
      );
    }
  );


  document.addEventListener(
    "click",
    function (event) {

      if (
        !profileDropdown ||
        !profileButton
      ) {
        return;
      }

      if (
        !profileDropdown.contains(
          event.target
        ) &&
        !profileButton.contains(
          event.target
        )
      ) {
        closeProfileMenu();
      }
    }
  );


  document.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Escape"
      ) {
        closeProfileMenu();
        closeSettings();
      }
    }
  );


  /* =======================================================
     INITIALIZE
     ======================================================= */

  renderProfile();
  applySavedTheme();
  loadRating();

  console.log(
    "✅ RakshaSutra Profile & Settings loaded successfully."
  );

})();
```
