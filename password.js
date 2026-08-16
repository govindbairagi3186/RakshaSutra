import {
  changePassword,
  resetPassword
} from "./auth.js";


/* =====================================================
   SESSION
===================================================== */

const SESSION_KEY =
  "rakshasutra-current-user";


/* =====================================================
   ELEMENTS
===================================================== */

const changeForm =
  document.getElementById(
    "changePasswordForm"
  );

const resetForm =
  document.getElementById(
    "resetPasswordForm"
  );

const changeMessage =
  document.getElementById(
    "changeMessage"
  );

const resetMessage =
  document.getElementById(
    "resetMessage"
  );


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
  element,
  message,
  type = "error"
) {

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.style.color =
    type === "success"
      ? "#4ade80"
      : "#ff6b6b";
}


/* =====================================================
   LOAD SESSION
===================================================== */

function getCurrentUser() {

  try {

    const raw =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);

  } catch {

    return null;
  }
}


/* =====================================================
   UPDATE SESSION
===================================================== */

function updateSession(user) {

  if (!user) {
    return;
  }

  const sessionUser = {

    id: user.id,

    email:
      user.email || "",

    fullName:
      user.fullName || "",

    phone:
      user.phone || "",

    guardianName:
      user.guardianName || "",

    guardianPhone:
      user.guardianPhone || "",

    trustedName:
      user.trustedName || "",

    trustedPhone:
      user.trustedPhone || "",

    trustedAddress:
      user.trustedAddress || ""

  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(sessionUser)
  );
}


/* =====================================================
   PASSWORD VALIDATION
===================================================== */

function validateNewPassword(
  password,
  confirmation
) {

  if (!password) {

    return "Please enter a new password.";
  }

  if (password.length < 6) {

    return "Password must contain at least 6 characters.";
  }

  if (password !== confirmation) {

    return "The new passwords do not match.";
  }

  return null;
}


/* =====================================================
   CHANGE PASSWORD
===================================================== */

if (changeForm) {

  changeForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const currentPassword =
        document.getElementById(
          "currentPassword"
        ).value;


      const newPassword =
        document.getElementById(
          "newPassword"
        ).value;


      const confirmPassword =
        document.getElementById(
          "confirmNewPassword"
        ).value;


      const currentUser =
        getCurrentUser();


      if (!currentUser) {

        showMessage(
          changeMessage,
          "Please log in first to change your password."
        );

        return;
      }


      const validationError =
        validateNewPassword(
          newPassword,
          confirmPassword
        );


      if (validationError) {

        showMessage(
          changeMessage,
          validationError
        );

        return;
      }


      const result =
        changePassword(
          currentUser.id,
          currentPassword,
          newPassword
        );


      if (!result.success) {

        showMessage(
          changeMessage,
          result.message
        );

        return;
      }


      updateSession(
        result.user
      );


      showMessage(
        changeMessage,
        "Password changed successfully.",
        "success"
      );


      changeForm.reset();

    }
  );

}


/* =====================================================
   RESET / FORGOT PASSWORD
===================================================== */

if (resetForm) {

  resetForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const email =
        document.getElementById(
          "resetEmail"
        ).value
          .trim()
          .toLowerCase();


      const verificationValue =
        document.getElementById(
          "verificationValue"
        ).value
          .trim();


      const newPassword =
        document.getElementById(
          "resetNewPassword"
        ).value;


      const confirmPassword =
        document.getElementById(
          "resetConfirmPassword"
        ).value;


      if (!email) {

        showMessage(
          resetMessage,
          "Please enter your registered email."
        );

        return;
      }


      if (!verificationValue) {

        showMessage(
          resetMessage,
          "Please enter your saved phone number."
        );

        return;
      }


      const validationError =
        validateNewPassword(
          newPassword,
          confirmPassword
        );


      if (validationError) {

        showMessage(
          resetMessage,
          validationError
        );

        return;
      }


      const result =
        resetPassword(
          email,
          newPassword,
          verificationValue
        );


      if (!result.success) {

        showMessage(
          resetMessage,
          result.message
        );

        return;
      }


      showMessage(
        resetMessage,
        "Password reset successfully. You can now log in with your new password.",
        "success"
      );


      resetForm.reset();


      setTimeout(
        function () {

          window.location.href =
            "login.html";

        },
        1400
      );

    }
  );

}


/* =====================================================
   AUTO-FILL EMAIL
===================================================== */

const currentUser =
  getCurrentUser();

const resetEmail =
  document.getElementById(
    "resetEmail"
  );


if (
  currentUser &&
  resetEmail &&
  currentUser.email
) {

  resetEmail.value =
    currentUser.email;
}


/* =====================================================
   HASH NAVIGATION
===================================================== */

if (
  window.location.hash ===
  "#change"
) {

  const changeSection =
    document.getElementById(
      "change"
    );

  if (changeSection) {

    setTimeout(
      function () {

        changeSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      },
      100
    );
  }
}
