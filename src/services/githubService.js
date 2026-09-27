import api from "./api";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — GITHUB SERVICE
|--------------------------------------------------------------------------
|
| Enterprise GitHub API Layer
|
| Responsibilities:
| - GitHub connection management
| - Repository browsing
| - Branch browsing
| - Repository analysis
| - Deployment contract
| - Deployment readiness
| - Deployment preparation
| - Docker handoff
| - AWS handoff
| - Contract sanitization
| - Deployment health
|
| IMPORTANT:
| - Uses centralized api.js.
| - Never stores GitHub access tokens in frontend state.
| - Never calls GitHub directly from browser.
| - Backend remains authoritative.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_PREFIX =
  "/api/github";


const DEFAULT_GITHUB_TIMEOUT =
  30000;


const GITHUB_ANALYSIS_TIMEOUT =
  60000;


const GITHUB_DEPLOYMENT_TIMEOUT =
  60000;


/*
|--------------------------------------------------------------------------
| INTERNAL HELPERS
|--------------------------------------------------------------------------
*/

function normalizeId(
  value,
  fieldName
) {

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {

    throw new Error(
      `${fieldName} is required.`
    );
  }

  return encodeURIComponent(
    String(value).trim()
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

function normalizeGithubError(
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
        "The GitHub request timed out. Please try again.";

    } else if (
      error?.code ===
        "ERR_NETWORK" ||
      error?.isNetworkError
    ) {

      message =
        "Unable to connect to the GitHub service.";

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
      "GitHub authentication is required.";
  }


  /*
   * Permission.
   */

  if (
    status === 403 &&
    !backendMessage
  ) {

    message =
      "You do not have permission to perform this GitHub operation.";
  }


  /*
   * Not found.
   */

  if (
    status === 404 &&
    !backendMessage
  ) {

    message =
      "The requested GitHub resource could not be found.";
  }


  /*
   * Conflict.
   */

  if (
    status === 409 &&
    !backendMessage
  ) {

    message =
      "The GitHub operation conflicts with the current state.";
  }


  /*
   * Validation.
   */

  if (
    status === 422 &&
    !backendMessage
  ) {

    message =
      "The GitHub request could not be validated.";
  }


  /*
   * Rate limit.
   */

  if (
    status === 429 &&
    !backendMessage
  ) {

    message =
      "GitHub requests are currently rate limited. Please try again later.";
  }


  /*
   * Server error.
   */

  if (
    status >= 500 &&
    !backendMessage
  ) {

    message =
      "The GitHub service encountered a server error.";
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

  normalizedError.isGithubError =
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

    throw normalizeGithubError(
      error,
      fallbackMessage
    );
  }
}


/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
*/

export async function health() {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/health`,
        {
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to check GitHub service health."
  );
}


/*
|--------------------------------------------------------------------------
| CONNECTIONS
|--------------------------------------------------------------------------
*/

export async function getConnections(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/connections`,
        {
          params,
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load GitHub connections."
  );
}


export async function getConnection(
  connectionId
) {

  const id =
    normalizeId(
      connectionId,
      "GitHub connection ID"
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/connections/${id}`,
        {
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load the GitHub connection."
  );
}


export async function createConnection(
  connectionData
) {

  validateObject(
    connectionData,
    "GitHub connection data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/connections`,
        connectionData,
        {
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to create the GitHub connection."
  );
}


export async function validateConnection(
  connectionId
) {

  const id =
    normalizeId(
      connectionId,
      "GitHub connection ID"
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/connections/${id}/validate`,
        undefined,
        {
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to validate the GitHub connection."
  );
}


export async function disconnectConnection(
  connectionId
) {

  const id =
    normalizeId(
      connectionId,
      "GitHub connection ID"
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/connections/${id}/disconnect`,
        undefined,
        {
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to disconnect the GitHub connection."
  );
}


/*
|--------------------------------------------------------------------------
| REPOSITORIES
|--------------------------------------------------------------------------
*/

export async function getRepositories(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/repositories`,
        {
          params,
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load GitHub repositories."
  );
}


export async function getRepository(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/repository`,
        {
          params,
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load the GitHub repository."
  );
}


/*
|--------------------------------------------------------------------------
| BRANCHES
|--------------------------------------------------------------------------
*/

export async function getBranches(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/branches`,
        {
          params,
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load GitHub branches."
  );
}


/*
|--------------------------------------------------------------------------
| REPOSITORY TREE
|--------------------------------------------------------------------------
*/

export async function getRepositoryTree(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/tree`,
        {
          params,
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load the GitHub repository tree."
  );
}


/*
|--------------------------------------------------------------------------
| FILE
|--------------------------------------------------------------------------
*/

export async function getFile(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/file`,
        {
          params,
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load the GitHub file."
  );
}


/*
|--------------------------------------------------------------------------
| REPOSITORY ANALYSIS
|--------------------------------------------------------------------------
*/

export async function analyzeRepository(
  analysisData
) {

  validateObject(
    analysisData,
    "Repository analysis data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/analyze`,
        analysisData,
        {
          timeout:
            GITHUB_ANALYSIS_TIMEOUT,
        }
      ),
    "Unable to analyze the GitHub repository."
  );
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT CONTRACT
|--------------------------------------------------------------------------
*/

export async function createDeploymentContract(
  deploymentData
) {

  validateObject(
    deploymentData,
    "Deployment contract data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/deployment-contract`,
        deploymentData,
        {
          timeout:
            GITHUB_DEPLOYMENT_TIMEOUT,
        }
      ),
    "Unable to create the GitHub deployment contract."
  );
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT READINESS
|--------------------------------------------------------------------------
*/

export async function checkDeploymentReadiness(
  deploymentData
) {

  validateObject(
    deploymentData,
    "Deployment readiness data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/deployment-readiness`,
        deploymentData,
        {
          timeout:
            GITHUB_DEPLOYMENT_TIMEOUT,
        }
      ),
    "Unable to check GitHub deployment readiness."
  );
}


/*
|--------------------------------------------------------------------------
| PREPARE DEPLOYMENT
|--------------------------------------------------------------------------
*/

export async function prepareDeployment(
  deploymentData
) {

  validateObject(
    deploymentData,
    "Deployment preparation data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/prepare-deployment`,
        deploymentData,
        {
          timeout:
            GITHUB_DEPLOYMENT_TIMEOUT,
        }
      ),
    "Unable to prepare the GitHub deployment."
  );
}


