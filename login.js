```javascript
import {
  authenticateUser,
  resetPassword
} from "./auth.js";


/*
=========================================================
RAKSHA SUTRA - LOGIN + FORGOT PASSWORD
=========================================================

NORMAL LOGIN:
- Email
- Password

FORGOT PASSWORD:
- Registered email
- Registered mobile number
- New password
- Confirm new password

The current zero-cost version uses the information
already stored in the browser's RakshaSutra account data.

No full name or mobile number is requested during
normal login.
=========================================================
*/


const SESSION_KEY =
  "rakshasutra-current-user";


/* =====================================================
   LOGIN ELEMENTS
===================================================== */

const loginForm =
  document.getElementById(
    "loginForm"
  );


const loginMessage =
  document.getElementById(
    "loginMessage"
  );


/* =====================================================
   FORGOT PASSWORD ELEMENTS
===================================================== */

const forgotPasswordLink =
  document.getElementById(
    "forgotPasswordLink"
  );


const forgotPasswordPanel =
  document.getElementById(
    "forgotPasswordPanel"
  );


const forgotPasswordForm =
  document.getElementById(
    "forgotPasswordForm"
  );


const forgotPasswordMessage =
  document.getElementById(
    "forgotPasswordMessage"
  );


const cancelForgotPassword =
  document.getElementById(
    "cancelForgotPassword"
  );


/* =====================================================
   SAVE LOGIN SESSION
===================================================== */

function saveSession(user) {

  if (!user) {
    return;
  }


  const sessionUser = {

    id:
      user.id,

    email:
      user.email,

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
   SHOW LOGIN MESSAGE
===================================================== */

function showMessage(
  message,
  type = "error"
) {

  if (!loginMessage) {
    return;
  }


  loginMessage.textContent =
    message;


  if (type === "success") {

    loginMessage.style.color =
      "#4ade80";

  } else {

    loginMessage.style.color =
      "#ff6b6b";
  }
}


/* =====================================================
   SHOW RESET MESSAGE
===================================================== */

function showForgotMessage(
  message,
  type = "error"
) {

  if (!forgotPasswordMessage) {
    return;
  }


  forgotPasswordMessage.textContent =
    message;


  if (type === "success") {

    forgotPasswordMessage.style.color =
      "#4ade80";

  } else {

    forgotPasswordMessage.style.color =
      "#ff6b6b";
  }
}


/* =====================================================
   OPEN FORGOT PASSWORD
===================================================== */

function openForgotPassword(
  event
) {

  if (event) {
    event.preventDefault();
  }


  if (!forgotPasswordPanel) {
    return;
  }


  forgotPasswordPanel.classList.remove(
    "hidden"
  );


  showForgotMessage(
    ""
  );


  const resetEmail =
    document.getElementById(
      "resetEmail"
    );


  const loginEmail =
    document.getElementById(
      "email"
    );


  /*
   * If the user already entered their email
   * on the login form, automatically copy it
   * into the reset form.
   */

  if (
    resetEmail &&
    loginEmail &&
    loginEmail.value.trim()
  ) {

    resetEmail.value =
      loginEmail.value.trim()
        .toLowerCase();
  }


  resetEmail?.focus();
}


/* =====================================================
   CLOSE FORGOT PASSWORD
===================================================== */

function closeForgotPassword() {

  if (!forgotPasswordPanel) {
    return;
  }


  forgotPasswordPanel.classList.add(
    "hidden"
  );


  if (forgotPasswordForm) {
    forgotPasswordForm.reset();
  }


  showForgotMessage(
    ""
  );
}


/* =====================================================
   NORMAL LOGIN
===================================================== */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const emailInput =
        document.getElementById(
          "email"
        );


      const passwordInput =
        document.getElementById(
          "password"
        );


      if (!emailInput || !passwordInput) {
        return;
      }


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      const password =
        passwordInput.value;


      /* ---------------------------------------------
         BASIC VALIDATION
      --------------------------------------------- */

      if (!email) {

        showMessage(
          "Please enter your email."
        );

        emailInput.focus();

        return;
      }


      if (!password) {

        showMessage(
          "Please enter your password."
        );

        passwordInput.focus();

        return;
      }


      /* ---------------------------------------------
         AUTHENTICATE USER
      --------------------------------------------- */

      let user = null;


      try {

        user =
          authenticateUser(
            email,
            password
          );

      } catch (error) {

        console.error(
          "Login error:",
          error
        );


        showMessage(
          "Unable to log in right now. Please try again."
        );

        return;
      }


      /* ---------------------------------------------
         INVALID LOGIN
      --------------------------------------------- */

      if (!user) {

        showMessage(
          "Invalid email or password."
        );


        passwordInput.value =
          "";


        passwordInput.focus();


        return;
      }


      /* ---------------------------------------------
         SUCCESSFUL LOGIN
      --------------------------------------------- */

      saveSession(user);


      showMessage(
        "Login successful. Opening RakshaSutra...",
        "success"
      );


      /*
       * Give the success message a short moment
       * before opening the user dashboard.
       */

      setTimeout(
        function () {

          window.location.href =
            "user.html";

        },
        500
      );

    }
  );
}


/* =====================================================
   FORGOT PASSWORD LINK
===================================================== */

if (forgotPasswordLink) {

  forgotPasswordLink.addEventListener(
    "click",
    openForgotPassword
  );
}


/* =====================================================
   CANCEL FORGOT PASSWORD
===================================================== */

if (cancelForgotPassword) {

  cancelForgotPassword.addEventListener(
    "click",
    closeForgotPassword
  );
}


/* =====================================================
   RESET PASSWORD
===================================================== */

if (forgotPasswordForm) {

  forgotPasswordForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const emailInput =
        document.getElementById(
          "resetEmail"
        );


      const verificationInput =
        document.getElementById(
          "resetVerification"
        );


      const newPasswordInput =
        document.getElementById(
          "resetPassword"
        );


      const confirmPasswordInput =
        document.getElementById(
          "resetPasswordConfirm"
        );


      if (
        !emailInput ||
        !verificationInput ||
        !newPasswordInput ||
        !confirmPasswordInput
      ) {

        showForgotMessage(
          "Password reset form is incomplete."
        );

        return;
      }


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      const verificationValue =
        verificationInput.value
          .trim();


      const newPassword =
        newPasswordInput.value;


      const confirmPassword =
        confirmPasswordInput.value;


      /* ---------------------------------------------
         EMAIL VALIDATION
      --------------------------------------------- */

      if (!email) {

        showForgotMessage(
          "Please enter your registered email."
        );

        emailInput.focus();

        return;
      }


      /* ---------------------------------------------
         MOBILE VALIDATION
      --------------------------------------------- */

      if (!verificationValue) {

        showForgotMessage(
          "Please enter your registered mobile number."
        );

        verificationInput.focus();

        return;
      }


      /* ---------------------------------------------
         PASSWORD VALIDATION
      --------------------------------------------- */

      if (!newPassword) {

        showForgotMessage(
          "Please create a new password."
        );

        newPasswordInput.focus();

        return;
      }


      if (newPassword.length < 6) {

        showForgotMessage(
          "New password must contain at least 6 characters."
        );

        newPasswordInput.focus();

        return;
      }


      /* ---------------------------------------------
         CONFIRM PASSWORD
      --------------------------------------------- */

      if (!confirmPassword) {

        showForgotMessage(
          "Please confirm your new password."
        );

        confirmPasswordInput.focus();

        return;
      }


      if (
        newPassword !==
        confirmPassword
      ) {

        showForgotMessage(
          "New passwords do not match."
        );

        confirmPasswordInput.focus();

        return;
      }


      /* ---------------------------------------------
         RESET PASSWORD
      --------------------------------------------- */

      let result;


      try {

        result =
          resetPassword(
            email,
            newPassword,
            verificationValue
          );

      } catch (error) {

        console.error(
          "Password reset error:",
          error
        );


        showForgotMessage(
          "Unable to reset the password. Please try again."
        );

        return;
      }


      /* ---------------------------------------------
         RESET FAILED
      --------------------------------------------- */

      if (
        !result ||
        !result.success
      ) {

        showForgotMessage(
          result?.message ||
          "Password could not be reset."
        );

        return;
      }


      /* ---------------------------------------------
         RESET SUCCESSFUL
      --------------------------------------------- */

      showForgotMessage(
        "✅ Password reset successfully. You can now log in with your new password.",
        "success"
      );


      /*
       * Clear password fields.
       */

      newPasswordInput.value =
        "";

      confirmPasswordInput.value =
        "";


      /*
       * Put the reset email into the normal
       * login email field.
       */

      const loginEmail =
        document.getElementById(
          "email"
        );


      if (loginEmail) {

        loginEmail.value =
          email;
      }


      /*
       * Close the reset panel after a
       * short delay.
       */

      setTimeout(
        function () {

          closeForgotPassword();


          const loginPassword =
            document.getElementById(
              "password"
            );


          if (loginPassword) {
            loginPassword.focus();
          }


          showMessage(
            "Password reset successfully. Please log in with your new password.",
            "success"
          );

        },
        1200
      );

    }
  );
}
```
