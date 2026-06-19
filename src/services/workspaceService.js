import api from "./api";

/* =========================
CREATE PROJECT
========================= */

export async function createProject(
  projectData
) {

  return api.post(

    "/api/projects/create",

    projectData

  );

}

/* =========================
MY PROJECTS
========================= */

export async function getProjects() {

  return api.get(

    "/api/projects/me"

  );

}

/* =========================
SINGLE PROJECT
========================= */

export async function getProject(
  projectId
) {

  return api.get(

    `/api/projects/${projectId}`

  );

}

/* =========================
UPDATE PROJECT
========================= */

export async function updateProject(
  projectId,
  data
) {

  return api.put(

    `/api/projects/update/${projectId}`,

    data

  );

}

/* =========================
DELETE PROJECT
========================= */

export async function deleteProject(
  projectId
) {

  return api.remove(

    `/api/projects/delete/${projectId}`

  );

}

/* =========================
DEPLOY PROJECT
========================= */

export async function deployProject(
  projectId
) {

  return api.post(

    `/api/projects/deploy/${projectId}`

  );

}
