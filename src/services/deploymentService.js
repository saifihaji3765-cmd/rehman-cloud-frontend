import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — DEPLOYMENT SERVICE
|--------------------------------------------------------------------------
|
| Enterprise Deployment API Layer
|
| Responsibilities:
| - Create deployment
| - Read deployment status
| - Read deployment logs
| - Read deployment monitoring
| - Trigger scaling
|
| IMPORTANT:
| - Uses the centralized API client.
| - Uses the REAL backend deployment endpoints.
| - Does not create fake deployment data.
| - Does not generate fake live URLs.
| - Does not claim deployment success.
| - Backend remains the source of truth for deployment state.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_PREFIX = "/api/deploy";


/*
|--------------------------------------------------------------------------
| INTERNAL HELPERS
|--------------------------------------------------------------------------
*/


/**
 * Normalize and validate deployment ID.
 */
function normalizeDeploymentId(
  deploymentId
) {
  if (
    deploymentId === undefined ||
    deploymentId === null ||
    String(deploymentId).trim() === ""
  ) {
    throw new Error(
      "Deployment ID is required."
    );
  }

  return encodeURIComponent(
    String(deploymentId).trim()
  );
}


/**
 * Validate deployment payload.
 */
function validateDeploymentData(
  projectData
) {
  if (
    !projectData ||
    typeof projectData !== "object" ||
    Array.isArray(projectData)
  ) {
    throw new Error(
      "Deployment data must be a valid object."
    );
  }
}


/**
 * Normalize deployment API errors.
 *
 * The centralized api.js preserves the Axios error,
 * allowing us to safely read backend response information.
 */
function normalizeDeploymentError(
  error,
  fallbackMessage
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
   * Network / timeout.
   */
  if (!error?.response) {
    if (
      error?.code === "ECONNABORTED"
    ) {
      message =
        "The deployment request timed out. Please try again.";
    } else {
      message =
        "Unable to connect to the deployment service. Please check your connection and try again.";
    }
  }


  /*
   * Authentication.
   */
  if (
    status === 401 &&
    !backendMessage
  ) {
    message =
      "Authentication required. Please sign in again.";
  }


  /*
   * Permission.
   */
  if (
    status === 403 &&
    !backendMessage
  ) {
    message =
      "You do not have permission to manage this deployment.";
  }


  /*
   * Not found.
   */
  if (
    status === 404 &&
    !backendMessage
  ) {
    message =
      "The requested deployment could not be found.";
  }


  /*
   * Rate limit.
   */
  if (
    status === 429 &&
    !backendMessage
  ) {
    message =
      "Too many deployment requests. Please wait a moment and try again.";
  }


  /*
   * Server error.
   */
  if (
    status >= 500 &&
    !backendMessage
  ) {
    message =
      "The deployment service encountered an error. Please try again later.";
  }


  const normalizedError =
    new Error(
      String(message)
    );

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
| CREATE DEPLOYMENT
|--------------------------------------------------------------------------
|
| POST /api/deploy/deploy
|
| The backend determines:
| - Deployment ID
| - Deployment state
| - Build/deployment progress
| - Live URL
| - Deployment result
|
| The frontend must not invent any of these values.
|
|--------------------------------------------------------------------------
*/

export async function createDeployment(
  projectData
) {
  try {
    validateDeploymentData(
      projectData
    );

    return await api.post(
      `${API_PREFIX}/deploy`,
      projectData
    );
  } catch (error) {
    throw normalizeDeploymentError(
      error,
      "Unable to start the deployment."
    );
  }
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT STATUS
|--------------------------------------------------------------------------
|
| GET /api/deploy/status/:deploymentId
|
|--------------------------------------------------------------------------
*/

export async function getDeploymentStatus(
  deploymentId
) {
  try {
    const id =
      normalizeDeploymentId(
        deploymentId
      );

    return await api.get(
      `${API_PREFIX}/status/${id}`
    );
  } catch (error) {
    throw normalizeDeploymentError(
      error,
      "Unable to load deployment status."
    );
  }
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT LOGS
|--------------------------------------------------------------------------
|
| GET /api/deploy/logs/:deploymentId
|
|--------------------------------------------------------------------------
*/

export async function getDeploymentLogs(
  deploymentId
) {
  try {
    const id =
      normalizeDeploymentId(
        deploymentId
      );

    return await api.get(
      `${API_PREFIX}/logs/${id}`
    );
  } catch (error) {
    throw normalizeDeploymentError(
      error,
      "Unable to load deployment logs."
    );
  }
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT MONITORING
|--------------------------------------------------------------------------
|
| GET /api/deploy/monitoring/:deploymentId
|
|--------------------------------------------------------------------------
*/

export async function getDeploymentMonitoring(
  deploymentId
) {
  try {
    const id =
      normalizeDeploymentId(
        deploymentId
      );

    return await api.get(
      `${API_PREFIX}/monitoring/${id}`
    );
  } catch (error) {
    throw normalizeDeploymentError(
      error,
      "Unable to load deployment monitoring data."
    );
  }
}


/*
|--------------------------------------------------------------------------
| TRIGGER SCALING
|--------------------------------------------------------------------------
|
| POST /api/deploy/scale/:deploymentId
|
|--------------------------------------------------------------------------
*/

export async function triggerScaling(
  deploymentId
) {
  try {
    const id =
      normalizeDeploymentId(
        deploymentId
      );

    return await api.post(
      `${API_PREFIX}/scale/${id}`
    );
  } catch (error) {
    throw normalizeDeploymentError(
      error,
      "Unable to start deployment scaling."
    );
  }
}


/*
|--------------------------------------------------------------------------
| DEFAULT SERVICE EXPORT
|--------------------------------------------------------------------------
*/

const deploymentService = {
  createDeployment,
  getDeploymentStatus,
  getDeploymentLogs,
  getDeploymentMonitoring,
  triggerScaling,
};

export default deploymentService;
