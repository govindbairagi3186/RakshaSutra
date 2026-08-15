import { authenticateUser } from "./auth.js";

/*
=========================================================
RAKSHA SUTRA - LOGIN SYSTEM
=========================================================

Login requires ONLY:
- Email
- Password

Full name, mobile number and emergency contacts are NOT
requested again.

The successful login session is saved locally so that
opening SMS/dialer from the emergency system does not
automatically log the user out.
=========================================================
*/

const SESSION_KEY = "rakshasutra-current-user";

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");


/* =====================================================
   SAVE LOGIN SESSION
   ===================================================== */

function saveSession(user) {

  const sessionUser = {
    id: user.id,
    email: user.email,

    fullName: user.fullName || "",
    phone: user.phone || "",

    guardianName: user.guardianName || "",
    guardianPhone: user.guardianPhone || "",

    trustedName: user.trustedName || "",
    trustedPhone: user.trustedPhone || "",

    trustedAddress: user.trustedAddress || ""
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(sessionUser)
  );
}


/* =====================================================
   SHOW MESSAGE
   ===================================================== */

function showMessage(message, type = "error") {

  if (!loginMessage) return;

  loginMessage.textContent = message;

  if (type === "success") {

    loginMessage.style.color = "#4ade80";

  } else {

    loginMessage.style.color = "#ff6b6b";

  }
}


/* =====================================================
   LOGIN
   ===================================================== */

loginForm.addEventListener("submit", function (event) {

  event.preventDefault();


  const emailInput =
    document.getElementById("email");

  const passwordInput =
    document.getElementById("password");


  const email =
    emailInput.value.trim().toLowerCase();

  const password =
    passwordInput.value;


  /* ---------------------------------------------
     BASIC VALIDATION
     --------------------------------------------- */

  if (!email) {

    showMessage("Please enter your email.");

    emailInput.focus();

    return;
  }


  if (!password) {

    showMessage("Please enter your password.");

    passwordInput.focus();

    return;
  }


  /* ---------------------------------------------
     AUTHENTICATE USER
     --------------------------------------------- */

  let user = null;

  try {

    user = authenticateUser(
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

    passwordInput.value = "";

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
  Small delay so the user can see the successful
  login message before being redirected.
  */

  setTimeout(function () {

    window.location.href = "user.html";

  }, 500);

});
