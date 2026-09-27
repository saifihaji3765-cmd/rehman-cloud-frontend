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

const DEFAULT_ENVIRONMENTS = [
  "development",
  "preview",
  "production",
];

const QUICK_PROMPTS = [
  {
    label: "AI SaaS dashboard",
    prompt:
      "Build a production-ready AI SaaS dashboard",
  },
  {
    label: "Landing page",
    prompt:
      "Create a production-ready responsive landing page",
  },
  {
    label: "Authentication",
    prompt:
      "Add authentication and user accounts",
  },
  {
    label: "Admin control center",
    prompt:
      "Build a production-ready admin control center",
  },
];

/* =========================================================
   GENERIC HELPERS
========================================================= */

function unwrapApiResponse(response) {
  if (response === null || response === undefined) {
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

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
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

function getEnvironmentName(environment) {
  return (
    environment?.name ||
    environment?.environmentName ||
    ""
  );
}

function getFilePath(file) {
  return (
    file?.path ||
    file?.filePath ||
    file?.name ||
    file?.filename ||
    ""
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

function findFile(files, names) {
  const normalizedNames = names.map((name) =>
    String(name)
      .replace(/^\.?\//, "")
      .replace(/^\/+/, "")
      .toLowerCase()
  );

  return (
    Array.isArray(files)
      ? files
      : []
  ).find((file) => {
    const path = getFilePath(file)
      .replace(/^\.?\//, "")
      .replace(/^\/+/, "")
      .toLowerCase();

    return normalizedNames.includes(path);
  });
}

function extractCollection(response, keys = []) {
  const root = unwrapApiResponse(response);

  if (Array.isArray(root)) {
    return root;
  }

  if (
    root &&
    typeof root === "object"
  ) {
    for (const key of keys) {
      if (Array.isArray(root[key])) {
        return root[key];
      }
    }
  }

  const responseRoot = response?.data;

  if (
    responseRoot &&
    typeof responseRoot === "object"
  ) {
    for (const key of keys) {
      if (Array.isArray(responseRoot[key])) {
        return responseRoot[key];
      }
    }
  }

  return [];
}

function extractObject(response, keys = []) {
  const root = unwrapApiResponse(response);

  if (
    root &&
    typeof root === "object" &&
    !Array.isArray(root)
  ) {
    for (const key of keys) {
      if (
        root[key] &&
        typeof root[key] === "object"
      ) {
        return root[key];
      }
    }

    if (
      root._id ||
      root.id ||
      root.status ||
      root.name ||
      root.environmentName ||
      root.ready !== undefined
    ) {
      return root;
    }
  }

  return null;
}

/* =========================================================
   PROJECT RESPONSE HELPERS
========================================================= */

function normalizeProjects(response) {
  const root = unwrapApiResponse(response);

  if (Array.isArray(root)) {
    return root;
  }

  if (
    root &&
    typeof root === "object"
  ) {
    if (Array.isArray(root.projects)) {
      return root.projects;
    }

    if (Array.isArray(root.items)) {
      return root.items;
    }

    if (Array.isArray(root.data)) {
      return root.data;
    }
  }

  return [];
}

function extractProject(response) {
  const root = unwrapApiResponse(response);

  const candidates = [
    root?.project,
    root?.data?.project,
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
        Array.isArray(candidate.files)
      )
    ) {
      return candidate;
    }
  }

  return null;
}

/* =========================================================
   FILE NORMALIZATION
========================================================= */

function normalizeProjectFiles(project, aiResult) {
  const candidates = [
    project?.files,
    project?.data?.files,
    project?.project?.files,

    aiResult?.files,
    aiResult?.data?.files,
    aiResult?.project?.files,

    aiResult?.orchestration?.buildResult?.files,
    aiResult?.orchestration?.buildResult?.data?.files,
    aiResult?.orchestration?.buildResult?.data?.data?.files,

    aiResult?.data?.orchestration?.buildResult?.files,
    aiResult?.data?.orchestration?.buildResult?.data?.files,
  ];

  for (const files of candidates) {
    if (Array.isArray(files)) {
      return files;
    }
  }

  return [];
}

/* =========================================================
   GENERATED CODE SANITIZATION
========================================================= */

/*
 * Important:
 * The screenshot showed generated source containing:
 *
 * &lt;React.StrictMode&gt;
 *
 * instead of:
 *
 * <React.StrictMode>
 *
 * That makes Sandpack throw a SyntaxError.
 */

function decodeHtmlEntities(value) {
  let text = String(value ?? "");

  const replacements = [
    [/&lt;/gi, "<"],
    [/&gt;/gi, ">"],
    [/&amp;/gi, "&"],
    [/&quot;/gi, '"'],
    [/&#39;/gi, "'"],
    [/&#x27;/gi, "'"],
    [/&#96;/gi, "`"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

function sanitizeGeneratedFile(file) {
  if (!file) {
    return file;
  }

  const path = getFilePath(file);

  const content =
    file.content !== undefined
      ? file.content
      : file.code;

  if (content === undefined || content === null) {
    return file;
  }

  return {
    ...file,
    path,
    content: decodeHtmlEntities(content),
  };
}

function sanitizeGeneratedFiles(files) {
  return (
    Array.isArray(files)
      ? files
      : []
  ).map(sanitizeGeneratedFile);
}

/* =========================================================
   SANDPACK
========================================================= */

function buildSandpackFiles(files) {
  const result = {};

  for (const rawFile of Array.isArray(files) ? files : []) {
    const file = sanitizeGeneratedFile(rawFile);

    let path = getFilePath(file)
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");

    if (!path) {
      continue;
    }

    if (
      path.toLowerCase() ===
      "public/index.html"
    ) {
      path = "index.html";
    }

    result[`/${path}`] = {
      code: decodeHtmlEntities(
        getFileContent(file)
      ),
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
      getFileContent(packageFile)
    );

    const dependencies = {
      ...(parsed?.dependencies || {}),
      ...(parsed?.devDependencies || {}),
    };

    delete dependencies.react;
    delete dependencies["react-dom"];

    return dependencies;
  } catch {
    return {};
  }
}

function getSandpackTemplate(framework) {
  const value = String(
    framework || "React"
  )
    .trim()
    .toLowerCase();

  return value === "vue"
    ? "vue"
    : "react";
}

function getSandpackEntry(files) {
  const candidates = [
    "/src/index.jsx",
    "/src/index.js",
    "/src/main.jsx",
    "/src/main.js",
    "/App.jsx",
    "/App.js",
  ];

  for (const candidate of candidates) {
    if (files[candidate]) {
      return candidate;
    }
  }

  return null;
}

function LocalProjectPreview({
  files,
  framework,
  fullscreen = false,
}) {
  const sanitizedFiles = useMemo(
    () => sanitizeGeneratedFiles(files),
    [files]
  );

  const sandpackFiles = useMemo(
    () => buildSandpackFiles(sanitizedFiles),
    [sanitizedFiles]
  );

  const dependencies = useMemo(
    () =>
      getSandpackDependencies(
        sanitizedFiles
      ),
    [sanitizedFiles]
  );

  const template = useMemo(
    () =>
      getSandpackTemplate(framework),
    [framework]
  );

  const entry = useMemo(
    () =>
      getSandpackEntry(
        sandpackFiles
      ),
    [sandpackFiles]
  );

  if (!entry) {
    return (
      <div className={styles.previewUnavailable}>
        <div className={styles.previewIconLarge}>
          Z
        </div>

        <span>PREVIEW RUNTIME</span>

        <h3>No preview entry found</h3>

        <p>
          The generated project does not
          contain a supported React or Vue
          entry file.
        </p>
      </div>
    );
  }

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
              : entry,
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
   PROJECT NAMING
========================================================= */

function buildProjectName(prompt) {
  const value = String(prompt || "")
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

  const words = (
    cleaned || value
  )
    .split(" ")
    .slice(0, 8);

  const title = words
    .join(" ")
    .replace(/[.!?]+$/, "")
    .trim();

  return title
    ? title.charAt(0).toUpperCase() +
        title.slice(1)
    : "New Project";
}

/* =========================================================
   PREVIEW / DEPLOYMENT HELPERS
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

    case "building":
      return "Building";

    case "failed":
    case "error":
      return "Failed";

    case "pending":
      return "Pending";

    default:
      return "Not deployed";
  }
}

function getDeploymentLogStatus(log) {
  return normalizeDeploymentStatus(
    log?.status ||
      log?.deploymentStatus ||
      log?.state ||
      log?.stage
  );
}

function isEnvironmentReady(readiness) {
  return Boolean(
    readiness?.ready === true ||
      readiness?.isReady === true ||
      readiness?.deploymentReady === true
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
    id:
      `${Date.now()}-` +
      `${Math.random()
        .toString(36)
        .slice(2)}`,
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
   COMPONENT
========================================================= */

function Workspace() {
  const [projects, setProjects] =
    useState([]);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const selectedProjectRef =
    useRef(null);

  const [prompt, setPrompt] =
    useState("");

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

  const [githubConnections, setGithubConnections] =
    useState([]);

  const [backendSyncing, setBackendSyncing] =
    useState(false);

  const [liveUrl, setLiveUrl] =
    useState("");

  const [activeView, setActiveView] =
    useState("preview");

  const [mobilePanel, setMobilePanel] =
    useState("workspace");

  const [filesDrawerOpen, setFilesDrawerOpen] =
    useState(false);

  const [
    activityDrawerOpen,
    setActivityDrawerOpen,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [projectLoading, setProjectLoading] =
    useState(true);

  const [operation, setOperation] =
    useState("idle");

  const [
    operationStartedAt,
    setOperationStartedAt,
  ] = useState(null);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [activityLog, setActivityLog] =
    useState([]);

  const [
    previewFullscreen,
    setPreviewFullscreen,
  ] = useState(false);

  const chatEndRef = useRef(null);

  const initialLoadStarted =
    useRef(false);

  const selectedProjectId =
    getProjectId(selectedProject);

  const projectName =
    getProjectName(selectedProject);

  const projectCount =
    projects.length;

  const previewUrl =
    liveUrl ||
    getPreviewUrl(selectedProject);

  const operationRunning =
    operation !== "idle";

  const currentOperationLabel =
    useMemo(() => {
      switch (operation) {
        case "build":
          return "Building";

        case "change":
          return "Applying changes";

        case "deploy":
          return "Deploying";

        default:
          return "Ready";
      }
    }, [operation]);

  const previewEntryFile =
    useMemo(
      () =>
        findFile(generatedFiles, [
          "index.html",
          "public/index.html",
        ]),
      [generatedFiles]
    );

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (!operationStartedAt) {
      setElapsedSeconds(0);
      return undefined;
    }

    const update = () => {
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

    update();

    const timer =
      window.setInterval(
        update,
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
     PROJECT REF
  ======================================================= */

  useEffect(() => {
    selectedProjectRef.current =
      selectedProject;
  }, [selectedProject]);

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
              `${Date.now()}-` +
              Math.random()
                .toString(36)
                .slice(2),
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
        ].slice(-50)
      );
    },
    []
  );

  const startOperation = useCallback(
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

  const finishOperation = useCallback(
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
        sanitizeGeneratedFiles(
          normalizeProjectFiles(
            project,
            null
          )
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

  const loadProjects = useCallback(
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

            return normalized;
          }
        }

        if (normalized.length > 0) {
          applySelectedProject(
            normalized[0]
          );
        } else {
          selectedProjectRef.current =
            null;

          setSelectedProject(null);
          setGeneratedFiles([]);
          setSelectedFile(null);
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
        setProjectLoading(false);
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
     BACKEND SYNCHRONIZATION
     Deployment logs are intentionally polled.
======================================================= */

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const projectId =
        getProjectId(
          selectedProjectRef.current
        );

      if (!projectId) {
        if (!cancelled) {
          setDeploymentLog(null);
          setEnvironmentList([]);
          setGithubConnections([]);
          setEnvironmentReadiness(null);
        }

        return;
      }

      setBackendSyncing(true);

      try {
        const [
          logsResult,
          environmentResult,
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

            const status =
              getDeploymentLogStatus(
                latest
              );

            if (
              status !==
              "Not deployed"
            ) {
              setDeploymentStatus(
                status
              );
            }
          }
        }

        if (
          environmentResult.status ===
          "fulfilled"
        ) {
          const environments =
            extractCollection(
              environmentResult.value,
              [
                "environments",
                "items",
              ]
            );

          setEnvironmentList(
            environments
          );

          const matching =
            environments.find(
              (environment) =>
                getEnvironmentName(
                  environment
                ) ===
                selectedEnvironment
            );

          if (
            !matching &&
            environments.length
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
          "Workspace backend synchronization error:",
          err
        );
      } finally {
        if (!cancelled) {
          setBackendSyncing(false);
        }
      }
    };

    sync();

    const timer =
      window.setInterval(
        sync,
        5000
      );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
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

    const loadReadiness = async () => {
      const projectId =
        getProjectId(
          selectedProjectRef.current
        );

      if (
        !projectId ||
        !selectedEnvironment
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
            selectedEnvironment
          );

        const readiness =
          extractObject(
            response,
            [
              "readiness",
              "deploymentReadiness",
            ]
          ) ||
          unwrapApiResponse(
            response
          );

        if (!cancelled) {
          setEnvironmentReadiness(
            readiness
          );
        }
      } catch (err) {
        if (!cancelled) {
          setEnvironmentReadiness({
            ready: false,
            error: getErrorMessage(
              err,
              "Environment readiness check failed."
            ),
          });
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
     SELECT PROJECT
  ======================================================= */

  const handleSelectProject =
    useCallback(
      (project) => {
        setError("");
        setNotice("");
        setActivityLog([]);
        setChatMessages([]);
        setDeploymentLog(null);

        setActiveView(
          "preview"
        );

        setMobilePanel(
          "workspace"
        );

        setFilesDrawerOpen(false);
        setActivityDrawerOpen(false);
        setPreviewFullscreen(false);

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

      setSelectedProject(null);
      setGeneratedFiles([]);
      setSelectedFile(null);
      setPrompt("");
      setChatMessages([]);
      setLiveUrl("");
      setDeploymentStatus(
        "Not deployed"
      );
      setDeploymentLog(null);
      setEnvironmentReadiness(null);
      setActivityLog([]);
      setError("");
      setNotice("");
      setOperation("idle");
      setOperationStartedAt(null);
      setActiveView("preview");
      setMobilePanel("chat");
      setFilesDrawerOpen(false);
      setActivityDrawerOpen(false);
      setPreviewFullscreen(false);
    }, []);

  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  const handleQuickPrompt =
    useCallback((value) => {
      setPrompt(value);
      setError("");
      setNotice("");
      setMobilePanel("chat");

      window.setTimeout(() => {
        document
          .querySelector(
            '[data-zyrionos-chat-input="true"]'
          )
          ?.focus();
      }, 50);
    }, []);

  /* =======================================================
     BUILD
  ======================================================= */

  const handleBuild = useCallback(
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

      const isExisting =
        Boolean(selectedProjectId);

      try {
        setError("");
        setNotice("");
        setLoading(true);

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
          isExisting
            ? "change"
            : "build",
          isExisting
            ? "Applying your requested changes..."
            : "Building your application..."
        );

        addActivity(
          "Understanding request...",
          "active"
        );

        const instruction =
          isExisting
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
                "Return complete project files required for the implementation.",
                "Preserve existing working functionality unless the request requires changing it.",
              ].join("\n")
            : [
                userPrompt,
                "",
                `Target environment: ${selectedEnvironment}`,
                "",
                "Return complete project files.",
              ].join("\n");

        addActivity(
          "Sending build request to the AI Builder...",
          "active"
        );

        const aiResult =
          await generateCode(
            instruction,
            framework
          );

        addActivity(
          "AI Builder response received.",
          "success"
        );

        const assistantText =
          normalizeAIResponse(
            aiResult
          );

        const rawFiles =
          getGeneratedFiles(
            aiResult
          );

        const files =
          sanitizeGeneratedFiles(
            rawFiles
          );

        if (!files.length) {
          throw new Error(
            "AI generation completed, but no project files were returned."
          );
        }

        addActivity(
          `${files.length} project files received.`,
          "success"
        );

        setGeneratedFiles(files);
        setSelectedFile(
          files[0] || null
        );

        setChatMessages(
          (previous) => [
            ...previous,
            createMessage(
              "assistant",
              assistantText ||
                `Build completed with ${files.length} generated files.`,
              {
                fileCount:
                  files.length,
              }
            ),
          ]
        );

        /* =================================================
           CREATE PROJECT
        ================================================= */

        if (!isExisting) {
          const generatedName =
            buildProjectName(
              userPrompt
            );

          addActivity(
            "Saving project...",
            "active"
          );

          const response =
            await createProject({
              projectName:
                generatedName,

              description:
                userPrompt,

              framework,

              files,
            });

          const created =
            extractProject(
              response
            );

          if (created) {
            const savedFiles =
              sanitizeGeneratedFiles(
                normalizeProjectFiles(
                  created,
                  null
                )
              );

            const project = {
              ...created,
              projectName:
                getProjectName(
                  created
                ) ||
                generatedName,
              files:
                savedFiles.length
                  ? savedFiles
                  : files,
            };

            applySelectedProject(
              project
            );

            await loadProjects(
              getProjectId(created)
            );
          } else {
            await loadProjects();
          }

          setNotice(
            `${generatedName} was created successfully.`
          );

          addActivity(
            "Project created and saved.",
            "success"
          );
        } else {
          /* ===============================================
             UPDATE PROJECT
          =============================================== */

          addActivity(
            "Saving project changes...",
            "active"
          );

          const response =
            await updateProject(
              selectedProjectId,
              {
                files,
              }
            );

          const updated =
            extractProject(
              response
            );

          if (updated) {
            applySelectedProject({
              ...updated,
              files:
                sanitizeGeneratedFiles(
                  normalizeProjectFiles(
                    updated,
                    null
                  )
                ).length
                  ? sanitizeGeneratedFiles(
                      normalizeProjectFiles(
                        updated,
                        null
                      )
                    )
                  : files,
            });
          } else {
            await loadProjects(
              selectedProjectId
            );
          }

          setNotice(
            `Changes saved to ${projectName}.`
          );

          addActivity(
            "Project changes saved.",
            "success"
          );
        }

        setPrompt("");
        setActiveView("preview");

        finishOperation(
          true,
          isExisting
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

        finishOperation(
          false,
          "Build failed."
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
     CHAT
  ======================================================= */

  const handleChatSubmit =
    useCallback(
      (event) => {
        event?.preventDefault();

        if (
          loading ||
          operationRunning ||
          !prompt.trim()
        ) {
          return;
        }

        handleBuild(prompt);
      },
      [
        loading,
        operationRunning,
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
    useCallback(async () => {
      if (!selectedProjectId) {
        setError(
          "Select a project before running Review / Fix."
        );

        return;
      }

      const reviewPrompt =
        prompt.trim()
          ? [
              "Review and improve the current project.",
              "",
              `Project ID: ${selectedProjectId}`,
              `Environment: ${selectedEnvironment}`,
              "",
              "Requested change:",
              prompt.trim(),
              "",
              "Return complete files required for the fix.",
            ].join("\n")
          : [
              "Review the current project.",
              "",
              `Environment: ${selectedEnvironment}`,
              "",
              "Check for broken functionality, runtime errors, responsive problems, accessibility issues, and incomplete implementation.",
              "",
              "Return complete files required for fixes.",
            ].join("\n");

      setPrompt(reviewPrompt);

      await handleBuild(
        reviewPrompt
      );
    }, [
      selectedProjectId,
      selectedEnvironment,
      prompt,
      handleBuild,
    ]);

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

      if (!generatedFiles.length) {
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
        "Opening deployment flow..."
      );

      setDeploymentStatus(
        "Pending"
      );

      setOperation("deploy");
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
     FILES
  ======================================================= */

  const handleFileSelect =
    useCallback((file) => {
      setSelectedFile(file);
      setFilesDrawerOpen(false);
      setActiveView("code");
      setMobilePanel("workspace");
    }, []);

  /* =======================================================
     DRAWERS / PREVIEW
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

  const openPreview =
    useCallback(() => {
      setPreviewFullscreen(true);
    }, []);

  const closePreview =
    useCallback(() => {
      setPreviewFullscreen(false);
    }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>
      <main className={styles.workspace}>
        {/* =================================================
            HEADER
        ================================================= */}

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

            <div className={styles.headerStatus}>
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

          {/* SERVICE STATUS */}

          <div className={styles.workspaceServiceStatus}>
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
                : "Backend connected"}
            </span>

            <span
              className={
                styles.workspaceServiceDivider
              }
            >
              •
            </span>

            <span>
              {githubConnections.length
                ? "GitHub connected"
                : "GitHub not connected"}
            </span>
          </div>

          {/* ENVIRONMENT */}

          <div className={styles.headerEnvironment}>
            <label htmlFor="zyrionos-environment-select">
              Environment
            </label>

            <select
              id="zyrionos-environment-select"
              value={selectedEnvironment}
              onChange={(event) =>
                setSelectedEnvironment(
                  event.target.value
                )
              }
              disabled={operationRunning}
            >
              {(
                environmentList.length
                  ? environmentList
                  : DEFAULT_ENVIRONMENTS.map(
                      (name) => ({
                        name,
                      })
                    )
              ).map((environment) => {
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
              })}
            </select>

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
              {environmentReadiness
                ? isEnvironmentReady(
                    environmentReadiness
                  )
                  ? "Ready"
                  : "Check"
                : "—"}
            </span>
          </div>

          {/* HEADER ACTIONS */}

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerButton}
              onClick={handleNewProject}
              disabled={operationRunning}
            >
              New Project
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
              className={styles.deployButton}
              onClick={handleDeploy}
              disabled={
                operationRunning ||
                !selectedProjectId ||
                !generatedFiles.length
              }
            >
              Deploy
            </button>
          </div>
        </header>

        {/* =================================================
            ALERT
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
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            MOBILE NAV
        ================================================= */}

        <nav className={styles.mobileNav}>
          {[
            ["projects", "Projects"],
            ["workspace", "Workspace"],
            ["chat", "AI"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                mobilePanel === value
                  ? styles.mobileNavActive
                  : styles.mobileNavButton
              }
              onClick={() =>
                setMobilePanel(value)
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {/* =================================================
            WORKSPACE BODY
        ================================================= */}

        <section className={styles.workspaceBody}>
          {/* =================================================
              PROJECTS
          ================================================= */}

          <aside
            className={`${styles.projectRail} ${
              mobilePanel === "projects"
                ? styles.projectRailMobileOpen
                : ""
            }`}
          >
            <div className={styles.projectRailHeader}>
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
                onClick={handleNewProject}
                disabled={operationRunning}
              >
                +
              </button>
            </div>

            <div className={styles.projectCount}>
              {projectCount} project
              {projectCount === 1
                ? ""
                : "s"}
            </div>

            <div className={styles.projectList}>
              {projectLoading ? (
                <div className={styles.projectEmpty}>
                  <strong>
                    Loading projects
                  </strong>

                  <span>
                    Connecting to workspace...
                  </span>
                </div>
              ) : projects.length === 0 ? (
                <div className={styles.projectEmpty}>
                  <strong>
                    No projects yet
                  </strong>

                  <span>
                    Start from the AI Builder.
                  </span>
                </div>
              ) : (
                projects.map((project) => {
                  const id =
                    getProjectId(project);

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
                })
              )}
            </div>

            <div className={styles.projectRailFooter}>
              <span>
                {githubConnections.length
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
            className={styles.mainWorkspace}
          >
            <div className={styles.workspaceToolbar}>
              <div
                className={
                  styles.workspaceToolbarLeft
                }
              >
                <div className={styles.viewSwitcher}>
                  <button
                    type="button"
                    className={
                      activeView === "preview"
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
                      activeView === "code"
                        ? styles.viewButtonActive
                        : styles.viewButton
                    }
                    onClick={() =>
                      setActiveView("code")
                    }
                    disabled={
                      !generatedFiles.length
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
                    value={framework}
                    onChange={(event) =>
                      setFramework(
                        event.target.value
                      )
                    }
                    disabled={
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
                  className={styles.headerButton}
                  onClick={openFilesDrawer}
                  disabled={
                    !generatedFiles.length
                  }
                >
                  Files
                  <span>
                    {generatedFiles.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={styles.headerButton}
                  onClick={openPreview}
                  disabled={
                    !generatedFiles.length &&
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
              {activeView === "preview" ? (
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
                      onClick={openPreview}
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
                        src={previewUrl}
                        className={
                          styles.previewFrame
                        }
                        allow="fullscreen"
                      />
                    ) : generatedFiles.length ? (
                      <LocalProjectPreview
                        files={generatedFiles}
                        framework={
                          getProjectFramework(
                            selectedProject
                          ) || framework
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
                          ZYRIONOS PREVIEW
                        </span>

                        <h2>
                          Your workspace is ready
                        </h2>

                        <p>
                          Tell the AI Builder
                          what you want to create.
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
                                {item.label}
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
                          : generatedFiles.length
                          ? "Local"
                          : "Waiting"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Files
                      </span>

                      <strong>
                        {generatedFiles.length}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Deployment
                      </span>

                      <strong>
                        {deploymentStatus}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.codeSurface}>
                  <div className={styles.codeHeader}>
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
                      onClick={openFilesDrawer}
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
                          {decodeHtmlEntities(
                            getFileContent(
                              selectedFile
                            )
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
                          No source file selected
                        </strong>

                        <p>
                          Generate a project
                          or select a file.
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
            <div className={styles.chatHeader}>
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

            {/* WORKING STATE */}

            {operationRunning && (
              <div
                className={
                  styles.aiWorkingBar
                }
              >
                <div
                  className={
                    styles.aiWorkingIndicator
                  }
                />

                <div>
                  <strong>
                    Working...
                  </strong>

                  <span>
                    {currentOperationLabel} ·{" "}
                    {elapsedSeconds}s
                  </span>
                </div>

                <span
                  className={
                    styles.aiWorkingEnvironment
                  }
                >
                  {selectedEnvironment}
                </span>
              </div>
            )}

            <div className={styles.chatMessages}>
              {chatMessages.length === 0 ? (
                <div className={styles.chatEmpty}>
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
                    Describe your product,
                    feature or change.
                    ZyrionOS will generate
                    the project files and
                    save them to your workspace.
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
                          {message.fileCount}{" "}
                          files generated
                        </span>
                      )}
                    </div>
                  )
                )
              )}

              <div ref={chatEndRef} />
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
                disabled={operationRunning}
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
                disabled={operationRunning}
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={handleReviewFix}
                disabled={
                  operationRunning ||
                  !selectedProjectId
                }
              >
                Review / Fix
              </button>
            </div>

            {/* CHAT COMPOSER */}

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
                disabled={loading}
                rows={4}
              />

              <div
                className={
                  styles.chatComposerFooter
                }
              >
                <span>
                  ENV · {selectedEnvironment}
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
                    ? "Working..."
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
                    ? `${currentOperationLabel}...`
                    : "Workspace ready"}
                </strong>

                <p>
                  {operationRunning
                    ? `Working for ${elapsedSeconds}s`
                    : deploymentLog
                    ? `Latest deployment: ${getDeploymentLogStatus(
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
                  {generatedFiles.length}
                </strong>
              </div>

              <div>
                <span>
                  ENVIRONMENT
                </span>

                <strong>
                  {selectedEnvironment}
                </strong>
              </div>

              <div>
                <span>
                  DEPLOYMENT
                </span>

                <strong>
                  {deploymentStatus}
                </strong>
              </div>

              <div>
                <span>
                  GITHUB
                </span>

                <strong>
                  {githubConnections.length
                    ? "Connected"
                    : "Not connected"}
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
                  {generatedFiles.length}{" "}
                  generated files ·{" "}
                  {framework}
                </small>
              </div>

              <div
                className={
                  styles.drawerFiles
                }
              >
                {!generatedFiles.length ? (
                  <div
                    className={
                      styles.drawerEmpty
                    }
                  >
                    No project files available.
                  </div>
                ) : (
                  generatedFiles.map(
                    (file) => {
                      const path =
                        getFilePath(file);

                      const active =
                        selectedFile === file;

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
                    setActiveView("code");
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
                    ZYRIONOS
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
                >
                  ×
                </button>
              </div>

              <div
                className={
                  styles.activityDrawerBody
                }
              >
                {/* BACKEND DEPLOYMENT LOG */}

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
                      {getDeploymentLogStatus(
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

                    {deploymentLog.stage && (
                      <small>
                        Stage:{" "}
                        {
                          deploymentLog.stage
                        }
                      </small>
                    )}
                  </div>
                )}

                {/* LOCAL ACTIVITY */}

                {activityLog.length === 0 ? (
                  <p>
                    No activity yet.
                  </p>
                ) : (
                  activityLog
                    .slice()
                    .reverse()
                    .map((item) => (
                      <div
                        key={item.id}
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
                    ))
                )}
              </div>
            </aside>
          </div>
        )}

        {/* =================================================
            FULL PREVIEW
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

                <strong>
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
              ) : previewEntryFile ||
                generatedFiles.length ? (
                <LocalProjectPreview
                  files={generatedFiles}
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
                    No generated project yet
                  </h2>

                  <p>
                    Use the AI Builder to
                    generate your first project.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      closePreview();
                      setMobilePanel("chat");
                    }}
                  >
                    Open AI Builder
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
