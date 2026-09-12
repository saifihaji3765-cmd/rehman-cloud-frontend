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

import {
  generateCode,
  getGeneratedFiles,
  normalizeAIResponse,
} from "../../../services/aiService";

import styles from "./Workspace.module.css";


/* =========================================================
   ZYRIONOS WORKSPACE
   Enterprise AI Builder
   Real backend state only
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
    description: "Generate from your idea.",
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
   HELPERS
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
  const data =
    response?.data ??
    response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.projects)) {
    return data.projects;
  }

  if (Array.isArray(data?.data?.projects)) {
    return data.data.projects;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
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


/**
 * Extract project files from every real
 * response shape currently supported
 * by the backend.
 */
function normalizeProjectFiles(
  project,
  aiResult
) {
  const possibleCollections = [

    /* -----------------------------------------------
       Saved project
       ----------------------------------------------- */

    project?.files,

    project?.data?.files,

    project?.project?.files,

    project?.data?.project?.files,


    /* -----------------------------------------------
       AI result
       ----------------------------------------------- */

    aiResult?.files,

    aiResult?.data?.files,

    aiResult?.project?.files,

    aiResult?.data?.project?.files,


    /* -----------------------------------------------
       Master Agent orchestration
       ----------------------------------------------- */

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
    const files
    of possibleCollections
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
     DEPLOYMENT STATE
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


  /* =======================================================
     REQUEST CONTROL
  ======================================================= */

  const initialLoadStarted =
    useRef(false);

  const mountedRef =
    useRef(false);


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
      [selectedFile]
    );

  const deploymentIsLive =
    deploymentStatus ===
    "Deployed";


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
     APPLY PROJECT
  ======================================================= */

  const applySelectedProject =
    useCallback(
      (project) => {

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
              selectedProjectRef.current
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
             First real backend project
          ----------------------------------------------- */

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
      (project) => {

        setError("");
        setNotice("");
        setAiResponse("");

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

    setError(
      ""
    );

    setNotice(
      ""
    );

    setMobilePanel(
      "builder"
    );

  }


  /* =======================================================
     CREATE / GENERATE PROJECT
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
         EXTRACT REAL AI FILES
      ----------------------------------------------- */

      const filesFromAI =
        getGeneratedFiles(
          aiResult
        );


      /*
       * Do not create a project without
       * actual generated files.
       *
       * The backend must provide the
       * real project implementation.
       */

      if (
        filesFromAI.length === 0
      ) {

        throw new Error(
          "AI generation completed, but the backend returned no project files."
        );

      }


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

          framework,

          files:
            filesFromAI,

        });


      const projectData =
        projectResponse?.data ??
        projectResponse ??
        {};


      const createdProject =
        projectData?.project ||
        projectData?.data?.project ||
        null;


      /* -----------------------------------------------
         PROJECT RESPONSE FILES
      ----------------------------------------------- */

      const savedFiles =
        normalizeProjectFiles(
          createdProject,
          aiResult
        );


      /*
       * Prefer the actual project returned
       * by the backend. If its response does
       * not include files, use the exact files
       * that were sent to the backend.
       *
       * No placeholders are created.
       */

      const files =
        savedFiles.length > 0
          ? savedFiles
          : filesFromAI;


      /* -----------------------------------------------
         APPLY CREATED PROJECT
      ----------------------------------------------- */

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

      } else {

        /*
         * Project API returned without
         * a usable project object.
         *
         * Refresh only from the real backend.
         */

        await loadProjects();

      }


      /* -----------------------------------------------
         REFRESH REAL BACKEND STATE
      ----------------------------------------------- */

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


      setPrompt(
        ""
      );


      setActiveTab(
        "code"
      );


      setMobilePanel(
        "builder"
      );


      setNotice(
        createdProject
          ? `Project created successfully with ${files.length} real files.`
          : "Build completed. Workspace state was refreshed from the backend."
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

      setLoading(
        false
      );

    }

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


    const reviewPrompt =
      prompt.trim();


    const baseInstruction =
      reviewPrompt
        ? [
            "Review the current project.",
            "",
            "Requested change:",
            reviewPrompt,
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
        getGeneratedFiles(
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


        setNotice(
          `Review completed. ${files.length} real project files returned by the backend.`
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


    if (deploying) {
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


      const responseData =
        response?.data ??
        response ??
        {};


      const deployment =
        responseData?.deployment ||
        responseData?.data?.deployment ||
        {};


      const deployedProject =
        responseData?.project ||
        responseData?.data?.project ||
        null;


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
          (url
            ? "deployed"
            : "pending")
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
        (previous) =>
          previous.map(
            (project) => {

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

                ...(deployedProject ||
                  {}),

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
          ? "Deployment completed successfully."
          : "Deployment request completed. The backend did not return a live URL."
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
     PRIMARY ACTION
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
     PROMPT KEYBOARD
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
                Build, improve, preview and
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
                !selectedProjectId
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


        {/* =================================================
            NOTICE
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


            {/* =================================================
                CREATE PROJECT CARD
            ================================================= */}

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


            {/* =================================================
                PROJECT LIST
            ================================================= */}

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
                    Your projects will appear
                    here after the backend
                    creates them.
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
                      String(
                        id
                      ) ===
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

            {/* =================================================
                BUILDER TOOLBAR
            ================================================= */}

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
                    ZYRIONOS AI COMMAND CENTER
                  </div>


                  <h2>
                    What do you want
                    to build?
                  </h2>


                  <p>
                    Describe an application,
                    automation, feature or
                    business system. ZyrionOS
                    will process your request
                    through the connected
                    project backend.
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
                    Your request is being
                    processed by the connected
                    AI service.
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
                      ? "Inspecting the requested project changes"
                      : "Preparing the requested project"}
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
                        AI BUILD RESULT
                      </span>


                      <h2>
                        {selectedProject
                          ? "Project workspace"
                          : "Build result"}
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


                  {/* =================================================
                      RESULT TABS
                  ================================================= */}

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

                    {/* =======================================
                        PREVIEW
                    ======================================= */}

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


                              <strong>
                                Preview not available
                              </strong>


                              <p>
                                No live preview URL
                                has been returned by
                                the connected backend
                                for this project yet.
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


                    {/* =======================================
                        CODE
                    ======================================= */}

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
                                  The connected backend
                                  has not returned
                                  project files.
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
                AI COMMAND AREA
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
                      ? "ZyrionOS AI · Improve your project"
                      : "ZyrionOS AI · Build your idea"}
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
                      : "Describe the application, product or system you want to build..."
                  }
                  disabled={
                    loading
                  }
                  rows={4}
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


              {/* =================================================
                  QUICK COMMANDS
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
                          (
                            (isDeploy ||
                              isReview) &&
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
                  {getProjectFramework(
                    selectedProject
                  )}
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
                  Files returned by the connected
                  AI/backend services
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


              {/* LIVE APPLICATION */}

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
