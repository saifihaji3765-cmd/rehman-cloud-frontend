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
| - Project ID validation
| - Project ID normalization
| - Consistent API error normalization
|
| Architecture:
|
| Page / Feature
|       ↓
| projectService
|       ↓
| centralized api client
|       ↓
| REAL BACKEND API
|
| IMPORTANT:
| - No mock data
| - No fake projects
| - No fake deployment URLs
| - No frontend authorization
| - Backend remains authoritative for ownership,
|   permissions, subscription limits and business rules.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_PREFIX = "/api/projects";


/*
|--------------------------------------------------------------------------
| INTERNAL HELPERS
|--------------------------------------------------------------------------
*/


/**
 * Validate a project identifier.
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
    String(projectId).trim();

  if (!normalizedId) {
    throw new Error(
      "Project ID is required."
    );
  }

  /*
   * Encode the ID before putting it into a URL.
   */
  return encodeURIComponent(
    normalizedId
  );
}


/**
 * Validate a project payload.
 *
 * This only validates the basic JavaScript shape.
 *
 * Backend remains responsible for:
 * - Authentication
 * - Authorization
 * - Ownership
 * - Subscription limits
 * - Business rules
 * - Field-level validation
 */
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


/**
 * Normalize API errors into a predictable Error object.
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
   * Network / timeout failures.
   */
  if (!error?.response) {
    if (
      error?.code === "ECONNABORTED"
    ) {
      message =
        "The request timed out. Please try again.";
    } else {
      message =
        "Unable to connect to the server. Please check your internet connection.";
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
   * Authorization.
   */
  if (
    status === 403 &&
    !backendMessage
  ) {
    message =
      "You do not have permission to perform this action.";
  }


  /*
   * Project not found.
   */
  if (
    status === 404 &&
    !backendMessage
  ) {
    message =
      "The requested project could not be found.";
  }


  /*
   * Conflict.
   */
  if (
    status === 409 &&
    !backendMessage
  ) {
    message =
      "This project operation could not be completed because of a conflict.";
  }


  /*
   * Rate limiting.
   */
  if (
    status === 429 &&
    !backendMessage
  ) {
    message =
      "Too many requests. Please wait a moment and try again.";
  }


  /*
   * Backend/server failure.
   */
  if (
    status >= 500 &&
    !backendMessage
  ) {
    message =
      "The project service encountered an error. Please try again later.";
  }


  const normalizedError =
    new Error(
      String(message)
    );


  /*
   * Preserve safe diagnostic information.
   */
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


  return normalizedError;
}


/**
 * Execute an API request through one
 * centralized error-normalization boundary.
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
| Existing Workspace payload:
|
| {
|   projectName,
|   description,
|   framework
| }
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
        projectData
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
| Returns projects belonging to the authenticated user.
|
| Backend authorization remains authoritative.
|
|--------------------------------------------------------------------------
*/

export async function getProjects() {
  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/me`
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
        `${API_PREFIX}/${id}`
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
        projectData
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
| This is a destructive operation.
|
| The frontend does not treat possession of a project ID
| as authorization.
|
| Backend must enforce ownership and permission.
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
        `${API_PREFIX}/delete/${id}`
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
| IMPORTANT:
|
| This service does NOT:
| - create a deployment URL
| - force deployment success
| - invent deployment status
| - modify deployment response
|
| The backend response remains authoritative.
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
        `${API_PREFIX}/deploy/${id}`
      ),
    "Unable to deploy the project."
  );
}


/*
|--------------------------------------------------------------------------
| PROJECT ID VALIDATION
|--------------------------------------------------------------------------
|
| Utility for UI/features that need to determine
| whether a project ID exists before calling the API.
|
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
    String(projectId).trim().length > 0
  );
}


/*
|--------------------------------------------------------------------------
| NORMALIZED PROJECT ID
|--------------------------------------------------------------------------
|
| Public utility for consumers that need the
| same ID normalization used internally.
|
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
