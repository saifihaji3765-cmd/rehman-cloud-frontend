import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — AUTHENTICATION SERVICE
|--------------------------------------------------------------------------
|
| Enterprise Authentication API Layer
|
| Responsibilities:
| - Login
| - Registration
| - Current-session verification
| - Logout
| - Google OAuth
| - GitHub OAuth
| - Local user profile cache
| - Authentication error normalization
|
| IMPORTANT SECURITY RULE:
|
| Authentication tokens / JWTs must NEVER be stored in localStorage.
|
| The backend is responsible for establishing the authenticated
| session using a secure HttpOnly cookie.
|
| Axios credentials are enabled through the centralized API client.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_PREFIX = "/api/auth";

const USER_STORAGE_KEY = "zyrions_user";


/*
|--------------------------------------------------------------------------
| INTERNAL HELPERS
|--------------------------------------------------------------------------
*/


/**
 * Normalize an authentication error into a safe Error object.
 *
 * The original Axios error is intentionally not exposed directly
 * to presentation components.
 */
function normalizeAuthError(
  error,
  fallbackMessage = "Authentication request failed."
) {
  const responseData =
    error?.response?.data;

  const status =
    error?.response?.status ??
    error?.status ??
    null;

  const backendMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.detail;

  let message =
    backendMessage ||
    error?.message ||
    fallbackMessage;

  /*
   * Authentication-specific messages.
   */

  if (
    status === 401 &&
    !backendMessage
  ) {
    message =
      "Authentication required. Please sign in again.";
  }

  if (
    status === 403 &&
    !backendMessage
  ) {
    message =
      "You do not have permission to perform this action.";
  }

  if (
    status === 409 &&
    !backendMessage
  ) {
    message =
      "This account already exists.";
  }

  if (
    status === 429 &&
    !backendMessage
  ) {
    message =
      "Too many requests. Please wait a moment and try again.";
  }

  if (
    status >= 500 &&
    !backendMessage
  ) {
    message =
      "The authentication service is temporarily unavailable. Please try again later.";
  }

  /*
   * Network / connection failure.
   */

  if (!error?.response) {
    if (
      error?.code === "ECONNABORTED"
    ) {
      message =
        "The request timed out. Please try again.";
    } else {
      message =
        "Unable to connect to the authentication service. Please check your internet connection.";
    }
  }

  const normalizedError =
    new Error(String(message));

  normalizedError.status =
    status;

  normalizedError.code =
    responseData?.code ||
    error?.code ||
    null;

  normalizedError.data =
    responseData ||
    error?.data ||
    null;

  return normalizedError;
}


/**
 * Validate an email address.
 *
 * This is lightweight client-side validation only.
 * Backend validation remains authoritative.
 */
function validateEmail(email) {
  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    throw new Error(
      "Email address is required."
    );
  }

  const normalizedEmail =
    email.trim();

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      normalizedEmail
    )
  ) {
    throw new Error(
      "Please enter a valid email address."
    );
  }

  return normalizedEmail;
}


/**
 * Validate password input.
 *
 * This does not impose product-specific password rules
 * beyond requiring a non-empty value.
 *
 * The backend remains authoritative for password policy.
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
 * Validate registration payload.
 */
function validateRegisterData(
  userData
) {
  if (
    !userData ||
    typeof userData !== "object" ||
    Array.isArray(userData)
  ) {
    throw new Error(
      "Registration data must be a valid object."
    );
  }
}


/**
 * Safely store only the user profile.
 *
 * NEVER stores:
 * - JWT
 * - access token
 * - refresh token
 * - session token
 * - authorization header
 */
function storeUserProfile(user) {
  if (!user) {
    return;
  }

  try {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(user)
    );
  } catch (error) {
    /*
     * Storage failure must not break authentication.
     */
    console.warn(
      "Unable to cache user profile:",
      error
    );
  }
}


/**
 * Remove cached user profile.
 */
function clearStoredUserProfile() {
  try {
    localStorage.removeItem(
      USER_STORAGE_KEY
    );
  } catch (error) {
    console.warn(
      "Unable to clear cached user profile:",
      error
    );
  }
}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
|
| POST /api/auth/login
|
| Backend establishes the authenticated HttpOnly cookie.
|
|--------------------------------------------------------------------------
*/

export async function login(
  email,
  password
) {
  try {
    const normalizedEmail =
      validateEmail(email);

    const normalizedPassword =
      validatePassword(password);

    const response =
      await api.post(
        `${API_PREFIX}/login`,
        {
          email: normalizedEmail,
          password: normalizedPassword,
        },
        {
          withCredentials: true,
        }
      );

    /*
     * Cache profile information only when the backend
     * actually returns it.
     */
    const user =
      response?.data?.user ||
      response?.data?.data?.user;

    if (user) {
      storeUserProfile(user);
    }

    return response.data;
  } catch (error) {
    throw normalizeAuthError(
      error,
      "Unable to sign in. Please check your credentials and try again."
    );
  }
}


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
|
| POST /api/auth/register
|
|--------------------------------------------------------------------------
*/

