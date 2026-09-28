import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import styles from "./Sidebar.module.css";

import navigation from "../../config/navigation";
import { APP_NAME, APP_TAGLINE } from "../../config/constants";

import workspaceService from "../../services/workspaceService";
import environmentService from "../../services/environmentService";
import githubService from "../../services/githubService";
import deploymentService from "../../services/deploymentService";

/* =========================================================
   ZYRIONOS ENTERPRISE ICON SYSTEM
========================================================= */

function Icon({ name, size = 19 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  switch (String(name || "").toLowerCase()) {
    case "dashboard":
    case "home":
      return (
        <svg {...common}>
          <path d="M3.5 10.5 12 3.5l8.5 7" />
          <path d="M5.5 9.5V20h13V9.5" />
          <path d="M9.5 20v-5.75h5V20" />
        </svg>
      );

    case "workspace":
    case "projects":
    case "project":
      return (
        <svg {...common}>
          <path d="M3.5 7.75A2.25 2.25 0 0 1 5.75 5.5H10l2 2h6.25a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25H5.75a2.25 2.25 0 0 1-2.25-2.25z" />
          <path d="M3.75 10h16.5" />
          <path d="M8 14h4" />
        </svg>
      );

    case "deployment":
    case "deployments":
    case "deploy":
      return (
        <svg {...common}>
          <path d="M12 15V3.5" />
          <path d="m7.5 8 4.5-4.5L16.5 8" />
          <path d="M5 15.5h14" />
          <path d="M4 20.5h16" />
          <path d="M8 15.5v2.5" />
          <path d="M16 15.5v2.5" />
        </svg>
      );

    case "ai":
    case "ai-tools":
    case "sparkles":
      return (
        <svg {...common}>
          <path d="m12 3 1.35 4.35L17.5 9l-4.15 1.65L12 15l-1.35-4.35L6.5 9l4.15-1.65z" />
          <path d="m19 14 .65 2.35L22 17l-2.35.65L19 20l-.65-2.35L16 17l2.35-.65z" />
          <path d="m5 14 .5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5z" />
        </svg>
      );

    case "template":
    case "templates":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      );

    case "billing":
    case "payment":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 10h18" />
          <path d="M7 15h3.5" />
          <path d="M16 15h1" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" />
          <path d="m19.15 15.1.55 1.25-1.7 1.7-1.25-.55a1.75 1.75 0 0 0-2.35 1v1.35h-2.4V19.5a1.75 1.75 0 0 0-2.35-1l-1.25.55-1.7-1.7.55-1.25a1.75 1.75 0 0 0-1-2.35H4.9v-2.4h1.35a1.75 1.75 0 0 0 1-2.35L6.7 7.75l1.7-1.7 1.25.55a1.75 1.75 0 0 0 2.35-1V4.25h2.4V5.6a1.75 1.75 0 0 0 2.35 1L18 6.05l1.7 1.7-.55 1.25a1.75 1.75 0 0 0 1 2.35h1.35v2.4H20.15a1.75 1.75 0 0 0-1 1.35Z" />
        </svg>
      );

    case "analytics":
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19.5V12" />
          <path d="M10 19.5V7" />
          <path d="M16 19.5V10" />
          <path d="M22 19.5V4.5" />
          <path d="M3 19.5h20" />
        </svg>
      );

    case "terminal":
    case "code":
      return (
        <svg {...common}>
          <path d="m8 7-5 5 5 5" />
          <path d="m16 7 5 5-5 5" />
          <path d="m14 4-4 16" />
        </svg>
      );

    case "cloud":
      return (
        <svg {...common}>
          <path d="M7 18.5h10a4 4 0 0 0 .45-7.97A6 6 0 0 0 6 11.5h1a3.5 3.5 0 0 0 0 7Z" />
        </svg>
      );

    case "folder":
      return (
        <svg {...common}>
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z" />
          <path d="M3.5 10h17" />
        </svg>
      );

    case "security":
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3.5 19 6v5.5c0 4.25-2.75 7.55-7 9-4.25-1.45-7-4.75-7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "users":
    case "team":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c.4-3 2.25-5 5.5-5s5.1 2 5.5 5" />
          <path d="M16 6.5a2.7 2.7 0 0 1 0 5.2" />
          <path d="M16.5 14c2.2.35 3.45 1.95 4 4" />
        </svg>
      );

    case "github":
      return (
        <svg {...common}>
          <path d="M9 19c-4.5 1.5-4.5-2.5-6-3m12 6v-3.5c0-1 .1-1.5-.5-2.5 3.5-.4 7-1.7 7-7.5a5.8 5.8 0 0 0-1.6-4.1A5.4 5.4 0 0 0 19.8 1S18.5.6 16 2.3a13.4 13.4 0 0 0-8 0C5.5.6 4.2 1 4.2 1a5.4 5.4 0 0 0-.1 4.9A5.8 5.8 0 0 0 2.5 10.1c0 5.8 3.5 7.1 7 7.5-.6 1-.6 1.8-.5 2.5V22" />
        </svg>
      );

    case "environment":
    case "environments":
      return (
        <svg {...common}>
          <path d="M7 3.5h10" />
          <path d="M7 20.5h10" />
          <path d="M8 4v4.5c0 1.4 1 2.2 2.2 3.5C9 13.2 8 14.1 8 15.5V20" />
          <path d="M16 4v4.5c0 1.4-1 2.2-2.2 3.5 1.2 1.2 2.2 2.1 2.2 3.5V20" />
          <path d="M10 12h4" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      );

    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.35 2.35 0 1 1 3.9 1.75c-.95.75-1.7 1.15-1.7 2.5" />
          <path d="M12 16.8h.01" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.7-4L3 9" />
          <path d="M3 4v5h5" />
          <path d="M4 13a8 8 0 0 0 14.7 4L21 15" />
          <path d="M21 20v-5h-5" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "key":
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="m11 12 8-8" />
          <path d="m16 5 3 3" />
          <path d="m14 7 3 3" />
        </svg>
      );

    case "branch":
      return (
        <svg {...common}>
          <circle cx="6" cy="5" r="2" />
          <circle cx="18" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path d="M8 5h5a5 5 0 0 1 5 5v7" />
          <path d="M8 5v6a5 5 0 0 0 5 5h3" />
        </svg>
      );

    case "repository":
      return (
        <svg {...common}>
          <path d="M6 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "alert":
      return (
        <svg {...common}>
          <path d="M12 3.5 21 20H3z" />
          <path d="M12 9v5" />
          <path d="M12 17.5h.01" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function unwrapResponse(response) {
  const body = response?.data ?? response;

  if (body?.data !== undefined) {
    return body.data;
  }

  return body;
}

function getCollection(response, keys = []) {
  const body = unwrapResponse(response);

  if (Array.isArray(body)) {
    return body;
  }

  for (const key of keys) {
    if (Array.isArray(body?.[key])) {
      return body[key];
    }
  }

  return [];
}

function getEntityId(entity) {
  if (!entity) return "";

  return String(
    entity.id ||
      entity._id ||
      entity.projectId ||
      entity.connectionId ||
      ""
  );
}

function getProjectName(project) {
  return (
    project?.name ||
    project?.displayName ||
    project?.title ||
    "Unnamed Project"
  );
}

function getEnvironmentName(environment) {
  return (
    environment?.name ||
    environment?.environment ||
    "Environment"
  );
}

function getRepositoryName(repository) {
  return (
    repository?.full_name ||
    repository?.fullName ||
    repository?.name ||
    ""
  );
}

function getRepositoryOwner(repository) {
  return (
    repository?.owner?.login ||
    repository?.owner?.name ||
    repository?.owner ||
    ""
  );
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [panel, setPanel] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState("");

  const [environmentVariables, setEnvironmentVariables] =
    useState([]);

  const [environmentLoading, setEnvironmentLoading] =
    useState(false);

  const [environmentSaving, setEnvironmentSaving] =
    useState(false);

  const [environmentError, setEnvironmentError] =
    useState("");

  const [environmentMessage, setEnvironmentMessage] =
    useState("");

  const [newVariable, setNewVariable] = useState({
    key: "",
    value: "",
    type: "string",
    scope: "runtime",
    required: false,
    isSecret: true,
  });

  const [githubConnections, setGithubConnections] =
    useState([]);

  const [githubRepositories, setGithubRepositories] =
    useState([]);

  const [githubBranches, setGithubBranches] =
    useState([]);

  const [selectedConnectionId, setSelectedConnectionId] =
    useState("");

  const [selectedRepository, setSelectedRepository] =
    useState("");

  const [selectedBranch, setSelectedBranch] =
    useState("");

  const [githubEnvironment, setGithubEnvironment] =
    useState("");

  const [githubLoading, setGithubLoading] =
    useState(false);

  const [githubDeploying, setGithubDeploying] =
    useState(false);

  const [githubError, setGithubError] =
    useState("");

  const [githubMessage, setGithubMessage] =
    useState("");

  const [deploymentResult, setDeploymentResult] =
    useState(null);

  /* =======================================================
     RESTORE SIDEBAR STATE
  ======================================================= */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        "zyrionos.sidebar.collapsed"
      );

      if (saved === "true") {
        setCollapsed(true);
      }
    } catch {
      // Ignore storage failures.
    }
  }, []);

  /* =======================================================
     PERSIST SIDEBAR STATE
  ======================================================= */

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "zyrionos.sidebar.collapsed",
        String(collapsed)
      );
    } catch {
      // Ignore storage failures.
    }
  }, [collapsed]);

  /* =======================================================
     KEYBOARD
  ======================================================= */

  useEffect(() => {
    const handleKeyboard = (event) => {
      const modifier =
        event.ctrlKey || event.metaKey;

      if (
        modifier &&
        event.key.toLowerCase() === "b"
      ) {
        event.preventDefault();

        if (window.innerWidth > 768) {
          setCollapsed((value) => !value);
        }
      }

      if (event.key === "Escape") {
        setMobileOpen(false);
        setPanel(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, []);

  /* =======================================================
     MOBILE BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (!mobileOpen && !panel) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen, panel]);

  /* =======================================================
     LOAD PROJECTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const response =
          await workspaceService.getProjects();

        const list = getCollection(response, [
          "projects",
        ]);

        if (cancelled) return;

        setProjects(list);

        const savedProject =
          window.localStorage.getItem(
            "zyrionos.activeProjectId"
          );

        const firstId =
          savedProject ||
          getEntityId(list[0]);

        if (firstId) {
          setProjectId(String(firstId));
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     PERSIST ACTIVE PROJECT
  ======================================================= */

  useEffect(() => {
    if (!projectId) return;

    try {
      window.localStorage.setItem(
        "zyrionos.activeProjectId",
        projectId
      );
    } catch {
      // Ignore storage failures.
    }
  }, [projectId]);

  /* =======================================================
     LOAD ENVIRONMENTS
  ======================================================= */

  useEffect(() => {
    if (
      panel !== "environment" ||
      !projectId
    ) {
      return undefined;
    }

    let cancelled = false;

    const loadEnvironments = async () => {
      setEnvironmentLoading(true);
      setEnvironmentError("");

      try {
        const response =
          await environmentService.listEnvironments(
            projectId
          );

        const list = getCollection(response, [
          "environments",
        ]);

        if (cancelled) return;

        setEnvironments(list);

        const firstName =
          selectedEnvironment ||
          getEnvironmentName(list[0]);

        if (firstName) {
          setSelectedEnvironment(
            firstName
          );
        }
      } catch (error) {
        if (!cancelled) {
          setEnvironmentError(
            getErrorMessage(
              error,
              "Unable to load environments."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setEnvironmentLoading(false);
        }
      }
    };

    loadEnvironments();

    return () => {
      cancelled = true;
    };
  }, [
    panel,
    projectId,
    selectedEnvironment,
  ]);

  /* =======================================================
     LOAD SELECTED ENVIRONMENT
  ======================================================= */

  useEffect(() => {
    if (
      panel !== "environment" ||
      !projectId ||
      !selectedEnvironment
    ) {
      return undefined;
    }

    let cancelled = false;

    const loadEnvironment = async () => {
      setEnvironmentLoading(true);
      setEnvironmentError("");

      try {
        const response =
          await environmentService.getEnvironment(
            projectId,
            selectedEnvironment
          );

        const data = unwrapResponse(response);

        if (cancelled) return;

        setEnvironmentVariables(
          Array.isArray(data?.variables)
            ? data.variables
            : []
        );
      } catch (error) {
        if (!cancelled) {
          setEnvironmentError(
            getErrorMessage(
              error,
              "Unable to load environment."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setEnvironmentLoading(false);
        }
      }
    };

    loadEnvironment();

    return () => {
      cancelled = true;
    };
  }, [
    panel,
    projectId,
    selectedEnvironment,
  ]);

  /* =======================================================
     LOAD GITHUB CONNECTIONS
  ======================================================= */

  useEffect(() => {
    if (
      panel !== "github" ||
      !projectId
    ) {
      return undefined;
    }

    let cancelled = false;

    const loadGithub = async () => {
      setGithubLoading(true);
      setGithubError("");

      try {
        const [
          connectionsResponse,
          repositoriesResponse,
        ] = await Promise.all([
          githubService.getConnections({
            projectId,
          }),
          githubService.getRepositories({
            projectId,
          }),
        ]);

        if (cancelled) return;

        const connections =
          getCollection(
            connectionsResponse,
            ["connections"]
          );

        const repositories =
          getCollection(
            repositoriesResponse,
            ["repositories", "repos"]
          );

        setGithubConnections(connections);
        setGithubRepositories(repositories);

        const activeConnection =
          connections.find(
            (item) =>
              item.status === "active"
          ) ||
          connections[0];

        if (activeConnection) {
          setSelectedConnectionId(
            getEntityId(activeConnection)
          );
        }

        if (repositories[0]) {
          setSelectedRepository(
            getRepositoryName(
              repositories[0]
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          setGithubError(
            getErrorMessage(
              error,
              "Unable to load GitHub data."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setGithubLoading(false);
        }
      }
    };

    loadGithub();

    return () => {
      cancelled = true;
    };
  }, [panel, projectId]);

  /* =======================================================
     LOAD BRANCHES
  ======================================================= */

  useEffect(() => {
    if (
      panel !== "github" ||
      !projectId ||
      !selectedRepository
    ) {
      return undefined;
    }

    let cancelled = false;

    const loadBranches = async () => {
      const repository =
        githubRepositories.find(
          (item) =>
            getRepositoryName(item) ===
            selectedRepository
        );

      const owner =
        getRepositoryOwner(repository);

      const repo =
        repository?.name ||
        selectedRepository.split("/").pop();

      if (!repo) return;

      try {
        const response =
          await githubService.getBranches({
            projectId,
            connectionId:
              selectedConnectionId ||
              undefined,
            owner: owner || undefined,
            repo,
            repository:
              selectedRepository,
          });

        const branches =
          getCollection(response, [
            "branches",
          ]);

        if (cancelled) return;

        setGithubBranches(branches);

        if (branches.length) {
          const defaultBranch =
            branches.find(
              (branch) =>
                branch.default ||
                branch.name === "main" ||
                branch.name === "master"
            ) ||
            branches[0];

          setSelectedBranch(
            defaultBranch?.name ||
              defaultBranch?.branch ||
              ""
          );
        }
      } catch (error) {
        if (!cancelled) {
          setGithubError(
            getErrorMessage(
              error,
              "Unable to load repository branches."
            )
          );
        }
      }
    };

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, [
    panel,
    projectId,
    selectedRepository,
    selectedConnectionId,
    githubRepositories,
  ]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigationItems = useMemo(() => {
    if (!Array.isArray(navigation)) {
      return [];
    }

    return navigation.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.path === "string" &&
        typeof item.label === "string"
    );
  }, []);

  const sections = useMemo(() => {
    const groups = new Map();

    navigationItems.forEach((item) => {
      const section =
        typeof item.section === "string" &&
        item.section.trim()
          ? item.section
          : "Platform";

      if (!groups.has(section)) {
        groups.set(section, []);
      }

      groups.get(section).push(item);
    });

    return Array.from(groups.entries());
  }, [navigationItems]);

  /* =======================================================
     SPECIAL NAVIGATION DETECTION
  ======================================================= */

  const getActionType = (item) => {
    const value = [
      item?.id,
      item?.label,
      item?.path,
      item?.icon,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      value.includes("environment") ||
      value.includes("env")
    ) {
      return "environment";
    }

    if (
      value.includes("github") ||
      value.includes("git-hub")
    ) {
      return "github";
    }

    return null;
  };

  /* =======================================================
     OPEN SPECIAL PANEL
  ======================================================= */

  const openPanel = (type) => {
    setPanel(type);
    setMobileOpen(false);

    if (type === "environment") {
      setEnvironmentError("");
      setEnvironmentMessage("");
    }

    if (type === "github") {
      setGithubError("");
      setGithubMessage("");
      setDeploymentResult(null);
    }
  };

  /* =======================================================
     CLOSE MOBILE
  ======================================================= */

  const closeMobileNavigation = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  };

  /* =======================================================
     ADD ENVIRONMENT VARIABLE
  ======================================================= */

  const handleAddEnvironmentVariable = async (
    event
  ) => {
    event.preventDefault();

    if (
      !projectId ||
      !selectedEnvironment
    ) {
      setEnvironmentError(
        "Select a project and environment first."
      );
      return;
    }

    const key =
      newVariable.key.trim();

    const value =
      newVariable.value;

    if (!key) {
      setEnvironmentError(
        "Variable key is required."
      );
      return;
    }

    if (!value) {
      setEnvironmentError(
        "Variable value is required."
      );
      return;
    }

    setEnvironmentSaving(true);
    setEnvironmentError("");
    setEnvironmentMessage("");

    try {
      await environmentService.addVariable(
        projectId,
        selectedEnvironment,
        {
          key,
          value,
          type: newVariable.type,
          scope: newVariable.scope,
          required:
            newVariable.required,
          isSecret:
            newVariable.isSecret,
          enabled: true,
        }
      );

      setNewVariable({
        key: "",
        value: "",
        type: "string",
        scope: "runtime",
        required: false,
        isSecret: true,
      });

      setEnvironmentMessage(
        `${key} was securely sent to the backend.`
      );

      const response =
        await environmentService.getEnvironment(
          projectId,
          selectedEnvironment
        );

      const data = unwrapResponse(response);

      setEnvironmentVariables(
        Array.isArray(data?.variables)
          ? data.variables
          : []
      );
    } catch (error) {
      setEnvironmentError(
        getErrorMessage(
          error,
          "Unable to save environment variable."
        )
      );
    } finally {
      setEnvironmentSaving(false);
    }
  };

  /* =======================================================
     VALIDATE ENVIRONMENT
  ======================================================= */

  const handleValidateEnvironment = async () => {
    if (
      !projectId ||
      !selectedEnvironment
    ) {
      return;
    }

    setEnvironmentLoading(true);
    setEnvironmentError("");
    setEnvironmentMessage("");

    try {
      const response =
        await environmentService.validateEnvironment(
          projectId,
          selectedEnvironment
        );

      const data = unwrapResponse(response);

      setEnvironmentMessage(
        data?.message ||
          "Environment validation completed."
      );
    } catch (error) {
      setEnvironmentError(
        getErrorMessage(
          error,
          "Environment validation failed."
        )
      );
    } finally {
      setEnvironmentLoading(false);
    }
  };

  /* =======================================================
     GITHUB DEPLOY
  ======================================================= */

  const handleGithubDeploy = async () => {
    if (!projectId) {
      setGithubError(
        "Select a project first."
      );
      return;
    }

    if (!selectedRepository) {
      setGithubError(
        "Select a repository first."
      );
      return;
    }

    if (!selectedBranch) {
      setGithubError(
        "Select a branch first."
      );
      return;
    }

    setGithubDeploying(true);
    setGithubError("");
    setGithubMessage("");
    setDeploymentResult(null);

    try {
      const repository =
        githubRepositories.find(
          (item) =>
            getRepositoryName(item) ===
            selectedRepository
        );

      const owner =
        getRepositoryOwner(repository);

      const repo =
        repository?.name ||
        selectedRepository.split("/").pop();

      /*
       * Step 1:
       * Ask the GitHub deployment system to
       * prepare a deterministic deployment contract.
       */

      const contractResponse =
        await githubService.prepareDeployment({
          projectId,
          connectionId:
            selectedConnectionId ||
            undefined,
          repository:
            selectedRepository,
          owner:
            owner || undefined,
          repo,
          branch: selectedBranch,
          environmentName:
            githubEnvironment ||
            undefined,
        });

      const contract =
        unwrapResponse(contractResponse);

      /*
       * Step 2:
       * Hand the prepared deployment payload
       * to the existing deployment service.
       *
       * No AI provider is called from the UI.
       */

      const deploymentResponse =
        await deploymentService.createDeployment({
          projectId,
          connectionId:
            selectedConnectionId ||
            undefined,
          repository:
            selectedRepository,
          owner:
            owner || undefined,
          repo,
          branch: selectedBranch,
          environmentName:
            githubEnvironment ||
            undefined,
          deploymentContract:
            contract,
        });

      const deployment =
        unwrapResponse(
          deploymentResponse
        );

      setDeploymentResult(
        deployment
      );

      setGithubMessage(
        "Deployment request submitted successfully."
      );
    } catch (error) {
      setGithubError(
        getErrorMessage(
          error,
          "Deployment could not be started."
        )
      );
    } finally {
      setGithubDeploying(false);
    }
  };

  /* =======================================================
     REFRESH GITHUB
  ======================================================= */

  const refreshGithub = async () => {
    if (!projectId) return;

    setGithubLoading(true);
    setGithubError("");

    try {
      const [
        connectionsResponse,
        repositoriesResponse,
      ] = await Promise.all([
        githubService.getConnections({
          projectId,
        }),
        githubService.getRepositories({
          projectId,
        }),
      ]);

      const connections =
        getCollection(
          connectionsResponse,
          ["connections"]
        );

      const repositories =
        getCollection(
          repositoriesResponse,
          ["repositories", "repos"]
        );

      setGithubConnections(connections);
      setGithubRepositories(repositories);

      if (
        !selectedConnectionId &&
        connections[0]
      ) {
        setSelectedConnectionId(
          getEntityId(connections[0])
        );
      }

      if (
        !selectedRepository &&
        repositories[0]
      ) {
        setSelectedRepository(
          getRepositoryName(
            repositories[0]
          )
        );
      }

      setGithubMessage(
        "GitHub data refreshed."
      );
    } catch (error) {
      setGithubError(
        getErrorMessage(
          error,
          "GitHub refresh failed."
        )
      );
    } finally {
      setGithubLoading(false);
    }
  };

  /* =======================================================
     TOGGLE COLLAPSE
  ======================================================= */

  const toggleCollapsed = () => {
    setCollapsed(
      (value) => !value
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ===================================================
          MOBILE MENU BUTTON
      =================================================== */}

      <button
        type="button"
        className={styles.mobileMenuButton}
        onClick={() =>
          setMobileOpen(
            (value) => !value
          )
        }
        aria-label={
          mobileOpen
            ? "Close navigation"
            : "Open navigation"
        }
        aria-expanded={mobileOpen}
        aria-controls="zyrionos-navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {/* ===================================================
          MOBILE BACKDROP
      =================================================== */}

      <button
        type="button"
        className={`${styles.mobileBackdrop} ${
          mobileOpen
            ? styles.mobileBackdropVisible
            : ""
        }`}
        onClick={() =>
          setMobileOpen(false)
        }
        aria-label="Close navigation"
        tabIndex={
          mobileOpen ? 0 : -1
        }
      />

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        id="zyrionos-navigation"
        className={`${styles.sidebar} ${
          collapsed
            ? styles.collapsed
            : ""
        } ${
          mobileOpen
            ? styles.mobileOpen
            : ""
        }`}
        aria-label="ZyrionOS primary navigation"
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div className={styles.header}>
          <NavLink
            to="/dashboard"
            className={styles.brand}
            onClick={
              closeMobileNavigation
            }
            aria-label={`${APP_NAME} dashboard`}
          >
            <span
              className={styles.brandMark}
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
              <span />
            </span>

            <span
              className={
                styles.brandContent
              }
            >
              <span
                className={styles.brandName}
              >
                {APP_NAME}
              </span>

              <span
                className={
                  styles.brandTagline
                }
              >
                {APP_TAGLINE}
              </span>
            </span>
          </NavLink>

          <button
            type="button"
            className={
              styles.collapseButton
            }
            onClick={
              toggleCollapsed
            }
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-pressed={collapsed}
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            <span
              className={
                collapsed
                  ? styles.chevronCollapsed
                  : styles.chevron
              }
            >
              ‹
            </span>
          </button>

          <button
            type="button"
            className={
              styles.mobileCloseButton
            }
            onClick={() =>
              setMobileOpen(false)
            }
            aria-label="Close navigation"
          >
            <Icon
              name="close"
              size={18}
            />
          </button>
        </div>

        {/* =================================================
            WORKSPACE CONTEXT
        ================================================== */}

        <div
          className={
            styles.workspaceContext
          }
        >
          <span
            className={
              styles.workspaceIcon
            }
          >
            <Icon
              name="workspace"
              size={18}
            />
          </span>

          {!collapsed && (
            <span
              className={
                styles.workspaceContent
              }
            >
              <span
                className={styles.eyebrow}
              >
                WORKSPACE
              </span>

              <span
                className={
                  styles.workspaceValue
                }
              >
                {projects.length
                  ? `${projects.length} project${
                      projects.length === 1
                        ? ""
                        : "s"
                    }`
                  : "Workspace"}
              </span>
            </span>
          )}
        </div>

        {/* =================================================
            PRIMARY NAVIGATION
        ================================================== */}

        <nav
          className={styles.navigation}
          aria-label="Application navigation"
        >
          {sections.map(
            ([sectionName, items]) => (
              <section
                key={sectionName}
                className={
                  styles.navigationSection
                }
              >
                {!collapsed && (
                  <div
                    className={
                      styles.sectionLabel
                    }
                  >
                    {sectionName}
                  </div>
                )}

                <div
                  className={
                    styles.navigationItems
                  }
                >
                  {items.map((item) => {
                    const iconName =
                      item.icon ||
                      item.id ||
                      "dashboard";

                    const action =
                      getActionType(item);

                    if (
                      action ===
                        "environment" ||
                      action === "github"
                    ) {
                      const active =
                        panel === action;

                      return (
                        <button
                          key={
                            item.id ||
                            item.path
                          }
                          type="button"
                          className={`${styles.navItem} ${
                            active
                              ? styles.active
                              : ""
                          }`}
                          onClick={() =>
                            openPanel(action)
                          }
                          title={
                            collapsed
                              ? item.label
                              : undefined
                          }
                          aria-label={
                            collapsed
                              ? item.label
                              : undefined
                          }
                          aria-expanded={
                            active
                          }
                        >
                          <span
                            className={
                              styles.navIconBox
                            }
                          >
                            <span
                              className={
                                styles.navIcon
                              }
                            >
                              <Icon
                                name={
                                  iconName
                                }
                                size={19}
                              />
                            </span>
                          </span>

                          <span
                            className={
                              styles.navLabel
                            }
                          >
                            {item.label}
                          </span>

                          {item.badge &&
                            !collapsed && (
                              <span
                                className={
                                  styles.navBadge
                                }
                              >
                                {item.badge}
                              </span>
                            )}

                          <span
                            className={
                              styles.activeIndicator
                            }
                          />
                        </button>
                      );
                    }

                    return (
                      <NavLink
                        key={
                          item.id ||
                          item.path
                        }
                        to={item.path}
                        end={
                          item.path ===
                          "/dashboard"
                        }
                        onClick={
                          closeMobileNavigation
                        }
                        className={({
                          isActive,
                        }) =>
                          `${styles.navItem} ${
                            isActive
                              ? styles.active
                              : ""
                          }`
                        }
                        title={
                          collapsed
                            ? item.label
                            : undefined
                        }
                        aria-label={
                          collapsed
                            ? item.label
                            : undefined
                        }
                      >
                        <span
                          className={
                            styles.navIconBox
                          }
                        >
                          <span
                            className={
                              styles.navIcon
                            }
                          >
                            <Icon
                              name={
                                iconName
                              }
                              size={19}
                            />
                          </span>
                        </span>

                        <span
                          className={
                            styles.navLabel
                          }
                        >
                          {item.label}
                        </span>

                        {item.badge &&
                          !collapsed && (
                            <span
                              className={
                                styles.navBadge
                              }
                            >
                              {item.badge}
                            </span>
                          )}

                        <span
                          className={
                            styles.activeIndicator
                          }
                        />
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </nav>

        {/* =================================================
            BOTTOM
        ================================================== */}

        <div
          className={styles.bottomArea}
        >
          {!collapsed && (
            <div
              className={
                styles.platformCard
              }
            >
              <div
                className={
                  styles.platformHeader
                }
              >
                <span
                  className={
                    styles.platformIndicator
                  }
                />

                <span>
                  ZyrionOS Platform
                </span>
              </div>

              <p
                className={
                  styles.platformDescription
                }
              >
                Build, manage and operate
                your applications from one
                workspace.
              </p>
            </div>
          )}

          <div
            className={
              styles.sidebarMeta
            }
          >
            {!collapsed ? (
              <>
                <span>
                  {APP_NAME}
                </span>

                <span
                  className={
                    styles.metaSeparator
                  }
                >
                  /
                </span>

                <span>
                  Platform
                </span>
              </>
            ) : (
              <span
                className={
                  styles.collapsedMeta
                }
              >
                Z
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ===================================================
          ENVIRONMENT PANEL
      =================================================== */}

      {panel === "environment" && (
        <div
          className={
            styles.panelOverlay
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPanel(null);
            }
          }}
        >
          <section
            className={
              styles.controlPanel
            }
            role="dialog"
            aria-modal="true"
            aria-label="Environment manager"
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <div>
                <span
                  className={
                    styles.panelEyebrow
                  }
                >
                  BACKEND CONNECTED
                </span>

                <h2>
                  Environment
                </h2>

                <p>
                  Manage runtime and build
                  configuration securely.
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.iconButton
                }
                onClick={() =>
                  setPanel(null)
                }
                aria-label="Close environment manager"
              >
                <Icon
                  name="close"
                  size={18}
                />
              </button>
            </div>

            <div
              className={
                styles.panelBody
              }
            >
              <label
                className={
                  styles.fieldLabel
                }
              >
                Project

                <select
                  className={
                    styles.select
                  }
                  value={projectId}
                  onChange={(event) =>
                    setProjectId(
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
                        key={
                          getEntityId(
                            project
                          )
                        }
                        value={
                          getEntityId(
                            project
                          )
                        }
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
                  styles.fieldLabel
                }
              >
                Environment

                <select
                  className={
                    styles.select
                  }
                  value={
                    selectedEnvironment
                  }
                  onChange={(event) =>
                    setSelectedEnvironment(
                      event.target.value
                    )
                  }
                  disabled={
                    !environments.length
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

              {environmentError && (
                <div
                  className={
                    styles.errorMessage
                  }
                >
                  <Icon
                    name="alert"
                    size={15}
                  />
                  <span>
                    {environmentError}
                  </span>
                </div>
              )}

              {environmentMessage && (
                <div
                  className={
                    styles.successMessage
                  }
                >
                  <Icon
                    name="check"
                    size={15}
                  />
                  <span>
                    {environmentMessage}
                  </span>
                </div>
              )}

              <div
                className={
                  styles.sectionHeader
                }
              >
                <div>
                  <h3>
                    Environment variables
                  </h3>

                  <span>
                    {environmentVariables.length} configured
                  </span>
                </div>

                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={
                    handleValidateEnvironment
                  }
                  disabled={
                    environmentLoading ||
                    !selectedEnvironment
                  }
                >
                  Validate
                </button>
              </div>

              <div
                className={
                  styles.variableList
                }
              >
                {environmentLoading &&
                  !environmentVariables.length && (
                    <div
                      className={
                        styles.loadingState
                      }
                    >
                      Loading environment...
                    </div>
                  )}

                {!environmentLoading &&
                  !environmentVariables.length && (
                    <div
                      className={
                        styles.emptyState
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
                        Add your first API key
                        or runtime setting below.
                      </span>
                    </div>
                  )}

                {environmentVariables.map(
                  (variable) => (
                    <div
                      className={
                        styles.variableRow
                      }
                      key={
                        variable.id ||
                        variable._id ||
                        variable.key
                      }
                    >
                      <div
                        className={
                          styles.variableIdentity
                        }
                      >
                        <span
                          className={
                            styles.variableKey
                          }
                        >
                          {variable.key}
                        </span>

                        <span
                          className={
                            styles.variableMeta
                          }
                        >
                          {variable.scope ||
                            "runtime"}{" "}
                          ·{" "}
                          {variable.type ||
                            "string"}
                        </span>
                      </div>

                      <span
                        className={
                          variable.isSecret
                            ? styles.secretValue
                            : styles.plainValue
                        }
                      >
                        {variable.isSecret
                          ? "••••••••"
                          : variable.hasValue
                            ? "Configured"
                            : "Empty"}
                      </span>
                    </div>
                  )
                )}
              </div>

              <form
                className={
                  styles.variableForm
                }
                onSubmit={
                  handleAddEnvironmentVariable
                }
              >
                <div
                  className={
                    styles.sectionHeader
                  }
                >
                  <div>
                    <h3>
                      Add variable
                    </h3>

                    <span>
                      The value is sent directly to the backend.
                    </span>
                  </div>
                </div>

                <label
                  className={
                    styles.fieldLabel
                  }
                >
                  Key

                  <input
                    className={
                      styles.input
                    }
                    value={
                      newVariable.key
                    }
                    onChange={(event) =>
                      setNewVariable(
                        (current) => ({
                          ...current,
                          key:
                            event.target
                              .value
                              .toUpperCase(),
                        })
                      )
                    }
                    placeholder="OPENAI_API_KEY"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </label>

                <label
                  className={
                    styles.fieldLabel
                  }
                >
                  Value

                  <input
                    className={
                      styles.input
                    }
                    type="password"
                    value={
                      newVariable.value
                    }
                    onChange={(event) =>
                      setNewVariable(
                        (current) => ({
                          ...current,
                          value:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Enter API key / secret value"
                    autoComplete="new-password"
                  />
                </label>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <label
                    className={
                      styles.fieldLabel
                    }
                  >
                    Type

                    <select
                      className={
                        styles.select
                      }
                      value={
                        newVariable.type
                      }
                      onChange={(event) =>
                        setNewVariable(
                          (current) => ({
                            ...current,
                            type:
                              event.target
                                .value,
                          })
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
                      styles.fieldLabel
                    }
                  >
                    Scope

                    <select
                      className={
                        styles.select
                      }
                      value={
                        newVariable.scope
                      }
                      onChange={(event) =>
                        setNewVariable(
                          (current) => ({
                            ...current,
                            scope:
                              event.target
                                .value,
                          })
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
                        Both
                      </option>
                    </select>
                  </label>
                </div>

                <label
                  className={
                    styles.checkboxRow
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      newVariable.required
                    }
                    onChange={(event) =>
                      setNewVariable(
                        (current) => ({
                          ...current,
                          required:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    Required variable
                  </span>
                </label>

                <label
                  className={
                    styles.checkboxRow
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      newVariable.isSecret
                    }
                    onChange={(event) =>
                      setNewVariable(
                        (current) => ({
                          ...current,
                          isSecret:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    Treat as secret
                  </span>
                </label>

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                  disabled={
                    environmentSaving ||
                    !projectId ||
                    !selectedEnvironment
                  }
                >
                  <Icon
                    name="key"
                    size={16}
                  />

                  {environmentSaving
                    ? "Saving..."
                    : "Save variable"}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================
          GITHUB PANEL
      =================================================== */}

      {panel === "github" && (
        <div
          className={
            styles.panelOverlay
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPanel(null);
            }
          }}
        >
          <section
            className={
              styles.controlPanel
            }
            role="dialog"
            aria-modal="true"
            aria-label="GitHub deployment manager"
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <div>
                <span
                  className={
                    styles.panelEyebrow
                  }
                >
                  GITHUB BACKEND
                </span>

                <h2>
                  Repository & Deploy
                </h2>

                <p>
                  Select project, repository,
                  branch and environment before deployment.
                </p>
              </div>

              <div
                className={
                  styles.panelHeaderActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.iconButton
                  }
                  onClick={
                    refreshGithub
                  }
                  disabled={
                    githubLoading
                  }
                  aria-label="Refresh GitHub"
                  title="Refresh GitHub"
                >
                  <Icon
                    name="refresh"
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  className={
                    styles.iconButton
                  }
                  onClick={() =>
                    setPanel(null)
                  }
                  aria-label="Close GitHub manager"
                >
                  <Icon
                    name="close"
                    size={18}
                  />
                </button>
              </div>
            </div>

            <div
              className={
                styles.panelBody
              }
            >
              <label
                className={
                  styles.fieldLabel
                }
              >
                Project

                <select
                  className={
                    styles.select
                  }
                  value={projectId}
                  onChange={(event) =>
                    setProjectId(
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
                        key={
                          getEntityId(
                            project
                          )
                        }
                        value={
                          getEntityId(
                            project
                          )
                        }
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
                  styles.connectionStatus
                }
              >
                <div
                  className={
                    styles.connectionIcon
                  }
                >
                  <Icon
                    name="github"
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    GitHub connection
                  </strong>

                  <span>
                    {githubConnections.length
                      ? `${
                          githubConnections.filter(
                            (item) =>
                              item.status ===
                              "active"
                          ).length
                        } active connection(s)`
                      : "No connection found"}
                  </span>
                </div>

                <span
                  className={
                    githubConnections.some(
                      (item) =>
                        item.status ===
                        "active"
                    )
                      ? styles.connectedDot
                      : styles.disconnectedDot
                  }
                />
              </div>

              <label
                className={
                  styles.fieldLabel
                }
              >
                GitHub connection

                <select
                  className={
                    styles.select
                  }
                  value={
                    selectedConnectionId
                  }
                  onChange={(event) =>
                    setSelectedConnectionId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Default / auto
                  </option>

                  {githubConnections.map(
                    (connection) => (
                      <option
                        key={
                          getEntityId(
                            connection
                          )
                        }
                        value={
                          getEntityId(
                            connection
                          )
                        }
                      >
                        {connection.githubLogin ||
                          connection.githubUsername ||
                          connection.providerUsername ||
                          "GitHub connection"}
                        {" · "}
                        {connection.status ||
                          "unknown"}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label
                className={
                  styles.fieldLabel
                }
              >
                Repository

                <select
                  className={
                    styles.select
                  }
                  value={
                    selectedRepository
                  }
                  onChange={(event) => {
                    setSelectedRepository(
                      event.target.value
                    );

                    setSelectedBranch("");
                  }}
                  disabled={
                    githubLoading ||
                    !githubRepositories.length
                  }
                >
                  <option value="">
                    Select repository
                  </option>

                  {githubRepositories.map(
                    (repository) => {
                      const value =
                        getRepositoryName(
                          repository
                        );

                      return (
                        <option
                          key={
                            repository.id ||
                            repository.node_id ||
                            value
                          }
                          value={value}
                        >
                          {value}
                        </option>
                      );
                    }
                  )}
                </select>
              </label>

              <label
                className={
                  styles.fieldLabel
                }
              >
                Branch

                <select
                  className={
                    styles.select
                  }
                  value={
                    selectedBranch
                  }
                  onChange={(event) =>
                    setSelectedBranch(
                      event.target.value
                    )
                  }
                  disabled={
                    !githubBranches.length
                  }
                >
                  <option value="">
                    Select branch
                  </option>

                  {githubBranches.map(
                    (branch) => {
                      const name =
                        branch.name ||
                        branch.branch;

                      return (
                        <option
                          key={name}
                          value={name}
                        >
                          {name}
                          {branch.default
                            ? " · default"
                            : ""}
                        </option>
                      );
                    }
                  )}
                </select>
              </label>

              <label
                className={
                  styles.fieldLabel
                }
              >
                Environment

                <select
                  className={
                    styles.select
                  }
                  value={
                    githubEnvironment
                  }
                  onChange={(event) =>
                    setGithubEnvironment(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Use deployment default
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

              {githubError && (
                <div
                  className={
                    styles.errorMessage
                  }
                >
                  <Icon
                    name="alert"
                    size={15}
                  />

                  <span>
                    {githubError}
                  </span>
                </div>
              )}

              {githubMessage && (
                <div
                  className={
                    styles.successMessage
                  }
                >
                  <Icon
                    name="check"
                    size={15}
                  />

                  <span>
                    {githubMessage}
                  </span>
                </div>
              )}

              {deploymentResult && (
                <div
                  className={
                    styles.deploymentResult
                  }
                >
                  <div>
                    <span>
                      Deployment response
                    </span>

                    <strong>
                      {deploymentResult.deploymentId ||
                        deploymentResult.id ||
                        "Submitted"}
                    </strong>
                  </div>

                  <span>
                    {deploymentResult.status ||
                      deploymentResult.state ||
                      "accepted"}
                  </span>
                </div>
              )}

              <div
                className={
                  styles.deploySummary
                }
              >
                <div>
                  <span>
                    Project
                  </span>

                  <strong>
                    {
                      getProjectName(
                        projects.find(
                          (item) =>
                            getEntityId(
                              item
                            ) ===
                            projectId
                        )
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Source
                  </span>

                  <strong>
                    {selectedRepository
                      ? `${selectedRepository} : ${
                          selectedBranch ||
                          "branch"
                        }`
                      : "Not selected"}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  handleGithubDeploy
                }
                disabled={
                  githubDeploying ||
                  githubLoading ||
                  !projectId ||
                  !selectedRepository ||
                  !selectedBranch
                }
              >
                <Icon
                  name="deployment"
                  size={17}
                />

                {githubDeploying
                  ? "Preparing deployment..."
                  : "Deploy selected branch"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default Sidebar;
