import api from "./api";

/*
 * =========================================================
 * ZYRIONOS — AI SERVICE
 * Enterprise AI API Layer
 *
 * Responsibilities:
 * - AI chat
 * - AI code generation
 * - AI deployment agent
 * - AI thumbnail generation
 *
 * IMPORTANT:
 * This service talks only to the real backend.
 * No mock AI responses are generated here.
 * =========================================================
 */


/* =========================================================
   AI CHAT
========================================================= */

/**
 * POST /api/ai/chat
 */
export async function aiChat(prompt) {
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw new Error(
      "AI chat prompt is required."
    );
  }

  return await api.post(
    "/api/ai/chat",
    {
      prompt: prompt.trim(),
    }
  );
}


/* =========================================================
   AI CODE GENERATION
========================================================= */

/**
 * POST /api/ai/generate-code
 *
 * Used by:
 * Workspace.jsx
 *
 * Arguments:
 * - prompt
 * - framework
 */
export async function generateCode(
  prompt,
  framework = "React"
) {
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw new Error(
      "Code generation prompt is required."
    );
  }

  const normalizedFramework =
    typeof framework === "string" &&
    framework.trim()
      ? framework.trim()
      : "React";

  return await api.post(
    "/api/ai/generate-code",
    {
      prompt: prompt.trim(),
      framework: normalizedFramework,
    }
  );
}


/* =========================================================
   AI DEPLOY AGENT
========================================================= */

/**
 * POST /api/ai/deploy-agent
 */
export async function aiDeploy(
  projectId
) {
  if (
    projectId === undefined ||
    projectId === null ||
    String(projectId).trim() === ""
  ) {
    throw new Error(
      "Project ID is required."
    );
  }

  return await api.post(
    "/api/ai/deploy-agent",
    {
      projectId: String(
        projectId
      ).trim(),
    }
  );
}


/* =========================================================
   AI THUMBNAIL
========================================================= */

/**
 * POST /api/ai/thumbnail
 */
export async function generateThumbnail(
  prompt
) {
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw new Error(
      "Thumbnail prompt is required."
    );
  }

  return await api.post(
    "/api/ai/thumbnail",
    {
      prompt: prompt.trim(),
    }
  );
}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

const aiService = {
  aiChat,
  generateCode,
  aiDeploy,
  generateThumbnail,
};

export default aiService;
