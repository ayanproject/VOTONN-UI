const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const capturedImage = document.getElementById("capturedImage");
const registrationForm = document.getElementById("registrationForm");
const statusMsg = document.getElementById("status");

let capturedBlob = null;

// 🔹 Start Webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert("Camera access denied!");
    console.error(err);
  });

// 🔹 Capture Image
captureBtn.addEventListener("click", () => {
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    capturedBlob = blob;
    capturedImage.src = URL.createObjectURL(blob);
  }, "image/jpeg");
});

// 🔹 Form Submit
// 🔹 Form Submit
registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!capturedBlob) {
    alert("Please capture your face before submitting!");
    return;
  }

  const voter = {
    name: document.getElementById("name").value,
    fatherName: document.getElementById("fatherName").value,
    gender: document.getElementById("gender").value,
    dob: document.getElementById("dob").value,
    voterId: document.getElementById("voterId").value,
    email: document.getElementById("email").value, // still included in voter JSON
    phone: document.getElementById("phone").value,
    secretPin: document.getElementById("secretPin").value
   
  };

  const formData = new FormData();
  formData.append("voter", new Blob([JSON.stringify(voter)], { type: "application/json" }));
  formData.append("userEmail", voter.email); // ✅ Required by backend
  formData.append("faceImage", capturedBlob, "face.jpg");

  try {
    const res = await fetch("http://localhost:8080/api/voters/register-with-face", {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      statusMsg.innerText = "✅ Registration successful for " + data.name;
      statusMsg.style.color = "green"; 
      localStorage.setItem("voterId", voter.voterId);
      localStorage.setItem("email", data.email);       // Save the email from the server response
      localStorage.setItem("name", data.name);

      const expiry = Date.now() + (60 * 60 * 1000);
      localStorage.setItem("expiryTime", expiry);
      // alert("Registration successful! Proceed to select a party.");
      // window.location.href = "partySelection.html"; // Or whatever your party selection page is
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

