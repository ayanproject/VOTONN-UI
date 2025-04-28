// Signup Handler
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        age: document.getElementById("age").value,
        Phone: document.getElementById("phone").value,
        gender: document.getElementById("gender").value,
        role: document.getElementById("role").value.toUpperCase()
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
            alert(message); // Show success message
            window.location.href = 'index.html'
        } else {
            const errorMessage = await response.text();
            alert(`Email Already Exist: ${errorMessage}`); // Show error message
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration failed. Please try again later.');
    }
    });
  }

  // Login Handler
  // Login Handler
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const user = {
      email: email,
      password: password,
    };

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    try {
      const response = await fetch('http://localhost:8080/api/Login', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(user)
      });

      if (response.ok) {
        // Save login details and expiry timestamp
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);
        const expiryTime = Date.now() + 2.5 * 60 * 1000; // 2.5 minutes from now
        localStorage.setItem('expiryTime', expiryTime);

        alert('Login successful');
        window.location.href = 'voter-auth.html';
      } else {
        const errorMessage = await response.text();
        alert(`Login failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please try again later.');
    }
  });
}


});