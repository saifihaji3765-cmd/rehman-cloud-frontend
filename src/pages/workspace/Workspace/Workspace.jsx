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

import environmentService from "../../../services/environmentService";
import deploymentLogService from "../../../services/deploymentLogService";
import githubService from "../../../services/githubService";

import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

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
   RESPONSE HELPERS
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
    error?.data?.message ||
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

function fileExtension(path = "") {
  const clean =
    String(path)
      .split("?")[0]
      .split("#")[0];

  const match =
    clean.match(
      /\.([a-z0-9]+)$/i
    );

  return match
    ? match[1].toLowerCase()
    : "";
}

function isHtmlProject(files) {
  return files.some(
    (file) =>
      /(^|\/)index\.html$/i.test(
        filePath(file)
      )
  );
}

function isReactProject(
  files,
  selectedFramework
) {
  if (
    ["React", "Next.js"].includes(
      selectedFramework
    )
  ) {
    return files.some(
      (file) =>
        /\.(jsx|tsx)$/i.test(
          filePath(file)
        )
    );
  }

  return files.some(
    (file) =>
      /\.(jsx|tsx)$/i.test(
        filePath(file)
      )
  );
}

/* =========================================================
   DEPLOYMENT HELPERS
========================================================= */

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
      "completed",
      "complete",
      "live",
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
      "active",
    ].includes(status)
  ) {
    return "Deploying";
  }

  if (
    [
      "building",
      "build",
    ].includes(status)
  ) {
    return "Building";
  }

  if (
    [
      "failed",
      "error",
      "failure",
    ].includes(status)
  ) {
    return "Failed";
  }

  if (
    [
      "pending",
      "queued",
    ].includes(status)
  ) {
    return "Pending";
  }

  return "Not deployed";
}

function deploymentProgress(log) {
  const value =
    Number(
      log?.progress ??
        log?.percentage ??
        log?.percent ??
        log?.progressPercent ??
        0
    );

  if (
    Number.isFinite(value) &&
    value >= 0
  ) {
    return Math.min(
      100,
      Math.max(0, value)
    );
  }

  return 0;
}

function readinessValue(value) {
  return Boolean(
    value?.ready === true ||
      value?.isReady === true ||
      value?.deploymentReady === true
  );
}

/* =========================================================
   MESSAGE
========================================================= */

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

    content:

      content ||
      "",

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
   HTML PREVIEW
========================================================= */

function cleanHtmlForPreview(html) {
  if (!html) {
    return "";
  }

  let output =
    String(html);

  /*
   * A generated index.html often contains:
   *
   * <script type="module" src="/src/main.jsx">
   *
   * That path does not exist inside a normal srcDoc iframe.
   * Leaving it untouched makes the browser show a blank
   * application or an error.
   *
   * Remove only external /src module scripts here.
   * Inline scripts remain available.
   */

  output =
    output.replace(
      /<script\b[^>]*\bsrc=["']\/src\/[^"']+["'][^>]*>\s*<\/script>/gi,
      ""
    );

  output =
    output.replace(
      /<script\b[^>]*\bsrc=["']\.?\/src\/[^"']+["'][^>]*>\s*<\/script>/gi,
      ""
    );

  /*
   * Make relative assets work reasonably inside srcDoc.
   */

  if (
    !/<base\s/i.test(output)
  ) {
    output =
      output.replace(
        /<head([^>]*)>/i,
        `<head$1><base href="/" />`
      );
  }

  return output;
}

/* =========================================================
   SANDPACK FILES
========================================================= */

function createSandpackFiles(
  files
) {
  const result = {};

  for (const file of files) {
    const path =
      filePath(file);

    if (!path) {
      continue;
    }

    let normalized =
      String(path).trim();

    if (
      !normalized.startsWith("/")
    ) {
      normalized =
        `/${normalized}`;
    }

    result[normalized] =
      {
        code:
          fileContent(file),
      };
  }

  /*
   * Sandpack needs a usable entry.
   * If the generated project does not provide one,
   * create a tiny fallback entry.
   */

  const hasEntry =
    Object.keys(result).some(
      (path) =>
        /\/(main|index)\.(jsx|tsx|js|ts)$/i.test(
          path
        )
    );

  if (!hasEntry) {
    result["/src/App.jsx"] = {
      code: `
export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 32,
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      <div>
        <h1>ZyrionOS Preview</h1>
        <p>The generated project does not expose a browser entry file yet.</p>
      </div>
    </div>
  );
}
      `.trim(),
    };

    result["/src/main.jsx"] = {
      code: `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
      `.trim(),
    };
  }

  return result;
}

