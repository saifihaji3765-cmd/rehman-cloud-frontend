import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

import environmentService from "../../../services/environmentService";
import deploymentLogService from "../../../services/deploymentLogService";
import githubService from "../../../services/githubService";

import styles from "./Workspace.module.css";

const FRAMEWORKS = [
  "React",
  "Next.js",
  "Vue",
  "Node.js",
  "Express",
  "Other",
];

const ENVIRONMENTS = [
  "development",
  "preview",
  "production",
];

const QUICK_PROMPTS = [
  [
    "AI SaaS dashboard",
    "Build a production-ready AI SaaS dashboard",
  ],
  [
    "Landing page",
    "Create a production-ready responsive landing page",
  ],
  [
    "Authentication",
    "Add authentication and user accounts",
  ],
  [
    "Admin control center",
    "Build a production-ready admin control center",
  ],
];

/* =========================================================
   API HELPERS
========================================================= */

function unwrap(response) {
  let value =
    response?.data !== undefined
      ? response.data
      : response;

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.data !== undefined
  ) {
    value = value.data;
  }

  return value;
}

function listFrom(response, keys = []) {
  const root = unwrap(response);

  if (Array.isArray(root)) {
    return root;
  }

  for (const key of keys) {
    if (Array.isArray(root?.[key])) {
      return root[key];
    }
  }

  return [];
}

function objectFrom(response, keys = []) {
  const root = unwrap(response);

  if (
    !root ||
    typeof root !== "object" ||
    Array.isArray(root)
  ) {
    return null;
  }

  for (const key of keys) {
    if (
      root[key] &&
      typeof root[key] === "object"
    ) {
      return root[key];
    }
  }

  return root;
}

