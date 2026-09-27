import api from "./api";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — ENVIRONMENT SERVICE
|--------------------------------------------------------------------------
|
| Enterprise Environment API Layer
|
| Responsibilities:
| - Create environment
| - List environments
| - Read environment
| - Configuration summary
| - Add/update/delete variables
| - Validate environment
| - Deployment readiness
| - Deployment snapshot metadata
| - Mark deployed
| - Archive/unarchive
| - Delete environment
| - Copy environment
| - Environment health
|
| IMPORTANT:
| - Uses centralized api.js.
| - Never decrypts secrets in the frontend.
| - Never stores environment secrets locally.
| - Backend remains authoritative.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_PREFIX =
  "/api/environments";


const DEFAULT_ENVIRONMENT_TIMEOUT =
  30000;


/*
|--------------------------------------------------------------------------
| INTERNAL HELPERS
|--------------------------------------------------------------------------
*/


function normalizeProjectId(
  projectId
) {

  if (
    projectId === undefined ||
    projectId === null ||
    String(projectId).trim() === ""
  ) {

    throw new Error(
      "Project ID is required."
    );
  }

  return encodeURIComponent(
    String(projectId).trim()
  );
}


function normalizeEnvironmentName(
  environmentName
) {

  if (
    environmentName === undefined ||
    environmentName === null ||
    String(environmentName).trim() === ""
  ) {

    throw new Error(
      "Environment name is required."
    );
  }

  return encodeURIComponent(
    String(environmentName).trim()
  );
}


function normalizeVariableKey(
  key
) {

  if (
    key === undefined ||
    key === null ||
    String(key).trim() === ""
  ) {

    throw new Error(
      "Environment variable key is required."
    );
  }

  return encodeURIComponent(
    String(key).trim()
  );
}


function validateObject(
  value,
  message
) {

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {

    throw new Error(
      message
    );
  }
}


