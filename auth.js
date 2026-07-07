// =================================================================
// == AUTH HELPER (auth.js)
// == This file manages your JWT token securely in memory.
// == Include it on ALL your pages.
// =================================================================
// Automatically detect environment: use local port 8080 if running on localhost/127.0.0.1 or from file system,
// otherwise use empty string so that Netlify routes go through netlify.toml proxy redirects.
const API_BASE_URL = window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1" || 
                     window.location.protocol === "file:"
  ? "http://localhost:8080"
  : "";

const LOGIN_PAGE = "index.html";
const SIGNUP_PAGE = "signupIndex.html";
const FORGOT_PASSWORD_PAGE = "forgot-password.html";
const DEFAULT_AUTHED_PAGE = "heroSection.html";

// IN-MEMORY TOKEN STORAGE (Protects against XSS)
let inMemoryToken = null;

function saveToken(token) {
  inMemoryToken = token;
}

function getToken() {
  return inMemoryToken;
}

function removeToken() {
  inMemoryToken = null;
}

/**
 * Attempts to silently refresh the access token using the HttpOnly cookie.
 */
async function silentRefresh() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Ensures HttpOnly cookie is sent
    });

    if (response.ok) {
      const data = await response.json();
      saveToken(data.token);
      return true;
    }
  } catch (error) {
    console.error("Silent refresh failed", error);
  }
  return false;
}

async function logout() {
  removeToken();
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.error("Logout request failed", e);
  }
  window.location.href = LOGIN_PAGE;
}

/**
 * Checks if a user is authenticated. 
 * Redirects unauthenticated users to login, and authenticated users away from login/register pages.
 */
async function checkAuth() {
  let token = getToken();
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isAuthPage = currentPage === LOGIN_PAGE || 
                     currentPage === FORGOT_PASSWORD_PAGE;

  // If no token in memory, try to refresh
  if (!token) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      token = getToken();
    }
  }

  if (!token) {
    // Unauthenticated
    if (!isAuthPage) {
      console.warn("No auth token found. Redirecting to login.");
      window.location.href = LOGIN_PAGE;
    }
  } else {
    // Authenticated
    if (isAuthPage) {
      console.log("Already authenticated. Redirecting away from auth page.");
      const role = localStorage.getItem("userRole") || "USER";
      if (role === "ADMIN") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "heroSection.html";
      }
    }
  }
}

/**
 * Creates the Authorization header for API calls.
 */
function createAuthHeaders() {
  const headers = new Headers();
  const token = getToken();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  return headers;
}

/**
 * A helper to wrap fetch calls. Automatically handles 401s by refreshing the token and retrying.
 */
async function apiFetch(url, options = {}) {
  // Ensure credentials are included so cookies are sent (important for refresh)
  options.credentials = 'include';

  if (!options.headers) {
    options.headers = new Headers();
  }

  const token = getToken();
  if (token) {
    if (options.headers instanceof Headers) {
      options.headers.set('Authorization', `Bearer ${token}`);
    } else {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const targetUrl = url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `${API_BASE_URL}${url}`;

  let response = await fetch(targetUrl, options);

  // If 401 Unauthorized, try to refresh the token and retry once
  if (response.status === 401) {
    console.warn("401 Unauthorized. Attempting to refresh token...");
    const refreshed = await silentRefresh();

    if (refreshed) {
      const newToken = getToken();
      if (options.headers instanceof Headers) {
        options.headers.set('Authorization', `Bearer ${newToken}`);
      } else {
        options.headers['Authorization'] = `Bearer ${newToken}`;
      }
      // Retry original request
      response = await fetch(targetUrl, options);
    } else {
      logout(); // Refresh failed, log out
    }
  }

  return response;
}

// Ensure handleAuthError just logs out if explicitly called, though apiFetch handles it now
function handleAuthError(response) {
  if (response.status === 401 || response.status === 403) {
    logout();
  }
}