/* =========================================================
   PREVIEW
========================================================= */

function Preview({
  files,
  liveUrl = "",
  framework = "React",
}) {
  const htmlFile =
    files.find(
      (file) =>
        /(^|\/)index\.html$/i.test(
          filePath(file)
        )
    ) || null;

  const hasReactFiles =
    isReactProject(
      files,
      framework
    );

  const html =
    useMemo(
      () =>
        htmlFile
          ? cleanHtmlForPreview(
              fileContent(
                htmlFile
              )
            )
          : "",
      [htmlFile]
    );

  const sandpackFiles =
    useMemo(
      () =>
        hasReactFiles
          ? createSandpackFiles(
              files
            )
          : {},
      [files, hasReactFiles]
    );

  if (liveUrl) {
    return (
      <iframe
        title="Live project preview"
        className={
          styles.previewFrame
        }
        src={liveUrl}
        allow="fullscreen"
      />
    );
  }

  /*
   * React/JSX/TSX projects use a real browser
   * runtime instead of displaying source code.
   */

  if (
    hasReactFiles &&
    !["Next.js"].includes(
      framework
    )
  ) {
    const template =
      files.some(
        (file) =>
          /\.tsx$/i.test(
            filePath(file)
          )
      )
        ? "react-ts"
        : "react";

    return (
      <div
        className={
          styles.sandpackShell
        }
      >
        <SandpackProvider
          template={template}
          files={
            sandpackFiles
          }
          options={{
            autorun: true,
            autoReload: true,
            recompileMode:
              "delayed",
            recompileDelay: 300,
          }}
        >
          <SandpackPreview
            className={
              styles.sandpackPreview
            }
          />
        </SandpackProvider>
      </div>
    );
  }

  /*
   * Plain HTML projects use srcDoc.
   */

  if (html) {
    return (
      <iframe
        title="Generated HTML preview"
        className={
          styles.previewFrame
        }
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-modals allow-popups"
      />
    );
  }

  return (
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
        Preview unavailable
      </strong>

      <p>
        The backend returned project
        files, but no browser preview
        entry or live deployment URL
        was found.
      </p>
    </div>
  );
}

/* =========================================================
   MOBILE DRAWER HEADER
========================================================= */

