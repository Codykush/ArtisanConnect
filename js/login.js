import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from "./firebase.js";
import { userDB, artisanDB } from "./database.js";

const redirectToNext = async (user) => {
  localStorage.setItem("currentUser", JSON.stringify(user));

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (redirect && !redirect.includes("login.html")) {
    window.location.href = redirect;
    return;
  }

  const artisan = await artisanDB.getArtisanByUserId(user.uid);
  if (artisan) {
    window.location.href = `my-account.html`;
    return;
  }

  window.location.href = "my-account.html";
};

document.addEventListener("DOMContentLoaded", () => {
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const nameWrap = document.getElementById("nameWrap");
  const authForm = document.getElementById("authForm");
  const authName = document.getElementById("authName");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const resetPasswordBtn = document.getElementById("resetPasswordBtn");
  const showLoginBtn = document.getElementById("showLoginBtn");
  const showSignupBtn = document.getElementById("showSignupBtn");

  let mode = "login";

  function setMode(newMode) {
    mode = newMode;
    if (mode === "login") {
      authTitle.textContent = "Login";
      authSubtitle.textContent = "Login to continue";
      authSubmitBtn.textContent = "Login";
      nameWrap.style.display = "none";
    } else {
      authTitle.textContent = "Sign Up";
      authSubtitle.textContent = "Create your account first";
      authSubmitBtn.textContent = "Create Account";
      nameWrap.style.display = "block";
    }
  }

  showLoginBtn?.addEventListener("click", () => setMode("login"));
  showSignupBtn?.addEventListener("click", () => setMode("signup"));

  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    const name = authName.value.trim();

    try {
      if (mode === "signup") {
        if (!name) {
          alert("Enter your full name.");
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = {
          uid: cred.user.uid,
          email,
          name,
          role: "user",
          photoURL: "",
          createdAt: new Date().toISOString()
        };

        await userDB.saveUser(user);
        await redirectToNext(user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        let user = await userDB.getUser(cred.user.uid);

        if (!user) {
          user = {
            uid: cred.user.uid,
            email: cred.user.email,
            name: cred.user.email.split("@")[0],
            role: "user",
            photoURL: "",
            createdAt: new Date().toISOString()
          };
          await userDB.saveUser(user);
        }

        await redirectToNext(user);
      }
    } catch (error) {
      console.error(error);
      const messageMap = {
        "auth/invalid-credential": "Wrong email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Wrong email or password.",
        "auth/email-already-in-use": "This email is already registered.",
        "auth/popup-closed-by-user": "Google sign-in was closed before completion."
      };
      alert(messageMap[error.code] || error.message || "Authentication failed.");
    }
  });

  googleLoginBtn?.addEventListener("click", async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const firebaseUser = cred.user;

      let user = await userDB.getUser(firebaseUser.uid);
      if (!user) {
        user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          role: "user",
          photoURL: firebaseUser.photoURL || "",
          createdAt: new Date().toISOString()
        };
        await userDB.saveUser(user);
      }

      await redirectToNext(user);
    } catch (error) {
      console.error(error);
      alert(error.code === "auth/popup-closed-by-user" ? "Google sign-in was closed before completion." : ("Google login failed: " + error.message));
    }
  });

  resetPasswordBtn?.addEventListener("click", async () => {
    const email = authEmail.value.trim();
    if (!email) {
      alert("Enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to send password reset email.");
    }
  });

  setMode("login");
});