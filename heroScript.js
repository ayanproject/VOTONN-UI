// ════════════════════════════════════════════════════════════════════════════
//  heroScript.js  —  VOTONN Frontend
//  Contains: camera logic (unchanged) + NEW backend calls for
//            Correction and Deletion features.
// ════════════════════════════════════════════════════════════════════════════

const API_BASE = "/api"; // adjust port if different

// 1. Check for authentication as soon as the page loads
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof checkAuth === "function") {
    await checkAuth();
  }
});

// ── Camera Logic (unchanged from your original) ───────────────────────────

let mediaStream = null;
let hasSnapshot = false;

function showVoteForm() {
  document.getElementById("voteForm").style.display = "flex";
  document.getElementById("proceedBtn").style.display = "none";
}

async function startCamera() {
  const startBtn   = document.getElementById("startCamBtn");
  const stopBtn    = document.getElementById("stopCamBtn");
  const captureBtn = document.getElementById("captureBtn");
  const video      = document.getElementById("camera");
  const canvas     = document.getElementById("snapshot");
  const overlay    = document.getElementById("camOverlay");

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });

    video.srcObject = mediaStream;
    await video.play();

    startBtn.disabled   = true;
    stopBtn.disabled    = false;
    captureBtn.disabled = false;
    canvas.style.display = "none";
    video.style.display  = "block";
    if (overlay) overlay.classList.add("hidden");
    hasSnapshot = false;
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not access camera. Use HTTPS or localhost and allow permissions.");
  }
}

function stopCamera() {
  const startBtn   = document.getElementById("startCamBtn");
  const stopBtn    = document.getElementById("stopCamBtn");
  const captureBtn = document.getElementById("captureBtn");
  const video      = document.getElementById("camera");
  const overlay    = document.getElementById("camOverlay");

  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }

  startBtn.disabled   = false;
  stopBtn.disabled    = true;
  captureBtn.disabled = true;
  video.srcObject     = null;
  if (overlay) overlay.classList.remove("hidden");
}

function captureFrame() {
  const video    = document.getElementById("camera");
  const canvas   = document.getElementById("snapshot");
  const retakeBtn = document.getElementById("retakeBtn");

  if (!video.videoWidth || !video.videoHeight) {
    alert("Camera not ready yet. Please wait a second and try again.");
    return;
  }

  const targetW = 640;
  const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW);

  canvas.width  = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, targetW, targetH);

  canvas.style.display  = "block";
  video.style.display   = "none";
  retakeBtn.style.display = "inline-block";
  hasSnapshot = true;
}

function retake() {
  const video     = document.getElementById("camera");
  const canvas    = document.getElementById("snapshot");
  const retakeBtn = document.getElementById("retakeBtn");

  canvas.style.display    = "none";
  video.style.display     = "block";
  retakeBtn.style.display = "none";
  hasSnapshot = false;
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

async function proceedToVote() {
  alert("Starting Face Validation...");

  const voterId   = document.getElementById("voterId").value.trim();
  const secretPin = document.getElementById("secretPin").value.trim();
  const canvas    = document.getElementById("snapshot");

  if (!voterId || !secretPin) {
    alert("⚠ Please provide Voter ID and Secret PIN.");
    return;
  }

  if (!hasSnapshot) {
    if (!mediaStream) { alert("Please start the camera first."); return; }
    captureFrame();
  }

  try {
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
    if (!blob) { alert("Failed to capture image. Try again."); return; }

    const formData = new FormData();
    formData.append("voter_id",    voterId);
    formData.append("secret_pin",  secretPin);
    formData.append("probe_image", blob, "face.jpg");

    const verifyUrl = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1" || 
                      window.location.protocol === "file:"
      ? "http://127.0.0.1:8000/verify"
      : "/verify";

    const res    = await fetch(verifyUrl, { method: "POST", body: formData });
    const result = await res.json();

    if (result.verified === true) {
      alert("✅ Face Verified Successfully!");
      stopCamera();
      localStorage.setItem("expiryTime", Date.now() + 10 * 60 * 1000);
      window.location.href = "PartySelection.html";
    } else {
      alert("❌ Face Not Matched. Try Again!");
    }
  } catch (e) {
    console.error(e);
    alert("🚨 Could not connect to Python API. Ensure it is running.");
  }
}

window.addEventListener("beforeunload", stopCamera);


// ── Correction Panel Logic ────────────────────────────────────────────────

function openCorrectionPanel() {
  document.getElementById("correctionPanel").style.display = "block";
  document.getElementById("corrOpenBtn").style.display     = "none";
}

let selectedCorrField = null;

function selectCorrField(field) {
  selectedCorrField = field;
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("pill--active"));
  event.target.classList.add("pill--active");

  const fieldMap = {
    name:   { label: "Full Name",    type: "text"     },
    father: { label: "Father's Name",   type: "text"     },
    dob:    { label: "Date of Birth",   type: "date"     },
    email:  { label: "Email Address",   type: "email"    },
    pin:    { label: "4-Digit PIN",     type: "password" },
  };
  const cfg = fieldMap[field];

  document.getElementById("corrFormFields").innerHTML = `
    <input type="text"         id="corrVoterId"   placeholder="Voter ID"                 required />
    <input type="password"     id="corrPin"       placeholder="Current Security PIN"       maxlength="4" required />
    <input type="${cfg.type}"  id="corrCurrent"   placeholder="${cfg.label} (current)"     required />
    <input type="${cfg.type}"  id="corrNew"       placeholder="${cfg.label} (new)"         required />
  `;

  document.getElementById("corrStep1").style.display = "none";
  document.getElementById("corrStep2").style.display = "block";
}