function MobilePanelHeader({
  title,
  subtitle,
  onClose,
}) {
  return (
    <div
      className={
        styles.mobilePanelHeader
      }
    >
      <div>
        <span>
          ZYRIONOS
        </span>

        <strong>
          {title}
        </strong>

        {subtitle ? (
          <small>
            {subtitle}
          </small>
        ) : null}
      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Close panel"
      >
        ×
      </button>
    </div>
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
  ] = useState(
    "development"
  );

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

  const log =
    useCallback(
      (
        message,
        type = "info"
      ) => {
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
            ].slice(-80)
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
            listFrom(
              response,
              [
                "projects",
                "items",
              ]
            );

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

          if (!chosen) {
            return;
          }

          const nextFiles =
            projectFiles(
              chosen
            );

          setProject(
            chosen
          );

          setFiles(
            nextFiles
          );

          setSelectedFile(
            nextFiles[0] ||
              null
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

        try {
          const results =
            await Promise.allSettled([
              environmentService.listEnvironments(
                id,
                false
              ),

              deploymentLogService.getLatestLog(
                {
                  projectId:
                    id,
                }
              ),

              githubService.getConnections(
                {
                  projectId:
                    id,
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

            setEnvironments(
              list
            );

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
              list[0] ||
              null;

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
              setReadiness(
                null
              );
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

            setGithub(
              active
            );
          }
        } finally {
          setSyncing(
            false
          );
        }
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
     DEPLOYMENT POLLING
  ======================================================= */

  useEffect(() => {
    if (!currentId) {
      return undefined;
    }

    let cancelled =
      false;

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
           * Background polling intentionally
           * does not interrupt the workspace.
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
      window.clearInterval(
        timer
      );
  }, [currentId]);

  /* =======================================================
     CHAT SCROLL
  ======================================================= */

  useEffect(() => {
    endRef.current?.scrollIntoView(
      {
        behavior:
          "smooth",
        block:
          "nearest",
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
          projectFiles(
            selected
          );

        setProject(
          selected
        );

        setFiles(
          nextFiles
        );

        setSelectedFile(
          nextFiles[0] ||
            null
        );

        if (
          selected?.framework &&
          FRAMEWORKS.includes(
            selected.framework
          )
        ) {
          setFramework(
            selected.framework
          );
        }

        setMessages([]);
        setError("");
        setNotice("");
        setView("preview");
        setMobile(
          "workspace"
        );
      },
      []
    );

  /* =======================================================
     SELECT FILE
  ======================================================= */

  const selectFile =
    useCallback(
      (file) => {
        setSelectedFile(
          file
        );

        setView(
          "code"
        );
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
            suppliedPrompt ||
              prompt
          ).trim();

        if (
          !text ||
          busy
        ) {
          return;
        }

        setBusy(
          true
        );

        setError("");
        setNotice("");

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
                  "Do not replace working files unnecessarily.",
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

          if (
            !generated.length
          ) {
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

          if (currentId) {
            await updateProject(
              currentId,
              {
                files:
                  generated,
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

            await syncBackend(
              currentId,
              environment
            );
          } else {
            const generatedName =
              text
                .replace(
                  /\s+/g,
                  " "
                )
                .trim()
                .split(" ")
                .slice(
                  0,
                  7
                )
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
                [
                  "project",
                ]
              );

            const newId =
              projectId(
                saved
              );

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

            if (newId) {
              await syncBackend(
                newId,
                environment
              );
            }
          }

          setPrompt("");
          setView(
            "preview"
          );
          setMobile(
            "workspace"
          );
        } catch (err) {
          const message =
            errorText(
              err,
              "Build failed."
            );

          setError(
            message
          );

          setMessages(
            (previous) => [
              ...previous,
              makeMessage(
                "assistant",
                message,
                {
                  error:
                    true,
                }
              ),
            ]
          );

          log(
            message,
            "error"
          );
        } finally {
          setBusy(
            false
          );
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
        syncBackend,
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
        !readinessValue(
          readiness
        )
      ) {
        setError(
          `${environment} environment is not ready.`
        );

        return;
      }

      setNotice(
        "Opening deployment and billing flow..."
      );

      log(
        "Deployment flow opened.",
        "active"
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
      log,
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

      build(
        request
      );
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
      setProject(
        null
      );

      setFiles(
        []
      );

      setSelectedFile(
        null
      );

      setPrompt(
        ""
      );

      setMessages(
        []
      );

      setError(
        ""
      );

      setNotice(
        ""
      );

      setView(
        "preview"
      );

      setMobile(
        "chat"
      );

      setReadiness(
        null
      );

      setDeploymentLog(
        null
      );

      setGithub(
        null
      );
    }, []);

  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  const useQuickPrompt =
    useCallback(
      (value) => {
        setPrompt(
          value
        );

        setMobile(
          "chat"
        );
      },
      []
    );

  /* =======================================================
     DERIVED STATE
  ======================================================= */

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

  const progress =
    deploymentProgress(
      deploymentLog
    );

  const activeProjectLabel =
    project
      ? projectName(
          project
        )
      : "New Project";

  const githubConnected =
    Boolean(
      github &&
        [
          "active",
          "connected",
        ].includes(
          String(
            github?.status ||
              ""
          ).toLowerCase()
        )
    );

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
            styles.header
          }
        >
          <div
            className={
              styles.brand
            }
          >
            <b>
              Z
            </b>

            <div>
              <span>
                ZYRIONOS WORKSPACE
              </span>

              <strong>
                {
                  activeProjectLabel
                }
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
              onChange={(
                event
              ) =>
                setEnvironment(
                  event.target
                    .value
                )
              }
              disabled={
                busy
              }
            >
              {(
                environments.length
                  ? environments
                  : ENVIRONMENTS.map(
                      (
                        name
                      ) => ({
                        name,
                      })
                    )
              ).map(
                (
                  item
                ) => {
                  const name =
                    item?.name ||
                    item?.environment;

                  return (
                    <option
                      key={
                        name
                      }
                      value={
                        name
                      }
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

        {/* =================================================
            ALERT
        ================================================= */}

        {(error ||
          notice) && (
          <div
            className={
              error
                ? styles.alertError
                : styles.alertNotice
            }
          >
            <span>
              {error ||
                notice}
            </span>

            <button
              type="button"
              onClick={() => {
                setError(
                  ""
                );

                setNotice(
                  ""
                );
              }}
              aria-label="Dismiss notification"
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
          {[
            [
              "projects",
              "Projects",
            ],
            [
              "workspace",
              "Workspace",
            ],
            [
              "chat",
              "AI Builder",
            ],
            [
              "activity",
              "Activity",
            ],
          ].map(
            ([
              value,
              label,
            ]) => (
              <button
                key={
                  value
                }
                type="button"
                className={
                  mobile ===
                  value
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

        {/* =================================================
            BODY
        ================================================= */}

        <section
          className={
            styles.body
          }
        >
          {/* =================================================
              PROJECTS
          ================================================= */}

          <aside
            className={`${styles.projects} ${
              mobile ===
              "projects"
                ? styles.mobilePanel
                : ""
            }`}
          >
            <MobilePanelHeader
              title="Projects"
              subtitle={`${projects.length} project${
                projects.length ===
                1
                  ? ""
                  : "s"
              }`}
              onClose={() =>
                setMobile(
                  "workspace"
                )
              }
            />

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
                aria-label="Create project"
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
                (
                  item
                ) => {
                  const id =
                    projectId(
                      item
                    );

                  const active =
                    String(
                      id
                    ) ===
                    String(
                      currentId
                    );

                  return (
                    <button
                      key={
                        id
                      }
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
                      <b>
                        Z
                      </b>

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

                      <em>
                        ›
                      </em>
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
                  <strong>
                    No projects yet
                  </strong>

                  <span>
                    Start with the AI Builder.
                  </span>
                </div>
              )}
            </div>

            <footer>
              <span
                data-connected={
                  githubConnected
                }
              >
                {githubConnected
                  ? "● GitHub connected"
                  : "○ GitHub not connected"}
              </span>

              <br />

              {environments.length}{" "}
              environment
              {environments.length ===
              1
                ? ""
                : "s"}
            </footer>
          </aside>

          {/* =================================================
              CENTER WORKSPACE
          ================================================= */}

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
                    view ===
                    "preview"
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
                    view ===
                    "code"
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
                  disabled={
                    busy
                  }
                >
                  {FRAMEWORKS.map(
                    (
                      item
                    ) => (
                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                className={
                  styles.toolbarStatus
                }
              >
                <span
                  data-state={
                    deploymentStatus
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )
                  }
                >
                  {deploymentStatus}
                </span>

                {files.length ? (
                  <small>
                    {files.length}{" "}
                    files
                  </small>
                ) : null}
              </div>
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
                    <div
                      className={
                        styles.previewDots
                      }
                    >
                      <i />
                      <i />
                      <i />
                    </div>

                    <strong>
                      {
                        activeProjectLabel
                      }
                    </strong>

                    <span>
                      {livePreviewUrl
                        ? "LIVE"
                        : "LOCAL PREVIEW"}
                    </span>
                  </div>

                  {files.length ? (
                    <Preview
                      files={
                        files
                      }
                      liveUrl={
                        livePreviewUrl
                      }
                      framework={
                        framework
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
                        Builder. Your
                        generated project
                        will appear here
                        as a real preview.
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
                              onClick={() =>
                                useQuickPrompt(
                                  value
                                )
                              }
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
                    <div>
                      <span>
                        GENERATED FILE
                      </span>

                      <strong>
                        {selectedFile
                          ? filePath(
                              selectedFile
                            )
                          : "No file selected"}
                      </strong>
                    </div>

                    <small>
                      {selectedFile
                        ? fileExtension(
                            filePath(
                              selectedFile
                            )
                          ).toUpperCase()
                        : ""}
                    </small>
                  </div>

                  <div
                    className={
                      styles.codeBody
                    }
                  >
                    <div
                      className={
                        styles.fileRail
                      }
                    >
                      {files.map(
                        (
                          file,
                          index
                        ) => {
                          const active =
                            filePath(
                              selectedFile
                            ) ===
                            filePath(
                              file
                            );

                          return (
                            <button
                              key={
                                `${filePath(
                                  file
                                )}-${index}`
                              }
                              type="button"
                              className={
                                active
                                  ? styles.fileActive
                                  : ""
                              }
                              onClick={() =>
                                selectFile(
                                  file
                                )
                              }
                            >
                              {filePath(
                                file
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <pre>
                      {selectedFile
                        ? fileContent(
                            selectedFile
                          )
                        : "Select a generated file."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              AI BUILDER
          ================================================= */}

          <aside
            className={`${styles.chat} ${
              mobile ===
              "chat"
                ? styles.mobileChat
                : ""
            }`}
          >
            <MobilePanelHeader
              title="AI Builder"
              subtitle={
                currentId
                  ? `Project: ${activeProjectLabel}`
                  : "Create a new project"
              }
              onClose={() =>
                setMobile(
                  "workspace"
                )
              }
            />

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
                styles.contextStrip
              }
            >
              <span>
                ENV
                <b>
                  {
                    environment
                  }
                </b>
              </span>

              <span>
                MODEL
                <b>
                  AI Builder
                </b>
              </span>
            </div>

            <div
              className={
                styles.messages
              }
            >
              {messages.length ? (
                messages.map(
                  (
                    message
                  ) => (
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
                        {
                          message.time
                        }
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
                    ZyrionOS sends the
                    request to the
                    backend AI Builder.
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
                ref={
                  endRef
                }
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
                disabled={
                  busy
                }
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
                disabled={
                  busy
                }
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
              onSubmit={(
                event
              ) => {
                event.preventDefault();

                build();
              }}
            >
              <textarea
                value={
                  prompt
                }
                onChange={(
                  event
                ) =>
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
                disabled={
                  busy
                }
              />

              <div>
                <span>
                  ENV ·{" "}
                  {
                    environment
                  }
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

          {/* =================================================
              ACTIVITY
          ================================================= */}

          <aside
            className={`${styles.activity} ${
              mobile ===
              "activity"
                ? styles.mobileActivity
                : ""
            }`}
          >
            <MobilePanelHeader
              title="Activity"
              subtitle="Deployment & workspace"
              onClose={() =>
                setMobile(
                  "workspace"
                )
              }
            />

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

            {/* DEPLOYMENT STATUS */}

            <div
              className={
                styles.deploymentCard
              }
            >
              <div
                className={
                  styles.deploymentTop
                }
              >
                <div>
                  <span>
                    DEPLOYMENT
                  </span>

                  <strong>
                    {
                      deploymentStatus
                    }
                  </strong>
                </div>

                <b
                  data-state={
                    deploymentStatus
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )
                  }
                >
                  {deploymentStatus}
                </b>
              </div>

              <div
                className={
                  styles.progressTrack
                }
              >
                <span
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div
                className={
                  styles.deploymentMeta
                }
              >
                <span>
                  {deploymentLog?.stage ||
                    "Waiting"}
                </span>

                <span>
                  {progress}%
                </span>
              </div>
            </div>

            {/* ENVIRONMENT STATUS */}

            <div
              className={
                styles.statusCard
              }
            >
              <div>
                <span>
                  ENVIRONMENT
                </span>

                <strong>
                  {
                    environment
                  }
                </strong>
              </div>

              <b
                data-ready={
                  environmentReady
                }
              >
                {environmentReady
                  ? "Ready"
                  : readiness
                  ? "Check"
                  : "Unknown"}
              </b>
            </div>

            {/* GITHUB STATUS */}

            <div
              className={
                styles.statusCard
              }
            >
              <div>
                <span>
                  SOURCE CONTROL
                </span>

                <strong>
                  GitHub
                </strong>
              </div>

              <b
                data-ready={
                  githubConnected
                }
              >
                {githubConnected
                  ? "Connected"
                  : "Not connected"}
              </b>
            </div>

            {/* LATEST LOG */}

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

                {deploymentLog.stage && (
                  <small>
                    Stage:{" "}
                    {
                      deploymentLog.stage
                    }
                  </small>
                )}

                {deploymentLog.message && (
                  <p>
                    {
                      deploymentLog.message
                    }
                  </p>
                )}
              </div>
            )}

            {/* LOCAL ACTIVITY */}

            <div
              className={
                styles.activityList
              }
            >
              {activity
                .slice()
                .reverse()
                .map(
                  (
                    item
                  ) => (
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

              {!activity.length &&
                !deploymentLog && (
                  <div
                    className={
                      styles.emptyActivity
                    }
                  >
                    <strong>
                      No activity yet
                    </strong>

                    <span>
                      Build or deploy a
                      project to see
                      backend activity here.
                    </span>
                  </div>
                )}
            </div>
          </aside>
        </section>
      </main>
    </DashboardLayout>
  );
}
