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
  deployProject,
} from "../../../services/workspaceService";

import { generateCode } from "../../../services/aiService";

import styles from "./Workspace.module.css";

/* =========================================================
   ZYRIONOS WORKSPACE
   Enterprise AI Development Workspace
   ---------------------------------------------------------
   Rules:
   - Backend is the source of truth.
   - No fabricated project/file/deployment data.
   - AI response is displayed only when returned.
   - Project state is refreshed after mutations.
   - UI state never pretends a backend operation succeeded.
   ========================================================= */


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
    label: "Build an AI SaaS dashboard",
    prompt:
      "Build an AI SaaS dashboard",
  },
  {
    label: "Create a production landing page",
    prompt:
      "Create a production-ready landing page",
  },
  {
    label: "Add authentication",
    prompt:
      "Add authentication and user accounts",
  },
  {
    label: "Build an admin control center",
    prompt:
      "Build an admin control center",
  },
];

const PANEL_NAMES = {
  projects: "Projects",
  builder: "Builder",
  inspector: "Inspector",
};


/* =========================================================
   HELPERS
   ========================================================= */

function getProjectId(project) {
  return (
    project?._id ||
    project?.id ||
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
    ""
  );
}


function getDeploymentStatus(project) {
  return (
    project?.deploymentStatus ||
    project?.deployment?.status ||
    project?.status ||
    ""
  );
}


function normalizeStatus(status) {
  const value = String(
    status || ""
  )
    .trim()
    .toLowerCase();

  switch (value) {
    case "deployed":
      return {
        label: "Deployed",
        tone: "success",
      };

    case "deploying":
      return {
        label: "Deploying",
        tone: "progress",
      };

    case "building":
      return {
        label: "Building",
        tone: "progress",
      };

    case "pending":
      return {
        label: "Pending",
        tone: "warning",
      };

    case "failed":
      return {
        label: "Failed",
        tone: "danger",
      };

    case "active":
      return {
        label: "Active",
        tone: "success",
      };

    case "not_deployed":
      return {
        label: "Not deployed",
        tone: "neutral",
      };

    default:
      return {
        label:
          status
            ? String(status)
            : "Unavailable",
        tone: status
          ? "neutral"
          : "muted",
      };
  }
}


function getLiveUrl(project) {
  return (
    project?.liveUrl ||
    project?.deploymentUrl ||
    project?.deployment?.liveUrl ||
    project?.deployment?.url ||
    ""
  );
}


function getProjectFiles(project) {
  if (
    Array.isArray(project?.files)
  ) {
    return project.files;
  }

  if (
    Array.isArray(
      project?.projectFiles
    )
  ) {
    return project.projectFiles;
  }

  return [];
}