/*
|--------------------------------------------------------------------------
| DOCKER HANDOFF
|--------------------------------------------------------------------------
*/

export async function prepareDockerHandoff(
  deploymentData
) {

  validateObject(
    deploymentData,
    "Docker handoff data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/docker-handoff`,
        deploymentData,
        {
          timeout:
            GITHUB_DEPLOYMENT_TIMEOUT,
        }
      ),
    "Unable to prepare the Docker handoff."
  );
}


/*
|--------------------------------------------------------------------------
| AWS HANDOFF
|--------------------------------------------------------------------------
*/

export async function prepareAwsHandoff(
  deploymentData
) {

  validateObject(
    deploymentData,
    "AWS handoff data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/aws-handoff`,
        deploymentData,
        {
          timeout:
            GITHUB_DEPLOYMENT_TIMEOUT,
        }
      ),
    "Unable to prepare the AWS handoff."
  );
}


/*
|--------------------------------------------------------------------------
| SANITIZE DEPLOYMENT CONTRACT
|--------------------------------------------------------------------------
*/

export async function sanitizeContract(
  deploymentData
) {

  validateObject(
    deploymentData,
    "Deployment contract data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/sanitize-contract`,
        deploymentData,
        {
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to sanitize the GitHub deployment contract."
  );
}


/*
|--------------------------------------------------------------------------
| DEPLOYMENT HEALTH
|--------------------------------------------------------------------------
*/

export async function getDeploymentHealth(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/deployment-health`,
        {
          params,
          timeout:
            DEFAULT_GITHUB_TIMEOUT,
        }
      ),
    "Unable to load GitHub deployment health."
  );
}


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const githubService = {

  health,

  getConnections,

  getConnection,

  createConnection,

  validateConnection,

  disconnectConnection,

  getRepositories,

  getRepository,

  getBranches,

  getRepositoryTree,

  getFile,

  analyzeRepository,

  createDeploymentContract,

  checkDeploymentReadiness,

  prepareDeployment,

  prepareDockerHandoff,

  prepareAwsHandoff,

  sanitizeContract,

  getDeploymentHealth,
};


export default githubService;
