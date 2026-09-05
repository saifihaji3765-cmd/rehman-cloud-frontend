import axios from "axios";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — API CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://api.zyrionos.com";

/*
|--------------------------------------------------------------------------
| AXIOS CLIENT
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL: API_BASE_URL,

  withCredentials: true,

  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    config.metadata = {
      startTime: Date.now(),
    };

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We preserve the original Axios error object.
|
| workspaceService.js depends on:
|
| error.response.data
| error.response.status
| error.message
|
| Therefore we must NOT replace Axios errors
| with plain objects.
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error?.response?.status;

    const responseData =
      error?.response?.data;

    /*
     * Backend-provided message
     */

    const backendMessage =
      responseData?.message ||
      responseData?.error ||
      responseData?.detail;

    /*
     * Network / timeout
     */

    if (!error.response) {
      error.message =
        error.code === "ECONNABORTED"
          ? "The request timed out. Please try again."
          : "Unable to connect to the server. Please check your internet connection.";

      error.status = null;

      return Promise.reject(error);
    }

    /*
     * Authentication
     */

    if (status === 401) {
      error.message =
        backendMessage ||
        "Authentication required.";

      error.status = 401;

      return Promise.reject(error);
    }

    /*
     * Forbidden
     */

    if (status === 403) {
      error.message =
        backendMessage ||
        "You do not have permission to perform this action.";

      error.status = 403;

      return Promise.reject(error);
    }

    /*
     * Rate limit
     */

    if (status === 429) {
      error.message =
        backendMessage ||
        "Too many requests. Please wait a moment and try again.";

      error.status = 429;

      return Promise.reject(error);
    }

    /*
     * Server error
     */

    if (status >= 500) {
      error.message =
        backendMessage ||
        "The server encountered an error. Please try again later.";

      error.status = status;

      return Promise.reject(error);
    }

    /*
     * Other API errors
     */

    error.message =
      backendMessage ||
      "Something went wrong with the request.";

    error.status = status;

    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default api;
