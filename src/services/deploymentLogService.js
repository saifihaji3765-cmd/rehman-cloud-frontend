import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — DEPLOYMENT LOG SERVICE
|--------------------------------------------------------------------------
|
| Central frontend service for deployment operational logs.
|
| Uses:
|   Page / Workspace
|          ↓
|   deploymentLogService
|          ↓
|   api.js
|          ↓
|   Backend
|
| No direct Axios usage outside api.js.
|--------------------------------------------------------------------------
*/

const BASE_PATH = "/api/deployment-logs";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

function getResponseData(response) {
  return response?.data ?? null;
}

function getPayload(response) {
  const body = getResponseData(response);

  if (
    body &&
    typeof body === "object" &&
    Object.prototype.hasOwnProperty.call(body, "data")
  ) {
    return body.data;
  }

  return body;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

const deploymentLogService = {
  /*
   * Health
   */
  async health() {
    const response = await api.get(
      `${BASE_PATH}/health`
    );

    return getPayload(response);
  },

  /*
   * Create deployment log
   */
  async create(payload) {
    const response = await api.post(
      BASE_PATH,
      payload
    );

    return getPayload(response);
  },

  /*
   * Search logs
   */
  async search(params = {}) {
    const response = await api.get(
      BASE_PATH,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Active deployment log
   */
  async getActive(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/active`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Latest deployment log
   */
  async getLatest(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/latest`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Get deployment log
   */
  async getById(logId) {
    const response = await api.get(
      `${BASE_PATH}/${encodeURIComponent(logId)}`
    );

    return getPayload(response);
  },

  /*
   * Deployment events
   */
  async getEvents(
    logId,
    params = {}
  ) {
    const response = await api.get(
      `${BASE_PATH}/${encodeURIComponent(logId)}/events`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Start deployment log
   */
  async start(logId, payload = {}) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/start`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Complete deployment log
   */
  async complete(logId, payload = {}) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/complete`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Add event
   */
  async addEvent(logId, payload) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/events`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Update progress
   */
  async updateProgress(
    logId,
    payload
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/progress`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Update stage
   */
  async updateStage(
    logId,
    payload
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/stage`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Record deployment error
   */
  async recordError(
    logId,
    payload
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/error`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Record warning
   */
  async recordWarning(
    logId,
    payload
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/warning`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Auto-fix trigger
   */
  async triggerAutoFix(
    logId,
    payload = {}
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/auto-fix`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Archive log
   */
  async archive(logId) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(logId)}/archive`
    );

    return getPayload(response);
  },

  /*
   * Metadata
   */
  async metadata(logId) {
    const response = await api.get(
      `${BASE_PATH}/${encodeURIComponent(logId)}/metadata`
    );

    return getPayload(response);
  },

  /*
   * Export
   */
  async exportLog(
    logId,
    params = {}
  ) {
    const response = await api.get(
      `${BASE_PATH}/${encodeURIComponent(logId)}/export`,
      {
        params,
      }
    );

    return getPayload(response);
  },
};

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default deploymentLogService;
