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
 * Architecture:
 *
 * UI / Page
 *    ↓
 * aiService
 *    ↓
 * api.js
 *    ↓
 * Backend
 *    ↓
 * AI provider
 *
 * IMPORTANT:
 * - Real backend only
 * - No mock/fake AI responses
 * - No API keys in frontend
 * - No direct axios instance
 * - Centralized API communication through api.js
 * =========================================================
 */


/* =========================================================
   INTERNAL HELPERS
========================================================= */

/**
 * Normalize backend errors without exposing
 * unnecessary implementation details to the UI.
 */
function normalizeAIError(
  error,
  fallbackMessage
) {
  const responseData =
    error?.response?.data;

  const backendMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.detail;

  const status =
    error?.response?.status ??
    error?.status ??
    null;

  const normalizedError =
    new Error(
      String(
        backendMessage ||
        error?.message ||
        fallbackMessage
      )
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

  normalizedError.isAIError =
    true;

  return normalizedError;
}


/**
 * Execute an AI API request through the
 * centralized api.js client.
 */
async function executeAIRequest(
  request,
  fallbackMessage
) {
  try {
    return await request();
  } catch (error) {
    throw normalizeAIError(
      error,
      fallbackMessage
    );
  }
}


/**
 * Validate a required text value.
 */
function validatePrompt(
  value,
  fieldName
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  return value.trim();
}


/**
 * Validate a project ID.
 */
function validateProjectId(
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

  return String(
    projectId
  ).trim();
}


/* =========================================================
   AI CHAT
========================================================= */

/**
 * POST /api/ai/chat
 *
 * Used for general AI conversation.
 */
export async function aiChat(
  prompt
) {
  const normalizedPrompt =
    validatePrompt(
      prompt,
      "AI chat prompt"
    );

  return executeAIRequest(
    () =>
      api.post(
        "/api/ai/chat",
        {
          prompt:
            normalizedPrompt,
        }
      ),
    "Unable to communicate with the AI."
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
 *
 * Example:
 *
 * generateCode(
 *   "Build an AI SaaS dashboard",
 *   "React"
 * );
 */
export async function generateCode(
  prompt,
  framework = "React"
) {
  const normalizedPrompt =
    validatePrompt(
      prompt,
      "Code generation prompt"
    );

  const normalizedFramework =
    typeof framework === "string" &&
    framework.trim()
      ? framework.trim()
      : "React";

  return executeAIRequest(
    () =>
      api.post(
        "/api/ai/generate-code",
        {
          prompt:
            normalizedPrompt,

          framework:
            normalizedFramework,
        }
      ),
    "Unable to generate project code."
  );
}


/* =========================================================
   AI DEPLOY AGENT
========================================================= */

/**
 * POST /api/ai/deploy-agent
 *
 * Sends a real project deployment request
 * to the backend AI deployment agent.
 */
export async function aiDeploy(
  projectId
) {
  const normalizedProjectId =
    validateProjectId(
      projectId
    );

  return executeAIRequest(
    () =>
      api.post(
        "/api/ai/deploy-agent",
        {
          projectId:
            normalizedProjectId,
        }
      ),
    "Unable to start the AI deployment agent."
  );
}


/* =========================================================
   AI THUMBNAIL
========================================================= */

/**
 * POST /api/ai/thumbnail
 *
 * Generates thumbnail data through the
 * real backend AI service.
 */
export async function generateThumbnail(
  prompt
) {
  const normalizedPrompt =
    validatePrompt(
      prompt,
      "Thumbnail prompt"
    );

  return executeAIRequest(
    () =>
      api.post(
        "/api/ai/thumbnail",
        {
          prompt:
            normalizedPrompt,
        }
      ),
    "Unable to generate the thumbnail."
  );
}


/* =========================================================
   AI RESPONSE NORMALIZER
========================================================= */

/**
 * Safely convert a backend AI response to text
 * when a UI component specifically needs text.
 *
 * IMPORTANT:
 * This never invents an AI response.
 */
export function normalizeAIResponse(
  result
) {
  if (
    result === undefined ||
    result === null
  ) {
    return "";
  }

  if (
    typeof result === "string"
  ) {
    return result;
  }

  if (
    typeof result?.text ===
    "string"
  ) {
    return result.text;
  }

  if (
    typeof result?.content ===
    "string"
  ) {
    return result.content;
  }

  if (
    typeof result?.message ===
    "string"
  ) {
    return result.message;
  }

  if (
    typeof result?.data?.text ===
    "string"
  ) {
    return result.data.text;
  }

  if (
    typeof result?.data?.content ===
    "string"
  ) {
    return result.data.content;
  }

  if (
    typeof result?.data?.message ===
    "string"
  ) {
    return result.data.message;
  }

  try {
    return JSON.stringify(
      result,
      null,
      2
    );
  } catch {
    return String(result);
  }
}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

const aiService = {
  aiChat,
  generateCode,
  aiDeploy,
  generateThumbnail,
  normalizeAIResponse,
};

export default aiService;
