import api from "./api";

/*
================================
HTTPONLY COOKIE AUTH
================================
JWT browser localStorage mein store NAHI hoga.
Backend HttpOnly cookie set karega.
Axios credentials automatically bhejega.
*/

export async function login(email, password) {
  const response = await api.post(
    "/api/auth/login",
    { email, password },
    { withCredentials: true }
  );

  return response.data;
}

export async function register(userData) {
  return api.post(
    "/api/auth/register",
    userData,
    { withCredentials: true }
  );
}

export async function getCurrentUser() {
  return api.get(
    "/api/auth/me",
    { withCredentials: true }
  );
}

/*
================================
LOGOUT
================================
Backend logout route agar available hai
to cookie clear karega.
*/

export async function logout() {
  try {
    await api.post(
      "/api/auth/logout",
      {},
      { withCredentials: true }
    );
  } catch (error) {
    console.warn("Logout API unavailable:", error?.message);
  }

  localStorage.removeItem("zyrions_user");

  return true;
}

/*
================================
USER PROFILE ONLY
================================
User information localStorage mein reh sakti hai.
JWT/token yahan store NAHI hoga.
*/

export function saveAuth(token, user) {
  /*
   * token intentionally ignored.
   * Authentication token HttpOnly cookie mein hai.
   */

  if (user) {
    localStorage.setItem(
      "zyrions_user",
      JSON.stringify(user)
    );
  }
}

export function getStoredUser() {
  const user = localStorage.getItem("zyrions_user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem("zyrions_user");
    return null;
  }
}

/*
================================
AUTH CHECK
================================
Dashboard ke liye actual server-side
authentication check.
*/

export async function isAuthenticated() {
  try {
    const response = await getCurrentUser();

    return !!(
      response?.data?.success &&
      response?.data?.user
    );
  } catch {
    return false;
  }
}

/*
================================
GOOGLE LOGIN
================================
Backend OAuth flow HttpOnly cookie set karega.
*/

export function loginWithGoogle() {
  window.location.href =
    `${import.meta.env.VITE_API_URL}/api/auth/google`;
}

/*
================================
GITHUB LOGIN
================================
*/

export function loginWithGithub() {
  window.location.href =
    `${import.meta.env.VITE_API_URL}/api/auth/github`;
}
