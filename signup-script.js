// ============================================================
//  VOTONN — signup-script.js
//  Password strength + real-time rule checklist + form submit
// ============================================================

const BACKEND_URL = "http://localhost:8080/api";

// ── Password rules (same as login-script) ──────────────────
const PASSWORD_RULES = [
  { id: "rule-length",  test: (p) => p.length >= 8,                        label: "At least 8 characters" },
  { id: "rule-upper",   test: (p) => /[A-Z]/.test(p),                      label: "One uppercase letter" },
  { id: "rule-lower",   test: (p) => /[a-z]/.test(p),                      label: "One lowercase letter" },
  { id: "rule-number",  test: (p) => /[0-9]/.test(p),                      label: "One number" },
  { id: "rule-special", test: (p) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(p), label: "One special character" },
];
const STRENGTH_LABELS = ["", "Too weak", "Weak", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#e84545", "#f5a623", "#82c7ff", "#2dd4a0"];


// ── Helper: show/clear field errors ────────────────────────
function setFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.toggle("invalid", !!message);
  if (error) error.textContent = message || "";
}
function clearFieldError(inputId, errorId) { setFieldError(inputId, errorId, ""); }
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }


// ── Password visibility toggle ──────────────────────────────
const toggleBtn = document.getElementById("toggleSignupPassword");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const input  = document.getElementById("password");
    const isHide = input.type === "password";
    input.type   = isHide ? "text" : "password";
    const icon   = document.getElementById("signupEyeIcon");
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


// ── Live password strength + rule checklist ─────────────────
const passwordInput = document.getElementById("password");
if (passwordInput) {
  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    updateStrength(val);
    updateRuleChecklist(val);
    if (val) clearFieldError("password", "passwordError");
  });
}

function updateStrength(password) {
  const fill  = document.getElementById("signupStrengthFill");
  const label = document.getElementById("signupStrengthLabel");
  if (!fill || !label) return;
  if (!password) {
    fill.style.width = "0%"; label.textContent = "";
    fill.removeAttribute("data-level"); return;
  }
  const raw   = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const level = Math.min(4, Math.max(1, Math.ceil(raw * 4 / 5)));
  fill.setAttribute("data-level", level);
  label.textContent = STRENGTH_LABELS[level];
  label.style.color = STRENGTH_COLORS[level];
}

function updateRuleChecklist(password) {
  PASSWORD_RULES.forEach((rule) => {
    const li = document.getElementById(rule.id);
    if (li) li.classList.toggle("passed", rule.test(password));
  });
}

function isPasswordStrong(password) {
  return PASSWORD_RULES.every((r) => r.test(password));
}


// ── Toast ───────────────────────────────────────────────────
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


// ── Button loading ──────────────────────────────────────────
function setButtonLoading(btnId, textId, spinnerId, loading, label) {
  const btn     = document.getElementById(btnId);
  const textEl  = document.getElementById(textId);
  const spinner = document.getElementById(spinnerId);
  if (btn)     btn.disabled            = loading;
  if (textEl)  textEl.textContent      = label;
  if (spinner) spinner.style.display   = loading ? "block" : "none";
}


// ── Signup form submit ──────────────────────────────────────
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name     = document.getElementById("name").value.trim();
    const age      = document.getElementById("age").value;
    const email    = document.getElementById("email").value.trim();
    const phone    = document.getElementById("phone").value.trim();
    const gender   = document.getElementById("gender").value;
    const role     = document.getElementById("role").value;
    const password = document.getElementById("password").value;

    // ── Validate all fields ─────────────────────────────────
    let hasError = false;

    if (!name || name.length < 2) {
      setFieldError("name", "nameError", "Please enter your full name."); hasError = true;
    } else { clearFieldError("name", "nameError"); }

    if (!age || parseInt(age) < 18) {
      setFieldError("age", "ageError", "Must be 18 or older."); hasError = true;
    } else { clearFieldError("age", "ageError"); }

    if (!email) {
      setFieldError("email", "emailError", "Email is required."); hasError = true;
    } else if (!validateEmail(email)) {
      setFieldError("email", "emailError", "Enter a valid email address."); hasError = true;
    } else { clearFieldError("email", "emailError"); }

    if (!phone || phone.length < 7) {
      setFieldError("phone", "phoneError", "Enter a valid phone number."); hasError = true;
    } else { clearFieldError("phone", "phoneError"); }

    if (!gender) {
      setFieldError("gender", "genderError", "Please select your gender."); hasError = true;
    } else { clearFieldError("gender", "genderError"); }

    if (!role) {
      setFieldError("role", "roleError", "Please select an account type."); hasError = true;
    } else { clearFieldError("role", "roleError"); }

    // Password — must pass ALL rules
    if (!password) {
      setFieldError("password", "passwordError", "Password is required."); hasError = true;
    } else if (!isPasswordStrong(password)) {
      const failed = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label);
      setFieldError("password", "passwordError", `Required: ${failed.join(", ")}`);
      hasError = true;
    } else { clearFieldError("password", "passwordError"); }

    if (hasError) return;

    // ── Submit ──────────────────────────────────────────────
    setButtonLoading("signupBtn", null, "signupSpinner", true, "Creating account…");
    const btn = document.getElementById("signupBtn");
    const textEl = btn.querySelector(".btn-text");
    if (textEl) textEl.textContent = "Creating account…";

    const user = {
      name,
      email,
      password,
      age:    parseInt(age),
      phone,
      gender,
      role:   role.toUpperCase(),
    };

    try {
      const response = await fetch(`${BACKEND_URL}/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(user),
      });

      if (response.ok) {
        showToast("Account created! Redirecting to login…", "success");
        setTimeout(() => (window.location.href = "index.html"), 1200);
      } else {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("email")) {
          setFieldError("email", "emailError", "This email is already registered.");
          showToast("Email already in use.", "error");
        } else {
          showToast(errorText || "Registration failed. Please try again.", "error");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      showToast("Network error — is the backend running on port 8080?", "error");
    } finally {
      const btn2 = document.getElementById("signupBtn");
      if (btn2) btn2.disabled = false;
      const textEl2 = btn2 && btn2.querySelector(".btn-text");
      if (textEl2) textEl2.textContent = "Create Account";
      const spinner = document.getElementById("signupSpinner");
      if (spinner) spinner.style.display = "none";
    }
  });
}