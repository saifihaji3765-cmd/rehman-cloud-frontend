import api from "./api";

/*
 * =========================================================
 * ZYRIONOS — WORKSPACE SERVICE
 * Enterprise Workspace API Layer
 *
 * Responsibilities:
 * - Project creation
 * - Project retrieval
 * - Project update
 * - Project deletion
 * - Project deployment
 * - Safe project ID handling
 * - Consistent API error handling
 *
 * IMPORTANT:
 * This service uses the REAL backend.
 * No mock/fake project data is created here.
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
 * Safely normalize and encode a project ID.
 */
function normalizeProjectId(projectId) {
  if (
    projectId === undefined ||
    projectId === null ||
    String(projectId).trim() === ""
  ) {
    throw new Error("Project ID is required.");
  }

  return encodeURIComponent(
    String(projectId).trim()
  );
}


/**
 * Validate project payload.
 */
function validateProjectData(projectData) {
  if (
    !projectData ||
    typeof projectData !== "object" ||
    Array.isArray(projectData)
  ) {
    throw new Error(
      "Project data must be a valid object."
    );
  }
}


/**
 * Normalize service errors.
 *
 * api.js preserves the original Axios error,
 * so we can safely read:
 *
 * error.response.data
 * error.response.status
 * error.message
 */
function normalizeApiError(
  error,
  fallbackMessage
) {
  const responseData =
    error?.response?.data;

  const backendMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.detail;

  const status =
    error?.response?.status ??
    error?.status ??
    null;

  const message =
    backendMessage ||
    error?.message ||
    fallbackMessage;

  const normalizedError =
    new Error(String(message));

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


/* =========================================================
   CREATE PROJECT
========================================================= */

/**
 * POST /api/projects/create
 */
export async function createProject(
  projectData
) {
  try {
    validateProjectData(
      projectData
    );

    return await api.post(
      `${API_PREFIX}/create`,
      projectData
    );
  } catch (error) {
    throw normalizeApiError(
      error,
      "Unable to create the project."
    );
  }
}


/* =========================================================
   GET MY PROJECTS
========================================================= */

/**
 * GET /api/projects/me
 */
export async function getProjects() {
  try {
    return await api.get(
      `${API_PREFIX}/me`
    );
  } catch (error) {
    throw normalizeApiError(
      error,
      "Unable to load your projects."
    );
  }
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
  try {
    const id =
      normalizeProjectId(
        projectId
      );

    return await api.get(
      `${API_PREFIX}/${id}`
    );
  } catch (error) {
    throw normalizeApiError(
      error,
      "Unable to load the project."
    );
  }
}


/* =========================================================
   UPDATE PROJECT
========================================================= */

/**
 * PUT /api/projects/update/:projectId
 */
export async function updateProject(
  projectId,
  projectData
) {
  try {
    const id =
      normalizeProjectId(
        projectId
      );

    validateProjectData(
      projectData
    );

    return await api.put(
      `${API_PREFIX}/update/${id}`,
      projectData
    );
  } catch (error) {
    throw normalizeApiError(
      error,
      "Unable to update the project."
    );
  }
}


/* =========================================================
   DELETE PROJECT
========================================================= */

/**
 * DELETE /api/projects/delete/:projectId
 */
export async function deleteProject(
  projectId
) {
  try {
    const id =
      normalizeProjectId(
        projectId
      );

    return await api.delete(
      `${API_PREFIX}/delete/${id}`
    );
  } catch (error) {
    throw normalizeApiError(
      error,
      "Unable to delete the project."
    );
  }
}


/* =========================================================
   DEPLOY PROJECT
========================================================= */

/**
 * POST /api/projects/deploy/:projectId
 *
 * The backend is expected to return deployment
 * information in its response.
 */
export async function deployProject(
  projectId
) {
  try {
    const id =
      normalizeProjectId(
        projectId
      );

    return await api.post(
      `${API_PREFIX}/deploy/${id}`
    );
  } catch (error) {
    throw normalizeApiError(
      error,
      "Unable to deploy the project."
    );
  }
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
};

export default workspaceService;
