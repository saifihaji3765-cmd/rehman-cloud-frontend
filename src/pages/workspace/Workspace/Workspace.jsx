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

import styles from "./Workspace.module.css";

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
   RESPONSE HELPERS
========================================================= */

function unwrapApiResponse(response) {
  if (response === undefined || response === null) {
    return null;
  }

  const root = response?.data !== undefined ? response.data : response;

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
    response?.data !== undefined ? response.data : response;

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
  return project?._id || project?.id || project?.projectId || "";
}

function getProjectName(project) {
  return project?.projectName || project?.name || "New Project";
}

function getProjectFramework(project) {
  return project?.framework || "React";
}

function normalizeProjects(response) {
  const root =
    response?.data !== undefined ? response.data : response;

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

/* =========================================================
   PROJECT NAMING
   Keeps dashboard names readable instead of saving the
   entire natural-language prompt as the project title.
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
    .replace(/\s+(for|with)\s+me$/i, "")
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

  return title.charAt(0).toUpperCase() + title.slice(1);
}

/* =========================================================
   FILE HELPERS
========================================================= */

function normalizeProjectFiles(project, aiResult) {
  const possibleCollections = [
    project?.files,
    project?.data?.files,
    project?.project?.files,
    project?.data?.project?.files,

    aiResult?.files,
    aiResult?.data?.files,
    aiResult?.project?.files,
    aiResult?.data?.project?.files,

    aiResult?.orchestration?.buildResult?.data?.files,
    aiResult?.orchestration?.buildResult?.files,
    aiResult?.orchestration?.buildResult?.data?.data?.files,

    aiResult?.data?.orchestration?.buildResult?.data?.files,
    aiResult?.data?.orchestration?.buildResult?.files,
    aiResult?.data?.orchestration?.buildResult?.data?.data?.files,
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

  if (file.content !== undefined && file.content !== null) {
    return String(file.content);
  }

  if (file.code !== undefined && file.code !== null) {
    return String(file.code);
  }

  return "The backend returned this file without readable content.";
}

function findFile(files, names) {
  const normalized = names.map((name) =>
    String(name).replace(/^\.?\//, "").toLowerCase()
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
   DEPLOYMENT
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

/* =========================================================
   ERROR
========================================================= */

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

/* =========================================================
   CHAT
========================================================= */

function createMessage(role, content, extra = {}) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    timestamp: new Date().toLocaleTimeString([], {
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

  const [activeView, setActiveView] = useState("preview");
  const [mobilePanel, setMobilePanel] = useState("workspace");

  const [filesDrawerOpen, setFilesDrawerOpen] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [projectLoading, setProjectLoading] = useState(true);

  const [operation, setOperation] = useState("idle");
  const [operationStartedAt, setOperationStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activityLog, setActivityLog] = useState([]);

  const [previewFullscreen, setPreviewFullscreen] = useState(false);

  const chatEndRef = useRef(null);
  const initialLoadStarted = useRef(false);

  const projectName = getProjectName(selectedProject);
  const selectedProjectId = getProjectId(selectedProject);
  const projectCount = projects.length;

  const previewUrl =
    liveUrl || getPreviewUrl(selectedProject);

  const previewStatus = getPreviewStatus(selectedProject);
  const operationRunning = operation !== "idle";

  const currentOperationLabel = useMemo(() => {
    if (operation === "build") return "Building";
    if (operation === "change") return "Applying changes";
    if (operation === "deploy") return "Deploying";
    return "Ready";
  }, [operation]);

  const previewEntryFile = useMemo(() => {
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
            (Date.now() - operationStartedAt) / 1000
          )
        )
      );
    };

    updateTimer();

    const timer = window.setInterval(
      updateTimer,
      1000
    );

    return () => window.clearInterval(timer);
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
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  /* =======================================================
     ACTIVITY
     User-facing activity is intentionally abstracted.
     Internal agent names are not exposed in the UI.
  ======================================================= */

  const addActivity = useCallback(
    (message, type = "info") => {
      setActivityLog((previous) =>
        [
          ...previous,
          {
            id: `${Date.now()}-${Math.random()}`,
            message,
            type,
            timestamp: new Date().toLocaleTimeString(
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

  const startOperation = useCallback(
    (type, message) => {
      setOperation(type);
      setOperationStartedAt(Date.now());
      addActivity(message, "active");
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
     APPLY PROJECT
  ======================================================= */

  const applySelectedProject = useCallback(
    (project) => {
      if (!project) {
        return;
      }

      selectedProjectRef.current = project;
      setSelectedProject(project);

      const files = normalizeProjectFiles(
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

      setLiveUrl(getPreviewUrl(project));

      const projectFramework =
        getProjectFramework(project);

      if (FRAMEWORKS.includes(projectFramework)) {
        setFramework(projectFramework);
      }
    },
    []
  );

  /* =======================================================
     LOAD PROJECTS
  ======================================================= */

  const loadProjects = useCallback(
    async (preferredProjectId = "") => {
      try {
        setProjectLoading(true);

        const response = await getProjects();
        const normalized = normalizeProjects(response);

        setProjects(normalized);

        const currentId =
          preferredProjectId ||
          getProjectId(selectedProjectRef.current);

        if (currentId) {
          const preferred = normalized.find(
            (project) =>
              String(getProjectId(project)) ===
              String(currentId)
          );

          if (preferred) {
            applySelectedProject(preferred);
            return normalized;
          }
        }

        if (normalized.length > 0) {
          applySelectedProject(normalized[0]);
        } else {
          selectedProjectRef.current = null;
          setSelectedProject(null);
          setGeneratedFiles([]);
          setSelectedFile(null);
          setDeploymentStatus("Not deployed");
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

    initialLoadStarted.current = true;
    loadProjects();
  }, [loadProjects]);

  /* =======================================================
     PROJECT SELECTION
  ======================================================= */

  const handleSelectProject = useCallback(
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
    },
    [applySelectedProject]
  );

  /* =======================================================
     NEW PROJECT
  ======================================================= */

  const handleNewProject = useCallback(() => {
    selectedProjectRef.current = null;

    setSelectedProject(null);
    setGeneratedFiles([]);
    setSelectedFile(null);

    setPrompt("");
    setChatMessages([]);

    setLiveUrl("");
    setDeploymentStatus("Not deployed");

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
  }, []);

  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  const handleQuickPrompt = useCallback((value) => {
    setPrompt(value);
    setError("");
    setNotice("");
    setMobilePanel("workspace");

    window.setTimeout(() => {
      document
        .querySelector(
          '[data-zyrionos-chat-input="true"]'
        )
        ?.focus();
    }, 50);
  }, []);

  /* =======================================================
     BUILD / CHANGE
  ======================================================= */

  const handleBuild = useCallback(
    async (suppliedPrompt = "") => {
      const userPrompt = String(
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

        setActiveView("preview");
        setMobilePanel("workspace");

        setChatMessages((previous) => [
          ...previous,
          createMessage("user", userPrompt),
        ]);

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

        const instruction = isExistingProject
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
          "Generating the application files...",
          "active"
        );

        const aiResult = await generateCode(
          instruction,
          framework
        );

        addActivity(
          "Application files generated.",
          "success"
        );

        const assistantText =
          normalizeAIResponse(aiResult);

        const filesFromAI =
          getGeneratedFiles(aiResult);

        if (filesFromAI.length === 0) {
          throw new Error(
            "AI generation completed, but no project files were returned by the backend."
          );
        }

        addActivity(
          `${filesFromAI.length} project files received.`,
          "success"
        );

        setChatMessages((previous) => [
          ...previous,
          createMessage(
            "assistant",
            assistantText ||
              `The application is ready. ${filesFromAI.length} files were generated.`,
            {
              fileCount: filesFromAI.length,
            }
          ),
        ]);

        /* =================================================
           CREATE NEW PROJECT
        ================================================= */

        if (!isExistingProject) {
          const generatedProjectName =
            buildProjectName(userPrompt);

          addActivity(
            "Saving the project to your workspace...",
            "active"
          );

          const projectResponse =
            await createProject({
              projectName: generatedProjectName,
              description: userPrompt,
              framework,
              files: filesFromAI,
            });

          let createdProject =
            extractProjectFromResponse(
              projectResponse
            );

          if (!createdProject) {
            const unwrapped =
              unwrapApiResponse(projectResponse);

            if (
              unwrapped &&
              typeof unwrapped === "object" &&
              !Array.isArray(unwrapped) &&
              (
                unwrapped._id ||
                unwrapped.id ||
                unwrapped.projectName ||
                Array.isArray(unwrapped.files)
              )
            ) {
              createdProject = unwrapped;
            }
          }

          if (createdProject) {
            const savedFiles =
              normalizeProjectFiles(
                createdProject,
                null
              );

            const finalFiles =
              savedFiles.length > 0
                ? savedFiles
                : filesFromAI;

            const projectWithFiles = {
              ...createdProject,
              projectName:
                getProjectName(
                  createdProject
                ) || generatedProjectName,
              files: finalFiles,
            };

            applySelectedProject(
              projectWithFiles
            );

            setGeneratedFiles(finalFiles);
            setSelectedFile(
              finalFiles[0] || null
            );

            const createdId =
              getProjectId(createdProject);

            if (createdId) {
              await loadProjects(createdId);
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
          /* ===============================================
             UPDATE EXISTING PROJECT
          =============================================== */

          addActivity(
            "Saving the updated project...",
            "active"
          );

          const updateResponse =
            await updateProject(
              selectedProjectId,
              {
                files: filesFromAI,
              }
            );

          const updatedProject =
            extractProjectFromResponse(
              updateResponse
            );

          if (updatedProject) {
            const returnedFiles =
              normalizeProjectFiles(
                updatedProject,
                null
              );

            applySelectedProject({
              ...updatedProject,
              files:
                returnedFiles.length > 0
                  ? returnedFiles
                  : filesFromAI,
            });
          } else {
            await loadProjects(
              selectedProjectId
            );
          }

          setGeneratedFiles(filesFromAI);
          setSelectedFile(
            filesFromAI[0] || null
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
        setActiveView("preview");

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

        const message = getErrorMessage(
          err,
          "The build could not be completed."
        );

        setChatMessages((previous) => [
          ...previous,
          createMessage(
            "assistant",
            message,
            { error: true }
          ),
        ]);

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

  const handleChatSubmit = useCallback(
    (event) => {
      event?.preventDefault();

      if (loading || !prompt.trim()) {
        return;
      }

      handleBuild(prompt);
    },
    [loading, prompt, handleBuild]
  );

  /* =======================================================
     REVIEW / FIX
  ======================================================= */

  const handleReviewFix = useCallback(async () => {
    if (!selectedProjectId) {
      setError(
        "Select a project before running Review / Fix."
      );
      return;
    }

    if (loading) {
      return;
    }

    const reviewInstruction = prompt.trim()
      ? [
          "Review and improve the current project.",
          "",
          `Project ID: ${selectedProjectId}`,
          `Project name: ${projectName}`,
          "",
          "Requested review/change:",
          prompt.trim(),
          "",
          "Return the complete project files required for the implementation.",
        ].join("\n")
      : [
          "Review the current project.",
          "",
          "Check for implementation errors, broken user experience, responsive issues, accessibility problems, and incomplete functionality.",
          "",
          "Return the complete project files required for any fixes.",
        ].join("\n");

    setPrompt(reviewInstruction);
    await handleBuild(reviewInstruction);
  }, [
    selectedProjectId,
    loading,
    prompt,
    projectName,
    handleBuild,
  ]);

  /* =======================================================
     DEPLOY
     Existing billing/deployment architecture is preserved.
     Only the single top-level Deploy action is exposed.
  ======================================================= */

  const handleDeploy = useCallback(() => {
    const projectId = getProjectId(
      selectedProject
    );

    if (!projectId) {
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

    setError("");
    setNotice(
      "Opening the deployment flow for this project..."
    );

    window.location.assign(
      `/billing?projectId=${encodeURIComponent(
        projectId
      )}&intent=deploy`
    );
  }, [selectedProject, generatedFiles.length]);

  /* =======================================================
     PREVIEW
  ======================================================= */

  const openPreview = useCallback(() => {
    setActiveView("preview");
    setMobilePanel("workspace");
    setPreviewFullscreen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewFullscreen(false);
  }, []);

  /* =======================================================
     FILES / ACTIVITY
  ======================================================= */

  const openFilesDrawer = useCallback(() => {
    setFilesDrawerOpen(true);
    setActivityDrawerOpen(false);
  }, []);

  const closeFilesDrawer = useCallback(() => {
    setFilesDrawerOpen(false);
  }, []);

  const openActivityDrawer = useCallback(() => {
    setActivityDrawerOpen(true);
    setFilesDrawerOpen(false);
  }, []);

  const closeActivityDrawer = useCallback(() => {
    setActivityDrawerOpen(false);
  }, []);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setFilesDrawerOpen(false);
    setActiveView("code");
  }, []);

  /* =======================================================
     KEYBOARD
  ======================================================= */

  const handlePromptKeyDown = useCallback(
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
            <div className={styles.projectMark}>Z</div>

            <div className={styles.brandCopy}>
              <span>ZYRIONOS WORKSPACE</span>
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
              <span className={styles.statusDots}>
                <i />
                <i />
                <i />
              </span>
            )}

            {operationRunning && (
              <small>
                {elapsedSeconds}s
              </small>
            )}
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerButton}
              onClick={openFilesDrawer}
            >
              Files
              <b>{generatedFiles.length}</b>
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
              disabled={generatedFiles.length === 0}
            >
              Preview
            </button>

            <button
              type="button"
              className={styles.deployButton}
              onClick={handleDeploy}
              disabled={
                !selectedProjectId ||
                generatedFiles.length === 0
              }
            >
              Deploy
            </button>
          </div>
        </header>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div
            className={styles.alertError}
            role="alert"
          >
            <span>!</span>

            <div>
              <strong>Workspace error</strong>
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

        {/* =================================================
            MOBILE NAV
        ================================================= */}

        <nav className={styles.mobileNav}>
          <button
            type="button"
            className={
              mobilePanel === "projects"
                ? styles.mobileNavActive
                : ""
            }
            onClick={() =>
              setMobilePanel("projects")
            }
          >
            Projects
          </button>

          <button
            type="button"
            className={
              mobilePanel === "workspace"
                ? styles.mobileNavActive
                : ""
            }
            onClick={() =>
              setMobilePanel("workspace")
            }
          >
            Workspace
          </button>

          <button
            type="button"
            className={
              mobilePanel === "activity"
                ? styles.mobileNavActive
                : ""
            }
            onClick={() =>
              setMobilePanel("activity")
            }
          >
            Activity
          </button>
        </nav>

        {/* =================================================
            BODY
        ================================================= */}

        <section className={styles.workspaceBody}>
          {/* =================================================
              PROJECTS
          ================================================= */}

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
                <strong>Create a Project</strong>
                <small>Start from an idea</small>
              </div>

              <b>→</b>
            </button>

            <div className={styles.quickPromptList}>
              <span>START WITH</span>

              {QUICK_PROMPTS.map((item) => (
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
              ))}
            </div>

            <div className={styles.projectList}>
              {projectLoading ? (
                <div className={styles.projectLoading}>
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className={styles.noProjects}>
                  <strong>No projects yet</strong>
                  <p>
                    Start with an idea and your
                    project will be saved here.
                  </p>

                  <button
                    type="button"
                    onClick={handleNewProject}
                  >
                    Start building
                  </button>
                </div>
              ) : (
                projects.map((project) => {
                  const id = getProjectId(project);
                  const name = getProjectName(project);

                  const active =
                    String(id) ===
                    String(selectedProjectId);

                  const files =
                    normalizeProjectFiles(
                      project,
                      null
                    );

                  return (
                    <button
                      key={id || name}
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
                        <strong title={name}>
                          {name}
                        </strong>

                        <small>
                          {getProjectFramework(
                            project
                          )}
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
                })
              )}
            </div>
          </aside>

          {/* =================================================
              MAIN WORKSPACE
          ================================================= */}

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
            {/* TOOLBAR */}

            <div className={styles.workspaceToolbar}>
              <div className={styles.workspaceTitle}>
                <span>APPLICATION</span>
                <strong title={projectName}>
                  {projectName}
                </strong>
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
                  className={styles.frameworkSelect}
                  aria-label="Framework"
                >
                  {FRAMEWORKS.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
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
                <div className={styles.previewShell}>
                  <div className={styles.previewHeader}>
                    <div className={styles.browserDots}>
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

                    <div className={styles.previewAddress}>
                      {previewUrl ||
                        (previewEntryFile
                          ? "Local HTML preview"
                          : "Preview runtime")}
                    </div>

                    <span
                      className={
                        previewUrl ||
                        previewEntryFile
                          ? styles.previewReady
                          : styles.previewPending
                      }
                    >
                      {previewUrl
                        ? "LIVE"
                        : previewEntryFile
                        ? "READY"
                        : previewStatus ||
                          "WAITING"}
                    </span>

                    <button
                      type="button"
                      onClick={openPreview}
                      disabled={
                        generatedFiles.length === 0
                      }
                    >
                      Open
                    </button>
                  </div>

                  <div className={styles.previewContent}>
                    {previewUrl ? (
                      <iframe
                        title={`${projectName} application preview`}
                        src={previewUrl}
                        className={
                          styles.previewFrame
                        }
                        allow="fullscreen"
                      />
                    ) : previewEntryFile ? (
                      <iframe
                        title={`${projectName} HTML preview`}
                        srcDoc={getFileContent(
                          previewEntryFile
                        )}
                        className={
                          styles.previewFrame
                        }
                        sandbox="allow-scripts allow-forms allow-modals"
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
                          PREVIEW
                        </span>

                        <h2>
                          Project generated
                        </h2>

                        <p>
                          {generatedFiles.length > 0
                            ? `${generatedFiles.length} files are ready. The backend has not returned a live preview runtime URL yet.`
                            : "Build an application to create the project files."}
                        </p>

                        {generatedFiles.length > 0 && (
                          <button
                            type="button"
                            onClick={openFilesDrawer}
                          >
                            View project files
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.codeSurface}>
                  <div
                    className={
                      styles.codeSurfaceHeader
                    }
                  >
                    <div>
                      <span>PROJECT FILES</span>
                      <b>{generatedFiles.length}</b>
                    </div>

                    <button
                      type="button"
                      onClick={openFilesDrawer}
                    >
                      Open Files
                    </button>
                  </div>

                  <div className={styles.codeSurfaceBody}>
                    <div className={styles.codeFileList}>
                      {generatedFiles.map((file) => {
                        const path = getFilePath(file);
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
                                ? styles.codeFileActive
                                : styles.codeFile
                            }
                            onClick={() =>
                              setSelectedFile(file)
                            }
                            title={path}
                          >
                            <span>◇</span>
                            {path}
                          </button>
                        );
                      })}
                    </div>

                    <pre className={styles.codeEditor}>
                      {getFileContent(selectedFile)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* CHAT */}

            <section className={styles.chatArea}>
              <div className={styles.chatHeader}>
                <div>
                  <span>ZYRIONOS AI</span>
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

                  {operationRunning ? (
                    <>
                      <span>Working</span>
                      <span
                        className={
                          styles.chatDots
                        }
                      >
                        <i />
                        <i />
                        <i />
                      </span>
                    </>
                  ) : (
                    "Ready"
                  )}
                </div>
              </div>

              <div className={styles.chatMessages}>
                {chatMessages.length === 0 ? (
                  <div className={styles.chatWelcome}>
                    <strong>
                      What should we build?
                    </strong>

                    <span>
                      Describe the application or
                      change in normal language.
                    </span>

                    <div
                      className={
                        styles.chatQuickPrompts
                      }
                    >
                      {QUICK_PROMPTS.slice(0, 3).map(
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
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.role === "user"
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
                        {message.role === "user"
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
                            {message.timestamp}
                          </small>
                        </div>

                        <p>{message.content}</p>

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
                            {message.fileCount}{" "}
                            generated files
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <div ref={chatEndRef} />
              </div>

              <form
                className={styles.chatComposer}
                onSubmit={handleChatSubmit}
              >
                <div className={styles.chatComposerTop}>
                  <div>
                    <span>✦</span>
                    <strong>
                      {selectedProject
                        ? `Editing ${projectName}`
                        : "New application"}
                    </strong>
                  </div>

                  <small>{framework}</small>
                </div>

                <textarea
                  data-zyrionos-chat-input="true"
                  value={prompt}
                  onChange={(event) =>
                    setPrompt(event.target.value)
                  }
                  onKeyDown={handlePromptKeyDown}
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
                  <div className={styles.chatHints}>
                    <span>
                      Enter to build
                    </span>
                    <span>
                      Shift + Enter for a new line
                    </span>
                  </div>

                  <div className={styles.chatActions}>
                    {selectedProject && (
                      <button
                        type="button"
                        className={
                          styles.reviewButton
                        }
                        disabled={loading}
                        onClick={handleReviewFix}
                      >
                        Review / Fix
                      </button>
                    )}

                    <button
                      type="submit"
                      className={styles.buildButton}
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

                      <span>↑</span>
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </section>

          {/* =================================================
              MOBILE ACTIVITY PANEL
              No permanent agent pipeline.
          ================================================= */}

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
            <div className={styles.activityPanelHeader}>
              <div>
                <span>WORKSPACE</span>
                <strong>Activity</strong>
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

            <div className={styles.activityPanelBody}>
              <div className={styles.currentOperation}>
                <span>CURRENT STATUS</span>

                <strong>
                  {operationRunning
                    ? currentOperationLabel
                    : "Workspace ready"}
                </strong>

                <p>
                  {operationRunning
                    ? "ZyrionOS is processing your request"
                    : "Ready for the next request."}
                </p>

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

              <div className={styles.activityListCard}>
                <div
                  className={
                    styles.activityListHeader
                  }
                >
                  <span>ACTIVITY</span>
                  <b>{activityLog.length}</b>
                </div>

                {activityLog.length === 0 ? (
                  <p className={styles.activityEmpty}>
                    Activity will appear here while
                    your project is being built.
                  </p>
                ) : (
                  <div className={styles.activityItems}>
                    {activityLog
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
                              item.type === "success"
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
                            <p>{item.message}</p>
                            <small>
                              {item.timestamp}
                            </small>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className={styles.projectStats}>
                <div>
                  <span>PROJECT FILES</span>
                  <strong>
                    {generatedFiles.length}
                  </strong>
                </div>

                <div>
                  <span>FRAMEWORK</span>
                  <strong>{framework}</strong>
                </div>

                <div>
                  <span>DEPLOYMENT</span>
                  <strong>
                    {deploymentStatus}
                  </strong>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* =================================================
            FILE DRAWER
        ================================================= */}

        {filesDrawerOpen && (
          <div
            className={styles.drawerOverlay}
            onClick={closeFilesDrawer}
          >
            <aside
              className={styles.filesDrawer}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className={styles.drawerHeader}>
                <div>
                  <span>PROJECT</span>
                  <strong>Files</strong>
                </div>

                <button
                  type="button"
                  onClick={closeFilesDrawer}
                  aria-label="Close files"
                >
                  ×
                </button>
              </div>

              <div className={styles.drawerProject}>
                <strong>{projectName}</strong>
                <small>
                  {generatedFiles.length} generated
                  files · {framework}
                </small>
              </div>

              <div className={styles.drawerFiles}>
                {generatedFiles.length === 0 ? (
                  <div className={styles.drawerEmpty}>
                    No project files available.
                  </div>
                ) : (
                  generatedFiles.map((file) => {
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
                        <span>◇</span>
                        <strong title={path}>
                          {path}
                        </strong>
                      </button>
                    );
                  })
                )}
              </div>

              <div className={styles.drawerFooter}>
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
            className={styles.drawerOverlay}
            onClick={closeActivityDrawer}
          >
            <aside
              className={styles.activityDrawer}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className={styles.drawerHeader}>
                <div>
                  <span>WORKSPACE</span>
                  <strong>Activity</strong>
                </div>

                <button
                  type="button"
                  onClick={closeActivityDrawer}
                  aria-label="Close activity"
                >
                  ×
                </button>
              </div>

              <div className={styles.activityDrawerBody}>
                {activityLog.length === 0 ? (
                  <p>No activity yet.</p>
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
                            item.type === "success"
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
                          <p>{item.message}</p>
                          <small>
                            {item.timestamp}
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
            FULL PAGE PREVIEW
        ================================================= */}

        {previewFullscreen && (
          <div
            className={styles.previewOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Application preview"
          >
            <div className={styles.previewOverlayHeader}>
              <div>
                <span>PREVIEW</span>
                <strong title={projectName}>
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
                  onClick={closePreview}
                  className={
                    styles.previewCloseButton
                  }
                >
                  Close Preview
                </button>
              </div>
            </div>

            <div className={styles.previewOverlayBody}>
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
                <iframe
                  title={`${projectName} HTML preview`}
                  srcDoc={getFileContent(
                    previewEntryFile
                  )}
                  className={
                    styles.previewFullFrame
                  }
                  sandbox="allow-scripts allow-forms allow-modals"
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

                  <span>PREVIEW RUNTIME</span>

                  <h2>
                    Project files are ready
                  </h2>

                  <p>
                    This project does not yet have
                    a live preview URL or a static
                    HTML entry file. The preview
                    screen is intentionally not
                    faking an application.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      closePreview();
                      setActiveView("code");
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
