document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const preview = document.getElementById("preview");
  let capturedImage = null;

  // Start webcam
  if (video) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
      })
      .catch(err => console.error("Error accessing webcam:", err));
  }

  // Capture image
  const captureBtn = document.getElementById("captureBtn");
  if (captureBtn) {
    captureBtn.addEventListener("click", () => {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      capturedImage = canvas.toDataURL("image/png"); // Base64 string
      preview.src = capturedImage;
      preview.style.display = "block";
    });
  }

  // Signup form submit
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!capturedImage) {
        alert("Please capture your face before registering!");
        return;
      }

      const user = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        age: document.getElementById("age").value,
        phone: document.getElementById("phone").value,
        gender: document.getElementById("gender").value,
        role: document.getElementById("role").value.toUpperCase(),
        faceImage: capturedImage   // Send Base64 image to backend
      };

      try {
        const response = await fetch('http://localhost:8080/api/Register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        });

        if (response.ok) {
          const message = await response.text();
          alert(message);
          window.location.href = 'index.html';
        } else {
          const errorMessage = await response.text();
          alert(`Email Already Exist: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration failed. Please try again later.');
      }
    });
  }
});
