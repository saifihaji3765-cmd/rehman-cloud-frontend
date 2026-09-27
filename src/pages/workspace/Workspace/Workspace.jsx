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
} from "../../../services/workspaceService";

import {
  generateCode,
  getGeneratedFiles,
  normalizeAIResponse,
} from "../../../services/aiService";

import {
  listEnvironments,
  getDeploymentReadiness,
} from "../../../services/environmentService";

import {
  getLatestLog,
} from "../../../services/deploymentLogService";

import {
  getConnections,
} from "../../../services/githubService";

import styles from "./Workspace.module.css";

import {
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";

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
    prompt: "Build a production-ready AI SaaS dashboard",
  },
  {
    label: "Landing page",
    prompt: "Create a production-ready responsive landing page",
  },
  {
    label: "Authentication",
    prompt: "Add authentication and user accounts",
  },
  {
    label: "Admin control center",
    prompt: "Build a production-ready admin control center",
  },
];

/* =========================================================
   LOCAL PREVIEW RUNTIME
========================================================= */

function buildSandpackFiles(files) {
  const result = {};

  for (const file of Array.isArray(files) ? files : []) {
    const rawPath = getFilePath(file);
    const content = getFileContent(file);

    if (!rawPath || content === null || content === undefined) {
      continue;
    }

    let path = String(rawPath)
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");

    if (!path) {
      continue;
    }

    if (path.toLowerCase() === "public/index.html") {
      path = "index.html";
    }

    result[`/${path}`] = {
      code: String(content),
      active:
        path === "src/App.jsx" ||
        path === "src/App.js",
    };
  }

  return result;
}

function getSandpackDependencies(files) {
  const packageFile = findFile(files, [
    "package.json",
  ]);

  if (!packageFile) {
    return {};
  }

  try {
    const parsed = JSON.parse(
      getFileContent(packageFile) || "{}"
    );

    const dependencies = {
      ...(parsed?.dependencies || {}),
    };

    for (const [name, version] of Object.entries(
      parsed?.devDependencies || {}
    )) {
      if (!dependencies[name]) {
        dependencies[name] = version;
      }
    }

    delete dependencies.react;
    delete dependencies["react-dom"];

    return dependencies;
  } catch {
    return {};
  }
}

function getSandpackTemplate(framework) {
  const value = String(framework || "React")
    .trim()
    .toLowerCase();

  if (value === "vue") {
    return "vue";
  }

  return "react";
}

function LocalProjectPreview({
  files,
  framework,
  fullscreen = false,
}) {
  const sandpackFiles = useMemo(
    () => buildSandpackFiles(files),
    [files]
  );

  const dependencies = useMemo(
    () => getSandpackDependencies(files),
    [files]
  );

  const template = useMemo(
    () => getSandpackTemplate(framework),
    [framework]
  );

  const hasEntry = Boolean(
    sandpackFiles["/src/index.js"] ||
      sandpackFiles["/src/main.jsx"] ||
      sandpackFiles["/src/main.js"] ||
      sandpackFiles["/src/index.jsx"] ||
      sandpackFiles["/index.js"] ||
      sandpackFiles["/App.js"] ||
      sandpackFiles["/App.jsx"]
  );

  if (!hasEntry) {
    return (
      <div className={styles.previewUnavailable}>
        <div className={styles.previewIconLarge}>
          Z
        </div>

        <span>PREVIEW RUNTIME</span>

        <p>
          No React/Vue entry file was found in
          the generated project.
        </p>
      </div>
    );
  }

  const entry =
    sandpackFiles["/src/index.js"]
      ? "/src/index.js"
      : sandpackFiles["/src/main.jsx"]
      ? "/src/main.jsx"
      : sandpackFiles["/src/main.js"]
      ? "/src/main.js"
      : sandpackFiles["/src/index.jsx"]
      ? "/src/index.jsx"
      : sandpackFiles["/App.jsx"]
      ? "/App.jsx"
      : "/App.js";

  return (
    <div
      className={styles.sandpackPreviewHost}
      style={{
        width: "100%",
        height: "100%",
        minHeight: fullscreen
          ? "100%"
          : "520px",
        overflow: "hidden",
      }}
    >
      <SandpackProvider
        template={template}
        files={sandpackFiles}
        customSetup={{
          dependencies,
          entry,
        }}
        options={{
          activeFile:
            sandpackFiles["/src/App.jsx"]
              ? "/src/App.jsx"
              : sandpackFiles["/src/App.js"]
              ? "/src/App.js"
              : undefined,
          autorun: true,
          recompileMode: "delayed",
        }}
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton
          style={{
            width: "100%",
            height: "100%",
            minHeight: fullscreen
              ? "100%"
              : "520px",
            border: "0",
          }}
        />
      </SandpackProvider>
    </div>
  );
}

/* =========================================================
   API RESPONSE HELPERS
========================================================= */

function unwrapApiResponse(response) {
  if (
    response === undefined ||
    response === null
  ) {
    return null;
  }

  const root =
    response?.data !== undefined
      ? response.data
      : response;

  if (
    root &&
    typeof root === "object" &&
    !Array.isArray(root) &&
    root.data !== undefined
  ) {
    return root.data;
  }

  return root;
}

function extractProjectFromResponse(response) {
  const root =
    response?.data !== undefined
      ? response.data
      : response;

  const candidates = [
    root?.project,
    root?.data?.project,
    root?.data,
    response?.project,
    response?.data?.project,
    response?.data?.data?.project,
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
  const root =
    response?.data !== undefined
      ? response.data
      : response;

  const candidates = [
    root?.projects,
    root?.data?.projects,
    root?.data,
    response?.projects,
    response?.data?.projects,
    response?.data?.data?.projects,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return Array.isArray(root) ? root : [];
}

function extractCollection(
  response,
  keys = []
) {
  const root =
    response?.data !== undefined
      ? response.data
      : response;

  const candidates = [
    root,
    root?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object"
    ) {
      for (const key of keys) {
        if (Array.isArray(candidate[key])) {
          return candidate[key];
        }
      }
    }
  }

  return [];
}

function extractObject(
  response,
  keys = []
) {
  const root =
    response?.data !== undefined
      ? response.data
      : response;

  const candidates = [
    root,
    root?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      continue;
    }

    for (const key of keys) {
      if (
        candidate[key] &&
        typeof candidate[key] === "object"
      ) {
        return candidate[key];
      }
    }

    if (
      candidate._id ||
      candidate.id ||
      candidate.status ||
      candidate.name ||
      candidate.environmentName
    ) {
      return candidate;
    }
  }

  return null;
}

