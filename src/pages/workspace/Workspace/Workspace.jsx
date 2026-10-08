import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import {
  getProjects,
  createProject,
  updateProject,

  createPreview,
  getPreview,
  getPreviewHealth,
  stopPreview,
} from "../../../services/workspaceService.js";

import {
  generateCode,
  getGeneratedFiles,
  normalizeAIResponse,
} from "../../../services/aiService";

import environmentService from "../../../services/environmentService";
import deploymentLogService from "../../../services/deploymentLogService";
import githubService from "../../../services/githubService";

import styles from "./Workspace.module.css";


/* =========================================================
   CONSTANTS
========================================================= */

const FRAMEWORKS = [
  "React",
  "Next.js",
  "Vue",
  "Node.js",
  "Express",
  "Other",
];

const QUICK_PROMPTS = [
  {
    label: "AI SaaS dashboard",
    prompt:
      "Build a production-ready AI SaaS dashboard with responsive layout, professional navigation, analytics cards, project activity, AI usage statistics and polished mobile support.",
  },
  {
    label: "Landing page",
    prompt:
      "Create a production-ready responsive landing page with a professional hero section, features, pricing, testimonials, CTA and mobile responsive design.",
  },
  {
    label: "Authentication",
    prompt:
      "Add a production-ready authentication experience with login, signup, protected dashboard structure and responsive UI.",
  },
  {
    label: "Admin control center",
    prompt:
      "Build a production-ready admin control center with sidebar navigation, analytics, users, activity, settings and responsive mobile design.",
  },
];

const PREVIEW_POLL_INTERVAL = 4000;
const PREVIEW_MAX_POLLS = 45;


/* =========================================================
   GENERIC RESPONSE HELPERS
========================================================= */

function unwrapApiResponse(response) {
  if (response === undefined || response === null) {
    return null;
  }

  let root =
    response?.data !== undefined
      ? response.data
      : response;

  if (
    root &&
    typeof root === "object" &&
    !Array.isArray(root) &&
    root.data !== undefined
  ) {
    root = root.data;
  }

  return root;
}


function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    (
      typeof error?.response?.data?.error === "string"
        ? error.response.data.error
        : ""
    ) ||
    error?.response?.data?.detail ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
}


function getServicePayload(response) {
  return unwrapApiResponse(response);
}


function getServiceList(response, keys = []) {
  const root = getServicePayload(response);

  if (Array.isArray(root)) {
    return root;
  }

  for (const key of keys) {
    if (Array.isArray(root?.[key])) {
      return root[key];
    }
  }

  return [];
}


function getServiceObject(response, keys = []) {
  const root = getServicePayload(response);

  if (
    !root ||
    typeof root !== "object" ||
    Array.isArray(root)
  ) {
    return null;
  }

  for (const key of keys) {
    if (
      root[key] &&
      typeof root[key] === "object"
    ) {
      return root[key];
    }
  }

  return root;
}


/* =========================================================
   PROJECT HELPERS
========================================================= */

function getProjectId(project) {
  return (
    project?._id ||
    project?.id ||
    project?.projectId ||
    ""
  );
}


function getProjectName(project) {
  return (
    project?.projectName ||
    project?.name ||
    "New Project"
  );
}


function getProjectFramework(project) {
  return project?.framework || "React";
}


function normalizeProjects(response) {
  const root = unwrapApiResponse(response);

  if (Array.isArray(root)) {
    return root;
  }

  const candidates = [
    root?.projects,
    root?.items,
    root?.data?.projects,
    root?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}


function extractProjectFromResponse(response) {
  const root = unwrapApiResponse(response);

  const candidates = [
    root?.project,
    root?.data?.project,
    root?.data,
    root,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      (
        candidate._id ||
        candidate.id ||
        candidate.projectId ||
        candidate.projectName ||
        candidate.name ||
        Array.isArray(candidate.files)
      )
    ) {
      return candidate;
    }
  }

  return null;
}


/* =========================================================
   FILE HELPERS
========================================================= */

function getFilePath(file) {
  return (
    file?.path ||
    file?.filePath ||
    file?.name ||
    file?.filename ||
    "Unnamed file"
  );
}


function getFileContent(file) {
  if (!file) {
    return "";
  }

  if (
    file.content !== undefined &&
    file.content !== null
  ) {
    return String(file.content);
  }

  if (
    file.code !== undefined &&
    file.code !== null
  ) {
    return String(file.code);
  }

  return "";
}


function normalizeProjectFiles(project, aiResult) {
  const collections = [
    project?.files,
    project?.data?.files,
    project?.project?.files,

    aiResult?.files,
    aiResult?.data?.files,
    aiResult?.project?.files,

    aiResult?.orchestration?.buildResult?.data?.files,
    aiResult?.orchestration?.buildResult?.files,

    aiResult?.data?.orchestration?.buildResult?.data?.files,
    aiResult?.data?.orchestration?.buildResult?.files,
  ];

  for (const files of collections) {
    if (Array.isArray(files)) {
      return files;
    }
  }

  return [];
}


/* =========================================================
   AUTHORITATIVE BUILD
========================================================= */

function getAuthoritativeBuildId(build) {
  return String(
    build?.buildId ||
    build?.id ||
    build?._id ||
    ""
  );
}


function isAuthoritativeBuild(build) {
  if (
    !build ||
    typeof build !== "object"
  ) {
    return false;
  }

  const metadata = build.metadata || {};

  const status = String(
    build.status || ""
  ).toLowerCase();

  const validationMode = String(
    build.validationMode ||
    metadata.validationMode ||
    ""
  ).toLowerCase();

  const authoritative =
    build.authoritative === true ||
    metadata.authoritative === true;

  return (
    status === "success" &&
    authoritative &&
    validationMode === "authoritative" &&
    Boolean(getAuthoritativeBuildId(build))
  );
}


function extractAuthoritativeBuild(...responses) {
  const candidates = [];

  for (const response of responses) {
    if (!response) {
      continue;
    }

    const root = unwrapApiResponse(response);

    candidates.push(
      root,
      root?.data,
      root?.build,
      root?.data?.build,
      root?.authoritativeBuild,
      root?.data?.authoritativeBuild,
      root?.currentBuild,
      root?.latestBuild,
      root?.buildResult,
      root?.data?.buildResult,
      root?.orchestration?.buildResult,
      root?.data?.orchestration?.buildResult,
      root?.orchestration?.authoritativeBuild,
      root?.data?.orchestration?.authoritativeBuild,
      root?.project?.build,
      root?.project?.currentBuild,
      root?.project?.latestBuild,
    );
  }

  for (const candidate of candidates) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      continue;
    }

    const nested = [
      candidate,
      candidate.build,
    ];

    for (const item of nested) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        continue;
      }

      const metadata = item.metadata || {};

      const status = String(
        item.status ||
        candidate.status ||
        ""
      ).toLowerCase();

      const validationMode = String(
        item.validationMode ||
        metadata.validationMode ||
        candidate.validationMode ||
        candidate.metadata?.validationMode ||
        ""
      ).toLowerCase();

      const authoritative =
        item.authoritative === true ||
        metadata.authoritative === true ||
        candidate.authoritative === true ||
        candidate.metadata?.authoritative === true;

      const buildId =
        item.buildId ||
        item.id ||
        item._id ||
        candidate.buildId ||
        candidate.id ||
        candidate._id ||
        "";

      if (
        status === "success" &&
        authoritative &&
        validationMode === "authoritative" &&
        buildId
      ) {
        return {
          ...item,
          buildId: String(buildId),
          authoritative: true,
          validationMode: "authoritative",
        };
      }
    }
  }

  return null;
}


function extractSourceHash(...responses) {
  const build =
    extractAuthoritativeBuild(...responses);

  return (
    build?.sourceHash ||
    build?.metadata?.sourceHash ||
    build?.metadata?.sourceChecksum ||
    ""
  );
}


/* =========================================================
   PREVIEW HELPERS
========================================================= */

function extractPreview(response) {
  const root = unwrapApiResponse(response);

  const candidates = [
    root?.preview,
    root?.data?.preview,
    root?.previewData,
    root,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      (
        candidate.previewId ||
        candidate._id ||
        candidate.id ||
        candidate.status ||
        candidate.url ||
        candidate.publicUrl
      )
    ) {
      return candidate;
    }
  }

  return null;
}


function extractPreviewHealth(response) {
  const root = unwrapApiResponse(response);

  return (
    root?.health ||
    root?.data?.health ||
    root
  );
}


function extractPreviewId(preview) {
  return (
    preview?.previewId ||
    preview?.id ||
    preview?._id ||
    ""
  );
}


function extractPreviewUrl(preview) {
  return (
    preview?.publicUrl ||
    preview?.url ||
    preview?.previewUrl ||
    preview?.runtimeInfo?.publicUrl ||
    preview?.runtimeInfo?.url ||
    ""
  );
}


function normalizePreviewStatus(preview) {
  return String(
    preview?.status ||
    preview?.runtimeInfo?.status ||
    ""
  )
    .trim()
    .toLowerCase();
}


function isPreviewReady(preview) {
  const status =
    normalizePreviewStatus(preview);

  return (
    status === "ready" ||
    (
      status === "running" &&
      Boolean(extractPreviewUrl(preview))
    )
  );
}


function isPreviewStarting(preview) {
  return [
    "queued",
    "building",
    "starting",
    "pending",
  ].includes(
    normalizePreviewStatus(preview)
  );
}


