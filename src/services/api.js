const API_URL =

import.meta.env.VITE_API_URL ||

"http://localhost:5000";

/* =========================
GET TOKEN
========================= */

function getToken() {

  return localStorage.getItem(
    "zyrionos_token"
  );

}

/* =========================
HEADERS
========================= */

function createHeaders() {

  const headers = {

    "Content-Type":
    "application/json"

  };

  const token = getToken();

  if (token) {

    headers.Authorization =
    `Bearer ${token}`;

  }

  return headers;

}

/* =========================
REQUEST
========================= */

async function request(

  endpoint,

  options = {}

) {

  const response =

  await fetch(

    `${API_URL}${endpoint}`,

    {

      ...options,

      headers: {

        ...createHeaders(),

        ...(options.headers || {})

      }

    }

  );

  const data =
  await response.json();

  if (!response.ok) {

    throw new Error(

      data.message ||

      "Request Failed"

    );

  }

  return data;

}

/* =========================
GET
========================= */

export async function get(

  endpoint

) {

  return request(

    endpoint,

    {

      method: "GET"

    }

  );

}

/* =========================
POST
========================= */

export async function post(

  endpoint,

  body = {}

) {

  return request(

    endpoint,

    {

      method: "POST",

      body: JSON.stringify(body)

    }

  );

}

/* =========================
PUT
========================= */

export async function put(

  endpoint,

  body = {}

) {

  return request(

    endpoint,

    {

      method: "PUT",

      body: JSON.stringify(body)

    }

  );

}

/* =========================
DELETE
========================= */

export async function remove(

  endpoint

) {

  return request(

    endpoint,

    {

      method: "DELETE"

    }

  );

}

/* =========================
EXPORT
========================= */

export default {

  get,

  post,

  put,

  remove

};
