import axios from "axios";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
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
    /*
     * Request timestamp
     * Useful for debugging and observability.
     */

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
*/

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    /*
     * Network / timeout error
     */

    if (!error.response) {
      return Promise.reject({
        success: false,
        message:
          "Unable to connect to the server. Please check your internet connection.",
        originalError: error,
      });
    }

    /*
     * Authentication failure
     */

    if (error.response.status === 401) {
      /*
       * Do not automatically redirect here.
       *
       * AuthContext / ProtectedRoute should decide
       * what happens to the user.
       */

      return Promise.reject({
        success: false,
        message: "Authentication required.",
        status: 401,
        data: error.response.data,
      });
    }

    /*
     * Forbidden
     */

    if (error.response.status === 403) {
      return Promise.reject({
        success: false,
        message: "You do not have permission to perform this action.",
        status: 403,
        data: error.response.data,
      });
    }

    /*
     * Rate limit
     */

    if (error.response.status === 429) {
      return Promise.reject({
        success: false,
        message:
          "Too many requests. Please wait a moment and try again.",
        status: 429,
        data: error.response.data,
      });
    }

    /*
     * Server error
     */

    if (error.response.status >= 500) {
      return Promise.reject({
        success: false,
        message:
          "The server encountered an error. Please try again later.",
        status: error.response.status,
        data: error.response.data,
      });
    }

    /*
     * Other API errors
     */

    return Promise.reject({
      success: false,
      message:
        error.response?.data?.message ||
        "Something went wrong with the request.",
      status: error.response.status,
      data: error.response.data,
    });
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default api;
