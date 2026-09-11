import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — AUTHENTICATION SERVICE
|--------------------------------------------------------------------------
|
| Enterprise Authentication Service
|
| Responsibilities:
| - Email/password login
| - Registration
| - Current session verification
| - Logout
| - Google OAuth
| - GitHub OAuth
| - Safe user-profile cache
|
| SECURITY:
| Authentication credentials are handled by the backend
| through the HttpOnly session cookie.
|
| JWT / access tokens are NEVER persisted in localStorage.
|
|--------------------------------------------------------------------------
*/

const API_PREFIX = "/api/auth";

const USER_STORAGE_KEY = "zyrions_user";

const DEFAULT_API_URL = "https://api.zyrionos.com";

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
*/

function getApiBaseUrl() {
  const configuredUrl =
    import.meta.env.VITE_API_URL;

  return (
    configuredUrl ||
    DEFAULT_API_URL
  ).replace(/\/+$/, "");
}

/*
|--------------------------------------------------------------------------
| ERROR NORMALIZATION
|--------------------------------------------------------------------------
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

  if (
    status === 400 &&
    !backendMessage
  ) {
    message =
      "The authentication request could not be processed.";
  }

  if (
    status === 401 &&
    !backendMessage
  ) {
    message =
      "Invalid credentials or authentication session.";
  }

  if (
    status === 403 &&
    !backendMessage
  ) {
    message =
      "You do not have permission to perform this action.";
  }

  if (
    status === 404 &&
    !backendMessage
  ) {
    message =
      "The requested authentication service was not found.";
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
   * Network / timeout handling.
   */
  if (!error?.response) {
    if (
      error?.code === "ECONNABORTED"
    ) {
      message =
        "The request timed out. Please try again.";
    } else if (
      error?.code === "ERR_NETWORK"
    ) {
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

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
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
    email.trim().toLowerCase();

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

/*
|--------------------------------------------------------------------------
| USER PROFILE CACHE
|--------------------------------------------------------------------------
|
| ONLY non-sensitive profile information may be cached.
|
| Never store:
| - JWT
| - access token
| - refresh token
| - session token
| - authorization header
|
|--------------------------------------------------------------------------
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
     * Storage failure must never break authentication.
     */
    console.warn(
      "Unable to cache user profile:",
      error
    );
  }
}

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
| Backend establishes the HttpOnly authentication cookie.
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
| LOGIN USER — FRONTEND COMPATIBILITY EXPORT
|--------------------------------------------------------------------------
|
| Login.jsx currently imports loginUser().
|
| Keep login() as the canonical service function while exposing
| loginUser() for existing frontend consumers.
|
|--------------------------------------------------------------------------
*/

export async function loginUser(
  credentials
) {
  if (
    !credentials ||
    typeof credentials !== "object"
  ) {
    throw new Error(
      "Login credentials are required."
    );
  }

  return login(
    credentials.email,
    credentials.password
  );
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
| CURRENT USER
|--------------------------------------------------------------------------
|
| GET /api/auth/me
|
| Server remains the authoritative source of authentication.
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

    clearStoredUserProfile();

    return response.data;
  } catch (error) {
    /*
     * Remove stale local profile even when backend
     * logout reports an error.
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
*/

export async function isAuthenticated() {
  try {
    const response =
      await getCurrentUser();

    const responseData =
      response?.data;

    return Boolean(
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
| Cached profile ≠ authentication proof.
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
  } catch {
    clearStoredUserProfile();

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| SAVE AUTH
|--------------------------------------------------------------------------
|
| Supports BOTH existing calling conventions:
|
| 1. saveAuth(user, token)
| 2. saveAuth(token, user)
|
| The token is ALWAYS ignored.
|
| This gives us compatibility while keeping the
| HttpOnly-cookie security architecture intact.
|
|--------------------------------------------------------------------------
*/

export function saveAuth(
  first,
  second
) {
  let user = null;

  /*
   * Current Login.jsx convention:
   *
   * saveAuth(data.user, data.token)
   */
  if (
    first &&
    typeof first === "object" &&
    !Array.isArray(first)
  ) {
    user = first;
  }

  /*
   * Legacy convention:
   *
   * saveAuth(token, user)
   */
  else if (
    second &&
    typeof second === "object" &&
    !Array.isArray(second)
  ) {
    user = second;
  }

  if (user) {
    storeUserProfile(user);
  }
}

/*
|--------------------------------------------------------------------------
| CLEAR LOCAL PROFILE
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
| Browser is redirected to backend OAuth.
|
|--------------------------------------------------------------------------
*/

export function loginWithGoogle() {
  const apiBaseUrl =
    getApiBaseUrl();

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
|
|--------------------------------------------------------------------------
*/

export function loginWithGithub() {
  const apiBaseUrl =
    getApiBaseUrl();

  window.location.assign(
    `${apiBaseUrl}${API_PREFIX}/github`
  );
}

/*
|--------------------------------------------------------------------------
| GITHUB OAUTH — FRONTEND COMPATIBILITY EXPORT
|--------------------------------------------------------------------------
|
| Login.jsx uses the capital-H spelling.
|
|--------------------------------------------------------------------------
*/

export function loginWithGitHub() {
  return loginWithGithub();
}

/*
|--------------------------------------------------------------------------
| DEFAULT SERVICE
|--------------------------------------------------------------------------
*/

const authService = {
  login,
  loginUser,
  register,
  getCurrentUser,
  logout,
  isAuthenticated,
  saveAuth,
  getStoredUser,
  clearAuthProfile,
  loginWithGoogle,
  loginWithGithub,
  loginWithGitHub,
};

export default authService;
