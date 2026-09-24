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
  deployProject,
} from "../../../services/workspaceService";

import {
  generateCode,
  getGeneratedFiles,
  normalizeAIResponse,
} from "../../../services/aiService";

import styles from "./Workspace.module.css";


/* =========================================================
   ZYRIONOS WORKSPACE
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

const BUILDER_ACTIONS = [
  {
    id: "build",
    label: "Build",
    description: "Generate a new implementation.",
  },
  {
    id: "review",
    label: "Review / Fix",
    description: "Inspect and improve the project.",
  },
  {
    id: "deploy",
    label: "Deploy",
    description: "Publish the selected project.",
  },
];


/* =========================================================
   RESPONSE NORMALIZATION
========================================================= */

function unwrapApiResponse(response) {
  if (
    response === undefined ||
    response === null
  ) {
    return null;
  }

  /*
   * Axios response:
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
   */

  const axiosData =
    response?.data !== undefined
      ? response.data
      : response;

  if (
    axiosData &&
    typeof axiosData === "object" &&
    !Array.isArray(axiosData) &&
    axiosData.data !== undefined
  ) {
    return axiosData.data;
  }

  return axiosData;
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
      !Array.isArray(candidate)
    ) {
      /*
       * Make sure this actually looks like
       * a project instead of an arbitrary wrapper.
       */
      if (
        candidate._id ||
        candidate.id ||
        candidate.projectId ||
        candidate.projectName ||
        candidate.name ||
        Array.isArray(candidate.files)
      ) {
        return candidate;
      }
    }
  }

  return null;
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
    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  if (
    Array.isArray(root)
  ) {
    return root;
  }

  return [];
}


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

    case "not_deployed":
    case "not deployed":
    case "":
    default:
      return "Not deployed";
  }
}


/* =========================================================
   FILE NORMALIZATION
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

    aiResult
      ?.orchestration
      ?.buildResult
      ?.data
      ?.files,

    aiResult
      ?.orchestration
      ?.buildResult
      ?.files,

    aiResult
      ?.orchestration
      ?.buildResult
      ?.data
      ?.data
      ?.files,

    aiResult
      ?.data
      ?.orchestration
      ?.buildResult
      ?.data
      ?.files,

    aiResult
      ?.data
      ?.orchestration
      ?.buildResult
      ?.files,

    aiResult
      ?.data
      ?.orchestration
      ?.buildResult
      ?.data
      ?.data
      ?.files,
  ];

  for (
    const files of possibleCollections
  ) {
    if (
      Array.isArray(files)
    ) {
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
    return String(
      file.content
    );
  }

  if (
    file.code !== undefined &&
    file.code !== null
  ) {
    return String(
      file.code
    );
  }

  return "The backend returned this file without readable content.";
}


function getDeploymentUrl(
  deployment,
  project
) {
  return (
    deployment?.liveUrl ||
    deployment?.url ||
    deployment?.deploymentUrl ||
    project?.liveUrl ||
    project?.deploymentUrl ||
    ""
  );
}


/* =========================================================
   ERROR HANDLING
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
  if (
    typeof item === "string"
  ) {
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


function extractBackendActivity(
  result
) {
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

    result
      ?.orchestration
      ?.buildResult
      ?.activity,

    result
      ?.orchestration
      ?.buildResult
      ?.logs,

    result
      ?.orchestration
      ?.buildResult
      ?.events,

    result
      ?.data
      ?.orchestration
      ?.activity,

    result
      ?.data
      ?.orchestration
      ?.logs,

    result
      ?.data
      ?.orchestration
      ?.events,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate
        .map(
          normalizeActivityItem
        )
        .filter(Boolean);
    }
  }

  return [];
}


/* =========================================================
   OPERATION LABELS
========================================================= */

function getOperationTitle(
  operation
) {
  switch (operation) {
    case "build":
      return "Building project";

    case "change":
      return "Applying project change";

    case "review":
      return "Reviewing project";

    case "deploy":
      return "Deploying project";

    default:
      return "Workspace ready";
  }
}


