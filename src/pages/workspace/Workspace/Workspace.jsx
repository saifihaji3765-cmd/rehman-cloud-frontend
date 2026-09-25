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


/* =========================================================
   ZYRIONOS WORKSPACE
   AI APP BUILDER
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
    label: "Build an AI SaaS dashboard",
    prompt: "Build an AI SaaS dashboard",
  },
  {
    label: "Create a production-ready landing page",
    prompt: "Create a production-ready landing page",
  },
  {
    label: "Add authentication and user accounts",
    prompt: "Add authentication and user accounts",
  },
  {
    label: "Build an admin control center",
    prompt: "Build an admin control center",
  },
];


/* =========================================================
   RESPONSE HELPERS
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
    root?.project?.data,

    response?.project,
    response?.data?.project,
    response?.data?.data?.project,
  ];

  for (
    const candidate of candidates
  ) {
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
    "Untitled Project"
  );
}


function getProjectFramework(project) {
  return (
    project?.framework ||
    "React"
  );
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

  for (
    const candidate of candidates
  ) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (Array.isArray(root)) {
    return root;
  }

  return [];
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

    aiResult?.orchestration
      ?.buildResult
      ?.data
      ?.files,

    aiResult?.orchestration
      ?.buildResult
      ?.files,

    aiResult?.orchestration
      ?.buildResult
      ?.data
      ?.data
      ?.files,

    aiResult?.data
      ?.orchestration
      ?.buildResult
      ?.data
      ?.files,

    aiResult?.data
      ?.orchestration
      ?.buildResult
      ?.files,

    aiResult?.data
      ?.orchestration
      ?.buildResult
      ?.data
      ?.data
      ?.files,
  ];

  for (
    const files of possibleCollections
  ) {
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
      return "Deploying...";

    case "failed":
    case "error":
      return "Deployment failed";

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
   ACTIVITY
========================================================= */

function normalizeActivityItem(
  item,
  index
) {
  if (typeof item === "string") {
    return {
      id: `activity-${index}-${item}`,
      message: item,
      type: "info",
    };
  }

  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const message =
    item.message ||
    item.description ||
    item.detail ||
    item.step ||
    item.name ||
    item.action ||
    "";

  if (!message) {
    return null;
  }

  const rawType =
    String(
      item.type ||
      item.status ||
      item.level ||
      "info"
    ).toLowerCase();

  let type = "info";

  if (
    rawType.includes("error") ||
    rawType.includes("fail")
  ) {
    type = "error";
  } else if (
    rawType.includes("success") ||
    rawType.includes("complete") ||
    rawType.includes("done")
  ) {
    type = "success";
  } else if (
    rawType.includes("warn")
  ) {
    type = "warning";
  } else if (
    rawType.includes("active") ||
    rawType.includes("running") ||
    rawType.includes("progress")
  ) {
    type = "active";
  }

  return {
    id:
      item.id ||
      item._id ||
      `activity-${index}-${message}`,
    message: String(message),
    type,
  };
}


function extractBackendActivity(result) {
  const candidates = [
    result?.activity,
    result?.logs,
    result?.events,

    result?.data?.activity,
    result?.data?.logs,
    result?.data?.events,

    result?.orchestration?.activity,
    result?.orchestration?.logs,
    result?.orchestration?.events,

    result?.orchestration
      ?.buildResult
      ?.activity,

    result?.orchestration
      ?.buildResult
      ?.logs,

    result?.orchestration
      ?.buildResult
      ?.events,

    result?.data
      ?.orchestration
      ?.activity,

    result?.data
      ?.orchestration
      ?.logs,

    result?.data
      ?.orchestration
      ?.events,
  ];

  for (
    const candidate of candidates
  ) {
    if (Array.isArray(candidate)) {
      return candidate
        .map(normalizeActivityItem)
        .filter(Boolean);
    }
  }

  return [];
}


/* =========================================================
   CHAT MESSAGE
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
   COMPONENT
========================================================= */

