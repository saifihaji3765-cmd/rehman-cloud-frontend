import api from "./api";

/* =========================
CREATE DEPLOYMENT
========================= */

export async function createDeployment(
  projectData
) {

  return api.post(

    "/api/deployments",

    projectData

  );

}

/* =========================
GET DEPLOYMENTS
========================= */

export async function getDeployments() {

  return api.get(

    "/api/deployments"

  );

}

/* =========================
GET DEPLOYMENT
========================= */

export async function getDeployment(
  deploymentId
) {

  return api.get(

    `/api/deployments/${deploymentId}`

  );

}

/* =========================
DELETE DEPLOYMENT
========================= */

export async function deleteDeployment(
  deploymentId
) {

  return api.remove(

    `/api/deployments/${deploymentId}`

  );

}

/* =========================
RESTART DEPLOYMENT
========================= */

export async function restartDeployment(
  deploymentId
) {

  return api.post(

    `/api/deployments/${deploymentId}/restart`

  );

}

/* =========================
DEPLOYMENT LOGS
========================= */

export async function getDeploymentLogs(
  deploymentId
) {

  return api.get(

    `/api/deployments/${deploymentId}/logs`

  );

}
