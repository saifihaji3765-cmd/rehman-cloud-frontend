import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import styles from "./Settings.module.css";

import { useAuth } from "../../../context/AuthContext.jsx";
import { getSubscription } from "../../../services/billingService.js";
import workspaceService from "../../../services/workspaceService.js";
import environmentService from "../../../services/environmentService.js";
import githubService from "../../../services/githubService.js";
import deploymentService from "../../../services/deploymentService.js";


/* =========================================================
   API BASE
========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://api.zyrionos.com"
).replace(/\/+$/, "");


/* =========================================================
   ICON SYSTEM
========================================================= */

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  switch (name) {
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
        </svg>
      );

    case "security":
      return (
        <svg {...common}>
          <path d="M12 3 19 6v5c0 4.7-2.7 8.2-7 10-4.3-1.8-7-5.3-7-10V6z" />
          <path d="m9.5 12 1.7 1.7 3.6-3.8" />
        </svg>
      );

    case "sessions":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </svg>
      );

    case "notifications":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="m5.6 5.6 2.1 2.1" />
          <path d="m16.3 16.3 2.1 2.1" />
          <path d="m18.4 5.6-2.1 2.1" />
          <path d="m7.7 16.3-2.1 2.1" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );

    case "workspace":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h4l2 2h5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M4 10h16" />
        </svg>
      );

    case "billing":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );

    case "integrations":
      return (
        <svg {...common}>
          <path d="M8 12h8" />
          <path d="M12 8v8" />
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      );

    case "environment":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
          <circle cx="17" cy="16" r="1" />
        </svg>
      );

    case "key":
      return (
        <svg {...common}>
          <circle cx="8.5" cy="15.5" r="3.5" />
          <path d="m11 13 8-8" />
          <path d="m16 6 2 2" />
          <path d="m14 8 2 2" />
        </svg>
      );

    case "github":
      return (
        <svg {...common}>
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.7-1.6 6.7-7A5.5 5.5 0 0 0 19.2 4 5.1 5.1 0 0 0 19 1.5S17.8 1.1 15 3a13.4 13.4 0 0 0-6 0C6.2 1.1 5 1.5 5 1.5A5.1 5.1 0 0 0 4.8 4 5.5 5.5 0 0 0 3.3 7.5c0 5.4 3.4 6.6 6.7 7A4.8 4.8 0 0 0 9 18v4" />
          <path d="M9 18c-3.5 1.5-4-1.5-5.5-1.5" />
        </svg>
      );

    case "repository":
      return (
        <svg {...common}>
          <path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v15l-3-2-3 2-3-2-3 2-3-2z" />
          <path d="M8 7h7" />
          <path d="M8 11h7" />
        </svg>
      );

    case "branch":
      return (
        <svg {...common}>
          <circle cx="6" cy="5" r="2" />
          <circle cx="18" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path d="M6 7v5a7 7 0 0 0 7 7h3" />
          <path d="M13 12a5 5 0 0 0 5-5" />
        </svg>
      );

    case "deploy":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7 8 5-5 5 5" />
          <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.7-4L3 10" />
          <path d="M3 5v5h5" />
          <path d="M4 13a8 8 0 0 0 14.7 4L21 14" />
          <path d="M21 19v-5h-5" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M6 7l1 14h10l1-14" />
          <path d="M9 7V4h6v3" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "eyeOff":
      return (
        <svg {...common}>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.1 3.7" />
          <path d="M6.6 6.6C3.8 8.5 2.5 12 2.5 12s3.5 7 9.5 7c1.1 0 2.1-.2 3-.5" />
        </svg>
      );

    case "privacy":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );

    case "danger":
      return (
        <svg {...common}>
          <path d="M12 3 22 20H2z" />
          <path d="M12 9v5" />
          <circle
            cx="12"
            cy="17"
            r=".8"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );

    case "external":
      return (
        <svg {...common}>
          <path d="M14 5h5v5" />
          <path d="m19 5-8 8" />
          <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}


/* =========================================================
   SECTION DEFINITIONS
========================================================= */

const sections = [
  {
    id: "profile",
    label: "Profile & Account",
    description: "Your identity and account information",
    icon: "profile",
  },
  {
    id: "security",
    label: "Security",
    description: "Authentication and account protection",
    icon: "security",
  },
  {
    id: "sessions",
    label: "Sessions & Devices",
    description: "Review active account sessions",
    icon: "sessions",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Control product notifications",
    icon: "notifications",
  },
  {
    id: "ai",
    label: "AI Preferences",
    description: "Configure your AI experience",
    icon: "ai",
  },
  {
    id: "workspace",
    label: "Workspace",
    description: "Workspace and project preferences",
    icon: "workspace",
  },
  {
    id: "billing",
    label: "Billing & Plan",
    description: "Subscription and payment settings",
    icon: "billing",
  },
  {
    id: "environment",
    label: "Environment",
    description: "Project variables and secrets",
    icon: "environment",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "GitHub and deployment services",
    icon: "integrations",
  },
  {
    id: "privacy",
    label: "Privacy & Data",
    description: "Data and privacy controls",
    icon: "privacy",
  },
  {
    id: "danger",
    label: "Danger Zone",
    description: "Irreversible account actions",
    icon: "danger",
  },
];


/* =========================================================
   GENERIC HELPERS
========================================================= */

function getInitials(user) {
  const source =
    user?.name ||
    user?.displayName ||
    user?.email ||
    "Z";

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}


function getDisplayName(user) {
  return (
    user?.name ||
    user?.displayName ||
    user?.fullName ||
    "ZyrionOS User"
  );
}


function getEmail(user) {
  return (
    user?.email ||
    "Account email unavailable"
  );
}


function getPayload(response) {
  if (!response) return null;

  const body =
    response?.data ?? response;

  if (body?.data !== undefined) {
    return body.data;
  }

  return body;
}


function getList(response, keys = []) {
  const payload =
    getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }

    if (
      Array.isArray(
        payload?.data?.[key]
      )
    ) {
      return payload.data[key];
    }
  }

  return [];
}


function getObject(response, keys = []) {
  const payload =
    getPayload(response);

  if (!payload) {
    return null;
  }

  for (const key of keys) {
    if (payload?.[key]) {
      return payload[key];
    }
  }

  return payload;
}


function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
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
    project?.title ||
    getProjectId(project)
  );
}


function getEnvironmentName(environment) {
  return String(
    environment?.name ||
      environment?.environment ||
      ""
  );
}


function getVariableList(environment) {
  return Array.isArray(
    environment?.variables
  )
    ? environment.variables
    : [];
}


function getConnectionId(connection) {
  return (
    connection?._id ||
    connection?.id ||
    connection?.connectionId ||
    ""
  );
}


function getConnectionLabel(connection) {
  return (
    connection?.githubLogin ||
    connection?.githubUsername ||
    connection?.username ||
    connection?.login ||
    connection?.name ||
    connection?.githubUser?.login ||
    connection?.githubUser?.username ||
    "GitHub connection"
  );
}


function getRepositoryName(repository) {
  return (
    repository?.fullName ||
    repository?.full_name ||
    repository?.name ||
    repository?.repo ||
    ""
  );
}


function getRepositoryOwner(repository) {
  return (
    repository?.owner?.login ||
    repository?.owner?.name ||
    repository?.owner?.username ||
    repository?.owner ||
    repository?.namespace ||
    ""
  );
}


function getBranchName(branch) {
  if (typeof branch === "string") {
    return branch;
  }

  return (
    branch?.name ||
    branch?.branch ||
    branch?.ref ||
    ""
  );
}


function getSubscriptionData(response) {
  if (!response) return null;

  if (response?.data?.data) {
    return response.data.data;
  }

  if (response?.data) {
    return response.data;
  }

  return response;
}


/* =========================================================
   ENVIRONMENT DRAFT
========================================================= */

function createEnvironmentDraft(
  overrides = {}
) {
  return {
    id:
      overrides.id ||
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

    originalKey:
      overrides.originalKey || "",

    key:
      overrides.key || "",

    value:
      overrides.value || "",

    type:
      overrides.type || "string",

    scope:
      overrides.scope || "runtime",

    required:
      Boolean(overrides.required),

    isSecret:
      overrides.isSecret !== false,

    enabled:
      overrides.enabled !== false,

    visible: false,
  };
}


/* =========================================================
   SETTINGS
========================================================= */