/* =========================================================
   PROJECT NAMING
========================================================= */

function buildProjectName(promptValue) {
  const value = String(promptValue || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) {
    return "New Project";
  }

  const cleaned = value
    .replace(
      /^(please\s+)?(build|create|make|develop|design|generate|add)\s+/i,
      ""
    )
    .replace(
      /\s+(for|with)\s+me$/i,
      ""
    )
    .trim();

  const source = cleaned || value;

  const words = source
    .split(" ")
    .slice(0, 8);

  const title = words
    .join(" ")
    .replace(/[.!?]+$/, "")
    .trim();

  if (!title) {
    return "New Project";
  }

  return (
    title.charAt(0).toUpperCase() +
    title.slice(1)
  );
}

/* =========================================================
   FILE HELPERS
========================================================= */

function normalizeProjectFiles(
  project,
  aiResult
) {
  const possibleCollections = [
    project?.files,
    project?.data?.files,
    project?.project?.files,
    project?.data?.project?.files,

    aiResult?.files,
    aiResult?.data?.files,
    aiResult?.project?.files,
    aiResult?.data?.project?.files,

    aiResult?.orchestration?.buildResult
      ?.data?.files,

    aiResult?.orchestration?.buildResult
      ?.files,

    aiResult?.orchestration?.buildResult
      ?.data?.data?.files,

    aiResult?.data?.orchestration
      ?.buildResult?.data?.files,

    aiResult?.data?.orchestration
      ?.buildResult?.files,

    aiResult?.data?.orchestration
      ?.buildResult?.data?.data?.files,
  ];

  for (const files of possibleCollections) {
    if (Array.isArray(files)) {
      return files;
    }
  }

  return [];
}

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
    return "No project file selected.";
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

  return "The backend returned this file without readable content.";
}

function findFile(files, names) {
  const normalized = names.map((name) =>
    String(name)
      .replace(/^\.?\//, "")
      .toLowerCase()
  );

  return files.find((file) => {
    const path = getFilePath(file)
      .replace(/^\.?\//, "")
      .toLowerCase();

    return normalized.includes(path);
  });
}

/* =========================================================
   PREVIEW HELPERS
========================================================= */

function getPreviewUrl(project) {
  return (
    project?.previewUrl ||
    project?.preview?.url ||
    project?.preview?.liveUrl ||
    project?.liveUrl ||
    project?.deploymentUrl ||
    project?.deployment?.url ||
    project?.deployment?.liveUrl ||
    ""
  );
}

function getPreviewStatus(project) {
  return String(
    project?.previewStatus ||
      project?.preview?.status ||
      ""
  )
    .trim()
    .toLowerCase();
}

/* =========================================================
   DEPLOYMENT STATUS
========================================================= */

function normalizeDeploymentStatus(status) {
  const value = String(status || "")
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

function getLatestDeploymentLogStatus(log) {
  return normalizeDeploymentStatus(
    log?.status ||
      log?.deploymentStatus ||
      log?.stage ||
      log?.state
  );
}

/* =========================================================
   ENVIRONMENT HELPERS
========================================================= */

function getEnvironmentName(environment) {
  return (
    environment?.name ||
    environment?.environmentName ||
    ""
  );
}

function isEnvironmentReady(readiness) {
  return (
    readiness?.ready === true ||
    readiness?.isReady === true ||
    readiness?.deploymentReady === true
  );
}

/* =========================================================
   ERROR HELPERS
========================================================= */

function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
}

/* =========================================================
   CHAT
========================================================= */

function createMessage(
  role,
  content,
  extra = {}
) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    timestamp:
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    ...extra,
  };
}

/* =========================================================
   COMPONENT
========================================================= */

