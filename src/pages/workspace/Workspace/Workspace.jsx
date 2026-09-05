import {
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
   HELPERS
   ========================================================= */

function getProjectId(project) {
  return project?._id || project?.id || "";
}

function getProjectName(project) {
  return (
    project?.projectName ||
    project?.name ||
    "Untitled Project"
  );
}

function normalizeDeploymentStatus(status) {
  switch (status) {
    case "deployed":
      return "Deployed";

    case "deploying":
      return "Deploying...";

    case "failed":
      return "Deployment failed";

    case "building":
      return "Building";

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

function normalizeProjectFiles(project, aiResult) {
  /*
   * Primary source:
   * Backend Project.files
   */

  if (
    Array.isArray(project?.files)
  ) {
    return project.files;
  }

  /*
   * Fallback:
   * If AI service itself returns files.
   *
   * This does NOT create fake files.
   */

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


/* =========================================================
   WORKSPACE
   ========================================================= */

function Workspace() {
  const [projects, setProjects] =
    useState([]);

  const [selectedProject, setSelectedProject] =
    useState(null);

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

  const [
    deploymentStatus,
    setDeploymentStatus
  ] = useState("Not deployed");

  const [liveUrl, setLiveUrl] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("preview");

  const [error, setError] =
    useState("");


  /* ======================================================
     LOAD PROJECTS
     ====================================================== */

  useEffect(() => {
    loadProjects();
  }, []);


  async function loadProjects(
    preferredProjectId = ""
  ) {
    try {
      const response =
        await getProjects();

      /*
       * Controller:
       *
       * data: {
       *   projects,
       *   pagination
       * }
       */

      const data =
        response?.data || {};

      const normalized =
        Array.isArray(data?.projects)
          ? data.projects
          : Array.isArray(data)
          ? data
          : [];

      setProjects(normalized);

      /*
       * If caller wants a specific project,
       * keep/select that project.
       */

      if (preferredProjectId) {
        const preferred =
          normalized.find(
            (project) =>
              getProjectId(project) ===
              preferredProjectId
          );

        if (preferred) {
          applySelectedProject(
            preferred
          );

          return normalized;
        }
      }

      /*
       * Keep current project if it
       * still exists.
       */

      if (selectedProject) {
        const current =
          normalized.find(
            (project) =>
              getProjectId(project) ===
              getProjectId(
                selectedProject
              )
          );

        if (current) {
          applySelectedProject(
            current
          );

          return normalized;
        }
      }

      /*
       * Otherwise select first project.
       */

      if (normalized.length > 0) {
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
        err?.message ||
          "Failed to load projects."
      );
    }

    return [];
  }


  /* ======================================================
     APPLY PROJECT
     ====================================================== */

  function applySelectedProject(
    project
  ) {
    setSelectedProject(project);

    const files =
      Array.isArray(project?.files)
        ? project.files
        : [];

    setGeneratedFiles(files);

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

    /*
     * Use project's framework when
     * available.
     */

    if (project?.framework) {
      setFramework(
        project.framework
      );
    }
  }


  /* ======================================================
     SELECT PROJECT
     ====================================================== */

  function handleSelectProject(
    project
  ) {
    setError("");
    setAiResponse("");

    setActiveTab("preview");

    applySelectedProject(
      project
    );
  }


  /* ======================================================
     NEW PROJECT
     ====================================================== */

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

    setError("");
  }


  /* ======================================================
     GENERATE PROJECT
     ====================================================== */

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
      setLoading(true);

      /*
       * ================================================
       * AI GENERATION
       * ================================================
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
       * ================================================
       * CREATE PROJECT
       * ================================================
       *
       * Controller expects:
       *
       * {
       *   projectName,
       *   description,
       *   framework
       * }
       *
       * Controller returns:
       *
       * data: project
       * ================================================
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
        projectResponse?.data ||
        projectResponse?.project ||
        projectResponse?.data?.project ||
        null;

      /*
       * ================================================
       * FILES
       * ================================================
       *
       * IMPORTANT:
       * Controller currently creates:
       *
       * files: []
       *
       * Therefore we do NOT invent files here.
       *
       * If backend/AI returns real files,
       * those are displayed.
       * ================================================
       */

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

      /*
       * ================================================
       * SELECT CREATED PROJECT
       * ================================================
       */

      if (createdProject) {
        applySelectedProject(
          createdProject
        );

        /*
         * applySelectedProject may contain
         * backend files, so keep them.
         */

        setGeneratedFiles(
          files
        );

        setSelectedFile(
          files.length > 0
            ? files[0]
            : null
        );
      }

      /*
       * ================================================
       * REFRESH PROJECT LIST
       * ================================================
       */

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

      setPrompt("");

      setActiveTab(
        "preview"
      );
    } catch (err) {
      console.error(
        "Workspace generation error:",
        err
      );

      setError(
        err?.message ||
          "Unable to generate the project right now."
      );
    } finally {
      setLoading(false);
    }
  }


  /* ======================================================
     DEPLOY PROJECT
     ====================================================== */

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
      setDeploying(true);

      setDeploymentStatus(
        "Deploying..."
      );

      /*
       * Controller:
       *
       * data: {
       *   project,
       *   deployment
       * }
       */

      const response =
        await deployProject(
          projectId
        );

      const data =
        response?.data || {};

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

      /*
       * ================================================
       * UPDATE LOCAL PROJECT
       * ================================================
       */

      if (deployedProject) {
        applySelectedProject(
          deployedProject
        );
      }

      setDeploymentStatus(
        normalizeDeploymentStatus(
          deployedProject?.deploymentStatus ||
            "deployed"
        )
      );

      setLiveUrl(
        url
      );

      /*
       * Update project list
       */

      setProjects(
        (previous) =>
          previous.map(
            (project) =>
              getProjectId(
                project
              ) === projectId
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
                      "deployed"
                  }
                : project
          )
      );

      setActiveTab(
        "preview"
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
        err?.message ||
          "Deployment could not be completed."
      );
    } finally {
      setDeploying(false);
    }
  }


  /* ======================================================
     PROJECT NAME
     ====================================================== */

  const projectName =
    getProjectName(
      selectedProject
    );


  /* ======================================================
     PROJECT COUNT
     ====================================================== */

  const projectCount =
    projects.length;


  /* ======================================================
     CURRENT FILE
     ====================================================== */

  const filePreview =
    useMemo(() => {
      if (!selectedFile) {
        return "No project file selected.";
      }

      if (
        selectedFile.content !==
        undefined
      ) {
        return String(
          selectedFile.content
        );
      }

      return `File: ${selectedFile.path || selectedFile.name || "Unknown file"}`;
    }, [selectedFile]);


  /* ======================================================
     QUICK PROMPTS
     ====================================================== */

  const quickPrompts = [
    "Build an AI SaaS dashboard",
    "Create a production-ready landing page",
    "Add authentication and user accounts",
    "Build an admin control center"
  ];


  /* ======================================================
     RENDER
     ====================================================== */

  return (
    <DashboardLayout>

      <main
        className={
          styles.workspace
        }
      >

        {/* ==================================================
            HEADER
            ================================================== */}

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

            <div>

              <div
                className={
                  styles.breadcrumb
                }
              >
                WORKSPACE

                <span>
                  /
                </span>

                {projectName}
              </div>

              <h1>
                {projectName}
              </h1>

              <p>
                Build, preview and deploy
                from one workspace.
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
            >
              Code
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


        {/* ==================================================
            ERROR
            ================================================== */}

        {error && (
          <div
            className={
              styles.errorBanner
            }
          >

            <span>
              !
            </span>

            <div>
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
            >
              ×
            </button>

          </div>
        )}


        {/* ==================================================
            BODY
            ================================================== */}

        <section
          className={
            styles.workspaceBody
          }
        >

          {/* =================================================
              PROJECT RAIL
              ================================================= */}

          <aside
            className={
              styles.projectRail
            }
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
                title="New project"
              >
                +
              </button>

            </div>


            <div
              className={
                styles.projectList
              }
            >

              {projects.length ===
              0 ? (

                <div
                  className={
                    styles.noProjects
                  }
                >
                  No projects yet
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
                      ) || name;

                    const active =
                      getProjectId(
                        selectedProject
                      ) ===
                      getProjectId(
                        project
                      );

                    return (
                      <button
                        key={id}
                        type="button"
                        className={`${
                          styles.projectItem
                        } ${
                          active
                            ? styles.projectItemActive
                            : ""
                        }`}
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
                            .charAt(
                              0
                            )
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
            className={
              styles.buildArea
            }
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

                <span>
                  ZyrionOS Builder
                </span>

                <small>
                  {loading
                    ? "Building"
                    : "Ready"}
                </small>

              </div>


              <div
                className={
                  styles.toolbarRight
                }
              >

                <select
                  value={
                    framework
                  }
                  onChange={(e) =>
                    setFramework(
                      e.target.value
                    )
                  }
                  className={
                    styles.frameworkSelect
                  }
                  disabled={
                    loading
                  }
                >

                  <option value="React">
                    React
                  </option>

                  <option value="Next.js">
                    Next.js
                  </option>

                  <option value="Vue">
                    Vue
                  </option>

                  <option value="Node.js">
                    Node.js
                  </option>

                  <option value="Express">
                    Express
                  </option>

                  <option value="Other">
                    Other
                  </option>

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

                  <h2>
                    What do you want
                    to build?
                  </h2>

                  <p>
                    Describe your product,
                    application, automation
                    or business system.
                    ZyrionOS will turn
                    your idea into a project.
                  </p>


                  <div
                    className={
                      styles.quickPrompts
                    }
                  >

                    {quickPrompts.map(
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

                  <h2>
                    Building your
                    project
                  </h2>

                  <p>
                    ZyrionOS is preparing
                    your application
                    workspace.
                  </p>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <span />
                  </div>

                  <small>
                    Preparing project
                    architecture
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
                        BUILD RESULT
                      </span>

                      <h2>
                        Project generated
                      </h2>

                    </div>

                    <div
                      className={
                        styles.readyBadge
                      }
                    >
                      Ready
                    </div>

                  </div>


                  <div
                    className={
                      styles.resultContent
                    }
                  >

                    {/* ========================================
                        PREVIEW
                        ======================================== */}

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

                          <span />
                          <span />
                          <span />

                          <label>
                            Preview
                          </label>

                        </div>


                        <div
                          className={
                            styles.previewBody
                          }
                        >

                          <div
                            className={
                              styles.previewPlaceholder
                            }
                          >

                            <div>
                              ◇
                            </div>

                            <strong>
                              Project Preview
                            </strong>

                            <p>
                              The project
                              has been created.
                              A live preview
                              will be available
                              after the project
                              is built/deployed.
                            </p>

                          </div>

                        </div>

                      </div>

                    )}


                    {/* ========================================
                        CODE
                        ======================================== */}

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

                          <span>
                            Project Files
                          </span>

                          <span>
                            {
                              generatedFiles.length
                            }
                          </span>

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
                                  styles.noProjects
                                }
                              >
                                No files generated
                                yet.
                              </div>

                            ) : (

                              generatedFiles.map(
                                (
                                  file
                                ) => {

                                  const path =
                                    file?.path ||
                                    file?.name ||
                                    "Unnamed file";

                                  return (
                                    <button
                                      key={
                                        file?._id ||
                                        path
                                      }
                                      type="button"
                                      className={
                                        selectedFile?.path ===
                                        file?.path
                                          ? styles.fileActive
                                          : styles.file
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
                              {selectedFile?.path ||
                                selectedFile?.name ||
                                "No file selected"}
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
                COMMAND BAR
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

                <textarea
                  value={prompt}
                  onChange={(e) =>
                    setPrompt(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key ===
                        "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();

                      handleGenerate();
                    }

                  }}
                  placeholder="Describe a change, feature or project..."
                  disabled={
                    loading
                  }
                />


                <div
                  className={
                    styles.commandFooter
                  }
                >

                  <span>
                    Enter to build
                    <b>
                      {" "}
                      ·{" "}
                    </b>
                    Shift + Enter
                    for new line
                  </span>


                  <button
                    type="button"
                    onClick={
                      handleGenerate
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
                      ? "Building..."
                      : "Build"}

                    <span>
                      ↑
                    </span>

                  </button>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              INSPECTOR
              ================================================= */}

          <aside
            className={
              styles.inspector
            }
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


              {/* BUILD */}

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
                  {
                    generatedFiles.length
                  }
                </strong>

                <small>
                  Backend project files
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
                    deploymentStatus ===
                    "Deployed"
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

                  <a
                    href={
                      liveUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open live project →
                  </a>

                </div>

              )}

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
