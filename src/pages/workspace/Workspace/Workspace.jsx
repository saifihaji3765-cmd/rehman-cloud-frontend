import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import {
  getProjects,
  getProject,
  createProject,
  deployProject
} from "../../../services/workspaceService";

import { generateCode } from "../../../services/aiService";

import styles from "./Workspace.module.css";


/* =========================================================
   CONFIGURATION
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


/* =========================================================
   HELPERS
========================================================= */

function getProjectId(project) {
  return String(
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


function normalizeDeploymentStatus(status) {
  const value = String(
    status || ""
  ).trim().toLowerCase();

  switch (value) {
    case "deployed":
    case "success":
    case "successful":
    case "live":
      return "Deployed";

    case "deploying":
    case "in_progress":
    case "in-progress":
      return "Deploying";

    case "building":
      return "Building";

    case "pending":
      return "Pending";

    case "failed":
    case "failure":
      return "Failed";

    case "cancelled":
    case "canceled":
      return "Cancelled";

    case "not_deployed":
    case "not-deployed":
      return "Not deployed";

    default:
      return status
        ? String(status)
        : "Unavailable";
  }
}


function normalizeAIResponse(result) {
  if (
    typeof result === "string"
  ) {
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


function normalizeProjectsResponse(response) {
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
      data?.data
    )
  ) {
    return data.data;
  }

  return [];
}


function extractProject(response) {
  const data =
    response?.data ?? response;

  return (
    data?.project ||
    data?.data?.project ||
    data?.data ||
    (
      data &&
      (
        data._id ||
        data.id
      )
        ? data
        : null
    )
  );
}


function getBackendFiles(project) {
  if (
    Array.isArray(
      project?.files
    )
  ) {
    return project.files;
  }

  return [];
}


function getFilePath(file) {
  return (
    file?.path ||
    file?.name ||
    file?.filePath ||
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

  return "The backend returned this file without readable content.";
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


function getDeploymentUrl(
  project,
  deployment
) {
  return (
    deployment?.liveUrl ||
    deployment?.url ||
    project?.liveUrl ||
    project?.deploymentUrl ||
    ""
  );
}


/* =========================================================
   WORKSPACE
========================================================= */

function Workspace() {

  /* =======================================================
     PROJECT STATE
  ======================================================= */

  const [
    projects,
    setProjects
  ] = useState([]);

  const [
    selectedProject,
    setSelectedProject
  ] = useState(null);

  const selectedProjectIdRef =
    useRef("");

  const initialLoadRef =
    useRef(false);


  /* =======================================================
     BUILDER STATE
  ======================================================= */

  const [
    prompt,
    setPrompt
  ] = useState("");

  const [
    framework,
    setFramework
  ] = useState("React");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    deploying,
    setDeploying
  ] = useState(false);

  const [
    aiResponse,
    setAiResponse
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile
  ] = useState(null);


  /* =======================================================
     UI STATE
  ======================================================= */

  const [
    activeTab,
    setActiveTab
  ] = useState("preview");

  const [
    mobilePanel,
    setMobilePanel
  ] = useState("builder");

  const [
    error,
    setError
  ] = useState("");

  const [
    notice,
    setNotice
  ] = useState("");

  const [
    projectLoading,
    setProjectLoading
  ] = useState(true);

  const [
    refreshing,
    setRefreshing
  ] = useState(false);


  /* =======================================================
     DERIVED STATE
  ======================================================= */

  const projectName =
    getProjectName(
      selectedProject
    );

  const selectedFramework =
    getProjectFramework(
      selectedProject
    ) || framework;

  const generatedFiles =
    useMemo(
      () =>
        getBackendFiles(
          selectedProject
        ),
      [selectedProject]
    );

  const projectCount =
    projects.length;

  const filePreview =
    useMemo(
      () =>
        getFileContent(
          selectedFile
        ),
      [selectedFile]
    );

  const deploymentStatus =
    normalizeDeploymentStatus(
      selectedProject?.deploymentStatus ||
      selectedProject?.deployment?.status ||
      selectedProject?.status
    );

  const liveUrl =
    getDeploymentUrl(
      selectedProject,
      selectedProject?.deployment
    );

  const deploymentIsLive =
    Boolean(liveUrl) ||
    deploymentStatus === "Deployed";


  /* =======================================================
     APPLY PROJECT
  ======================================================= */

  const applySelectedProject =
    useCallback(
      (project) => {

        if (!project) {
          setSelectedProject(null);
          selectedProjectIdRef.current = "";
          setSelectedFile(null);
          return;
        }

        setSelectedProject(project);

        const id =
          getProjectId(project);

        selectedProjectIdRef.current =
          id;

        const files =
          getBackendFiles(project);

        setSelectedFile(
          (previousFile) => {

            if (!files.length) {
              return null;
            }

            if (!previousFile) {
              return files[0];
            }

            const previousPath =
              getFilePath(
                previousFile
              );

            return (
              files.find(
                (file) =>
                  getFilePath(file) ===
                  previousPath
              ) ||
              files[0]
            );
          }
        );

        const projectFramework =
          getProjectFramework(project);

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
      async ({
        preferredProjectId = "",
        silent = false
      } = {}) => {

        try {

          if (silent) {
            setRefreshing(true);
          } else {
            setProjectLoading(true);
          }

          setError("");

          const response =
            await getProjects();

          const normalized =
            normalizeProjectsResponse(
              response
            );

          setProjects(
            normalized
          );

          const targetId =
            preferredProjectId ||
            selectedProjectIdRef.current;

          if (targetId) {

            const matchingProject =
              normalized.find(
                (project) =>
                  getProjectId(project) ===
                  String(targetId)
              );

            if (matchingProject) {
              applySelectedProject(
                matchingProject
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

            setSelectedProject(null);
            selectedProjectIdRef.current = "";
            setSelectedFile(null);
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
          setRefreshing(false);
        }
      },
      [applySelectedProject]
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;

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
     REFRESH
  ======================================================= */

  async function handleRefresh() {
    await loadProjects({
      preferredProjectId:
        selectedProjectIdRef.current,
      silent: true
    });
  }


  /* =======================================================
     NEW PROJECT
  ======================================================= */

  function handleNewProject() {

    setSelectedProject(null);

    selectedProjectIdRef.current =
      "";

    setSelectedFile(null);

    setAiResponse("");

    setPrompt("");

    setFramework("React");

    setActiveTab("preview");

    setMobilePanel("builder");

    setError("");

    setNotice("");
  }


  /* =======================================================
     GENERATE PROJECT
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

      /*
       * Step 1:
       * Ask the real AI service to process the idea.
       */

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


      /*
       * Step 2:
       * Create the actual backend project.
       *
       * We deliberately do NOT pretend that AI-returned
       * files are persisted project files.
       */

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
        extractProject(
          projectResponse
        );

      const createdId =
        getProjectId(
          createdProject
        );

      /*
       * Step 3:
       * Fetch the actual backend project.
       * Only this response becomes project state.
       */

      let persistedProject =
        createdProject;

      if (createdId) {

        try {

          const freshResponse =
            await getProject(
              createdId
            );

          const freshProject =
            extractProject(
              freshResponse
            );

          if (freshProject) {
            persistedProject =
              freshProject;
          }

        } catch (refreshError) {

          console.warn(
            "Created project could not be reloaded:",
            refreshError
          );
        }
      }

      if (persistedProject) {

        applySelectedProject(
          persistedProject
        );

        setProjects(
          (previous) => {

            const exists =
              previous.some(
                (project) =>
                  getProjectId(project) ===
                  getProjectId(
                    persistedProject
                  )
              );

            if (exists) {

              return previous.map(
                (project) =>
                  getProjectId(project) ===
                  getProjectId(
                    persistedProject
                  )
                    ? persistedProject
                    : project
              );
            }

            return [
              persistedProject,
              ...previous
            ];
          }
        );
      }


      setPrompt("");

      setActiveTab(
        "preview"
      );

      setMobilePanel(
        "builder"
      );

      setNotice(
        createdId
          ? "Project created. Workspace state is now reading from the backend."
          : "AI response received, but the backend did not return a project identifier."
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

    const instruction =
      reviewPrompt
        ? `Review the current project and address this request:\n\n${reviewPrompt}`
        : "Review the current project for implementation, UX, responsive and reliability issues. Return your findings and safest recommended changes.";

    try {

      setError("");
      setNotice("");
      setLoading(true);

      const result =
        await generateCode(
          instruction,
          selectedFramework
        );

      setAiResponse(
        normalizeAIResponse(
          result
        )
      );

      /*
       * Important:
       * AI output is not automatically written into the
       * backend project because no confirmed update-files
       * contract has been supplied here.
       */

      setActiveTab("response");

      setNotice(
        "AI review response received. No project files were changed by the frontend."
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
        "Select a real backend project before deploying."
      );

      return;
    }

    try {

      setError("");
      setNotice("");
      setDeploying(true);

      const response =
        await deployProject(
          projectId
        );

      const data =
        response?.data ??
        response ??
        {};

      const deployment =
        data?.deployment ||
        data?.data?.deployment ||
        {};

      const returnedProject =
        data?.project ||
        data?.data?.project ||
        null;

      const returnedStatus =
        deployment?.status ||
        returnedProject?.deploymentStatus;

      const returnedUrl =
        getDeploymentUrl(
          returnedProject ||
            selectedProject,
          deployment
        );

      /*
       * Do not manufacture a "Deployed" state.
       */

      if (returnedProject) {

        applySelectedProject(
          returnedProject
        );

      } else {

        setSelectedProject(
          (previous) =>
            previous
              ? {
                  ...previous,

                  ...(returnedStatus
                    ? {
                        deploymentStatus:
                          returnedStatus
                      }
                    : {}),

                  ...(returnedUrl
                    ? {
                        liveUrl:
                          returnedUrl
                      }
                    : {})
                }
              : previous
        );
      }

      if (
        returnedProject ||
        returnedStatus ||
        returnedUrl
      ) {

        setNotice(
          returnedUrl
            ? "Deployment state updated from the backend."
            : "Deployment request returned backend state without a live URL."
        );

      } else {

        setNotice(
          "Deployment request was accepted, but the backend did not return deployment details."
        );
      }

      setActiveTab(
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

      setDeploying(false);
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
     PRIMARY COMMAND
  ======================================================= */

  function handlePrimaryAction() {

    if (selectedProject) {
      handleReviewFix();
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
                Build, review, preview and
                deploy from one workspace.
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
              disabled={
                generatedFiles.length === 0
              }
            >
              Code
              {generatedFiles.length > 0 && (
                <span
                  className={
                    styles.actionCount
                  }
                >
                  {generatedFiles.length}
                </span>
              )}
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
            <span>
              {projectCount}
            </span>
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
            WORKSPACE BODY
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

              <div
                className={
                  styles.railActions
                }
              >

                <button
                  type="button"
                  onClick={
                    handleRefresh
                  }
                  disabled={
                    refreshing ||
                    projectLoading
                  }
                  title="Refresh projects"
                >
                  {refreshing
                    ? "..."
                    : "↻"}
                </button>

                <button
                  type="button"
                  onClick={
                    handleNewProject
                  }
                  title="Create a new project"
                >
                  +
                </button>

              </div>

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

              <span
                className={
                  styles.premiumCreateCopy
                }
              >

                <strong>
                  New project
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

                  <div
                    className={
                      styles.emptyIcon
                    }
                  >
                    Z
                  </div>

                  <strong>
                    No projects yet
                  </strong>

                  <p>
                    Your backend projects
                    will appear here.
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

                    const id =
                      getProjectId(
                        project
                      );

                    const name =
                      getProjectName(
                        project
                      );

                    const projectFramework =
                      getProjectFramework(
                        project
                      );

                    const active =
                      id &&
                      id ===
                      selectedProjectIdRef.current;

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

                          <small>
                            {projectFramework ||
                              "Framework not specified"}
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
              BUILDER
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
                      ? "Processing request"
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
                CANVAS
            ================================================= */}

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
                    AI DEVELOPMENT WORKSPACE
                  </span>

                  <h2>
                    What are you building?
                  </h2>

                  <p>
                    Describe the product,
                    application, automation or
                    system you want to create.
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
                      ? "Reviewing your project"
                      : "Building your project"}
                  </h2>

                  <p>
                    Processing your request
                    through the connected AI
                    service.
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
                        WORKSPACE RESULT
                      </span>

                      <h2>
                        {selectedProject
                          ? projectName
                          : "AI response"}
                      </h2>

                    </div>

                    <div
                      className={
                        styles.resultState
                      }
                    >
                      <i />
                      Connected
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
                      disabled={
                        generatedFiles.length === 0
                      }
                    >
                      Code
                      {generatedFiles.length > 0 && (
                        <span>
                          {generatedFiles.length}
                        </span>
                      )}
                    </button>

                    {aiResponse && (
                      <button
                        type="button"
                        className={
                          activeTab === "response"
                            ? styles.resultTabActive
                            : ""
                        }
                        onClick={() =>
                          setActiveTab(
                            "response"
                          )
                        }
                      >
                        AI Response
                      </button>
                    )}

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
                              : "No live URL"}
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
                                DEPLOYMENT AVAILABLE
                              </span>

                              <strong>
                                Live application
                              </strong>

                              <p>
                                The backend returned
                                a live deployment URL
                                for this project.
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

                              <span
                                className={
                                  styles.eyebrow
                                }
                              >
                                PREVIEW
                              </span>

                              <strong>
                                No preview URL available
                              </strong>

                              <p>
                                This workspace does not
                                currently have a preview
                                URL returned by the
                                backend.
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

                          <small>
                            Backend state
                          </small>

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
                                Read only
                              </small>

                            </div>

                            <pre>
                              {filePreview}
                            </pre>

                          </div>

                        </div>

                      </div>

                    )}


                    {/* =========================================
                        AI RESPONSE
                    ========================================= */}

                    {activeTab ===
                      "response" && (

                      <div
                        className={
                          styles.responsePanel
                        }
                      >

                        <div
                          className={
                            styles.responseHeader
                          }
                        >

                          <div>

                            <span>
                              AI OUTPUT
                            </span>

                            <strong>
                              Request response
                            </strong>

                          </div>

                        </div>

                        <pre>
                          {aiResponse ||
                            "No AI response available."}
                        </pre>

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
                      ? "Describe a change or review request"
                      : "Describe what you want to build"}
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
                      ? "Describe a change, issue or feature..."
                      : "Describe your product or application..."
                  }
                  disabled={
                    loading
                  }
                  rows={3}
                  aria-label="Workspace command"
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

                    <small>
                      Run
                    </small>

                    <b>
                      ·
                    </b>

                    <span>
                      Shift + Enter
                    </span>

                    <small>
                      New line
                    </small>
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
                          !prompt.trim()
                        }
                      >
                        Review
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
                        ? "Working..."
                        : selectedProject
                        ? "Review"
                        : "Build"}

                      <span>
                        ↑
                      </span>

                    </button>

                  </div>

                </div>

              </div>

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
                  WORKSPACE
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
                disabled={
                  generatedFiles.length === 0
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
                  {selectedFramework ||
                    "Framework not specified"}
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
                  BUILD
                </span>

                <div
                  className={
                    loading
                      ? styles.statusPending
                      : styles.statusValue
                  }
                >

                  <i />

                  {loading
                    ? "Processing"
                    : aiResponse
                    ? "Response available"
                    : "Waiting"}

                </div>

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
                  Files returned by backend
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
                      ? styles.statusValue
                      : styles.statusPending
                  }
                >

                  <i />

                  {deploymentStatus}

                </div>

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
                    Deployment URL available
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


              <div
                className={
                  styles.inspectorInfo
                }
              >

                <span>
                  BACKEND STATE
                </span>

                <p>
                  Project, files and deployment
                  values shown here are based on
                  data returned by the connected
                  backend.
                </p>

              </div>

            </div>


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
