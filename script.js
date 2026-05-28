// ============================================================
//  VOTONN — login-script.js  (fixed)
//  ✅ Uses renderButton instead of prompt() — fixes FedCM error
//  ✅ Graceful reCAPTCHA — login still works without real key
// ============================================================

// ── REPLACE THESE WITH YOUR REAL KEYS ──────────────────────
const GOOGLE_CLIENT_ID = "162297433169-hshj2oecea7ra2qomdeqjrv5en7ik931.apps.googleusercontent.com";
const RECAPTCHA_SITE_KEY = "6LchjfosAAAAAGa7eq4eY3a0iV9dAIATqmVbjM6f";
const BACKEND_URL = "http://localhost:8080/api";
// ────────────────────────────────────────────────────────────


// ============================================================
// 1.  GOOGLE IDENTITY SERVICES
//     Uses renderButton (not prompt) — works on http://localhost
// ============================================================
window.addEventListener("load", () => {
  if (typeof google === "undefined") {
    console.warn("Google GIS script not loaded.");
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    use_fedcm_for_prompt: false,   // FIX: disables FedCM — prevents NetworkError on localhost
    auto_select: false,
  });

  // Render Google's official button inside our wrapper div
  const container = document.getElementById("googleBtnContainer");
  if (container) {
    google.accounts.id.renderButton(container, {
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      width: 380,
      logo_alignment: "left",
      text: "continue_with",
    });
  }
});


// ============================================================
// 2.  GOOGLE OAUTH2 CALLBACK
// ============================================================
async function handleGoogleCredentialResponse(credentialResponse) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });
    const data = await res.json();

    if (res.ok && data.token) {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("isLoggedIn", "true");
      if (data.name) sessionStorage.setItem("userName", data.name);
      showToast("Google login successful!", "success");
      setTimeout(() => (window.location.href = "heroSection.html"), 800);
    } else {
      showToast(data.message || "Google login failed. Please try again.", "error");
    }
  } catch (err) {
    console.error("Google auth error:", err);
    showToast("Network error. Is the backend running on port 8080?", "error");
  }
}


// ============================================================
// 3.  RECAPTCHA v3 — graceful fallback if key not set yet
// ============================================================
function getCaptchaToken(action = "login") {
  return new Promise((resolve) => {
    if (
      RECAPTCHA_SITE_KEY === "6LchjfosAAAAAGa7eq4eY3a0iV9dAI" ||
      typeof grecaptcha === "undefined"
    ) {
      console.warn("reCAPTCHA key not set — skipping captcha.");
      resolve("");
      return;
    }
    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(() => resolve(""));
    });
  });
}


// ============================================================
// 4.  PASSWORD STRENGTH
// ============================================================
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p) => /[0-9]/.test(p), label: "One number" },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(p), label: "One special character (!@#$...)" },
];
const STRENGTH_LABELS = ["", "Too weak", "Weak", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#e84545", "#f5a623", "#82c7ff", "#2dd4a0"];

function updateStrengthUI(password, fillId, labelId) {
  const fill = document.getElementById(fillId);
  const label = document.getElementById(labelId);
  if (!fill || !label) return;
  if (!password) {
    fill.style.width = "0%"; label.textContent = "";
    fill.removeAttribute("data-level"); return;
  }
  const raw = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const level = Math.min(4, Math.max(1, Math.ceil(raw * 4 / 5)));
  fill.setAttribute("data-level", level);
  label.textContent = STRENGTH_LABELS[level];
  label.style.color = STRENGTH_COLORS[level];
}

function validatePasswordStrong(password) {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label);
}


// ============================================================
// 5.  FORM HELPERS
// ============================================================
function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.toggle("invalid", !!message);
  if (error) error.textContent = message || "";
}
function clearFieldError(inputId, errorId) { setFieldError(inputId, errorId, ""); }
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }


// ============================================================
// 6.  PASSWORD VISIBILITY TOGGLE
// ============================================================
function setupPasswordToggle(btnId, inputId, iconId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("click", () => {
    const input = document.getElementById(inputId);
    const isHide = input.type === "password";
    input.type = isHide ? "text" : "password";
    const icon = document.getElementById(iconId);
    if (icon) {
      icon.innerHTML = isHide
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>`;
    }
  });
}
setupPasswordToggle("togglePassword", "loginPassword", "eyeIcon");


// ============================================================
// 7.  BUTTON LOADING
// ============================================================
function setButtonLoading(btn, loading, label) {
  if (!btn) return;
  const textEl = btn.querySelector(".btn-text");
  const spinnerEl = btn.querySelector(".btn-spinner");
  btn.disabled = loading;
  if (textEl) textEl.textContent = label;
  if (spinnerEl) spinnerEl.style.display = loading ? "block" : "none";
}


// ============================================================
// 8.  TOAST
// ============================================================
function showToast(message, type = "info") {
  document.querySelectorAll(".votonn-toast").forEach((t) => t.remove());
  const toast = document.createElement("div");
  toast.className = "votonn-toast";
  toast.textContent = message;
  const colors = { error: "#e84545", success: "#2dd4a0", info: "#3b6cf4" };
  Object.assign(toast.style, {
    position: "fixed", bottom: "28px", left: "50%",
    transform: "translateX(-50%)", background: colors[type] || colors.info,
    color: "#fff", padding: "12px 24px", borderRadius: "10px",
    fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif", fontWeight: "500",
    zIndex: "9999", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxWidth: "90vw", textAlign: "center",
  });
  if (!document.getElementById("toastKeyframes")) {
    const s = document.createElement("style"); s.id = "toastKeyframes";
    s.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
    document.head.appendChild(s);
  }
  toast.style.animation = "toastIn 0.3s ease";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}


// ============================================================
// 9.  LIVE VALIDATION
// ============================================================
const passwordInput = document.getElementById("loginPassword");
if (passwordInput) {
  passwordInput.addEventListener("input", () => {
    if (passwordInput.value) clearFieldError("loginPassword", "passwordError");
  });
}
const emailInput = document.getElementById("loginEmail");
if (emailInput) {
  emailInput.addEventListener("input", () => clearFieldError("loginEmail", "emailError"));
}


// ============================================================
// 10.  LOGIN FORM SUBMIT
// ============================================================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const loginBtn = document.getElementById("loginBtn");

    let hasError = false;
    if (!email) {
      setFieldError("loginEmail", "emailError", "Email is required."); hasError = true;
    } else if (!validateEmail(email)) {
      setFieldError("loginEmail", "emailError", "Enter a valid email address."); hasError = true;
    }
    if (!password) {
      setFieldError("loginPassword", "passwordError", "Password is required."); hasError = true;
    }
    if (hasError) return;

    setButtonLoading(loginBtn, true, "Signing in…");
    try {
      const captchaToken = await getCaptchaToken("login");
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaToken }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("email", email);
        showToast("Login successful! Redirecting…", "success");
        setTimeout(() => (window.location.href = "heroSection.html"), 800);
      } else {
        const msg = data.message || "Invalid email or password.";
        setFieldError("loginPassword", "passwordError", msg);
        showToast(msg, "error");
      }
    } catch (err) {
      console.error("Login error:", err);
      showToast("Network error — is the backend running on port 8080?", "error");
    } finally {
      setButtonLoading(loginBtn, false, "Sign In");
    }
  });
}
