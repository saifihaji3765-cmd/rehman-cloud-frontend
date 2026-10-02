import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import { useAuth } from "../../../context/AuthContext";

import { getProjects } from "../../../services/workspaceService";
import { getSubscription } from "../../../services/billingService";

import styles from "./Dashboard.module.css";

/* =========================================================
   RESPONSE NORMALIZATION
   Backend contract:
   response.data.data.projects
   response.data.data.subscription / subscriptions
========================================================= */

function getPayload(response) {
  const root = response?.data;

  if (!root) {
    return null;
  }

  /*
   * Standard API response:
   * {
   *   success: true,
   *   data: {...}
   * }
   */
  if (
    root.data &&
    typeof root.data === "object"
  ) {
    return root.data;
  }

  return root;
}


function normalizeProjects(response) {
  const payload = getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.projects)) {
    return payload.projects;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}


function normalizeSubscriptions(response) {
  const payload = getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.subscriptions)) {
    return payload.subscriptions;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (payload?.subscription) {
    return [payload.subscription];
  }

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    (
      payload.planName ||
      payload.plan ||
      payload.subscriptionPlan ||
      payload.status
    )
  ) {
    return [payload];
  }

  return [];
}


/* =========================================================
   SAFE DISPLAY HELPERS
========================================================= */

function getProjectName(project) {
  return (
    project?.projectName ||
    project?.name ||
    "Unnamed Project"
  );
}


function getProjectId(project) {
  return (
    project?._id ||
    project?.id ||
    null
  );
}


