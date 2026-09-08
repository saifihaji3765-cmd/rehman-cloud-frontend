import axios from "axios";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — CENTRAL API CLIENT
|--------------------------------------------------------------------------
|
| Responsibilities:
| - Central backend URL
| - Authentication credentials
| - Request configuration
| - Request timing metadata
| - Consistent response error handling
|
| IMPORTANT:
| - All frontend services should use this client.
| - Do not create separate Axios clients inside services.
| - Do not put API secrets in the frontend.
| - Preserve the original Axios error object.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| API BASE URL
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

  /*
   * Required for cookie/session based authentication.
   */
  withCredentials: true,

  /*
   * Prevent requests from hanging indefinitely.
   */
  timeout: 30000,

  headers: {
    "Content-Type":
      "application/json",

    Accept:
      "application/json",
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
     * Request timing metadata.
     *
     * This is useful for debugging and
     * performance monitoring.
     */
    config.metadata = {
      ...(config.metadata || {}),
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
|
| The original Axios error object MUST be preserved.
|
| Existing services depend on:
|
| error.response.data
| error.response.status
| error.message
|
| Therefore this interceptor modifies the existing
| Axios error instead of replacing it.
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => {
    /*
     * Add response timing information without
     * changing the response structure.
     */
    if (response.config?.metadata) {
      response.config.metadata.duration =
        Date.now() -
        response.config.metadata.startTime;
    }

    return response;
  },

  (error) => {
    /*
     * Preserve Axios error object.
     */
    const status =
      error?.response?.status ??
      null;

    const responseData =
      error?.response?.data ??
      null;


    /*
     * Calculate request duration when available.
     */
    if (error?.config?.metadata) {
      error.config.metadata.duration =
        Date.now() -
        error.config.metadata.startTime;
    }


    /*
     * Backend-provided message.
     */
    const backendMessage =
      responseData?.message ||
      responseData?.error ||
      responseData?.detail ||
      responseData?.reason ||
      null;


    /*
     |--------------------------------------------------------------------------
     | NETWORK / TIMEOUT
     |--------------------------------------------------------------------------
     */

    if (!error.response) {
      error.status = null;

      if (
        error.code ===
        "ECONNABORTED"
      ) {
        error.message =
          "The request timed out. Please try again.";
      } else if (
        error.code ===
        "ERR_NETWORK"
      ) {
        error.message =
          "Unable to connect to the server. Please check your internet connection.";
      } else {
        error.message =
          "Unable to connect to the server. Please try again.";
      }

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 400 — BAD REQUEST
     |--------------------------------------------------------------------------
     */

    if (status === 400) {
      error.message =
        backendMessage ||
        "The request could not be processed.";

      error.status = 400;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 401 — AUTHENTICATION
     |--------------------------------------------------------------------------
     */

    if (status === 401) {
      error.message =
        backendMessage ||
        "Authentication required.";

      error.status = 401;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 403 — FORBIDDEN
     |--------------------------------------------------------------------------
     */

    if (status === 403) {
      error.message =
        backendMessage ||
        "You do not have permission to perform this action.";

      error.status = 403;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 404 — NOT FOUND
     |--------------------------------------------------------------------------
     */

    if (status === 404) {
      error.message =
        backendMessage ||
        "The requested resource was not found.";

      error.status = 404;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 409 — CONFLICT
     |--------------------------------------------------------------------------
     */

    if (status === 409) {
      error.message =
        backendMessage ||
        "The request conflicts with the current project state.";

      error.status = 409;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 422 — VALIDATION
     |--------------------------------------------------------------------------
     */

    if (status === 422) {
      error.message =
        backendMessage ||
        "Some of the provided information is invalid.";

      error.status = 422;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 429 — RATE LIMIT
     |--------------------------------------------------------------------------
     */

    if (status === 429) {
      error.message =
        backendMessage ||
        "Too many requests. Please wait a moment and try again.";

      error.status = 429;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | 500+ — SERVER ERROR
     |--------------------------------------------------------------------------
     */

    if (status >= 500) {
      error.message =
        backendMessage ||
        "The server encountered an error. Please try again later.";

      error.status =
        status;

      return Promise.reject(
        error
      );
    }


    /*
     |--------------------------------------------------------------------------
     | OTHER API ERRORS
     |--------------------------------------------------------------------------
     */

    error.message =
      backendMessage ||
      error.message ||
      "Something went wrong with the request.";

    error.status =
      status;


    /*
     * Preserve original backend response.
     *
     * Existing services can still access:
     *
     * error.response.data
     */
    return Promise.reject(
      error
    );
  }
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default api;
