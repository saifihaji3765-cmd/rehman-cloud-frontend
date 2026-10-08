import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — ENTERPRISE PROJECT SERVICE
|--------------------------------------------------------------------------
|
| Project lifecycle + Preview lifecycle.
|
| Backend remains authoritative.
|
| Preview flow:
|
|   Authoritative Build
|          ↓
|   POST /projects/:projectId/preview
|          ↓
|   Preview Runtime
|          ↓
|   Health
|          ↓
|   Ready
|
|--------------------------------------------------------------------------
*/


/* ==========================================================================
   API
========================================================================== */

const API_PREFIX = "/api/projects";


/* ==========================================================================
   TIMEOUTS
========================================================================== */

const DEFAULT_PROJECT_TIMEOUT = 30000;

const DEPLOYMENT_TIMEOUT = 120000;

const PREVIEW_CREATE_TIMEOUT = 180000;

const PREVIEW_READ_TIMEOUT = 30000;

const PREVIEW_CONTROL_TIMEOUT = 30000;


/* ==========================================================================
   ID NORMALIZATION
========================================================================== */

function normalizeProjectId(projectId) {
  if (
    projectId === undefined ||
    projectId === null
  ) {
    throw new Error(
      "Project ID is required."
    );
  }

  const value =
    String(projectId).trim();

  if (!value) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (
    value.length > 300 ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    /[\r\n\t]/.test(value)
  ) {
    throw new Error(
      "Invalid Project ID."
    );
  }

  return encodeURIComponent(value);
}


function normalizeBuildId(buildId) {
  if (
    buildId === undefined ||
    buildId === null
  ) {
    throw new Error(
      "Build ID is required."
    );
  }

  const value =
    String(buildId).trim();

  if (!value) {
    throw new Error(
      "Build ID is required."
    );
  }

  if (
    value.length > 300 ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    /[\r\n\t]/.test(value)
  ) {
    throw new Error(
      "Invalid Build ID."
    );
  }

  return value;
}


function normalizePreviewId(previewId) {
  if (
    previewId === undefined ||
    previewId === null
  ) {
    throw new Error(
      "Preview ID is required."
    );
  }

  const value =
    String(previewId).trim();

  if (!value) {
    throw new Error(
      "Preview ID is required."
    );
  }

  if (
    value.length > 300 ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    /[\r\n\t]/.test(value)
  ) {
    throw new Error(
      "Invalid Preview ID."
    );
  }

  return value;
}


/* ==========================================================================
   VALIDATION
========================================================================== */

function validateProjectData(projectData) {
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


function validatePreviewOptions(options) {
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
    !options.buildId ||
    String(options.buildId).trim() === ""
  ) {
    throw new Error(
      "Authoritative build ID is required to create a preview."
    );
  }
}


/* ==========================================================================
   ERROR NORMALIZATION
========================================================================== */

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

  const backendError =
    responseData?.error;

  const backendMessage =
    responseData?.message ||
    (
      typeof backendError === "object"
        ? backendError?.message
        : backendError
    ) ||
    responseData?.detail ||
    responseData?.reason ||
    null;

  let message =
    backendMessage ||
    error?.message ||
    fallbackMessage;


  /* Network / timeout */

  if (!error?.response) {
    if (
      error?.code === "ECONNABORTED" ||
      error?.code === "ETIMEDOUT" ||
      error?.isTimeout
    ) {
      message =
        "The request timed out. The backend may still be processing the operation.";
    } else if (
      error?.code === "ERR_NETWORK" ||
      error?.isNetworkError
    ) {
      message =
        "Unable to connect to the server. Please check your connection.";
    }
  }


  /* HTTP fallback messages */

  if (!backendMessage) {
    if (status === 401) {
      message =
        "Authentication required. Please sign in again.";
    } else if (status === 403) {
      message =
        "You do not have permission to perform this action.";
    } else if (status === 404) {
      message =
        "The requested resource could not be found.";
    } else if (status === 409) {
      message =
        "This operation could not be completed because the resource is in a conflicting state.";
    } else if (status === 422) {
      message =
        "The request could not be validated.";
    } else if (status === 429) {
      message =
        "Too many requests. Please wait a moment and try again.";
    } else if (status >= 500) {
      message =
        "The server encountered an error. Please try again later.";
    }
  }


  const normalized =
    new Error(String(message));

  normalized.status = status;

  normalized.code =
    responseData?.code ||
    (
      typeof backendError === "object"
        ? backendError?.code
        : null
    ) ||
    error?.code ||
    null;

  normalized.data =
    responseData ||
    error?.data ||
    null;

  normalized.details =
    responseData?.details ||
    (
      typeof backendError === "object"
        ? backendError
        : null
    ) ||
    null;

  normalized.isProjectError = true;

  normalized.isPreviewError =
    Boolean(
      responseData?.preview ||
      responseData?.error?.category ||
      responseData?.error?.stage ||
      error?.isPreviewError
    );

  normalized.isTimeout =
    Boolean(
      error?.isTimeout ||
      error?.code === "ECONNABORTED" ||
      error?.code === "ETIMEDOUT"
    );

  normalized.isNetworkError =
    Boolean(
      error?.isNetworkError ||
      error?.code === "ERR_NETWORK"
    );

  normalized.duration =
    error?.config?.metadata?.duration ??
    null;

  return normalized;
}


