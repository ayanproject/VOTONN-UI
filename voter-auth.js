const voterForm = document.getElementById('voter-form');
const otpSection = document.getElementById('otp-section');
const verifyOtpBtn = document.getElementById('verify-otp');
const message = document.getElementById('message');

let voterData = {};

// Handle form submission
voterForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect form data
  voterData = {
    name: document.getElementById('name').value.trim(),
    fatherName: document.getElementById('fatherName').value.trim(),
    gender: document.getElementById('gender').value.trim(),
    dob: document.getElementById('dob').value,
    voterId: document.getElementById('voterId').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim()
  };

  // Validate input
  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  

  try {
    const response = await fetch('http://localhost:8080/api/voter/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voterData)
    });

    const result = await response.text();

    // Handle duplicate voter ID
    if (response.status === 409) {
      message.textContent = "This Voter ID is already registered. Please use a unique Voter ID.";
      return;
    }

    message.textContent = result;

    // Show OTP section on success
    if (response.ok) {
      otpSection.style.display = 'flex';
    }
  } catch (error) {
    message.textContent = 'Server error while verifying voter.';
    console.error(error);
  }
});

// Handle OTP verification
verifyOtpBtn.addEventListener('click', async () => {
  const otp = document.getElementById('otp').value.trim();

  if (!otp) {
    message.textContent = "Please enter OTP.";
    return;
  }

  try {
    const response = await fetch('http://localhost:8080/api/voter/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: voterData.email,
        otp: otp,
        voterId: voterData.voterId,
        name: voterData.name
      })
    });

    const result = await response.text();
    message.textContent = result;

    if (response.ok) {
      setTimeout(() => {
        sessionStorage.setItem('voterId', voterData.voterId);
        window.location.href = 'partySelection.html';
      }, 1500);
    }
  } catch (error) {
    message.textContent = 'Error verifying OTP.';
    console.error(error);
  }
});
