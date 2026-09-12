import api from "./api";

/*
 * =========================================================
 * ZYRIONOS — AI SERVICE
 * Enterprise AI API Layer
 *
 * Architecture:
 *
 * Workspace / UI
 *      ↓
 * aiService
 *      ↓
 * api.js
 *      ↓
 * ZyrionOS Backend
 *      ↓
 * Master Agent
 *      ↓
 * AI Agents
 *
 * IMPORTANT:
 * - Real backend only
 * - No mock/fake responses
 * - No API keys in frontend
 * - Centralized API communication
 * =========================================================
 */


/* =========================================================
   INTERNAL HELPERS
========================================================= */

/**
 * Normalize backend errors into a predictable Error object.
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
 * Execute an API request through api.js.
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
 * Validate required prompt.
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
 * Validate project ID.
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
 * Request:
 *
 * {
 *   prompt,
 *   framework
 * }
 *
 * Response:
 *
 * Backend response is returned
 * unchanged so Workspace can
 * consume the real orchestration
 * and generated files.
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
   RESPONSE HELPERS
========================================================= */

/**
 * Get the actual Master Agent result
 * from the standardized API response.
 *
 * Current backend structure:
 *
 * formatResponse({
 *   success,
 *   message,
 *   data: result
 * })
 *
 * Axios:
 *
 * response.data
 *
 * Therefore:
 *
 * response.data.data
 *
 * contains the Master Agent result.
 */
export function getAIResult(
  response
) {

  if (
    response === undefined ||
    response === null
  ) {
    return null;
  }

  if (
    response?.data?.data !==
    undefined
  ) {
    return response.data.data;
  }

  if (
    response?.data !== undefined
  ) {
    return response.data;
  }

  return response;
}


/**
 * Extract generated project files
 * from the current Master Agent structure.
 *
 * Current expected path:
 *
 * result
 *   ↓
 * orchestration
 *   ↓
 * buildResult
 *   ↓
 * data
 *   ↓
 * files
 */
export function getGeneratedFiles(
  response
) {

  const result =
    getAIResult(
      response
    );

  const possibleFileCollections = [

    result?.orchestration
      ?.buildResult
      ?.data
      ?.files,

    result?.orchestration
      ?.buildResult
      ?.files,

    result?.buildResult
      ?.data
      ?.files,

    result?.buildResult
      ?.files,

    result?.data
      ?.orchestration
      ?.buildResult
      ?.data
      ?.files,

    result?.data
      ?.orchestration
      ?.buildResult
      ?.files,

    result?.files,

    result?.data?.files,

  ];

  for (
    const files
    of possibleFileCollections
  ) {

    if (
      Array.isArray(files)
    ) {
      return files;
    }

  }

  return [];
}


/**
 * Convert an AI response into text
 * for UI display.
 *
 * This never creates fake content.
 */
export function normalizeAIResponse(
  response
) {

  if (
    response === undefined ||
    response === null
  ) {
    return "";
  }


  const result =
    getAIResult(
      response
    );


  if (
    typeof result ===
    "string"
  ) {
    return result;
  }


  if (
    typeof result?.reply ===
    "string"
  ) {
    return result.reply;
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
    typeof response?.data?.message ===
    "string"
  ) {
    return response.data.message;
  }


  try {

    return JSON.stringify(
      result,
      null,
      2
    );

  } catch {

    return String(
      result
    );

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

  getAIResult,

  getGeneratedFiles,

  normalizeAIResponse,

};


export default aiService;
