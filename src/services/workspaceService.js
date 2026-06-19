import api from "./api";

/* =========================
GENERATE PROJECT
========================= */

export async function generateProject(
  prompt
) {

  return api.post(

    "/api/workspace/generate",

    {

      prompt

    }

  );

}

/* =========================
GET PROJECT
========================= */

export async function getProject(
  projectId
) {

  return api.get(

    `/api/workspace/${projectId}`

  );

}

/* =========================
GET FILES
========================= */

export async function getFiles(
  projectId
) {

  return api.get(

    `/api/workspace/${projectId}/files`

  );

}

/* =========================
GET FILE
========================= */

export async function getFile(
  projectId,
  fileId
) {

  return api.get(

    `/api/workspace/${projectId}/files/${fileId}`

  );

}

/* =========================
SAVE FILE
========================= */

export async function saveFile(

  projectId,

  fileId,

  content

) {

  return api.put(

    `/api/workspace/${projectId}/files/${fileId}`,

    {

      content

    }

  );

}

/* =========================
DELETE PROJECT
========================= */

export async function deleteProject(
  projectId
) {

  return api.remove(

    `/api/workspace/${projectId}`

  );

}