function Settings() {
  const navigate =
    useNavigate();

  const {
    user,
    loading: authLoading,
  } = useAuth();


  /* -------------------------------------------------------
     GENERAL
  ------------------------------------------------------- */

  const [
    activeSection,
    setActiveSection,
  ] = useState("profile");

  const [
    subscription,
    setSubscription,
  ] = useState(null);

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(false);

  const [
    subscriptionError,
    setSubscriptionError,
  ] = useState("");

  const [
    mobileSectionsOpen,
    setMobileSectionsOpen,
  ] = useState(false);


  /* -------------------------------------------------------
     PROJECT
  ------------------------------------------------------- */

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState("");


  /* -------------------------------------------------------
     ENVIRONMENT
  ------------------------------------------------------- */

  const [
    environments,
    setEnvironments,
  ] = useState([]);

  const [
    selectedEnvironmentName,
    setSelectedEnvironmentName,
  ] = useState("");

  const [
    selectedEnvironment,
    setSelectedEnvironment,
  ] = useState(null);

  const [
    environmentLoading,
    setEnvironmentLoading,
  ] = useState(false);

  const [
    environmentSavingAll,
    setEnvironmentSavingAll,
  ] = useState(false);

  const [
    environmentDeletingKey,
    setEnvironmentDeletingKey,
  ] = useState("");

  const [
    environmentError,
    setEnvironmentError,
  ] = useState("");

  const [
    environmentMessage,
    setEnvironmentMessage,
  ] = useState("");

  const [
  environmentDrafts,
  setEnvironmentDrafts,
] = useState([]);

const [
  environmentEntry,
  setEnvironmentEntry,
] = useState(() => createEnvironmentDraft());

const [
  environmentEditorOpen,
  setEnvironmentEditorOpen,
] = useState(false);


  /* -------------------------------------------------------
     GITHUB
  ------------------------------------------------------- */

  const [
    githubConnections,
    setGithubConnections,
  ] = useState([]);

  const [
    selectedConnectionId,
    setSelectedConnectionId,
  ] = useState("");

  const [
    githubRepositories,
    setGithubRepositories,
  ] = useState([]);

  const [
    selectedRepository,
    setSelectedRepository,
  ] = useState(null);

  const [
    githubBranches,
    setGithubBranches,
  ] = useState([]);

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState("");

  const [
    githubLoading,
    setGithubLoading,
  ] = useState(false);

  const [
    githubActionLoading,
    setGithubActionLoading,
  ] = useState(false);

  const [
    githubError,
    setGithubError,
  ] = useState("");

  const [
    githubMessage,
    setGithubMessage,
  ] = useState("");

  const [
    githubReadiness,
    setGithubReadiness,
  ] = useState(null);

  const [
    githubPreparedContract,
    setGithubPreparedContract,
  ] = useState(null);


  /* -------------------------------------------------------
     MEMOS
  ------------------------------------------------------- */

  const profile = useMemo(
    () => ({
      name: getDisplayName(user),
      email: getEmail(user),
      initials: getInitials(user),
      avatar:
        user?.avatar ||
        user?.photo ||
        user?.picture ||
        null,
      provider:
        user?.provider ||
        user?.authProvider ||
        null,
    }),
    [user]
  );


  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (project) =>
            String(
              getProjectId(project)
            ) ===
            String(
              selectedProjectId
            )
        ) || null,
      [
        projects,
        selectedProjectId,
      ]
    );


  const environmentVariables =
    getVariableList(
      selectedEnvironment
    );


  /* =======================================================
     SUBSCRIPTION
  ======================================================= */

  const loadSubscription =
    useCallback(async () => {
      setSubscriptionLoading(
        true
      );

      setSubscriptionError("");

      try {
        const response =
          await getSubscription();

        setSubscription(
          getSubscriptionData(
            response
          )
        );
      } catch (error) {
        setSubscription(null);

        setSubscriptionError(
          getErrorMessage(
            error,
            "Unable to load subscription information."
          )
        );
      } finally {
        setSubscriptionLoading(
          false
        );
      }
    }, []);


  /* =======================================================
     PROJECTS
  ======================================================= */

  const loadProjects =
    useCallback(
      async (
        preserveSelection = true
      ) => {
        try {
          const response =
            await workspaceService.getProjects();

          const list =
            getList(response, [
              "projects",
              "items",
            ]);

          setProjects(list);

          if (!list.length) {
            setSelectedProjectId("");
            return;
          }

          const currentStillExists =
            preserveSelection &&
            list.some(
              (project) =>
                String(
                  getProjectId(project)
                ) ===
                String(
                  selectedProjectId
                )
            );

          if (!currentStillExists) {
            setSelectedProjectId(
              String(
                getProjectId(
                  list[0]
                )
              )
            );
          }
        } catch (error) {
          setProjects([]);

          setEnvironmentError(
            getErrorMessage(
              error,
              "Unable to load projects."
            )
          );
        }
      },
      [selectedProjectId]
    );


  /* =======================================================
     LOAD SINGLE ENVIRONMENT
  ======================================================= */

  const loadEnvironment =
    useCallback(
      async (
        projectId,
        environmentName
      ) => {
        if (
          !projectId ||
          !environmentName
        ) {
          setSelectedEnvironment(
            null
          );
          return;
        }

        setEnvironmentLoading(
          true
        );

        setEnvironmentError("");

        try {
          const response =
            await environmentService.getEnvironment(
              projectId,
              environmentName
            );

          const environment =
            getObject(response, [
              "environment",
            ]);

          setSelectedEnvironment(
            environment
          );
        } catch (error) {
          setSelectedEnvironment(
            null
          );

          setEnvironmentError(
            getErrorMessage(
              error,
              "Unable to load environment."
            )
          );
        } finally {
          setEnvironmentLoading(
            false
          );
        }
      },
      []
    );


  /* =======================================================
     LOAD ENVIRONMENT LIST
  ======================================================= */

  const loadEnvironmentList =
    useCallback(
      async (projectId) => {
        if (!projectId) {
          setEnvironments([]);
          setSelectedEnvironmentName("");
          setSelectedEnvironment(null);
          return;
        }

        setEnvironmentLoading(
          true
        );

        setEnvironmentError("");

        try {
          const response =
            await environmentService.listEnvironments(
              projectId,
              false
            );

          const list =
            getList(response, [
              "environments",
              "items",
            ]);

          setEnvironments(list);

          const currentName =
            selectedEnvironmentName;

          const currentExists =
            currentName &&
            list.some(
              (item) =>
                getEnvironmentName(
                  item
                ) === currentName
            );

          const preferred =
            currentExists
              ? list.find(
                  (item) =>
                    getEnvironmentName(
                      item
                    ) === currentName
                )
              : list.find(
                  (item) =>
                    getEnvironmentName(
                      item
                    ).toLowerCase() ===
                    "development"
                ) ||
                list[0];

          const nextName =
            getEnvironmentName(
              preferred
            );

          setSelectedEnvironmentName(
            nextName
          );

          if (!nextName) {
            setSelectedEnvironment(
              null
            );
          }
        } catch (error) {
          setEnvironments([]);
          setSelectedEnvironment(null);
          setSelectedEnvironmentName("");

          setEnvironmentError(
            getErrorMessage(
              error,
              "Unable to load environments."
            )
          );
        } finally {
          setEnvironmentLoading(
            false
          );
        }
      },
      [
        selectedEnvironmentName,
      ]
    );


  /* =======================================================
     GITHUB CONNECTIONS
  ======================================================= */

  const loadGithubConnections =
    useCallback(
      async (projectId) => {
        if (!projectId) {
          setGithubConnections([]);
          setSelectedConnectionId("");
          return;
        }

        setGithubLoading(true);
        setGithubError("");
        setGithubMessage("");

        try {
          const response =
            await githubService.getConnections({
              projectId,
            });

          const list =
            getList(response, [
              "connections",
              "items",
            ]);

          setGithubConnections(
            list
          );

          const active =
            list.find(
              (connection) =>
                String(
                  connection?.status ||
                    ""
                ).toLowerCase() ===
                "active"
            ) ||
            list[0] ||
            null;

          setSelectedConnectionId(
            getConnectionId(active)
          );
        } catch (error) {
          setGithubConnections([]);
          setSelectedConnectionId("");

          setGithubError(
            getErrorMessage(
              error,
              "Unable to load GitHub connections."
            )
          );
        } finally {
          setGithubLoading(false);
        }
      },
      []
    );


  /* =======================================================
     GITHUB REPOSITORIES
  ======================================================= */

  const loadGithubRepositories =
    useCallback(
      async (
        projectId,
        connectionId
      ) => {
        if (
          !projectId ||
          !connectionId
        ) {
          setGithubRepositories([]);
          setSelectedRepository(null);
          setGithubBranches([]);
          setSelectedBranch("");
          return;
        }

        setGithubLoading(true);
        setGithubError("");

        try {
          const response =
            await githubService.getRepositories({
              projectId,
              connectionId,
            });

          const list =
            getList(response, [
              "repositories",
              "repos",
              "items",
            ]);

          setGithubRepositories(
            list
          );

          setSelectedRepository(
            list[0] || null
          );
        } catch (error) {
          setGithubRepositories([]);
          setSelectedRepository(null);
          setGithubBranches([]);
          setSelectedBranch("");

          setGithubError(
            getErrorMessage(
              error,
              "Unable to load GitHub repositories."
            )
          );
        } finally {
          setGithubLoading(false);
        }
      },
      []
    );


  /* =======================================================
     GITHUB BRANCHES
  ======================================================= */

  const loadGithubBranches =
    useCallback(
      async (
        projectId,
        connectionId,
        repository
      ) => {
        if (
          !projectId ||
          !connectionId ||
          !repository
        ) {
          setGithubBranches([]);
          setSelectedBranch("");
          return;
        }

        const repoName =
          getRepositoryName(
            repository
          );

        const owner =
          getRepositoryOwner(
            repository
          );

        if (!repoName) {
          setGithubBranches([]);
          setSelectedBranch("");
          return;
        }

        setGithubLoading(true);
        setGithubError("");

        try {
          const response =
            await githubService.getBranches({
              projectId,
              connectionId,
              owner,
              repo:
                repository?.name ||
                repoName
                  .split("/")
                  .pop(),
              repository:
                repoName,
            });

          const list =
            getList(response, [
              "branches",
              "items",
            ]);

          setGithubBranches(
            list
          );

          const defaultBranch =
            repository?.defaultBranch ||
            repository?.default_branch ||
            list.find(
              (branch) =>
                getBranchName(
                  branch
                ) === "main"
            ) ||
            list.find(
              (branch) =>
                getBranchName(
                  branch
                ) === "master"
            ) ||
            list[0];

          setSelectedBranch(
            getBranchName(
              defaultBranch
            )
          );
        } catch (error) {
          setGithubBranches([]);
          setSelectedBranch("");

          setGithubError(
            getErrorMessage(
              error,
              "Unable to load repository branches."
            )
          );
        } finally {
          setGithubLoading(false);
        }
      },
      []
    );


  /* =======================================================
     DATA EFFECTS
  ======================================================= */

  useEffect(() => {
    if (
      activeSection !==
        "environment" &&
      activeSection !==
        "integrations"
    ) {
      return;
    }

    loadProjects();
  }, [
    activeSection,
    loadProjects,
  ]);


  useEffect(() => {
    if (
      activeSection !==
        "environment" ||
      !selectedProjectId
    ) {
      return;
    }

    loadEnvironmentList(
      selectedProjectId
    );
  }, [
    activeSection,
    selectedProjectId,
    loadEnvironmentList,
  ]);


  useEffect(() => {
    if (
      activeSection !==
        "integrations" ||
      !selectedProjectId
    ) {
      return;
    }

    loadGithubConnections(
      selectedProjectId
    );
  }, [
    activeSection,
    selectedProjectId,
    loadGithubConnections,
  ]);


  useEffect(() => {
    if (
      activeSection !==
        "environment" ||
      !selectedProjectId ||
      !selectedEnvironmentName
    ) {
      return;
    }

    loadEnvironment(
      selectedProjectId,
      selectedEnvironmentName
    );
  }, [
    activeSection,
    selectedProjectId,
    selectedEnvironmentName,
    loadEnvironment,
  ]);


  useEffect(() => {
    if (
      activeSection !==
        "integrations" ||
      !selectedProjectId ||
      !selectedConnectionId
    ) {
      return;
    }

    loadGithubRepositories(
      selectedProjectId,
      selectedConnectionId
    );
  }, [
    activeSection,
    selectedProjectId,
    selectedConnectionId,
    loadGithubRepositories,
  ]);


  useEffect(() => {
    if (
      activeSection !==
        "integrations" ||
      !selectedProjectId ||
      !selectedConnectionId ||
      !selectedRepository
    ) {
      return;
    }

    loadGithubBranches(
      selectedProjectId,
      selectedConnectionId,
      selectedRepository
    );
  }, [
    activeSection,
    selectedProjectId,
    selectedConnectionId,
    selectedRepository,
    loadGithubBranches,
  ]);


  /* =======================================================
     SECTION CHANGE
  ======================================================= */

  const handleSectionChange =
    (sectionId) => {
      setActiveSection(
        sectionId
      );

      setMobileSectionsOpen(
        false
      );

      if (
        sectionId === "billing"
      ) {
        loadSubscription();
      }
    };


  /* =======================================================
     ENVIRONMENT ACTIONS
  ======================================================= */

  const handleEnvironmentProjectChange =
    (event) => {
      const projectId =
        event.target.value;

      setSelectedProjectId(
        projectId
      );

      setSelectedEnvironmentName(
        ""
      );

      setSelectedEnvironment(
        null
      );

      setEnvironmentMessage("");
      setEnvironmentError("");

      setEnvironmentDrafts([
        createEnvironmentDraft(),
      ]);
    };


  const handleEnvironmentChange =
    (event) => {
      const name =
        event.target.value;

      setSelectedEnvironmentName(
        name
      );

      setEnvironmentMessage("");
      setEnvironmentError("");

      setEnvironmentDrafts([
        createEnvironmentDraft(),
      ]);
    };


  const handleEnvironmentDraftChange =
    (draftId, field, value) => {
      setEnvironmentDrafts(
        (current) =>
          current.map(
            (draft) =>
              draft.id === draftId
                ? {
                    ...draft,
                    [field]:
                      value,
                  }
                : draft
          )
      );
    };


  const addEnvironmentDraft =
    () => {
      setEnvironmentDrafts(
        (current) => [
          ...current,
          createEnvironmentDraft(),
        ]
      );
    };


  const removeEnvironmentDraft =
    (draftId) => {
      setEnvironmentDrafts(
        (current) => {
          const next =
            current.filter(
              (draft) =>
                draft.id !==
                draftId
            );

          return next.length
            ? next
            : [createEnvironmentDraft()];
        }
      );
    };


  const editEnvironmentVariable =
    (variable) => {
      const key =
        variable?.key || "";

      if (!key) {
        return;
      }

      setEnvironmentError("");
      setEnvironmentMessage(
        `Enter a new value to replace ${key}.`
      );

      setEnvironmentDrafts(
        (current) => {
          const withoutSame =
            current.filter(
              (draft) =>
                draft.originalKey !==
                key
            );

          const hasOnlyEmptyDraft =
            withoutSame.length === 1 &&
            !withoutSame[0]
              .originalKey &&
            !withoutSame[0]
              .key &&
            !withoutSame[0]
              .value;

          const base =
            hasOnlyEmptyDraft
              ? []
              : withoutSame;

          return [
            ...base,
            createEnvironmentDraft({
              originalKey:
                key,
              key,
              value: "",
              type:
                variable?.type ||
                "string",
              scope:
                variable?.scope ||
                "runtime",
              required:
                Boolean(
                  variable?.required
                ),
              isSecret:
                variable?.isSecret !==
                false,
              enabled:
                variable?.enabled !==
                false,
            }),
          ];
        }
      );
    };


  const handleSaveEnvironmentVariables =
    async (event) => {
      event?.preventDefault();

      if (!selectedProjectId) {
        setEnvironmentError(
          "Select a project first."
        );
        return;
      }

      if (
        !selectedEnvironmentName
      ) {
        setEnvironmentError(
          "Select an environment first."
        );
        return;
      }

      const draftsToSave =
        environmentDrafts.filter(
          (draft) =>
            draft.key.trim() ||
            draft.value
        );

      if (!draftsToSave.length) {
        setEnvironmentError(
          "Add at least one environment variable before saving."
        );
        return;
      }

      const seenKeys =
        new Set();

      for (
        const draft of draftsToSave
      ) {
        const normalizedKey =
          draft.key
            .trim()
            .toUpperCase();

        if (!normalizedKey) {
          setEnvironmentError(
            "Every variable must have a key."
          );
          return;
        }

        if (
          !draft.value
        ) {
          setEnvironmentError(
            `Enter a value for ${normalizedKey}.`
          );
          return;
        }

        if (
          seenKeys.has(
            normalizedKey
          )
        ) {
          setEnvironmentError(
            `Duplicate variable key: ${normalizedKey}.`
          );
          return;
        }

        seenKeys.add(
          normalizedKey
        );
      }

      setEnvironmentSavingAll(
        true
      );

      setEnvironmentError("");
      setEnvironmentMessage("");

      const savedIds =
        [];

      try {
        for (
          const draft of draftsToSave
        ) {
          const key =
            draft.key.trim();

          const payload = {
            key,
            value:
              draft.value,
            isSecret:
              draft.isSecret,
            type:
              draft.type,
            scope:
              draft.scope,
            required:
              draft.required,
            enabled:
              draft.enabled,
          };

          if (
            draft.originalKey
          ) {
            await environmentService.updateVariable(
              selectedProjectId,
              selectedEnvironmentName,
              draft.originalKey,
              payload
            );
          } else {
            await environmentService.addVariable(
              selectedProjectId,
              selectedEnvironmentName,
              payload
            );
          }

          savedIds.push(
            draft.id
          );
        }

        setEnvironmentMessage(
          `${savedIds.length} environment variable${
            savedIds.length !== 1
              ? "s"
              : ""
          } saved successfully.`
        );
      } catch (error) {
        const savedCount =
          savedIds.length;

        setEnvironmentError(
          savedCount
            ? `${savedCount} variable${
                savedCount !== 1
                  ? "s"
                  : ""
              } saved. The remaining variable could not be saved: ${getErrorMessage(
                error,
                "Backend rejected the environment variable."
              )}`
            : getErrorMessage(
                error,
                "Environment variables could not be saved."
              )
        );
      } finally {
        setEnvironmentDrafts(
          (current) => {
            const remaining =
              current.filter(
                (draft) =>
                  !savedIds.includes(
                    draft.id
                  )
              );

            return remaining.length
              ? remaining
              : [
                  createEnvironmentDraft(),
                ];
          }
        );

        await loadEnvironment(
          selectedProjectId,
          selectedEnvironmentName
        );

        await loadEnvironmentList(
          selectedProjectId
        );

        setEnvironmentSavingAll(
          false
        );
      }
    };


  const handleDeleteEnvironmentVariable =
    async (key) => {
      if (
        !selectedProjectId ||
        !selectedEnvironmentName ||
        !key
      ) {
        return;
      }

      setEnvironmentDeletingKey(
        key
      );

      setEnvironmentError("");
      setEnvironmentMessage("");

      try {
        await environmentService.deleteVariable(
          selectedProjectId,
          selectedEnvironmentName,
          key
        );

        setEnvironmentMessage(
          `${key} was deleted successfully.`
        );

        setEnvironmentDrafts(
          (current) =>
            current.filter(
              (draft) =>
                draft.originalKey !==
                key
            ).length
              ? current.filter(
                  (draft) =>
                    draft.originalKey !==
                    key
                )
              : [
                  createEnvironmentDraft(),
                ]
        );

        await loadEnvironment(
          selectedProjectId,
          selectedEnvironmentName
        );

        await loadEnvironmentList(
          selectedProjectId
        );
      } catch (error) {
        setEnvironmentError(
          getErrorMessage(
            error,
            "Environment variable could not be deleted."
          )
        );
      } finally {
        setEnvironmentDeletingKey(
          ""
        );
      }
    };


  /* =======================================================
     GITHUB ACTIONS
  ======================================================= */

  const handleConnectGithub =
    () => {
      /*
       * IMPORTANT:
       * OAuth must start from the real backend.
       * Using /api/auth/github would resolve against
       * the Amplify frontend domain.
       */
      window.location.assign(
        `${API_BASE_URL}/api/auth/github`
      );
    };


  const handleGithubRefresh =
    async () => {
      if (!selectedProjectId) {
        return;
      }

      setGithubError("");
      setGithubMessage("");

      await loadGithubConnections(
        selectedProjectId
      );
    };


  const handleGithubRepositoryChange =
    (event) => {
      const repositoryName =
        event.target.value;

      const repository =
        githubRepositories.find(
          (item) =>
            getRepositoryName(
              item
            ) === repositoryName
        ) || null;

      setSelectedRepository(
        repository
      );

      setGithubReadiness(null);
      setGithubPreparedContract(
        null
      );
      setGithubMessage("");
      setGithubError("");
    };


  const handleGithubBranchChange =
    (event) => {
      setSelectedBranch(
        event.target.value
      );

      setGithubReadiness(null);
      setGithubPreparedContract(
        null
      );
      setGithubMessage("");
      setGithubError("");
    };


  const buildGithubDeploymentPayload =
    () => {
      const repositoryName =
        getRepositoryName(
          selectedRepository
        );

      const owner =
        getRepositoryOwner(
          selectedRepository
        );

      const repository =
        selectedRepository?.name ||
        repositoryName
          .split("/")
          .pop();

      return {
        projectId:
          selectedProjectId,

        projectName:
          getProjectName(
            selectedProject
          ),

        connectionId:
          selectedConnectionId,

        owner,

        repository,

        repo:
          repository,

        repositoryUrl:
          selectedRepository?.html_url ||
          selectedRepository?.htmlUrl ||
          selectedRepository?.url ||
          "",

        branch:
          selectedBranch,

        environmentName:
          selectedEnvironmentName ||
          "development",
      };
    };


  const handleGithubReadiness =
    async () => {
      if (
        !selectedProjectId ||
        !selectedConnectionId ||
        !selectedRepository ||
        !selectedBranch
      ) {
        setGithubError(
          "Select project, GitHub connection, repository and branch first."
        );
        return;
      }

      setGithubActionLoading(
        true
      );

      setGithubError("");
      setGithubMessage("");

      try {
        const response =
          await githubService.checkDeploymentReadiness(
            buildGithubDeploymentPayload()
          );

        const readiness =
          getObject(response, [
            "readiness",
            "deploymentReadiness",
          ]);

        setGithubReadiness(
          readiness
        );

        setGithubMessage(
          "Deployment readiness check completed."
        );
      } catch (error) {
        setGithubReadiness(
          null
        );

        setGithubError(
          getErrorMessage(
            error,
            "Deployment readiness check failed."
          )
        );
      } finally {
        setGithubActionLoading(
          false
        );
      }
    };


  const handlePrepareGithubDeployment =
    async () => {
      if (
        !selectedProjectId ||
        !selectedConnectionId ||
        !selectedRepository ||
        !selectedBranch
      ) {
        setGithubError(
          "Complete the GitHub deployment selection first."
        );
        return;
      }

      setGithubActionLoading(
        true
      );

      setGithubError("");
      setGithubMessage("");

      try {
        const response =
          await githubService.prepareDeployment(
            buildGithubDeploymentPayload()
          );

        const prepared =
          getObject(response, [
            "deployment",
            "contract",
            "deploymentContract",
            "preparedDeployment",
          ]);

        setGithubPreparedContract(
          prepared
        );

        setGithubMessage(
          "Deployment contract prepared successfully."
        );
      } catch (error) {
        setGithubPreparedContract(
          null
        );

        setGithubError(
          getErrorMessage(
            error,
            "Unable to prepare deployment."
          )
        );
      } finally {
        setGithubActionLoading(
          false
        );
      }
    };


  const handleGithubDeploy =
    async () => {
      if (
        !selectedProjectId ||
        !selectedConnectionId ||
        !selectedRepository ||
        !selectedBranch
      ) {
        setGithubError(
          "Select project, GitHub connection, repository and branch first."
        );
        return;
      }

      setGithubActionLoading(
        true
      );

      setGithubError("");
      setGithubMessage("");

      try {
        let prepared =
          githubPreparedContract;

        if (!prepared) {
          const prepareResponse =
            await githubService.prepareDeployment(
              buildGithubDeploymentPayload()
            );

          prepared =
            getObject(
              prepareResponse,
              [
                "deployment",
                "contract",
                "deploymentContract",
                "preparedDeployment",
              ]
            );
        }

        const payload = {
          ...(prepared || {}),
          ...buildGithubDeploymentPayload(),
        };

        const deploymentResponse =
          await deploymentService.createDeployment(
            payload
          );

        const deployment =
          getObject(
            deploymentResponse,
            [
              "deployment",
            ]
          );

        setGithubPreparedContract(
          prepared
        );

        setGithubMessage(
          deployment?.deploymentId ||
          deployment?.id
            ? `Deployment started: ${
                deployment.deploymentId ||
                deployment.id
              }`
            : "Deployment request accepted by the backend."
        );
      } catch (error) {
        setGithubError(
          getErrorMessage(
            error,
            "Deployment could not be started."
          )
        );
      } finally {
        setGithubActionLoading(
          false
        );
      }
    };


  /* =======================================================
     BILLING
  ======================================================= */

  const subscriptionName =
    subscription?.planName ||
    subscription?.plan ||
    subscription?.name ||
    null;

  const billingCycle =
    subscription?.billingCycle ||
    subscription?.interval ||
    null;

  const subscriptionStatus =
    subscription?.status ||
    null;


  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {
    return (
      <DashboardLayout>
        <div
          className={
            styles.page
          }
        >
          <div
            className={
              styles.loadingState
            }
          >
            <div
              className={
                styles.loadingSpinner
              }
            />

            <span>
              Loading settings...
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>
      <div
        className={styles.page}
      >

        {/* HEADER */}
        <header
          className={styles.header}
        >
          <div
            className={
              styles.headerCopy
            }
          >
            <div
              className={
                styles.breadcrumb
              }
            >
              <span>
                Platform
              </span>

              <Icon
                name="chevron"
                size={13}
              />

              <span>
                Settings
              </span>
            </div>

            <div
              className={
                styles.titleRow
              }
            >
              <div>
                <h1
                  className={
                    styles.title
                  }
                >
                  Settings
                </h1>

                <p
                  className={
                    styles.subtitle
                  }
                >
                  Manage your ZyrionOS
                  account, environments,
                  GitHub integrations and
                  deployment controls from
                  one authenticated control
                  center.
                </p>
              </div>

              <div
                className={
                  styles.liveBadge
                }
              >
                <span />
                Backend connected
              </div>
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
                styles.secondaryButton
              }
              onClick={() =>
                navigate("/billing")
              }
            >
              <Icon
                name="billing"
                size={16}
              />

              Billing
            </button>
          </div>
        </header>


        {/* MOBILE SECTION SELECTOR */}
        <div
          className={
            styles.mobileSectionSelector
          }
        >
          <button
            type="button"
            className={
              styles.mobileSectionButton
            }
            onClick={() =>
              setMobileSectionsOpen(
                (current) =>
                  !current
              )
            }
            aria-expanded={
              mobileSectionsOpen
            }
          >
            <span
              className={
                styles.mobileSectionIcon
              }
            >
              <Icon
                name={
                  sections.find(
                    (item) =>
                      item.id ===
                      activeSection
                  )?.icon ||
                  "profile"
                }
                size={17}
              />
            </span>

            <span
              className={
                styles.mobileSectionContent
              }
            >
              <strong>
                {
                  sections.find(
                    (item) =>
                      item.id ===
                      activeSection
                  )?.label
                }
              </strong>

              <small>
                Settings section
              </small>
            </span>

            <Icon
              name="chevron"
              size={17}
            />
          </button>

          {mobileSectionsOpen && (
            <div
              className={
                styles.mobileSectionMenu
              }
            >
              {sections.map(
                (section) => (
                  <button
                    type="button"
                    key={section.id}
                    className={
                      activeSection ===
                      section.id
                        ? styles.mobileSectionItemActive
                        : styles.mobileSectionItem
                    }
                    onClick={() =>
                      handleSectionChange(
                        section.id
                      )
                    }
                  >
                    <Icon
                      name={
                        section.icon
                      }
                      size={17}
                    />

                    <span>
                      {section.label}
                    </span>

                    {activeSection ===
                      section.id && (
                      <Icon
                        name="check"
                        size={16}
                      />
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>


        {/* SETTINGS LAYOUT */}
        <div
          className={
            styles.settingsLayout
          }
        >

          {/* SIDEBAR */}
          <aside
            className={
              styles.settingsNavigation
            }
            aria-label="Settings navigation"
          >
            <div
              className={
                styles.navigationHeader
              }
            >
              SETTINGS
            </div>

            <nav>
              {sections.map(
                (section) => (
                  <button
                    type="button"
                    key={section.id}
                    className={
                      activeSection ===
                      section.id
                        ? styles.settingsNavActive
                        : styles.settingsNavItem
                    }
                    onClick={() =>
                      handleSectionChange(
                        section.id
                      )
                    }
                  >
                    <span
                      className={
                        styles.settingsNavIcon
                      }
                    >
                      <Icon
                        name={
                          section.icon
                        }
                        size={17}
                      />
                    </span>

                    <span
                      className={
                        styles.settingsNavText
                      }
                    >
                      <strong>
                        {
                          section.label
                        }
                      </strong>

                      <small>
                        {
                          section.description
                        }
                      </small>
                    </span>

                    {activeSection ===
                      section.id && (
                      <span
                        className={
                          styles.settingsNavIndicator
                        }
                      />
                    )}
                  </button>
                )
              )}
            </nav>
          </aside>


          {/* CONTENT */}
          <main
            className={
              styles.settingsContent
            }
          >

            {/* =================================================
                PROFILE
            ================================================== */}

            {activeSection ===
              "profile" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      ACCOUNT
                    </span>

                    <h2>
                      Profile & Account
                    </h2>

                    <p>
                      Your authenticated
                      account identity and
                      provider information.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.profileHero
                  }
                >
                  <div
                    className={
                      styles.profileAvatar
                    }
                  >
                    {profile.avatar ? (
                      <img
                        src={
                          profile.avatar
                        }
                        alt=""
                      />
                    ) : (
                      profile.initials
                    )}
                  </div>

                  <div
                    className={
                      styles.profileIdentity
                    }
                  >
                    <h3>
                      {profile.name}
                    </h3>

                    <p>
                      {profile.email}
                    </p>

                    {profile.provider && (
                      <span
                        className={
                          styles.providerBadge
                        }
                      >
                        {
                          profile.provider
                        }{" "}
                        authentication
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={
                    styles.cardGrid
                  }
                >
                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      DISPLAY NAME
                    </span>

                    <strong>
                      {profile.name}
                    </strong>

                    <p>
                      Authenticated account
                      identity.
                    </p>
                  </div>

                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      EMAIL
                    </span>

                    <strong>
                      {profile.email}
                    </strong>

                    <p>
                      Email returned by
                      authentication.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.infoNotice
                  }
                >
                  <Icon
                    name="security"
                    size={17}
                  />

                  <div>
                    <strong>
                      Account identity is
                      managed by
                      authentication.
                    </strong>

                    <p>
                      This page does not
                      locally override account
                      identity.
                    </p>
                  </div>
                </div>
              </section>
            )}


            {/* =================================================
                SECURITY
            ================================================== */}

            {activeSection ===
              "security" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      PROTECTION
                    </span>

                    <h2>
                      Security
                    </h2>

                    <p>
                      Authentication state
                      is controlled by the
                      backend.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.securityCard
                  }
                >
                  <div
                    className={
                      styles.securityIcon
                    }
                  >
                    <Icon
                      name="security"
                      size={20}
                    />
                  </div>

                  <div
                    className={
                      styles.securityCopy
                    }
                  >
                    <h3>
                      Authenticated session
                    </h3>

                    <p>
                      ZyrionOS uses the
                      connected authentication
                      system for account
                      protection.
                    </p>
                  </div>

                  <div
                    className={
                      styles.statusSuccess
                    }
                  >
                    <span />
                    Authenticated
                  </div>
                </div>
              </section>
            )}


            {/* =================================================
                SESSIONS
            ================================================== */}

            {activeSection ===
              "sessions" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      ACCESS
                    </span>

                    <h2>
                      Sessions & Devices
                    </h2>

                    <p>
                      Session-management
                      controls are shown only
                      when a real backend
                      contract exists.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.emptyState
                  }
                >
                  <div
                    className={
                      styles.emptyStateIcon
                    }
                  >
                    <Icon
                      name="sessions"
                      size={24}
                    />
                  </div>

                  <h3>
                    Session controls are
                    not connected yet
                  </h3>

                  <p>
                    No fake sessions or
                    device records are
                    displayed.
                  </p>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    Protected
                  </span>
                </div>
              </section>
            )}


            {/* =================================================
                NOTIFICATIONS
            ================================================== */}

            {activeSection ===
              "notifications" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      PREFERENCES
                    </span>

                    <h2>
                      Notifications
                    </h2>

                    <p>
                      Notification controls
                      remain read-only until
                      the preferences API
                      exists.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.emptyState
                  }
                >
                  <div
                    className={
                      styles.emptyStateIcon
                    }
                  >
                    <Icon
                      name="notifications"
                      size={24}
                    />
                  </div>

                  <h3>
                    Notification API not
                    connected
                  </h3>

                  <p>
                    No local toggles pretend
                    to save data to a backend
                    that does not exist.
                  </p>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    Backend required
                  </span>
                </div>
              </section>
            )}


            {/* =================================================
                AI
            ================================================== */}

            {activeSection ===
              "ai" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      INTELLIGENCE
                    </span>

                    <h2>
                      AI Preferences
                    </h2>

                    <p>
                      AI execution remains
                      controlled by the
                      connected backend
                      services.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.aiHero
                  }
                >
                  <div
                    className={
                      styles.aiIcon
                    }
                  >
                    <Icon
                      name="ai"
                      size={24}
                    />
                  </div>

                  <div>
                    <h3>
                      ZyrionOS AI
                    </h3>

                    <p>
                      AI requests continue
                      through the existing
                      centralized AI service.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.cardGrid
                  }
                >
                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      MODEL
                    </span>

                    <strong>
                      Backend controlled
                    </strong>

                    <p>
                      No hard-coded model is
                      presented as the active
                      production provider.
                    </p>
                  </div>

                  <div
                    className={
                      styles.settingCard
                    }
                  >
                    <span
                      className={
                        styles.cardLabel
                      }
                    >
                      EXECUTION
                    </span>

                    <strong>
                      Project controlled
                    </strong>

                    <p>
                      AI operations remain
                      tied to the actual
                      project workflow.
                    </p>
                  </div>
                </div>
              </section>
            )}


            {/* =================================================
                WORKSPACE
            ================================================== */}

            {activeSection ===
              "workspace" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      WORKSPACE
                    </span>

                    <h2>
                      Workspace
                    </h2>

                    <p>
                      Open the main
                      project-building
                      environment.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={
                    styles.navigationActionCard
                  }
                  onClick={() =>
                    navigate(
                      "/workspace"
                    )
                  }
                >
                  <div
                    className={
                      styles.navigationActionIcon
                    }
                  >
                    <Icon
                      name="workspace"
                      size={21}
                    />
                  </div>

                  <div
                    className={
                      styles.navigationActionCopy
                    }
                  >
                    <h3>
                      Open Workspace
                    </h3>

                    <p>
                      Projects, AI builds,
                      code, preview and
                      deployment.
                    </p>
                  </div>

                  <Icon
                    name="arrow"
                    size={18}
                  />
                </button>
              </section>
            )}


            {/* =================================================
                BILLING
            ================================================== */}

            {activeSection ===
              "billing" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      COMMERCE
                    </span>

                    <h2>
                      Billing & Plan
                    </h2>

                    <p>
                      View real subscription
                      information from the
                      billing service.
                    </p>
                  </div>
                </div>

                {subscriptionLoading && (
                  <div
                    className={
                      styles.loadingInline
                    }
                  >
                    <div
                      className={
                        styles.loadingSpinner
                      }
                    />
                    Loading subscription...
                  </div>
                )}

                {subscriptionError && (
                  <div
                    className={
                      styles.errorNotice
                    }
                  >
                    <strong>
                      Subscription unavailable
                    </strong>

                    <p>
                      {subscriptionError}
                    </p>

                    <button
                      type="button"
                      onClick={
                        loadSubscription
                      }
                      className={
                        styles.retryButton
                      }
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!subscriptionLoading &&
                  !subscriptionError &&
                  subscription && (
                    <div
                      className={
                        styles.subscriptionCard
                      }
                    >
                      <div
                        className={
                          styles.subscriptionIcon
                        }
                      >
                        <Icon
                          name="billing"
                          size={22}
                        />
                      </div>

                      <div
                        className={
                          styles.subscriptionCopy
                        }
                      >
                        <span
                          className={
                            styles.cardLabel
                          }
                        >
                          CURRENT PLAN
                        </span>

                        <h3>
                          {subscriptionName ||
                            "Plan information"}
                        </h3>

                        {billingCycle && (
                          <p>
                            Billing cycle:{" "}
                            {
                              billingCycle
                            }
                          </p>
                        )}

                        {subscriptionStatus && (
                          <span
                            className={
                              styles.subscriptionStatus
                            }
                          >
                            {
                              subscriptionStatus
                            }
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={
                          styles.primaryButton
                        }
                        onClick={() =>
                          navigate(
                            "/billing"
                          )
                        }
                      >
                        Manage Billing

                        <Icon
                          name="arrow"
                          size={16}
                        />
                      </button>
                    </div>
                  )}

                {!subscriptionLoading &&
                  !subscriptionError &&
                  !subscription && (
                    <div
                      className={
                        styles.emptyState
                      }
                    >
                      <div
                        className={
                          styles.emptyStateIcon
                        }
                      >
                        <Icon
                          name="billing"
                          size={24}
                        />
                      </div>

                      <h3>
                        No subscription record
                      </h3>

                      <p>
                        The billing service
                        did not return a
                        subscription record.
                      </p>

                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={() =>
                          navigate(
                            "/billing"
                          )
                        }
                      >
                        Open Billing

                        <Icon
                          name="arrow"
                          size={15}
                        />
                      </button>
                    </div>
                  )}
              </section>
            )}


            {/* =================================================
                ENVIRONMENT
            ================================================== */}

            {activeSection ===
              "environment" && (
              <section
                className={`${styles.section} ${styles.environmentSection}`}
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      CONFIGURATION
                    </span>

                    <h2>
                      Environment
                    </h2>

                    <p>
                      Manage project environment
                      variables and secrets through
                      the authenticated backend.
                    </p>
                  </div>

                  <div
                    className={
                      styles.integrationStatus
                    }
                  >
                    <span />
                    Backend connected
                  </div>
                </div>


                {/* PROJECT / ENVIRONMENT */}
                <div
                  className={
                    styles.formGridTwo
                  }
                >
                  <label
                    className={
                      styles.field
                    }
                  >
                    <span>
                      PROJECT
                    </span>

                    <select
                      value={
                        selectedProjectId
                      }
                      onChange={
                        handleEnvironmentProjectChange
                      }
                      disabled={
                        environmentLoading
                      }
                    >
                      <option value="">
                        Select project
                      </option>

                      {projects.map(
                        (project) => (
                          <option
                            key={getProjectId(
                              project
                            )}
                            value={getProjectId(
                              project
                            )}
                          >
                            {getProjectName(
                              project
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    className={
                      styles.field
                    }
                  >
                    <span>
                      ENVIRONMENT
                    </span>

                    <select
                      value={
                        selectedEnvironmentName
                      }
                      onChange={
                        handleEnvironmentChange
                      }
                      disabled={
                        !selectedProjectId ||
                        environmentLoading
                      }
                    >
                      <option value="">
                        Select environment
                      </option>

                      {environments.map(
                        (environment) => {
                          const name =
                            getEnvironmentName(
                              environment
                            );

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
                  </label>
                </div>


                <div
                  className={
                    styles.environmentToolbar
                  }
                >
                  <div>
                    <strong>
                      {selectedEnvironmentName ||
                        "No environment selected"}
                    </strong>

                    <span>
                      {environmentVariables.length}{" "}
                      stored variable
                      {environmentVariables.length !==
                      1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.iconButton
                    }
                    onClick={() => {
                      if (
                        selectedProjectId
                      ) {
                        loadEnvironmentList(
                          selectedProjectId
                        );
                      }
                    }}
                    disabled={
                      environmentLoading
                    }
                    title="Refresh environment"
                  >
                    <Icon
                      name="refresh"
                      size={16}
                    />
                  </button>
                </div>


                {environmentError && (
                  <div
                    className={
                      styles.inlineError
                    }
                  >
                    <Icon
                      name="danger"
                      size={16}
                    />

                    <span>
                      {environmentError}
                    </span>
                  </div>
                )}

                {environmentMessage && (
                  <div
                    className={
                      styles.inlineSuccess
                    }
                  >
                    <Icon
                      name="check"
                      size={16}
                    />

                    <span>
                      {environmentMessage}
                    </span>
                  </div>
                )}


                {/* VARIABLE DRAFTS */}
                <form
                  onSubmit={
                    handleSaveEnvironmentVariables
                  }
                >
                  <div
                    className={
                      styles.environmentDraftHeader
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.formSectionTitleLabel
                        }
                      >
                        VARIABLE QUEUE
                      </span>

                      <small>
                        Add multiple variables
                        first, then save them
                        together to the backend.
                      </small>
                    </div>

                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={
                        addEnvironmentDraft
                      }
                      disabled={
                        environmentSavingAll ||
                        !selectedProjectId ||
                        !selectedEnvironmentName
                      }
                    >
                      <Icon
                        name="plus"
                        size={15}
                      />

                      Add Variable
                    </button>
                  </div>


                  <div
                    className={
                      styles.environmentDraftList
                    }
                  >
                    {environmentDrafts.map(
                      (
                        draft,
                        index
                      ) => (
                        <div
                          key={
                            draft.id
                          }
                          className={
                            styles.environmentForm
                          }
                        >
                          <div
                            className={
                              styles.formSectionTitle
                            }
                          >
                            <div>
                              <span>
                                {draft.originalKey
                                  ? `UPDATE VARIABLE: ${draft.originalKey}`
                                  : `VARIABLE ${String(
                                      index + 1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}`}
                              </span>

                              <small>
                                {draft.originalKey
                                  ? "Enter the replacement value. The old secret is never returned."
                                  : "This value will be sent directly to the authenticated backend."}
                              </small>
                            </div>

                            <button
                              type="button"
                              className={
                                styles.dangerTextButton
                              }
                              onClick={() =>
                                removeEnvironmentDraft(
                                  draft.id
                                )
                              }
                              disabled={
                                environmentSavingAll
                              }
                            >
                              <Icon
                                name="trash"
                                size={14}
                              />

                              Remove
                            </button>
                          </div>


                          <div
                            className={
                              styles.formGridTwo
                            }
                          >
                            <label
                              className={
                                styles.field
                              }
                            >
                              <span>
                                KEY
                              </span>

                              <div
                                className={
                                  styles.inputWithIcon
                                }
                              >
                                <Icon
                                  name="key"
                                  size={15}
                                />

                                <input
                                  type="text"
                                  value={
                                    draft.key
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleEnvironmentDraftChange(
                                      draft.id,
                                      "key",
                                      event
                                        .target
                                        .value
                                        .toUpperCase()
                                    )
                                  }
                                  placeholder="OPENAI_API_KEY"
                                  autoComplete="off"
                                  disabled={
                                    Boolean(
                                      draft.originalKey
                                    )
                                  }
                                />
                              </div>
                            </label>

                            <label
                              className={
                                styles.field
                              }
                            >
                              <span>
                                VALUE
                              </span>

                              <div
                                className={
                                  styles.inputWithAction
                                }
                              >
                                <input
                                  type={
                                    draft.visible
                                      ? "text"
                                      : "password"
                                  }
                                  value={
                                    draft.value
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleEnvironmentDraftChange(
                                      draft.id,
                                      "value",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder={
                                    draft.originalKey
                                      ? "Enter replacement value"
                                      : "Enter API key or value"
                                  }
                                  autoComplete="new-password"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEnvironmentDraftChange(
                                      draft.id,
                                      "visible",
                                      !draft.visible
                                    )
                                  }
                                  className={
                                    styles.inputAction
                                  }
                                  title={
                                    draft.visible
                                      ? "Hide typed value"
                                      : "Show typed value"
                                  }
                                >
                                  <Icon
                                    name={
                                      draft.visible
                                        ? "eyeOff"
                                        : "eye"
                                    }
                                    size={16}
                                  />
                                </button>
                              </div>
                            </label>
                          </div>


                          <div
                            className={
                              styles.formGridThree
                            }
                          >
                            <label
                              className={
                                styles.field
                              }
                            >
                              <span>
                                TYPE
                              </span>

                              <select
                                value={
                                  draft.type
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleEnvironmentDraftChange(
                                    draft.id,
                                    "type",
                                    event
                                      .target
                                      .value
                                  )
                                }
                              >
                                <option value="string">
                                  String
                                </option>

                                <option value="number">
                                  Number
                                </option>

                                <option value="boolean">
                                  Boolean
                                </option>

                                <option value="json">
                                  JSON
                                </option>
                              </select>
                            </label>

                            <label
                              className={
                                styles.field
                              }
                            >
                              <span>
                                SCOPE
                              </span>

                              <select
                                value={
                                  draft.scope
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleEnvironmentDraftChange(
                                    draft.id,
                                    "scope",
                                    event
                                      .target
                                      .value
                                  )
                                }
                              >
                                <option value="runtime">
                                  Runtime
                                </option>

                                <option value="build">
                                  Build
                                </option>

                                <option value="both">
                                  Build + Runtime
                                </option>
                              </select>
                            </label>

                            <div
                              className={
                                styles.environmentCheckboxStack
                              }
                            >
                              <label
                                className={
                                  styles.checkboxField
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    draft.required
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleEnvironmentDraftChange(
                                      draft.id,
                                      "required",
                                      event
                                        .target
                                        .checked
                                    )
                                  }
                                />

                                <span>
                                  Required
                                </span>
                              </label>

                              <label
                                className={
                                  styles.checkboxField
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    draft.isSecret
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleEnvironmentDraftChange(
                                      draft.id,
                                      "isSecret",
                                      event
                                        .target
                                        .checked
                                    )
                                  }
                                />

                                <span>
                                  Secret
                                </span>
                              </label>
                            </div>
                          </div>


                          <div
                            className={
                              styles.environmentFormFooter
                            }
                          >
                            <div
                              className={
                                styles.secretNotice
                              }
                            >
                              <Icon
                                name="security"
                                size={15}
                              />

                              <span>
                                Secret values are
                                never displayed from
                                backend responses.
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>


                  <div
                    className={
                      styles.environmentSaveBar
                    }
                  >
                    <div>
                      <strong>
                        {environmentDrafts.length}{" "}
                        variable
                        {environmentDrafts.length !==
                        1
                          ? "s"
                          : ""}{" "}
                        in queue
                      </strong>

                      <span>
                        Save sends each queued
                        variable through the real
                        environment API.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className={
                        styles.primaryButton
                      }
                      disabled={
                        environmentSavingAll ||
                        !selectedProjectId ||
                        !selectedEnvironmentName
                      }
                    >
                      {environmentSavingAll ? (
                        <>
                          <span
                            className={
                              styles.buttonSpinner
                            }
                          />

                          Saving...
                        </>
                      ) : (
                        <>
                          <Icon
                            name="check"
                            size={15}
                          />

                          Save Variables
                        </>
                      )}
                    </button>
                  </div>
                </form>


                {/* STORED VARIABLES */}
                <div
                  className={
                    styles.variableSection
                  }
                >
                  <div
                    className={
                      styles.formSectionTitle
                    }
                  >
                    <div>
                      <span>
                        STORED VARIABLES
                      </span>

                      <small>
                        Metadata is visible;
                        secret values remain
                        hidden.
                      </small>
                    </div>

                    <span
                      className={
                        styles.countBadge
                      }
                    >
                      {
                        environmentVariables.length
                      }
                    </span>
                  </div>

                  {environmentLoading ? (
                    <div
                      className={
                        styles.smallLoading
                      }
                    >
                      <div
                        className={
                          styles.loadingSpinner
                        }
                      />

                      Loading environment...
                    </div>
                  ) : environmentVariables.length ? (
                    <div
                      className={
                        styles.variableList
                      }
                    >
                      {environmentVariables.map(
                        (variable) => {
                          const key =
                            variable?.key ||
                            "Unnamed";

                          return (
                            <div
                              key={key}
                              className={
                                styles.variableRow
                              }
                            >
                              <div
                                className={
                                  styles.variableMain
                                }
                              >
                                <div
                                  className={
                                    styles.variableKey
                                  }
                                >
                                  <Icon
                                    name="key"
                                    size={15}
                                  />

                                  <strong>
                                    {key}
                                  </strong>
                                </div>

                                <div
                                  className={
                                    styles.variableMeta
                                  }
                                >
                                  <span>
                                    {variable?.scope ||
                                      "runtime"}
                                  </span>

                                  <span>
                                    {variable?.type ||
                                      "string"}
                                  </span>

                                  {variable?.required && (
                                    <span>
                                      required
                                    </span>
                                  )}

                                  {variable?.enabled ===
                                    false && (
                                    <span>
                                      disabled
                                    </span>
                                  )}

                                  {variable?.isSecret && (
                                    <span
                                      className={
                                        styles.secretBadge
                                      }
                                    >
                                      secret
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div
                                className={
                                  styles.variableValue
                                }
                              >
                                <code>
                                  {variable?.isSecret
                                    ? "••••••••••••••••"
                                    : variable?.hasValue
                                      ? "configured"
                                      : "not configured"}
                                </code>
                              </div>

                              <div
                                className={
                                  styles.variableActions
                                }
                              >
                                <button
                                  type="button"
                                  className={
                                    styles.smallActionButton
                                  }
                                  onClick={() =>
                                    editEnvironmentVariable(
                                      variable
                                    )
                                  }
                                  title="Replace value"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={
                                    styles.dangerActionButton
                                  }
                                  onClick={() =>
                                    handleDeleteEnvironmentVariable(
                                      key
                                    )
                                  }
                                  disabled={
                                    environmentDeletingKey ===
                                    key
                                  }
                                  title="Delete variable"
                                >
                                  {environmentDeletingKey ===
                                  key ? (
                                    <span
                                      className={
                                        styles.buttonSpinner
                                      }
                                    />
                                  ) : (
                                    <Icon
                                      name="trash"
                                      size={15}
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div
                      className={
                        styles.emptyIntegration
                      }
                    >
                      <Icon
                        name="key"
                        size={22}
                      />

                      <strong>
                        No variables configured
                      </strong>

                      <span>
                        Add your first backend
                        environment variable
                        above.
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}


            {/* =================================================
                INTEGRATIONS / GITHUB
            ================================================== */}

            {activeSection ===
              "integrations" && (
              <section
                className={`${styles.section} ${styles.integrationSection}`}
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      CONNECTIVITY
                    </span>

                    <h2>
                      Integrations
                    </h2>

                    <p>
                      Connect GitHub, choose
                      repositories and branches,
                      then hand the deployment to
                      the backend.
                    </p>
                  </div>

                  <div
                    className={
                      styles.integrationStatus
                    }
                  >
                    <span />
                    Live backend controls
                  </div>
                </div>


                {/* PROJECT */}
                <div
                  className={
                    styles.formGridTwo
                  }
                >
                  <label
                    className={
                      styles.field
                    }
                  >
                    <span>
                      ZYRIONOS PROJECT
                    </span>

                    <select
                      value={
                        selectedProjectId
                      }
                      onChange={(event) =>
                        setSelectedProjectId(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Select project
                      </option>

                      {projects.map(
                        (project) => (
                          <option
                            key={getProjectId(
                              project
                            )}
                            value={getProjectId(
                              project
                            )}
                          >
                            {getProjectName(
                              project
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <div
                    className={
                      styles.githubProjectHint
                    }
                  >
                    <Icon
                      name="info"
                      size={15}
                    />

                    <span>
                      GitHub is connected
                      through the authenticated
                      backend OAuth workflow.
                    </span>
                  </div>
                </div>


                {/* GITHUB PANEL */}
                <div
                  className={
                    styles.integrationPanel
                  }
                >
                  <div
                    className={
                      styles.integrationPanelHeader
                    }
                  >
                    <div>
                      <div
                        className={
                          styles.panelTitleRow
                        }
                      >
                        <div
                          className={
                            styles.githubPanelIcon
                          }
                        >
                          <Icon
                            name="github"
                            size={21}
                          />
                        </div>

                        <div>
                          <h3>
                            GitHub
                          </h3>

                          <p>
                            Connect GitHub, choose a
                            repository and branch,
                            then deploy through the
                            backend.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={
                        styles.iconButton
                      }
                      onClick={
                        handleGithubRefresh
                      }
                      disabled={
                        githubLoading ||
                        !selectedProjectId
                      }
                      title="Refresh GitHub"
                    >
                      <Icon
                        name="refresh"
                        size={16}
                      />
                    </button>
                  </div>


                  {/* CONNECTION */}
                  <div
                    className={
                      styles.githubConnectionCard
                    }
                  >
                    <div
                      className={
                        styles.githubConnectionIcon
                      }
                    >
                      <Icon
                        name="github"
                        size={23}
                      />
                    </div>

                    <div
                      className={
                        styles.githubConnectionCopy
                      }
                    >
                      <span
                        className={
                          styles.cardLabel
                        }
                      >
                        GITHUB CONNECTION
                      </span>

                      {githubConnections.length ? (
                        <>
                          <strong>
                            {
                              getConnectionLabel(
                                githubConnections.find(
                                  (item) =>
                                    String(
                                      getConnectionId(
                                        item
                                      )
                                    ) ===
                                    String(
                                      selectedConnectionId
                                    )
                                ) ||
                                  githubConnections[0]
                              )
                            }
                          </strong>

                          <p>
                            {
                              githubConnections.length
                            }{" "}
                            connection
                            {githubConnections.length !==
                            1
                              ? "s"
                              : ""}{" "}
                            available for this
                            project.
                          </p>
                        </>
                      ) : (
                        <>
                          <strong>
                            No GitHub connection
                          </strong>

                          <p>
                            Connect your GitHub
                            account using the real
                            OAuth flow.
                          </p>
                        </>
                      )}
                    </div>

                    <div
                      className={
                        styles.githubConnectionActions
                      }
                    >
                      {githubConnections.length >
                        0 && (
                        <label
                          className={
                            styles.connectionSelect
                          }
                        >
                          <span>
                            CONNECTION
                          </span>

                          <select
                            value={
                              selectedConnectionId
                            }
                            onChange={(event) =>
                              setSelectedConnectionId(
                                event
                                  .target
                                  .value
                              )
                            }
                          >
                            {githubConnections.map(
                              (
                                connection
                              ) => (
                                <option
                                  key={getConnectionId(
                                    connection
                                  )}
                                  value={getConnectionId(
                                    connection
                                  )}
                                >
                                  {getConnectionLabel(
                                    connection
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        </label>
                      )}

                      <button
                        type="button"
                        className={
                          githubConnections.length
                            ? styles.secondaryButton
                            : styles.primaryButton
                        }
                        onClick={
                          handleConnectGithub
                        }
                      >
                        <Icon
                          name="github"
                          size={15}
                        />

                        {githubConnections.length
                          ? "Add / Reconnect"
                          : "Connect GitHub"}
                      </button>
                    </div>
                  </div>


                  {githubError && (
                    <div
                      className={
                        styles.inlineError
                      }
                    >
                      <Icon
                        name="danger"
                        size={16}
                      />

                      <span>
                        {githubError}
                      </span>
                    </div>
                  )}

                  {githubMessage && (
                    <div
                      className={
                        styles.inlineSuccess
                      }
                    >
                      <Icon
                        name="check"
                        size={16}
                      />

                      <span>
                        {githubMessage}
                      </span>
                    </div>
                  )}


                  {/* WORKFLOW */}
                  <div
                    className={
                      styles.githubWorkflow
                    }
                  >

                    {/* STEP 01 */}
                    <div
                      className={
                        styles.workflowStep
                      }
                    >
                      <span
                        className={
                          styles.workflowNumber
                        }
                      >
                        01
                      </span>

                      <div
                        className={
                          styles.workflowContent
                        }
                      >
                        <div
                          className={
                            styles.workflowTitle
                          }
                        >
                          Repository
                        </div>

                        <label
                          className={
                            styles.field
                          }
                        >
                          <span>
                            GITHUB REPOSITORY
                          </span>

                          <div
                            className={
                              styles.inputWithIcon
                            }
                          >
                            <Icon
                              name="repository"
                              size={15}
                            />

                            <select
                              value={getRepositoryName(
                                selectedRepository
                              )}
                              onChange={
                                handleGithubRepositoryChange
                              }
                              disabled={
                                !selectedConnectionId ||
                                githubLoading
                              }
                            >
                              <option value="">
                                Select repository
                              </option>

                              {githubRepositories.map(
                                (
                                  repository
                                ) => {
                                  const name =
                                    getRepositoryName(
                                      repository
                                    );

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
                          </div>
                        </label>
                      </div>
                    </div>


                    {/* STEP 02 */}
                    <div
                      className={
                        styles.workflowStep
                      }
                    >
                      <span
                        className={
                          styles.workflowNumber
                        }
                      >
                        02
                      </span>

                      <div
                        className={
                          styles.workflowContent
                        }
                      >
                        <div
                          className={
                            styles.workflowTitle
                          }
                        >
                          Branch
                        </div>

                        <label
                          className={
                            styles.field
                          }
                        >
                          <span>
                            GIT BRANCH
                          </span>

                          <div
                            className={
                              styles.inputWithIcon
                            }
                          >
                            <Icon
                              name="branch"
                              size={15}
                            />

                            <select
                              value={
                                selectedBranch
                              }
                              onChange={
                                handleGithubBranchChange
                              }
                              disabled={
                                !selectedRepository ||
                                githubLoading
                              }
                            >
                              <option value="">
                                Select branch
                              </option>

                              {githubBranches.map(
                                (branch) => {
                                  const name =
                                    getBranchName(
                                      branch
                                    );

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
                          </div>
                        </label>
                      </div>
                    </div>


                    {/* STEP 03 */}
                    <div
                      className={
                        styles.workflowStep
                      }
                    >
                      <span
                        className={
                          styles.workflowNumber
                        }
                      >
                        03
                      </span>

                      <div
                        className={
                          styles.workflowContent
                        }
                      >
                        <div
                          className={
                            styles.workflowTitle
                          }
                        >
                          Deployment Environment
                        </div>

                        <label
                          className={
                            styles.field
                          }
                        >
                          <span>
                            ENVIRONMENT
                          </span>

                          <select
                            value={
                              selectedEnvironmentName
                            }
                            onChange={(event) =>
                              setSelectedEnvironmentName(
                                event
                                  .target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select environment
                            </option>

                            {environments.map(
                              (
                                environment
                              ) => {
                                const name =
                                  getEnvironmentName(
                                    environment
                                  );

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
                        </label>
                      </div>
                    </div>
                  </div>


                  {/* DEPLOYMENT CONTROL */}
                  <div
                    className={
                      styles.githubActionBar
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.cardLabel
                        }
                      >
                        DEPLOYMENT CONTROL
                      </span>

                      <strong>
                        {getRepositoryName(
                          selectedRepository
                        ) ||
                          "No repository selected"}
                      </strong>

                      <p>
                        Branch:{" "}
                        {selectedBranch ||
                          "not selected"}
                        {" · "}
                        Environment:{" "}
                        {selectedEnvironmentName ||
                          "not selected"}
                      </p>
                    </div>

                    <div
                      className={
                        styles.githubActionButtons
                      }
                    >
                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={
                          handleGithubReadiness
                        }
                        disabled={
                          githubActionLoading ||
                          !selectedProjectId ||
                          !selectedConnectionId ||
                          !selectedRepository ||
                          !selectedBranch
                        }
                      >
                        {githubActionLoading ? (
                          <span
                            className={
                              styles.buttonSpinner
                            }
                          />
                        ) : (
                          <Icon
                            name="security"
                            size={15}
                          />
                        )}

                        Check Readiness
                      </button>

                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        onClick={
                          handlePrepareGithubDeployment
                        }
                        disabled={
                          githubActionLoading ||
                          !selectedProjectId ||
                          !selectedConnectionId ||
                          !selectedRepository ||
                          !selectedBranch
                        }
                      >
                        <Icon
                          name="repository"
                          size={15}
                        />

                        Prepare
                      </button>

                      <button
                        type="button"
                        className={
                          styles.primaryButton
                        }
                        onClick={
                          handleGithubDeploy
                        }
                        disabled={
                          githubActionLoading ||
                          !selectedProjectId ||
                          !selectedConnectionId ||
                          !selectedRepository ||
                          !selectedBranch
                        }
                      >
                        {githubActionLoading ? (
                          <span
                            className={
                              styles.buttonSpinner
                            }
                          />
                        ) : (
                          <Icon
                            name="deploy"
                            size={15}
                          />
                        )}

                        Deploy
                      </button>
                    </div>
                  </div>


                  {githubReadiness && (
                    <div
                      className={
                        styles.readinessCard
                      }
                    >
                      <div
                        className={
                          styles.readinessIcon
                        }
                      >
                        <Icon
                          name="check"
                          size={18}
                        />
                      </div>

                      <div>
                        <strong>
                          Deployment readiness
                        </strong>

                        <p>
                          {githubReadiness?.message ||
                            githubReadiness?.status ||
                            (githubReadiness?.ready ===
                            true
                              ? "Backend returned deployment readiness data."
                              : githubReadiness?.ready ===
                                false
                                ? "Backend reports that deployment is not ready."
                                : "Backend returned a readiness response.")}
                        </p>
                      </div>

                      <span
                        className={
                          githubReadiness?.ready ===
                          false
                            ? styles.readinessBad
                            : styles.readinessGood
                        }
                      >
                        {githubReadiness?.ready ===
                        false
                          ? "Not ready"
                          : "Response received"}
                      </span>
                    </div>
                  )}

                  {githubPreparedContract && (
                    <div
                      className={
                        styles.inlineSuccess
                      }
                    >
                      <Icon
                        name="check"
                        size={16}
                      />

                      <span>
                        Deployment contract is
                        prepared and ready for
                        the deployment handoff.
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}


            {/* =================================================
                PRIVACY
            ================================================== */}

            {activeSection ===
              "privacy" && (
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrow
                      }
                    >
                      DATA
                    </span>

                    <h2>
                      Privacy & Data
                    </h2>

                    <p>
                      Sensitive data remains
                      controlled by
                      authenticated backend
                      operations.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.privacyCard
                  }
                >
                  <div
                    className={
                      styles.privacyIcon
                    }
                  >
                    <Icon
                      name="privacy"
                      size={21}
                    />
                  </div>

                  <div>
                    <h3>
                      Secure data handling
                    </h3>

                    <p>
                      Environment secrets are
                      not rendered back into
                      the browser as plaintext.
                    </p>
                  </div>

                  <span
                    className={
                      styles.neutralBadge
                    }
                  >
                    Protected
                  </span>
                </div>
              </section>
            )}


            {/* =================================================
                DANGER
            ================================================== */}

            {activeSection ===
              "danger" && (
              <section
                className={`${styles.section} ${styles.dangerSection}`}
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.sectionEyebrowDanger
                      }
                    >
                      ACCOUNT CONTROL
                    </span>

                    <h2>
                      Danger Zone
                    </h2>

                    <p>
                      Destructive operations
                      remain disabled until
                      their protected backend
                      contracts exist.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.dangerCard
                  }
                >
                  <div
                    className={
                      styles.dangerIcon
                    }
                  >
                    <Icon
                      name="danger"
                      size={21}
                    />
                  </div>

                  <div
                    className={
                      styles.dangerCopy
                    }
                  >
                    <h3>
                      Destructive account
                      actions
                    </h3>

                    <p>
                      No fake delete button is
                      exposed. Destructive
                      account APIs must be
                      authenticated and
                      explicitly connected.
                    </p>
                  </div>

                  <span
                    className={
                      styles.dangerBadge
                    }
                  >
                    Protected
                  </span>
                </div>
              </section>
            )}

          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