function backToCorrStep1() {
  document.getElementById("corrStep2").style.display = "none";
  document.getElementById("corrStep1").style.display = "block";
  selectedCorrField = null;
}

async function submitCorrection() {
  const voterId      = document.getElementById("corrVoterId").value.trim();
  const securityPin  = document.getElementById("corrPin").value.trim();
  const currentValue = document.getElementById("corrCurrent").value.trim();
  const newValue     = document.getElementById("corrNew").value.trim();
  const docFile      = document.getElementById("corrDoc").files[0];

  if (!voterId || !securityPin || !currentValue || !newValue || !docFile || !selectedCorrField) {
    alert("⚠ Please fill all fields and attach a supporting document.");
    return;
  }

  const formData = new FormData();
  formData.append("voter_id",         voterId);
  formData.append("security_pin",     securityPin);
  formData.append("field_to_correct", selectedCorrField);
  formData.append("current_value",    currentValue);
  formData.append("new_value",        newValue);
  formData.append("document",         docFile);

  try {
    const res  = await apiFetch(`${API_BASE}/correction/submit`, { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      alert(`✅ ${data.message}\nRequest ID: ${data.requestId}`);
      
      // Reset UI
      document.getElementById("correctionPanel").style.display = "none";
      document.getElementById("corrOpenBtn").style.display     = "inline-block";
      document.getElementById("correctionForm").reset();
      backToCorrStep1();

      // ✅ Redirect to heroSection.html on successful submission
      window.location.href = "heroSection.html";
    } else {
      alert(`❌ ${data.message || "Submission failed. Please try again."}`);
    }
  } catch (err) {
    console.error(err);
    alert("🚨 Could not reach the server. Please ensure the backend is running.");
  }
}


// ── Deletion Panel Logic ──────────────────────────────────────────────────

function openDeletionPanel() {
  document.getElementById("deletionPanel").style.display = "block";
  document.getElementById("delOpenBtn").style.display    = "none";
}

async function submitDeletion() {
  const fullName   = document.getElementById("delName").value.trim();
  const fatherName = document.getElementById("delFather").value.trim();
  const dob        = document.getElementById("delDob").value.trim();
  const email      = document.getElementById("delEmail").value.trim();
  const pin        = document.getElementById("delPin").value.trim();
  const voterId    = document.getElementById("delVoterId").value.trim();
  const certFile   = document.getElementById("deathCert").files[0];

  if (!fullName || !fatherName || !dob || !email || !pin || !voterId || !certFile) {
    alert("⚠ Please fill all fields and upload the death certificate.");
    return;
  }

  if (pin.length !== 4 || isNaN(pin)) {
    alert("⚠ Security PIN must be exactly 4 digits.");
    return;
  }

  const formData = new FormData();
  formData.append("full_name",         fullName);
  formData.append("father_name",       fatherName);
  formData.append("dob",               dob);
  formData.append("email",             email);
  formData.append("security_pin",      pin);
  formData.append("voter_id",          voterId);
  formData.append("death_certificate", certFile);

  try {
    const res  = await apiFetch(`${API_BASE}/deletion/submit`, { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      alert(`✅ ${data.message}\nRequest ID: ${data.requestId}`);
      
      document.getElementById("deletionPanel").style.display = "none";
      document.getElementById("delOpenBtn").style.display    = "inline-block";
      document.getElementById("deletionForm").reset();

      // ✅ Redirect to heroSection.html on successful submission
      window.location.href = "heroSection.html";
    } else if (res.status === 409) {
      alert(`⚠ ${data.message}`); 
    } else {
      alert(`❌ ${data.message || "Submission failed. Please try again."}`);
    }
  } catch (err) {
    console.error(err);
    alert("🚨 Could not reach the server. Please ensure the backend is running.");
  }
}


// ── Results Panel Logic ──────────────────────────────────────────────────

function openResults() {
  document.getElementById("resultsPanel").style.display = "block";
  document.getElementById("resultsBtn").style.display   = "none";
  document.getElementById("resultsLoading").style.display = "flex";
  document.getElementById("resultsList").style.display    = "none";

  setTimeout(() => {
    document.getElementById("resultsLoading").style.display = "none";
    document.getElementById("resultsList").style.display    = "block";
    document.querySelectorAll(".bar-fill").forEach(b => b.classList.add("bar-fill--animate"));
  }, 2200);
}