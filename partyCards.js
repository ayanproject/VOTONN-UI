// =================================================================
// == partyCards.js (UPDATED)
// == Assumes auth.js is included in the HTML
// =================================================================

// 1. Check for authentication as soon as the page loads
// This replaces your old expiryTime check
document.addEventListener("DOMContentLoaded", checkAuth);

const params = new URLSearchParams(window.location.search);
const partyName = params.get("party");

// ------------------ LOAD PARTY DETAILS -----------------------
async function loadPartyDetails() {
  try {
    // This is a PUBLIC endpoint, so no auth header is needed.
    const response = await fetch(`${API_BASE_URL}/api/party?partyName=${partyName}`);
    if (response.ok) {
      const party = await response.json();
      const html = `
        <div class="card-container">
          <div class="leader-section">
            <img src="partySelection/${party.leaderUrl}" alt="${party.leader}" class="leader-image">
          </div>
          <div class="party-section">
            <img src="partySelection/${party.leaderUrl}" alt="${party.partyName}" class="party-image">
            <div class="party-name">${party.partyName}</div>
          </div>
          <div class="info-section">
            <div><strong>Leader:</strong> ${party.leader}</div>
            <div><strong>Description:</strong> ${party.description}</div>
            <div><strong>Mission:</strong> ${party.mission}</div>
            <div><strong>Vision:</strong> ${party.vision}</div>
          </div>
        </div>
      `;
      document.getElementById("partyDetailsCard").innerHTML = html;
    } else {
      document.getElementById("partyDetailsCard").innerHTML = "<p>No details found.</p>";
    }
  } catch (error) {
    console.error("Error fetching party details:", error);
    document.getElementById("partyDetailsCard").innerHTML = "<p>Error loading data.</p>";
  }
}

function goBack() {
  window.history.back();
}

// ------------------ OTP + VOTE LOGIC -----------------------

async function handleVoteProcess() {
  const voterId = localStorage.getItem("voterId");
  const email = localStorage.getItem("email");
  const name = localStorage.getItem("name");

  if (!voterId || !email) {
    alert("Session error: Missing voter ID or email. Please log in again.");
    window.location.href = LOGIN_PAGE;
    return;
  }

  // 2. Get auth headers
  const authHeaders = createAuthHeaders();
  authHeaders.append("Content-Type", "application/json");

  try {
    const sendOtpRes = await fetch(`${API_BASE_URL}/api/voters/verify`, {
      method: "POST",
      headers: authHeaders, // 3. Add auth headers
      body: JSON.stringify({ voterId, email, name }),
    });

    handleAuthError(sendOtpRes); // 4. Handle auth errors

    if (sendOtpRes.ok) {
      alert("OTP has been sent to your registered email.");
      showOtpModal();
    } else {
      const err = await sendOtpRes.text();
      alert("Failed to send OTP: " + err);
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    alert("Error sending OTP. Please try again.");
  }
}

async function verifyOtpBeforeSubmit() {
  const otp = document.getElementById("otpInput").value.trim();
  const voterId = localStorage.getItem("voterId");
  const email = localStorage.getItem("email");
  const name = localStorage.getItem("name");

  if (!otp) {
    alert("Please enter OTP.");
    return;
  }
  
  const authHeaders = createAuthHeaders();
  authHeaders.append("Content-Type", "application/json");

  try {
    // === Verify OTP (Protected) ===
    const verifyRes = await fetch(`${API_BASE_URL}/api/voters/verify-otp`, {
      method: "POST",
      headers: authHeaders, // Add auth headers
      body: JSON.stringify({ email, otp, voterId, name }),
    });

    handleAuthError(verifyRes);

    if (verifyRes.ok) {
      alert("OTP verified successfully! Submitting your vote...");

      // === Submit Vote (Protected) ===
      const voteRes = await fetch(`${API_BASE_URL}/api/voter/submit-vote`, {
        method: "POST",
        headers: authHeaders, // Add auth headers
        body: JSON.stringify({ voterId, partyName, email }),
      });

      handleAuthError(voteRes);

      if (voteRes.ok) {
        const msg = await voteRes.text();
        closeOtpModal();
        alert(msg);
        window.location.href = "thankyou.html";
      } else {
        const err = await voteRes.text();
        alert("Vote submission failed: " + err);
      }
    } else {
      const err = await verifyRes.text();
      alert("OTP verification failed: " + err);
    }
  } catch (error) {
    console.error("Error verifying OTP or submitting vote:", error);
    alert("Something went wrong. Please try again.");
  }
}

// ... (rest of your modal functions are fine) ...
function showOtpModal() {
  document.getElementById("otpModal").style.display = "block";
  document.getElementById("otpInput").value = "";
  document.getElementById("otpInput").focus();
}

function closeOtpModal() {
  document.getElementById("otpModal").style.display = "none";
}

// Load party details when the page loads
window.onload = loadPartyDetails;