function errorText(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

/* =========================================================
   PROJECT HELPERS
========================================================= */

function projectId(project) {
  return (
    project?._id ||
    project?.id ||
    project?.projectId ||
    ""
  );
}

function projectName(project) {
  return (
    project?.projectName ||
    project?.name ||
    "New Project"
  );
}

function projectFiles(project) {
  if (Array.isArray(project?.files)) {
    return project.files;
  }

  if (
    Array.isArray(
      project?.project?.files
    )
  ) {
    return project.project.files;
  }

  return [];
}

function filePath(file) {
  return (
    file?.path ||
    file?.filePath ||
    file?.name ||
    file?.filename ||
    "Unnamed file"
  );
}

function fileContent(file) {
  if (
    file?.content !== undefined &&
    file?.content !== null
  ) {
    return String(file.content);
  }

  if (
    file?.code !== undefined &&
    file?.code !== null
  ) {
    return String(file.code);
  }

  return "";
}

function deploymentState(value) {
  const status = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    [
      "success",
      "successful",
      "deployed",
    ].includes(status)
  ) {
    return "Deployed";
  }

  if (
    [
      "deploying",
      "in_progress",
      "in-progress",
      "running",
    ].includes(status)
  ) {
    return "Deploying";
  }

  if (status === "building") {
    return "Building";
  }

  if (
    ["failed", "error"].includes(status)
  ) {
    return "Failed";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Not deployed";
}

function readinessValue(value) {
  return Boolean(
    value?.ready === true ||
      value?.isReady === true ||
      value?.deploymentReady === true
  );
}

function makeMessage(
  role,
  content,
  meta = {}
) {
  return {
    id:
      `${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2),

    role,

    content,

    time:
      new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),

    ...meta,
  };
}

/* =========================================================
   REAL PREVIEW
========================================================= */

function Preview({
  files,
  liveUrl = "",
}) {
  if (liveUrl) {
    return (
      <iframe
        title="Live project preview"
        className={styles.previewFrame}
        src={liveUrl}
        allow="fullscreen"
      />
    );
  }

  const html = useMemo(() => {
    const htmlFile = files.find(
      (file) =>
        /(^|\/)index\.html$/i.test(
          filePath(file)
        )
    );

    return htmlFile
      ? fileContent(htmlFile)
      : "";
  }, [files]);

  if (!html) {
    return (
      <div className={styles.previewEmpty}>
        <div className={styles.previewIcon}>
          Z
        </div>

        <strong>
          No live preview
        </strong>

        <p>
          The backend returned project files,
          but no live preview URL or index.html
          was returned. Open Code to inspect the
          real generated files.
        </p>
      </div>
    );
  }

  return (
    <iframe
      title="Generated project preview"
      className={styles.previewFrame}
      srcDoc={html}
      sandbox="allow-scripts allow-forms allow-modals allow-popups"
    />
  );
}

/* =========================================================
   WORKSPACE
========================================================= */

export default function Workspace() {
  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    project,
    setProject,
  ] = useState(null);

  const [
    files,
    setFiles,
  ] = useState([]);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    prompt,
    setPrompt,
  ] = useState("");

  const [
    framework,
    setFramework,
  ] = useState("React");

  const [
    environment,
    setEnvironment,
  ] = useState("development");

  const [
    environments,
    setEnvironments,
  ] = useState([]);

  const [
    readiness,
    setReadiness,
  ] = useState(null);

  const [
    deploymentLog,
    setDeploymentLog,
  ] = useState(null);

  const [
    github,
    setGithub,
  ] = useState(null);

  const [
    activity,
    setActivity,
  ] = useState([]);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    view,
    setView,
  ] = useState("preview");

  const [
    mobile,
    setMobile,
  ] = useState("workspace");

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const endRef =
    useRef(null);

  const currentId =
    projectId(project);

  /* =======================================================
     ACTIVITY
  ======================================================= */

  const log = useCallback(
    (message, type = "info") => {
      setActivity(
        (previous) =>
          [
            ...previous,
            {
              id:
                `${Date.now()}-` +
                Math.random()
                  .toString(36),

              message,

              type,

              time:
                new Date().toLocaleTimeString(),
            },
          ].slice(-60)
      );
    },
    []
  );

  /* =======================================================
     PROJECT LOADING
  ======================================================= */

  const loadProjects =
    useCallback(
      async (
        preferredProjectId = ""
      ) => {
        try {
          const response =
            await getProjects();

          const list =
            listFrom(response, [
              "projects",
              "items",
            ]);

          setProjects(list);

          const chosen =
            list.find(
              (item) =>
                String(
                  projectId(item)
                ) ===
                String(
                  preferredProjectId
                )
            ) ||
            list[0] ||
            null;

          if (chosen) {
            const nextFiles =
              projectFiles(chosen);

            setProject(chosen);
            setFiles(nextFiles);
            setSelectedFile(
              nextFiles[0] || null
            );

            if (
              chosen.framework &&
              FRAMEWORKS.includes(
                chosen.framework
              )
            ) {
              setFramework(
                chosen.framework
              );
            }
          }
        } catch (err) {
          setError(
            errorText(
              err,
              "Projects could not be loaded."
            )
          );
        }
      },
      []
    );

  /* =======================================================
     BACKEND CONTEXT
  ======================================================= */

  const syncBackend =
    useCallback(
      async (
        id,
        selectedEnvironment
      ) => {
        if (!id) {
          return;
        }

        setSyncing(true);

        const results =
          await Promise.allSettled([
            environmentService.listEnvironments(
              id,
              false
            ),

            deploymentLogService.getLatestLog(
              {
                projectId: id,
              }
            ),

            githubService.getConnections(
              {
                projectId: id,
              }
            ),
          ]);

        /* ENVIRONMENT */

        if (
          results[0].status ===
          "fulfilled"
        ) {
          const list =
            listFrom(
              results[0].value,
              [
                "environments",
                "items",
              ]
            );

          setEnvironments(list);

          const selected =
            list.find(
              (item) =>
                String(
                  item?.name ||
                    item?.environment ||
                    ""
                ).toLowerCase() ===
                String(
                  selectedEnvironment
                ).toLowerCase()
            ) ||
            list[0];

          const environmentName =
            selected?.name ||
            selected?.environment ||
            selectedEnvironment;

          if (selected) {
            setEnvironment(
              environmentName
            );
          }

          try {
            const readinessResponse =
              await environmentService.getDeploymentReadiness(
                id,
                environmentName
              );

            setReadiness(
              objectFrom(
                readinessResponse,
                [
                  "readiness",
                  "deploymentReadiness",
                ]
              )
            );
          } catch {
            setReadiness(null);
          }
        }

        /* DEPLOYMENT LOG */

        if (
          results[1].status ===
          "fulfilled"
        ) {
          const latest =
            objectFrom(
              results[1].value,
              [
                "log",
                "deploymentLog",
                "latest",
              ]
            );

          setDeploymentLog(
            latest
          );
        }

        /* GITHUB */

        if (
          results[2].status ===
          "fulfilled"
        ) {
          const connections =
            listFrom(
              results[2].value,
              [
                "connections",
                "items",
              ]
            );

          const active =
            connections.find(
              (connection) =>
                [
                  "active",
                  "connected",
                ].includes(
                  String(
                    connection?.status ||
                      ""
                  ).toLowerCase()
                )
            ) ||
            connections[0] ||
            null;

          setGithub(active);
        }

        setSyncing(false);
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /* =======================================================
     BACKEND SYNC
  ======================================================= */

  useEffect(() => {
    if (!currentId) {
      return;
    }

    syncBackend(
      currentId,
      environment
    );
  }, [
    currentId,
    environment,
    syncBackend,
  ]);

  /* =======================================================
     DEPLOYMENT LOG POLLING
  ======================================================= */

  useEffect(() => {
    if (!currentId) {
      return undefined;
    }

    let cancelled = false;

    const refresh =
      async () => {
        try {
          const response =
            await deploymentLogService.getLatestLog(
              {
                projectId:
                  currentId,
              }
            );

          if (cancelled) {
            return;
          }

          const latest =
            objectFrom(
              response,
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
          }
        } catch {
          /*
           * Background polling must never
           * replace the main UI error.
           */
        }
      };

    refresh();

    const timer =
      window.setInterval(
        refresh,
        5000
      );

    return () =>
      window.clearInterval(timer);
  }, [currentId]);

  /* =======================================================
     CHAT SCROLL
  ======================================================= */

  useEffect(() => {
    endRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "nearest",
      }
    );
  }, [messages]);

  /* =======================================================
     SELECT PROJECT
  ======================================================= */

  const selectProject =
    useCallback(
      (selected) => {
        const nextFiles =
          projectFiles(selected);

        setProject(selected);
        setFiles(nextFiles);
        setSelectedFile(
          nextFiles[0] || null
        );

        setMessages([]);
        setError("");
        setNotice("");
        setView("preview");
        setMobile("workspace");
      },
      []
    );

  /* =======================================================
     BUILD
  ======================================================= */

  const build =
    useCallback(
      async (
        suppliedPrompt = ""
      ) => {
        const text =
          String(
            suppliedPrompt || prompt
          ).trim();

        if (!text || busy) {
          return;
        }

        setBusy(true);
        setError("");
        setNotice("");
        setMobile("workspace");

        setMessages(
          (previous) => [
            ...previous,
            makeMessage(
              "user",
              text
            ),
          ]
        );

        log(
          "Sending build request to AI Builder.",
          "active"
        );

        try {
          const instruction =
            currentId
              ? [
                  `Update project ${currentId}.`,
                  `Environment: ${environment}.`,
                  `Framework: ${framework}.`,
                  "",
                  "User request:",
                  text,
                  "",
                  "Return complete project files required for the change.",
                  "Preserve existing working functionality.",
                ].join("\n")
              : [
                  `Build a production-ready ${framework} project.`,
                  `Environment: ${environment}.`,
                  "",
                  "User request:",
                  text,
                  "",
                  "Return complete project files.",
                ].join("\n");

          const response =
            await generateCode(
              instruction,
              framework
            );

          const generated =
            getGeneratedFiles(
              response
            ) || [];

          if (!generated.length) {
            throw new Error(
              "AI Builder returned no project files."
            );
          }

          setFiles(
            generated
          );

          setSelectedFile(
            generated[0]
          );

          setMessages(
            (previous) => [
              ...previous,
              makeMessage(
                "assistant",
                normalizeAIResponse(
                  response
                ) ||
                  `Generated ${generated.length} files.`,
                {
                  count:
                    generated.length,
                }
              ),
            ]
          );

          log(
            `AI Builder returned ${generated.length} files.`,
            "success"
          );

          /* EXISTING PROJECT */

          if (currentId) {
            await updateProject(
              currentId,
              {
                files: generated,
              }
            );

            setNotice(
              `Changes saved to ${projectName(
                project
              )}.`
            );

            log(
              "Project changes saved to backend.",
              "success"
            );

            await loadProjects(
              currentId
            );
          }

          /* NEW PROJECT */

          else {
            const generatedName =
              text
                .replace(
                  /\s+/g,
                  " "
                )
                .trim()
                .split(" ")
                .slice(0, 7)
                .join(" ");

            const created =
              await createProject(
                {
                  projectName:
                    generatedName ||
                    "New Project",

                  description:
                    text,

                  framework,

                  files:
                    generated,
                }
              );

            const saved =
              objectFrom(
                created,
                ["project"]
              );

            const newId =
              projectId(saved);

            setNotice(
              "Project created successfully."
            );

            log(
              "Project created and saved to backend.",
              "success"
            );

            await loadProjects(
              newId
            );
          }

          setPrompt("");
          setView("preview");
        } catch (err) {
          const message =
            errorText(
              err,
              "Build failed."
            );

          setError(message);

          setMessages(
            (previous) => [
              ...previous,
              makeMessage(
                "assistant",
                message,
                {
                  error: true,
                }
              ),
            ]
          );

          log(
            message,
            "error"
          );
        } finally {
          setBusy(false);
        }
      },
      [
        prompt,
        busy,
        currentId,
        environment,
        framework,
        project,
        loadProjects,
        log,
      ]
    );

  /* =======================================================
     DEPLOY
  ======================================================= */

  const deploy =
    useCallback(() => {
      if (!currentId) {
        setError(
          "Select a project before deploying."
        );

        return;
      }

      if (!files.length) {
        setError(
          "There are no generated files to deploy."
        );

        return;
      }

      if (
        readiness &&
        !readinessValue(readiness)
      ) {
        setError(
          `${environment} environment is not ready.`
        );

        return;
      }

      setNotice(
        "Opening real deployment flow..."
      );

      window.location.assign(
        `/billing?projectId=${encodeURIComponent(
          currentId
        )}&environment=${encodeURIComponent(
          environment
        )}&intent=deploy`
      );
    }, [
      currentId,
      files.length,
      readiness,
      environment,
    ]);

  /* =======================================================
     REVIEW / FIX
  ======================================================= */

  const review =
    useCallback(() => {
      if (!currentId) {
        setError(
          "Select a project before Review / Fix."
        );

        return;
      }

      const request =
        prompt.trim()
          ? [
              "Review and fix the current project.",
              "",
              `Project ID: ${currentId}`,
              `Environment: ${environment}`,
              "",
              "Requested change:",
              prompt,
              "",
              "Return complete files required for the fixes.",
            ].join("\n")
          : [
              "Review the current project.",
              "",
              `Project ID: ${currentId}`,
              `Environment: ${environment}`,
              "",
              "Check runtime errors, broken functionality, responsive issues and incomplete implementation.",
              "Return complete files required for fixes.",
            ].join("\n");

      build(request);
    }, [
      currentId,
      environment,
      prompt,
      build,
    ]);

  /* =======================================================
     NEW PROJECT
  ======================================================= */

  const newProject =
    useCallback(() => {
      setProject(null);
      setFiles([]);
      setSelectedFile(null);
      setPrompt("");
      setMessages([]);
      setError("");
      setNotice("");
      setView("preview");
      setMobile("chat");
      setReadiness(null);
      setDeploymentLog(null);
    }, []);

  const deploymentStatus =
    deploymentState(
      deploymentLog?.status ||
        deploymentLog?.deploymentStatus ||
        project?.deploymentStatus
    );

  const environmentReady =
    readinessValue(
      readiness
    );

  const livePreviewUrl =
    project?.previewUrl ||
    project?.preview?.url ||
    project?.preview?.liveUrl ||
    project?.liveUrl ||
    project?.deploymentUrl ||
    project?.deployment?.url ||
    "";

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
        {/* HEADER */}

        <header
          className={
            styles.header
          }
        >
          <div
            className={
              styles.brand
            }
          >
            <b>Z</b>

            <div>
              <span>
                ZYRIONOS WORKSPACE
              </span>

              <strong>
                {projectName(
                  project
                )}
              </strong>
            </div>
          </div>

          <div
            className={
              styles.status
            }
          >
            <i
              data-active={
                busy
              }
            />

            {busy
              ? "Working"
              : "Ready"}

            {syncing
              ? " · Syncing"
              : ""}
          </div>

          <div
            className={
              styles.environment
            }
          >
            <label>
              Environment
            </label>

            <select
              value={
                environment
              }
              onChange={(event) =>
                setEnvironment(
                  event.target.value
                )
              }
              disabled={busy}
            >
              {(
                environments.length
                  ? environments
                  : ENVIRONMENTS.map(
                      (name) => ({
                        name,
                      })
                    )
              ).map(
                (item) => {
                  const name =
                    item?.name ||
                    item?.environment;

                  return (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  );
                }
              )}
            </select>

            <em
              data-ready={
                environmentReady
              }
            >
              {readiness
                ? environmentReady
                  ? "Ready"
                  : "Check"
                : "—"}
            </em>
          </div>

          <div
            className={
              styles.headerActions
            }
          >
            <button
              type="button"
              onClick={
                newProject
              }
            >
              New Project
            </button>

            <button
              type="button"
              onClick={() =>
                setMobile(
                  "activity"
                )
              }
            >
              Activity
            </button>

            <button
              type="button"
              className={
                styles.deploy
              }
              onClick={
                deploy
              }
              disabled={
                !currentId ||
                !files.length ||
                busy
              }
            >
              Deploy
            </button>
          </div>
        </header>

        {/* ALERT */}

        {(error || notice) && (
          <div
            className={
              error
                ? styles.alertError
                : styles.alertNotice
            }
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
            >
              ×
            </button>
          </div>
        )}

        {/* MOBILE NAV */}

        <nav
          className={
            styles.mobileNav
          }
        >
          {[
            [
              "projects",
              "Projects",
            ],
            [
              "workspace",
              "Workspace",
            ],
            ["chat", "AI"],
            [
              "activity",
              "Activity",
            ],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  mobile === value
                    ? styles.mobileActive
                    : ""
                }
                onClick={() =>
                  setMobile(
                    value
                  )
                }
              >
                {label}
              </button>
            )
          )}
        </nav>

        {/* BODY */}

        <section
          className={
            styles.body
          }
        >
          {/* PROJECTS */}

          <aside
            className={`${styles.projects} ${
              mobile === "projects"
                ? styles.mobilePanel
                : ""
            }`}
          >
            <div
              className={
                styles.sectionTitle
              }
            >
              <span>
                WORKSPACE
              </span>

              <strong>
                Projects
              </strong>

              <button
                type="button"
                onClick={
                  newProject
                }
              >
                +
              </button>
            </div>

            <small
              className={
                styles.count
              }
            >
              {projects.length}{" "}
              project
              {projects.length ===
              1
                ? ""
                : "s"}
            </small>

            <div
              className={
                styles.projectList
              }
            >
              {projects.map(
                (item) => {
                  const id =
                    projectId(
                      item
                    );

                  const active =
                    String(id) ===
                    String(
                      currentId
                    );

                  return (
                    <button
                      key={id}
                      type="button"
                      className={
                        active
                          ? styles.projectActive
                          : ""
                      }
                      onClick={() =>
                        selectProject(
                          item
                        )
                      }
                    >
                      <b>Z</b>

                      <span>
                        <strong>
                          {projectName(
                            item
                          )}
                        </strong>

                        <small>
                          {item?.framework ||
                            "React"}
                        </small>
                      </span>

                      ›
                    </button>
                  );
                }
              )}

              {!projects.length && (
                <div
                  className={
                    styles.emptySmall
                  }
                >
                  No projects yet.
                </div>
              )}
            </div>

            <footer>
              {github
                ? "GitHub connected"
                : "GitHub not connected"}

              <br />

              {environments.length}{" "}
              environments
            </footer>
          </aside>

          {/* CENTER */}

          <section
            className={`${styles.center} ${
              mobile ===
              "workspace"
                ? styles.mobileCenter
                : ""
            }`}
          >
            <div
              className={
                styles.toolbar
              }
            >
              <div>
                <button
                  type="button"
                  className={
                    view === "preview"
                      ? styles.activeTab
                      : ""
                  }
                  onClick={() =>
                    setView(
                      "preview"
                    )
                  }
                >
                  Preview
                </button>

                <button
                  type="button"
                  className={
                    view === "code"
                      ? styles.activeTab
                      : ""
                  }
                  onClick={() =>
                    setView(
                      "code"
                    )
                  }
                  disabled={
                    !files.length
                  }
                >
                  Code
                </button>

                <select
                  value={
                    framework
                  }
                  onChange={(
                    event
                  ) =>
                    setFramework(
                      event.target
                        .value
                    )
                  }
                  disabled={busy}
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

              <span>
                {deploymentStatus}
              </span>
            </div>

            <div
              className={
                styles.visual
              }
            >
              {view ===
              "preview" ? (
                <div
                  className={
                    styles.preview
                  }
                >
                  <div
                    className={
                      styles.previewBar
                    }
                  >
                    <span>
                      ● ● ●
                    </span>

                    <strong>
                      {projectName(
                        project
                      )}
                    </strong>
                  </div>

                  {files.length ? (
                    <Preview
                      files={
                        files
                      }
                      liveUrl={
                        livePreviewUrl
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
                          styles.previewIcon
                        }
                      >
                        Z
                      </div>

                      <strong>
                        Workspace ready
                      </strong>

                      <p>
                        Build something
                        with the AI
                        Builder. The
                        workspace only
                        displays data
                        returned by the
                        backend.
                      </p>

                      <div
                        className={
                          styles.quick
                        }
                      >
                        {QUICK_PROMPTS.map(
                          ([
                            label,
                            value,
                          ]) => (
                            <button
                              key={
                                label
                              }
                              type="button"
                              onClick={() => {
                                setPrompt(
                                  value
                                );

                                setMobile(
                                  "chat"
                                );
                              }}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={
                    styles.code
                  }
                >
                  <div
                    className={
                      styles.codeHead
                    }
                  >
                    <strong>
                      {selectedFile
                        ? filePath(
                            selectedFile
                          )
                        : "No file selected"}
                    </strong>
                  </div>

                  <pre>
                    {selectedFile
                      ? fileContent(
                          selectedFile
                        )
                      : "Select a generated file."}
                  </pre>
                </div>
              )}
            </div>
          </section>

          {/* AI CHAT */}

          <aside
            className={`${styles.chat} ${
              mobile === "chat"
                ? styles.mobileChat
                : ""
            }`}
          >
            <div
              className={
                styles.chatHead
              }
            >
              <div>
                <span>
                  AI BUILDER
                </span>

                <strong>
                  Build with ZyrionOS
                </strong>
              </div>

              <i
                data-active={
                  busy
                }
              >
                {busy
                  ? "Working"
                  : "Online"}
              </i>
            </div>

            <div
              className={
                styles.messages
              }
            >
              {messages.length ? (
                messages.map(
                  (message) => (
                    <article
                      key={
                        message.id
                      }
                      className={
                        message.role ===
                        "user"
                          ? styles.userMessage
                          : message.error
                          ? styles.errorMessage
                          : styles.aiMessage
                      }
                    >
                      <small>
                        {message.role ===
                        "user"
                          ? "YOU"
                          : "ZYRIONOS AI"}{" "}
                        ·{" "}
                        {message.time}
                      </small>

                      <p>
                        {
                          message.content
                        }
                      </p>

                      {message.count ? (
                        <em>
                          {
                            message.count
                          }{" "}
                          files
                        </em>
                      ) : null}
                    </article>
                  )
                )
              ) : (
                <div
                  className={
                    styles.chatEmpty
                  }
                >
                  <div
                    className={
                      styles.previewIcon
                    }
                  >
                    Z
                  </div>

                  <strong>
                    What should we build?
                  </strong>

                  <p>
                    Describe a real
                    project or change.
                    The request goes
                    directly to the
                    backend AI service.
                  </p>

                  {QUICK_PROMPTS.map(
                    ([
                      label,
                      value,
                    ]) => (
                      <button
                        key={
                          label
                        }
                        type="button"
                        onClick={() =>
                          setPrompt(
                            value
                          )
                        }
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              )}

              <div
                ref={endRef}
              />
            </div>

            <div
              className={
                styles.quickActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    "Create a production-ready responsive landing page"
                  )
                }
                disabled={busy}
              >
                Landing
              </button>

              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    "Build a production-ready admin dashboard"
                  )
                }
                disabled={busy}
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={
                  review
                }
                disabled={
                  busy ||
                  !currentId
                }
              >
                Review / Fix
              </button>
            </div>

            <form
              className={
                styles.composer
              }
              onSubmit={(event) => {
                event.preventDefault();
                build();
              }}
            >
              <textarea
                value={prompt}
                onChange={(event) =>
                  setPrompt(
                    event.target
                      .value
                  )
                }
                placeholder={
                  currentId
                    ? "Describe the change you want..."
                    : "Describe what you want to build..."
                }
                disabled={busy}
              />

              <div>
                <span>
                  ENV ·{" "}
                  {environment}
                </span>

                <button
                  type="submit"
                  disabled={
                    busy ||
                    !prompt.trim()
                  }
                >
                  {busy
                    ? "Working..."
                    : "Build"}
                </button>
              </div>
            </form>
          </aside>

          {/* ACTIVITY */}

          <aside
            className={`${styles.activity} ${
              mobile ===
              "activity"
                ? styles.mobileActivity
                : ""
            }`}
          >
            <div
              className={
                styles.activityHead
              }
            >
              <span>
                BACKEND ACTIVITY
              </span>

              <strong>
                Deployment & workspace
              </strong>
            </div>

            {deploymentLog && (
              <div
                className={
                  styles.logCard
                }
              >
                <strong>
                  Latest deployment
                </strong>

                <b>
                  {
                    deploymentStatus
                  }
                </b>

                {deploymentLog
                  .stage && (
                  <small>
                    Stage:{" "}
                    {
                      deploymentLog.stage
                    }
                  </small>
                )}

                {deploymentLog
                  .message && (
                  <p>
                    {
                      deploymentLog.message
                    }
                  </p>
                )}
              </div>
            )}

            {activity
              .slice()
              .reverse()
              .map(
                (item) => (
                  <div
                    className={
                      styles.activityItem
                    }
                    key={
                      item.id
                    }
                  >
                    <i
                      data-type={
                        item.type
                      }
                    />

                    <span>
                      {
                        item.message
                      }

                      <small>
                        {
                          item.time
                        }
                      </small>
                    </span>
                  </div>
                )
              )}
          </aside>
        </section>
      </main>
    </DashboardLayout>
  );
}
