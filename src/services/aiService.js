import api from "./api";

/* =========================
AI CHAT
========================= */

export async function aiChat(
  prompt
) {

  return api.post(

    "/api/ai/chat",

    {
      prompt
    }

  );

}

/* =========================
AI CODE GENERATION
========================= */

export async function generateCode(
  prompt,
  framework = "React"
) {

  return api.post(

    "/api/ai/generate-code",

    {

      prompt,

      framework

    }

  );

}

/* =========================
AI DEPLOY AGENT
========================= */

export async function aiDeploy(
  projectId
) {

  return api.post(

    "/api/ai/deploy-agent",

    {

      projectId

    }

  );

}

/* =========================
AI THUMBNAIL
========================= */

export async function generateThumbnail(
  prompt
) {

  return api.post(

    "/api/ai/thumbnail",

    {

      prompt

    }

  );

}

/* =========================
EXPORT
========================= */

export default {

  aiChat,

  generateCode,

  aiDeploy,

  generateThumbnail

};
