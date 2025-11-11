const voterForm = document.getElementById("voter-form");
const otpSection = document.getElementById("otp-section");
const faceSection = document.getElementById("face-section");
const message = document.getElementById("message");

let voterData = null;

// Step 1: Start Camera Immediately
window.onload = () => {
  startCamera();
};

function startCamera() {
  const camera = document.getElementById("camera");
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { camera.srcObject = stream; })
    .catch(err => { console.error("Camera access denied:", err); });
}

// Step 2: Capture & Verify Face
document.getElementById("capture-face").addEventListener("click", async () => {
  const camera = document.getElementById("camera");
  const snapshot = document.getElementById("snapshot");
  const ctx = snapshot.getContext("2d");
  ctx.drawImage(camera, 0, 0, snapshot.width, snapshot.height);
  const imageData = snapshot.toDataURL("image/png");

  try {
    const response = await fetch("http://localhost:8080/api/voter/verify-face", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData })
    });

    const result = await response.text();
    message.textContent = result;

    if (response.ok) {
      faceSection.style.display = "none"; // hide face check
      voterForm.style.display = "block";  // show voter card form
    }
  } catch (error) {
    message.textContent = "Error verifying face.";
    console.error(error);
  }
});

// Step 3: Verify Voter (Card Validation)
voterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const voterId = document.getElementById("voterId").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;

  try {
    const response = await fetch("http://localhost:8080/api/voter/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId, email, phone })
    });

    const result = await response.text();
    message.textContent = result;

    if (response.ok) {
      voterData = { voterId, email, phone };
      otpSection.style.display = "flex";
    }
  } catch (error) {
    message.textContent = "Error verifying voter.";
    console.error(error);
  }
});

// Step 4: Verify OTP
document.getElementById("verify-otp").addEventListener("click", async () => {
  const otp = document.getElementById("otp").value;

  try {
    const response = await fetch("http://localhost:8080/api/voter/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: voterData.voterId, otp })
    });

    const result = await response.text();
    message.textContent = result;

    if (response.ok) {
      setTimeout(() => {
        sessionStorage.setItem("voterId", voterData.voterId);
        window.location.href = "partySelection.html";
      }, 1500);
    }
  } catch (error) {
    message.textContent = "Error verifying OTP.";
    console.error(error);
  }
});
