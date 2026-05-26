// =================================================================
// == AUTH HELPER (auth.js)
// == This new file manages your JWT token.
// == Include it on ALL your pages.
// =================================================================
//http://localhost:8080
const API_BASE_URL = "https://votonnbackend-a6bgdyfedqfmhqha.southeastasia-01.azurewebsites.net";

const LOGIN_PAGE = "index.html"; // Change this if your login page is named differently

/**
 * Saves the JWT token to Local Storage.
 * @param {string} token The JWT token from the server.
 */
function saveToken(token) {
  localStorage.setItem("jwtToken", token);
}

/**
 * Retrieves the JWT token from Local Storage.
 * @returns {string | null} The stored token, or null if not found.
 */
function getToken() {
  return localStorage.getItem("jwtToken");
}

/**
 * Deletes the JWT token from Local Storage.
 */
function removeToken() {
  localStorage.removeItem("jwtToken");
}

/**
 * Logs the user out by clearing the token and redirecting to the login page.
 */
function logout() {
  removeToken();
  alert("Your session has expired or you have been logged out. Please log in again.");
  window.location.href = LOGIN_PAGE;
}

/**
 * Checks if a user is authenticated. If not, redirects to the login page.
 * Call this at the top of any protected page.
 */
function checkAuth() {
  const token = getToken();
  if (!token) {
    console.warn("No auth token found. Redirecting to login.");
    logout();
  }
}

/**
 * Creates the Authorization header for API calls.
 * @returns {Headers} A Headers object with the Authorization token.
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
 * A helper to automatically handle 401/403 errors.
 * @param {Response} response The fetch response object.
 */
function handleAuthError(response) {
  if (response.status === 401 || response.status === 403) {
    logout();
  }
}