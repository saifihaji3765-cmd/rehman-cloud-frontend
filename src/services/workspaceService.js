import api from "../api";

/*
 * =========================================================
 * ZYRION OS — WORKSPACE SERVICE
 * Enterprise Workspace API Layer
 *
 * Responsibilities:
 * - Project CRUD
 * - Project retrieval
 * - Deployment
 * - Input validation
 * - Safe project-id handling
 * - Consistent error handling
 *
 * IMPORTANT:
 * This service talks to the REAL backend.
 * No mock/fake project data is generated here.
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
 * Safely encode IDs before placing them in URLs.
 */
function normalizeProjectId(projectId) {
  if (
    projectId === undefined ||
    projectId === null ||
    String(projectId).trim() === ""
  ) {
    throw new Error("Project ID is required.");
  }

  return encodeURIComponent(String(projectId).trim());
}

/**
 * Validate project creation/update payloads.
 */
function validateProjectData(projectData) {
  if (
    !projectData ||
    typeof projectData !== "object" ||
    Array.isArray(projectData)
  ) {
    throw new Error("Project data must be a valid object.");
  }
}

/**
 * Convert backend/API errors into useful frontend errors.
 *
 * We do NOT expose internal backend details unnecessarily.
 */
function normalizeApiError(error, fallbackMessage) {
  const responseData = error?.response?.data;

  const backendMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.detail;

  const status = error?.response?.status;

  if (backendMessage) {
    const normalizedError = new Error(
      String(backendMessage)
    );

    normalizedError.status = status;
    normalizedError.code =
      responseData?.code || null;

    return normalizedError;
  }

  if (error?.message) {
    const normalizedError = new Error(
      error.message
    );

    normalizedError.status = status;

    return normalizedError;
  }

  const normalizedError = new Error(
    fallbackMessage
  );

  normalizedError.status = status;

  return normalizedError;
}

/* =========================================================
   CREATE PROJECT
========================================================= */

/**
 * Create a new project using the real backend.
 *
 * Backend:
 * POST /api/projects/create
 */
export async function createProject(projectData) {
  try {
    validateProjectData(projectData);

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
 * Get projects belonging to the authenticated user.
 *
 * Backend:
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
 * Get one complete project from the backend.
 *
 * Backend:
 * GET /api/projects/:projectId
 */
export async function getProject(projectId) {
  try {
    const id = normalizeProjectId(
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
 * Update an existing project.
 *
 * Backend:
 * PUT /api/projects/update/:projectId
 */
export async function updateProject(
  projectId,
  projectData
) {
  try {
    const id = normalizeProjectId(
      projectId
    );

    validateProjectData(projectData);

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
 * Delete a project belonging to the authenticated user.
 *
 * Backend:
 * DELETE /api/projects/delete/:projectId
 */
export async function deleteProject(
  projectId
) {
  try {
    const id = normalizeProjectId(
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
 * Deploy an existing project.
 *
 * IMPORTANT:
 * Keep the actual deployment route that already
 * exists in your backend.
 *
 * If your backend route is different from the one
 * currently used by this project, change ONLY the
 * endpoint below.
 */
export async function deployProject(
  projectId
) {
  try {
    const id = normalizeProjectId(
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
  deployProject
};

export default workspaceService;
