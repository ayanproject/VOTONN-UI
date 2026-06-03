// ════════════════════════════════════════════════════════════════════════════
//  admin-script.js — VOTONN Live Backend Data Integration
// ════════════════════════════════════════════════════════════════════════════

const API_BASE = "http://localhost:8080/api";

// Core State Engine to manage memory data structures for live filtering/search
let state = {
    deletions: [],
    corrections: [],
    voters: []
};

// Global Tracker for view modal operations
let currentReqId = '';

// ── Lifecycle Initialization ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("🔒 Unauthorized access profile. Re-routing to entry verification.");
        window.location.href = "index.html";
        return;
    }

    // Set active admin profile email if saved during auth step
    const savedEmail = localStorage.getItem("adminEmail");
    if (savedEmail) {
        document.querySelector(".admin-info span").textContent = savedEmail;
    }

    // Parallel fetch initialization pipeline
    refreshDashboardData();
});

async function refreshDashboardData() {
    await Promise.all([
        fetchPendingDeletions(),
        fetchPendingCorrections(),
        fetchVoterRegistry()
    ]);
    updateOverviewStats();
}

// ── Data Acquisition Layer (Spring Boot Extraction) ───────────────────────

async function fetchPendingDeletions() {
    try {
        const res = await fetch(`${API_BASE}/deletion/pending`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
            state.deletions = await res.json();
            renderDeletionTable(state.deletions);
        }
    } catch (err) {
        console.error("Error collecting deletion pipeline metadata:", err);
    }
}

async function fetchPendingCorrections() {
    try {
        const res = await fetch(`${API_BASE}/correction/pending`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
            state.corrections = await res.json();
            renderCorrectionTable(state.corrections);
        }
    } catch (err) {
        console.error("Error collecting correction pipeline metadata:", err);
    }
}

async function fetchVoterRegistry() {
    try {
        const res = await fetch(`${API_BASE}/voters`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
            state.voters = await res.json();
            renderVoterTable(state.voters);
        }
    } catch (err) {
        console.error("Error synchronizing central voter registry:", err);
    }
}

// ── Rendering Pipelines (Dynamic DOM Generators) ──────────────────────────

