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
        phone: document.getElementById("phone").value,
        gender: document.getElementById("gender").value,
        role: document.getElementById("role").value.toUpperCase()
      };
      
       try {
        //console.log('${process.env.USER_REGISTER}')
        const response = await fetch('https://votonn-backend-eggwcgcpaueaatfy.southeastasia-01.azurewebsites.net/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (response.ok) {
            sessionStorage.setItem('email', email);
            sessionStorage.setItem('password', password);
            const message = await response.text();
            alert(message); // Show success message
            window.location.href = 'heroSection.html'
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
    headers.append('Authorization', 'Basic ' + btoa(email + ':' + password));
    headers.append('Content-Type', 'application/json');

    try {
      const response = await fetch("https://votonn-backend-eggwcgcpaueaatfy.southeastasia-01.azurewebsites.net/api/login", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${email}:${password}`),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Invalid credentials");
      }

      sessionStorage.setItem("email", email);
      sessionStorage.setItem("isLoggedIn", "true");

      alert("Login successful!");
      window.location.href = "heroSection.html";

    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please try again.");
    }

  });
}

});