function isPreviewFailed(preview) {
  return [
    "failed",
    "error",
    "crashed",
  ].includes(
    normalizePreviewStatus(preview)
  );
}


function isPreviewTerminalFailure(preview) {
  return (
    isPreviewFailed(preview) ||
    [
      "stopped",
      "expired",
      "cancelled",
      "terminated",
    ].includes(
      normalizePreviewStatus(preview)
    )
  );
}


function mergePreviewHealth(
  currentPreview,
  healthResponse
) {
  const backendPreview =
    extractPreview(healthResponse);

  const health =
    extractPreviewHealth(healthResponse);

  const merged = {
    ...(currentPreview || {}),
  };

  if (backendPreview) {
    Object.assign(
      merged,
      backendPreview
    );

    merged.runtimeInfo = {
      ...(currentPreview?.runtimeInfo || {}),
      ...(backendPreview.runtimeInfo || {}),
    };

    merged.healthCheck = {
      ...(currentPreview?.healthCheck || {}),
      ...(backendPreview.healthCheck || {}),
    };
  }

  if (
    health &&
    typeof health === "object"
  ) {
    merged.healthCheck = {
      ...(merged.healthCheck || {}),
      ...health,
    };

    if (
      health.healthy === true ||
      String(health.status || "").toLowerCase() === "healthy"
    ) {
      merged.status = "ready";
    }

    if (
      health.healthy === false ||
      ["failed", "unhealthy"].includes(
        String(health.status || "").toLowerCase()
      )
    ) {
      merged.status = "failed";
    }

    if (
      health.url &&
      !merged.url
    ) {
      merged.url = health.url;
    }

    if (
      health.publicUrl &&
      !merged.publicUrl
    ) {
      merged.publicUrl = health.publicUrl;
    }
  }

  return merged;
}


/* =========================================================
   PROJECT NAME
========================================================= */

function buildProjectName(promptValue) {
  const value =
    String(promptValue || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!value) {
    return "New Project";
  }

  const cleaned =
    value
      .replace(
        /^(please\s+)?(build|create|make|develop|design|generate|add)\s+/i,
        ""
      )
      .replace(
        /\s+(for|with)\s+me$/i,
        ""
      )
      .trim();

  const source =
    cleaned || value;

  const title =
    source
      .split(" ")
      .slice(0, 8)
      .join(" ")
      .replace(/[.!?]+$/, "")
      .trim();

  return title
    ? title.charAt(0).toUpperCase() + title.slice(1)
    : "New Project";
}


/* =========================================================
   DEPLOYMENT HELPERS
========================================================= */

function normalizeDeploymentStatus(status) {
  const value =
    String(status || "")
      .trim()
      .toLowerCase();

  switch (value) {
    case "deployed":
    case "success":
    case "successful":
      return "Deployed";

    case "deploying":
    case "in_progress":
    case "in-progress":
      return "Deploying";

    case "failed":
    case "error":
      return "Failed";

    case "building":
      return "Building";

    case "pending":
      return "Pending";

    default:
      return "Not deployed";
  }
}


function getBackendLogId(log) {
  return (
    log?._id ||
    log?.id ||
    log?.logId ||
    log?.deploymentLogId ||
    ""
  );
}


function getBackendLogStatus(log) {
  return String(
    log?.status ||
    log?.deploymentStatus ||
    log?.state ||
    ""
  )
    .trim()
    .toLowerCase();
}


function normalizeBackendActivityEvent(
  event,
  index = 0
) {
  const message =
    event?.message ||
    event?.description ||
    event?.error?.message ||
    event?.details ||
    "Backend activity received.";

  const rawType =
    String(
      event?.type ||
      event?.level ||
      event?.status ||
      "info"
    ).toLowerCase();

  const type =
    rawType.includes("error") ||
    rawType.includes("fail")
      ? "error"
      : rawType.includes("success") ||
        rawType.includes("complete")
      ? "success"
      : rawType.includes("progress") ||
        rawType.includes("active")
      ? "active"
      : "info";

  const timestampValue =
    event?.timestamp ||
    event?.createdAt ||
    event?.updatedAt ||
    new Date().toISOString();

  return {
    id:
      `backend-${event?._id || event?.id || index}-${timestampValue}`,

    message: String(message),

    type,

    timestamp:
      new Date(timestampValue).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      ),

    source: "backend",
  };
}


/* =========================================================
   MESSAGE
========================================================= */

function createMessage(
  role,
  content,
  extra = {}
) {
  return {
    id:
      `${Date.now()}-${Math.random()}`,

    role,
    content,

    timestamp:
      new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),

    ...extra,
  };
}


/* =========================================================
   WORKSPACE
========================================================= */

