import { createUser } from "./auth.js";

/*
=========================================================
RAKSHA SUTRA - REGISTRATION SYSTEM
=========================================================

This file handles the one-time account setup.

The user enters:
- Full name
- Email
- Mobile number
- Password
- Guardian details
- Trusted contact details

After registration:
- The profile is saved through auth.js
- A login session is created
- The user is taken directly to user.html

Future logins require ONLY:
- Email
- Password
=========================================================
*/

const SESSION_KEY = "rakshasutra-current-user";

const registerForm =
  document.getElementById("registerForm");

const registerMessage =
  document.getElementById("registerMessage");


/* =====================================================
   SAVE SESSION
   ===================================================== */

function saveSession(user) {

  const sessionUser = {

    id: user.id,

    email: user.email,

    fullName: user.fullName || "",

    phone: user.phone || "",

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
   SHOW MESSAGE
   ===================================================== */

function showMessage(
  message,
  type = "error"
) {

  if (!registerMessage) {
    return;
  }


  registerMessage.textContent =
    message;


  if (type === "success") {

    registerMessage.style.color =
      "#4ade80";

  } else {

    registerMessage.style.color =
      "#ff6b6b";

  }
}


/* =====================================================
   GET FORM VALUE
   ===================================================== */

function getValue(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value.trim()
    : "";
}


/* =====================================================
   REGISTRATION
   ===================================================== */

registerForm.addEventListener(
  "submit",
  function (event) {

    event.preventDefault();


    /* ---------------------------------------------
       GET USER INFORMATION
       --------------------------------------------- */

    const fullName =
      getValue("fullName");

    const email =
      getValue("email")
        .toLowerCase();

    const phone =
      getValue("phone");

    const password =
      document.getElementById("password")
        ?.value || "";


    /* ---------------------------------------------
       GET GUARDIAN INFORMATION
       --------------------------------------------- */

    const guardianName =
      getValue("guardianName");

    const guardianPhone =
      getValue("guardianPhone");


    /* ---------------------------------------------
       GET TRUSTED CONTACT
       --------------------------------------------- */

    const trustedName =
      getValue("trustedName");

    const trustedPhone =
      getValue("trustedPhone");

    const trustedAddress =
      getValue("trustedAddress");


    /* ---------------------------------------------
       VALIDATION
       --------------------------------------------- */

    if (!fullName) {

      showMessage(
        "Please enter your full name."
      );

      document
        .getElementById("fullName")
        ?.focus();

      return;
    }


    if (!email) {

      showMessage(
        "Please enter your email address."
      );

      document
        .getElementById("email")
        ?.focus();

      return;
    }


    if (!password) {

      showMessage(
        "Please create a password."
      );

      document
        .getElementById("password")
        ?.focus();

      return;
    }


    if (password.length < 6) {

      showMessage(
        "Password must contain at least 6 characters."
      );

      document
        .getElementById("password")
        ?.focus();

      return;
    }


    if (!phone) {

      showMessage(
        "Please enter your mobile number."
      );

      document
        .getElementById("phone")
        ?.focus();

      return;
    }


    if (!guardianName ||
        !guardianPhone) {

      showMessage(
        "Please enter the guardian name and phone number."
      );

      return;
    }


    if (!trustedName ||
        !trustedPhone) {

      showMessage(
        "Please enter the trusted person's name and phone number."
      );

      return;
    }


    /* ---------------------------------------------
       CREATE USER OBJECT
       --------------------------------------------- */

    const profile = {

      fullName,

      email,

      phone,

      password,

      guardianName,

      guardianPhone,

      trustedName,

      trustedPhone,

      trustedAddress

    };


    /* ---------------------------------------------
       CREATE ACCOUNT
       --------------------------------------------- */

    let user;


    try {

      user =
        createUser(profile);

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      showMessage(
        error?.message ||
        "Unable to create the account. Please try again."
      );

      return;
    }


    /* ---------------------------------------------
       CHECK RESULT
       --------------------------------------------- */

    if (!user) {

      showMessage(
        "Account could not be created. Please try again."
      );

      return;
    }


    /* ---------------------------------------------
       SAVE LOGIN SESSION
       --------------------------------------------- */

    saveSession(user);


    /* ---------------------------------------------
       SUCCESS
       --------------------------------------------- */

    showMessage(
      "Account created successfully. Opening RakshaSutra...",
      "success"
    );


    /*
    Give the browser a short moment to display
    the success message.
    */

    setTimeout(
      function () {

        window.location.href =
          "user.html";

      },
      700
    );

  }
);
