import api from "./api";

/* =========================
LOGIN
========================= */

export async function login(

  email,

  password

) {

  return api.post(

    "/api/auth/login",

    {

      email,

      password

    }

  );

}

/* =========================
REGISTER
========================= */

export async function register(

  userData

) {

  return api.post(

    "/api/auth/register",

    userData

  );

}

/* =========================
CURRENT USER
========================= */

export async function getCurrentUser() {

  return api.get(

    "/api/auth/me"

  );

}

/* =========================
LOGOUT
========================= */

export async function logout() {

  localStorage.removeItem(

    "zyrionos_token"

  );

  localStorage.removeItem(

    "zyrionos_user"

  );

  return true;

}

/* =========================
TOKEN
========================= */

export function saveAuth(

  token,

  user

) {

  localStorage.setItem(

    "zyrionos_token",

    token

  );

  localStorage.setItem(

    "zyrionos_user",

    JSON.stringify(user)

  );

}

/* =========================
USER
========================= */

export function getStoredUser() {

  const user =

  localStorage.getItem(

    "zyrionos_user"

  );

  if (!user) {

    return null;

  }

  return JSON.parse(user);

}

/* =========================
AUTH CHECK
========================= */

export function isAuthenticated() {

  return !!localStorage.getItem(

    "zyrionos_token"

  );

}

/* =========================
GOOGLE LOGIN
========================= */

export function loginWithGoogle() {

  window.location.href =

  `${import.meta.env.VITE_API_URL}/api/auth/google`;

}

/* =========================
GITHUB LOGIN
========================= */

export function loginWithGithub() {

  window.location.href =

  `${import.meta.env.VITE_API_URL}/api/auth/github`;

}
