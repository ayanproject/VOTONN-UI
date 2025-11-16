// =================================================================
// == registration.js (UPDATED)
// == Assumes auth.js is included in the HTML
// =================================================================

// 1. Check for authentication as soon as the page loads
document.addEventListener("DOMContentLoaded", checkAuth);

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const capturedImage = document.getElementById("capturedImage");
const registrationForm = document.getElementById("registrationForm");
const statusMsg = document.getElementById("status");

let capturedBlob = null;

// 🔹 Start Webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    alert("Camera access denied!");
    console.error(err);
  });

// 🔹 Capture Image
captureBtn.addEventListener("click", () => {
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    capturedBlob = blob;
    capturedImage.src = URL.createObjectURL(blob);
  }, "image/jpeg");
});

// 🔹 Form Submit
registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!capturedBlob) {
    alert("Please capture your face before submitting!");
    return;
  }
  
  // 2. Get the auth headers
  const authHeaders = createAuthHeaders();
  if (!authHeaders.has("Authorization")) {
      logout(); // Failsafe, though checkAuth() should have caught this
      return;
  }

  const voter = {
    name: document.getElementById("name").value,
    fatherName: document.getElementById("fatherName").value,
    gender: document.getElementById("gender").value,
    dob: document.getElementById("dob").value,
    voterId: document.getElementById("voterId").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    secretPin: document.getElementById("secretPin").value,
  };

  const formData = new FormData();
  formData.append("voter", new Blob([JSON.stringify(voter)], { type: "application/json" }));
  formData.append("userEmail", voter.email);
  formData.append("faceImage", capturedBlob, "face.jpg");

  try {
    const res = await fetch(`${API_BASE_URL}/api/voters/register-with-face`, {
      method: "POST",
      // 3. Add the Authorization header
      // DO NOT set Content-Type, browser does it for FormData
      headers: authHeaders, 
      body: formData,
    });

    // 4. Handle auth errors
    handleAuthError(res); 

    if (res.ok) {
      const data = await res.json();
      statusMsg.innerText = "✅ Registration successful for " + data.name;
      statusMsg.style.color = "green";
      localStorage.setItem("voterId", voter.voterId);
      localStorage.setItem("email", data.email);
      localStorage.setItem("name", data.name);

      const expiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("expiryTime", expiry);
    } else {
      const errText = await res.text();
      statusMsg.innerText = "❌ Registration failed: " + errText;
      statusMsg.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    statusMsg.innerText = "⚠️ Error connecting to server!";
    statusMsg.style.color = "red";
  }
});