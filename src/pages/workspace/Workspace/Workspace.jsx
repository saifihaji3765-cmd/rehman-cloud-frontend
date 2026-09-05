import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import {
  getProjects,
  createProject,
  deployProject
} from "../../../services/workspaceService";

import { generateCode } from "../../../services/aiService";

import styles from "./Workspace.module.css";

function Workspace() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState("React");

  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const [aiResponse, setAiResponse] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);

  const [deploymentStatus, setDeploymentStatus] =
    useState("Not deployed");

  const [liveUrl, setLiveUrl] = useState("");

  const [activeTab, setActiveTab] = useState("preview");

  const [error, setError] = useState("");

  /*
   * ======================================================
   * LOAD PROJECTS
   * ======================================================
   */

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const response = await getProjects();

      const data = response?.data;

      let normalized = [];

      if (Array.isArray(data)) {
        normalized = data;
      } else if (Array.isArray(data?.projects)) {
        normalized = data.projects;
      } else if (Array.isArray(data?.data)) {
        normalized = data.data;
      }

      setProjects(normalized);

      if (normalized.length > 0 && !selectedProject) {
        setSelectedProject(normalized[0]);
      }
    } catch (err) {
      console.error("Workspace project loading error:", err);

      setProjects([]);
    }
  }

  /*
   * ======================================================
   * SELECT PROJECT
   * ======================================================
   */

  function handleSelectProject(project) {
    setSelectedProject(project);

    setAiResponse("");
    setGeneratedFiles([]);
    setSelectedFile(null);

    setDeploymentStatus(
      project?.deploymentStatus || "Not deployed"
    );

    setLiveUrl(project?.liveUrl || "");
  }

  /*
   * ======================================================
   * CREATE / GENERATE PROJECT
   * ======================================================
   */

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Describe what you want to build first.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const userPrompt = prompt.trim();

      /*
       * AI BUILD
       */

      const aiResult = await generateCode(
        userPrompt,
        framework
      );

      let formattedResponse = "";

      if (typeof aiResult === "string") {
        formattedResponse = aiResult;
      } else {
        formattedResponse = JSON.stringify(
          aiResult,
          null,
          2
        );
      }

      setAiResponse(formattedResponse);

      /*
       * CREATE PROJECT
       */

      const projectResponse = await createProject({
        projectName:
          userPrompt.substring(0, 60),

        description: userPrompt,

        framework
      });

      const createdProject =
        projectResponse?.data?.project ||
        projectResponse?.project ||
        projectResponse?.data ||
        null;

      /*
       * GENERATED FILES
       *
       * Temporary representation until
       * backend returns actual project files.
       */

      const files = [
        {
          path: "src/App.jsx",
          type: "React Component"
        },
        {
          path: "src/pages/Dashboard.jsx",
          type: "Page"
        },
        {
          path: "src/pages/Workspace.jsx",
          type: "Page"
        },
        {
          path: "src/services/api.js",
          type: "Service"
        }
      ];

      setGeneratedFiles(files);

      setSelectedFile(files[0]);

      /*
       * SELECT CREATED PROJECT
       */

      if (createdProject) {
        setSelectedProject(createdProject);
      }

      await loadProjects();

      setPrompt("");
      setActiveTab("preview");
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

  /*
   * ======================================================
   * DEPLOY
   * ======================================================
   */

  async function handleDeploy() {
    if (!selectedProject?._id) {
      setError("Select a project before deploying.");
      return;
    }

    try {
      setError("");
      setDeploying(true);

      setDeploymentStatus("Deploying...");

      const response = await deployProject(
        selectedProject._id
      );

      const deployment =
        response?.deployment ||
        response?.data?.deployment ||
        response?.data ||
        {};

      const url =
        deployment?.liveUrl ||
        deployment?.url ||
        "";

      setDeploymentStatus("Deployed");
      setLiveUrl(url);

      setActiveTab("preview");
    } catch (err) {
      console.error(
        "Workspace deployment error:",
        err
      );

      setDeploymentStatus("Deployment failed");

      setError(
        err?.message ||
          "Deployment could not be completed."
      );
    } finally {
      setDeploying(false);
    }
  }

  /*
   * ======================================================
   * PROJECT NAME
   * ======================================================
   */

  const projectName =
    selectedProject?.projectName ||
    selectedProject?.name ||
    "Untitled Project";

  /*
   * ======================================================
   * PROJECT COUNT
   * ======================================================
   */

  const projectCount = projects.length;

  /*
   * ======================================================
   * CURRENT FILE
   * ======================================================
   */

  const filePreview = useMemo(() => {
    if (!selectedFile) {
      return "Select a file from the project files.";
    }

    return `Previewing ${selectedFile.path}`;
  }, [selectedFile]);

  /*
   * ======================================================
   * QUICK PROMPTS
   * ======================================================
   */

  const quickPrompts = [
    "Build an AI SaaS dashboard",
    "Create a production-ready landing page",
    "Add authentication and user accounts",
    "Build an admin control center"
  ];

  return (
    <DashboardLayout>

      <main className={styles.workspace}>

        {/* ==================================================
            WORKSPACE HEADER
            ================================================== */}

        <header className={styles.workspaceHeader}>

          <div className={styles.projectHeading}>

            <div className={styles.projectMark}>
              Z
            </div>

            <div>
              <div className={styles.breadcrumb}>
                WORKSPACE
                <span>/</span>
                {projectName}
              </div>

              <h1>
                {projectName}
              </h1>

              <p>
                Build, preview and deploy from one workspace.
              </p>
            </div>

          </div>

          <div className={styles.headerActions}>

            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() =>
                setActiveTab("preview")
              }
            >
              Preview
            </button>

            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() =>
                setActiveTab("code")
              }
            >
              Code
            </button>

            <button
              type="button"
              className={styles.deployAction}
              onClick={handleDeploy}
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
          <div className={styles.errorBanner}>

            <span>!</span>

            <div>
              <strong>Workspace notice</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
            >
              ×
            </button>

          </div>
        )}

        {/* ==================================================
            WORKSPACE BODY
            ================================================== */}

        <section className={styles.workspaceBody}>

          {/* =================================================
              PROJECT RAIL
              ================================================= */}

          <aside className={styles.projectRail}>

            <div className={styles.railHeader}>

              <div>
                <span>PROJECTS</span>
                <strong>{projectCount}</strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedProject(null);
                  setAiResponse("");
                  setGeneratedFiles([]);
                  setPrompt("");
                }}
                title="New project"
              >
                +
              </button>

            </div>

            <div className={styles.projectList}>

              {projects.length === 0 ? (

                <div className={styles.noProjects}>
                  No projects yet
                </div>

              ) : (

                projects.map((project) => {

                  const name =
                    project?.projectName ||
                    project?.name ||
                    "Untitled Project";

                  const id =
                    project?._id ||
                    project?.id ||
                    name;

                  const active =
                    selectedProject?._id ===
                    project?._id;

                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.projectItem} ${
                        active
                          ? styles.projectItemActive
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectProject(project)
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
                        <strong>{name}</strong>

                        <small>
                          {project?.framework ||
                            "React"}
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
                })
              )}

            </div>

          </aside>

          {/* =================================================
              MAIN AI BUILD AREA
              ================================================= */}

          <section className={styles.buildArea}>

            <div className={styles.buildToolbar}>

              <div className={styles.buildMode}>

                <span className={styles.liveDot} />

                <span>
                  ZyrionOS Builder
                </span>

                <small>
                  {loading
                    ? "Building"
                    : "Ready"}
                </small>

              </div>

              <div className={styles.toolbarRight}>

                <select
                  value={framework}
                  onChange={(e) =>
                    setFramework(
                      e.target.value
                    )
                  }
                  className={styles.frameworkSelect}
                  disabled={loading}
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
                </select>

              </div>

            </div>

            {/* =================================================
                CANVAS
                ================================================= */}

            <div className={styles.canvas}>

              {!aiResponse && !loading ? (

                <div className={styles.emptyWorkspace}>

                  <div className={styles.aiOrb}>
                    Z
                  </div>

                  <h2>
                    What do you want to build?
                  </h2>

                  <p>
                    Describe your product, application,
                    automation or business system.
                    ZyrionOS will turn your idea into
                    a project.
                  </p>

                  <div className={styles.quickPrompts}>

                    {quickPrompts.map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setPrompt(item)
                          }
                        >
                          {item}
                        </button>
                      )
                    )}

                  </div>

                </div>

              ) : loading ? (

                <div className={styles.buildingState}>

                  <div className={styles.loadingOrb}>
                    Z
                  </div>

                  <h2>
                    Building your project
                  </h2>

                  <p>
                    ZyrionOS is preparing your
                    application workspace.
                  </p>

                  <div className={styles.progressTrack}>
                    <span />
                  </div>

                  <small>
                    Preparing project architecture
                  </small>

                </div>

              ) : (

                <div className={styles.resultArea}>

                  <div className={styles.resultHeader}>

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

                  <div className={styles.resultContent}>

                    {activeTab === "preview" && (

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
                              Your generated
                              application will
                              appear here.
                            </p>

                          </div>

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
                          <span>
                            Generated Files
                          </span>

                          <span>
                            {generatedFiles.length}
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

                            {generatedFiles.map(
                              (file) => (
                                <button
                                  key={file.path}
                                  type="button"
                                  className={
                                    selectedFile?.path ===
                                    file.path
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

                                  {file.path}
                                </button>
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
                AI COMMAND BAR
                ================================================= */}

            <div className={styles.commandArea}>

              <div className={styles.commandBox}>

                <textarea
                  value={prompt}
                  onChange={(e) =>
                    setPrompt(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();

                      handleGenerate();
                    }
                  }}
                  placeholder={
                    "Describe a change, feature or project..."
                  }
                  disabled={loading}
                />

                <div
                  className={
                    styles.commandFooter
                  }
                >

                  <span>
                    Enter to build
                    <b> · </b>
                    Shift + Enter for new line
                  </span>

                  <button
                    type="button"
                    onClick={handleGenerate}
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
                    <span>↑</span>
                  </button>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              PROJECT INSPECTOR
              ================================================= */}

          <aside className={styles.inspector}>

            <div className={styles.inspectorHeader}>

              <div>
                <span>PROJECT</span>
                <strong>Inspector</strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("code")
                }
              >
                Code
              </button>

            </div>

            <div className={styles.inspectorContent}>

              {/* PROJECT */}

              <div className={styles.inspectorCard}>

                <span className={styles.cardLabel}>
                  PROJECT
                </span>

                <strong>
                  {projectName}
                </strong>

                <small>
                  {framework}
                </small>

              </div>

              {/* BUILD */}

              <div className={styles.inspectorCard}>

                <span className={styles.cardLabel}>
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

              <div className={styles.inspectorCard}>

                <span className={styles.cardLabel}>
                  PROJECT FILES
                </span>

                <strong>
                  {generatedFiles.length}
                </strong>

                <small>
                  Generated files
                </small>

              </div>

              {/* DEPLOYMENT */}

              <div className={styles.inspectorCard}>

                <span className={styles.cardLabel}>
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

                <div className={styles.liveCard}>

                  <span>
                    LIVE APPLICATION
                  </span>

                  <a
                    href={liveUrl}
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
              className={styles.inspectorDeploy}
              disabled={
                deploying ||
                !selectedProject
              }
              onClick={handleDeploy}
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
