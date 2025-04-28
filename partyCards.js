 document.addEventListener("DOMContentLoaded", () => {
  const expiryTime = localStorage.getItem('expiryTime');

  if (!expiryTime || Date.now() > parseInt(expiryTime)) {
    // Session expired
    alert('Session expired. Please login again.');
    localStorage.clear();
    window.location.href = 'index.html'; // Redirect to login page
  } else {
    // Optional: Refresh expiry time if you want "sliding session" (reset timeout on activity)
    // Not asked, so keeping simple
  }
});


const params = new URLSearchParams(window.location.search);
const partyName = params.get('party');
 console.log(partyName);
 
async function loadPartyDetails() {
    try {
        const response = await fetch(`http://localhost:8080/api/party?partyName=${partyName}`);
        if (response.ok) {
            const party = await response.json();
            const html = `
              <div class="card-container">
              <div class="leader-section">
                <img src="partySelection/${party.leaderUrl}" alt="${party.leader}" class="leader-image">
              </div>
              <div class="party-section">
                <img src="partySelection/${party.partyUrl}" alt="${party.partyName}" class="party-image">
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
        }
        else {
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

async function submitVote() {

    try {
        const response = await fetch("http://localhost:8080/api/voter/submit-vote", {
            body: JSON.stringify({
                partyName: partyName,
                voterId: sessionStorage.getItem("voterId")
            }),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if(response.ok) {
            const message = await response.text();
            alert(message);
            window.location.href = "thankyou.html";
        }
       
   } catch (error) {
        console.error("Error submitting vote:", error);
        alert("Error submitting vote. Please try again.");
    }
}

window.onload = loadPartyDetails;