function renderDeletionTable(data) {
    const tbody = document.querySelector("#delTable tbody");
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted)">No deletion requests logged.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(req => `
        <tr data-status="${req.status || 'PENDING'}">
            <td style="color:var(--accent); font-weight:600">DEL-${req.id}</td>
            <td>${req.fullName || req.name}</td>
            <td class="td-muted">${req.voterId}</td>
            <td class="td-muted">${req.submittedDate || 'Recent'}</td>
            <td><span class="badge-status badge-${(req.status || 'PENDING').toLowerCase()}">${req.status || 'Pending'}</span></td>
            <td>
                <button class="act-btn act-view" onclick="viewDeletion(${req.id})">View</button>
                ${(req.status || 'PENDING') === 'PENDING' ? `
                    <button class="act-btn act-approve" onclick="actionRequest(${req.id}, 'approve', 'del')">Approve</button>
                    <button class="act-btn act-reject" onclick="actionRequest(${req.id}, 'reject', 'del')">Reject</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function renderCorrectionTable(data) {
    const tbody = document.querySelector("#corrTable tbody");
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--muted)">No correction requests logged.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(req => `
        <tr data-status="${req.status || 'PENDING'}">
            <td style="color:var(--orange); font-weight:600">COR-${req.id}</td>
            <td>${req.voterName || 'Registered Voter'}</td>
            <td class="td-muted">${req.voterId}</td>
            <td><span style="color:var(--accent); font-size:12px">${req.fieldToCorrect}</span></td>
            <td class="td-muted">${req.submittedDate || 'Recent'}</td>
            <td><span class="badge-status badge-${(req.status || 'PENDING').toLowerCase()}">${req.status || 'Pending'}</span></td>
            <td>
                <button class="act-btn act-view" onclick="viewCorrection(${req.id})">View</button>
                ${(req.status || 'PENDING') === 'PENDING' ? `
                    <button class="act-btn act-approve" onclick="actionRequest(${req.id}, 'approve', 'corr')">Approve</button>
                    <button class="act-btn act-reject" onclick="actionRequest(${req.id}, 'reject', 'corr')">Reject</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function renderVoterTable(data) {
    const tbody = document.querySelector("#voterTable tbody");
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted)">Registry empty.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(voter => `
        <tr>
            <td style="color:var(--accent); font-weight:600">${voter.voterId || ('VID-' + voter.id)}</td>
            <td>${voter.name || 'N/A'}</td>
            <td class="td-muted">${voter.email || 'N/A'}</td>
            <td class="td-muted">${voter.dob || 'N/A'}</td>
            <td><span class="badge-status badge-approved">Yes</span></td>
            <td class="td-muted">${voter.createdOn || 'Active'}</td>
        </tr>
    `).join('');
}

// ── Overview Summary Aggregation Module ────────────────────────────────────

function updateOverviewStats() {
    const pendingDelCount = state.deletions.filter(r => (r.status || 'PENDING') === 'PENDING').length;
    const pendingCorrCount = state.corrections.filter(r => (r.status || 'PENDING') === 'PENDING').length;

    // Sidebar indicators sync
    document.getElementById('delCount').textContent = pendingDelCount;
    document.getElementById('corrCount').textContent = pendingCorrCount;
    document.getElementById('delCount').style.display = pendingDelCount ? 'inline-block' : 'none';
    document.getElementById('corrCount').style.display = pendingCorrCount ? 'inline-block' : 'none';

    // Top statistical counters layout patch
    const statCardsValues = document.querySelectorAll('.s-val');
    if (statCardsValues.length >= 4) {
        statCardsValues[0].textContent = state.voters.length.toLocaleString('en-IN');
        statCardsValues[2].textContent = pendingCorrCount;
        statCardsValues[3].textContent = pendingDelCount;
    }
}

// ── Deep Verification Modal Bindings ─────────────────────────────────────

function viewDeletion(id) {
    currentReqId = id;
    const req = state.deletions.find(r => r.id === id);
    if (!req) return;

    document.getElementById('delModalBody').innerHTML = `
        <div class="detail-row"><span class="detail-label">Request ID</span><span class="detail-val" style="color:var(--accent)">DEL-${req.id}</span></div>
        <div class="detail-row"><span class="detail-label">Voter Name</span><span class="detail-val">${req.fullName || req.name}</span></div>
        <div class="detail-row"><span class="detail-label">Voter ID</span><span class="detail-val">${req.voterId}</span></div>
        <div class="detail-row"><span class="detail-label">Father's Name</span><span class="detail-val">${req.fatherName || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">Document Path</span><span class="detail-val"><a href="${req.certificateUrl || '#'}" target="_blank" style="color:var(--accent); text-decoration:none;">📎 view_death_certificate.pdf</a></span></div>
    `;
    document.getElementById('delModal').classList.add('open');
}

function viewCorrection(id) {
    currentReqId = id;
    const req = state.corrections.find(r => r.id === id);
    if (!req) return;

    document.getElementById('corrModalBody').innerHTML = `
        <div class="detail-row"><span class="detail-label">Request ID</span><span class="detail-val" style="color:var(--orange)">COR-${req.id}</span></div>
        <div class="detail-row"><span class="detail-label">Voter ID</span><span class="detail-val">${req.voterId}</span></div>
        <div class="detail-row"><span class="detail-label">Target Field</span><span class="detail-val" style="color:var(--accent)">${req.fieldToCorrect}</span></div>
        <div class="detail-row"><span class="detail-label">Staged Current State</span><span class="detail-val">${req.currentValue}</span></div>
        <div class="detail-row"><span class="detail-label">Requested Mutation</span><span class="detail-val" style="color:var(--green)">${req.newValue}</span></div>
        <div class="detail-row"><span class="detail-label">Legal Reference Attachment</span><span class="detail-val"><a href="${req.documentUrl || '#'}" target="_blank" style="color:var(--accent); text-decoration:none;">📎 view_supporting_document.pdf</a></span></div>
    `;
    document.getElementById('corrModal').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// ── Dynamic Search Extraction Filtering Filters ──────────────────────────

function filterTable(tableId, query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#' + tableId + ' tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

function filterStatus(tableId, status, btn) {
    btn.closest('.table-toolbar').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#' + tableId + ' tbody tr').forEach(tr => {
        tr.style.display = (status === 'all' || tr.dataset.status === status) ? '' : 'none';
    });
}

// ── Structural Pipeline Modification Actions (POST Form Handlers) ────────

function actionRequest(id, action, type) {
    const isApprove = action === 'approve';
    document.getElementById('confirmTitle').textContent = isApprove ? '✅ Confirm Approval' : '❌ Confirm Rejection';
    document.getElementById('confirmMsg').textContent = `Commit systemic assessment execution for operational transaction reference ID: ${type.toUpperCase()}-${id}?`;
    document.getElementById('confirmOkBtn').textContent = isApprove ? 'Yes, Execute' : 'Yes, Reject';
    document.getElementById('confirmOkBtn').className = isApprove ? 'btn btn--solid' : 'btn btn--red';

    document.getElementById('confirmOkBtn').onclick = async () => {
        closeModal('confirmModal');
        await submitResolutionToBackend(id, action, type);
    };
    document.getElementById('confirmModal').classList.add('open');
}

async function submitResolutionToBackend(id, action, type) {
    const targetRoute = type === 'del' ? 'deletion' : 'correction';
    try {
        const response = await fetch(`${API_BASE}/${targetRoute}/${id}/resolve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ action: action.toUpperCase() })
        });

        if (response.ok) {
            toast(`✅ Data entry point updated to match decision context: ${action.toUpperCase()}`, "success");
            refreshDashboardData(); // Re-trigger live table and counter synchronization
        } else {
            const data = await response.json();
            toast(`❌ Operation refused: ${data.message || 'Verification Error'}`, "error");
        }
    } catch (err) {
        toast("🚨 Unable to sync transaction payload downstream.", "error");
    }
}

// ── View Helper Mechanisms ──────────────────────────────────────────────────

function navigate(page, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    if (el) el.classList.add('active');

    if (page === 'results') {
        setTimeout(() => document.querySelectorAll('.bar-fill').forEach(b => b.classList.add('bar-fill--animate')), 100);
    }
}

function tick() {
    document.getElementById('liveTime').textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
tick(); setInterval(tick, 1000);

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

function logout() {
    if (confirm('Terminate secure command workspace application lifecycle session?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}