let mediaStream = null;
let hasSnapshot = false;

function showVoteForm() {
  document.getElementById("voteForm").style.display = "flex";
  document.getElementById("proceedBtn").style.display = "none";
}

async function startCamera() {
  const startBtn = document.getElementById("startCamBtn");
  const stopBtn = document.getElementById("stopCamBtn");
  const captureBtn = document.getElementById("captureBtn");
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });

    video.srcObject = mediaStream;
    await video.play();

    // UI state
    startBtn.disabled = true;
    stopBtn.disabled = false;
    captureBtn.disabled = false;
    canvas.style.display = "none";
    video.style.display = "block";
    hasSnapshot = false;
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not access camera. Use HTTPS or localhost and allow permissions.");
  }
}

function stopCamera() {
  const startBtn = document.getElementById("startCamBtn");
  const stopBtn = document.getElementById("stopCamBtn");
  const captureBtn = document.getElementById("captureBtn");
  const video = document.getElementById("camera");

  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  startBtn.disabled = false;
  stopBtn.disabled = true;
  captureBtn.disabled = true;
  video.srcObject = null;
}

function captureFrame() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const retakeBtn = document.getElementById("retakeBtn");

  if (!video.videoWidth || !video.videoHeight) {
    alert("Camera not ready yet. Please wait a second and try again.");
    return;
  }

  const targetW = 640;
  const targetH = Math.round((video.videoHeight / video.videoWidth) * targetW);

  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, targetW, targetH);

  // Show snapshot instead of live
  canvas.style.display = "block";
  video.style.display = "none";
  retakeBtn.style.display = "inline-block";
  hasSnapshot = true;
}

function retake() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const retakeBtn = document.getElementById("retakeBtn");

  canvas.style.display = "none";
  video.style.display = "block";
  retakeBtn.style.display = "none";
  hasSnapshot = false;
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

async function proceedToVote() {
  alert("Starting Face Validation...");

  const voterId = document.getElementById("voterId").value.trim();
  const secretPin = document.getElementById("secretPin").value.trim();
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");

  if (!voterId || !secretPin) {
    alert("⚠ Please provide Voter ID and Secret PIN.");
    return;
  }

  if (!hasSnapshot) {
    if (!mediaStream) {
      alert("Please start the camera first.");
      return;
    }
    captureFrame();
  }

  try {
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
    if (!blob) {
      alert("Failed to capture image. Try again.");
      return;
    }

    const formData = new FormData();
    formData.append("voter_id", voterId);        // ✅ match FastAPI
    formData.append("secret_pin", secretPin);    // ✅ match FastAPI
    formData.append("probe_image", blob, "face.jpg"); // ✅ match FastAPI


    const res = await fetch("https://votonn-deepface-api-hfhqf9hae9g5hsdp.southeastasia-01.azurewebsites.net/verify", {   // ✅ switched to Python
      method: "POST",
      body: formData
    });

    const result = await res.json();
    console.log(result);

    if (result.verified === true) {
      alert("✅ Face Verified Successfully!");
      stopCamera();
      localStorage.setItem("expiryTime", Date.now() + 10 * 60 * 1000); // Example: 10 mins session
      window.location.href = "PartySelection.html";
    } else {
      alert("❌Face Not Matched . Try Again!");
    }

  } catch (e) {
    console.error(e);
    alert("🚨 Could not connect to Python API. Ensure it is running.");
  }
}


// Cleanup camera on tab close/navigation
window.addEventListener("beforeunload", stopCamera);
