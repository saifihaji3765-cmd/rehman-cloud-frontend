import api from "./api";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — ENTERPRISE PROJECT SERVICE
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| PROJECT
| - Create
| - List
| - Retrieve
| - Update
| - Delete
| - Deploy
|
| PREVIEW
| - Create authoritative preview
| - Get active preview
| - List previews
| - Get preview by ID
| - Health check
| - Stop preview
| - Expire preview
|
| INFRASTRUCTURE
| - Project ID normalization
| - Build ID validation
| - Preview ID validation
| - Consistent API error normalization
| - Timeout control
| - Safe request execution
|
| Backend remains authoritative.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| API PREFIX
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
 * Creating a preview can involve:
 *
 * - artifact verification
 * - artifact extraction
 * - dependency preparation
 * - Docker runtime creation
 * - health check
 *
 * Therefore it receives a longer timeout.
 */

const PREVIEW_CREATE_TIMEOUT =
  180000;


/*
 * Preview health/read operations
 * should remain relatively fast.
 */

const PREVIEW_READ_TIMEOUT =
  30000;


/*
 * Stop/expire operations should not
 * need the full creation timeout.
 */

const PREVIEW_CONTROL_TIMEOUT =
  30000;


/*
|--------------------------------------------------------------------------
| INTERNAL HELPERS
|--------------------------------------------------------------------------
*/


/*
 * Normalize project ID.
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

  /*
   * Project IDs must never contain
   * path traversal or control characters.
   */

  if (
    normalizedId.includes("/") ||
    normalizedId.includes("\\") ||
    normalizedId.includes("..") ||
    /[\r\n\t]/.test(
      normalizedId
    )
  ) {
    throw new Error(
      "Invalid Project ID."
    );
  }

  return encodeURIComponent(
    normalizedId
  );
}


/*
 * Normalize build ID.
 */

function normalizeBuildId(
  buildId
) {

  if (
    buildId === undefined ||
    buildId === null
  ) {
    throw new Error(
      "Build ID is required."
    );
  }

  const normalizedId =
    String(
      buildId
    ).trim();

  if (!normalizedId) {
    throw new Error(
      "Build ID is required."
    );
  }

  if (
    normalizedId.length > 300
  ) {
    throw new Error(
      "Build ID is too long."
    );
  }

  if (
    normalizedId.includes("/") ||
    normalizedId.includes("\\") ||
    normalizedId.includes("..") ||
    /[\r\n\t]/.test(
      normalizedId
    )
  ) {
    throw new Error(
      "Invalid Build ID."
    );
  }

  return normalizedId;
}


/*
 * Normalize preview ID.
 */

function normalizePreviewId(
  previewId
) {

  if (
    previewId === undefined ||
    previewId === null
  ) {
    throw new Error(
      "Preview ID is required."
    );
  }

  const normalizedId =
    String(
      previewId
    ).trim();

  if (!normalizedId) {
    throw new Error(
      "Preview ID is required."
    );
  }

  if (
    normalizedId.length > 300
  ) {
    throw new Error(
      "Preview ID is too long."
    );
  }

  if (
    normalizedId.includes("/") ||
    normalizedId.includes("\\") ||
    normalizedId.includes("..") ||
    /[\r\n\t]/.test(
      normalizedId
    )
  ) {
    throw new Error(
      "Invalid Preview ID."
    );
  }

  return normalizedId;
}


/*
 * Validate generic project data.
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


/*
 * Validate preview creation payload.
 */

function validatePreviewOptions(
  options
) {

  if (
    options === null ||
    options === undefined ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error(
      "Preview options must be a valid object."
    );
  }

  if (
    options.buildId === undefined ||
    options.buildId === null ||
    String(
      options.buildId
    ).trim() === ""
  ) {
    throw new Error(
      "Authoritative build ID is required to create a preview."
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


  /*
   * Backend response formats supported:
   *
   * {
   *   message
   * }
   *
   * {
   *   error: {
   *      message
   *   }
   * }
   *
   * {
   *   data: ...
   * }
   */

  const backendMessage =
    responseData?.message ||
    responseData?.error?.message ||
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
      "The requested resource could not be found.";
  }


  /*
   * Conflict
   */

  if (
    status === 409 &&
    !backendMessage
  ) {

    message =
      "This operation could not be completed because the resource is in a conflicting state.";
  }


  /*
   * Validation
   */

  if (
    status === 422 &&
    !backendMessage
  ) {

    message =
      "The request could not be validated.";
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
      "The server encountered an error. Please try again later.";
  }


  const normalizedError =
    new Error(
      String(message)
    );


  /*
   * Preserve useful metadata.
   */

  normalizedError.status =
    status;

  normalizedError.code =
    responseData?.code ||
    responseData?.error?.code ||
    error?.code ||
    null;

  normalizedError.data =
    responseData ||
    error?.data ||
    null;

  normalizedError.isProjectError =
    true;


  normalizedError.isPreviewError =
    Boolean(
      responseData?.preview ||
      responseData?.error?.category ||
      responseData?.error?.stage ||
      error?.isPreviewError
    );


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


  /*
   * Preserve server-provided
   * structured error information.
   */

  normalizedError.details =
    responseData?.error ||
    responseData?.details ||
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
            DEFAULT_PROJECT_TIMEOUT
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
            DEFAULT_PROJECT_TIMEOUT
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
            DEFAULT_PROJECT_TIMEOUT
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
            DEFAULT_PROJECT_TIMEOUT
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
            DEFAULT_PROJECT_TIMEOUT
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
            DEPLOYMENT_TIMEOUT
        }
      ),

    "Unable to deploy the project."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW — CREATE
