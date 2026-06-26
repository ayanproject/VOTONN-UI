// ============================================================
//  VOTONN — login-script.js  (Updated for Custom CAPTCHA)
//  ✅ Uses renderButton instead of prompt() — fixes FedCM error
//  ✅ Replaced Google reCAPTCHA with Custom Server-side CAPTCHA
// ============================================================

// ── REPLACE THESE WITH YOUR REAL KEYS ──────────────────────
const GOOGLE_CLIENT_ID = "930858823292-6nr1enve464pdt8jjbh3ekqoerrq42f5.apps.googleusercontent.com";
// We now use API_BASE_URL defined in auth.js instead of a local BACKEND_URL
// ────────────────────────────────────────────────────────────

// ============================================================
// 1.  GOOGLE IDENTITY SERVICES & INITIALIZATION
// ============================================================
window.addEventListener("load", async () => {
  // Check auth first (route guarding)
  await checkAuth();

  // Load our custom CAPTCHA as soon as the page loads
  loadCustomCaptcha();

  if (typeof google === "undefined") {
    console.warn("Google GIS script not loaded.");
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    use_fedcm_for_prompt: false,
    auto_select: false,
  });

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
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });
    const data = await res.json();

    if (res.ok && data.token) {
      saveToken(data.token);
      localStorage.setItem("adminEmail", data.email || "");
      localStorage.setItem("userRole", data.role || "USER");
      showToast("Google login successful!", "success");
      if (data.role === "ADMIN") {
        setTimeout(() => (window.location.href = "admin-dashboard.html"), 800);
      } else {
        setTimeout(() => (window.location.href = "heroSection.html"), 800);
      }
    } else {
      showToast(data.message || "Google login failed. Please try again.", "error");
    }
  } catch (err) {
    console.error("Google auth error:", err);
    showToast("Network error. Is the backend running on port 8080?", "error");
  }
}

// ============================================================
// 3.  CUSTOM ALPHANUMERIC CAPTCHA
// ============================================================
let currentCaptchaSessionId = null;

async function loadCustomCaptcha() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/captcha`);
    const data = await res.json();

    // Expecting backend to return { imageBase64: "...", sessionId: "..." }
    const captchaImg = document.getElementById("captchaImage");
    if (captchaImg && data.imageBase64) {
      captchaImg.src = `data:image/png;base64,${data.imageBase64}`;
    }
    currentCaptchaSessionId = data.sessionId;
  } catch (err) {
    console.error("Failed to load CAPTCHA:", err);
    showToast("Failed to load security check.", "error");
  }
}

// Attach to the refresh button
document.getElementById("refreshCaptchaBtn")?.addEventListener("click", loadCustomCaptcha);

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

// Clear CAPTCHA error on typing
const captchaInputEl = document.getElementById("captchaInput");
if (captchaInputEl) {
  captchaInputEl.addEventListener("input", () => clearFieldError("captchaInput", "captchaError"));
}

// ============================================================
// 10. LOGIN FORM SUBMIT
// ============================================================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const captchaAnswer = document.getElementById("captchaInput") ? document.getElementById("captchaInput").value.trim() : "";
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

    if (!captchaAnswer) {
      setFieldError("captchaInput", "captchaError", "CAPTCHA is required."); hasError = true;
    }

    if (hasError) return;

    setButtonLoading(loginBtn, true, "Signing in…");
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          captchaAnswer,
          captchaSessionId: currentCaptchaSessionId
        }),
      });
      const data = await response.json();

      if (response.ok && data.token) {
        // Save token to memory instead of localStorage
        saveToken(data.token);
        localStorage.setItem("adminEmail", email); // Helpful for the dashboard sidebar profile layout
        localStorage.setItem("userRole", data.role || "USER");

        showToast("Login successful! Redirecting…", "success");

        // Role-based redirection
        if (data.role === "ADMIN") {
          setTimeout(() => (window.location.href = "admin-dashboard.html"), 800);
        } else {
          setTimeout(() => (window.location.href = "heroSection.html"), 800);
        }
      } else {
        const msg = data.message || "Invalid email, password, or CAPTCHA.";
        setFieldError("loginPassword", "passwordError", msg);
        showToast(msg, "error");

        // Refresh CAPTCHA and clear input on failure
        loadCustomCaptcha();
        document.getElementById("captchaInput").value = "";
      }
    } catch (err) {
      console.error("Login error:", err);
      showToast("Network error — is the backend running on port 8080?", "error");
    } finally {
      setButtonLoading(loginBtn, false, "Sign In");
    }
  });
}