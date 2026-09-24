import api from "./api";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — PROJECT SERVICE
|--------------------------------------------------------------------------
|
| Enterprise Project API Layer
|
| Responsibilities:
| - Project creation
| - Project listing
| - Single project retrieval
| - Project update
| - Project deletion
| - Project deployment
| - Project ID normalization
| - Consistent API error normalization
|
| Backend remains authoritative.
|
|--------------------------------------------------------------------------
*/


const API_PREFIX =
  "/api/projects";


/*
|--------------------------------------------------------------------------
| TIMEOUTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PROJECT_TIMEOUT =
  30000;

const DEPLOYMENT_TIMEOUT =
  120000;


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
    projectId === null
  ) {
    throw new Error(
      "Project ID is required."
    );
  }

  const normalizedId =
    String(
      projectId
    ).trim();

  if (!normalizedId) {
    throw new Error(
      "Project ID is required."
    );
  }

  return encodeURIComponent(
    normalizedId
  );
}


function validateProjectData(
  projectData
) {

  if (
    projectData === null ||
    projectData === undefined ||
    typeof projectData !== "object" ||
    Array.isArray(projectData)
  ) {
    throw new Error(
      "Project data must be a valid object."
    );
  }
}


/*
|--------------------------------------------------------------------------
| ERROR NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeApiError(
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
   * Network / timeout
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
        "The request timed out. The backend may still be processing the operation.";

    } else if (
      error?.code ===
        "ERR_NETWORK" ||
      error?.isNetworkError
    ) {

      message =
        "Unable to connect to the server. Please check your connection.";

    } else {

      message =
        "Unable to connect to the server. Please check your internet connection.";
    }
  }


  /*
   * Authentication
   */

  if (
    status === 401 &&
    !backendMessage
  ) {

    message =
      "Authentication required. Please sign in again.";
  }


  /*
   * Authorization
   */

  if (
    status === 403 &&
    !backendMessage
  ) {

    message =
      "You do not have permission to perform this action.";
  }


  /*
   * Not found
   */

  if (
    status === 404 &&
    !backendMessage
  ) {

    message =
      "The requested project could not be found.";
  }


  /*
   * Conflict
   */

  if (
    status === 409 &&
    !backendMessage
  ) {

    message =
      "This project operation could not be completed because of a conflict.";
  }


  /*
   * Validation
   */

  if (
    status === 422 &&
    !backendMessage
  ) {

    message =
      "The project data could not be validated.";
  }


  /*
   * Rate limiting
   */

  if (
    status === 429 &&
    !backendMessage
  ) {

    message =
      "Too many requests. Please wait a moment and try again.";
  }


  /*
   * Server failure
   */

  if (
    status >= 500 &&
    !backendMessage
  ) {

    message =
      "The project service encountered a server error. Please try again later.";
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

  normalizedError.isProjectError =
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

    throw normalizeApiError(
      error,
      fallbackMessage
    );
  }
}


/*
|--------------------------------------------------------------------------
| CREATE PROJECT
|--------------------------------------------------------------------------
|
| POST /api/projects/create
|
|--------------------------------------------------------------------------
*/

export async function createProject(
  projectData
) {

  validateProjectData(
    projectData
  );

  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/create`,
        projectData,
        {
          timeout:
            DEFAULT_PROJECT_TIMEOUT,
        }
      ),
    "Unable to create the project."
  );
}


/*
|--------------------------------------------------------------------------
| GET MY PROJECTS
|--------------------------------------------------------------------------
|
| GET /api/projects/me
|
|--------------------------------------------------------------------------
*/

export async function getProjects() {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/me`,
        {
          timeout:
            DEFAULT_PROJECT_TIMEOUT,
        }
      ),
    "Unable to load your projects."
  );
}


/*
|--------------------------------------------------------------------------
| GET SINGLE PROJECT
|--------------------------------------------------------------------------
|
| GET /api/projects/:projectId
|
|--------------------------------------------------------------------------
*/

export async function getProject(
  projectId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}`,
        {
          timeout:
            DEFAULT_PROJECT_TIMEOUT,
        }
      ),
    "Unable to load the project."
  );
}


/*
|--------------------------------------------------------------------------
| UPDATE PROJECT
|--------------------------------------------------------------------------
|
| PUT /api/projects/update/:projectId
|
|--------------------------------------------------------------------------
*/

export async function updateProject(
  projectId,
  projectData
) {

  const id =
    normalizeProjectId(
      projectId
    );

  validateProjectData(
    projectData
  );

  return executeRequest(
    () =>
      api.put(
        `${API_PREFIX}/update/${id}`,
        projectData,
        {
          timeout:
            DEFAULT_PROJECT_TIMEOUT,
        }
      ),
    "Unable to update the project."
  );
}


/*
|--------------------------------------------------------------------------
| DELETE PROJECT
|--------------------------------------------------------------------------
|
| DELETE /api/projects/delete/:projectId
|
|--------------------------------------------------------------------------
*/

export async function deleteProject(
  projectId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  return executeRequest(
    () =>
      api.delete(
        `${API_PREFIX}/delete/${id}`,
        {
          timeout:
            DEFAULT_PROJECT_TIMEOUT,
        }
      ),
    "Unable to delete the project."
  );
}


/*
|--------------------------------------------------------------------------
| DEPLOY PROJECT
|--------------------------------------------------------------------------
|
| POST /api/projects/deploy/:projectId
|
| Deployment can legitimately take longer than
| ordinary project CRUD requests.
|
|--------------------------------------------------------------------------
*/

export async function deployProject(
  projectId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/deploy/${id}`,
        undefined,
        {
          timeout:
            DEPLOYMENT_TIMEOUT,
        }
      ),
    "Unable to deploy the project."
  );
}


/*
|--------------------------------------------------------------------------
| PROJECT ID VALIDATION
|--------------------------------------------------------------------------
*/

export function isValidProjectId(
  projectId
) {

  if (
    projectId === undefined ||
    projectId === null
  ) {
    return false;
  }

  return (
    String(
      projectId
    ).trim().length > 0
  );
}


/*
|--------------------------------------------------------------------------
| NORMALIZED PROJECT ID
|--------------------------------------------------------------------------
*/

export function getNormalizedProjectId(
  projectId
) {

  return normalizeProjectId(
    projectId
  );
}


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const projectService = {

  createProject,

  getProjects,

  getProject,

  updateProject,

  deleteProject,

  deployProject,

  isValidProjectId,

  getNormalizedProjectId,
};


export default projectService;
