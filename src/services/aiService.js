import api from "./api";


/* =========================================================
   ZYRIONOS AI SERVICE
   Central frontend AI API layer
   ========================================================= */


/* =========================================================
   TIMEOUTS
========================================================= */

const AI_CHAT_TIMEOUT =
  90000;

const AI_CODE_TIMEOUT =
  120000;

const AI_DEPLOY_TIMEOUT =
  120000;

const AI_THUMBNAIL_TIMEOUT =
  120000;


/* =========================================================
   ERROR NORMALIZATION
========================================================= */

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


  normalizedError.isTimeout =
    Boolean(
      error?.isTimeout ||
      error?.code === "ECONNABORTED" ||
      error?.code === "ETIMEDOUT"
    );


  normalizedError.isNetworkError =
    Boolean(
      error?.isNetworkError ||
      error?.code === "ERR_NETWORK"
    );


  normalizedError.duration =
    error?.config?.metadata?.duration ??
    null;


  return normalizedError;
}


/* =========================================================
   REQUEST EXECUTOR
========================================================= */

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


/* =========================================================
   VALIDATION
========================================================= */

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
        },
        {
          timeout:
            AI_CHAT_TIMEOUT,
        }
      ),

    "Unable to communicate with the AI."
  );
}


/* =========================================================
   CODE GENERATION
========================================================= */

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
        },
        {
          timeout:
            AI_CODE_TIMEOUT,
        }
      ),

    "Unable to generate project code."
  );
}


/* =========================================================
   AI DEPLOY AGENT
========================================================= */

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
        },
        {
          timeout:
            AI_DEPLOY_TIMEOUT,
        }
      ),

    "Unable to start the AI deployment agent."
  );
}


/* =========================================================
   THUMBNAIL
========================================================= */

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
        },
        {
          timeout:
            AI_THUMBNAIL_TIMEOUT,
        }
      ),

    "Unable to generate the thumbnail."
  );
}


/* =========================================================
   AI RESULT
========================================================= */

export function getAIResult(
  response
) {

  if (
    response === undefined ||
    response === null
  ) {
    return null;
  }


  /*
   * Axios:
   *
   * response.data
   *
   * Backend:
   *
   * {
   *   success,
   *   message,
   *   data
   * }
   *
   * Therefore:
   *
   * response.data.data
   */

  if (
    response?.data?.data !==
    undefined
  ) {

    return response.data.data;
  }


  if (
    response?.data !==
    undefined
  ) {

    return response.data;
  }


  return response;
}


/* =========================================================
   GENERATED FILE EXTRACTION
========================================================= */

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

    result?.data
      ?.orchestration
      ?.buildResult
      ?.data
      ?.data
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


/* =========================================================
   RESPONSE TEXT
========================================================= */

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
    typeof result === "string"
  ) {

    return result;
  }


  if (
    typeof result?.reply === "string"
  ) {

    return result.reply;
  }


  if (
    typeof result?.text === "string"
  ) {

    return result.text;
  }


  if (
    typeof result?.content === "string"
  ) {

    return result.content;
  }


  if (
    typeof result?.message === "string"
  ) {

    return result.message;
  }


  if (
    typeof response?.data?.message === "string"
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
   AI RESPONSE METADATA
========================================================= */

export function getAIProviderInfo(
  response
) {

  const result =
    getAIResult(
      response
    );


  return {
    provider:
      result?.provider ||
      result?.orchestration?.provider ||
      result?.orchestration?.buildResult?.provider ||
      null,

    model:
      result?.model ||
      result?.orchestration?.model ||
      result?.orchestration?.buildResult?.model ||
      null,

    success:
      result?.success !== false,

  };
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

  getAIProviderInfo,

};


export default aiService;
