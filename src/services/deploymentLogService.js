import api from "./api";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — DEPLOYMENT LOG SERVICE
|--------------------------------------------------------------------------
|
| Enterprise Deployment Log API Layer
|
| Responsibilities:
| - Deployment log creation
| - Log search
| - Active/latest logs
| - Deployment events
| - Progress
| - Stages
| - Errors
| - Warnings
| - Auto-fix trigger
| - Archive
| - Metadata
| - Export
|
| IMPORTANT:
| - Uses centralized api.js.
| - Backend remains the source of truth.
| - Does not fabricate deployment progress.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_PREFIX =
  "/api/deployment-logs";


const DEFAULT_LOG_TIMEOUT =
  30000;


/*
|--------------------------------------------------------------------------
| INTERNAL HELPERS
|--------------------------------------------------------------------------
*/

function normalizeLogId(
  logId
) {

  if (
    logId === undefined ||
    logId === null ||
    String(logId).trim() === ""
  ) {

    throw new Error(
      "Deployment log ID is required."
    );
  }

  return encodeURIComponent(
    String(logId).trim()
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

function normalizeDeploymentLogError(
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
        "The deployment log request timed out.";

    } else if (
      error?.code ===
        "ERR_NETWORK" ||
      error?.isNetworkError
    ) {

      message =
        "Unable to connect to the deployment log service.";

    } else {

      message =
        "Unable to connect to the server.";
    }
  }


  if (
    status === 401 &&
    !backendMessage
  ) {

    message =
      "Authentication required. Please sign in again.";
  }


  if (
    status === 403 &&
    !backendMessage
  ) {

    message =
      "You do not have permission to access deployment logs.";
  }


  if (
    status === 404 &&
    !backendMessage
  ) {

    message =
      "The requested deployment log could not be found.";
  }


  if (
    status === 409 &&
    !backendMessage
  ) {

    message =
      "The deployment log operation conflicts with the current state.";
  }


  if (
    status === 422 &&
    !backendMessage
  ) {

    message =
      "The deployment log data could not be validated.";
  }


  if (
    status === 429 &&
    !backendMessage
  ) {

    message =
      "Too many deployment log requests. Please wait and try again.";
  }


  if (
    status >= 500 &&
    !backendMessage
  ) {

    message =
      "The deployment log service encountered a server error.";
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

  normalizedError.isDeploymentLogError =
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

    throw normalizeDeploymentLogError(
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
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to check deployment log service health."
  );
}


/*
|--------------------------------------------------------------------------
| CREATE LOG
|--------------------------------------------------------------------------
*/

export async function createLog(
  logData
) {

  validateObject(
    logData,
    "Deployment log data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        API_PREFIX,
        logData,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to create the deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| SEARCH LOGS
|--------------------------------------------------------------------------
*/

export async function searchLogs(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        API_PREFIX,
        {
          params,
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to search deployment logs."
  );
}


/*
|--------------------------------------------------------------------------
| ACTIVE LOG
|--------------------------------------------------------------------------
*/

export async function getActiveLog(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/active`,
        {
          params,
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to load the active deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| LATEST LOG
|--------------------------------------------------------------------------
*/

export async function getLatestLog(
  params = {}
) {

  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/latest`,
        {
          params,
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to load the latest deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| GET LOG
|--------------------------------------------------------------------------
*/

export async function getLog(
  logId
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}`,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to load the deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| GET EVENTS
|--------------------------------------------------------------------------
*/

export async function getEvents(
  logId,
  params = {}
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}/events`,
        {
          params,
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to load deployment events."
  );
}


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

export async function startLog(
  logId,
  data = {}
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/start`,
        data,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to start the deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| COMPLETE
|--------------------------------------------------------------------------
*/

export async function completeLog(
  logId,
  data = {}
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/complete`,
        data,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to complete the deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| ADD EVENT
|--------------------------------------------------------------------------
*/

export async function addEvent(
  logId,
  eventData
) {

  const id =
    normalizeLogId(
      logId
    );


  validateObject(
    eventData,
    "Deployment event data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/events`,
        eventData,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to add the deployment event."
  );
}


/*
|--------------------------------------------------------------------------
| PROGRESS
|--------------------------------------------------------------------------
*/

export async function updateProgress(
  logId,
  progressData
) {

  const id =
    normalizeLogId(
      logId
    );


  validateObject(
    progressData,
    "Deployment progress data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/progress`,
        progressData,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to update deployment progress."
  );
}


/*
|--------------------------------------------------------------------------
| STAGE
|--------------------------------------------------------------------------
*/

export async function updateStage(
  logId,
  stageData
) {

  const id =
    normalizeLogId(
      logId
    );


  validateObject(
    stageData,
    "Deployment stage data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/stage`,
        stageData,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to update the deployment stage."
  );
}


/*
|--------------------------------------------------------------------------
| ERROR EVENT
|--------------------------------------------------------------------------
*/

export async function recordError(
  logId,
  errorData
) {

  const id =
    normalizeLogId(
      logId
    );


  validateObject(
    errorData,
    "Deployment error data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/error`,
        errorData,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to record the deployment error."
  );
}


/*
|--------------------------------------------------------------------------
| WARNING EVENT
|--------------------------------------------------------------------------
*/

export async function recordWarning(
  logId,
  warningData
) {

  const id =
    normalizeLogId(
      logId
    );


  validateObject(
    warningData,
    "Deployment warning data must be a valid object."
  );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/warning`,
        warningData,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to record the deployment warning."
  );
}


/*
|--------------------------------------------------------------------------
| AUTO FIX
|--------------------------------------------------------------------------
*/

export async function triggerAutoFix(
  logId,
  data = {}
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/auto-fix`,
        data,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to trigger deployment auto-fix."
  );
}


/*
|--------------------------------------------------------------------------
| ARCHIVE
|--------------------------------------------------------------------------
*/

export async function archiveLog(
  logId
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.post(
        `${API_PREFIX}/${id}/archive`,
        undefined,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to archive the deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| METADATA
|--------------------------------------------------------------------------
*/

export async function getMetadata(
  logId
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}/metadata`,
        {
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to load deployment log metadata."
  );
}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export async function exportLog(
  logId,
  params = {}
) {

  const id =
    normalizeLogId(
      logId
    );


  return executeRequest(
    () =>
      api.get(
        `${API_PREFIX}/${id}/export`,
        {
          params,
          timeout:
            DEFAULT_LOG_TIMEOUT,
        }
      ),
    "Unable to export the deployment log."
  );
}


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const deploymentLogService = {

  health,

  createLog,

  searchLogs,

  getActiveLog,

  getLatestLog,

  getLog,

  getEvents,

  startLog,

  completeLog,

  addEvent,

  updateProgress,

  updateStage,

  recordError,

  recordWarning,

  triggerAutoFix,

  archiveLog,

  getMetadata,

  exportLog,
};


export default deploymentLogService;
