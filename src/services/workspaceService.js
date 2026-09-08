import api from "./api";

/*
 * =========================================================
 * ZYRIONOS — WORKSPACE SERVICE
 * Enterprise Project / Workspace API Layer
 *
 * RESPONSIBILITY
 * ---------------------------------------------------------
 * This service is the single frontend API boundary for
 * project/workspace operations.
 *
 * Handles:
 * - Project creation
 * - Project listing
 * - Single project retrieval
 * - Project update
 * - Project deletion
 * - Project deployment
 * - Project ID normalization
 * - Payload validation
 * - Consistent API error normalization
 *
 * DOES NOT HANDLE
 * ---------------------------------------------------------
 * - UI rendering
 * - React state
 * - Routing
 * - Billing UI
 * - Subscription decisions
 * - Authentication UI
 * - Fake/mock project data
 * - Backend business rules
 *
 * Architecture:
 *
 * Page
 *   ↓
 * workspaceService
 *   ↓
 * api client
 *   ↓
 * Real Backend API
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * Existing backend endpoint paths are intentionally
 * preserved so the current Workspace.jsx integration
 * does not break.
 * =========================================================
 */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_PREFIX = "/api/projects";


/* =========================================================
   INTERNAL HELPERS
========================================================= */

/**
 * Normalize a project ID before it is used in a URL.
 *
 * This prevents:
 * - undefined IDs
 * - null IDs
 * - empty IDs
 * - accidental whitespace
 * - unsafe URL characters
 */
function normalizeProjectId(projectId) {
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

  return encodeURIComponent(
    normalizedId
  );
}


/**
 * Validate an object payload.
 *
 * The service validates shape only.
 * Actual authorization, ownership, plan limits
 * and business rules remain backend responsibilities.
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
 * Normalize backend/API errors into one predictable
 * Error object for the pages consuming this service.
 *
 * api.js is expected to preserve the original Axios
 * response structure.
 */
function normalizeApiError(
  error,
  fallbackMessage
) {
  /*
   * Axios response payload
   */
  const responseData =
    error?.response?.data;


  /*
   * Backend may expose one of several
   * conventional message fields.
   */
  const backendMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.detail ||
    responseData?.reason;


  /*
   * HTTP status
   */
  const status =
    error?.response?.status ??
    error?.status ??
    null;


  /*
   * Final user-facing error message.
   *
   * Do not expose raw backend internals unless
   * the backend intentionally provides a safe message.
   */
  const message =
    backendMessage ||
    error?.message ||
    fallbackMessage;


  const normalizedError =
    new Error(
      String(message)
    );


  /*
   * Preserve useful diagnostic information
   * without coupling pages to Axios.
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


  normalizedError.isWorkspaceError =
    true;


  return normalizedError;
}


/**
 * Execute an API operation through one common
 * error-normalization boundary.
 *
 * This keeps every exported service function
 * consistent.
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


/* =========================================================
   CREATE PROJECT
========================================================= */

/**
 * POST /api/projects/create
 *
 * Expected payload from Workspace:
 *
 * {
 *   projectName,
 *   description,
 *   framework
 * }
 *
 * The backend remains responsible for:
 * - authentication
 * - authorization
 * - ownership
 * - subscription limits
 * - project creation rules
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


/* =========================================================
   GET MY PROJECTS
========================================================= */

/**
 * GET /api/projects/me
 *
 * Returns the authenticated user's projects.
 *
 * Workspace.jsx expects the Axios response so it can
 * consume:
 *
 * response.data.projects
 *
 * or the compatible backend response shape.
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


/* =========================================================
   GET SINGLE PROJECT
========================================================= */

/**
 * GET /api/projects/:projectId
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


/* =========================================================
   UPDATE PROJECT
========================================================= */

/**
 * PUT /api/projects/update/:projectId
 *
 * This function intentionally performs no frontend
 * business-rule enforcement.
 *
 * Backend determines whether the authenticated user
 * can update the project.
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


/* =========================================================
   DELETE PROJECT
========================================================= */

/**
 * DELETE /api/projects/delete/:projectId
 *
 * Destructive authorization must be enforced
 * by the backend.
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


/* =========================================================
   DEPLOY PROJECT
========================================================= */

/**
 * POST /api/projects/deploy/:projectId
 *
 * Expected backend response may contain:
 *
 * data: {
 *   project,
 *   deployment
 * }
 *
 * Workspace.jsx already handles:
 *
 * deployment.liveUrl
 * deployment.url
 * project.liveUrl
 * project.deploymentUrl
 *
 * This service therefore deliberately returns the
 * original API response instead of inventing or
 * reshaping deployment data.
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


/* =========================================================
   OPTIONAL PROJECT OPERATIONS
========================================================= */

/**
 * Small utility for consumers that need to safely
 * determine whether a value can represent a project ID.
 *
 * This does not call the backend.
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


/**
 * Small utility for consumers that need a normalized
 * project identifier without directly handling URL
 * encoding.
 *
 * Kept separate from normalizeProjectId because the
 * internal helper is intentionally private.
 */
export function getNormalizedProjectId(
  projectId
) {
  return normalizeProjectId(
    projectId
  );
}


/* =========================================================
   DEFAULT SERVICE OBJECT
========================================================= */

const workspaceService = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  deployProject,
  isValidProjectId,
  getNormalizedProjectId,
};


export default workspaceService;