export async function register(
  userData
) {
  try {
    validateRegisterData(
      userData
    );

    const payload = {
      ...userData,
    };

    /*
     * Normalize email when supplied.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "email"
      )
    ) {
      payload.email =
        validateEmail(
          payload.email
        );
    }

    /*
     * Validate password when supplied.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "password"
      )
    ) {
      payload.password =
        validatePassword(
          payload.password
        );
    }

    const response =
      await api.post(
        `${API_PREFIX}/register`,
        payload,
        {
          withCredentials: true,
        }
      );

    /*
     * Some backends authenticate the user immediately
     * after registration and return the profile.
     */
    const user =
      response?.data?.user ||
      response?.data?.data?.user;

    if (user) {
      storeUserProfile(user);
    }

    return response.data;
  } catch (error) {
    throw normalizeAuthError(
      error,
      "Unable to create your account. Please try again."
    );
  }
}


/*
|--------------------------------------------------------------------------
| CURRENT USER / SESSION
|--------------------------------------------------------------------------
|
| GET /api/auth/me
|
| This is the authoritative authentication check.
|
| The frontend must not consider the user authenticated
| merely because a localStorage profile exists.
|
|--------------------------------------------------------------------------
*/

export async function getCurrentUser() {
  try {
    const response =
      await api.get(
        `${API_PREFIX}/me`,
        {
          withCredentials: true,
        }
      );

    const user =
      response?.data?.user ||
      response?.data?.data?.user;

    if (user) {
      storeUserProfile(user);
    }

    return response;
  } catch (error) {
    /*
     * If the server confirms that the session is invalid,
     * the cached profile must not be treated as authoritative.
     */
    if (
      error?.response?.status === 401
    ) {
      clearStoredUserProfile();
    }

    throw normalizeAuthError(
      error,
      "Unable to verify your authentication session."
    );
  }
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
|
| POST /api/auth/logout
|
| Backend should invalidate / clear the HttpOnly session cookie.
|
|--------------------------------------------------------------------------
*/

export async function logout() {
  try {
    const response =
      await api.post(
        `${API_PREFIX}/logout`,
        {},
        {
          withCredentials: true,
        }
      );

    /*
     * Clear local profile only after the logout request
     * has completed successfully.
     */
    clearStoredUserProfile();

    return response.data;
  } catch (error) {
    /*
     * Even if the backend logout endpoint fails,
     * remove the local cached profile so stale UI state
     * is not presented as current user information.
     */
    clearStoredUserProfile();

    throw normalizeAuthError(
      error,
      "Unable to complete logout. Please try again."
    );
  }
}


/*
|--------------------------------------------------------------------------
| AUTHENTICATION STATUS
|--------------------------------------------------------------------------
|
| The server is the source of truth.
|
|--------------------------------------------------------------------------
*/

export async function isAuthenticated() {
  try {
    const response =
      await getCurrentUser();

    const responseData =
      response?.data;

    return !!(
      responseData?.success &&
      (
        responseData?.user ||
        responseData?.data?.user
      )
    );
  } catch {
    return false;
  }
}


/*
|--------------------------------------------------------------------------
| STORED USER PROFILE
|--------------------------------------------------------------------------
|
| This is only a cached profile.
|
| It must NEVER be used as proof of authentication.
|
|--------------------------------------------------------------------------
*/

export function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem(
        USER_STORAGE_KEY
      );

    if (!storedUser) {
      return null;
    }

    return JSON.parse(
      storedUser
    );
  } catch (error) {
    clearStoredUserProfile();

    return null;
  }
}


/*
|--------------------------------------------------------------------------
| SAVE AUTH — LEGACY COMPATIBILITY
|--------------------------------------------------------------------------
|
| Existing frontend code may still call:
|
| saveAuth(token, user)
|
| The token parameter is intentionally ignored.
|
| JWT/session credentials must remain inside the secure
| backend-controlled HttpOnly cookie.
|
|--------------------------------------------------------------------------
*/

export function saveAuth(
  _token,
  user
) {
  if (user) {
    storeUserProfile(user);
  }
}


/*
|--------------------------------------------------------------------------
| CLEAR LOCAL AUTH PROFILE
|--------------------------------------------------------------------------
|
| Useful when the application needs to discard cached
| profile information without making a server request.
|
|--------------------------------------------------------------------------
*/

export function clearAuthProfile() {
  clearStoredUserProfile();
}


/*
|--------------------------------------------------------------------------
| GOOGLE OAUTH
|--------------------------------------------------------------------------
|
| GET /api/auth/google
|
| OAuth authentication is handled by the backend.
|
| The browser is redirected to the backend OAuth route.
|
|--------------------------------------------------------------------------
*/

export function loginWithGoogle() {
  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    "https://api.zyrionos.com";

  window.location.assign(
    `${apiBaseUrl}${API_PREFIX}/google`
  );
}


/*
|--------------------------------------------------------------------------
| GITHUB OAUTH
|--------------------------------------------------------------------------
|
| GET /api/auth/github
|--------------------------------------------------------------------------
*/

export function loginWithGithub() {
  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    "https://api.zyrionos.com";

  window.location.assign(
    `${apiBaseUrl}${API_PREFIX}/github`
  );
}


/*
|--------------------------------------------------------------------------
| DEFAULT SERVICE EXPORT
|--------------------------------------------------------------------------
*/

const authService = {
  login,
  register,
  getCurrentUser,
  logout,
  isAuthenticated,
  saveAuth,
  getStoredUser,
  clearAuthProfile,
  loginWithGoogle,
  loginWithGithub,
};

export default authService;
