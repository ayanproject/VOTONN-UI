// =================================================================
// == script.js (UPDATED)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Signup Handler
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        age: document.getElementById("age").value,
        phone: document.getElementById("phone").value,
        gender: document.getElementById("gender").value,
        role: document.getElementById("role").value.toUpperCase(),
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        });

        if (response.ok) {
          const message = await response.text();
          alert(message + ". Please log in to continue."); // Show success
          
          // DANGER: DO NOT store email or password in session/local storage.
          // We removed those lines.
          
          window.location.href = LOGIN_PAGE; // Redirect to login page
        } else {
          // Get the JSON error from our GlobalExceptionHandler
          const errorData = await response.json();
          alert(`Registration Failed: ${errorData.message}`); // Show specific error
        }
      } catch (error) {
        console.error("Error during registration:", error);
        alert("Registration failed. Please try again later.");
      }
    });
  }

  // Login Handler
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: "POST",
          headers: {
            // We DO NOT send Basic Auth. We send a JSON body.
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Invalid credentials");
        }

        // === THIS IS THE JWT LOGIC ===
        // 1. Get the JSON response which contains the token
        const data = await response.json();

        // 2. Save the token using our auth helper
        saveToken(data.token);

        alert("Login successful!");
        window.location.href = "heroSection.html";
        
      } catch (err) {
        console.error("Login error:", err);
        alert(`Login failed: ${err.message}`);
      }
    });
  }
});