/*
|--------------------------------------------------------------------------
| ERROR NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeEnvironmentError(
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
    responseData?.detail ||
    responseData?.reason;


  let message =
    backendMessage ||
    error?.message ||
    fallbackMessage;


  /*
   * Network / timeout.
   */

  if (
    !error?.response
  ) {

    if (
      error?.code ===
        "ECONNABORTED" ||
      error?.code ===
        "ETIMEDOUT" ||
      error?.isTimeout
    ) {

      message =
        "The environment request timed out. Please try again.";

    } else if (
      error?.code ===
        "ERR_NETWORK" ||
      error?.isNetworkError
    ) {

      message =
        "Unable to connect to the environment service.";

    } else {

      message =
        "Unable to connect to the server.";
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
      "You do not have permission to manage this environment.";
  }


  /*
   * Not found.
   */

  if (
    status === 404 &&
    !backendMessage
  ) {

    message =
      "The requested environment could not be found.";
  }


  /*
   * Conflict.
   */

  if (
    status === 409 &&
    !backendMessage
  ) {

    message =
      "The environment has changed and the requested operation could not be completed.";
  }


  /*
   * Validation.
   */

  if (
    status === 422 &&
    !backendMessage
  ) {

    message =
      "The environment data could not be validated.";
  }


  /*
   * Rate limit.
   */

  if (
    status === 429 &&
    !backendMessage
  ) {

    message =
      "Too many environment requests. Please wait and try again.";
  }


  /*
   * Server error.
   */

  if (
    status >= 500 &&
    !backendMessage
  ) {

    message =
      "The environment service encountered a server error.";
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

  normalizedError.isEnvironmentError =
    true;

  normalizedError.isTimeout =
    Boolean(
      error?.isTimeout ||
      error?.code ===
        "ECONNABORTED" ||
      error?.code ===
        "ETIMEDOUT"
    );

  normalizedError.isNetworkError =
    Boolean(
      error?.isNetworkError ||
      error?.code ===
        "ERR_NETWORK"
    );

  normalizedError.duration =
    error?.config?.metadata?.duration ??
    null;


  return normalizedError;
}


/*
|--------------------------------------------------------------------------
| REQUEST EXECUTOR
|--------------------------------------------------------------------------
*/

async function executeRequest(
  request,
  fallbackMessage
) {

  try {

    return await request();

  } catch (error) {

    throw normalizeEnvironmentError(
      error,
      fallbackMessage
    );
  }
}


/*
|--------------------------------------------------------------------------
| CREATE ENVIRONMENT
|--------------------------------------------------------------------------
|
| POST /api/environments
|
|--------------------------------------------------------------------------
*/

export async function createEnvironment(
  environmentData
) {

  validateObject(
    environmentData,
    "Environment data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        API_PREFIX,
        environmentData,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to create the environment."
  );
}


/*
|--------------------------------------------------------------------------
| LIST ENVIRONMENTS
|--------------------------------------------------------------------------
|
| GET /api/environments
|
|--------------------------------------------------------------------------
*/

export async function listEnvironments(
  projectId,
  includeArchived = false
) {

  const normalizedProjectId =
    normalizeProjectId(
      projectId
    );


  return executeRequest(
    () =>
      api.get(
        API_PREFIX,
        {
          params: {
            projectId:
              normalizedProjectId
                .replace(/%20/g, " "),

            includeArchived,
          },

          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to load environments."
  );
}


/*
|--------------------------------------------------------------------------
| GET ENVIRONMENT
|--------------------------------------------------------------------------
|
| GET /api/environments/:projectId/:environmentName
|
|--------------------------------------------------------------------------
*/

export async function getEnvironment(
  projectId,
  environmentName
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${project}/${environment}`,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to load the environment."
  );
}


/*
|--------------------------------------------------------------------------
| CONFIGURATION SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/environments/:projectId/:environmentName/summary
|
|--------------------------------------------------------------------------
*/

export async function getConfigurationSummary(
  projectId,
  environmentName
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${project}/${environment}/summary`,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to load the environment configuration summary."
  );
}


/*
|--------------------------------------------------------------------------
| VALIDATE ENVIRONMENT
|--------------------------------------------------------------------------
|
| POST /api/environments/:projectId/:environmentName/validate
|
|--------------------------------------------------------------------------
*/

export async function validateEnvironment(
  projectId,
  environmentName
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${project}/${environment}/validate`,
        undefined,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to validate the environment."
  );
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT READINESS
|--------------------------------------------------------------------------
|
| GET /api/environments/:projectId/:environmentName/deployment-readiness
|
| This endpoint is metadata-only.
| The frontend never receives deployment secrets.
|
|--------------------------------------------------------------------------
*/

export async function getDeploymentReadiness(
  projectId,
  environmentName
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${project}/${environment}/deployment-readiness`,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to check environment deployment readiness."
  );
}


/*
|--------------------------------------------------------------------------
| ADD VARIABLE
|--------------------------------------------------------------------------
|
| POST /api/environments/:projectId/:environmentName/variables
|
|--------------------------------------------------------------------------
*/

export async function addVariable(
  projectId,
  environmentName,
  variableData
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  validateObject(
    variableData,
    "Environment variable data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${project}/${environment}/variables`,
        variableData,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to add the environment variable."
  );
}


/*
|--------------------------------------------------------------------------
| UPDATE VARIABLE
|--------------------------------------------------------------------------
|
| PATCH /api/environments/:projectId/:environmentName/variables/:key
|
|--------------------------------------------------------------------------
*/

export async function updateVariable(
  projectId,
  environmentName,
  currentKey,
  variableData
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );

  const key =
    normalizeVariableKey(
      currentKey
    );


  validateObject(
    variableData,
    "Environment variable data must be a valid object."
  );


  return executeRequest(
    () =>
      api.patch(
        `${API_PREFIX}/${project}/${environment}/variables/${key}`,
        variableData,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to update the environment variable."
  );
}


/*
|--------------------------------------------------------------------------
| DELETE VARIABLE
|--------------------------------------------------------------------------
|
| DELETE /api/environments/:projectId/:environmentName/variables/:key
|
|--------------------------------------------------------------------------
*/

export async function deleteVariable(
  projectId,
  environmentName,
  key,
  options = {}
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );

  const variableKey =
    normalizeVariableKey(
      key
    );


  return executeRequest(
    () =>
      api.delete(
        `${API_PREFIX}/${project}/${environment}/variables/${variableKey}`,
        {
          data:
            options,

          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to delete the environment variable."
  );
}


/*
|--------------------------------------------------------------------------
| ARCHIVE ENVIRONMENT
|--------------------------------------------------------------------------
|
| POST /api/environments/:projectId/:environmentName/archive
|
|--------------------------------------------------------------------------
*/

export async function archiveEnvironment(
  projectId,
  environmentName
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${project}/${environment}/archive`,
        undefined,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to archive the environment."
  );
}


/*
|--------------------------------------------------------------------------
| UNARCHIVE ENVIRONMENT
|--------------------------------------------------------------------------
|
| POST /api/environments/:projectId/:environmentName/unarchive
|
|--------------------------------------------------------------------------
*/

export async function unarchiveEnvironment(
  projectId,
  environmentName
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${project}/${environment}/unarchive`,
        undefined,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to restore the environment."
  );
}


/*
|--------------------------------------------------------------------------
| DELETE ENVIRONMENT
|--------------------------------------------------------------------------
|
| DELETE /api/environments/:projectId/:environmentName
|
|--------------------------------------------------------------------------
*/

export async function deleteEnvironment(
  projectId,
  environmentName
) {

  const project =
    normalizeProjectId(
      projectId
    );

  const environment =
    normalizeEnvironmentName(
      environmentName
    );


  return executeRequest(
    () =>
      api.delete(
        `${API_PREFIX}/${project}/${environment}`,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to delete the environment."
  );
}


/*
|--------------------------------------------------------------------------
| COPY ENVIRONMENT
|--------------------------------------------------------------------------
|
| POST /api/environments/copy
|
| Browser requests are intentionally restricted to
| metadata/configuration copying.
|
| Secret copying is controlled by the backend and
| must not be requested by the browser.
|
|--------------------------------------------------------------------------
*/

export async function copyEnvironment(
  copyData
) {

  validateObject(
    copyData,
    "Copy environment data must be a valid object."
  );


  const payload = {
    ...copyData,

    copySecrets:
      false,
  };


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/copy`,
        payload,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to copy the environment."
  );
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT SNAPSHOT
|--------------------------------------------------------------------------
|
| POST /api/environments/deployment-snapshot
|
| This is the frontend-safe metadata snapshot operation.
|
|--------------------------------------------------------------------------
*/

export async function createDeploymentSnapshot(
  snapshotData
) {

  validateObject(
    snapshotData,
    "Deployment snapshot data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/deployment-snapshot`,
        snapshotData,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to create the deployment environment snapshot."
  );
}


/*
|--------------------------------------------------------------------------
| MARK DEPLOYED
|--------------------------------------------------------------------------
|
| POST /api/environments/mark-deployed
|
|--------------------------------------------------------------------------
*/

export async function markDeployed(
  deploymentData
) {

  validateObject(
    deploymentData,
    "Deployment data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/mark-deployed`,
        deploymentData,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to mark the environment as deployed."
  );
}


/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
|
| GET /api/environments/health
|
|--------------------------------------------------------------------------
*/

export async function health() {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/health`,
        {
          timeout:
            DEFAULT_ENVIRONMENT_TIMEOUT,
        }
      ),
    "Unable to check environment service health."
  );
}


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const environmentService = {

  createEnvironment,

  listEnvironments,

  getEnvironment,

  getConfigurationSummary,

  validateEnvironment,

  getDeploymentReadiness,

  addVariable,

  updateVariable,

  deleteVariable,

  archiveEnvironment,

  unarchiveEnvironment,

  deleteEnvironment,

  copyEnvironment,

  createDeploymentSnapshot,

  markDeployed,

  health,
};


export default environmentService;
