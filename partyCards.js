document.addEventListener("DOMContentLoaded", () => {
  const expiryTime = localStorage.getItem("expiryTime");

  if (!expiryTime || Date.now() > parseInt(expiryTime)) {
    alert("Session expired. Please login again.");
    localStorage.clear();
    window.location.href = "index.html";
  }
});

const params = new URLSearchParams(window.location.search);
const partyName = params.get("party");

// ------------------ LOAD PARTY DETAILS -----------------------
async function loadPartyDetails() {
  try {
    const response = await fetch(`https://votonn-backend-eggwcgcpaueaatfy.southeastasia-01.azurewebsites.net/api/party?partyName=${partyName}`);
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
        . <div class="info-section">
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
    window.location.href = "index.html";
    return;
  }

  try {
    const sendOtpRes = await fetch("https://votonn-backend-eggwcgcpaueaatfy.southeastasia-01.azurewebsites.net/api/voters/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId, email, name }),
    });

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

  try {
    const verifyRes = await fetch("https://votonn-backend-eggwcgcpaueaatfy.southeastasia-01.azurewebsites.net/api/voters/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, voterId, name }),
    });

    if (verifyRes.ok) {
      alert("OTP verified successfully! Submitting your vote...");

      const voteRes = await fetch("https://votonn-backend-eggwcgcpaueaatfy.southeastasia-01.azurewebsites.net/api/voter/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, partyName, email }),
      });

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

// ------------------ OTP MODAL FUNCTIONS -----------------------
function showOtpModal() {
  document.getElementById("otpModal").style.display = "block";
  document.getElementById("otpInput").value = "";
  document.getElementById("otpInput").focus(); // ✅ 's' has been removed
}

function closeOtpModal() {
  document.getElementById("otpModal").style.display = "none";
}

window.onload = loadPartyDetails;
