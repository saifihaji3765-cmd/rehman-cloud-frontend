import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — AUTH SERVICE
|--------------------------------------------------------------------------
| Enterprise Authentication API Layer
|
| Responsibilities:
| - Login
| - Registration
| - Current-session validation
| - Logout
| - OAuth redirects
| - Safe local user profile persistence
|
| SECURITY:
| - JWT/access token is NOT stored in localStorage.
| - Authentication is handled through the backend HttpOnly cookie.
| - Axios sends credentials through the centralized api client.
|
| ARCHITECTURE:
|
| UI
|  ↓
| Auth Service
|  ↓
| api.js
|  ↓
| Real Backend
|  ↓
| HttpOnly Session Cookie
|
| IMPORTANT:
| This service contains NO fake authentication,
| mock users, fake sessions, or fake API responses.
|--------------------------------------------------------------------------
*/


/* ==========================================================================
   CONSTANTS
========================================================================== */

const AUTH_PREFIX = "/api/auth";

const STORED_USER_KEY =
  "zyrions_user";


/* ==========================================================================
   INTERNAL HELPERS
========================================================================== */

/**
 * Return the centralized API base URL.
 *
 * We intentionally read this from the existing Axios instance instead
 * of creating another Axios client or duplicating API configuration.
 */
function getApiBaseUrl() {
  const baseURL =
    api?.defaults?.baseURL;

  if (
    typeof baseURL !== "string" ||
    !baseURL.trim()
  ) {
    throw new Error(
      "API base URL is not configured."
    );
  }

  return baseURL.replace(
    /\/+$/,
    ""
  );
}


/**
 * Normalize an email before sending it to the backend.
 *
 * This only performs safe client-side normalization.
 * Backend validation remains authoritative.
 */
function normalizeEmail(email) {
  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    throw new Error(
      "Email is required."
    );
  }

  return email.trim();
}


/**
 * Validate password before an unnecessary request.
 *
 * This does NOT enforce a backend password policy.
 * The backend remains the final authority.
 */
function validatePassword(password) {
  if (
    typeof password !== "string" ||
    !password
  ) {
    throw new Error(
      "Password is required."
    );
  }

  return password;
}


/**
 * Normalize a generic auth error without exposing
 * implementation details to the UI.
 *
 * The centralized api.js already preserves Axios errors
 * and supplies the backend/network status.
 */
function getAuthErrorMessage(
  error,
  fallbackMessage
) {
  const responseData =
    error?.response?.data;

  return (
    responseData?.message ||
    responseData?.error ||
    responseData?.detail ||
    error?.message ||
    fallbackMessage
  );
}


/**
 * Create a user-friendly authentication error
 * while preserving useful status/data information.
 */
function normalizeAuthError(
  error,
  fallbackMessage
) {
  const normalizedError =
    new Error(
      getAuthErrorMessage(
        error,
        fallbackMessage
      )
    );

  normalizedError.status =
    error?.response?.status ??
    error?.status ??
    null;

  normalizedError.code =
    responseDataCode(error);

  normalizedError.data =
    error?.response?.data ||
    error?.data ||
    null;

  return normalizedError;
}


/**
 * Safely read backend error code.
 */
function responseDataCode(error) {
  return (
    error?.response?.data?.code ||
    error?.code ||
    null
  );
}


/* ==========================================================================
   LOGIN
========================================================================== */

/**
 * POST /api/auth/login
 *
 * Backend is responsible for:
 * - Credential validation
 * - Authentication
 * - Creating the authenticated session
 * - Setting the HttpOnly cookie
 *
 * Frontend never stores the JWT/access token.
 */
export async function login(
  email,
  password
) {
  try {
    const normalizedEmail =
      normalizeEmail(email);

    const normalizedPassword =
      validatePassword(password);

    const response =
      await api.post(
        `${AUTH_PREFIX}/login`,
        {
          email:
            normalizedEmail,

          password:
            normalizedPassword,
        }
      );

    /*
     * The centralized api client already uses
     * withCredentials: true.
     *
     * Therefore the backend's HttpOnly cookie
     * is handled by the browser automatically.
     */

    return response?.data;
  } catch (error) {
    throw normalizeAuthError(
      error,
      "Unable to sign in. Please try again."
    );
  }
}


/* ==========================================================================
   REGISTER
========================================================================== */

/**
 * POST /api/auth/register
 *
 * Registration payload remains backend-defined.
 * We do not invent or transform unknown fields.
 */
export async function register(
  userData
) {
  try {
    if (
      !userData ||
      typeof userData !== "object" ||
      Array.isArray(userData)
    ) {
      throw new Error(
        "Registration data is required."
      );
    }

    const response =
      await api.post(
        `${AUTH_PREFIX}/register`,
        userData
      );

    return response?.data;
  } catch (error) {
    throw normalizeAuthError(
      error,
      "Unable to create your account. Please try again."
    );
  }
}