function Workspace() {

  /* =======================================================
     PROJECT STATE
  ======================================================= */

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState(null);

  const selectedProjectRef =
    useRef(null);


  /* =======================================================
     BUILDER
  ======================================================= */

  const [
    prompt,
    setPrompt,
  ] = useState("");

  const [
    framework,
    setFramework,
  ] = useState("React");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    deploying,
    setDeploying,
  ] = useState(false);


  /* =======================================================
     PROJECT RESULT
  ======================================================= */

  const [
    generatedFiles,
    setGeneratedFiles,
  ] = useState([]);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);


  /* =======================================================
     CHAT
  ======================================================= */

  const [
    chatMessages,
    setChatMessages,
  ] = useState([]);


  /* =======================================================
     DEPLOYMENT
  ======================================================= */

  const [
    deploymentStatus,
    setDeploymentStatus,
  ] = useState("Not deployed");

  const [
    liveUrl,
    setLiveUrl,
  ] = useState("");


  /* =======================================================
     UI
  ======================================================= */

  const [
    activeView,
    setActiveView,
  ] = useState("preview");

  const [
    mobilePanel,
    setMobilePanel,
  ] = useState("workspace");

  const [
    filesDrawerOpen,
    setFilesDrawerOpen,
  ] = useState(false);

  const [
    activityDrawerOpen,
    setActivityDrawerOpen,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    projectLoading,
    setProjectLoading,
  ] = useState(true);


  /* =======================================================
     OPERATION
  ======================================================= */

  const [
    operation,
    setOperation,
  ] = useState("idle");

  const [
    operationStartedAt,
    setOperationStartedAt,
  ] = useState(null);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    activityLog,
    setActivityLog,
  ] = useState([]);


  /* =======================================================
     PREVIEW
  ======================================================= */

  const [
    previewFullscreen,
    setPreviewFullscreen,
  ] = useState(false);

  const previewRef =
    useRef(null);


  /* =======================================================
     REFS
  ======================================================= */

  const initialLoadStarted =
    useRef(false);

  const mountedRef =
    useRef(false);

  const chatEndRef =
    useRef(null);


  /* =======================================================
     DERIVED
  ======================================================= */

  const projectName =
    getProjectName(
      selectedProject
    );

  const selectedProjectId =
    getProjectId(
      selectedProject
    );

  const projectCount =
    projects.length;

  const previewUrl =
    liveUrl ||
    getPreviewUrl(
      selectedProject
    );

  const previewStatus =
    getPreviewStatus(
      selectedProject
    );

  const previewAvailable =
    Boolean(previewUrl);

  const deploymentIsLive =
    deploymentStatus === "Deployed";

  const operationRunning =
    operation !== "idle";


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
            (
              Date.now() -
              operationStartedAt
            ) / 1000
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

  }, [
    operationStartedAt,
  ]);


  /* =======================================================
     CHAT AUTO SCROLL
  ======================================================= */

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

  }, [
    chatMessages,
  ]);


  /* =======================================================
     FULLSCREEN
  ======================================================= */

  useEffect(() => {

    const handleFullscreenChange = () => {
      setPreviewFullscreen(
        Boolean(
          document.fullscreenElement
        )
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () =>
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

  }, []);


  /* =======================================================
     SELECTED PROJECT REF
  ======================================================= */

  useEffect(() => {
    selectedProjectRef.current =
      selectedProject;
  }, [
    selectedProject,
  ]);


  /* =======================================================
     ACTIVITY
  ======================================================= */

  const addActivity =
    useCallback(
      (
        message,
        type = "info"
      ) => {

        setActivityLog(
          previous =>
            [
              ...previous,
              {
                id:
                  `${Date.now()}-${Math.random()}`,
                message,
                type,
                timestamp:
                  new Date()
                    .toLocaleTimeString(
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


  const addBackendActivity =
    useCallback(
      result => {

        const backendActivity =
          extractBackendActivity(
            result
          );

        if (
          backendActivity.length === 0
        ) {
          return;
        }

        setActivityLog(
          previous =>
            [
              ...previous,
              ...backendActivity.map(
                item => ({
                  ...item,
                  timestamp:
                    new Date()
                      .toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      ),
                })
              ),
            ].slice(-60)
        );
      },
      []
    );


  const startOperation =
    useCallback(
      (
        type,
        message
      ) => {

        setOperation(type);

        setOperationStartedAt(
          Date.now()
        );

        addActivity(
          message,
          "active"
        );
      },
      [
        addActivity,
      ]
    );


  const finishOperation =
    useCallback(
      (
        success,
        message
      ) => {

        addActivity(
          message,
          success
            ? "success"
            : "error"
        );

        setOperation("idle");

        setOperationStartedAt(
          null
        );
      },
      [
        addActivity,
      ]
    );


  /* =======================================================
     APPLY PROJECT
  ======================================================= */

  const applySelectedProject =
    useCallback(
      project => {

        if (!project) {
          return;
        }

        selectedProjectRef.current =
          project;

        setSelectedProject(
          project
        );

        const files =
          normalizeProjectFiles(
            project,
            null
          );

        setGeneratedFiles(
          files
        );

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
          getPreviewUrl(
            project
          )
        );

        const projectFramework =
          getProjectFramework(
            project
          );

        if (
          FRAMEWORKS.includes(
            projectFramework
          )
        ) {
          setFramework(
            projectFramework
          );
        }

      },
      []
    );


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

          setProjects(
            normalized
          );


          const currentId =
            preferredProjectId ||
            getProjectId(
              selectedProjectRef.current
            );


          if (currentId) {

            const preferred =
              normalized.find(
                project =>
                  String(
                    getProjectId(
                      project
                    )
                  ) ===
                  String(
                    currentId
                  )
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
      [
        applySelectedProject,
      ]
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    if (
      initialLoadStarted.current
    ) {
      return;
    }

    initialLoadStarted.current =
      true;

    mountedRef.current =
      true;

    loadProjects();

    return () => {
      mountedRef.current =
        false;
    };

  }, [
    loadProjects,
  ]);


  /* =======================================================
     PROJECT SELECTION
  ======================================================= */

  const handleSelectProject =
    useCallback(
      project => {

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

        setFilesDrawerOpen(false);
        setActivityDrawerOpen(false);

        applySelectedProject(
          project
        );

      },
      [
        applySelectedProject,
      ]
    );


  /* =======================================================
     NEW PROJECT
  ======================================================= */

  const handleNewProject =
    useCallback(
      () => {

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

        setActiveView(
          "preview"
        );

        setMobilePanel(
          "workspace"
        );

        setFilesDrawerOpen(false);
        setActivityDrawerOpen(false);

        setError("");
        setNotice("");

        setActivityLog([]);

        setOperation("idle");
        setOperationStartedAt(null);

      },
      []
    );


  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  function handleQuickPrompt(
    value
  ) {

    setPrompt(value);

    setError("");
    setNotice("");

    setMobilePanel(
      "workspace"
    );

    setTimeout(() => {
      document
        .querySelector(
          '[data-zyrionos-chat-input="true"]'
        )
        ?.focus();
    }, 50);
  }


  /* =======================================================
     BUILD / CHANGE
  ======================================================= */

  async function handleBuild(
    suppliedPrompt = ""
  ) {

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
        previous => [
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
          ? "Change request submitted to ZyrionOS AI."
          : "Build request submitted to ZyrionOS AI."
      );


      addActivity(
        "Master Agent request accepted.",
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
        "Intent and planning stages are being processed by the backend.",
        "active"
      );


      const aiResult =
        await generateCode(
          instruction,
          framework
        );


      addActivity(
        "AI backend response received.",
        "success"
      );


      addBackendActivity(
        aiResult
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
        filesFromAI.length === 0
      ) {

        throw new Error(
          "AI generation completed, but no project files were returned by the backend."
        );
      }


      addActivity(
        `${filesFromAI.length} generated project files received.`,
        "success"
      );


      setChatMessages(
        previous => [
          ...previous,
          createMessage(
            "assistant",
            assistantText ||
              `The project build completed and ${filesFromAI.length} files were generated.`,
            {
              fileCount:
                filesFromAI.length,
            }
          ),
        ]
      );


      /* ===================================================
         CREATE NEW PROJECT
      =================================================== */

      if (!isExistingProject) {

        addActivity(
          "Saving generated application as a project.",
          "active"
        );


        const projectResponse =
          await createProject({
            projectName:
              userPrompt.substring(
                0,
                120
              ),

            description:
              userPrompt,

            framework,

            files:
              filesFromAI,
          });


        addActivity(
          "Project saved successfully.",
          "success"
        );


        let createdProject =
          extractProjectFromResponse(
            projectResponse
          );


        if (!createdProject) {

          const unwrapped =
            unwrapApiResponse(
              projectResponse
            );

          if (
            unwrapped &&
            typeof unwrapped === "object" &&
            !Array.isArray(unwrapped) &&
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

          applySelectedProject({
            ...createdProject,
            files:
              finalFiles,
          });

          setGeneratedFiles(
            finalFiles
          );

          setSelectedFile(
            finalFiles[0] || null
          );


          const createdId =
            getProjectId(
              createdProject
            );

          if (createdId) {

            await loadProjects(
              createdId
            );
          }

        } else {

          await loadProjects();
        }


        setNotice(
          `Project created successfully with ${filesFromAI.length} generated files.`
        );

      }


      /* ===================================================
         UPDATE EXISTING PROJECT
      =================================================== */

      else {

        addActivity(
          "Saving updated application files.",
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


        addActivity(
          "Updated application files persisted.",
          "success"
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


        setGeneratedFiles(
          filesFromAI
        );

        setSelectedFile(
          filesFromAI[0] || null
        );


        setNotice(
          `Change applied successfully. ${filesFromAI.length} project files are now saved.`
        );
      }


      addActivity(
        "Build operation completed.",
        "success"
      );


      setPrompt("");

      setActiveView(
        "preview"
      );

      finishOperation(
        true,
        isExistingProject
          ? "Project change completed successfully."
          : "Project build completed successfully."
      );

    } catch (err) {

      console.error(
        "Workspace build error:",
        err
      );


      setChatMessages(
        previous => [
          ...previous,
          createMessage(
            "assistant",
            getErrorMessage(
              err,
              "The build could not be completed."
            ),
            {
              error: true,
            }
          ),
        ]
      );


      setError(
        getErrorMessage(
          err,
          "Unable to build the project right now."
        )
      );


      finishOperation(
        false,
        "Build operation failed."
      );

    } finally {

      setLoading(false);
    }
  }


  /* =======================================================
     CHAT SUBMIT
  ======================================================= */

  function handleChatSubmit(event) {

    event?.preventDefault();

    if (
      loading ||
      !prompt.trim()
    ) {
      return;
    }

    handleBuild(
      prompt
    );
  }


  /* =======================================================
     REVIEW / FIX
  ======================================================= */

  async function handleReviewFix() {

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
            "",
            "Requested review/change:",
            prompt.trim(),
            "",
            "Return the complete project files required for the implementation.",
          ].join("\n")
        : [
            "Review the current project.",
            "",
            "Check for:",
            "- implementation errors",
            "- broken user experience",
            "- responsive issues",
            "- accessibility problems",
            "- incomplete functionality",
            "",
            "Return the complete project files required for any fixes.",
          ].join("\n");


    setPrompt(
      reviewInstruction
    );

    await handleBuild(
      reviewInstruction
    );
  }


  /* =======================================================
     DEPLOY → BILLING
  ======================================================= */

  function handleDeploy() {

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
      generatedFiles.length === 0
    ) {

      setError(
        "This project has no generated files to deploy."
      );

      return;
    }


    /*
     * IMPORTANT:
     *
     * Workspace does NOT call deployment directly.
     *
     * The billing/payment system must verify
     * payment first. The backend billing flow
     * is responsible for triggering deployment
     * after successful payment verification.
     */

    window.location.assign(
      `/billing?projectId=${encodeURIComponent(
        projectId
      )}&intent=deploy`
    );
  }


  /* =======================================================
     PREVIEW FULLSCREEN
  ======================================================= */

  async function handlePreviewFullscreen() {

    try {

      if (
        document.fullscreenElement
      ) {

        await document.exitFullscreen();

        return;
      }


      if (
        previewRef.current &&
        previewRef.current.requestFullscreen
      ) {

        await previewRef.current.requestFullscreen();
      }

    } catch (err) {

      console.error(
        "Preview fullscreen error:",
        err
      );
    }
  }


  /* =======================================================
     OPEN BILLING
  ======================================================= */

  function handleSubscription() {

    window.location.assign(
      "/billing"
    );
  }


  /* =======================================================
     KEYBOARD
  ======================================================= */

  function handlePromptKeyDown(
    event
  ) {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleChatSubmit(event);
    }
  }


  /* =======================================================
     FILES DRAWER
  ======================================================= */

  function openFilesDrawer() {

    setFilesDrawerOpen(true);
    setActivityDrawerOpen(false);
  }


  function closeFilesDrawer() {

    setFilesDrawerOpen(false);
  }


  /* =======================================================
     ACTIVITY DRAWER
  ======================================================= */

  function openActivityDrawer() {

    setActivityDrawerOpen(true);
    setFilesDrawerOpen(false);
  }


  function closeActivityDrawer() {

    setActivityDrawerOpen(false);
  }


  /* =======================================================
     FILE SELECTION
  ======================================================= */

  function handleFileSelect(file) {

    setSelectedFile(file);

    setFilesDrawerOpen(false);

    setActiveView("code");
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>

      <main
        className={styles.workspace}
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
                ZYRIONOS
              </span>

              <strong>
                {projectName}
              </strong>

            </div>

          </div>


          <div
            className={
              styles.headerCenter
            }
          >

            <span
              className={
                operationRunning
                  ? styles.statusRunning
                  : styles.statusReady
              }
            />

            <span>
              {operationRunning
                ? "AI working"
                : "Ready"}
            </span>

            {operationRunning && (
              <small>
                {elapsedSeconds}s
              </small>
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
                openFilesDrawer
              }
            >
              <span>
                ▫
              </span>

              Files

              <b>
                {generatedFiles.length}
              </b>
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
                styles.headerButton
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
                styles.deployButton
              }
              onClick={
                handleDeploy
              }
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
            className={
              styles.alertError
            }
            role="alert"
          >

            <span>
              !
            </span>

            <div>
              <strong>
                Workspace error
              </strong>

              <p>
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>
        )}


        {notice && !error && (
          <div
            className={
              styles.alertSuccess
            }
            role="status"
          >

            <span>
              ✓
            </span>

            <p>
              {notice}
            </p>

            <button
              type="button"
              onClick={() =>
                setNotice("")
              }
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
              mobilePanel === "projects"
                ? styles.mobileNavActive
                : ""
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
              mobilePanel === "workspace"
                ? styles.mobileNavActive
                : ""
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
              mobilePanel === "activity"
                ? styles.mobileNavActive
                : ""
            }
            onClick={() =>
              setMobilePanel(
                "activity"
              )
            }
          >
            Activity
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

            <div
              className={
                styles.railHeader
              }
            >

              <div>
                <span>
                  PROJECTS
                </span>

                <b>
                  {projectCount}
                </b>
              </div>

              <button
                type="button"
                onClick={
                  handleNewProject
                }
              >
                + New
              </button>

            </div>


            <button
              type="button"
              className={
                styles.newProjectCard
              }
              onClick={
                handleNewProject
              }
            >

              <span>
                +
              </span>

              <div>
                <strong>
                  Create a Project
                </strong>

                <small>
                  Start from an idea
                </small>
              </div>

              <b>
                →
              </b>

            </button>


            <div
              className={
                styles.projectList
              }
            >

              {projectLoading ? (

                <div
                  className={
                    styles.projectLoading
                  }
                >
                  Loading projects...
                </div>

              ) : projects.length === 0 ? (

                <div
                  className={
                    styles.noProjects
                  }
                >

                  <strong>
                    No projects yet
                  </strong>

                  <p>
                    Start with an idea and let
                    ZyrionOS build the application.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleNewProject
                    }
                  >
                    Start building
                  </button>

                </div>

              ) : (

                projects.map(
                  project => {

                    const id =
                      getProjectId(
                        project
                      );

                    const name =
                      getProjectName(
                        project
                      );

                    const active =
                      String(id) ===
                      String(
                        selectedProjectId
                      );

                    return (
                      <button
                        key={
                          id ||
                          name
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

                          <strong>
                            {name}
                          </strong>

                          <small>
                            {getProjectFramework(
                              project
                            )}
                          </small>

                        </span>

                        {active && (
                          <i />
                        )}

                      </button>
                    );
                  }
                )
              )}

            </div>

          </aside>


          {/* =================================================
              MAIN
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

            {/* TOP TOOLBAR */}

            <div
              className={
                styles.workspaceToolbar
              }
            >

              <div
                className={
                  styles.workspaceTitle
                }
              >

                <span>
                  AI APP BUILDER
                </span>

                <strong>
                  {activeView === "preview"
                    ? "Live Preview"
                    : "Project Files"}
                </strong>

              </div>


              <div
                className={
                  styles.toolbarActions
                }
              >

                <select
                  value={
                    framework
                  }
                  onChange={event =>
                    setFramework(
                      event.target.value
                    )
                  }
                  disabled={
                    loading
                  }
                  className={
                    styles.frameworkSelect
                  }
                >

                  {FRAMEWORKS.map(
                    item => (
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
                      ? styles.toolbarActive
                      : styles.toolbarButton
                  }
                  onClick={() =>
                    setActiveView(
                      "code"
                    )
                  }
                >
                  Code
                </button>

              </div>

            </div>


            {/* =================================================
                PREVIEW / CODE
            ================================================= */}

            <div
              className={
                styles.visualArea
              }
            >

              {activeView === "preview" ? (

                <div
                  ref={
                    previewRef
                  }
                  className={
                    previewFullscreen
                      ? `${styles.previewShell} ${styles.previewFullscreen}`
                      : styles.previewShell
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

                    <span>
                      {projectName}
                    </span>

                    <div
                      className={
                        styles.previewAddress
                      }
                    >
                      {previewUrl ||
                        "Preview environment"}
                    </div>

                    <span
                      className={
                        previewAvailable
                          ? styles.previewReady
                          : styles.previewPending
                      }
                    >
                      {previewAvailable
                        ? "LIVE"
                        : previewStatus
                          ? previewStatus
                          : "PREVIEW"}
                    </span>

                    {previewAvailable && (
                      <button
                        type="button"
                        onClick={
                          handlePreviewFullscreen
                        }
                      >
                        {previewFullscreen
                          ? "Exit"
                          : "Fullscreen"}
                      </button>
                    )}

                  </div>


                  <div
                    className={
                      styles.previewContent
                    }
                  >

                    {previewAvailable ? (

                      <iframe
                        title={
                          `${projectName} application preview`
                        }
                        src={
                          previewUrl
                        }
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
                          APPLICATION PREVIEW
                        </span>

                        <h2>
                          Your app will appear here
                        </h2>

                        <p>
                          ZyrionOS has generated
                          {generatedFiles.length > 0
                            ? ` ${generatedFiles.length} project files`
                            : " your application files"}
                          . The preview surface is
                          waiting for a real preview
                          runtime URL from the backend.
                        </p>

                        {generatedFiles.length > 0 && (
                          <button
                            type="button"
                            onClick={
                              openFilesDrawer
                            }
                          >
                            Inspect generated app
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
                        {generatedFiles.length}
                      </b>
                    </div>

                    <button
                      type="button"
                      onClick={
                        openFilesDrawer
                      }
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
                        file => {

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
                                  ? styles.codeFileActive
                                  : styles.codeFile
                              }
                              onClick={() =>
                                setSelectedFile(
                                  file
                                )
                              }
                            >
                              <span>
                                ◇
                              </span>

                              {path}
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


            {/* =================================================
                CHAT
            ================================================= */}

            <section
              className={
                styles.chatArea
              }
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
                      Describe the product, feature
                      or change in normal language.
                      ZyrionOS will send it through
                      the real build pipeline.
                    </span>

                  </div>

                ) : (

                  chatMessages.map(
                    message => (
                      <div
                        key={
                          message.id
                        }
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
                              {message.role === "user"
                                ? "You"
                                : "ZyrionOS AI"}
                            </strong>

                            <small>
                              {message.timestamp}
                            </small>
                          </div>

                          <p>
                            {message.content}
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
                              View {message.fileCount} generated files
                            </button>
                          )}

                        </div>

                      </div>
                    )
                  )
                )}

                <div
                  ref={
                    chatEndRef
                  }
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

                  <span>
                    ✦
                  </span>

                  <strong>
                    {selectedProject
                      ? `Editing ${projectName}`
                      : "New application"}
                  </strong>

                  <small>
                    {framework}
                  </small>

                </div>


                <textarea
                  data-zyrionos-chat-input="true"
                  value={
                    prompt
                  }
                  onChange={event =>
                    setPrompt(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handlePromptKeyDown
                  }
                  disabled={
                    loading
                  }
                  rows={2}
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
                    Enter to build
                    <span>
                      Shift + Enter
                    </span>
                    new line
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
                        disabled={
                          loading
                        }
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

                      <span>
                        ↑
                      </span>
                    </button>

                  </div>

                </div>

              </form>

            </section>

          </section>


          {/* =================================================
              ACTIVITY
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

            <div
              className={
                styles.activityPanelHeader
              }
            >

              <div>

                <span>
                  SYSTEM
                </span>

                <strong>
                  Agent Activity
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
                  ? "Running"
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
                  CURRENT OPERATION
                </span>

                <strong>
                  {operationRunning
                    ? operation
                    : "Workspace ready"}
                </strong>

                <p>
                  {operationRunning
                    ? `Processing for ${elapsedSeconds}s`
                    : "Waiting for the next request."}
                </p>

                {operationRunning && (
                  <div
                    className={
                      styles.activityProgress
                    }
                  >
                    <span />
                  </div>
                )}

              </div>


              <div
                className={
                  styles.agentPipeline
                }
              >

                <span>
                  AI PIPELINE
                </span>

                <div>
                  <i className={styles.pipelineDone} />
                  Master Agent
                </div>

                <div>
                  <i className={styles.pipelineDone} />
                  Intent Agent
                </div>

                <div>
                  <i className={styles.pipelineDone} />
                  Planning Agent
                </div>

                <div>
                  <i
                    className={
                      operationRunning
                        ? styles.pipelineActive
                        : styles.pipelineDone
                    }
                  />
                  Builder Agent
                </div>

                <div>
                  <i className={styles.pipelinePending} />
                  Test / Review
                </div>

                <div>
                  <i className={styles.pipelinePending} />
                  Deploy
                </div>

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

                  <span>
                    ACTIVITY LOG
                  </span>

                  <b>
                    {activityLog.length}
                  </b>

                </div>


                {activityLog.length === 0 ? (

                  <p
                    className={
                      styles.activityEmpty
                    }
                  >
                    Real backend activity will
                    appear here during a build.
                  </p>

                ) : (

                  <div
                    className={
                      styles.activityItems
                    }
                  >

                    {activityLog
                      .slice()
                      .reverse()
                      .map(
                        item => (
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
                                item.type === "success"
                                  ? styles.dotSuccess
                                  : item.type === "error"
                                  ? styles.dotError
                                  : item.type === "warning"
                                  ? styles.dotWarning
                                  : item.type === "active"
                                  ? styles.dotActive
                                  : styles.dotInfo
                              }
                            />

                            <div>

                              <p>
                                {item.message}
                              </p>

                              {item.timestamp && (
                                <small>
                                  {item.timestamp}
                                </small>
                              )}

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
                    {generatedFiles.length}
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
                  <span>
                    DEPLOYMENT
                  </span>

                  <strong>
                    {deploymentStatus}
                  </strong>
                </div>

              </div>


              {previewAvailable && (
                <button
                  type="button"
                  className={
                    styles.openPreviewButton
                  }
                  onClick={() =>
                    setActiveView(
                      "preview"
                    )
                  }
                >
                  Open Live Preview
                </button>
              )}

            </div>


            <button
              type="button"
              className={
                styles.activityDeployButton
              }
              disabled={
                !selectedProjectId ||
                generatedFiles.length === 0
              }
              onClick={
                handleDeploy
              }
            >
              Deploy to Production
            </button>

          </aside>

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
              onClick={event =>
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
                  {generatedFiles.length} generated
                  files · {framework}
                </small>

              </div>


              <div
                className={
                  styles.drawerFiles
                }
              >

                {generatedFiles.length === 0 ? (

                  <div
                    className={
                      styles.drawerEmpty
                    }
                  >
                    No project files available.
                  </div>

                ) : (

                  generatedFiles.map(
                    file => {

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

                          <strong>
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
            ACTIVITY MOBILE DRAWER
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
              onClick={event =>
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
                    SYSTEM
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

                {activityLog.length === 0 ? (

                  <p>
                    No activity yet.
                  </p>

                ) : (

                  activityLog
                    .slice()
                    .reverse()
                    .map(
                      item => (
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
                              item.type === "success"
                                ? styles.dotSuccess
                                : item.type === "error"
                                ? styles.dotError
                                : item.type === "active"
                                ? styles.dotActive
                                : styles.dotInfo
                            }
                          />

                          <div>
                            <p>
                              {item.message}
                            </p>

                            <small>
                              {item.timestamp}
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

      </main>

    </DashboardLayout>
  );
}


export default Workspace;
