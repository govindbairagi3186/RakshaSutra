import { authenticateUser } from "./auth.js";


/* =====================================================
   SESSION
===================================================== */

const SESSION_KEY =
  "rakshasutra-current-user";


/* =====================================================
   ELEMENTS
===================================================== */

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");


/* =====================================================
   SAVE SESSION
===================================================== */

function saveSession(user) {

  const sessionUser = {

    id: user.id,

    email: user.email,

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
   MESSAGE
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

  loginMessage.style.color =
    type === "success"
      ? "#4ade80"
      : "#ff6b6b";
}


/* =====================================================
   LOGIN
===================================================== */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const emailInput =
        document.getElementById("email");

      const passwordInput =
        document.getElementById("password");


      const email =
        emailInput.value
          .trim()
          .toLowerCase();

      const password =
        passwordInput.value;


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


      if (!user) {

        showMessage(
          "Invalid email or password."
        );

        passwordInput.value = "";

        passwordInput.focus();

        return;
      }


      saveSession(user);


      showMessage(
        "Login successful. Opening RakshaSutra...",
        "success"
      );


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
