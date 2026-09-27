import api from "./api";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — GITHUB SERVICE
|--------------------------------------------------------------------------
|
| Frontend boundary for GitHub integration.
|
| Responsibilities:
| - GitHub connection
| - repository operations
| - branch operations
| - repository analysis
| - deployment contract preparation
| - Docker/AWS handoff preparation
|
| IMPORTANT:
| - No GitHub token handling in frontend.
| - No direct GitHub API calls.
| - No direct Axios client.
| - Everything goes through api.js.
|--------------------------------------------------------------------------
*/

const BASE_PATH = "/api/github";

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

const githubService = {
  /*
   * Public/backend health
   */
  async health() {
    const response = await api.get(
      `${BASE_PATH}/health`
    );

    return getPayload(response);
  },

  /*
   * Connected GitHub accounts
   */
  async listConnections(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/connections`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Get GitHub connection
   */
  async getConnection(connectionId) {
    const response = await api.get(
      `${BASE_PATH}/connections/${encodeURIComponent(connectionId)}`
    );

    return getPayload(response);
  },

  /*
   * Create connection
   *
   * NOTE:
   * OAuth-based connection should normally be created
   * by the backend callback flow.
   */
  async createConnection(payload) {
    const response = await api.post(
      `${BASE_PATH}/connections`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Validate connection
   */
  async validateConnection(connectionId) {
    const response = await api.post(
      `${BASE_PATH}/connections/${encodeURIComponent(connectionId)}/validate`
    );

    return getPayload(response);
  },

  /*
   * Disconnect GitHub
   */
  async disconnectConnection(connectionId) {
    const response = await api.post(
      `${BASE_PATH}/connections/${encodeURIComponent(connectionId)}/disconnect`
    );

    return getPayload(response);
  },

  /*
   * Repository list
   */
  async listRepositories(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/repositories`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Repository details
   */
  async getRepository(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/repository`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Branch list
   */
  async listBranches(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/branches`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Repository tree/file list
   */
  async getRepositoryTree(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/tree`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Repository file/content
   */
  async getFile(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/file`,
      {
        params,
      }
    );

    return getPayload(response);
  },

  /*
   * Analyze repository
   */
  async analyzeRepository(payload) {
    const response = await api.post(
      `${BASE_PATH}/analyze`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Create deployment contract
   */
  async createDeploymentContract(payload) {
    const response = await api.post(
      `${BASE_PATH}/deployment-contract`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Deployment readiness
   */
  async deploymentReadiness(payload) {
    const response = await api.post(
      `${BASE_PATH}/deployment-readiness`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Prepare deployment
   */
  async prepareDeployment(payload) {
    const response = await api.post(
      `${BASE_PATH}/prepare-deployment`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Docker handoff
   */
  async dockerHandoff(payload) {
    const response = await api.post(
      `${BASE_PATH}/docker-handoff`,
      payload
    );

    return getPayload(response);
  },

  /*
   * AWS handoff
   */
  async awsHandoff(payload) {
    const response = await api.post(
      `${BASE_PATH}/aws-handoff`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Sanitize deployment contract
   */
  async sanitizeContract(payload) {
    const response = await api.post(
      `${BASE_PATH}/sanitize-contract`,
      payload
    );

    return getPayload(response);
  },

  /*
   * Deployment health
   */
  async deploymentHealth(params = {}) {
    const response = await api.get(
      `${BASE_PATH}/deployment-health`,
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

export default githubService;
