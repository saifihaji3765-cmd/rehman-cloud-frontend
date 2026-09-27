import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — ENVIRONMENT SERVICE
|--------------------------------------------------------------------------
|
| Frontend service for:
| - development
| - preview
| - production
| environments.
|
| IMPORTANT:
| - Uses centralized api.js only.
| - Never handles encryption/decryption.
| - Never exposes deployment secrets intentionally.
|--------------------------------------------------------------------------
*/

const BASE_PATH = "/api/environments";

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
| ENVIRONMENT SERVICE
|--------------------------------------------------------------------------
*/

const environmentService = {
  /*
   * Create environment
   */
  async createEnvironment(payload) {
    const response = await api.post(
      BASE_PATH,
      payload
    );

    return getPayload(response);
  },

  /*
   * List environments
   */
  async listEnvironments({
    projectId,
    includeArchived = false,
  } = {}) {
    const response = await api.get(
      BASE_PATH,
      {
        params: {
          projectId,
          includeArchived,
        },
      }
    );

    return getPayload(response);
  },

  /*
   * Get environment
   */
  async getEnvironment(
    projectId,
    environmentName
  ) {
    const response = await api.get(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}`
    );

    return getPayload(response);
  },

  /*
   * Configuration summary
   */
  async getConfigurationSummary(
    projectId,
    environmentName
  ) {
    const response = await api.get(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/summary`
    );

    return getPayload(response);
  },

  /*
   * Validate environment
   */
  async validateEnvironment(
    projectId,
    environmentName
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/validate`
    );

    return getPayload(response);
  },

  /*
   * Deployment readiness
   *
   * Metadata only.
   * Secret values must never be requested by the browser.
   */
  async getDeploymentReadiness(
    projectId,
    environmentName
  ) {
    const response = await api.get(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/deployment-readiness`
    );

    return getPayload(response);
  },

  /*
   * Add variable
   */
  async addVariable(
    projectId,
    environmentName,
    payload
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/variables`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Update variable
   */
  async updateVariable(
    projectId,
    environmentName,
    currentKey,
    payload
  ) {
    const response = await api.patch(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/variables/${encodeURIComponent(currentKey)}`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Delete variable
   */
  async deleteVariable(
    projectId,
    environmentName,
    key,
    payload = {}
  ) {
    const response = await api.delete(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/variables/${encodeURIComponent(key)}`,
      {
        data: payload,
      }
    );

    return getPayload(response);
  },

  /*
   * Archive environment
   */
  async archiveEnvironment(
    projectId,
    environmentName
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/archive`
    );

    return getPayload(response);
  },

  /*
   * Unarchive environment
   */
  async unarchiveEnvironment(
    projectId,
    environmentName
  ) {
    const response = await api.post(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}/unarchive`
    );

    return getPayload(response);
  },

  /*
   * Delete environment
   */
  async deleteEnvironment(
    projectId,
    environmentName
  ) {
    const response = await api.delete(
      `${BASE_PATH}/${encodeURIComponent(projectId)}/${encodeURIComponent(environmentName)}`
    );

    return getPayload(response);
  },

  /*
   * Copy environment
   *
   * Browser must not request secret copying.
   */
  async copyEnvironment({
    sourceEnvironment,
    targetEnvironment,
    projectId,
    copySecrets = false,
  } = {}) {
    const response = await api.post(
      `${BASE_PATH}/copy`,
      {
        projectId,
        sourceEnvironment,
        targetEnvironment,
        copySecrets: false,
      }
    );

    return getPayload(response);
  },

  /*
   * Deployment snapshot metadata
   */
  async createDeploymentSnapshot({
    projectId,
    environmentName,
    deploymentId,
  } = {}) {
    const response = await api.post(
      `${BASE_PATH}/deployment-snapshot`,
      {
        projectId,
        environmentName,
        deploymentId,
      }
    );

    return getPayload(response);
  },

  /*
   * Mark environment deployed
   */
  async markDeployed({
    projectId,
    environmentName,
    deploymentId,
    version,
  } = {}) {
    const response = await api.post(
      `${BASE_PATH}/mark-deployed`,
      {
        projectId,
        environmentName,
        deploymentId,
        version,
      }
    );

    return getPayload(response);
  },

  /*
   * Health
   */
  async health() {
    const response = await api.get(
      `${BASE_PATH}/health`
    );

    return getPayload(response);
  },
};

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default environmentService;