function getAIResponse(result) {
  if (
    result === null ||
    result === undefined
  ) {
    return "";
  }

  if (typeof result === "string") {
    return result;
  }

  const candidates = [
    result?.message,
    result?.response,
    result?.content,
    result?.output,
    result?.text,
    result?.data?.message,
    result?.data?.response,
    result?.data?.content,
    result?.data?.output,
    result?.data?.text,
  ];

  const value =
    candidates.find(
      (item) =>
        typeof item === "string" &&
        item.trim()
    );

  if (value) {
    return value;
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


function getReturnedFiles(result) {
  const candidates = [
    result?.files,
    result?.data?.files,
    result?.project?.files,
    result?.data?.project?.files,
  ];

  return (
    candidates.find(
      Array.isArray
    ) || []
  );
}


function getFilePath(file) {
  return (
    file?.path ||
    file?.filePath ||
    file?.name ||
    file?._id ||
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


function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.message ||
    fallback
  );
}


function normalizeProjects(response) {
  const data =
    response?.data ?? response;

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  if (
    Array.isArray(
      data?.projects
    )
  ) {
    return data.projects;
  }

  if (
    Array.isArray(
      data?.data?.projects
    )
  ) {
    return data.data.projects;
  }

  return [];
}


function extractProject(response) {
  const data =
    response?.data ?? response;

  return (
    data?.project ||
    data?.data?.project ||
    null
  );
}


/* =========================================================
   COMPONENT
   ========================================================= */

function Workspace() {
  /* =======================================================
     REFS
     ======================================================= */

  const commandInputRef =
    useRef(null);


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

  const [
    projectLoading,
    setProjectLoading,
  ] = useState(true);


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
    aiResponse,
    setAIResponse,
  ] = useState("");

  const [
    generatedFiles,
    setGeneratedFiles,
  ] = useState([]);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    deploying,
    setDeploying,
  ] = useState(false);


  /* =======================================================
     UI STATE
     ======================================================= */

  const [
    activeView,
    setActiveView,
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


  /* =======================================================
     DERIVED STATE
     ======================================================= */

  const projectName =
    getProjectName(
      selectedProject
    );

  const projectFramework =
    getProjectFramework(
      selectedProject
    ) || framework;

  const liveUrl =
    getLiveUrl(
      selectedProject
    );

  const deployment =
    normalizeStatus(
      getDeploymentStatus(
        selectedProject
      )
    );

  const selectedFileContent =
    useMemo(
      () =>
        getFileContent(
          selectedFile
        ),
      [selectedFile]
    );


  /* =======================================================
     APPLY PROJECT
     ======================================================= */

  const applyProject =
    useCallback(
      (project) => {
        if (!project) {
          setSelectedProject(
            null
          );

          setGeneratedFiles(
            []
          );

          setSelectedFile(
            null
          );

          return;
        }

        setSelectedProject(
          project
        );

        const files =
          getProjectFiles(
            project
          );

        setGeneratedFiles(
          files
        );

        setSelectedFile(
          (previous) => {
            if (!files.length) {
              return null;
            }

            const previousPath =
              previous
                ? getFilePath(
                    previous
                  )
                : "";

            return (
              files.find(
                (file) =>
                  getFilePath(
                    file
                  ) ===
                  previousPath
              ) ||
              files[0]
            );
          }
        );

        const projectFramework =
          getProjectFramework(
            project
          );

        if (
          projectFramework &&
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
          setError("");

          const response =
            await getProjects();

          const nextProjects =
            normalizeProjects(
              response
            );

          setProjects(
            nextProjects
          );

          if (
            !nextProjects.length
          ) {
            setSelectedProject(
              null
            );

            setGeneratedFiles(
              []
            );

            setSelectedFile(
              null
            );

            return nextProjects;
          }

          let nextProject =
            null;

          if (
            preferredProjectId
          ) {
            nextProject =
              nextProjects.find(
                (project) =>
                  String(
                    getProjectId(
                      project
                    )
                  ) ===
                  String(
                    preferredProjectId
                  )
              ) || null;
          }

          if (!nextProject) {
            const currentId =
              getProjectId(
                selectedProject
              );

            if (currentId) {
              nextProject =
                nextProjects.find(
                  (project) =>
                    String(
                      getProjectId(
                        project
                      )
                    ) ===
                    String(
                      currentId
                    )
                ) || null;
            }
          }

          if (!nextProject) {
            nextProject =
              nextProjects[0];
          }

          applyProject(
            nextProject
          );

          return nextProjects;
        } catch (err) {
          console.error(
            "Workspace load error:",
            err
          );

          setProjects(
            []
          );

          setSelectedProject(
            null
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
        applyProject,
        selectedProject,
      ]
    );


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);


  /* =======================================================
     PROJECT SELECTION
     ======================================================= */

  function handleSelectProject(
    project
  ) {
    setError("");
    setNotice("");
    setAIResponse("");
    setActiveView("preview");
    setMobilePanel("builder");

    applyProject(
      project
    );
  }


  /* =======================================================
     NEW PROJECT
     ======================================================= */

  function handleNewProject() {
    setSelectedProject(
      null
    );

    setGeneratedFiles(
      []
    );

    setSelectedFile(
      null
    );

    setAIResponse(
      ""
    );

    setPrompt(
      ""
    );

    setActiveView(
      "preview"
    );

    setMobilePanel(
      "builder"
    );

    setError("");
    setNotice("");

    requestAnimationFrame(
      () => {
        commandInputRef.current?.focus();
      }
    );
  }


  /* =======================================================
     QUICK PROMPT
     ======================================================= */

  function handleQuickPrompt(
    value
  ) {
    setPrompt(
      value
    );

    setError("");
    setNotice("");

    requestAnimationFrame(
      () => {
        commandInputRef.current?.focus();
      }
    );
  }


  /* =======================================================
     BUILD / CREATE PROJECT
     ======================================================= */

  async function handleBuild() {
    const userPrompt =
      prompt.trim();

    if (!userPrompt) {
      setError(
        "Describe what you want to build first."
      );

      commandInputRef.current?.focus();

      return;
    }

    try {
      setError("");
      setNotice("");
      setLoading(true);
      setAIResponse("");

      /*
       * Step 1:
       * Ask the real AI service.
       */
      const aiResult =
        await generateCode(
          userPrompt,
          framework
        );

      const responseText =
        getAIResponse(
          aiResult
        );

      const returnedFiles =
        getReturnedFiles(
          aiResult
        );

      setAIResponse(
        responseText
      );

      /*
       * Step 2:
       * Create the real backend project.
       *
       * We do NOT manufacture files here.
       */
      const projectResponse =
        await createProject({
          projectName:
            userPrompt.slice(
              0,
              120
            ),

          description:
            userPrompt,

          framework,
        });

      const createdProject =
        extractProject(
          projectResponse
        );

      /*
       * Only files explicitly returned by
       * the backend/AI are allowed into UI.
       */
      if (
        createdProject
      ) {
        const backendFiles =
          getProjectFiles(
            createdProject
          );

        const realFiles =
          backendFiles.length
            ? backendFiles
            : returnedFiles;

        applyProject({
          ...createdProject,
          ...(realFiles.length
            ? {
                files:
                  realFiles,
              }
            : {}),
        });

        const createdId =
          getProjectId(
            createdProject
          );

        await loadProjects(
          createdId
        );
      } else {
        /*
         * Backend did not return a project object.
         * Refresh to determine whether the creation
         * actually appeared server-side.
         */
        await loadProjects();
      }

      setPrompt("");

      setActiveView(
        returnedFiles.length ||
        getProjectFiles(
          createdProject
        ).length
          ? "code"
          : "preview"
      );

      setMobilePanel(
        "builder"
      );

      setNotice(
        createdProject
          ? "Project created from the backend response."
          : "Build request completed. Workspace state was refreshed from the backend."
      );
    } catch (err) {
      console.error(
        "Workspace build error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "The build request could not be completed."
        )
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
    if (!selectedProject) {
      setError(
        "Select a project before running Review / Fix."
      );

      return;
    }

    const requestedChange =
      prompt.trim();

    const reviewInstruction =
      requestedChange
        ? [
            "Review the current project.",
            "",
            "Requested change:",
            requestedChange,
            "",
            "Return only changes that are supported by the current project context.",
          ].join("\n")
        : [
            "Review the current project for implementation errors, broken UX, responsive issues and obvious problems.",
            "Return the safest improvements supported by the available project context.",
          ].join("\n");

    try {
      setError("");
      setNotice("");
      setLoading(true);
      setAIResponse("");

      const result =
        await generateCode(
          reviewInstruction,
          projectFramework
        );

      const responseText =
        getAIResponse(
          result
        );

      const returnedFiles =
        getReturnedFiles(
          result
        );

      setAIResponse(
        responseText
      );

      /*
       * Important:
       * We display files only if the service actually
       * returned files. We never copy old project files
       * and pretend that AI fixed them.
       */
      if (
        returnedFiles.length
      ) {
        setGeneratedFiles(
          returnedFiles
        );

        setSelectedFile(
          returnedFiles[0]
        );

        setActiveView(
          "code"
        );
      } else {
        setActiveView(
          "preview"
        );
      }

      setNotice(
        returnedFiles.length
          ? "Review completed with files returned by the AI service."
          : "Review completed. The AI service did not return replacement files."
      );

      setPrompt("");
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

    try {
      setError("");
      setNotice("");
      setDeploying(
        true
      );

      const response =
        await deployProject(
          projectId
        );

      /*
       * Never assume a deployment succeeded.
       * The backend response is inspected first.
       */
      const data =
        response?.data ??
        response ??
        {};

      const deployment =
        data?.deployment ||
        data?.data?.deployment ||
        null;

      const backendProject =
        data?.project ||
        data?.data?.project ||
        null;

      if (
        backendProject
      ) {
        applyProject(
          backendProject
        );
      }

      /*
       * Refresh backend state after deployment.
       * This makes backend state authoritative.
       */
      await loadProjects(
        projectId
      );

      const status =
        normalizeStatus(
          backendProject
            ? getDeploymentStatus(
                backendProject
              )
            : deployment?.status
        );

      const returnedUrl =
        getLiveUrl(
          backendProject
        ) ||
        deployment?.liveUrl ||
        deployment?.url ||
        "";

      /*
       * If the backend explicitly reports failure,
       * surface failure instead of saying success.
       */
      if (
        status.tone ===
        "danger"
      ) {
        setError(
          "Deployment was rejected or failed according to the backend."
        );

        return;
      }

      setNotice(
        returnedUrl
          ? "Deployment completed and the latest project state was loaded."
          : "Deployment request completed. No live URL was returned by the backend."
      );

      setActiveView(
        "preview"
      );
    } catch (err) {
      console.error(
        "Workspace deployment error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Deployment could not be completed."
        )
      );
    } finally {
      setDeploying(
        false
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
     COMMAND ACTION
     ======================================================= */

  function handlePrimaryAction() {
    if (
      selectedProject
    ) {
      handleReviewFix();
      return;
    }

    handleBuild();
  }


  /* =======================================================
     KEYBOARD
     ======================================================= */

  function handlePromptKeyDown(
    event
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault();

      handlePrimaryAction();
    }
  }


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
            WORKSPACE HEADER
            ================================================= */}

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
              aria-hidden="true"
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
                Build, inspect, preview and
                deploy from one AI command center.
              </p>

            </div>

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
                styles.secondaryAction
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
              {generatedFiles.length >
                0 && (
                <span
                  className={
                    styles.actionCount
                  }
                >
                  {
                    generatedFiles.length
                  }
                </span>
              )}
            </button>

            <button
              type="button"
              className={
                styles.premiumSubscription
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

              <small>
                Subscription
              </small>
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
                !selectedProject
              }
            >
              {deploying
                ? "Deploying..."
                : "Deploy"}
            </button>

          </div>

        </header>


        {/* =================================================
            MOBILE PANEL NAV
            ================================================= */}

        <nav
          className={
            styles.mobileWorkspaceNav
          }
          aria-label="Workspace panels"
        >

          {Object.entries(
            PANEL_NAMES
          ).map(
            ([
              key,
              label,
            ]) => (
              <button
                key={key}
                type="button"
                className={
                  mobilePanel === key
                    ? styles.mobileNavActive
                    : ""
                }
                onClick={() =>
                  setMobilePanel(
                    key
                  )
                }
              >
                {label}
              </button>
            )
          )}

        </nav>


        {/* =================================================
            ALERTS
            ================================================= */}

        {error && (
          <div
            className={
              styles.errorBanner
            }
            role="alert"
          >

            <span
              className={
                styles.alertIcon
              }
            >
              !
            </span>

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


        {/* =================================================
            MAIN WORKSPACE
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
                mobilePanel ===
                "projects"
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
                  {projects.length}
                </strong>
              </div>

              <button
                type="button"
                className={
                  styles.createProjectButton
                }
                onClick={
                  handleNewProject
                }
              >
                +
                <small>
                  New project
                </small>
              </button>

            </div>


            <button
              type="button"
              className={
                styles.premiumCreateCard
              }
              onClick={
                handleNewProject
              }
            >

              <span
                className={
                  styles.premiumCreateIcon
                }
              >
                +
              </span>

              <span>
                <strong>
                  Create a project
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
                    Loading projects…
                  </small>

                </div>

              ) : projects.length ===
                0 ? (

                <div
                  className={
                    styles.noProjects
                  }
                >

                  <div>
                    +
                  </div>

                  <strong>
                    No projects yet
                  </strong>

                  <p>
                    Your projects will
                    appear here after the
                    backend creates them.
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
                  (project) => {
                    const id =
                      getProjectId(
                        project
                      );

                    const name =
                      getProjectName(
                        project
                      );

                    const frameworkName =
                      getProjectFramework(
                        project
                      );

                    const active =
                      String(id) ===
                      String(
                        getProjectId(
                          selectedProject
                        )
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

                          {frameworkName && (
                            <small>
                              {
                                frameworkName
                              }
                            </small>
                          )}

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


          {/* =================================================
              BUILDER
              ================================================= */}

          <section
            className={`
              ${styles.buildArea}
              ${
                mobilePanel ===
                "builder"
                  ? styles.mobilePanelVisible
                  : ""
              }
            `}
          >

            {/* BUILDER TOOLBAR */}

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
                    styles.liveDot
                  }
                />

                <div>
                  <strong>
                    ZyrionOS AI
                  </strong>

                  <small>
                    {loading
                      ? "Working on your request"
                      : "Ready"}
                  </small>
                </div>

              </div>


              <div
                className={
                  styles.toolbarRight
                }
              >

                <label
                  htmlFor="workspace-framework"
                  className={
                    styles.frameworkLabel
                  }
                >
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


            {/* BUILDER CANVAS */}

            <div
              className={
                styles.canvas
              }
            >

              {loading ? (

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
                    {selectedProject
                      ? "Working on your project"
                      : "Building your project"}
                  </h2>

                  <p>
                    Your request is being
                    processed. The workspace
                    will show only state
                    returned by the connected
                    services.
                  </p>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <span />
                  </div>

                  <small>
                    Please keep this workspace
                    open while the request is
                    processing.
                  </small>

                </div>

              ) : !selectedProject &&
                !aiResponse ? (

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
                    AI DEVELOPMENT COMMAND CENTER
                  </span>

                  <h2>
                    What do you want
                    to build?
                  </h2>

                  <p>
                    Describe your product,
                    application, automation
                    or business system.
                    ZyrionOS will send your
                    request through the connected
                    AI and project services.
                  </p>

                  <div
                    className={
                      styles.quickPrompts
                    }
                  >

                    {QUICK_PROMPTS.map(
                      (item) => (
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

                          {
                            item.label
                          }
                        </button>
                      )
                    )}

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
                        WORKSPACE
                      </span>

                      <h2>
                        {projectName}
                      </h2>
                    </div>

                    <div
                      className={
                        styles.resultStatus
                      }
                    >
                      <i
                        data-tone={
                          deployment.tone
                        }
                      />

                      {
                        deployment.label
                      }
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
                        activeView ===
                        "preview"
                          ? styles.resultTabActive
                          : ""
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
                          ? styles.resultTabActive
                          : ""
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

                      {generatedFiles.length >
                        0 && (
                        <span>
                          {
                            generatedFiles.length
                          }
                        </span>
                      )}
                    </button>

                  </div>


                  <div
                    className={
                      styles.resultContent
                    }
                  >

                    {/* PREVIEW */}

                    {activeView ===
                      "preview" && (

                      <div
                        className={
                          styles.previewPanel
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

                          <label>
                            Live Preview
                          </label>

                          <span
                            className={
                              styles.previewState
                            }
                          >
                            {liveUrl
                              ? "Live"
                              : "Not available"}
                          </span>

                        </div>


                        <div
                          className={
                            styles.previewBody
                          }
                        >

                          {liveUrl ? (

                            <div
                              className={
                                styles.livePreview
                              }
                            >

                              <div
                                className={
                                  styles.livePreviewIcon
                                }
                              >
                                ✓
                              </div>

                              <span
                                className={
                                  styles.eyebrow
                                }
                              >
                                DEPLOYMENT
                              </span>

                              <strong>
                                Live application
                              </strong>

                              <p>
                                The backend
                                returned a live
                                deployment URL
                                for this project.
                              </p>

                              <a
                                href={
                                  liveUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                  styles.openLiveButton
                                }
                              >
                                Open live project
                                <span>
                                  →
                                </span>
                              </a>

                            </div>

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

                              <span
                                className={
                                  styles.eyebrow
                                }
                              >
                                PREVIEW
                              </span>

                              <strong>
                                No live preview
                                available
                              </strong>

                              <p>
                                The backend has
                                not returned a
                                live preview URL
                                for this project.
                              </p>

                              <button
                                type="button"
                                onClick={
                                  handleDeploy
                                }
                                disabled={
                                  deploying ||
                                  !selectedProject
                                }
                              >
                                {deploying
                                  ? "Deploying…"
                                  : "Deploy project"}
                              </button>

                            </div>

                          )}

                        </div>

                      </div>
                    )}


                    {/* CODE */}

                    {activeView ===
                      "code" && (

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
                              {
                                generatedFiles.length
                              }
                            </strong>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setActiveView(
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
                                  No files returned
                                </strong>

                                <small>
                                  No project files
                                  were returned by
                                  the connected
                                  service.
                                </small>

                              </div>

                            ) : (

                              generatedFiles.map(
                                (
                                  file
                                ) => {
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
                              {selectedFile
                                ? selectedFileContent ||
                                  "This file does not contain readable content."
                                : "Select a project file to inspect it."}
                            </pre>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>


                  {/* AI RESPONSE */}

                  {aiResponse && (
                    <div
                      className={
                        styles.aiResponse
                      }
                    >

                      <div
                        className={
                          styles.aiResponseHeader
                        }
                      >

                        <div>
                          <span>
                            ZYRIONOS AI
                          </span>

                          <strong>
                            Latest response
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setAIResponse(
                              ""
                            )
                          }
                        >
                          Hide
                        </button>

                      </div>

                      <pre>
                        {aiResponse}
                      </pre>

                    </div>
                  )}

                </div>
              )}

            </div>


            {/* =================================================
                AI COMMAND CENTER
                ================================================= */}

            <section
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
                    styles.commandHeader
                  }
                >

                  <div
                    className={
                      styles.commandIdentity
                    }
                  >

                    <span
                      className={
                        styles.commandSpark
                      }
                    >
                      ✦
                    </span>

                    <div>
                      <strong>
                        ZyrionOS AI
                      </strong>

                      <small>
                        {selectedProject
                          ? "Change, fix or improve this project"
                          : "Describe what you want to build"}
                      </small>
                    </div>

                  </div>


                  <div
                    className={
                      styles.commandTools
                    }
                  >

                    <span
                      className={
                        styles.modelBadge
                      }
                    >
                      AI
                    </span>

                    <span
                      className={
                        styles.frameworkBadge
                      }
                    >
                      {framework}
                    </span>

                  </div>

                </div>


                <textarea
                  ref={
                    commandInputRef
                  }
                  value={
                    prompt
                  }
                  onChange={(
                    event
                  ) =>
                    setPrompt(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handlePromptKeyDown
                  }
                  placeholder={
                    selectedProject
                      ? "Build a feature, fix a bug, improve the UI, or change the project…"
                      : "Describe the application, product or system you want to build…"
                  }
                  disabled={
                    loading
                  }
                  rows={3}
                  aria-label="AI workspace command"
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
                      Enter to send
                    </span>

                    <b>
                      ·
                    </b>

                    <span>
                      Shift + Enter for new line
                    </span>
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
                          loading
                        }
                      >
                        Review / Fix
                      </button>
                    )}

                    <button
                      type="button"
                      className={
                        styles.generateAction
                      }
                      onClick={
                        handlePrimaryAction
                      }
                      disabled={
                        loading ||
                        !prompt.trim()
                      }
                    >
                      {loading
                        ? "Working…"
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


              <div
                className={
                  styles.quickCommandBar
                }
              >

                {QUICK_PROMPTS.map(
                  (item) => (
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
                      {item.label}
                    </button>
                  )
                )}

              </div>

            </section>

          </section>


          {/* =================================================
              INSPECTOR
              ================================================= */}

          <aside
            className={`
              ${styles.inspector}
              ${
                mobilePanel ===
                "inspector"
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
                  PROJECT
                </span>

                <strong>
                  Inspector
                </strong>
              </div>

              <button
                type="button"
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
                styles.inspectorContent
              }
            >

              {/* PROJECT */}

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
                  {projectFramework ||
                    "Framework not returned"}
                </small>

              </div>


              {/* DEPLOYMENT */}

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
                    styles.statusValue
                  }
                >

                  <i
                    data-tone={
                      deployment.tone
                    }
                  />

                  {
                    deployment.label
                  }

                </div>

                {liveUrl && (
                  <a
                    href={
                      liveUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      styles.inspectorLink
                    }
                  >
                    Open live project →
                  </a>
                )}

              </div>


              {/* FILES */}

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
                  {
                    generatedFiles.length
                  }
                </strong>

                <small>
                  Files returned by the
                  connected backend/AI service.
                </small>

              </div>


              {/* BUILD STATE */}

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
                  WORKSPACE STATE
                </span>

                <div
                  className={
                    styles.statusValue
                  }
                >

                  <i
                    data-tone={
                      loading
                        ? "progress"
                        : "success"
                    }
                  />

                  {loading
                    ? "Working"
                    : "Available"}

                </div>

              </div>


              {/* AI RESPONSE */}

              {aiResponse && (
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
                    AI RESPONSE
                  </span>

                  <strong>
                    Response available
                  </strong>

                  <button
                    type="button"
                    className={
                      styles.inspectorLinkButton
                    }
                    onClick={() =>
                      setAIResponse(
                        ""
                      )
                    }
                  >
                    Clear response
                  </button>

                </div>
              )}


              {/* SUBSCRIPTION */}

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


            {/* DEPLOY */}

            <button
              type="button"
              className={
                styles.inspectorDeploy
              }
              onClick={
                handleDeploy
              }
              disabled={
                deploying ||
                !selectedProject
              }
            >
              {deploying
                ? "Deploying…"
                : "Deploy Project"}
            </button>

          </aside>

        </section>

      </main>
    </DashboardLayout>
  );
}


export default Workspace;