/* ==========================================================================
   CURRENT USER / SESSION
========================================================================== */

/**
 * GET /api/auth/me
 *
 * This is the authoritative authentication check.
 *
 * The frontend does NOT decide authentication
 * from localStorage.
 */
export async function getCurrentUser() {
  try {
    return await api.get(
      `${AUTH_PREFIX}/me`
    );
  } catch (error) {
    throw normalizeAuthError(
      error,
      "Unable to verify your session."
    );
  }
}


/* ==========================================================================
   LOGOUT
========================================================================== */

/**
 * POST /api/auth/logout
 *
 * Backend is responsible for invalidating/clearing
 * the authenticated HttpOnly session cookie.
 *
 * Local user profile information is cleared regardless
 * of the API result because it is only cached UI information.
 *
 * IMPORTANT:
 * We do not silently swallow unexpected logout failures.
 */
export async function logout() {
  let response = null;
  let logoutError = null;

  try {
    response =
      await api.post(
        `${AUTH_PREFIX}/logout`,
        {}
      );
  } catch (error) {
    logoutError =
      normalizeAuthError(
        error,
        "Unable to complete logout."
      );
  } finally {
    /*
     * This is only cached profile information.
     *
     * JWT/access tokens are never stored here.
     */
    clearStoredUser();
  }

  if (logoutError) {
    throw logoutError;
  }

  return response?.data;
}


/* ==========================================================================
   SAVE AUTH — BACKWARD COMPATIBILITY
========================================================================== */

/**
 * Compatibility helper for existing frontend callers.
 *
 * IMPORTANT:
 * `token` is intentionally ignored.
 *
 * Authentication token/session belongs to the backend
 * HttpOnly cookie and must never be persisted by JavaScript.
 *
 * Only non-sensitive user profile information may be cached.
 */
export function saveAuth(
  token,
  user
) {
  /*
   * Intentionally unused.
   *
   * Keeping the parameter preserves compatibility
   * with existing callers that may still invoke:
   *
   * saveAuth(token, user)
   */

  void token;

  if (
    !user ||
    typeof user !== "object"
  ) {
    return;
  }

  try {
    localStorage.setItem(
      STORED_USER_KEY,
      JSON.stringify(user)
    );
  } catch (error) {
    /*
     * localStorage is only a UI cache.
     *
     * Authentication itself remains server-side.
     */
    console.warn(
      "Unable to persist cached user profile:",
      error
    );
  }
}


/* ==========================================================================
   STORED USER
========================================================================== */

/**
 * Read cached user profile.
 *
 * This is NOT an authentication check.
 *
 * A user being present here does not mean the
 * backend session is valid.
 */
export function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem(
        STORED_USER_KEY
      );

    if (!storedUser) {
      return null;
    }

    return JSON.parse(
      storedUser
    );
  } catch (error) {
    console.warn(
      "Invalid cached user profile. Clearing local cache.",
      error
    );

    clearStoredUser();

    return null;
  }
}


/* ==========================================================================
   CLEAR STORED USER
========================================================================== */

/**
 * Remove only the cached profile.
 *
 * No authentication token is removed because
 * no authentication token is stored in localStorage.
 */
export function clearStoredUser() {
  try {
    localStorage.removeItem(
      STORED_USER_KEY
    );
  } catch (error) {
    console.warn(
      "Unable to clear cached user profile:",
      error
    );
  }
}


/* ==========================================================================
   AUTHENTICATION CHECK
========================================================================== */

/**
 * Verify authentication against the real backend.
 *
 * IMPORTANT:
 * Never use localStorage as the source of truth.
 */
export async function isAuthenticated() {
  try {
    const response =
      await getCurrentUser();

    return !!(
      response?.data?.success &&
      response?.data?.user
    );
  } catch {
    return false;
  }
}


/* ==========================================================================
   GOOGLE LOGIN
========================================================================== */

/**
 * Redirect to the real backend Google OAuth endpoint.
 *
 * The backend completes OAuth and establishes
 * the authenticated HttpOnly session.
 */
export function loginWithGoogle() {
  const apiBaseUrl =
    getApiBaseUrl();

  window.location.assign(
    `${apiBaseUrl}${AUTH_PREFIX}/google`
  );
}


/* ==========================================================================
   GITHUB LOGIN
========================================================================== */

/**
 * Redirect to the real backend GitHub OAuth endpoint.
 *
 * No token is processed or stored by the frontend.
 */
export function loginWithGithub() {
  const apiBaseUrl =
    getApiBaseUrl();

  window.location.assign(
    `${apiBaseUrl}${AUTH_PREFIX}/github`
  );
}


/* ==========================================================================
   DEFAULT SERVICE OBJECT
========================================================================== */

const authService = {
  login,
  register,
  getCurrentUser,
  logout,

  saveAuth,
  getStoredUser,
  clearStoredUser,

  isAuthenticated,

  loginWithGoogle,
  loginWithGithub,
};

export default authService;