/* ==========================================================================
   REQUEST EXECUTOR
========================================================================== */

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


/* ==========================================================================
   PROJECT
========================================================================== */

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


/* ==========================================================================
   PREVIEW — CREATE
========================================================================== */

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
    buildId,
  };


  /*
   * These are optional backend hints.
   * Backend remains authoritative.
   */

  if (
    options.sourceHash
  ) {
    const sourceHash =
      String(
        options.sourceHash
      ).trim();

    if (
      sourceHash.length > 0 &&
      sourceHash.length <= 256
    ) {
      payload.sourceHash =
        sourceHash;
    }
  }


  if (
    options.sourceVersionId
  ) {
    const sourceVersionId =
      String(
        options.sourceVersionId
      ).trim();

    if (
      sourceVersionId.length > 0 &&
      sourceVersionId.length <= 300
    ) {
      payload.sourceVersionId =
        sourceVersionId;
    }
  }


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/preview`,
        payload,
        {
          timeout:
            PREVIEW_CREATE_TIMEOUT,
        }
      ),
    "Unable to create the project preview."
  );
}


/* ==========================================================================
   PREVIEW — ACTIVE
========================================================================== */

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
            PREVIEW_READ_TIMEOUT,
        }
      ),
    "Unable to load the project preview."
  );
}


/* ==========================================================================
   PREVIEW — LIST
========================================================================== */

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
            PREVIEW_READ_TIMEOUT,
        }
      ),
    "Unable to load project previews."
  );
}


/* ==========================================================================
   PREVIEW — BY ID
========================================================================== */

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
            PREVIEW_READ_TIMEOUT,
        }
      ),
    "Unable to load the preview."
  );
}


/* ==========================================================================
   PREVIEW — HEALTH
========================================================================== */

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
            PREVIEW_READ_TIMEOUT,
        }
      ),
    "Unable to check preview health."
  );
}


/* ==========================================================================
   PREVIEW — STOP
========================================================================== */

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
            PREVIEW_CONTROL_TIMEOUT,
        }
      ),
    "Unable to stop the project preview."
  );
}


/* ==========================================================================
   PREVIEW — EXPIRE
========================================================================== */

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
            PREVIEW_CONTROL_TIMEOUT,
        }
      ),
    "Unable to expire the project preview."
  );
}


/* ==========================================================================
   RESPONSE UNWRAPPING
========================================================================== */

/*
 * Handles:
 *
 * Axios:
 *   response.data
 *
 * Backend:
 *   { data: ... }
 *
 * Backend:
 *   { data: { data: ... } }
 */

function unwrapResponse(response) {
  let root =
    response?.data !== undefined
      ? response.data
      : response;

  if (
    root &&
    typeof root === "object" &&
    !Array.isArray(root) &&
    root.data !== undefined
  ) {
    root = root.data;
  }

  if (
    root &&
    typeof root === "object" &&
    !Array.isArray(root) &&
    root.data !== undefined &&
    (
      root.preview ||
      root.health ||
      root.previews
    )
  ) {
    root = root.data;
  }

  return root;
}


/* ==========================================================================
   PREVIEW RESPONSE HELPERS
========================================================================== */

export function getPreviewData(
  response
) {
  const root =
    unwrapResponse(
      response
    );

  if (
    root?.preview &&
    typeof root.preview ===
      "object"
  ) {
    return root.preview;
  }

  /*
   * Some backend responses may return
   * the preview directly.
   */

  if (
    root &&
    typeof root === "object" &&
    !Array.isArray(root) &&
    (
      root.previewId ||
      root.buildId ||
      root.status
    )
  ) {
    return root;
  }

  return null;
}


export function getPreviewList(
  response
) {
  const root =
    unwrapResponse(
      response
    );

  if (
    Array.isArray(
      root?.previews
    )
  ) {
    return root.previews;
  }

  if (
    Array.isArray(root)
  ) {
    return root;
  }

  return [];
}


/* ==========================================================================
   HEALTH RESPONSE NORMALIZATION
========================================================================== */

export function getPreviewHealthData(
  response
) {
  const root =
    unwrapResponse(
      response
    );

  /*
   * Preferred backend shape:
   *
   * {
   *   preview,
   *   health
   * }
   */

  const preview =
    root?.preview &&
    typeof root.preview ===
      "object"
      ? root.preview
      : null;

  const health =
    root?.health &&
    typeof root.health ===
      "object"
      ? root.health
      : (
          root?.status ||
          root?.healthy !== undefined
        )
        ? root
        : null;

  return {
    preview,
    health,
  };
}


/*
 * Returns the preview object from a health
 * response whenever the backend includes it.
 */

export function getPreviewFromHealthResponse(
  response
) {
  const {
    preview,
  } =
    getPreviewHealthData(
      response
    );

  return preview;
}


/* ==========================================================================
   PREVIEW STATE HELPERS
========================================================================== */

export function isPreviewReady(
  preview
) {
  if (!preview) {
    return false;
  }

  const status =
    String(
      preview.status ||
      preview.runtimeInfo?.status ||
      ""
    ).toLowerCase();

  return (
    status === "ready" ||
    status === "running" ||
    status === "active" ||
    status === "healthy"
  );
}


export function isPreviewStarting(
  preview
) {
  if (!preview) {
    return false;
  }

  const status =
    String(
      preview.status ||
      preview.runtimeInfo?.status ||
      ""
    ).toLowerCase();

  return [
    "queued",
    "building",
    "starting",
    "pending",
  ].includes(status);
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
      preview.runtimeInfo?.status ||
      ""
    ).toLowerCase();

  return [
    "failed",
    "error",
    "unhealthy",
    "crashed",
  ].includes(status);
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
      preview.runtimeInfo?.status ||
      ""
    ).toLowerCase();

  return [
    "stopped",
    "expired",
    "cancelled",
    "terminated",
  ].includes(status);
}


/* ==========================================================================
   PREVIEW URL
========================================================================== */

export function getPreviewUrl(
  preview
) {
  if (!preview) {
    return null;
  }

  const value =
    preview.publicUrl ||
    preview.previewUrl ||
    preview.url ||
    null;

  if (!value) {
    return null;
  }

  const url =
    String(value).trim();

  return url || null;
}


/* ==========================================================================
   AUTHORITATIVE BUILD HELPERS
========================================================================== */

export function getAuthoritativeBuildId(
  build
) {
  if (!build) {
    return "";
  }

  const metadata =
    build.metadata ||
    {};

  const authoritative =
    build.authoritative === true ||
    metadata.authoritative === true;

  const validationMode =
    build.validationMode ||
    metadata.validationMode ||
    "";

  const buildId =
    build.buildId ||
    build.id ||
    build._id ||
    "";

  if (
    !authoritative ||
    validationMode !==
      "authoritative"
  ) {
    return "";
  }

  return String(
    buildId
  ).trim();
}


export function isAuthoritativeBuild(
  build
) {
  if (!build) {
    return false;
  }

  const metadata =
    build.metadata ||
    {};

  const status =
    String(
      build.status ||
      ""
    ).toLowerCase();

  const authoritative =
    build.authoritative === true ||
    metadata.authoritative === true;

  const validationMode =
    build.validationMode ||
    metadata.validationMode ||
    "";

  return (
    status === "success" &&
    authoritative === true &&
    validationMode ===
      "authoritative" &&
    Boolean(
      getAuthoritativeBuildId(
        build
      )
    )
  );
}


/* ==========================================================================
   ID VALIDATION EXPORTS
========================================================================== */

export function isValidProjectId(
  projectId
) {
  try {
    normalizeProjectId(
      projectId
    );

    return true;
  } catch {
    return false;
  }
}


export function isValidBuildId(
  buildId
) {
  try {
    normalizeBuildId(
      buildId
    );

    return true;
  } catch {
    return false;
  }
}


export function isValidPreviewId(
  previewId
) {
  try {
    normalizePreviewId(
      previewId
    );

    return true;
  } catch {
    return false;
  }
}


/* ==========================================================================
   NORMALIZATION EXPORTS
========================================================================== */

export function getNormalizedProjectId(
  projectId
) {
  return normalizeProjectId(
    projectId
  );
}


export function getNormalizedBuildId(
  buildId
) {
  return normalizeBuildId(
    buildId
  );
}


export function getNormalizedPreviewId(
  previewId
) {
  return normalizePreviewId(
    previewId
  );
}


/* ==========================================================================
   DEFAULT EXPORT
========================================================================== */

const projectService = {
  /* Project */
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  deployProject,

  /* Preview */
  createPreview,
  getPreview,
  listPreviews,
  getPreviewById,
  getPreviewHealth,
  stopPreview,
  expirePreview,

  /* Response */
  getPreviewData,
  getPreviewList,
  getPreviewHealthData,
  getPreviewFromHealthResponse,

  /* Preview state */
  isPreviewReady,
  isPreviewStarting,
  isPreviewFailed,
  isPreviewStopped,
  getPreviewUrl,

  /* Build */
  getAuthoritativeBuildId,
  isAuthoritativeBuild,

  /* Validation */
  isValidProjectId,
  isValidBuildId,
  isValidPreviewId,

  /* Normalization */
  getNormalizedProjectId,
  getNormalizedBuildId,
  getNormalizedPreviewId,
};

export default projectService;