function getProjectStatus(project) {
  const status =
    project?.deploymentStatus ||
    project?.status ||
    project?.state;

  if (!status) {
    return null;
  }

  return String(status)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function getRawProjectStatus(project) {
  return String(
    project?.deploymentStatus ||
    project?.status ||
    project?.state ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ");
}


function getBuildStatus(project) {
  return String(
    project?.build?.status ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ");
}


function getInitial(name) {
  const value =
    String(name || "").trim();

  return value
    ? value.charAt(0).toUpperCase()
    : "U";
}


function formatPlanName(plan) {
  if (!plan) {
    return "No Plan";
  }

  return String(plan)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function formatDate(value) {
  if (!value) {
    return "No recent activity";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "No recent activity";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}


function getRelativeTime(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const diff =
    Date.now() - date.getTime();

  const seconds =
    Math.max(
      0,
      Math.floor(diff / 1000)
    );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 30) {
    return `${days}d ago`;
  }

  return formatDate(value);
}


function isActiveBuild(project) {
  const projectStatus =
    getRawProjectStatus(project);

  const buildStatus =
    getBuildStatus(project);

  return [
    "building",
    "deploying",
    "pending",
    "running",
    "in progress",
  ].includes(projectStatus) ||
    [
      "building",
      "running",
      "pending",
      "in progress",
    ].includes(buildStatus);
}


function isDeployed(project) {
  const status =
    getRawProjectStatus(project);

  return [
    "deployed",
    "live",
    "production",
  ].includes(status);
}


function isFailed(project) {
  const projectStatus =
    getRawProjectStatus(project);

  const buildStatus =
    getBuildStatus(project);

  return (
    [
      "failed",
      "error",
    ].includes(projectStatus) ||
    [
      "failed",
      "error",
    ].includes(buildStatus)
  );
}


/* =========================================================
   COMPONENT
========================================================= */

function Dashboard() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    subscriptions,
    setSubscriptions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    projectsError,
    setProjectsError,
  ] = useState("");

  const [
    subscriptionError,
    setSubscriptionError,
  ] = useState("");


  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  const loadDashboard =
    useCallback(
      async ({
        refresh = false,
      } = {}) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setProjectsError("");
        setSubscriptionError("");

        const [
          projectsResult,
          subscriptionResult,
        ] = await Promise.allSettled([
          getProjects(),
          getSubscription(),
        ]);


        /* -------------------------------------------------
           PROJECTS
        ------------------------------------------------- */

        if (
          projectsResult.status ===
          "fulfilled"
        ) {
          setProjects(
            normalizeProjects(
              projectsResult.value
            )
          );
        } else {
          console.error(
            "Dashboard projects loading error:",
            projectsResult.reason
          );

          setProjectsError(
            "Project data could not be loaded."
          );
        }


        /* -------------------------------------------------
           SUBSCRIPTION
        ------------------------------------------------- */

        if (
          subscriptionResult.status ===
          "fulfilled"
        ) {
          setSubscriptions(
            normalizeSubscriptions(
              subscriptionResult.value
            )
          );
        } else {
          console.error(
            "Dashboard subscription loading error:",
            subscriptionResult.reason
          );

          setSubscriptionError(
            "Subscription data could not be loaded."
          );
        }


        if (refresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      },
      []
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard();

    return () => {};
  }, [loadDashboard]);


  /* =======================================================
     USER DATA
  ======================================================= */

  const userName =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    "User";

  const userEmail =
    user?.email ||
    "—";

  const userRole =
    user?.role ||
    "User";


  /* =======================================================
     DEPLOYMENT USAGE
  ======================================================= */

  const deploymentsValue =
    user?.deploymentsUsed ??
    user?.deploymentCount ??
    user?.deployments ??
    null;

  const deploymentsUsed =
    deploymentsValue === null ||
    deploymentsValue === undefined
      ? null
      : Number.isFinite(
          Number(
            deploymentsValue
          )
        )
        ? Number(
            deploymentsValue
          )
        : null;


  /* =======================================================
     SUBSCRIPTION
  ======================================================= */

  const currentSubscription =
    subscriptions[0] || null;

  const currentPlan =
    currentSubscription?.planName ||
    currentSubscription?.plan ||
    currentSubscription?.subscriptionPlan ||
    user?.subscriptionPlan ||
    user?.plan ||
    null;

  const planLabel =
    formatPlanName(
      currentPlan
    );


  /* =======================================================
     PROJECT METRICS
  ======================================================= */

  const projectCount =
    projects.length;

  const activeBuildCount =
    useMemo(
      () =>
        projects.filter(
          isActiveBuild
        ).length,
      [projects]
    );

  const deployedCount =
    useMemo(
      () =>
        projects.filter(
          isDeployed
        ).length,
      [projects]
    );

  const failedCount =
    useMemo(
      () =>
        projects.filter(
          isFailed
        ).length,
      [projects]
    );


  /* =======================================================
     RECENT PROJECTS
     Backend already sorts by lastActivityAt.
  ======================================================= */

  const recentProjects =
    useMemo(
      () =>
        projects.slice(0, 6),
      [projects]
    );


  /* =======================================================
     DATA STATE
  ======================================================= */

  const hasProjectError =
    Boolean(
      projectsError
    );

  const hasSubscriptionError =
    Boolean(
      subscriptionError
    );

  const hasAnyError =
    hasProjectError ||
    hasSubscriptionError;

  const dataConnectionState =
    hasAnyError
      ? "Partial connection"
      : "All systems connected";

  const dataConnectionDescription =
    hasAnyError
      ? "One or more workspace services require attention."
      : "Workspace data is synchronized with the ZyrionOS backend.";


  /* =======================================================
     OPERATIONAL STATE
  ======================================================= */

  const operationalState =
    failedCount > 0
      ? "Attention required"
      : activeBuildCount > 0
        ? "Build activity detected"
        : "Operational";


  /* =======================================================
     HANDLERS
  ======================================================= */

  const handleRefresh =
    useCallback(() => {
      return loadDashboard({
        refresh: true,
      });
    }, [loadDashboard]);


  const handleProjectOpen =
    (project) => {
      const projectId =
        getProjectId(project);

      if (projectId) {
        navigate(
          `/workspace?project=${encodeURIComponent(
            projectId
          )}`
        );

        return;
      }

      navigate("/workspace");
    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <div className={styles.container}>

          {/* =================================================
              HEADER
          ================================================= */}

          <section className={styles.header}>
            <div className={styles.headerContent}>

              <div className={styles.eyebrow}>
                <span
                  className={styles.eyebrowMark}
                  aria-hidden="true"
                />

                ZYRIONOS CONTROL CENTER
              </div>

              <h1 className={styles.title}>
                Workspace Overview
              </h1>

              <p className={styles.subtitle}>
                Monitor projects, builds,
                deployments and account
                operations from one workspace.
              </p>

            </div>

            <div className={styles.headerActions}>

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <span
                  className={
                    refreshing
                      ? styles.spin
                      : styles.refreshIcon
                  }
                  aria-hidden="true"
                >
                  ↻
                </span>

                {refreshing
                  ? "Refreshing"
                  : "Refresh"}
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() =>
                  navigate(
                    "/workspace"
                  )
                }
              >
                <span aria-hidden="true">
                  +
                </span>

                New Project
              </button>

            </div>
          </section>


          {/* =================================================
              CONNECTION STATUS
          ================================================= */}

          <section
            className={
              hasAnyError
                ? `${styles.statusBar} ${styles.statusBarWarning}`
                : styles.statusBar
            }
          >

            <div className={styles.statusMain}>

              <span
                className={
                  hasAnyError
                    ? styles.statusDotWarning
                    : styles.statusDot
                }
                aria-hidden="true"
              />

              <div>
                <strong>
                  {dataConnectionState}
                </strong>

                <span>
                  {dataConnectionDescription}
                </span>
              </div>

            </div>


            <div className={styles.statusItem}>
              <span>Projects</span>

              <strong>
                {hasProjectError
                  ? "Unavailable"
                  : "Connected"}
              </strong>
            </div>


            <div className={styles.statusItem}>
              <span>Billing</span>

              <strong>
                {hasSubscriptionError
                  ? "Unavailable"
                  : "Connected"}
              </strong>
            </div>


            <div className={styles.statusItem}>
              <span>Account</span>

              <strong>
                {user
                  ? "Authenticated"
                  : "Unavailable"}
              </strong>
            </div>

          </section>


          {/* =================================================
              ERROR NOTICE
          ================================================= */}

          {hasAnyError && (
            <section
              className={styles.errorNotice}
              role="status"
              aria-live="polite"
            >

              <div
                className={styles.errorIcon}
                aria-hidden="true"
              >
                !
              </div>

              <div
                className={styles.errorContent}
              >
                <strong>
                  Workspace data notice
                </strong>

                {projectsError && (
                  <span>
                    {projectsError}
                  </span>
                )}

                {subscriptionError && (
                  <span>
                    {subscriptionError}
                  </span>
                )}
              </div>

              <button
                type="button"
                className={styles.retryButton}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Retry
              </button>

            </section>
          )}


          {/* =================================================
              KPI GRID
          ================================================= */}

          <section
            className={styles.metricGrid}
            aria-label="Workspace metrics"
          >

            {/* PROJECTS */}

            <article className={styles.metricCard}>

              <div className={styles.metricHeader}>
                <span>
                  WORKSPACE
                </span>

                <div
                  className={styles.metricIcon}
                  aria-hidden="true"
                >
                  ◇
                </div>
              </div>

              <div className={styles.metricValue}>
                {loading
                  ? "—"
                  : hasProjectError
                    ? "—"
                    : projectCount}
              </div>

              <div className={styles.metricLabel}>
                Total Projects
              </div>

              <div className={styles.metricMeta}>
                <span>
                  Workspace records
                </span>

                <b>
                  {hasProjectError
                    ? "Unavailable"
                    : "Live"}
                </b>
              </div>

            </article>


            {/* ACTIVE BUILDS */}

            <article className={styles.metricCard}>

              <div className={styles.metricHeader}>
                <span>
                  BUILD SYSTEM
                </span>

                <div
                  className={styles.metricIcon}
                  aria-hidden="true"
                >
                  ◌
                </div>
              </div>

              <div className={styles.metricValue}>
                {loading
                  ? "—"
                  : hasProjectError
                    ? "—"
                    : activeBuildCount}
              </div>

              <div className={styles.metricLabel}>
                Active Builds
              </div>

              <div className={styles.metricMeta}>
                <span>
                  Current project state
                </span>

                <b
                  className={
                    activeBuildCount > 0
                      ? styles.metaActive
                      : ""
                  }
                >
                  {activeBuildCount > 0
                    ? "Running"
                    : "Idle"}
                </b>
              </div>

            </article>


            {/* DEPLOYED */}

            <article className={styles.metricCard}>

              <div className={styles.metricHeader}>
                <span>
                  DEPLOYMENT
                </span>

                <div
                  className={styles.metricIcon}
                  aria-hidden="true"
                >
                  ↑
                </div>
              </div>

              <div className={styles.metricValue}>
                {loading
                  ? "—"
                  : hasProjectError
                    ? "—"
                    : deployedCount}
              </div>

              <div className={styles.metricLabel}>
                Deployed Projects
              </div>

              <div className={styles.metricMeta}>
                <span>
                  Current project state
                </span>

                <b>
                  {deployedCount > 0
                    ? "Live"
                    : "None"}
                </b>
              </div>

            </article>


            {/* PLAN */}

            <article className={styles.metricCard}>

              <div className={styles.metricHeader}>
                <span>
                  BILLING
                </span>

                <div
                  className={styles.metricIcon}
                  aria-hidden="true"
                >
                  $
                </div>
              </div>

              <div className={styles.planValue}>
                {loading
                  ? "—"
                  : planLabel}
              </div>

              <div className={styles.metricLabel}>
                Current Plan
              </div>

              <div className={styles.metricMeta}>
                <span>
                  Subscription
                </span>

                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() =>
                    navigate(
                      "/billing"
                    )
                  }
                >
                  Manage →
                </button>
              </div>

            </article>

          </section>


          {/* =================================================
              MAIN GRID
          ================================================= */}

          <section className={styles.mainGrid}>

            {/* =================================================
                RECENT PROJECTS
            ================================================= */}

            <article className={styles.panel}>

              <div className={styles.panelHeader}>

                <div>
                  <div className={styles.panelEyebrow}>
                    WORKSPACE
                  </div>

                  <h2 className={styles.panelTitle}>
                    Recent Projects
                  </h2>

                  <p className={styles.panelSubtitle}>
                    Projects ordered by backend activity.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.panelAction}
                  onClick={() =>
                    navigate(
                      "/workspace"
                    )
                  }
                >
                  View Workspace →
                </button>

              </div>


              <div className={styles.projectList}>

                {loading ? (
                  <div className={styles.loadingState}>
                    <span
                      className={styles.loadingSpinner}
                      aria-hidden="true"
                    />

                    Loading projects...
                  </div>
                ) : hasProjectError ? (
                  <div className={styles.emptyState}>

                    <div
                      className={styles.emptyIcon}
                      aria-hidden="true"
                    >
                      !
                    </div>

                    <h3>
                      Projects unavailable
                    </h3>

                    <p>
                      ZyrionOS could not retrieve
                      your workspace projects.
                    </p>

                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      Try Again
                    </button>

                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className={styles.emptyState}>

                    <div
                      className={styles.emptyIcon}
                      aria-hidden="true"
                    >
                      +
                    </div>

                    <h3>
                      No projects yet
                    </h3>

                    <p>
                      Create your first project
                      to start building inside
                      ZyrionOS.
                    </p>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() =>
                        navigate(
                          "/workspace"
                        )
                      }
                    >
                      Create Project
                    </button>

                  </div>
                ) : (
                  recentProjects.map(
                    (project) => {
                      const projectName =
                        getProjectName(
                          project
                        );

                      const projectId =
                        getProjectId(
                          project
                        );

                      const projectStatus =
                        getProjectStatus(
                          project
                        );

                      const activeBuild =
                        isActiveBuild(
                          project
                        );

                      const failed =
                        isFailed(
                          project
                        );

                      const lastActivity =
                        project?.lastActivityAt ||
                        project?.updatedAt ||
                        project?.createdAt;

                      return (
                        <button
                          type="button"
                          key={
                            projectId ||
                            projectName
                          }
                          className={
                            styles.projectRow
                          }
                          onClick={() =>
                            handleProjectOpen(
                              project
                            )
                          }
                        >

                          <div
                            className={
                              styles.projectIdentity
                            }
                          >

                            <div
                              className={
                                styles.projectAvatar
                              }
                              aria-hidden="true"
                            >
                              {getInitial(
                                projectName
                              )}
                            </div>

                            <div
                              className={
                                styles.projectText
                              }
                            >

                              <strong
                                className={
                                  styles.projectName
                                }
                              >
                                {projectName}
                              </strong>

                              <span
                                className={
                                  styles.projectMeta
                                }
                              >
                                {project?.framework ||
                                  "ZyrionOS Project"}
                              </span>

                            </div>

                          </div>


                          <div
                            className={
                              failed
                                ? styles.projectStateFailed
                                : activeBuild
                                  ? styles.projectStateActive
                                  : styles.projectState
                            }
                          >
                            <span />

                            {projectStatus ||
                              "No status"}
                          </div>


                          <div
                            className={
                              styles.projectActivity
                            }
                          >
                            <span>
                              {getRelativeTime(
                                lastActivity
                              )}
                            </span>

                            <b aria-hidden="true">
                              →
                            </b>
                          </div>

                        </button>
                      );
                    }
                  )
                )}

              </div>

            </article>


            {/* =================================================
                SYSTEM OVERVIEW
            ================================================= */}

            <article className={styles.panel}>

              <div className={styles.panelHeader}>

                <div>
                  <div className={styles.panelEyebrow}>
                    SYSTEM
                  </div>

                  <h2 className={styles.panelTitle}>
                    Operational Overview
                  </h2>

                  <p className={styles.panelSubtitle}>
                    Current state derived from real
                    workspace data.
                  </p>
                </div>

                <div
                  className={
                    failedCount > 0
                      ? styles.stateBadgeWarning
                      : styles.stateBadge
                  }
                >
                  <span />

                  {operationalState}
                </div>

              </div>


              <div className={styles.systemList}>

                <div className={styles.systemRow}>

                  <div className={styles.systemIcon}>
                    PR
                  </div>

                  <div className={styles.systemInfo}>
                    <strong>
                      Projects
                    </strong>

                    <span>
                      Backend workspace records
                    </span>
                  </div>

                  <b>
                    {hasProjectError
                      ? "—"
                      : projectCount}
                  </b>

                </div>


                <div className={styles.systemRow}>

                  <div className={styles.systemIcon}>
                    AI
                  </div>

                  <div className={styles.systemInfo}>
                    <strong>
                      AI Workspace
                    </strong>

                    <span>
                      Authenticated workspace access
                    </span>
                  </div>

                  <b
                    className={
                      user
                        ? styles.successText
                        : ""
                    }
                  >
                    {user
                      ? "Ready"
                      : "—"}
                  </b>

                </div>


                <div className={styles.systemRow}>

                  <div className={styles.systemIcon}>
                    BL
                  </div>

                  <div className={styles.systemInfo}>
                    <strong>
                      Billing
                    </strong>

                    <span>
                      Subscription service
                    </span>
                  </div>

                  <b
                    className={
                      hasSubscriptionError
                        ? styles.warningText
                        : styles.successText
                    }
                  >
                    {hasSubscriptionError
                      ? "Check"
                      : "Connected"}
                  </b>

                </div>


                <div className={styles.systemRow}>

                  <div className={styles.systemIcon}>
                    API
                  </div>

                  <div className={styles.systemInfo}>
                    <strong>
                      Workspace API
                    </strong>

                    <span>
                      Project data connection
                    </span>
                  </div>

                  <b
                    className={
                      hasProjectError
                        ? styles.warningText
                        : styles.successText
                    }
                  >
                    {hasProjectError
                      ? "Check"
                      : "Connected"}
                  </b>

                </div>

              </div>

            </article>

          </section>


          {/* =================================================
              LOWER GRID
          ================================================= */}

          <section className={styles.lowerGrid}>

            {/* =================================================
                USAGE
            ================================================= */}

            <article className={styles.panel}>

              <div className={styles.panelHeader}>

                <div>
                  <div className={styles.panelEyebrow}>
                    USAGE
                  </div>

                  <h2 className={styles.panelTitle}>
                    Account Usage
                  </h2>

                  <p className={styles.panelSubtitle}>
                    Values available from the authenticated
                    account context.
                  </p>
                </div>

              </div>


              <div className={styles.usageGrid}>

                <div className={styles.usageCard}>
                  <span>
                    DEPLOYMENTS USED
                  </span>

                  <strong>
                    {deploymentsUsed === null
                      ? "—"
                      : deploymentsUsed}
                  </strong>

                  <small>
                    Account usage
                  </small>
                </div>


                <div className={styles.usageCard}>
                  <span>
                    ACTIVE BUILDS
                  </span>

                  <strong>
                    {hasProjectError
                      ? "—"
                      : activeBuildCount}
                  </strong>

                  <small>
                    Current projects
                  </small>
                </div>


                <div className={styles.usageCard}>
                  <span>
                    DEPLOYED
                  </span>

                  <strong>
                    {hasProjectError
                      ? "—"
                      : deployedCount}
                  </strong>

                  <small>
                    Live project state
                  </small>
                </div>


                <div className={styles.usageCard}>
                  <span>
                    FAILED
                  </span>

                  <strong
                    className={
                      failedCount > 0
                        ? styles.failedValue
                        : ""
                    }
                  >
                    {hasProjectError
                      ? "—"
                      : failedCount}
                  </strong>

                  <small>
                    Current project state
                  </small>
                </div>

              </div>

            </article>


            {/* =================================================
                ACCOUNT
            ================================================= */}

            <article className={styles.panel}>

              <div className={styles.panelHeader}>

                <div>
                  <div className={styles.panelEyebrow}>
                    ACCOUNT
                  </div>

                  <h2 className={styles.panelTitle}>
                    Workspace Identity
                  </h2>
                </div>

              </div>


              <div className={styles.accountCard}>

                <div
                  className={styles.accountAvatar}
                  aria-hidden="true"
                >
                  {getInitial(
                    userName
                  )}
                </div>

                <div className={styles.accountInfo}>

                  <strong>
                    {userName}
                  </strong>

                  <span>
                    {userEmail}
                  </span>

                </div>

              </div>


              <div className={styles.accountGrid}>

                <div>
                  <span>
                    ROLE
                  </span>

                  <strong>
                    {userRole}
                  </strong>
                </div>

                <div>
                  <span>
                    PLAN
                  </span>

                  <strong>
                    {planLabel}
                  </strong>
                </div>

                <div>
                  <span>
                    PROJECTS
                  </span>

                  <strong>
                    {hasProjectError
                      ? "—"
                      : projectCount}
                  </strong>
                </div>

                <div>
                  <span>
                    DEPLOYMENTS
                  </span>

                  <strong>
                    {deploymentsUsed === null
                      ? "—"
                      : deploymentsUsed}
                  </strong>
                </div>

              </div>


              <button
                type="button"
                className={styles.accountButton}
                onClick={() =>
                  navigate(
                    "/settings"
                  )
                }
              >
                Manage Account

                <span aria-hidden="true">
                  →
                </span>
              </button>

            </article>

          </section>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className={styles.quickPanel}>

            <div>
              <div className={styles.panelEyebrow}>
                OPERATIONS
              </div>

              <h2 className={styles.quickTitle}>
                Continue Working
              </h2>

              <p className={styles.panelSubtitle}>
                Jump directly into your workspace operations.
              </p>
            </div>


            <div className={styles.quickActions}>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/workspace"
                  )
                }
              >
                <span>
                  +
                </span>

                <div>
                  <strong>
                    New Project
                  </strong>

                  <small>
                    Start building
                  </small>
                </div>

                <b>
                  →
                </b>
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/deployments"
                  )
                }
              >
                <span>
                  ↑
                </span>

                <div>
                  <strong>
                    Deployments
                  </strong>

                  <small>
                    Manage releases
                  </small>
                </div>

                <b>
                  →
                </b>
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/billing"
                  )
                }
              >
                <span>
                  $
                </span>

                <div>
                  <strong>
                    Billing
                  </strong>

                  <small>
                    Subscription & usage
                  </small>
                </div>

                <b>
                  →
                </b>
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/settings"
                  )
                }
              >
                <span>
                  ⚙
                </span>

                <div>
                  <strong>
                    Settings
                  </strong>

                  <small>
                    Account configuration
                  </small>
                </div>

                <b>
                  →
                </b>
              </button>

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className={styles.footer}>

            <div>

              <span
                className={
                  hasAnyError
                    ? styles.footerDotWarning
                    : styles.footerDot
                }
                aria-hidden="true"
              />

              {hasAnyError
                ? "Workspace requires attention"
                : "ZyrionOS workspace connected"}

            </div>

            <span>
              {userEmail}
            </span>

          </footer>

        </div>
      </main>
    </DashboardLayout>
  );
}


export default Dashboard;