|--------------------------------------------------------------------------
|
| POST /api/projects/:projectId/preview
|
| IMPORTANT:
|
| buildId MUST be an authoritative successful
| build generated by the backend.
|
| The frontend cannot declare a build successful.
|
|--------------------------------------------------------------------------
*/

export async function createPreview(
  projectId,
  options = {}
) {

  const id =
    normalizeProjectId(
      projectId
    );

  validatePreviewOptions(
    options
  );

  const buildId =
    normalizeBuildId(
      options.buildId
    );


  const payload = {
    buildId
  };


  /*
   * Optional client request metadata.
   *
   * Do not send arbitrary objects from the UI.
   */

  if (
    options.sourceHash
  ) {

    payload.sourceHash =
      String(
        options.sourceHash
      ).trim();
  }


  if (
    options.sourceVersionId
  ) {

    payload.sourceVersionId =
      String(
        options.sourceVersionId
      ).trim();
  }


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/preview`,
        payload,
        {
          timeout:
            PREVIEW_CREATE_TIMEOUT
        }
      ),

    "Unable to create the project preview."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW — GET ACTIVE
|--------------------------------------------------------------------------
|
| GET /api/projects/:projectId/preview
|
|--------------------------------------------------------------------------
*/

export async function getPreview(
  projectId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}/preview`,
        {
          timeout:
            PREVIEW_READ_TIMEOUT
        }
      ),

    "Unable to load the project preview."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW — LIST
|--------------------------------------------------------------------------
|
| GET /api/projects/:projectId/previews
|
|--------------------------------------------------------------------------
*/

export async function listPreviews(
  projectId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}/previews`,
        {
          timeout:
            PREVIEW_READ_TIMEOUT
        }
      ),

    "Unable to load project previews."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW — GET BY ID
|--------------------------------------------------------------------------
|
| GET /api/projects/:projectId/preview/:previewId
|
|--------------------------------------------------------------------------
*/

export async function getPreviewById(
  projectId,
  previewId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  const preview =
    normalizePreviewId(
      previewId
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}/preview/${encodeURIComponent(preview)}`,
        {
          timeout:
            PREVIEW_READ_TIMEOUT
        }
      ),

    "Unable to load the preview."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW — HEALTH
|--------------------------------------------------------------------------
|
| GET /api/projects/:projectId/preview/:previewId/health
|
|--------------------------------------------------------------------------
*/

export async function getPreviewHealth(
  projectId,
  previewId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  const preview =
    normalizePreviewId(
      previewId
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}/preview/${encodeURIComponent(preview)}/health`,
        {
          timeout:
            PREVIEW_READ_TIMEOUT
        }
      ),

    "Unable to check preview health."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW — STOP
|--------------------------------------------------------------------------
|
| POST /api/projects/:projectId/preview/:previewId/stop
|
|--------------------------------------------------------------------------
*/

export async function stopPreview(
  projectId,
  previewId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  const preview =
    normalizePreviewId(
      previewId
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/preview/${encodeURIComponent(preview)}/stop`,
        undefined,
        {
          timeout:
            PREVIEW_CONTROL_TIMEOUT
        }
      ),

    "Unable to stop the project preview."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW — EXPIRE
|--------------------------------------------------------------------------
|
| POST /api/projects/:projectId/preview/:previewId/expire
|
|--------------------------------------------------------------------------
*/