function Workspace() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState("React");

  const [loading, setLoading] = useState(false);

  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);

  const [deploymentStatus, setDeploymentStatus] =
    useState("Not deployed");

  const [liveUrl, setLiveUrl] = useState("");

  const [activeView, setActiveView] =
    useState("preview");

  const [mobilePanel, setMobilePanel] =
    useState("workspace");

  const [filesDrawerOpen, setFilesDrawerOpen] =
    useState(false);

  const [activityDrawerOpen, setActivityDrawerOpen] =
    useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [projectLoading, setProjectLoading] =
    useState(true);

  const [operation, setOperation] =
    useState("idle");

  const [operationStartedAt, setOperationStartedAt] =
    useState(null);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [activityLog, setActivityLog] =
    useState([]);

  const [previewFullscreen, setPreviewFullscreen] =
    useState(false);

  const [authoritativeBuild, setAuthoritativeBuild] =
    useState(null);

  const [buildSourceHash, setBuildSourceHash] =
    useState("");

  const [buildState, setBuildState] =
    useState("idle");

  const [preview, setPreview] =
    useState(null);

  const [previewState, setPreviewState] =
    useState("idle");

  const [previewError, setPreviewError] =
    useState("");

  const [previewPolling, setPreviewPolling] =
    useState(false);

  const [environments, setEnvironments] =
    useState([]);

  const [activeEnvironment, setActiveEnvironment] =
    useState("development");

  const [environmentReadiness, setEnvironmentReadiness] =
    useState(null);

  const [deploymentLog, setDeploymentLog] =
    useState(null);

  const [deploymentEvents, setDeploymentEvents] =
    useState([]);

  const [githubConnection, setGithubConnection] =
    useState(null);

  const [githubRepository, setGithubRepository] =
    useState(null);

  const [backendSyncing, setBackendSyncing] =
    useState(false);

  const [backendSyncError, setBackendSyncError] =
    useState("");

  const chatEndRef = useRef(null);
  const initialLoadStarted = useRef(false);
  const previewPollRef = useRef(null);


  /* =======================================================
     DERIVED
  ======================================================= */

  const projectName =
    getProjectName(selectedProject);

  const selectedProjectId =
    getProjectId(selectedProject);

  const projectCount =
    projects.length;

  const previewUrl =
    liveUrl ||
    extractPreviewUrl(preview);

  const previewReady =
    Boolean(
      preview &&
      isPreviewReady(preview) &&
      previewUrl
    );

  const operationRunning =
    operation !== "idle";

  const authoritativeBuildReady =
    Boolean(
      authoritativeBuild &&
      isAuthoritativeBuild(authoritativeBuild)
    );

  const canDeploy =
    Boolean(
      selectedProjectId &&
      generatedFiles.length > 0 &&
      authoritativeBuildReady
    );

  const currentOperationLabel =
    useMemo(() => {
      switch (operation) {
        case "build":
          return "Building";

        case "change":
          return "Applying changes";

        case "preview":
          return "Starting preview";

        case "deploy":
          return "Deploying";

        default:
          return "Ready";
      }
    }, [operation]);


  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (!operationStartedAt) {
      setElapsedSeconds(0);
      return undefined;
    }

    const updateTimer = () => {
      setElapsedSeconds(
        Math.max(
          0,
          Math.floor(
            (Date.now() - operationStartedAt) / 1000
          )
        )
      );
    };

    updateTimer();

    const timer =
      window.setInterval(updateTimer, 1000);

    return () =>
      window.clearInterval(timer);
  }, [operationStartedAt]);


  /* =======================================================
     CHAT SCROLL
  ======================================================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [chatMessages]);


  /* =======================================================
     SELECTED PROJECT REF
  ======================================================= */

  useEffect(() => {
    selectedProjectRef.current =
      selectedProject;
  }, [selectedProject]);


  /* =======================================================
     PREVIEW CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (previewPollRef.current) {
        window.clearTimeout(
          previewPollRef.current
        );

        previewPollRef.current = null;
      }
    };
  }, []);


  /* =======================================================
     ACTIVITY
  ======================================================= */

  const addActivity = useCallback(
    (message, type = "info") => {
      setActivityLog((previous) =>
        [
          ...previous,
          {
            id:
              `${Date.now()}-${Math.random()}`,

            message,
            type,

            timestamp:
              new Date().toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              ),
          },
        ].slice(-60)
      );
    },
    []
  );


  const startOperation = useCallback(
    (type, message) => {
      setOperation(type);
      setOperationStartedAt(Date.now());

      addActivity(
        message,
        "active"
      );
    },
    [addActivity]
  );


  const finishOperation = useCallback(
    (success, message) => {
      addActivity(
        message,
        success ? "success" : "error"
      );

      setOperation("idle");
      setOperationStartedAt(null);
    },
    [addActivity]
  );


  /* =======================================================
     RESET
  ======================================================= */

  const resetBuildAndPreview =
    useCallback(() => {
      if (previewPollRef.current) {
        window.clearTimeout(
          previewPollRef.current
        );

        previewPollRef.current = null;
      }

      setAuthoritativeBuild(null);
      setBuildSourceHash("");
      setBuildState("idle");

      setPreview(null);
      setPreviewState("idle");
      setPreviewError("");
      setPreviewPolling(false);
      setLiveUrl("");
    }, []);


  /* =======================================================
     APPLY PROJECT
  ======================================================= */

  const applySelectedProject =
    useCallback((project) => {
      if (!project) {
        return;
      }

      selectedProjectRef.current =
        project;

      setSelectedProject(project);

      const files =
        normalizeProjectFiles(
          project,
          null
        );

      setGeneratedFiles(files);
      setSelectedFile(files[0] || null);

      setDeploymentStatus(
        normalizeDeploymentStatus(
          project?.deploymentStatus ||
          project?.deployment?.status
        )
      );

      const existingPreview =
        extractPreview(
          project?.preview
            ? {
                preview: project.preview,
              }
            : project
        );

      if (existingPreview) {
        setPreview(existingPreview);

        setLiveUrl(
          extractPreviewUrl(existingPreview)
        );

        setPreviewState(
          isPreviewReady(existingPreview)
            ? "ready"
            : isPreviewStarting(existingPreview)
            ? "starting"
            : "idle"
        );
      } else {
        setPreview(null);
        setLiveUrl("");
        setPreviewState("idle");
      }

      const existingBuild =
        extractAuthoritativeBuild(project);

      if (existingBuild) {
        setAuthoritativeBuild(
          existingBuild
        );

        setBuildSourceHash(
          extractSourceHash(project)
        );

        setBuildState("success");
      } else {
        setAuthoritativeBuild(null);
        setBuildSourceHash("");
        setBuildState("idle");
      }

      const projectFramework =
        getProjectFramework(project);

      if (
        FRAMEWORKS.includes(
          projectFramework
        )
      ) {
        setFramework(projectFramework);
      }
    }, []);


  /* =======================================================
     BACKEND CONTEXT
  ======================================================= */

  const syncBackendContext =
    useCallback(
      async (projectId) => {
        if (!projectId) {
          setEnvironments([]);
          setEnvironmentReadiness(null);
          setDeploymentLog(null);
          setDeploymentEvents([]);
          setGithubConnection(null);
          setGithubRepository(null);
          return;
        }

        setBackendSyncing(true);
        setBackendSyncError("");

        try {
          const results =
            await Promise.allSettled([
              environmentService.listEnvironments(
                projectId
              ),

              deploymentLogService.getLatestLog({
                projectId,
              }),

              githubService.getConnections({
                projectId,
              }),
            ]);

          const environmentResult =
            results[0];

          const deploymentResult =
            results[1];

          const githubResult =
            results[2];

          if (
            environmentResult.status ===
            "fulfilled"
          ) {
            const list =
              getServiceList(
                environmentResult.value,
                [
                  "environments",
                  "items",
                ]
              );

            setEnvironments(list);

            const first =
              list.find(
                (item) =>
                  String(
                    item?.name ||
                    item?.environment ||
                    ""
                  ).toLowerCase() ===
                  String(
                    activeEnvironment
                  ).toLowerCase()
              ) ||
              list[0] ||
              null;

            if (first) {
              const name =
                first?.name ||
                first?.environment ||
                "development";

              setActiveEnvironment(
                String(name)
              );

              try {
                const readiness =
                  await environmentService
                    .getDeploymentReadiness(
                      projectId,
                      name
                    );

                setEnvironmentReadiness(
                  getServiceObject(
                    readiness,
                    [
                      "readiness",
                      "deploymentReadiness",
                    ]
                  )
                );
              } catch {
                setEnvironmentReadiness(
                  null
                );
              }
            }
          } else {
            setEnvironments([]);
            setEnvironmentReadiness(null);
          }

          if (
            deploymentResult.status ===
            "fulfilled"
          ) {
            const log =
              getServiceObject(
                deploymentResult.value,
                [
                  "log",
                  "deploymentLog",
                  "latest",
                ]
              );

            setDeploymentLog(log);

            const logId =
              getBackendLogId(log);

            if (logId) {
              try {
                const eventsResponse =
                  await deploymentLogService
                    .getEvents(
                      logId,
                      {
                        limit: 40,
                      }
                    );

                const events =
                  getServiceList(
                    eventsResponse,
                    [
                      "events",
                      "items",
                    ]
                  );

                setDeploymentEvents(
                  events.map(
                    (
                      event,
                      index
                    ) =>
                      normalizeBackendActivityEvent(
                        event,
                        index
                      )
                  )
                );
              } catch {
                setDeploymentEvents([]);
              }
            }
          }

          if (
            githubResult.status ===
            "fulfilled"
          ) {
            const connections =
              getServiceList(
                githubResult.value,
                [
                  "connections",
                  "items",
                ]
              );

            const active =
              connections.find(
                (item) =>
                  [
                    "active",
                    "connected",
                  ].includes(
                    String(
                      item?.status ||
                      ""
                    ).toLowerCase()
                  )
              ) ||
              connections[0] ||
              null;

            setGithubConnection(active);

            setGithubRepository(
              active?.defaultRepository ||
              active?.repository ||
              active?.defaultRepo ||
              null
            );
          }

          if (
            environmentResult.status ===
              "rejected" &&
            deploymentResult.status ===
              "rejected" &&
            githubResult.status ===
              "rejected"
          ) {
            setBackendSyncError(
              "Backend workspace context could not be synchronized."
            );
          }
        } finally {
          setBackendSyncing(false);
        }
      },
      [activeEnvironment]
    );


  /* =======================================================
     LOAD PROJECTS
  ======================================================= */

  const loadProjects =
    useCallback(
      async (preferredProjectId = "") => {
        try {
          setProjectLoading(true);

          const response =
            await getProjects();

          const normalized =
            normalizeProjects(response);

          setProjects(normalized);

          const currentId =
            preferredProjectId ||
            getProjectId(
              selectedProjectRef.current
            );

          if (currentId) {
            const preferred =
              normalized.find(
                (project) =>
                  String(
                    getProjectId(project)
                  ) ===
                  String(currentId)
              );

            if (preferred) {
              applySelectedProject(
                preferred
              );

              await syncBackendContext(
                getProjectId(preferred)
              );

              return normalized;
            }
          }

          if (normalized.length > 0) {
            applySelectedProject(
              normalized[0]
            );

            await syncBackendContext(
              getProjectId(normalized[0])
            );
          } else {
            selectedProjectRef.current =
              null;

            setSelectedProject(null);
            setGeneratedFiles([]);
            setSelectedFile(null);

            resetBuildAndPreview();

            setDeploymentStatus(
              "Not deployed"
            );
          }

          return normalized;
        } catch (err) {
          console.error(
            "Workspace project loading error:",
            err
          );

          setError(
            getErrorMessage(
              err,
              "Projects could not be loaded."
            )
          );

          return [];
        } finally {
          setProjectLoading(false);
        }
      },
      [
        applySelectedProject,
        syncBackendContext,
        resetBuildAndPreview,
      ]
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (initialLoadStarted.current) {
      return;
    }

    initialLoadStarted.current = true;

    loadProjects();
  }, [loadProjects]);


  /* =======================================================
     PROJECT SELECT
  ======================================================= */

  const handleSelectProject =
    useCallback(
      (project) => {
        setError("");
        setNotice("");
        setActivityLog([]);
        setChatMessages([]);

        setActiveView("preview");
        setMobilePanel("workspace");

        setFilesDrawerOpen(false);
        setActivityDrawerOpen(false);
        setPreviewFullscreen(false);

        applySelectedProject(project);

        syncBackendContext(
          getProjectId(project)
        );
      },
      [
        applySelectedProject,
        syncBackendContext,
      ]
    );


  /* =======================================================
     NEW PROJECT
  ======================================================= */

  const handleNewProject =
    useCallback(() => {
      selectedProjectRef.current =
        null;

      setSelectedProject(null);
      setGeneratedFiles([]);
      setSelectedFile(null);

      setPrompt("");
      setChatMessages([]);

      setDeploymentStatus(
        "Not deployed"
      );

      setActiveView("preview");
      setMobilePanel("workspace");

      setFilesDrawerOpen(false);
      setActivityDrawerOpen(false);
      setPreviewFullscreen(false);

      setError("");
      setNotice("");
      setActivityLog([]);

      setOperation("idle");
      setOperationStartedAt(null);

      resetBuildAndPreview();

      setEnvironments([]);
      setActiveEnvironment("development");
      setEnvironmentReadiness(null);

      setDeploymentLog(null);
      setDeploymentEvents([]);

      setGithubConnection(null);
      setGithubRepository(null);

      setBackendSyncError("");
    }, [resetBuildAndPreview]);


  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  const handleQuickPrompt =
    useCallback((value) => {
      setPrompt(value);

      setError("");
      setNotice("");

      setMobilePanel("ai");

      window.setTimeout(() => {
        document
          .querySelector(
            '[data-zyrionos-chat-input="true"]'
          )
          ?.focus();
      }, 50);
    }, []);


  /* =======================================================
     REAL PREVIEW
  ======================================================= */

  const startRealPreview =
    useCallback(
      async (
        projectId,
        build
      ) => {
        if (!projectId) {
          throw new Error(
            "Project ID is required before creating a preview."
          );
        }

        if (
          !build ||
          !isAuthoritativeBuild(build)
        ) {
          throw new Error(
            "Preview requires a successful authoritative build."
          );
        }

        const buildId =
          getAuthoritativeBuildId(build);

        if (!buildId) {
          throw new Error(
            "The backend did not return an authoritative build ID."
          );
        }

        if (previewPollRef.current) {
          window.clearTimeout(
            previewPollRef.current
          );

          previewPollRef.current = null;
        }

        setPreviewError("");
        setPreviewState("starting");
        setPreviewPolling(false);

        startOperation(
          "preview",
          "Starting the isolated backend preview runtime..."
        );

        addActivity(
          `Creating preview from authoritative build ${buildId}...`,
          "active"
        );

        let response;

        try {
          response =
            await createPreview(
              projectId,
              {
                buildId,
                sourceHash:
                  buildSourceHash ||
                  undefined,
              }
            );
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              "The backend preview runtime could not be started."
            );

          setPreviewState("error");
          setPreviewError(message);

          addActivity(
            message,
            "error"
          );

          finishOperation(
            false,
            "Preview runtime failed to start."
          );

          throw err;
        }

        let createdPreview =
          extractPreview(response);

        if (!createdPreview) {
          try {
            const activeResponse =
              await getPreview(projectId);

            createdPreview =
              extractPreview(
                activeResponse
              );
          } catch {
            /* create response remains source */
          }
        }

        if (!createdPreview) {
          const message =
            "Preview service returned no preview runtime.";

          setPreviewState("error");
          setPreviewError(message);

          addActivity(
            message,
            "error"
          );

          finishOperation(
            false,
            message
          );

          throw new Error(message);
        }

        setPreview(createdPreview);

        const createdUrl =
          extractPreviewUrl(
            createdPreview
          );

        if (createdUrl) {
          setLiveUrl(createdUrl);
        }

        const createdStatus =
          normalizePreviewStatus(
            createdPreview
          );

        addActivity(
          `Preview runtime created with status "${createdStatus || "unknown"}".`,
          "success"
        );

        if (
          isPreviewReady(createdPreview) &&
          createdUrl
        ) {
          setPreviewState("ready");
          setPreviewPolling(false);

          addActivity(
            "Preview runtime is healthy and ready.",
            "success"
          );

          finishOperation(
            true,
            "Preview runtime is ready."
          );

          return createdPreview;
        }

        const previewId =
          extractPreviewId(
            createdPreview
          );

        if (!previewId) {
          const message =
            "Preview runtime was created but no preview ID was returned.";

          setPreviewState("error");
          setPreviewError(message);

          addActivity(
            message,
            "error"
          );

          finishOperation(
            false,
            message
          );

          throw new Error(message);
        }

        setPreviewPolling(true);

        for (
          let attempt = 0;
          attempt < PREVIEW_MAX_POLLS;
          attempt += 1
        ) {
          await new Promise(
            (resolve) => {
              previewPollRef.current =
                window.setTimeout(
                  resolve,
                  PREVIEW_POLL_INTERVAL
                );
            }
          );

          previewPollRef.current = null;

          try {
            const healthResponse =
              await getPreviewHealth(
                projectId,
                previewId
              );

            const nextPreview =
              mergePreviewHealth(
                createdPreview,
                healthResponse
              );

            if (nextPreview) {
              createdPreview =
                nextPreview;

              setPreview(nextPreview);

              const nextUrl =
                extractPreviewUrl(
                  nextPreview
                );

              if (nextUrl) {
                setLiveUrl(nextUrl);
              }

              const nextStatus =
                normalizePreviewStatus(
                  nextPreview
                );

              if (
                isPreviewReady(nextPreview) &&
                nextUrl
              ) {
                setPreviewState("ready");
                setPreviewPolling(false);

                addActivity(
                  "Preview health check passed.",
                  "success"
                );

                finishOperation(
                  true,
                  "Preview runtime is ready."
                );

                return nextPreview;
              }

              if (
                isPreviewTerminalFailure(
                  nextPreview
                )
              ) {
                const failure =
                  nextPreview?.errorMessage ||
                  nextPreview?.error?.message ||
                  (
                    Array.isArray(
                      nextPreview?.errors
                    )
                      ? nextPreview.errors[
                          nextPreview.errors.length - 1
                        ]?.message
                      : ""
                  ) ||
                  `Preview runtime entered state "${nextStatus}".`;

                setPreviewState("error");
                setPreviewError(failure);
                setPreviewPolling(false);

                addActivity(
                  failure,
                  "error"
                );

                finishOperation(
                  false,
                  "Preview runtime failed."
                );

                throw new Error(failure);
              }

              setPreviewState("starting");
            }
          } catch (healthError) {
            const status =
              healthError?.response?.status ||
              healthError?.status;

            const code =
              healthError?.response?.data?.code ||
              healthError?.code;

            const terminal =
              status === 404 ||
              status === 409 ||
              status === 422 ||
              [
                "BUILD_NOT_FOUND",
                "BUILD_NOT_SUCCESSFUL",
                "ARTIFACT_NOT_FOUND",
                "ARTIFACT_INVALID",
                "ARTIFACT_CHECKSUM_MISMATCH",
                "DOCKER_UNAVAILABLE",
                "PREVIEW_RUNTIME_FAILED",
                "HEALTH_CHECK_FAILED",
              ].includes(code);

            if (terminal) {
              const message =
                getErrorMessage(
                  healthError,
                  "Preview health verification failed."
                );

              setPreviewState("error");
              setPreviewError(message);
              setPreviewPolling(false);

              addActivity(
                message,
                "error"
              );

              finishOperation(
                false,
                "Preview health verification failed."
              );

              throw healthError;
            }

            if (
              attempt >=
              PREVIEW_MAX_POLLS - 1
            ) {
              const message =
                getErrorMessage(
                  healthError,
                  "Preview health could not be verified."
                );

              setPreviewState("error");
              setPreviewError(message);
              setPreviewPolling(false);

              addActivity(
                message,
                "error"
              );

              finishOperation(
                false,
                "Preview health verification timed out."
              );

              throw healthError;
            }
          }
        }

        setPreviewPolling(false);
        setPreviewState("error");

        const timeoutMessage =
          "Preview runtime did not become healthy within the allowed startup window.";

        setPreviewError(
          timeoutMessage
        );

        addActivity(
          timeoutMessage,
          "error"
        );

        finishOperation(
          false,
          timeoutMessage
        );

        throw new Error(
          timeoutMessage
        );
      },
      [
        buildSourceHash,
        startOperation,
        addActivity,
        finishOperation,
      ]
    );


  /* =======================================================
     BUILD
  ======================================================= */

  const handleBuild =
    useCallback(
      async (suppliedPrompt = "") => {
        const userPrompt =
          String(
            suppliedPrompt || prompt
          ).trim();

        if (!userPrompt) {
          setError(
            "Describe what you want to build or change first."
          );

          return;
        }

        if (loading) {
          return;
        }

        const isExistingProject =
          Boolean(selectedProjectId);

        try {
          setError("");
          setNotice("");
          setLoading(true);

          setBuildState("generating");

          setPreviewState("idle");
          setPreviewError("");
          setLiveUrl("");
          setPreview(null);

          setActiveView("preview");
          setMobilePanel("workspace");

          setChatMessages(
            (previous) => [
              ...previous,
              createMessage(
                "user",
                userPrompt
              ),
            ]
          );

          startOperation(
            isExistingProject
              ? "change"
              : "build",
            isExistingProject
              ? "Your change request is being processed..."
              : "Your application is being generated..."
          );

          addActivity(
            "Understanding the request...",
            "active"
          );

          const instruction =
            isExistingProject
              ? [
                  "Update the current project.",
                  "",
                  `Project ID: ${selectedProjectId}`,
                  `Project name: ${projectName}`,
                  `Framework: ${framework}`,
                  "",
                  "User request:",
                  userPrompt,
                  "",
                  "Return the complete project files required for the implementation.",
                  "Preserve working functionality unless the requested change requires modifying it.",
                ].join("\n")
              : userPrompt;

          addActivity(
            "Generating application files...",
            "active"
          );

          const aiResult =
            await generateCode(
              instruction,
              framework
            );

          const assistantText =
            normalizeAIResponse(
              aiResult
            );

          const filesFromAI =
            getGeneratedFiles(
              aiResult
            );

          if (
            !Array.isArray(filesFromAI) ||
            filesFromAI.length === 0
          ) {
            throw new Error(
              "AI generation completed, but no project files were returned by the backend."
            );
          }

          addActivity(
            `${filesFromAI.length} project files received from the backend.`,
            "success"
          );

          setChatMessages(
            (previous) => [
              ...previous,
              createMessage(
                "assistant",
                assistantText ||
                  `The backend returned ${filesFromAI.length} project files.`,
                {
                  fileCount:
                    filesFromAI.length,
                }
              ),
            ]
          );

          let projectAfterSave = null;
          let saveResponse = null;

          /* CREATE */

          if (!isExistingProject) {
            const generatedProjectName =
              buildProjectName(
                userPrompt
              );

            addActivity(
              "Saving the generated project...",
              "active"
            );

            saveResponse =
              await createProject({
                projectName:
                  generatedProjectName,

                description:
                  userPrompt,

                framework,

                files:
                  filesFromAI,
              });

            projectAfterSave =
              extractProjectFromResponse(
                saveResponse
              );

            if (projectAfterSave) {
              const savedFiles =
                normalizeProjectFiles(
                  projectAfterSave,
                  null
                );

              const finalFiles =
                savedFiles.length > 0
                  ? savedFiles
                  : filesFromAI;

              const projectWithFiles = {
                ...projectAfterSave,

                projectName:
                  getProjectName(
                    projectAfterSave
                  ) ||
                  generatedProjectName,

                files: finalFiles,
              };

              applySelectedProject(
                projectWithFiles
              );

              setGeneratedFiles(
                finalFiles
              );

              setSelectedFile(
                finalFiles[0] ||
                  null
              );
            }

            const createdId =
              getProjectId(
                projectAfterSave
              );

            await loadProjects(
              createdId
            );

            projectAfterSave =
              selectedProjectRef.current ||
              projectAfterSave;

            setNotice(
              `${generatedProjectName} was created and saved.`
            );
          }

          /* UPDATE */

          else {
            addActivity(
              "Saving the updated project...",
              "active"
            );

            saveResponse =
              await updateProject(
                selectedProjectId,
                {
                  files:
                    filesFromAI,
                }
              );

            projectAfterSave =
              extractProjectFromResponse(
                saveResponse
              );

            if (projectAfterSave) {
              const returnedFiles =
                normalizeProjectFiles(
                  projectAfterSave,
                  null
                );

              const finalFiles =
                returnedFiles.length > 0
                  ? returnedFiles
                  : filesFromAI;

              applySelectedProject({
                ...projectAfterSave,
                files: finalFiles,
              });

              setGeneratedFiles(
                finalFiles
              );

              setSelectedFile(
                finalFiles[0] ||
                  null
              );
            } else {
              setGeneratedFiles(
                filesFromAI
              );

              setSelectedFile(
                filesFromAI[0] ||
                  null
              );
            }

            await loadProjects(
              selectedProjectId
            );

            setNotice(
              `Changes saved to ${projectName}.`
            );

            addActivity(
              "Project changes saved.",
              "success"
            );
          }

          /*
           * CRITICAL:
           * AI response is NOT authoritative.
           */

          const build =
            extractAuthoritativeBuild(
              aiResult,
              saveResponse,
              projectAfterSave,
              selectedProjectRef.current
            );

          if (!build) {
            setBuildState("waiting");
            setAuthoritativeBuild(null);
            setPreviewState("blocked");

            const message =
              "Project files were saved, but the backend did not return a successful authoritative build. Preview is blocked until Engineering Agent produces one.";

            addActivity(
              message,
              "error"
            );

            setError(message);
            setPrompt("");

            finishOperation(
              false,
              "Project saved, but authoritative build is unavailable."
            );

            return;
          }

          setAuthoritativeBuild(build);

          const sourceHash =
            extractSourceHash(
              build,
              aiResult,
              saveResponse
            );

          setBuildSourceHash(
            sourceHash
          );

          setBuildState("success");

          const realBuildId =
            getAuthoritativeBuildId(
              build
            );

          addActivity(
            `Authoritative build ${realBuildId} returned by Engineering Agent.`,
            "success"
          );

          setLoading(false);

          try {
            const finalProjectId =
              getProjectId(
                projectAfterSave ||
                selectedProjectRef.current
              ) ||
              selectedProjectId;

            await startRealPreview(
              finalProjectId,
              build
            );

            setPrompt("");
            setActiveView("preview");

            setNotice(
              "Authoritative build completed and the real preview runtime is ready."
            );
          } catch {
            /* Preview state already contains error */
          }
        } catch (err) {
          console.error(
            "Workspace build error:",
            err
          );

          const message =
            getErrorMessage(
              err,
              "The build could not be completed."
            );

          setBuildState("failed");
          setError(message);

          setChatMessages(
            (previous) => [
              ...previous,
              createMessage(
                "assistant",
                message,
                {
                  error: true,
                }
              ),
            ]
          );

          addActivity(
            message,
            "error"
          );

          finishOperation(
            false,
            "The build operation failed."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        prompt,
        loading,
        selectedProjectId,
        projectName,
        framework,
        startOperation,
        addActivity,
        applySelectedProject,
        loadProjects,
        finishOperation,
        startRealPreview,
      ]
    );


  /* =======================================================
     CHAT
  ======================================================= */

  const handleChatSubmit =
    useCallback(
      (event) => {
        event?.preventDefault();

        if (
          loading ||
          !prompt.trim()
        ) {
          return;
        }

        handleBuild(prompt);
      },
      [
        loading,
        prompt,
        handleBuild,
      ]
    );


  const handlePromptKeyDown =
    useCallback(
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          handleChatSubmit(event);
        }
      },
      [handleChatSubmit]
    );


  /* =======================================================
     REVIEW / FIX
  ======================================================= */

  const handleReviewFix =
    useCallback(
      async () => {
        if (!selectedProjectId) {
          setError(
            "Select a project before running Review / Fix."
          );

          return;
        }

        if (loading) {
          return;
        }

        const requestedChange =
          prompt.trim();

        const reviewInstruction =
          requestedChange
            ? [
                "Review and improve the current project.",
                "",
                `Project ID: ${selectedProjectId}`,
                `Project name: ${projectName}`,
                "",
                "Requested review/change:",
                requestedChange,
                "",
                "Return the complete project files required for the implementation.",
              ].join("\n")
            : [
                "Review the current project.",
                "",
                "Check the current implementation for errors, broken functionality, responsive problems, accessibility issues, incomplete functionality and build/runtime problems.",
                "",
                "Return the complete project files required for any fixes.",
              ].join("\n");

        await handleBuild(
          reviewInstruction
        );
      },
      [
        selectedProjectId,
        loading,
        prompt,
        projectName,
        handleBuild,
      ]
    );


  /* =======================================================
     DEPLOY
  ======================================================= */

  const handleDeploy =
    useCallback(() => {
      if (!selectedProjectId) {
        setError(
          "Select a project before deploying."
        );

        return;
      }

      if (generatedFiles.length === 0) {
        setError(
          "This project has no generated files to deploy."
        );

        return;
      }

      if (!authoritativeBuildReady) {
        setError(
          "Deployment is blocked until the backend reports a successful authoritative build."
        );

        return;
      }

      setError("");

      setNotice(
        "Opening the deployment flow for the successfully built project..."
      );

      window.location.assign(
        `/billing?projectId=${encodeURIComponent(
          selectedProjectId
        )}&intent=deploy&buildId=${encodeURIComponent(
          getAuthoritativeBuildId(
            authoritativeBuild
          )
        )}`
      );
    }, [
      selectedProjectId,
      generatedFiles.length,
      authoritativeBuildReady,
      authoritativeBuild,
    ]);


  /* =======================================================
     OPEN PREVIEW
  ======================================================= */

  const openPreview =
    useCallback(
      async () => {
        setActiveView("preview");
        setMobilePanel("workspace");
        setPreviewFullscreen(true);

        if (
          previewReady
        ) {
          return;
        }

        if (!selectedProjectId) {
          setPreviewError(
            "Select a project before starting Preview."
          );

          return;
        }

        if (!authoritativeBuildReady) {
          setPreviewState("blocked");

          setPreviewError(
            "Authoritative build required. Preview cannot start from unverified project files."
          );

          return;
        }

        try {
          await startRealPreview(
            selectedProjectId,
            authoritativeBuild
          );
        } catch {
          /* state already updated */
        }
      },
      [
        selectedProjectId,
        previewReady,
        authoritativeBuildReady,
        authoritativeBuild,
        startRealPreview,
      ]
    );


  const closePreview =
    useCallback(() => {
      setPreviewFullscreen(false);
    }, []);


  /* =======================================================
     STOP PREVIEW
  ======================================================= */

  const handleStopPreview =
    useCallback(
      async () => {
        const previewId =
          extractPreviewId(preview);

        if (
          !selectedProjectId ||
          !previewId
        ) {
          return;
        }

        try {
          setPreviewState("stopping");

          addActivity(
            "Stopping preview runtime...",
            "active"
          );

          await stopPreview(
            selectedProjectId,
            previewId
          );

          setPreview(null);
          setLiveUrl("");
          setPreviewState("stopped");

          addActivity(
            "Preview runtime stopped.",
            "success"
          );
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              "Preview runtime could not be stopped."
            );

          setPreviewError(message);
          setPreviewState("error");

          addActivity(
            message,
            "error"
          );
        }
      },
      [
        selectedProjectId,
        preview,
        addActivity,
      ]
    );


  /* =======================================================
     DRAWERS
  ======================================================= */

  const openFilesDrawer =
    useCallback(() => {
      setFilesDrawerOpen(true);
      setActivityDrawerOpen(false);
    }, []);

  const closeFilesDrawer =
    useCallback(() => {
      setFilesDrawerOpen(false);
    }, []);

  const openActivityDrawer =
    useCallback(() => {
      setActivityDrawerOpen(true);
      setFilesDrawerOpen(false);
    }, []);

  const closeActivityDrawer =
    useCallback(() => {
      setActivityDrawerOpen(false);
    }, []);

  const handleFileSelect =
    useCallback((file) => {
      setSelectedFile(file);
      setFilesDrawerOpen(false);
      setActiveView("code");
    }, []);


  /* =======================================================
     DEPLOYMENT LOG REFRESH
  ======================================================= */

  useEffect(() => {
    if (!selectedProjectId) {
      return undefined;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const response =
          await deploymentLogService
            .getLatestLog({
              projectId:
                selectedProjectId,
            });

        if (cancelled) {
          return;
        }

        const log =
          getServiceObject(
            response,
            [
              "log",
              "deploymentLog",
              "latest",
            ]
          );

        if (!log) {
          return;
        }

        setDeploymentLog(log);

        const status =
          getBackendLogStatus(log);

        if (status) {
          setDeploymentStatus(
            normalizeDeploymentStatus(
              status
            )
          );
        }

        const logId =
          getBackendLogId(log);

        if (!logId) {
          return;
        }

        const eventsResponse =
          await deploymentLogService
            .getEvents(
              logId,
              {
                limit: 40,
              }
            );

        if (cancelled) {
          return;
        }

        const events =
          getServiceList(
            eventsResponse,
            [
              "events",
              "items",
            ]
          );

        setDeploymentEvents(
          events.map(
            (
              event,
              index
            ) =>
              normalizeBackendActivityEvent(
                event,
                index
              )
          )
        );
      } catch {
        /* background refresh */
      }
    };

    refresh();

    const interval =
      window.setInterval(
        refresh,
        5000
      );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selectedProjectId]);


  /* =======================================================
     COMBINED ACTIVITY
  ======================================================= */

  const combinedActivityLog =
    useMemo(
      () =>
        [
          ...(Array.isArray(
            activityLog
          )
            ? activityLog
            : []),

          ...(Array.isArray(
            deploymentEvents
          )
            ? deploymentEvents
            : []),
        ]
          .sort(
            (a, b) =>
              String(
                a?.timestamp || ""
              ).localeCompare(
                String(
                  b?.timestamp || ""
                )
              )
          )
          .slice(-60),
      [
        activityLog,
        deploymentEvents,
      ]
    );


  const backendDeploymentStatus =
    getBackendLogStatus(
      deploymentLog
    );


  const githubStatus =
    githubConnection
      ? String(
          githubConnection.status ||
          "connected"
        ).toLowerCase()
      : "disconnected";


  const environmentStatus =
    environmentReadiness?.ready === true ||
    environmentReadiness?.isReady === true
      ? "Ready"
      : environmentReadiness
      ? "Check"
      : "Unknown";


  const previewDisplayStatus =
    previewState === "ready"
      ? "LIVE"
      : previewState === "starting"
      ? "STARTING"
      : previewState === "blocked"
      ? "BUILD REQUIRED"
      : previewState === "error"
      ? "ERROR"
      : previewState === "stopped"
      ? "STOPPED"
      : "WAITING";


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>
      <main className={styles.workspace}>

        {/* HEADER */}

        <header className={styles.workspaceHeader}>
          <div className={styles.brandBlock}>
            <div className={styles.projectMark}>
              Z
            </div>

            <div className={styles.brandCopy}>
              <span>
                ZYRIONOS WORKSPACE
              </span>

              <strong title={projectName}>
                {projectName}
              </strong>
            </div>
          </div>

          <div className={styles.headerStatus}>
            <span
              className={
                operationRunning
                  ? styles.statusRunning
                  : styles.statusReady
              }
            />

            <strong>
              {operationRunning
                ? currentOperationLabel
                : "Ready"}
            </strong>

            {operationRunning && (
              <>
                <span className={styles.statusDots}>
                  <i />
                  <i />
                  <i />
                </span>

                <small>
                  {elapsedSeconds}s
                </small>
              </>
            )}
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerButton}
              onClick={openFilesDrawer}
            >
              Files <b>{generatedFiles.length}</b>
            </button>

            <button
              type="button"
              className={styles.headerButton}
              onClick={openActivityDrawer}
            >
              Activity
            </button>

            <button
              type="button"
              className={styles.previewTopButton}
              onClick={openPreview}
              disabled={!authoritativeBuildReady}
            >
              Preview
            </button>

            <button
              type="button"
              className={styles.deployButton}
              onClick={handleDeploy}
              disabled={!canDeploy}
            >
              Deploy
            </button>
          </div>
        </header>


        {/* ERROR */}

        {error && (
          <div
            className={styles.alertError}
            role="alert"
          >
            <span>!</span>

            <div>
              <strong>
                Workspace error
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}


        {/* SUCCESS */}

        {notice && !error && (
          <div
            className={styles.alertSuccess}
            role="status"
          >
            <span>✓</span>

            <p>{notice}</p>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Close notice"
            >
              ×
            </button>
          </div>
        )}


        {/* PREVIEW ERROR */}

        {previewError && !error && (
          <div
            className={styles.alertError}
            role="alert"
          >
            <span>!</span>

            <div>
              <strong>
                Preview runtime error
              </strong>

              <p>{previewError}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                setPreviewError("")
              }
              aria-label="Close preview error"
            >
              ×
            </button>
          </div>
        )}


        {/* MOBILE NAV */}

        <nav className={styles.mobileNav}>
          {[
            ["projects", "Projects"],
            ["workspace", "Workspace"],
            ["ai", "AI"],
            ["activity", "Activity"],
          ].map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                className={
                  mobilePanel === key
                    ? styles.mobileNavActive
                    : ""
                }
                onClick={() =>
                  setMobilePanel(key)
                }
              >
                {label}
              </button>
            )
          )}
        </nav>


        {/* BODY */}

        <section className={styles.workspaceBody}>

          {/* PROJECT RAIL */}

          <aside
            className={`
              ${styles.projectRail}
              ${
                mobilePanel === "projects"
                  ? styles.mobileVisible
                  : ""
              }
            `}
          >
            <div className={styles.railHeader}>
              <div>
                <span>PROJECTS</span>
                <b>{projectCount}</b>
              </div>

              <button
                type="button"
                onClick={handleNewProject}
              >
                + New
              </button>
            </div>

            <button
              type="button"
              className={styles.newProjectCard}
              onClick={handleNewProject}
            >
              <span>+</span>

              <div>
                <strong>
                  Create a Project
                </strong>

                <small>
                  Start from an idea
                </small>
              </div>

              <b>→</b>
            </button>

            <div className={styles.quickPromptList}>
              <span>START WITH</span>

              {QUICK_PROMPTS.map(
                (item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      handleQuickPrompt(
                        item.prompt
                      )
                    }
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>

            <div className={styles.projectList}>
              {projectLoading ? (
                <div className={styles.projectLoading}>
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className={styles.noProjects}>
                  <strong>
                    No projects yet
                  </strong>

                  <p>
                    Start with an idea and
                    your project will be
                    saved here.
                  </p>

                  <button
                    type="button"
                    onClick={handleNewProject}
                  >
                    Start building
                  </button>
                </div>
              ) : (
                projects.map(
                  (project) => {
                    const id =
                      getProjectId(project);

                    const name =
                      getProjectName(project);

                    const active =
                      String(id) ===
                      String(
                        selectedProjectId
                      );

                    const files =
                      normalizeProjectFiles(
                        project,
                        null
                      );

                    return (
                      <button
                        key={
                          id || name
                        }
                        type="button"
                        className={`
                          ${styles.projectItem}
                          ${
                            active
                              ? styles.projectItemActive
                              : ""
                          }
                        `}
                        onClick={() =>
                          handleSelectProject(
                            project
                          )
                        }
                      >
                        <span
                          className={
                            styles.projectAvatar
                          }
                        >
                          {name
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span
                          className={
                            styles.projectItemCopy
                          }
                        >
                          <strong
                            title={name}
                          >
                            {name}
                          </strong>

                          <small>
                            {
                              getProjectFramework(
                                project
                              )
                            }

                            {files.length > 0
                              ? ` · ${files.length} files`
                              : ""}
                          </small>
                        </span>

                        {active && (
                          <i
                            className={
                              styles.projectActiveIndicator
                            }
                          />
                        )}
                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>


          {/* MAIN WORKSPACE */}

          <section
            className={`
              ${styles.mainWorkspace}
              ${
                mobilePanel === "workspace"
                  ? styles.mobileVisible
                  : ""
              }
            `}
          >
            <div className={styles.workspaceToolbar}>
              <div className={styles.workspaceTitle}>
                <span>APPLICATION</span>

                <strong title={projectName}>
                  {projectName}
                </strong>
              </div>

              <div className={styles.workspaceContext}>
                <div className={styles.contextItem}>
                  <span>ENV</span>

                  <select
                    value={activeEnvironment}
                    onChange={async (event) => {
                      const name =
                        event.target.value;

                      setActiveEnvironment(
                        name
                      );

                      if (
                        !selectedProjectId
                      ) {
                        return;
                      }

                      try {
                        const readiness =
                          await environmentService
                            .getDeploymentReadiness(
                              selectedProjectId,
                              name
                            );

                        setEnvironmentReadiness(
                          getServiceObject(
                            readiness,
                            [
                              "readiness",
                              "deploymentReadiness",
                            ]
                          )
                        );
                      } catch (err) {
                        setEnvironmentReadiness(
                          null
                        );

                        setBackendSyncError(
                          getErrorMessage(
                            err,
                            "Environment readiness could not be loaded."
                          )
                        );
                      }
                    }}
                    disabled={
                      loading ||
                      backendSyncing
                    }
                    className={
                      styles.environmentSelect
                    }
                    aria-label="Environment"
                  >
                    {(
                      environments.length
                        ? environments
                        : [
                            {
                              name:
                                "development",
                            },
                          ]
                    ).map(
                      (environment) => {
                        const name =
                          environment?.name ||
                          environment?.environment ||
                          "development";

                        return (
                          <option
                            key={name}
                            value={name}
                          >
                            {name}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>

                <span
                  className={
                    environmentStatus ===
                    "Ready"
                      ? styles.contextReady
                      : styles.contextPending
                  }
                >
                  {environmentStatus}
                </span>

                <span
                  className={
                    githubConnection
                      ? styles.contextReady
                      : styles.contextPending
                  }
                >
                  {githubConnection
                    ? "GitHub"
                    : "No GitHub"}
                </span>

                {backendSyncing && (
                  <span
                    className={
                      styles.contextSyncing
                    }
                  >
                    Syncing
                  </span>
                )}

                <span
                  className={
                    styles.contextDeployment
                  }
                >
                  {backendDeploymentStatus
                    ? normalizeDeploymentStatus(
                        backendDeploymentStatus
                      )
                    : "No deployment"}
                </span>
              </div>

              <div className={styles.toolbarActions}>
                <select
                  value={framework}
                  onChange={(event) =>
                    setFramework(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={
                    styles.frameworkSelect
                  }
                  aria-label="Framework"
                >
                  {FRAMEWORKS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className={
                    activeView === "preview"
                      ? styles.toolbarActive
                      : styles.toolbarButton
                  }
                  onClick={() =>
                    setActiveView("preview")
                  }
                >
                  Preview
                </button>

                <button
                  type="button"
                  className={
                    activeView === "code"
                      ? styles.toolbarActive
                      : styles.toolbarButton
                  }
                  onClick={() =>
                    setActiveView("code")
                  }
                >
                  Code
                </button>
              </div>
            </div>


            {/* WORK SURFACE */}

            <div className={styles.visualArea}>
              {activeView === "preview" ? (
                <div
                  className={
                    styles.previewShell
                  }
                >
                  <div
                    className={
                      styles.previewHeader
                    }
                  >
                    <div
                      className={
                        styles.browserDots
                      }
                    >
                      <i />
                      <i />
                      <i />
                    </div>

                    <span
                      className={
                        styles.previewProjectName
                      }
                      title={projectName}
                    >
                      {projectName}
                    </span>

                    <div
                      className={
                        styles.previewAddress
                      }
                    >
                      {previewUrl ||
                        "Authoritative preview runtime"}
                    </div>

                    <span
                      className={
                        previewReady
                          ? styles.previewReady
                          : styles.previewPending
                      }
                    >
                      {previewDisplayStatus}
                    </span>

                    {previewReady && (
                      <button
                        type="button"
                        onClick={openPreview}
                      >
                        Open
                      </button>
                    )}
                  </div>

                  <div
                    className={
                      styles.previewContent
                    }
                  >
                    {previewReady &&
                    previewUrl ? (
                      <iframe
                        title={`${projectName} application preview`}
                        src={previewUrl}
                        className={
                          styles.previewFrame
                        }
                        allow="fullscreen"
                      />
                    ) : (
                      <div
                        className={
                          styles.previewEmpty
                        }
                      >
                        <div
                          className={
                            styles.previewIcon
                          }
                        >
                          Z
                        </div>

                        <span>
                          BACKEND PREVIEW RUNTIME
                        </span>

                        <h2>
                          {previewState ===
                          "starting"
                            ? "Starting isolated runtime..."
                            : previewState ===
                              "blocked"
                            ? "Authoritative build required"
                            : previewState ===
                              "error"
                            ? "Preview runtime unavailable"
                            : "Project ready for build"}
                        </h2>

                        <p>
                          {previewState ===
                          "starting"
                            ? "The backend is preparing and health-checking the real preview runtime."
                            : previewState ===
                              "blocked"
                            ? "Project files exist, but ZyrionOS will not display a fake preview until Engineering Agent returns a successful authoritative build."
                            : previewError ||
                              (
                                authoritativeBuildReady
                                  ? "The authoritative build is ready. Start the real preview runtime."
                                  : "Generate and save the project, then complete the backend authoritative build."
                              )}
                        </p>

                        {authoritativeBuildReady &&
                          !previewPolling &&
                          !previewReady && (
                            <button
                              type="button"
                              onClick={openPreview}
                              disabled={
                                previewState ===
                                "starting"
                              }
                            >
                              {previewState ===
                              "error"
                                ? "Retry Preview"
                                : "Start Preview"}
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={
                    styles.codeSurface
                  }
                >
                  <div
                    className={
                      styles.codeSurfaceHeader
                    }
                  >
                    <div>
                      <span>
                        PROJECT FILES
                      </span>

                      <b>
                        {
                          generatedFiles.length
                        }
                      </b>
                    </div>

                    <button
                      type="button"
                      onClick={openFilesDrawer}
                    >
                      Open Files
                    </button>
                  </div>

                  <div
                    className={
                      styles.codeSurfaceBody
                    }
                  >
                    <div
                      className={
                        styles.codeFileList
                      }
                    >
                      {generatedFiles.map(
                        (file) => {
                          const filePath =
                            getFilePath(
                              file
                            );

                          const active =
                            selectedFile ===
                            file;

                          return (
                            <button
                              key={
                                file?._id ||
                                file?.id ||
                                filePath
                              }
                              type="button"
                              className={
                                active
                                  ? styles.codeFileActive
                                  : styles.codeFile
                              }
                              onClick={() =>
                                setSelectedFile(
                                  file
                                )
                              }
                              title={
                                filePath
                              }
                            >
                              <span>•</span>
                              {filePath}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <pre
                      className={
                        styles.codeEditor
                      }
                    >
                      {getFileContent(
                        selectedFile
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </section>


          {/* AI CHAT */}

          <aside
            className={`
              ${styles.chatArea}
              ${
                mobilePanel === "ai"
                  ? styles.mobileVisible
                  : ""
              }
            `}
          >
            <div
              className={
                styles.chatHeader
              }
            >
              <div>
                <span>
                  ZYRIONOS AI
                </span>

                <strong>
                  Build with conversation
                </strong>
              </div>

              <div
                className={
                  styles.chatHeaderStatus
                }
              >
                <i
                  className={
                    operationRunning
                      ? styles.chatStatusRunning
                      : styles.chatStatusReady
                  }
                />

                {operationRunning
                  ? "Working"
                  : "Ready"}
              </div>
            </div>

            <div
              className={
                styles.chatMessages
              }
            >
              {chatMessages.length === 0 ? (
                <div
                  className={
                    styles.chatWelcome
                  }
                >
                  <strong>
                    What should we build?
                  </strong>

                  <span>
                    Describe the application
                    or change in normal
                    language.
                  </span>

                  <div
                    className={
                      styles.chatQuickPrompts
                    }
                  >
                    {QUICK_PROMPTS.slice(
                      0,
                      3
                    ).map(
                      (item) => (
                        <button
                          key={
                            item.label
                          }
                          type="button"
                          onClick={() =>
                            handleQuickPrompt(
                              item.prompt
                            )
                          }
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                chatMessages.map(
                  (message) => (
                    <div
                      key={
                        message.id
                      }
                      className={
                        message.role ===
                        "user"
                          ? styles.chatMessageUser
                          : message.error
                          ? styles.chatMessageError
                          : styles.chatMessageAI
                      }
                    >
                      <div
                        className={
                          styles.chatMessageAvatar
                        }
                      >
                        {message.role ===
                        "user"
                          ? "U"
                          : "Z"}
                      </div>

                      <div
                        className={
                          styles.chatMessageBody
                        }
                      >
                        <div
                          className={
                            styles.chatMessageMeta
                          }
                        >
                          <strong>
                            {message.role ===
                            "user"
                              ? "You"
                              : "ZyrionOS AI"}
                          </strong>

                          <small>
                            {
                              message.timestamp
                            }
                          </small>
                        </div>

                        <p>
                          {
                            message.content
                          }
                        </p>

                        {message.fileCount && (
                          <button
                            type="button"
                            className={
                              styles.chatFilesButton
                            }
                            onClick={
                              openFilesDrawer
                            }
                          >
                            View{" "}
                            {
                              message.fileCount
                            }{" "}
                            generated files
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )
              )}

              <div
                ref={chatEndRef}
              />
            </div>

            <form
              className={
                styles.chatComposer
              }
              onSubmit={
                handleChatSubmit
              }
            >
              <div
                className={
                  styles.chatComposerTop
                }
              >
                <div>
                  <span>✓</span>

                  <strong>
                    {selectedProject
                      ? `Editing ${projectName}`
                      : "New application"}
                  </strong>
                </div>

                <small>
                  {framework}
                </small>
              </div>

              <textarea
                data-zyrionos-chat-input="true"
                value={prompt}
                onChange={(event) =>
                  setPrompt(
                    event.target.value
                  )
                }
                onKeyDown={
                  handlePromptKeyDown
                }
                disabled={loading}
                rows={3}
                placeholder={
                  selectedProject
                    ? "Tell ZyrionOS what to change..."
                    : "Describe the application you want to build..."
                }
              />

              <div
                className={
                  styles.chatComposerBottom
                }
              >
                <div
                  className={
                    styles.chatHints
                  }
                >
                  <span>
                    Enter to build
                  </span>

                  <span>
                    Shift + Enter for a new line
                  </span>
                </div>

                <div
                  className={
                    styles.chatActions
                  }
                >
                  {selectedProject && (
                    <button
                      type="button"
                      className={
                        styles.reviewButton
                      }
                      disabled={loading}
                      onClick={
                        handleReviewFix
                      }
                    >
                      Review / Fix
                    </button>
                  )}

                  <button
                    type="submit"
                    className={
                      styles.buildButton
                    }
                    disabled={
                      loading ||
                      !prompt.trim()
                    }
                  >
                    {loading
                      ? "Working..."
                      : selectedProject
                      ? "Apply Change"
                      : "Build App"}

                    <span>→</span>
                  </button>
                </div>
              </div>
            </form>
          </aside>


          {/* ACTIVITY */}

          <aside
            className={`
              ${styles.activityPanel}
              ${
                mobilePanel === "activity"
                  ? styles.mobileVisible
                  : ""
              }
            `}
          >
            <div
              className={
                styles.activityPanelHeader
              }
            >
              <div>
                <span>WORKSPACE</span>

                <strong>
                  Activity
                </strong>
              </div>

              <span
                className={
                  operationRunning
                    ? styles.activityRunning
                    : styles.activityReady
                }
              >
                {operationRunning
                  ? "Working"
                  : "Ready"}
              </span>
            </div>

            <div
              className={
                styles.activityPanelBody
              }
            >
              <div
                className={
                  styles.currentOperation
                }
              >
                <span>
                  CURRENT STATUS
                </span>

                <strong>
                  {operationRunning
                    ? currentOperationLabel
                    : "Workspace ready"}
                </strong>

                <p>
                  {operationRunning
                    ? "ZyrionOS is processing your request."
                    : "Ready for the next request."}
                </p>

                <div
                  className={
                    styles.backendStatusGrid
                  }
                >
                  <span>
                    BUILD {buildState}
                  </span>

                  <span>
                    PREVIEW{" "}
                    {
                      previewDisplayStatus
                    }
                  </span>

                  <span>
                    ENV {environmentStatus}
                  </span>

                  <span>
                    DEPLOY{" "}
                    {backendDeploymentStatus
                      ? normalizeDeploymentStatus(
                          backendDeploymentStatus
                        )
                      : deploymentStatus}
                  </span>
                </div>

                {authoritativeBuildReady && (
                  <p>
                    Build:{" "}
                    {
                      getAuthoritativeBuildId(
                        authoritativeBuild
                      )
                    }
                  </p>
                )}

                {operationRunning && (
                  <div
                    className={
                      styles.workingDotsLarge
                    }
                  >
                    <i />
                    <i />
                    <i />
                  </div>
                )}
              </div>

              <div
                className={
                  styles.activityListCard
                }
              >
                <div
                  className={
                    styles.activityListHeader
                  }
                >
                  <span>ACTIVITY</span>

                  <b>
                    {
                      combinedActivityLog.length
                    }
                  </b>
                </div>

                {combinedActivityLog.length ===
                0 ? (
                  <p
                    className={
                      styles.activityEmpty
                    }
                  >
                    Activity will appear here
                    while your project is being
                    processed.
                  </p>
                ) : (
                  <div
                    className={
                      styles.activityItems
                    }
                  >
                    {combinedActivityLog
                      .slice()
                      .reverse()
                      .map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className={
                              styles.activityItem
                            }
                          >
                            <i
                              className={
                                item.type ===
                                "success"
                                  ? styles.dotSuccess
                                  : item.type ===
                                    "error"
                                  ? styles.dotError
                                  : item.type ===
                                    "active"
                                  ? styles.dotActive
                                  : styles.dotInfo
                              }
                            />

                            <div>
                              <p>
                                {
                                  item.message
                                }
                              </p>

                              <small>
                                {
                                  item.timestamp
                                }
                              </small>
                            </div>
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>

              <div
                className={
                  styles.projectStats
                }
              >
                <div>
                  <span>
                    PROJECT FILES
                  </span>

                  <strong>
                    {
                      generatedFiles.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    FRAMEWORK
                  </span>

                  <strong>
                    {framework}
                  </strong>
                </div>

                <div>
                  <span>BUILD</span>

                  <strong>
                    {buildState}
                  </strong>
                </div>

                <div>
                  <span>PREVIEW</span>

                  <strong>
                    {
                      previewDisplayStatus
                    }
                  </strong>
                </div>

                <div>
                  <span>GITHUB</span>

                  <strong>
                    {githubStatus ===
                    "active"
                      ? "Connected"
                      : "Not connected"}
                  </strong>
                </div>
              </div>
            </div>
          </aside>
        </section>


        {/* FILE DRAWER */}

        {filesDrawerOpen && (
          <div
            className={
              styles.drawerOverlay
            }
            onClick={
              closeFilesDrawer
            }
          >
            <aside
              className={
                styles.filesDrawer
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                className={
                  styles.drawerHeader
                }
              >
                <div>
                  <span>PROJECT</span>

                  <strong>Files</strong>
                </div>

                <button
                  type="button"
                  onClick={
                    closeFilesDrawer
                  }
                  aria-label="Close files"
                >
                  ×
                </button>
              </div>

              <div
                className={
                  styles.drawerProject
                }
              >
                <strong>
                  {projectName}
                </strong>

                <small>
                  {
                    generatedFiles.length
                  }{" "}
                  files · {framework}
                </small>
              </div>

              <div
                className={
                  styles.drawerFiles
                }
              >
                {generatedFiles.length ===
                0 ? (
                  <div
                    className={
                      styles.drawerEmpty
                    }
                  >
                    No project files
                    available.
                  </div>
                ) : (
                  generatedFiles.map(
                    (file) => {
                      const filePath =
                        getFilePath(
                          file
                        );

                      const active =
                        selectedFile ===
                        file;

                      return (
                        <button
                          key={
                            file?._id ||
                            file?.id ||
                            filePath
                          }
                          type="button"
                          className={
                            active
                              ? styles.drawerFileActive
                              : styles.drawerFile
                          }
                          onClick={() =>
                            handleFileSelect(
                              file
                            )
                          }
                        >
                          <span>•</span>

                          <strong
                            title={
                              filePath
                            }
                          >
                            {filePath}
                          </strong>
                        </button>
                      );
                    }
                  )
                )}
              </div>

              <div
                className={
                  styles.drawerFooter
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    closeFilesDrawer();

                    setActiveView(
                      "code"
                    );
                  }}
                >
                  Open Code View
                </button>
              </div>
            </aside>
          </div>
        )}


        {/* ACTIVITY DRAWER */}

        {activityDrawerOpen && (
          <div
            className={
              styles.drawerOverlay
            }
            onClick={
              closeActivityDrawer
            }
          >
            <aside
              className={
                styles.activityDrawer
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                className={
                  styles.drawerHeader
                }
              >
                <div>
                  <span>WORKSPACE</span>

                  <strong>
                    Activity
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={
                    closeActivityDrawer
                  }
                  aria-label="Close activity"
                >
                  ×
                </button>
              </div>

              <div
                className={
                  styles.activityDrawerBody
                }
              >
                {combinedActivityLog.length ===
                0 ? (
                  <p>
                    No activity yet.
                  </p>
                ) : (
                  combinedActivityLog
                    .slice()
                    .reverse()
                    .map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className={
                            styles.activityItem
                          }
                        >
                          <i
                            className={
                              item.type ===
                              "success"
                                ? styles.dotSuccess
                                : item.type ===
                                  "error"
                                ? styles.dotError
                                : item.type ===
                                  "active"
                                ? styles.dotActive
                                : styles.dotInfo
                            }
                          />

                          <div>
                            <p>
                              {
                                item.message
                              }
                            </p>

                            <small>
                              {
                                item.timestamp
                              }
                            </small>
                          </div>
                        </div>
                      )
                    )
                )}
              </div>
            </aside>
          </div>
        )}


        {/* FULLSCREEN PREVIEW */}

        {previewFullscreen && (
          <div
            className={
              styles.previewOverlay
            }
            role="dialog"
            aria-modal="true"
            aria-label="Application preview"
          >
            <div
              className={
                styles.previewOverlayHeader
              }
            >
              <div>
                <span>PREVIEW</span>

                <strong
                  title={projectName}
                >
                  {projectName}
                </strong>
              </div>

              <div
                className={
                  styles.previewOverlayActions
                }
              >
                {previewReady &&
                  previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={
                        styles.previewExternalButton
                      }
                    >
                      Open in new tab
                    </a>
                  )}

                {previewReady && (
                  <button
                    type="button"
                    onClick={
                      handleStopPreview
                    }
                    className={
                      styles.previewCloseButton
                    }
                  >
                    Stop Preview
                  </button>
                )}

                <button
                  type="button"
                  onClick={closePreview}
                  className={
                    styles.previewCloseButton
                  }
                >
                  Close Preview
                </button>
              </div>
            </div>

            <div
              className={
                styles.previewOverlayBody
              }
            >
              {previewReady &&
              previewUrl ? (
                <iframe
                  title={`${projectName} full preview`}
                  src={previewUrl}
                  className={
                    styles.previewFullFrame
                  }
                  allow="fullscreen"
                />
              ) : (
                <div
                  className={
                    styles.previewUnavailable
                  }
                >
                  <div
                    className={
                      styles.previewIconLarge
                    }
                  >
                    Z
                  </div>

                  <span>
                    AUTHORITATIVE PREVIEW
                  </span>

                  <h2>
                    {previewState ===
                    "starting"
                      ? "Starting runtime..."
                      : previewState ===
                        "error"
                      ? "Runtime unavailable"
                      : "No live runtime"}
                  </h2>

                  <p>
                    {previewError ||
                      (
                        authoritativeBuildReady
                          ? "The authoritative build exists, but the preview runtime has not returned a healthy URL yet."
                          : "No authoritative build is available. ZyrionOS will not simulate a preview."
                      )}
                  </p>

                  {authoritativeBuildReady &&
                    !previewReady && (
                      <button
                        type="button"
                        onClick={
                          openPreview
                        }
                        disabled={
                          previewState ===
                          "starting"
                        }
                      >
                        Start Real Preview
                      </button>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}


export default Workspace;
