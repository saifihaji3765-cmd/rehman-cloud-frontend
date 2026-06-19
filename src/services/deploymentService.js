import api from "./api";

/* =========================
DEPLOY PROJECT
========================= */

export async function createDeployment(
  projectData
) {

  return api.post(

    "/api/deploy/deploy",

    projectData

  );

}

/* =========================
DEPLOYMENT STATUS
========================= */

export async function getDeploymentStatus(
  deploymentId
) {

  return api.get(

    `/api/deploy/status/${deploymentId}`

  );

}

/* =========================
DEPLOYMENT LOGS
========================= */

export async function getDeploymentLogs(
  deploymentId
) {

  return api.get(

    `/api/deploy/logs/${deploymentId}`

  );

}

/* =========================
MONITORING
========================= */

export async function getDeploymentMonitoring(
  deploymentId
) {

  return api.get(

    `/api/deploy/monitoring/${deploymentId}`

  );

}

/* =========================
SCALING
========================= */

export async function triggerScaling(
  deploymentId
) {

  return api.post(

    `/api/deploy/scale/${deploymentId}`

  );

}
