import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import {
  getProjects,
  createProject,
  deployProject
} from "../../../services/workspaceService";

import { generateCode } from "../../../services/aiService";

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
  "Other"
];

const QUICK_PROMPTS = [
  "Build an AI SaaS dashboard",
  "Create a production-ready landing page",
  "Add authentication and user accounts",
  "Build an admin control center"
];

const BUILDER_ACTIONS = [
  {
    id: "build",
    label: "Build",
    description: "Generate a project from your idea."
  },
  {
    id: "review",
    label: "Review / Fix",
    description: "Ask the AI to inspect and improve the project."
  },
  {
    id: "deploy",
    label: "Deploy",
    description: "Publish the selected project."
  }
];


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


function normalizeDeploymentStatus(status) {
  switch (String(status || "").toLowerCase()) {
    case "deployed":
      return "Deployed";

    case "deploying":
      return "Deploying...";

    case "failed":
      return "Deployment failed";

    case "building":
      return "Building";

    case "pending":
      return "Pending";

    case "not_deployed":
    default:
      return "Not deployed";
  }
}


function normalizeAIResponse(result) {
  if (typeof result === "string") {
    return result;
  }

  if (
    result === null ||
    result === undefined
  ) {
    return "";
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


function normalizeProjectFiles(
  project,
  aiResult
) {
  if (
    Array.isArray(project?.files)
  ) {
    return project.files;
  }

  if (
    Array.isArray(aiResult?.files)
  ) {
    return aiResult.files;
  }

  if (
    Array.isArray(aiResult?.data?.files)
  ) {
    return aiResult.data.files;
  }

  return [];
}


function getFilePath(file) {
  return (
    file?.path ||
    file?.name ||
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

  return `File: ${getFilePath(file)}`;
}


function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}


/* =========================================================
   WORKSPACE
   ========================================================= */

function Workspace() {
  /* =======================================================
     PROJECT STATE
     ======================================================= */

  const [projects, setProjects] =
    useState([]);

  const [selectedProject, setSelectedProject] =
    useState(null);

  /* =======================================================
     BUILDER STATE
     ======================================================= */

  const [prompt, setPrompt] =
    useState("");

  const [framework, setFramework] =
    useState("React");

  const [loading, setLoading] =
    useState(false);

  const [deploying, setDeploying] =
    useState(false);

  const [aiResponse, setAiResponse] =
    useState("");

  const [generatedFiles, setGeneratedFiles] =
    useState([]);

  const [selectedFile, setSelectedFile] =
    useState(null);

  /* =======================================================
     DEPLOYMENT STATE
     ======================================================= */

  const [
    deploymentStatus,
    setDeploymentStatus
  ] = useState("Not deployed");

  const [liveUrl, setLiveUrl] =
    useState("");

  /* =======================================================
     UI STATE
     ======================================================= */

  const [activeTab, setActiveTab] =
    useState("preview");

  const [mobilePanel, setMobilePanel] =
    useState("builder");

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [projectLoading, setProjectLoading] =
    useState(true);

  /* =======================================================
     PROJECT NAME
     ======================================================= */

  const projectName =
    getProjectName(
      selectedProject
    );

  /* =======================================================
     PROJECT COUNT
     ======================================================= */

  const projectCount =
    projects.length;

  /* =======================================================
     CURRENT FILE PREVIEW
     ======================================================= */

  const filePreview =
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

  const applySelectedProject =
    useCallback(
      (project) => {
        setSelectedProject(
          project
        );

        const files =
          Array.isArray(
            project?.files
          )
            ? project.files
            : [];

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
            project?.deploymentStatus
          )
        );

        setLiveUrl(
          project?.liveUrl ||
            project?.deploymentUrl ||
            ""
        );

        if (
          project?.framework &&
          FRAMEWORKS.includes(
            project.framework
          )
        ) {
          setFramework(
            project.framework
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

          const data =
            response?.data ||
            {};

          const normalized =
            Array.isArray(
              data?.projects
            )
              ? data.projects
              : Array.isArray(data)
              ? data
              : [];

          setProjects(
            normalized
          );

          /* -----------------------------------------------
             Preferred project
             ----------------------------------------------- */

          if (
            preferredProjectId
          ) {
            const preferred =
              normalized.find(
                (project) =>
                  String(
                    getProjectId(
                      project
                    )
                  ) ===
                  String(
                    preferredProjectId
                  )
              );

            if (preferred) {
              applySelectedProject(
                preferred
              );

              return normalized;
            }
          }

          /* -----------------------------------------------
             Preserve selected project
             ----------------------------------------------- */

          const currentId =
            getProjectId(
              selectedProject
            );

          if (currentId) {
            const current =
              normalized.find(
                (project) =>
                  String(
                    getProjectId(
                      project
                    )
                  ) ===
                  String(
                    currentId
                  )
              );

            if (current) {
              applySelectedProject(
                current
              );

              return normalized;
            }
          }

          /* -----------------------------------------------
             Select first real project
             ----------------------------------------------- */

          if (
            normalized.length > 0
          ) {
            applySelectedProject(
              normalized[0]
            );
          }
        } catch (err) {
          console.error(
            "Workspace project loading error:",
            err
          );

          setProjects([]);

          setError(
            getErrorMessage(
              err,
              "Projects could not be loaded."
            )
          );
        } finally {
          setProjectLoading(false);
        }

        return [];
      },
      [
        applySelectedProject,
        selectedProject
      ]
    );

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /* =======================================================
     SELECT PROJECT
     ======================================================= */

  function handleSelectProject(
    project
  ) {
    setError("");
    setNotice("");
    setAiResponse("");
    setActiveTab("preview");
    setMobilePanel("builder");

    applySelectedProject(
      project
    );
  }

  /* =======================================================
     NEW PROJECT
     ======================================================= */

  function handleNewProject() {
    setSelectedProject(null);
    setAiResponse("");
    setGeneratedFiles([]);
    setSelectedFile(null);
    setPrompt("");
    setLiveUrl("");
    setDeploymentStatus(
      "Not deployed"
    );
    setActiveTab("preview");
    setMobilePanel("builder");
    setError("");
    setNotice("");
  }

  /* =======================================================
     CREATE PROJECT
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

    try {
      setError("");
      setNotice("");
      setLoading(true);

      /* -----------------------------------------------
         AI GENERATION
         ----------------------------------------------- */

      const aiResult =
        await generateCode(
          userPrompt,
          framework
        );

      const formattedResponse =
        normalizeAIResponse(
          aiResult
        );

      setAiResponse(
        formattedResponse
      );

      /* -----------------------------------------------
         CREATE REAL BACKEND PROJECT
         ----------------------------------------------- */

      const projectResponse =
        await createProject({
          projectName:
            userPrompt.substring(
              0,
              120
            ),

          description:
            userPrompt,

          framework
        });

      const createdProject =
        projectResponse?.data?.project ||
        projectResponse?.project ||
        projectResponse?.data ||
        null;

      /* -----------------------------------------------
         REAL FILES ONLY
         ----------------------------------------------- */

      const files =
        normalizeProjectFiles(
          createdProject,
          aiResult
        );

      setGeneratedFiles(
        files
      );

      setSelectedFile(
        files.length > 0
          ? files[0]
          : null
      );

      /* -----------------------------------------------
         PROJECT CONTEXT
         ----------------------------------------------- */

      if (createdProject) {
        applySelectedProject(
          {
            ...createdProject,
            files
          }
        );
      }

      /* -----------------------------------------------
         REFRESH BACKEND PROJECT LIST
         ----------------------------------------------- */

      const createdId =
        getProjectId(
          createdProject
        );

      await loadProjects(
        createdId
      );

      setPrompt("");
      setActiveTab("preview");
      setMobilePanel("builder");

      setNotice(
        "Project created successfully."
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
    } finally {
      setLoading(false);
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

    const reviewPrompt =
      prompt.trim();

    const baseInstruction =
      reviewPrompt
        ? `Review the current project and fix the following request:\n\n${reviewPrompt}`
        : "Review the current project for errors, broken UX, responsive problems and implementation issues. Identify problems and generate the safest fixes.";

    try {
      setError("");
      setNotice("");
      setLoading(true);

      const result =
        await generateCode(
          baseInstruction,
          framework
        );

      setAiResponse(
        normalizeAIResponse(
          result
        )
      );

      const files =
        normalizeProjectFiles(
          selectedProject,
          result
        );

      if (
        files.length > 0
      ) {
        setGeneratedFiles(
          files
        );

        setSelectedFile(
          files[0]
        );
      }

      setActiveTab("code");

      setNotice(
        files.length > 0
          ? "Review completed. Returned project files are shown in Code."
          : "Review completed. No replacement files were returned by the backend."
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
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     DEPLOY PROJECT
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
      setDeploying(true);

      setDeploymentStatus(
        "Deploying..."
      );

      const response =
        await deployProject(
          projectId
        );

      const data =
        response?.data ||
        {};

      const deployment =
        data?.deployment ||
        response?.deployment ||
        {};

      const deployedProject =
        data?.project ||
        null;

      const url =
        deployment?.liveUrl ||
        deployment?.url ||
        deployedProject?.liveUrl ||
        deployedProject?.deploymentUrl ||
        "";

      if (
        deployedProject
      ) {
        applySelectedProject(
          deployedProject
        );
      }

      const finalStatus =
        normalizeDeploymentStatus(
          deployedProject?.deploymentStatus ||
            deployment?.status ||
            "deployed"
        );

      setDeploymentStatus(
        finalStatus
      );

      setLiveUrl(
        url
      );

      setProjects(
        (previous) =>
          previous.map(
            (project) =>
              String(
                getProjectId(
                  project
                )
              ) ===
              String(projectId)
                ? {
                    ...project,
                    ...(deployedProject ||
                      {}),
                    liveUrl:
                      url ||
                      project.liveUrl,
                    deploymentUrl:
                      url ||
                      project.deploymentUrl,
                    deploymentStatus:
                      finalStatus
                  }
                : project
          )
      );

      setActiveTab(
        "preview"
      );

      setNotice(
        url
          ? "Deployment completed successfully."
          : "Deployment request completed. No live URL was returned."
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
    } finally {
      setDeploying(false);
    }
  }

  /* =======================================================
     SUBSCRIPTION
     ======================================================= */

  function handleSubscription() {
    /*
     * Billing is a first-class application route.
     * We intentionally do not create fake subscription
     * state or fake payment behavior inside Workspace.
     */
    window.location.assign(
      "/billing"
    );
  }

  /* =======================================================
     BUILD ACTION
     ======================================================= */

  function handlePrimaryAction() {
    if (
      selectedProject &&
      prompt.trim()
    ) {
      handleReviewFix();
      return;
    }

    handleGenerate();
  }

  /* =======================================================
     KEYBOARD SHORTCUT
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

  /* =======================================================
     STATUS CLASS
     ======================================================= */

  const deploymentIsLive =
    deploymentStatus ===
    "Deployed";

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
            PREMIUM WORKSPACE HEADER
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
                deploy from one command center.
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
                setActiveTab("preview")
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
                setActiveTab("code")
              }
            >
              Code
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

              <span>
                Build Your Future
              </span>

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
            MOBILE WORKSPACE NAV
            ================================================= */}

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
            Builder
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
            Inspector
          </button>

        </nav>


        {/* =================================================
            ERROR
            ================================================= */}

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
                Workspace notice
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


        {/* =================================================
            SUCCESS / INFORMATION NOTICE
            ================================================= */}

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
              PROJECT RAIL
              ================================================= */}

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

              <div
                className={
                  styles.railTitle
                }
              >

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
                title="Create a new project"
              >
                <span>
                  +
                </span>

                <small>
                  Create Project
                </small>
              </button>

            </div>


            {/* PREMIUM CREATE AREA */}

            <button
              type="button"
              className={
                styles.premiumCreateCard
              }
              onClick={
                handleNewProject
              }
            >

              <div
                className={
                  styles.premiumCreateIcon
                }
              >
                +
              </div>

              <div>
                <strong>
                  Create a Project
                </strong>

                <span>
                  Start from an idea
                </span>
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
                    Create your first project
                    to start building.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleNewProject
                    }
                  >
                    Create Project
                  </button>

                </div>

              ) : (

                projects.map(
                  (project) => {

                    const name =
                      getProjectName(
                        project
                      );

                    const id =
                      getProjectId(
                        project
                      ) ||
                      name;

                    const active =
                      String(
                        getProjectId(
                          selectedProject
                        )
                      ) ===
                      String(
                        getProjectId(
                          project
                        )
                      );

                    return (
                      <button
                        key={id}
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
                            {project?.framework ||
                              "Node.js"}
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


          {/* =================================================
              BUILD AREA
              ================================================= */}

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

            {/* BUILD TOOLBAR */}

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
                    ZyrionOS Builder
                  </strong>

                  <small>
                    {loading
                      ? "AI is working"
                      : "Ready to build"}
                  </small>
                </div>

              </div>


              <div
                className={
                  styles.toolbarRight
                }
              >

                <label
                  className={
                    styles.frameworkLabel
                  }
                >
                  Framework
                </label>

                <select
                  value={
                    framework
                  }
                  onChange={(event) =>
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


            {/* =================================================
                BUILDER CANVAS
                ================================================= */}

            <div
              className={
                styles.canvas
              }
            >

              {/* -----------------------------------------------
                  IDLE
                  ----------------------------------------------- */}

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

                  <div
                    className={
                      styles.eyebrow
                    }
                  >
                    AI DEVELOPMENT COMMAND CENTER
                  </div>

                  <h2>
                    What do you want
                    to build?
                  </h2>

                  <p>
                    Describe your product,
                    application, automation
                    or business system.
                    ZyrionOS turns the idea
                    into a real project.
                  </p>


                  <div
                    className={
                      styles.quickPrompts
                    }
                  >

                    {QUICK_PROMPTS.map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setPrompt(
                              item
                            )
                          }
                        >
                          <span>
                            +
                          </span>

                          {item}
                        </button>
                      )
                    )}

                  </div>

                </div>

              ) : loading ? (

                /* ---------------------------------------------
                   BUILDING
                   --------------------------------------------- */

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

                  <div
                    className={
                      styles.eyebrow
                    }
                  >
                    ZYRIONOS AI
                  </div>

                  <h2>
                    {selectedProject
                      ? "Reviewing your project"
                      : "Building your project"}
                  </h2>

                  <p>
                    ZyrionOS is processing
                    your request and preparing
                    the workspace.
                  </p>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <span />
                  </div>

                  <small>
                    {selectedProject
                      ? "Inspecting and improving the project"
                      : "Preparing project architecture"}
                  </small>

                </div>

              ) : (

                /* ---------------------------------------------
                   RESULT
                   --------------------------------------------- */

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
                        BUILD RESULT
                      </span>

                      <h2>
                        {selectedProject
                          ? "Project workspace"
                          : "Project generated"}
                      </h2>

                    </div>

                    <div
                      className={
                        styles.readyBadge
                      }
                    >
                      <i />
                      Ready
                    </div>

                  </div>


                  {/* RESULT TABS */}

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

                    {/* =========================================
                        PREVIEW
                        ========================================= */}

                    {activeTab ===
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
                            Project Preview
                          </label>

                          <span
                            className={
                              styles.previewState
                            }
                          >
                            {liveUrl
                              ? "Live"
                              : "Awaiting deployment"}
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

                              <strong>
                                Live application
                              </strong>

                              <p>
                                Your deployed
                                application is
                                available.
                              </p>

                              <a
                                href={
                                  liveUrl
                                }
                                target="_blank"
                                rel="noreferrer"
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

                              <strong>
                                Preview not available yet
                              </strong>

                              <p>
                                The project exists,
                                but no live preview
                                URL has been returned
                                by the backend.
                                Deploy the project
                                when it is ready.
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
                                  ? "Deploying..."
                                  : "Deploy Project"}
                              </button>

                            </div>

                          )}

                        </div>

                      </div>

                    )}


                    {/* =========================================
                        CODE
                        ========================================= */}

                    {activeTab ===
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
                            Back to Preview
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
                                Read-only preview
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


            {/* =================================================
                COMMAND AREA
                ================================================= */}

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
                      ? "Improve your project"
                      : "Build your idea"}
                  </span>

                </div>


                <textarea
                  value={
                    prompt
                  }
                  onChange={(event) =>
                    setPrompt(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handlePromptKeyDown
                  }
                  placeholder={
                    selectedProject
                      ? "Describe a change, fix or feature..."
                      : "Describe what you want to build..."
                  }
                  disabled={
                    loading
                  }
                  rows={3}
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
                      Enter to build
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

            </div>


            {/* =================================================
                BUILDER ACTION STRIP
                ================================================= */}

            <div
              className={
                styles.builderActions
              }
            >

              {BUILDER_ACTIONS.map(
                (action) => {

                  const isDeploy =
                    action.id ===
                    "deploy";

                  const isReview =
                    action.id ===
                    "review";

                  return (
                    <button
                      key={action.id}
                      type="button"
                      className={
                        styles.builderAction
                      }
                      onClick={
                        isDeploy
                          ? handleDeploy
                          : isReview
                          ? handleReviewFix
                          : () => {
                              document
                                .querySelector(
                                  `.${styles.commandBox} textarea`
                                )
                                ?.focus();
                            }
                      }
                      disabled={
                        loading ||
                        deploying ||
                        ((isDeploy ||
                          isReview) &&
                          !selectedProject)
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

          </section>


          {/* =================================================
              INSPECTOR
              ================================================= */}

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
                  PROJECT
                </span>

                <strong>
                  Inspector
                </strong>

              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "code"
                  )
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
                  {selectedProject?.framework ||
                    framework}
                </small>

              </div>


              {/* BUILD STATUS */}

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
                  BUILD STATUS
                </span>

                <div
                  className={
                    styles.statusValue
                  }
                >

                  <i />

                  {loading
                    ? "Building"
                    : aiResponse
                    ? "Ready"
                    : "Waiting"}

                </div>

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
                  {generatedFiles.length}
                </strong>

                <small>
                  Real backend / AI returned files
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
                    deploymentIsLive
                      ? styles.statusValue
                      : styles.statusPending
                  }
                >

                  <i />

                  {deploymentStatus}

                </div>

              </div>


              {/* LIVE */}

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

                  <a
                    href={
                      liveUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open live project
                    <span>
                      →
                    </span>
                  </a>

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


            {/* DEPLOY CTA */}

            <button
              type="button"
              className={
                styles.inspectorDeploy
              }
              disabled={
                deploying ||
                !selectedProject
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