function getOperationDescription(
  operation
) {
  switch (operation) {
    case "build":
      return "Your request has been submitted to the connected AI backend.";

    case "change":
      return "The connected AI backend is processing the requested change.";

    case "review":
      return "The connected AI backend is reviewing the selected project.";

    case "deploy":
      return "The deployment request is being processed by the backend.";

    default:
      return "Ready for the next operation.";
  }
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
     BUILDER STATE
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

  const [
    aiResponse,
    setAiResponse,
  ] = useState("");

  const [
    generatedFiles,
    setGeneratedFiles,
  ] = useState([]);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);


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
     UI STATE
  ======================================================= */

  const [
    activeTab,
    setActiveTab,
  ] = useState("preview");

  const [
    mobilePanel,
    setMobilePanel,
  ] = useState("builder");

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

  const [
    previewFullscreen,
    setPreviewFullscreen,
  ] = useState(false);


  /* =======================================================
     REFS
  ======================================================= */

  const initialLoadStarted =
    useRef(false);

  const mountedRef =
    useRef(false);

  const previewRef =
    useRef(null);


  /* =======================================================
     DERIVED STATE
  ======================================================= */

  const projectName =
    getProjectName(
      selectedProject
    );

  const projectCount =
    projects.length;

  const selectedProjectId =
    getProjectId(
      selectedProject
    );

  const filePreview =
    useMemo(
      () =>
        getFileContent(
          selectedFile
        ),
      [
        selectedFile,
      ]
    );

  const deploymentIsLive =
    deploymentStatus === "Deployed";

  const operationRunning =
    operation !== "idle";

  const operationTitle =
    getOperationTitle(
      operation
    );

  const operationDescription =
    getOperationDescription(
      operation
    );


  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {

    if (
      !operationStartedAt
    ) {
      setElapsedSeconds(0);

      return undefined;
    }

    const updateTimer =
      () => {

        const seconds =
          Math.max(
            0,
            Math.floor(
              (
                Date.now() -
                operationStartedAt
              ) / 1000
            )
          );

        setElapsedSeconds(
          seconds
        );
      };

    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );

  }, [
    operationStartedAt,
  ]);


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
     FULLSCREEN
  ======================================================= */

  useEffect(() => {

    const handleFullscreenChange =
      () => {

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
     ACTIVITY HELPERS
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
            ].slice(-40)
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
            ].slice(-40)
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

        setOperation(
          type
        );

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

        setOperation(
          "idle"
        );

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
          files.length > 0
            ? files[0]
            : null
        );

        setDeploymentStatus(
          normalizeDeploymentStatus(
            project?.deploymentStatus ||
            project?.status
          )
        );

        setLiveUrl(
          getDeploymentUrl(
            project,
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

          setProjectLoading(
            true
          );

          const response =
            await getProjects();

          const normalized =
            normalizeProjects(
              response
            );

          setProjects(
            normalized
          );


          /* -----------------------------------------------
             PREFERRED PROJECT
          ------------------------------------------------ */

          if (
            preferredProjectId
          ) {

            const preferred =
              normalized.find(
                project =>
                  String(
                    getProjectId(
                      project
                    )
                  ) ===
                  String(
                    preferredProjectId
                  )
              );

            if (
              preferred
            ) {

              applySelectedProject(
                preferred
              );

              return normalized;
            }
          }


          /* -----------------------------------------------
             CURRENT PROJECT
          ------------------------------------------------ */

          const currentId =
            getProjectId(
              selectedProjectRef.current
            );

          if (
            currentId
          ) {

            const current =
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

            if (
              current
            ) {

              applySelectedProject(
                current
              );

              return normalized;
            }
          }


          /* -----------------------------------------------
             FIRST PROJECT
          ------------------------------------------------ */

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

            setLiveUrl(
              ""
            );
          }

          return normalized;

        } catch (err) {

          console.error(
            "Workspace project loading error:",
            err
          );

          setProjects(
            []
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
     SELECT PROJECT
  ======================================================= */

  const handleSelectProject =
    useCallback(
      project => {

        setError("");
        setNotice("");
        setAiResponse("");

        setActivityLog([]);

        setActiveTab(
          "preview"
        );

        setMobilePanel(
          "builder"
        );

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

        setSelectedProject(
          null
        );

        setAiResponse(
          ""
        );

        setGeneratedFiles(
          []
        );

        setSelectedFile(
          null
        );

        setPrompt(
          ""
        );

        setLiveUrl(
          ""
        );

        setDeploymentStatus(
          "Not deployed"
        );

        setActiveTab(
          "preview"
        );

        setMobilePanel(
          "builder"
        );

        setError(
          ""
        );

        setNotice(
          ""
        );

        setActivityLog([]);

        setOperation(
          "idle"
        );

        setOperationStartedAt(
          null
        );
      },
      []
    );


  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  function handleQuickPrompt(
    quickPrompt
  ) {

    setPrompt(
      quickPrompt
    );

    setError("");
    setNotice("");

    setMobilePanel(
      "builder"
    );
  }


  /* =======================================================
     BUILD NEW PROJECT
  ======================================================= */

  async function handleGenerate() {

    const userPrompt =
      prompt.trim();

    if (!userPrompt) {

      setError(
        "Describe what you want to build first."
      );

      return;
    }

    if (loading) {
      return;
    }

    try {

      setError("");
      setNotice("");
      setLoading(true);

      startOperation(
        "build",
        "Build request submitted to the connected AI backend."
      );

      setActiveTab(
        "preview"
      );


      /* -----------------------------------------------
         AI GENERATION
      ------------------------------------------------ */

      const aiResult =
        await generateCode(
          userPrompt,
          framework
        );

      addActivity(
        "AI backend response received.",
        "success"
      );

      addBackendActivity(
        aiResult
      );


      const formattedResponse =
        normalizeAIResponse(
          aiResult
        );

      setAiResponse(
        formattedResponse
      );


      /* -----------------------------------------------
         EXTRACT FILES
      ------------------------------------------------ */

      const filesFromAI =
        getGeneratedFiles(
          aiResult
        );

      if (
        filesFromAI.length === 0
      ) {

        throw new Error(
          "AI generation completed, but the backend returned no project files."
        );
      }

      addActivity(
        `${filesFromAI.length} generated project files received.`,
        "success"
      );


      /* -----------------------------------------------
         CREATE PROJECT
      ------------------------------------------------ */

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
        "Project creation request completed.",
        "success"
      );


      /* -----------------------------------------------
         CORRECT RESPONSE EXTRACTION
      ------------------------------------------------ */

      let createdProject =
        extractProjectFromResponse(
          projectResponse
        );


      /*
       * Some backends may return only the
       * created project data.
       *
       * In that case use the response
       * directly if it looks like a project.
       */

      if (
        !createdProject
      ) {

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


      /* -----------------------------------------------
         FILE FALLBACK
      ------------------------------------------------ */

      const savedFiles =
        normalizeProjectFiles(
          createdProject,
          null
        );

      const files =
        savedFiles.length > 0
          ? savedFiles
          : filesFromAI;


      /* -----------------------------------------------
         APPLY CREATED PROJECT
      ------------------------------------------------ */

      if (
        createdProject
      ) {

        const projectWithFiles = {
          ...createdProject,
          files,
        };

        applySelectedProject(
          projectWithFiles
        );

        addActivity(
          `Project state applied with ${files.length} files.`,
          "success"
        );

      } else {

        /*
         * If the create endpoint did not return
         * the project object, reload the backend.
         */
        await loadProjects();

        addActivity(
          "Workspace refreshed from the backend.",
          "success"
        );
      }


      /* -----------------------------------------------
         GET CREATED ID
      ------------------------------------------------ */

      const createdId =
        getProjectId(
          createdProject
        );

      if (
        createdId
      ) {

        await loadProjects(
          createdId
        );
      }


      setPrompt("");

      setActiveTab(
        "code"
      );

      setMobilePanel(
        "builder"
      );


      setNotice(
        createdProject
          ? `Project created successfully with ${files.length} real files.`
          : "Build completed. Workspace was refreshed from the backend."
      );


      finishOperation(
        true,
        "Build operation completed successfully."
      );

    } catch (err) {

      console.error(
        "Workspace generation error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to generate the project right now."
        )
      );

      finishOperation(
        false,
        "Build operation failed."
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  /* =======================================================
     BUILD CHANGE
  ======================================================= */

  async function handleBuildChange() {

    if (
      !selectedProjectId
    ) {

      setError(
        "Select a project before building a change."
      );

      return;
    }

    const changePrompt =
      prompt.trim();

    if (!changePrompt) {

      setError(
        "Describe the change you want to build."
      );

      return;
    }

    if (loading) {
      return;
    }

    try {

      setError("");
      setNotice("");
      setLoading(true);

      startOperation(
        "change",
        "Project change request submitted to the connected AI backend."
      );


      const instruction = [
        "Update the current project.",
        "",
        `Current project ID: ${selectedProjectId}`,
        `Current project name: ${projectName}`,
        `Current framework: ${framework}`,
        "",
        "Requested change:",
        changePrompt,
        "",
        "Return the actual generated project files for the requested implementation.",
      ].join("\n");


      const result =
        await generateCode(
          instruction,
          framework
        );


      addActivity(
        "AI backend response received for the requested change.",
        "success"
      );

      addBackendActivity(
        result
      );


      setAiResponse(
        normalizeAIResponse(
          result
        )
      );


      const files =
        getGeneratedFiles(
          result
        );


      if (
        files.length === 0
      ) {

        throw new Error(
          "The change request completed, but the backend returned no project files."
        );
      }


      addActivity(
        `${files.length} updated project files received.`,
        "success"
      );


      /* -----------------------------------------------
         PERSIST UPDATED FILES
      ------------------------------------------------ */

      const updateResponse =
        await updateProject(
          selectedProjectId,
          {
            files,
          }
        );


      addActivity(
        "Updated files saved to the project backend.",
        "success"
      );


      /* -----------------------------------------------
         USE UPDATED RESPONSE IF AVAILABLE
      ------------------------------------------------ */

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

        const finalFiles =
          returnedFiles.length > 0
            ? returnedFiles
            : files;

        applySelectedProject({
          ...updatedProject,
          files: finalFiles,
        });

      } else {

        /*
         * Backend did not return project data.
         * Reload the authoritative project.
         */
        await loadProjects(
          selectedProjectId
        );
      }


      /*
       * Ensure immediate UI state even if
       * the GET response is delayed.
       */
      setGeneratedFiles(
        files
      );

      setSelectedFile(
        files[0] || null
      );


      setActiveTab(
        "code"
      );

      setPrompt("");


      setNotice(
        `Build Change completed and ${files.length} files were saved to the project.`
      );


      finishOperation(
        true,
        "Build Change operation completed and files were persisted."
      );

    } catch (err) {

      console.error(
        "Workspace build change error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Build Change could not be completed."
        )
      );

      finishOperation(
        false,
        "Build Change operation failed."
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  /* =======================================================
     REVIEW / FIX
  ======================================================= */

  async function handleReviewFix() {

    if (
      !selectedProjectId
    ) {

      setError(
        "Select a project before running Review / Fix."
      );

      return;
    }

    if (loading) {
      return;
    }

    const reviewPrompt =
      prompt.trim();

    const baseInstruction =
      reviewPrompt
        ? [
            "Review the current project.",
            "",
            `Current project ID: ${selectedProjectId}`,
            `Current project name: ${projectName}`,
            "",
            "Requested change:",
            reviewPrompt,
            "",
            "Return actual generated project files when changes are required.",
          ].join("\n")
        : [
            "Review the current project for:",
            "- implementation errors",
            "- broken user experience",
            "- responsive issues",
            "- accessibility problems",
            "- unsafe or incomplete implementation",
            "",
            "Return only changes and project files that are actually generated by the connected backend.",
          ].join("\n");


    try {

      setError("");
      setNotice("");
      setLoading(true);

      startOperation(
        "review",
        "Review / Fix request submitted to the connected AI backend."
      );


      const result =
        await generateCode(
          baseInstruction,
          framework
        );


      addActivity(
        "AI backend review response received.",
        "success"
      );

      addBackendActivity(
        result
      );


      setAiResponse(
        normalizeAIResponse(
          result
        )
      );


      const files =
        getGeneratedFiles(
          result
        );


      if (
        files.length > 0
      ) {

        /*
         * Review/Fix is also persisted.
         */
        const updateResponse =
          await updateProject(
            selectedProjectId,
            {
              files,
            }
          );


        addActivity(
          "Reviewed files saved to the project backend.",
          "success"
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
              returnedFiles.length > 0
                ? returnedFiles
                : files,
          });

        } else {

          await loadProjects(
            selectedProjectId
          );
        }


        setGeneratedFiles(
          files
        );

        setSelectedFile(
          files[0]
        );


        addActivity(
          `${files.length} reviewed/generated project files persisted.`,
          "success"
        );


        setNotice(
          `Review completed. ${files.length} real project files were saved.`
        );

      } else {

        setNotice(
          "Review completed. The connected backend did not return replacement project files."
        );
      }


      setActiveTab(
        "code"
      );

      setMobilePanel(
        "builder"
      );


      finishOperation(
        true,
        "Review / Fix operation completed."
      );

    } catch (err) {

      console.error(
        "Workspace review error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Review / Fix could not be completed."
        )
      );

      finishOperation(
        false,
        "Review / Fix operation failed."
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  /* =======================================================
     DEPLOY
  ======================================================= */

  async function handleDeploy() {

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

    if (deploying) {
      return;
    }

    try {

      setError("");
      setNotice("");
      setDeploying(true);

      startOperation(
        "deploy",
        "Deployment request submitted to the connected backend."
      );

      setDeploymentStatus(
        "Deploying..."
      );


      const response =
        await deployProject(
          projectId
        );


      addActivity(
        "Deployment response received.",
        "success"
      );


      const responseData =
        unwrapApiResponse(
          response
        ) || {};


      const deployment =
        responseData?.deployment ||
        responseData?.data?.deployment ||
        {};


      const deployedProject =
        responseData?.project ||
        responseData?.data?.project ||
        (
          responseData?._id
            ? responseData
            : null
        );


      const url =
        getDeploymentUrl(
          deployment,
          deployedProject
        );


      const returnedStatus =
        deployment?.status ||
        deployedProject?.deploymentStatus ||
        deployedProject?.status;


      const finalStatus =
        normalizeDeploymentStatus(
          returnedStatus ||
          (
            url
              ? "deployed"
              : "pending"
          )
        );


      if (
        deployedProject
      ) {

        applySelectedProject(
          deployedProject
        );
      }


      setDeploymentStatus(
        finalStatus
      );

      setLiveUrl(
        url
      );


      setProjects(
        previous =>
          previous.map(
            project => {

              if (
                String(
                  getProjectId(
                    project
                  )
                ) !==
                String(
                  projectId
                )
              ) {
                return project;
              }

              return {
                ...project,
                ...(deployedProject || {}),

                ...(url
                  ? {
                      liveUrl:
                        url,

                      deploymentUrl:
                        url,
                    }
                  : {}),

                deploymentStatus:
                  finalStatus,
              };
            }
          )
      );


      setActiveTab(
        "preview"
      );


      setNotice(
        url
          ? "Deployment completed successfully. Live preview is available."
          : "Deployment request completed. The backend did not return a live URL."
      );


      finishOperation(
        true,
        url
          ? "Deployment completed and a live URL was returned."
          : "Deployment request completed without a live URL."
      );

    } catch (err) {

      console.error(
        "Workspace deployment error:",
        err
      );

      setDeploymentStatus(
        "Deployment failed"
      );

      setError(
        getErrorMessage(
          err,
          "Deployment could not be completed."
        )
      );

      finishOperation(
        false,
        "Deployment operation failed."
      );

    } finally {

      setDeploying(
        false
      );
    }
  }


  /* =======================================================
     FULLSCREEN
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
     SUBSCRIPTION
  ======================================================= */

  function handleSubscription() {

    window.location.assign(
      "/billing"
    );
  }


  /* =======================================================
     PRIMARY ACTION
  ======================================================= */

  function handlePrimaryAction() {

    if (
      selectedProject
    ) {

      handleBuildChange();

      return;
    }

    handleGenerate();
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

      handlePrimaryAction();
    }
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardLayout>

      <main
        className={
          styles.workspace
        }
      >

        {/* HEADER */}

        <header
          className={
            styles.workspaceHeader
          }
        >

          <div
            className={
              styles.projectHeading
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
                styles.headingCopy
              }
            >

              <div
                className={
                  styles.breadcrumb
                }
              >

                <span>
                  WORKSPACE
                </span>

                <b>
                  /
                </b>

                <span>
                  {projectName}
                </span>

              </div>

              <h1>
                {projectName}
              </h1>

              <p>
                Build, review, preview and deploy
                from one professional workspace.
              </p>

            </div>

          </div>


          <div
            className={
              styles.headerStatus
            }
          >

            <span
              className={
                operationRunning
                  ? styles.headerStatusRunning
                  : styles.headerStatusReady
              }
            />

            <span>
              {operationRunning
                ? operationTitle
                : "Workspace ready"}
            </span>

          </div>


          <div
            className={
              styles.headerActions
            }
          >

            <button
              type="button"
              className={
                styles.secondaryAction
              }
              onClick={() =>
                setActiveTab(
                  "preview"
                )
              }
            >
              Preview
            </button>


            <button
              type="button"
              className={
                styles.secondaryAction
              }
              onClick={() =>
                setActiveTab(
                  "code"
                )
              }
            >
              Code
            </button>


            <button
              type="button"
              className={
                styles.subscriptionAction
              }
              onClick={
                handleSubscription
              }
            >
              <span>
                ✦
              </span>

              <strong>
                Build Your Future
              </strong>
            </button>


            <button
              type="button"
              className={
                styles.deployAction
              }
              onClick={
                handleDeploy
              }
              disabled={
                deploying ||
                !selectedProjectId
              }
            >
              {deploying
                ? "Deploying..."
                : "Deploy"}
            </button>

          </div>

        </header>


        {/* MOBILE NAV */}

        <nav
          className={
            styles.mobileWorkspaceNav
          }
          aria-label="Workspace panels"
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
              mobilePanel === "builder"
                ? styles.mobileNavActive
                : ""
            }
            onClick={() =>
              setMobilePanel(
                "builder"
              )
            }
          >
            Workspace
          </button>

          <button
            type="button"
            className={
              mobilePanel === "inspector"
                ? styles.mobileNavActive
                : ""
            }
            onClick={() =>
              setMobilePanel(
                "inspector"
              )
            }
          >
            Activity
          </button>

        </nav>


        {/* ALERTS */}

        {error && (
          <div
            className={
              styles.errorBanner
            }
            role="alert"
          >

            <div
              className={
                styles.alertIcon
              }
            >
              !
            </div>

            <div
              className={
                styles.alertContent
              }
            >

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
              aria-label="Dismiss error"
            >
              ×
            </button>

          </div>
        )}


        {notice && !error && (
          <div
            className={
              styles.noticeBanner
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
              aria-label="Dismiss notice"
            >
              ×
            </button>

          </div>
        )}


        {/* MAIN IDE */}

        <section
          className={
            styles.workspaceBody
          }
        >

          {/* PROJECT SIDEBAR */}

          <aside
            className={`
              ${styles.projectRail}
              ${
                mobilePanel === "projects"
                  ? styles.mobilePanelVisible
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

                <strong>
                  {projectCount}
                </strong>

              </div>

              <button
                type="button"
                onClick={
                  handleNewProject
                }
                className={
                  styles.createProjectButton
                }
              >
                + New
              </button>

            </div>


            <button
              type="button"
              className={
                styles.createProjectCard
              }
              onClick={
                handleNewProject
              }
            >

              <span
                className={
                  styles.createProjectIcon
                }
              >
                +
              </span>

              <span>

                <strong>
                  Create a Project
                </strong>

                <small>
                  Start from an idea
                </small>

              </span>

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

                  <span />
                  <span />
                  <span />

                  <small>
                    Loading projects...
                  </small>

                </div>

              ) : projects.length === 0 ? (

                <div
                  className={
                    styles.noProjects
                  }
                >

                  <div>
                    ◇
                  </div>

                  <strong>
                    No projects yet
                  </strong>

                  <p>
                    Projects created through the
                    backend will appear here.
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

                    const name =
                      getProjectName(
                        project
                      );

                    const id =
                      getProjectId(
                        project
                      );

                    const frameworkName =
                      getProjectFramework(
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
                          `${name}-${frameworkName}`
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
                            styles.projectIcon
                          }
                        >
                          {name
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span
                          className={
                            styles.projectItemText
                          }
                        >

                          <strong>
                            {name}
                          </strong>

                          <small>
                            {frameworkName}
                          </small>

                        </span>

                        {active && (
                          <span
                            className={
                              styles.activeIndicator
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


          {/* CENTRAL WORKSPACE */}

          <section
            className={`
              ${styles.buildArea}
              ${
                mobilePanel === "builder"
                  ? styles.mobilePanelVisible
                  : ""
              }
            `}
          >

            <div
              className={
                styles.buildToolbar
              }
            >

              <div
                className={
                  styles.buildMode
                }
              >

                <span
                  className={
                    operationRunning
                      ? styles.liveDotRunning
                      : styles.liveDot
                  }
                />

                <div>

                  <strong>
                    ZyrionOS AI
                  </strong>

                  <small>
                    {operationRunning
                      ? operationTitle
                      : "Ready"}
                  </small>

                </div>

              </div>


              <div
                className={
                  styles.toolbarRight
                }
              >

                <span
                  className={
                    styles.frameworkLabel
                  }
                >
                  Framework
                </span>

                <select
                  value={
                    framework
                  }
                  onChange={event =>
                    setFramework(
                      event.target.value
                    )
                  }
                  className={
                    styles.frameworkSelect
                  }
                  disabled={
                    loading
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

              </div>

            </div>


            {operationRunning && (
              <div
                className={
                  styles.operationBar
                }
              >

                <div
                  className={
                    styles.operationPulse
                  }
                />

                <div
                  className={
                    styles.operationCopy
                  }
                >

                  <strong>
                    {operationTitle}
                  </strong>

                  <span>
                    {operationDescription}
                  </span>

                </div>

                <div
                  className={
                    styles.operationTimer
                  }
                >
                  {elapsedSeconds}s
                </div>

              </div>
            )}


            <div
              className={
                styles.canvas
              }
            >

              {!aiResponse &&
              !loading ? (

                <div
                  className={
                    styles.emptyWorkspace
                  }
                >

                  <div
                    className={
                      styles.aiOrb
                    }
                  >
                    Z
                  </div>

                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    ZYRIONOS AI COMMAND CENTER
                  </span>

                  <h2>
                    What do you want to build?
                  </h2>

                  <p>
                    Describe an application,
                    automation, feature or
                    business system. Your request
                    is sent through the connected
                    project backend.
                  </p>

                  <div
                    className={
                      styles.quickPrompts
                    }
                  >

                    {QUICK_PROMPTS.map(
                      item => (
                        <button
                          key={
                            item.prompt
                          }
                          type="button"
                          onClick={() =>
                            handleQuickPrompt(
                              item.prompt
                            )
                          }
                        >

                          <span>
                            +
                          </span>

                          {item.label}

                        </button>
                      )
                    )}

                  </div>

                </div>

              ) : loading ? (

                <div
                  className={
                    styles.buildingState
                  }
                >

                  <div
                    className={
                      styles.loadingOrb
                    }
                  >
                    Z
                  </div>

                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    ZYRIONOS AI
                  </span>

                  <h2>
                    {operationTitle}
                  </h2>

                  <p>
                    {operationDescription}
                  </p>

                  <div
                    className={
                      styles.indeterminateProgress
                    }
                  >
                    <span />
                  </div>

                  <div
                    className={
                      styles.processingStatus
                    }
                  >

                    <span
                      className={
                        styles.processingSpinner
                      }
                    />

                    <span>
                      Waiting for the connected
                      backend response
                    </span>

                    <strong>
                      {elapsedSeconds}s
                    </strong>

                  </div>

                </div>

              ) : (

                <div
                  className={
                    styles.resultArea
                  }
                >

                  <div
                    className={
                      styles.resultHeader
                    }
                  >

                    <div>

                      <span>
                        PROJECT WORKSPACE
                      </span>

                      <h2>
                        {selectedProject
                          ? projectName
                          : "Build result"}
                      </h2>

                    </div>

                    <div
                      className={
                        deploymentIsLive
                          ? styles.liveBadge
                          : styles.readyBadge
                      }
                    >

                      <i />

                      {deploymentIsLive
                        ? "Live"
                        : "Ready"}

                    </div>

                  </div>


                  <div
                    className={
                      styles.resultTabs
                    }
                  >

                    <button
                      type="button"
                      className={
                        activeTab === "preview"
                          ? styles.resultTabActive
                          : ""
                      }
                      onClick={() =>
                        setActiveTab(
                          "preview"
                        )
                      }
                    >
                      Preview
                    </button>

                    <button
                      type="button"
                      className={
                        activeTab === "code"
                          ? styles.resultTabActive
                          : ""
                      }
                      onClick={() =>
                        setActiveTab(
                          "code"
                        )
                      }
                    >
                      Code
                      <span>
                        {generatedFiles.length}
                      </span>
                    </button>

                  </div>


                  <div
                    className={
                      styles.resultContent
                    }
                  >

                    {activeTab === "preview" && (

                      <div
                        ref={
                          previewRef
                        }
                        className={
                          previewFullscreen
                            ? `${styles.previewPanel} ${styles.previewFullscreen}`
                            : styles.previewPanel
                        }
                      >

                        <div
                          className={
                            styles.previewTop
                          }
                        >

                          <div
                            className={
                              styles.previewWindowDots
                            }
                          >
                            <span />
                            <span />
                            <span />
                          </div>

                          <strong>
                            Project Preview
                          </strong>

                          <span
                            className={
                              styles.previewUrl
                            }
                          >
                            {liveUrl ||
                              "Not deployed"}
                          </span>

                          <span
                            className={
                              deploymentIsLive
                                ? styles.previewLiveState
                                : styles.previewWaitingState
                            }
                          >
                            {deploymentIsLive
                              ? "Live"
                              : "Awaiting deployment"}
                          </span>

                          {liveUrl && (
                            <button
                              type="button"
                              className={
                                styles.previewFullscreenButton
                              }
                              onClick={
                                handlePreviewFullscreen
                              }
                            >
                              {previewFullscreen
                                ? "Exit Fullscreen"
                                : "Fullscreen"}
                            </button>
                          )}

                        </div>


                        <div
                          className={
                            styles.previewBody
                          }
                        >

                          {liveUrl ? (

                            <iframe
                              title={
                                `${projectName} preview`
                              }
                              src={
                                liveUrl
                              }
                              className={
                                styles.previewFrame
                              }
                              allow="fullscreen"
                            />

                          ) : (

                            <div
                              className={
                                styles.previewPlaceholder
                              }
                            >

                              <div
                                className={
                                  styles.previewPlaceholderIcon
                                }
                              >
                                ◇
                              </div>

                              <strong>
                                Live preview is not
                                available yet
                              </strong>

                              <p>
                                Deploy the selected
                                project to receive a
                                live application URL.
                              </p>

                              <button
                                type="button"
                                onClick={
                                  handleDeploy
                                }
                                disabled={
                                  deploying ||
                                  !selectedProjectId
                                }
                              >
                                {deploying
                                  ? "Deploying..."
                                  : "Deploy Project"}
                              </button>

                            </div>

                          )}

                        </div>

                      </div>
                    )}


                    {activeTab === "code" && (

                      <div
                        className={
                          styles.codePanel
                        }
                      >

                        <div
                          className={
                            styles.codeHeader
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

                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab(
                                "preview"
                              )
                            }
                          >
                            Preview
                          </button>

                        </div>


                        <div
                          className={
                            styles.codeLayout
                          }
                        >

                          <div
                            className={
                              styles.fileExplorer
                            }
                          >

                            {generatedFiles.length ===
                            0 ? (

                              <div
                                className={
                                  styles.noFiles
                                }
                              >

                                <span>
                                  ◇
                                </span>

                                <strong>
                                  No files available
                                </strong>

                                <small>
                                  The backend has not
                                  returned project files.
                                </small>

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
                                      className={`
                                        ${styles.file}
                                        ${
                                          active
                                            ? styles.fileActive
                                            : ""
                                        }
                                      `}
                                      onClick={() =>
                                        setSelectedFile(
                                          file
                                        )
                                      }
                                    >

                                      <span>
                                        ◇
                                      </span>

                                      <span>
                                        {path}
                                      </span>

                                    </button>
                                  );
                                }
                              )
                            )}

                          </div>


                          <div
                            className={
                              styles.editor
                            }
                          >

                            <div
                              className={
                                styles.editorHeader
                              }
                            >

                              <span>
                                {selectedFile
                                  ? getFilePath(
                                      selectedFile
                                    )
                                  : "No file selected"}
                              </span>

                              <small>
                                Read-only
                              </small>

                            </div>

                            <pre>
                              {filePreview}
                            </pre>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>


            {/* COMMAND AREA */}

            <div
              className={
                styles.commandArea
              }
            >

              <div
                className={
                  styles.commandBox
                }
              >

                <div
                  className={
                    styles.commandTop
                  }
                >

                  <span
                    className={
                      styles.commandSpark
                    }
                  >
                    ✦
                  </span>

                  <span>
                    {selectedProject
                      ? "ZyrionOS AI · Improve your project"
                      : "ZyrionOS AI · Build your idea"}
                  </span>

                  <span
                    className={
                      styles.commandState
                    }
                  >
                    {loading
                      ? "Processing"
                      : "Ready"}
                  </span>

                </div>


                <textarea
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
                  placeholder={
                    selectedProject
                      ? "Describe a change or feature you want to build..."
                      : "Describe the application, product or system you want to build..."
                  }
                  disabled={
                    loading
                  }
                  rows={3}
                  aria-label={
                    selectedProject
                      ? "Describe a project change"
                      : "Describe what you want to build"
                  }
                />


                <div
                  className={
                    styles.commandFooter
                  }
                >

                  <div
                    className={
                      styles.commandHints
                    }
                  >

                    <span>
                      Enter
                    </span>

                    <b>
                      to run
                    </b>

                    <span>
                      Shift + Enter
                    </span>

                    <b>
                      for new line
                    </b>

                  </div>


                  <div
                    className={
                      styles.commandActions
                    }
                  >

                    {selectedProject && (
                      <button
                        type="button"
                        className={
                          styles.reviewAction
                        }
                        onClick={
                          handleReviewFix
                        }
                        disabled={
                          loading ||
                          !selectedProjectId
                        }
                      >
                        Review / Fix
                      </button>
                    )}


                    <button
                      type="button"
                      onClick={
                        handlePrimaryAction
                      }
                      disabled={
                        loading ||
                        !prompt.trim()
                      }
                      className={
                        styles.generateAction
                      }
                    >

                      {loading
                        ? "Working..."
                        : selectedProject
                        ? "Build Change"
                        : "Build"}

                      <span>
                        ↑
                      </span>

                    </button>

                  </div>

                </div>

              </div>


              {/* ACTION STRIP */}

              <div
                className={
                  styles.builderActions
                }
              >

                {BUILDER_ACTIONS.map(
                  action => {

                    const isDeploy =
                      action.id ===
                      "deploy";

                    const isReview =
                      action.id ===
                      "review";

                    return (
                      <button
                        key={
                          action.id
                        }
                        type="button"
                        className={
                          styles.builderAction
                        }
                        onClick={
                          isDeploy
                            ? handleDeploy
                            : isReview
                            ? handleReviewFix
                            : selectedProject
                            ? handleBuildChange
                            : handleGenerate
                        }
                        disabled={
                          loading ||
                          deploying ||
                          (
                            (
                              isDeploy ||
                              isReview
                            ) &&
                            !selectedProjectId
                          )
                        }
                      >

                        <span
                          className={
                            styles.builderActionIcon
                          }
                        >
                          {isDeploy
                            ? "↗"
                            : isReview
                            ? "✓"
                            : "✦"}
                        </span>

                        <span>

                          <strong>
                            {action.label}
                          </strong>

                          <small>
                            {action.description}
                          </small>

                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </div>

          </section>


          {/* INSPECTOR */}

          <aside
            className={`
              ${styles.inspector}
              ${
                mobilePanel === "inspector"
                  ? styles.mobilePanelVisible
                  : ""
              }
            `}
          >

            <div
              className={
                styles.inspectorHeader
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

              <span
                className={
                  operationRunning
                    ? styles.inspectorRunning
                    : styles.inspectorReady
                }
              >
                {operationRunning
                  ? "Running"
                  : "Ready"}
              </span>

            </div>


            <div
              className={
                styles.inspectorContent
              }
            >

              <div
                className={
                  styles.operationCard
                }
              >

                <div
                  className={
                    styles.operationCardTop
                  }
                >

                  <span>
                    CURRENT OPERATION
                  </span>

                  <i
                    className={
                      operationRunning
                        ? styles.statusRunning
                        : styles.statusReady
                    }
                  />

                </div>

                <strong>
                  {operationRunning
                    ? operationTitle
                    : "Workspace ready"}
                </strong>

                <p>
                  {operationRunning
                    ? operationDescription
                    : "No operation is currently running."}
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
                  styles.inspectorCard
                }
              >

                <span
                  className={
                    styles.cardLabel
                  }
                >
                  PROJECT
                </span>

                <strong>
                  {projectName}
                </strong>

                <small>
                  {getProjectFramework(
                    selectedProject
                  )}
                </small>

              </div>


              <div
                className={
                  styles.inspectorCard
                }
              >

                <span
                  className={
                    styles.cardLabel
                  }
                >
                  PROJECT FILES
                </span>

                <strong>
                  {generatedFiles.length}
                </strong>

                <small>
                  Real files returned by the
                  connected backend.
                </small>

              </div>


              <div
                className={
                  styles.inspectorCard
                }
              >

                <span
                  className={
                    styles.cardLabel
                  }
                >
                  DEPLOYMENT
                </span>

                <div
                  className={
                    deploymentIsLive
                      ? styles.statusSuccess
                      : deploymentStatus ===
                        "Deployment failed"
                      ? styles.statusError
                      : styles.statusPending
                  }
                >

                  <i />

                  {deploymentStatus}

                </div>

              </div>


              <div
                className={
                  styles.activityCard
                }
              >

                <div
                  className={
                    styles.activityHeader
                  }
                >

                  <span>
                    ACTIVITY
                  </span>

                  <strong>
                    {activityLog.length}
                  </strong>

                </div>


                {activityLog.length === 0 ? (

                  <div
                    className={
                      styles.activityEmpty
                    }
                  >
                    Waiting for the next
                    workspace operation.
                  </div>

                ) : (

                  <div
                    className={
                      styles.activityList
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

                            <span
                              className={
                                item.type ===
                                "success"
                                  ? styles.activitySuccess
                                  : item.type ===
                                    "error"
                                  ? styles.activityError
                                  : item.type ===
                                    "warning"
                                  ? styles.activityWarning
                                  : item.type ===
                                    "active"
                                  ? styles.activityActive
                                  : styles.activityInfo
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


              {liveUrl && (

                <div
                  className={
                    styles.liveCard
                  }
                >

                  <span>
                    LIVE APPLICATION
                  </span>

                  <strong>
                    Deployment available
                  </strong>

                  <div
                    className={
                      styles.liveCardActions
                    }
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "preview"
                        )
                      }
                    >
                      Open Preview
                    </button>

                    <a
                      href={
                        liveUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      New tab →
                    </a>

                  </div>

                </div>
              )}


              <button
                type="button"
                className={
                  styles.inspectorSubscription
                }
                onClick={
                  handleSubscription
                }
              >

                <span
                  className={
                    styles.subscriptionIcon
                  }
                >
                  ✦
                </span>

                <span>

                  <strong>
                    Build Your Future
                  </strong>

                  <small>
                    Manage subscription
                  </small>

                </span>

                <b>
                  →
                </b>

              </button>

            </div>


            <button
              type="button"
              className={
                styles.inspectorDeploy
              }
              disabled={
                deploying ||
                !selectedProjectId
              }
              onClick={
                handleDeploy
              }
            >

              {deploying
                ? "Deploying..."
                : "Deploy Project"}

            </button>

          </aside>

        </section>

      </main>

    </DashboardLayout>
  );
}


export default Workspace;
