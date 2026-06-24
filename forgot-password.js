// Base URL for your Spring Boot Backend
const API_BASE_URL = '/api/forgot-password';

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof checkAuth === "function") {
        await checkAuth();
    }
});

// State to hold the user's email across steps
let userEmail = '';

// Step 1: Send OTP
async function handleSendOtp(event) {
    event.preventDefault();
    const emailInput = document.getElementById('resetEmail').value;
    const errorSpan = document.getElementById('emailError');
    const btnText = document.querySelector('#btnSendOtp .btn-text');

    errorSpan.innerText = "";
    btnText.innerText = "Sending...";

    try {
        const response = await fetch(`${API_BASE_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput })
        });

        // Read the exact error message text from the backend
        const responseText = await response.text();

        if (response.ok) {
            userEmail = emailInput;
            document.getElementById('displayEmail').innerText = userEmail;
            
            document.getElementById('stepEmail').style.display = 'none';
            document.getElementById('stepOtp').style.display = 'block';
        } else {
            // Show the exact message returned by your Spring Boot Controller
            errorSpan.innerText = responseText || "Invalid request.";
        }
    } catch (error) {
        console.error("Error:", error);
        errorSpan.innerText = "Server error. Please try again later.";
    } finally {
        btnText.innerText = "Send OTP";
    }
}
// Step 2: Verify OTP
async function handleVerifyOtp(event) {
    event.preventDefault();
    const otpInput = document.getElementById('resetOtp').value;
    const errorSpan = document.getElementById('otpError');
    const btnText = document.querySelector('#btnVerifyOtp .btn-text');

    errorSpan.innerText = "";
    btnText.innerText = "Verifying...";

    try {
        // Make call to Spring Boot
        const response = await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, otp: otpInput })
        });

        if (response.ok) {
            // Success: hide Step 2, show Step 3
            document.getElementById('stepOtp').style.display = 'none';
            document.getElementById('stepNewPassword').style.display = 'block';
        } else {
            errorSpan.innerText = "Invalid or expired code.";
        }
    } catch (error) {
        console.error("Error:", error);
        errorSpan.innerText = "Server error. Please try again later.";
    } finally {
        btnText.innerText = "Verify Code";
    }
}

// Step 3: Reset Password
async function handleResetPassword(event) {
    event.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorSpan = document.getElementById('passwordError');
    const btnText = document.querySelector('#btnResetPassword .btn-text');

    errorSpan.innerText = "";

    // Basic frontend validation
    if (newPassword !== confirmPassword) {
        errorSpan.innerText = "Passwords do not match.";
        return;
    }

    btnText.innerText = "Updating...";

    try {
        // Make call to Spring Boot
        const response = await fetch(`${API_BASE_URL}/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, newPassword: newPassword })
        });

        if (response.ok) {
            // Success: redirect to login page
            alert("Password successfully updated! Please log in.");
            window.location.href = "index.html";
        } else {
            errorSpan.innerText = "Failed to update password. Try again.";
        }
    } catch (error) {
        console.error("Error:", error);
        errorSpan.innerText = "Server error. Please try again later.";
    } finally {
        btnText.innerText = "Update Password";
    }
}