export async function expirePreview(
  projectId,
  previewId
) {

  const id =
    normalizeProjectId(
      projectId
    );

  const preview =
    normalizePreviewId(
      previewId
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/preview/${encodeURIComponent(preview)}/expire`,
        undefined,
        {
          timeout:
            PREVIEW_CONTROL_TIMEOUT
        }
      ),

    "Unable to expire the project preview."
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW RESPONSE HELPERS
|--------------------------------------------------------------------------
|
| These helpers allow Workspace.jsx to work with
| slightly different backend response envelopes
| without duplicating parsing logic.
|
|--------------------------------------------------------------------------
*/


export function getPreviewData(
  response
) {

  return (
    response?.data?.data?.preview ||
    response?.data?.preview ||
    response?.preview ||
    null
  );
}


export function getPreviewList(
  response
) {

  const previews =
    response?.data?.data?.previews ||
    response?.data?.previews ||
    response?.previews ||
    [];

  return Array.isArray(
    previews
  )
    ? previews
    : [];
}


export function getPreviewHealthData(
  response
) {

  return (
    response?.data?.data?.health ||
    response?.data?.health ||
    response?.health ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW STATE HELPERS
|--------------------------------------------------------------------------
*/


export function isPreviewReady(
  preview
) {

  if (!preview) {
    return false;
  }

  const status =
    String(
      preview.status ||
      ""
    ).toLowerCase();


  return (
    status === "running" ||
    status === "ready" ||
    status === "active"
  );
}


export function isPreviewFailed(
  preview
) {

  if (!preview) {
    return false;
  }

  const status =
    String(
      preview.status ||
      ""
    ).toLowerCase();


  return (
    status === "failed" ||
    status === "error" ||
    status === "unhealthy"
  );
}


export function isPreviewStopped(
  preview
) {

  if (!preview) {
    return false;
  }

  const status =
    String(
      preview.status ||
      ""
    ).toLowerCase();


  return (
    status === "stopped" ||
    status === "expired" ||
    status === "terminated"
  );
}


/*
|--------------------------------------------------------------------------
| PREVIEW URL
|--------------------------------------------------------------------------
*/

export function getPreviewUrl(
  preview
) {

  if (!preview) {
    return null;
  }


  const url =
    preview.publicUrl ||
    preview.previewUrl ||
    preview.url ||
    null;


  if (!url) {
    return null;
  }


  return String(
    url
  ).trim() || null;
}


/*
|--------------------------------------------------------------------------
| AUTHORITATIVE BUILD CHECK
|--------------------------------------------------------------------------
|
| Workspace should only create a preview from
| an authoritative successful build.
|
|--------------------------------------------------------------------------
*/

export function isAuthoritativeBuild(
  build
) {

  if (!build) {
    return false;
  }


  const metadata =
    build.metadata ||
    {};


  return (
    build.status ===
      "success" &&
    metadata.authoritative ===
      true &&
    metadata.validationMode ===
      "authoritative"
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
| BUILD ID VALIDATION
|--------------------------------------------------------------------------
*/

export function isValidBuildId(
  buildId
) {

  if (
    buildId === undefined ||
    buildId === null
  ) {
    return false;
  }


  const value =
    String(
      buildId
    ).trim();


  if (!value) {
    return false;
  }


  if (
    value.length > 300 ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    /[\r\n\t]/.test(
      value
    )
  ) {
    return false;
  }


  return true;
}


/*
|--------------------------------------------------------------------------
| PREVIEW ID VALIDATION
|--------------------------------------------------------------------------
*/

export function isValidPreviewId(
  previewId
) {

  if (
    previewId === undefined ||
    previewId === null
  ) {
    return false;
  }


  const value =
    String(
      previewId
    ).trim();


  if (!value) {
    return false;
  }


  if (
    value.length > 300 ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    /[\r\n\t]/.test(
      value
    )
  ) {
    return false;
  }


  return true;
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
| NORMALIZED BUILD ID
|--------------------------------------------------------------------------
*/

export function getNormalizedBuildId(
  buildId
) {

  return normalizeBuildId(
    buildId
  );
}


/*
|--------------------------------------------------------------------------
| NORMALIZED PREVIEW ID
|--------------------------------------------------------------------------
*/

export function getNormalizedPreviewId(
  previewId
) {

  return normalizePreviewId(
    previewId
  );
}


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const projectService = {

  /*
   * Project
   */

  createProject,

  getProjects,

  getProject,

  updateProject,

  deleteProject,

  deployProject,


  /*
   * Preview
   */

  createPreview,

  getPreview,

  listPreviews,

  getPreviewById,

  getPreviewHealth,

  stopPreview,

  expirePreview,


  /*
   * Preview helpers
   */

  getPreviewData,

  getPreviewList,

  getPreviewHealthData,

  getPreviewUrl,

  isPreviewReady,

  isPreviewFailed,

  isPreviewStopped,

  isAuthoritativeBuild,


  /*
   * Validation
   */

  isValidProjectId,

  isValidBuildId,

  isValidPreviewId,


  /*
   * Normalization
   */

  getNormalizedProjectId,

  getNormalizedBuildId,

  getNormalizedPreviewId
};


export default projectService;