function Workspace() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] =
    useState(null);

  const selectedProjectRef =
    useRef(null);

  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] =
    useState("React");

  const [loading, setLoading] =
    useState(false);

  const [generatedFiles, setGeneratedFiles] =
    useState([]);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [chatMessages, setChatMessages] =
    useState([]);

  const [deploymentStatus, setDeploymentStatus] =
    useState("Not deployed");

  const [deploymentLog, setDeploymentLog] =
    useState(null);

  const [environmentList, setEnvironmentList] =
    useState([]);

  const [
    selectedEnvironment,
    setSelectedEnvironment,
  ] = useState("development");

  const [
    environmentReadiness,
    setEnvironmentReadiness,
  ] = useState(null);

  const [
    githubConnections,
    setGithubConnections,
  ] = useState([]);

  const [backendSyncing, setBackendSyncing] =
    useState(false);

  const [liveUrl, setLiveUrl] =
    useState("");

  const [activeView, setActiveView] =
    useState("preview");

  const [mobilePanel, setMobilePanel] =
    useState("workspace");

  const [
    filesDrawerOpen,
    setFilesDrawerOpen,
  ] = useState(false);

  const [
    activityDrawerOpen,
    setActivityDrawerOpen,
  ] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [
    projectLoading,
    setProjectLoading,
  ] = useState(true);

  const [operation, setOperation] =
    useState("idle");

  const [
    operationStartedAt,
    setOperationStartedAt,
  ] = useState(null);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [activityLog, setActivityLog] =
    useState([]);

  const [
    previewFullscreen,
    setPreviewFullscreen,
  ] = useState(false);

  const chatEndRef = useRef(null);

  const initialLoadStarted =
    useRef(false);

  const projectName =
    getProjectName(selectedProject);

  const selectedProjectId =
    getProjectId(selectedProject);

  const projectCount =
    projects.length;

  const previewUrl =
    liveUrl ||
    getPreviewUrl(selectedProject);

  const previewStatus =
    getPreviewStatus(selectedProject);

  const operationRunning =
    operation !== "idle";

  const currentOperationLabel =
    useMemo(() => {
      if (operation === "build") {
        return "Building";
      }

      if (operation === "change") {
        return "Applying changes";
      }

      if (operation === "deploy") {
        return "Deploying";
      }

      return "Ready";
    }, [operation]);

  const previewEntryFile =
    useMemo(() => {
      return (
        findFile(generatedFiles, [
          "index.html",
          "public/index.html",
        ]) || null
      );
    }, [generatedFiles]);

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
            (Date.now() -
              operationStartedAt) /
              1000
          )
        )
      );
    };

    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );

    return () =>
      window.clearInterval(timer);
  }, [operationStartedAt]);

  /* =======================================================
     CHAT AUTO SCROLL
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
     ACTIVITY
  ======================================================= */

  const addActivity =
    useCallback(
      (message, type = "info") => {
        setActivityLog(
          (previous) =>
            [
              ...previous,
              {
                id: `${Date.now()}-${Math.random()}`,
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
            ].slice(-40)
        );
      },
      []
    );

  const startOperation =
    useCallback(
      (type, message) => {
        setOperation(type);
        setOperationStartedAt(
          Date.now()
        );
        addActivity(
          message,
          "active"
        );
      },
      [addActivity]
    );

  const finishOperation =
    useCallback(
      (success, message) => {
        addActivity(
          message,
          success
            ? "success"
            : "error"
        );

        setOperation("idle");
        setOperationStartedAt(null);
      },
      [addActivity]
    );

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
      setSelectedFile(
        files[0] || null
      );

      setDeploymentStatus(
        normalizeDeploymentStatus(
          project?.deploymentStatus ||
            project?.deployment?.status
        )
      );

      setLiveUrl(
        getPreviewUrl(project)
      );

      const projectFramework =
        getProjectFramework(project);

      if (
        FRAMEWORKS.includes(
          projectFramework
        )
      ) {
        setFramework(
          projectFramework
        );
      }
    }, []);

  /* =======================================================
     LOAD PROJECTS
  ======================================================= */

  const loadProjects =
    useCallback(
      async (
        preferredProjectId = ""
      ) => {
        try {
          setProjectLoading(true);

          const response =
            await getProjects();

          const normalized =
            normalizeProjects(
              response
            );

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
                    getProjectId(
                      project
                    )
                  ) ===
                  String(currentId)
              );

            if (preferred) {
              applySelectedProject(
                preferred
              );

              return normalized;
            }
          }

          if (
            normalized.length > 0
          ) {
            applySelectedProject(
              normalized[0]
            );
          } else {
            selectedProjectRef.current =
              null;

            setSelectedProject(
              null
            );

            setGeneratedFiles(
              []
            );

            setSelectedFile(
              null
            );

            setDeploymentStatus(
              "Not deployed"
            );

            setLiveUrl("");
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
          setProjectLoading(
            false
          );
        }
      },
      [applySelectedProject]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (initialLoadStarted.current) {
      return;
    }

    initialLoadStarted.current =
      true;

    loadProjects();
  }, [loadProjects]);

  /* =======================================================
     BACKEND SERVICE SYNCHRONIZATION
     No streaming. Deployment logs are polled.
  ======================================================= */

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const syncBackendState =
      async () => {
        const projectId =
          getProjectId(
            selectedProjectRef.current
          );

        if (!projectId) {
          if (!cancelled) {
            setDeploymentLog(
              null
            );

            setEnvironmentList(
              []
            );

            setEnvironmentReadiness(
              null
            );

            setGithubConnections(
              []
            );

            setBackendSyncing(
              false
            );
          }

          return;
        }

        try {
          if (!cancelled) {
            setBackendSyncing(
              true
            );
          }

          const [
            logsResult,
            environmentsResult,
            githubResult,
          ] =
            await Promise.allSettled([
              getLatestLog({
                projectId,
              }),

              listEnvironments(
                projectId,
                false
              ),

              getConnections({
                projectId,
              }),
            ]);

          if (cancelled) {
            return;
          }

          if (
            logsResult.status ===
            "fulfilled"
          ) {
            const latest =
              extractObject(
                logsResult.value,
                [
                  "log",
                  "deploymentLog",
                  "latest",
                ]
              );

            if (latest) {
              setDeploymentLog(
                latest
              );

              const syncedStatus =
                getLatestDeploymentLogStatus(
                  latest
                );

              if (
                syncedStatus !==
                "Not deployed"
              ) {
                setDeploymentStatus(
                  syncedStatus
                );
              }
            }
          }

          if (
            environmentsResult.status ===
            "fulfilled"
          ) {
            const environments =
              extractCollection(
                environmentsResult.value,
                [
                  "environments",
                  "items",
                ]
              );

            setEnvironmentList(
              environments
            );

            const current =
              environments.find(
                (environment) =>
                  getEnvironmentName(
                    environment
                  ) ===
                  selectedEnvironment
              );

            if (
              !current &&
              environments.length > 0
            ) {
              setSelectedEnvironment(
                getEnvironmentName(
                  environments[0]
                )
              );
            }
          }

          if (
            githubResult.status ===
            "fulfilled"
          ) {
            setGithubConnections(
              extractCollection(
                githubResult.value,
                [
                  "connections",
                  "items",
                ]
              )
            );
          }
        } catch (err) {
          console.error(
            "Workspace backend sync error:",
            err
          );
        } finally {
          if (!cancelled) {
            setBackendSyncing(
              false
            );
          }
        }
      };

    syncBackendState();

    timer =
      window.setInterval(
        syncBackendState,
        5000
      );

    return () => {
      cancelled = true;

      if (timer) {
        window.clearInterval(
          timer
        );
      }
    };
  }, [
    selectedProjectId,
    selectedEnvironment,
  ]);

  /* =======================================================
     ENVIRONMENT READINESS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadReadiness =
      async () => {
        const projectId =
          getProjectId(
            selectedProjectRef.current
          );

        const environmentName =
          String(
            selectedEnvironment ||
              ""
          ).trim();

        if (
          !projectId ||
          !environmentName
        ) {
          setEnvironmentReadiness(
            null
          );

          return;
        }

        try {
          const response =
            await getDeploymentReadiness(
              projectId,
              environmentName
            );

          if (!cancelled) {
            setEnvironmentReadiness(
              extractObject(
                response,
                [
                  "readiness",
                  "deploymentReadiness",
                ]
              ) ||
                unwrapApiResponse(
                  response
                )
            );
          }
        } catch (err) {
          if (!cancelled) {
            setEnvironmentReadiness(
              {
                ready: false,
                error:
                  getErrorMessage(
                    err,
                    "Environment readiness could not be checked."
                  ),
              }
            );
          }
        }
      };

    loadReadiness();

    return () => {
      cancelled = true;
    };
  }, [
    selectedProjectId,
    selectedEnvironment,
  ]);

  /* =======================================================
     PROJECT SELECTION
  ======================================================= */

  const handleSelectProject =
    useCallback(
      (project) => {
        setError("");
        setNotice("");
        setActivityLog([]);
        setChatMessages([]);

        setActiveView(
          "preview"
        );

        setMobilePanel(
          "workspace"
        );

        setFilesDrawerOpen(
          false
        );

        setActivityDrawerOpen(
          false
        );

        setPreviewFullscreen(
          false
        );

        applySelectedProject(
          project
        );
      },
      [applySelectedProject]
    );

  /* =======================================================
     NEW PROJECT
  ======================================================= */

  const handleNewProject =
    useCallback(() => {
      selectedProjectRef.current =
        null;

      setSelectedProject(
        null
      );

      setGeneratedFiles(
        []
      );

      setSelectedFile(
        null
      );

      setPrompt("");
      setChatMessages([]);

      setLiveUrl("");
      setDeploymentStatus(
        "Not deployed"
      );

      setDeploymentLog(
        null
      );

      setEnvironmentReadiness(
        null
      );

      setActiveView(
        "preview"
      );

      setMobilePanel(
        "workspace"
      );

      setFilesDrawerOpen(
        false
      );

      setActivityDrawerOpen(
        false
      );

      setPreviewFullscreen(
        false
      );

      setError("");
      setNotice("");
      setActivityLog([]);

      setOperation("idle");
      setOperationStartedAt(
        null
      );
    }, []);

  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  const handleQuickPrompt =
    useCallback(
      (value) => {
        setPrompt(value);
        setError("");
        setNotice("");
        setMobilePanel(
          "workspace"
        );

        window.setTimeout(() => {
          document
            .querySelector(
              '[data-zyrionos-chat-input="true"]'
            )
            ?.focus();
        }, 50);
      },
      []
    );

  /* =======================================================
     BUILD / CHANGE
  ======================================================= */

  const handleBuild =
    useCallback(
      async (
        suppliedPrompt = ""
      ) => {
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
          Boolean(
            selectedProjectId
          );

        try {
          setError("");
          setNotice("");
          setLoading(true);

          setActiveView(
            "preview"
          );

          setMobilePanel(
            "workspace"
          );

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
              : "Your application is being built..."
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
                  `Environment: ${selectedEnvironment}`,
                  "",
                  "User request:",
                  userPrompt,
                  "",
                  "Return the complete project files required for the implementation.",
                  "Preserve working functionality unless the requested change requires modifying it.",
                ].join("\n")
              : [
                  userPrompt,
                  "",
                  `Target environment: ${selectedEnvironment}`,
                ].join("\n");

          addActivity(
            "Generating the application files...",
            "active"
          );

          const aiResult =
            await generateCode(
              instruction,
              framework
            );

          addActivity(
            "Application files generated.",
            "success"
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
            filesFromAI.length ===
            0
          ) {
            throw new Error(
              "AI generation completed, but no project files were returned by the backend."
            );
          }

          addActivity(
            `${filesFromAI.length} project files received.`,
            "success"
          );

          setChatMessages(
            (previous) => [
              ...previous,
              createMessage(
                "assistant",
                assistantText ||
                  `The application is ready. ${filesFromAI.length} files were generated.`,
                {
                  fileCount:
                    filesFromAI.length,
                }
              ),
            ]
          );

          /* ===============================================
             CREATE NEW PROJECT
          =============================================== */

          if (!isExistingProject) {
            const generatedProjectName =
              buildProjectName(
                userPrompt
              );

            addActivity(
              "Saving the project to your workspace...",
              "active"
            );

            const projectResponse =
              await createProject({
                projectName:
                  generatedProjectName,

                description:
                  userPrompt,

                framework,

                files:
                  filesFromAI,
              });

            let createdProject =
              extractProjectFromResponse(
                projectResponse
              );

            if (
              !createdProject
            ) {
              const unwrapped =
                unwrapApiResponse(
                  projectResponse
                );

              if (
                unwrapped &&
                typeof unwrapped ===
                  "object" &&
                !Array.isArray(
                  unwrapped
                ) &&
                (
                  unwrapped._id ||
                  unwrapped.id ||
                  unwrapped.projectName ||
                  Array.isArray(
                    unwrapped.files
                  )
                )
              ) {
                createdProject =
                  unwrapped;
              }
            }

            if (
              createdProject
            ) {
              const savedFiles =
                normalizeProjectFiles(
                  createdProject,
                  null
                );

              const finalFiles =
                savedFiles.length > 0
                  ? savedFiles
                  : filesFromAI;

              const projectWithFiles =
                {
                  ...createdProject,

                  projectName:
                    getProjectName(
                      createdProject
                    ) ||
                    generatedProjectName,

                  files:
                    finalFiles,
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

              const createdId =
                getProjectId(
                  createdProject
                );

              if (createdId) {
                await loadProjects(
                  createdId
                );
              } else {
                await loadProjects();
              }
            } else {
              await loadProjects();
            }

            setNotice(
              `${generatedProjectName} was created and saved to your projects.`
            );
          } else {
            /* =============================================
               UPDATE EXISTING PROJECT
            ============================================= */

            addActivity(
              "Saving the updated project...",
              "active"
            );

            const updateResponse =
              await updateProject(
                selectedProjectId,
                {
                  files:
                    filesFromAI,
                }
              );

            const updatedProject =
              extractProjectFromResponse(
                updateResponse
              );

            if (
              updatedProject
            ) {
              const returnedFiles =
                normalizeProjectFiles(
                  updatedProject,
                  null
                );

              applySelectedProject({
                ...updatedProject,

                files:
                  returnedFiles.length >
                  0
                    ? returnedFiles
                    : filesFromAI,
              });
            } else {
              await loadProjects(
                selectedProjectId
              );
            }

            setGeneratedFiles(
              filesFromAI
            );

            setSelectedFile(
              filesFromAI[0] ||
                null
            );

            setNotice(
              `Changes saved to ${projectName}.`
            );

            addActivity(
              "Project changes saved.",
              "success"
            );
          }

          setPrompt("");

          setActiveView(
            "preview"
          );

          finishOperation(
            true,
            isExistingProject
              ? "Changes completed successfully."
              : "Project build completed successfully."
          );
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

          setError(message);

          finishOperation(
            false,
            "The build could not be completed."
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
        selectedEnvironment,
        startOperation,
        addActivity,
        applySelectedProject,
        loadProjects,
        finishOperation,
      ]
    );

  /* =======================================================
     CHAT SUBMIT
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

        const reviewInstruction =
          prompt.trim()
            ? [
                "Review and improve the current project.",
                "",
                `Project ID: ${selectedProjectId}`,
                `Project name: ${projectName}`,
                `Environment: ${selectedEnvironment}`,
                "",
                "Requested review/change:",
                prompt.trim(),
                "",
                "Return the complete project files required for the implementation.",
              ].join("\n")
            : [
                "Review the current project.",
                "",
                `Environment: ${selectedEnvironment}`,
                "",
                "Check for implementation errors, broken user experience, responsive issues, accessibility problems, and incomplete functionality.",
                "",
                "Return the complete project files required for any fixes.",
              ].join("\n");

        setPrompt(
          reviewInstruction
        );

        await handleBuild(
          reviewInstruction
        );
      },
      [
        selectedProjectId,
        loading,
        prompt,
        projectName,
        selectedEnvironment,
        handleBuild,
      ]
    );

  /* =======================================================
     DEPLOY
  ======================================================= */

  const handleDeploy =
    useCallback(() => {
      const projectId =
        getProjectId(
          selectedProject
        );

      if (!projectId) {
        setError(
          "Select a project before deploying."
        );

        return;
      }

      if (
        generatedFiles.length ===
        0
      ) {
        setError(
          "This project has no generated files to deploy."
        );

        return;
      }

      if (
        environmentReadiness &&
        !isEnvironmentReady(
          environmentReadiness
        )
      ) {
        setError(
          `The ${selectedEnvironment} environment is not ready for deployment.`
        );

        return;
      }

      setError("");

      setNotice(
        "Opening the deployment flow for this project..."
      );

      setDeploymentStatus(
        "Pending"
      );

      setOperation(
        "deploy"
      );

      setOperationStartedAt(
        Date.now()
      );

      addActivity(
        `Deployment requested for ${selectedEnvironment}.`,
        "active"
      );

      window.location.assign(
        `/billing?projectId=${encodeURIComponent(
          projectId
        )}&environment=${encodeURIComponent(
          selectedEnvironment
        )}&intent=deploy`
      );
    }, [
      selectedProject,
      generatedFiles.length,
      environmentReadiness,
      selectedEnvironment,
      addActivity,
    ]);

  /* =======================================================
     PREVIEW
  ======================================================= */

  const openPreview =
    useCallback(() => {
      setActiveView(
        "preview"
      );

      setMobilePanel(
        "workspace"
      );

      setPreviewFullscreen(
        true
      );
    }, []);

  const closePreview =
    useCallback(() => {
      setPreviewFullscreen(
        false
      );
    }, []);

  /* =======================================================
     FILES / ACTIVITY
  ======================================================= */

  const openFilesDrawer =
    useCallback(() => {
      setFilesDrawerOpen(
        true
      );

      setActivityDrawerOpen(
        false
      );
    }, []);

  const closeFilesDrawer =
    useCallback(() => {
      setFilesDrawerOpen(
        false
      );
    }, []);

  const openActivityDrawer =
    useCallback(() => {
      setActivityDrawerOpen(
        true
      );

      setFilesDrawerOpen(
        false
      );
    }, []);

  const closeActivityDrawer =
    useCallback(() => {
      setActivityDrawerOpen(
        false
      );
    }, []);

  const handleFileSelect =
    useCallback(
      (file) => {
        setSelectedFile(file);
        setFilesDrawerOpen(
          false
        );
        setActiveView("code");
      },
      []
    );

  /* =======================================================
     KEYBOARD
  ======================================================= */

  const handlePromptKeyDown =
    useCallback(
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          handleChatSubmit(
            event
          );
        }
      },
      [handleChatSubmit]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>
      <main
        className={
          styles.workspace
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <header
          className={
            styles.workspaceHeader
          }
        >
          <div
            className={
              styles.brandBlock
            }
          >
            <div
              className={
                styles.projectMark
              }
            >
              Z
            </div>

            <div
              className={
                styles.brandCopy
              }
            >
              <span>
                ZYRIONOS WORKSPACE
              </span>

              <strong
                title={projectName}
              >
                {projectName}
              </strong>
            </div>

            <div
              className={
                styles.headerStatus
              }
            >
              <span
                className={
                  operationRunning
                    ? styles.statusDotActive
                    : styles.statusDot
                }
              />

              <span>
                {operationRunning
                  ? currentOperationLabel
                  : "Ready"}
              </span>

              {operationRunning && (
                <small>
                  {elapsedSeconds}s
                </small>
              )}
            </div>
          </div>

          <div
            className={
              styles.workspaceServiceStatus
            }
          >
            <span
              className={
                styles.workspaceServiceDot
              }
              data-state={
                backendSyncing
                  ? "syncing"
                  : "ready"
              }
            />

            <span>
              {backendSyncing
                ? "Syncing"
                : "Connected"}
            </span>

            <span
              className={
                styles.workspaceServiceDivider
              }
            >
              •
            </span>

            <span>
              {githubConnections.length >
              0
                ? "GitHub connected"
                : "GitHub not connected"}
            </span>
          </div>

          <div
            className={
              styles.headerEnvironment
            }
          >
            <label
              htmlFor="zyrionos-environment-select"
            >
              Environment
            </label>

            <select
              id="zyrionos-environment-select"
              value={
                selectedEnvironment
              }
              onChange={(event) =>
                setSelectedEnvironment(
                  event.target.value
                )
              }
              disabled={
                operationRunning
              }
            >
              {(environmentList.length >
              0
                ? environmentList
                : [
                    {
                      name: "development",
                    },
                    {
                      name: "preview",
                    },
                    {
                      name: "production",
                    },
                  ]
              ).map(
                (environment) => {
                  const name =
                    getEnvironmentName(
                      environment
                    );

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

            {environmentReadiness && (
              <span
                className={
                  styles.environmentReadiness
                }
                data-ready={
                  isEnvironmentReady(
                    environmentReadiness
                  )
                    ? "true"
                    : "false"
                }
              >
                {isEnvironmentReady(
                  environmentReadiness
                )
                  ? "Ready"
                  : "Check"}
              </span>
            )}
          </div>

          <div
            className={
              styles.headerActions
            }
          >
            <button
              type="button"
              className={
                styles.headerButton
              }
              onClick={
                handleNewProject
              }
              disabled={
                operationRunning
              }
            >
              New Project
            </button>

            <button
              type="button"
              className={
                styles.headerButton
              }
              onClick={
                openActivityDrawer
              }
            >
              Activity
            </button>

            <button
              type="button"
              className={
                styles.deployButton
              }
              onClick={
                handleDeploy
              }
              disabled={
                operationRunning ||
                !selectedProjectId ||
                generatedFiles.length ===
                  0
              }
            >
              Deploy
            </button>
          </div>
        </header>

        {/* =================================================
            ALERTS
        ================================================= */}

        {(error || notice) && (
          <div
            className={
              error
                ? styles.alertError
                : styles.alertNotice
            }
            role="status"
          >
            <span>
              {error || notice}
            </span>

            <button
              type="button"
              onClick={() => {
                setError("");
                setNotice("");
              }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            MOBILE NAV
        ================================================= */}

        <nav
          className={
            styles.mobileNav
          }
        >
          <button
            type="button"
            className={
              mobilePanel ===
              "projects"
                ? styles.mobileNavActive
                : styles.mobileNavButton
            }
            onClick={() =>
              setMobilePanel(
                "projects"
              )
            }
          >
            Projects
          </button>

          <button
            type="button"
            className={
              mobilePanel ===
              "workspace"
                ? styles.mobileNavActive
                : styles.mobileNavButton
            }
            onClick={() =>
              setMobilePanel(
                "workspace"
              )
            }
          >
            Workspace
          </button>

          <button
            type="button"
            className={
              mobilePanel ===
              "chat"
                ? styles.mobileNavActive
                : styles.mobileNavButton
            }
            onClick={() =>
              setMobilePanel("chat")
            }
          >
            AI
          </button>
        </nav>

        {/* =================================================
            BODY
        ================================================= */}

        <section
          className={
            styles.workspaceBody
          }
        >
          {/* =================================================
              PROJECT RAIL
          ================================================= */}

          <aside
            className={`${styles.projectRail} ${
              mobilePanel ===
              "projects"
                ? styles.projectRailMobileOpen
                : ""
            }`}
          >
            <div
              className={
                styles.projectRailHeader
              }
            >
              <div>
                <span>
                  WORKSPACE
                </span>

                <strong>
                  Projects
                </strong>
              </div>

              <button
                type="button"
                onClick={
                  handleNewProject
                }
                disabled={
                  operationRunning
                }
                aria-label="Create project"
              >
                +
              </button>
            </div>

            <div
              className={
                styles.projectCount
              }
            >
              {projectCount} project
              {projectCount === 1
                ? ""
                : "s"}
            </div>

            <div
              className={
                styles.projectList
              }
            >
              {projectLoading ? (
                <div
                  className={
                    styles.projectEmpty
                  }
                >
                  Loading projects...
                </div>
              ) : projects.length ===
                0 ? (
                <div
                  className={
                    styles.projectEmpty
                  }
                >
                  <strong>
                    No projects yet
                  </strong>

                  <span>
                    Start with an AI
                    build request.
                  </span>
                </div>
              ) : (
                projects.map(
                  (project) => {
                    const id =
                      getProjectId(
                        project
                      );

                    const active =
                      String(id) ===
                      String(
                        selectedProjectId
                      );

                    return (
                      <button
                        key={id}
                        type="button"
                        className={
                          active
                            ? styles.projectItemActive
                            : styles.projectItem
                        }
                        onClick={() =>
                          handleSelectProject(
                            project
                          )
                        }
                      >
                        <span
                          className={
                            styles.projectItemIcon
                          }
                        >
                          Z
                        </span>

                        <span
                          className={
                            styles.projectItemCopy
                          }
                        >
                          <strong
                            title={getProjectName(
                              project
                            )}
                          >
                            {getProjectName(
                              project
                            )}
                          </strong>

                          <small>
                            {getProjectFramework(
                              project
                            )}
                          </small>
                        </span>

                        <span
                          className={
                            styles.projectItemArrow
                          }
                        >
                          ›
                        </span>
                      </button>
                    );
                  }
                )
              )}
            </div>

            <div
              className={
                styles.projectRailFooter
              }
            >
              <span>
                {githubConnections.length >
                0
                  ? "GitHub linked"
                  : "GitHub not linked"}
              </span>

              <span>
                {environmentList.length ||
                  0}{" "}
                environments
              </span>
            </div>
          </aside>

          {/* =================================================
              MAIN WORKSPACE
          ================================================= */}

          <section
            className={
              styles.mainWorkspace
            }
          >
            <div
              className={
                styles.workspaceToolbar
              }
            >
              <div
                className={
                  styles.workspaceToolbarLeft
                }
              >
                <div
                  className={
                    styles.viewSwitcher
                  }
                >
                  <button
                    type="button"
                    className={
                      activeView ===
                      "preview"
                        ? styles.viewButtonActive
                        : styles.viewButton
                    }
                    onClick={() =>
                      setActiveView(
                        "preview"
                      )
                    }
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    className={
                      activeView ===
                      "code"
                        ? styles.viewButtonActive
                        : styles.viewButton
                    }
                    onClick={() =>
                      setActiveView(
                        "code"
                      )
                    }
                    disabled={
                      generatedFiles.length ===
                      0
                    }
                  >
                    Code
                  </button>
                </div>

                <div
                  className={
                    styles.frameworkSelector
                  }
                >
                  <label htmlFor="workspace-framework">
                    Framework
                  </label>

                  <select
                    id="workspace-framework"
                    value={
                      framework
                    }
                    onChange={(
                      event
                    ) =>
                      setFramework(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      loading ||
                      operationRunning
                    }
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
                </div>
              </div>

              <div
                className={
                  styles.workspaceToolbarActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.headerButton
                  }
                  onClick={
                    openFilesDrawer
                  }
                  disabled={
                    generatedFiles.length ===
                    0
                  }
                >
                  Files
                  <span>
                    {
                      generatedFiles.length
                    }
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    styles.headerButton
                  }
                  onClick={
                    openPreview
                  }
                  disabled={
                    generatedFiles.length ===
                    0 &&
                    !previewUrl
                  }
                >
                  Full Preview
                </button>
              </div>
            </div>

            <div
              className={
                styles.workspaceVisualArea
              }
            >
              {activeView ===
              "preview" ? (
                <div
                  className={
                    styles.previewShell
                  }
                >
                  <div
                    className={
                      styles.previewFrameHeader
                    }
                  >
                    <div
                      className={
                        styles.previewFrameControls
                      }
                    >
                      <span />
                      <span />
                      <span />
                    </div>

                    <div
                      className={
                        styles.previewFrameTitle
                      }
                    >
                      {previewUrl
                        ? "LIVE PREVIEW"
                        : "LOCAL PREVIEW"}
                    </div>

                    <button
                      type="button"
                      className={
                        styles.previewTopButton
                      }
                      onClick={
                        openPreview
                      }
                    >
                      Expand
                    </button>
                  </div>

                  <div
                    className={
                      styles.previewFrameBody
                    }
                  >
                    {previewUrl ? (
                      <iframe
                        title={`${projectName} preview`}
                        src={
                          previewUrl
                        }
                        className={
                          styles.previewFrame
                        }
                        allow="fullscreen"
                      />
                    ) : generatedFiles.length >
                      0 ? (
                      <LocalProjectPreview
                        files={
                          generatedFiles
                        }
                        framework={
                          getProjectFramework(
                            selectedProject
                          ) ||
                          framework
                        }
                      />
                    ) : (
                      <div
                        className={
                          styles.previewEmpty
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
                          ZYRIONOS
                          PREVIEW
                        </span>

                        <h2>
                          Your workspace is ready
                        </h2>

                        <p>
                          Describe an
                          application in
                          the AI panel and
                          the generated
                          files will appear
                          here.
                        </p>

                        <div
                          className={
                            styles.quickPromptGrid
                          }
                        >
                          {QUICK_PROMPTS.map(
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
                                {
                                  item.label
                                }
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={
                      styles.previewFrameFooter
                    }
                  >
                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {previewUrl
                          ? "Live"
                          : generatedFiles.length >
                            0
                          ? "Local"
                          : "Waiting"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Files
                      </span>

                      <strong>
                        {
                          generatedFiles.length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Deployment
                      </span>

                      <strong>
                        {
                          deploymentStatus
                        }
                      </strong>
                    </div>
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
                      styles.codeHeader
                    }
                  >
                    <div>
                      <span>
                        SOURCE
                      </span>

                      <strong>
                        {selectedFile
                          ? getFilePath(
                              selectedFile
                            )
                          : "No file selected"}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={
                        openFilesDrawer
                      }
                    >
                      Browse Files
                    </button>
                  </div>

                  <div
                    className={
                      styles.codeEditor
                    }
                  >
                    {selectedFile ? (
                      <pre>
                        <code>
                          {getFileContent(
                            selectedFile
                          )}
                        </code>
                      </pre>
                    ) : (
                      <div
                        className={
                          styles.codeEmpty
                        }
                      >
                        <span>
                          ◇
                        </span>

                        <strong>
                          No source file
                          selected
                        </strong>

                        <p>
                          Generate a project
                          or select a file
                          from the Files
                          panel.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              AI CHAT
          ================================================= */}

          <aside
            className={`${styles.chatArea} ${
              mobilePanel === "chat"
                ? styles.chatAreaMobileOpen
                : ""
            }`}
          >
            <div
              className={
                styles.chatHeader
              }
            >
              <div>
                <span>
                  AI BUILDER
                </span>

                <strong>
                  Build with ZyrionOS
                </strong>
              </div>

              <div
                className={
                  styles.chatHeaderStatus
                }
              >
                <span
                  className={
                    operationRunning
                      ? styles.statusDotActive
                      : styles.statusDot
                  }
                />

                {operationRunning
                  ? currentOperationLabel
                  : "Online"}
              </div>
            </div>

            <div
              className={
                styles.chatMessages
              }
            >
              {chatMessages.length ===
              0 ? (
                <div
                  className={
                    styles.chatEmpty
                  }
                >
                  <div
                    className={
                      styles.chatEmptyIcon
                    }
                  >
                    Z
                  </div>

                  <span>
                    AI BUILDER
                  </span>

                  <h2>
                    What should we build?
                  </h2>

                  <p>
                    Describe the product,
                    feature or change you
                    want. ZyrionOS will
                    generate the project
                    files and save them to
                    your workspace.
                  </p>

                  <div
                    className={
                      styles.quickPromptGrid
                    }
                  >
                    {QUICK_PROMPTS.map(
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
                          {
                            item.label
                          }
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
                          : styles.chatMessageAssistant
                      }
                    >
                      <div
                        className={
                          styles.chatMessageRole
                        }
                      >
                        {message.role ===
                        "user"
                          ? "YOU"
                          : "ZYRIONOS AI"}
                      </div>

                      <div
                        className={
                          styles.chatMessageBody
                        }
                      >
                        {message.content}
                      </div>

                      <small>
                        {
                          message.timestamp
                        }
                      </small>

                      {message.fileCount >
                        0 && (
                        <span
                          className={
                            styles.messageMeta
                          }
                        >
                          {
                            message.fileCount
                          }{" "}
                          files
                        </span>
                      )}
                    </div>
                  )
                )
              )}

              <div
                ref={chatEndRef}
              />
            </div>

            <div
              className={
                styles.chatQuickActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "Build a production-ready responsive landing page"
                  )
                }
                disabled={
                  operationRunning
                }
              >
                Landing
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "Build a production-ready admin dashboard"
                  )
                }
                disabled={
                  operationRunning
                }
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={
                  handleReviewFix
                }
                disabled={
                  operationRunning ||
                  !selectedProjectId
                }
              >
                Review / Fix
              </button>
            </div>

            <form
              className={
                styles.chatComposer
              }
              onSubmit={
                handleChatSubmit
              }
            >
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
                placeholder={
                  selectedProjectId
                    ? "Describe the change you want..."
                    : "Describe what you want to build..."
                }
                disabled={
                  loading ||
                  operationRunning
                }
                rows={4}
              />

              <div
                className={
                  styles.chatComposerFooter
                }
              >
                <span>
                  {selectedEnvironment}
                </span>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    operationRunning ||
                    !prompt.trim()
                  }
                >
                  {loading
                    ? "Building..."
                    : "Build"}
                </button>
              </div>
            </form>
          </aside>
        </section>

        {/* =================================================
            ACTIVITY SUMMARY
        ================================================= */}

        <section
          className={
            styles.activityPanel
          }
        >
          <div
            className={
              styles.activityPanelHeader
            }
          >
            <div>
              <span>
                LIVE WORKSPACE STATE
              </span>

              <strong>
                Build & deployment activity
              </strong>
            </div>

            <button
              type="button"
              onClick={
                openActivityDrawer
              }
            >
              View all
            </button>
          </div>

          <div
            className={
              styles.activityPanelContent
            }
          >
            <div
              className={
                styles.activityCurrent
              }
            >
              <span
                className={
                  operationRunning
                    ? styles.dotActive
                    : styles.dotSuccess
                }
              />

              <div>
                <strong>
                  {operationRunning
                    ? currentOperationLabel
                    : "Workspace ready"}
                </strong>

                <p>
                  {operationRunning
                    ? `Running for ${elapsedSeconds}s`
                    : deploymentLog
                    ? `Latest deployment: ${getLatestDeploymentLogStatus(
                        deploymentLog
                      )}`
                    : "Waiting for your next build request."}
                </p>
              </div>
            </div>

            <div
              className={
                styles.activityStats
              }
            >
              <div>
                <span>
                  FILES
                </span>

                <strong>
                  {
                    generatedFiles.length
                  }
                </strong>
              </div>

              <div>
                <span>
                  ENVIRONMENT
                </span>

                <strong>
                  {
                    selectedEnvironment
                  }
                </strong>
              </div>

              <div>
                <span>
                  DEPLOYMENT
                </span>

                <strong>
                  {
                    deploymentStatus
                  }
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FILE DRAWER
        ================================================= */}

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
                  <span>
                    PROJECT
                  </span>

                  <strong>
                    Files
                  </strong>
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
                  generated files ·{" "}
                  {framework}
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
                      const path =
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
                            path
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
                          <span>
                            ◇
                          </span>

                          <strong
                            title={path}
                          >
                            {path}
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

        {/* =================================================
            ACTIVITY DRAWER
        ================================================= */}

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
                  <span>
                    WORKSPACE
                  </span>

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
                {deploymentLog && (
                  <div
                    className={
                      styles.deploymentLogSummary
                    }
                  >
                    <strong>
                      Latest deployment
                    </strong>

                    <span>
                      {getLatestDeploymentLogStatus(
                        deploymentLog
                      )}
                    </span>

                    {deploymentLog.message && (
                      <small>
                        {
                          deploymentLog.message
                        }
                      </small>
                    )}
                  </div>
                )}

                {activityLog.length ===
                0 ? (
                  <p>
                    No activity yet.
                  </p>
                ) : (
                  activityLog
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

        {/* =================================================
            FULL PAGE PREVIEW
        ================================================= */}

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
                <span>
                  PREVIEW
                </span>

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
                {previewUrl && (
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

                <button
                  type="button"
                  onClick={
                    closePreview
                  }
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
              {previewUrl ? (
                <iframe
                  title={`${projectName} full preview`}
                  src={previewUrl}
                  className={
                    styles.previewFullFrame
                  }
                  allow="fullscreen"
                />
              ) : previewEntryFile ? (
                <LocalProjectPreview
                  files={
                    generatedFiles
                  }
                  framework={
                    getProjectFramework(
                      selectedProject
                    ) || framework
                  }
                  fullscreen
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
                    PREVIEW RUNTIME
                  </span>

                  <h2>
                    Project files are ready
                  </h2>

                  <p>
                    This project does not
                    yet have a live preview
                    URL or a static HTML
                    entry file. The preview
                    screen is intentionally
                    not faking an
                    application.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      closePreview();

                      setActiveView(
                        "code"
                      );
                    }}
                  >
                    Open Generated Code
                  </button>
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
