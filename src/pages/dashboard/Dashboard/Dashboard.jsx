import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import { useAuth } from "../../../context/AuthContext";

import { getProjects } from "../../../services/workspaceService";
import { getSubscription } from "../../../services/billingService";

import styles from "./Dashboard.module.css";

/* =========================================================
   RESPONSE NORMALIZATION
   ========================================================= */

function normalizeProjects(response) {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.projects)) {
    return payload.projects;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeSubscriptions(response) {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.subscriptions)) {
    return payload.subscriptions;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  /*
   * Some billing APIs return one subscription object
   * instead of an array.
   */
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    (payload.planName ||
      payload.plan ||
      payload.subscriptionPlan ||
      payload.status)
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
  return project?._id || project?.id || null;
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
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitial(name) {
  const value = String(name || "").trim();

  return value ? value.charAt(0).toUpperCase() : "U";
}

/* =========================================================
   COMPONENT
   ========================================================= */

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [projectsError, setProjectsError] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");

  /* =======================================================
     LOAD DASHBOARD DATA
     ======================================================= */

  const loadDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setProjectsError("");
      setSubscriptionError("");

      const [projectsResult, subscriptionResult] =
        await Promise.allSettled([
          getProjects(),
          getSubscription(),
        ]);

      /* ---------------------------------------------------
         PROJECTS
         --------------------------------------------------- */

      if (projectsResult.status === "fulfilled") {
        setProjects(
          normalizeProjects(projectsResult.value)
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

      /* ---------------------------------------------------
         SUBSCRIPTION
         --------------------------------------------------- */

      if (subscriptionResult.status === "fulfilled") {
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

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      if (!mounted) return;

      await loadDashboard();
    }

    initialLoad();

    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  /* =======================================================
     SAFE USER DATA
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

  const deploymentsValue =
    user?.deploymentsUsed ??
    user?.deploymentCount ??
    user?.deployments ??
    null;

  const deploymentsUsed =
    deploymentsValue === null ||
    deploymentsValue === undefined
      ? null
      : Number.isFinite(Number(deploymentsValue))
        ? Number(deploymentsValue)
        : null;

  /* =======================================================
     SUBSCRIPTION
     ======================================================= */

  const currentSubscription = subscriptions[0] || null;

  const currentPlan =
    currentSubscription?.planName ||
    currentSubscription?.plan ||
    currentSubscription?.subscriptionPlan ||
    user?.subscriptionPlan ||
    user?.plan ||
    null;

  const planLabel = currentPlan
    ? String(currentPlan)
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    : "—";

  /* =======================================================
     PROJECT DATA
     ======================================================= */

  const projectCount = projects.length;

  const recentProjects = useMemo(() => {
    return projects.slice(0, 5);
  }, [projects]);

  /* =======================================================
     DATA STATE
     ======================================================= */

  const hasProjectError = Boolean(projectsError);
  const hasSubscriptionError = Boolean(subscriptionError);

  const hasAnyError =
    hasProjectError || hasSubscriptionError;

  const dataConnectionState = hasAnyError
    ? "Partial data"
    : "Connected";

  const dataConnectionDescription = hasAnyError
    ? "Some workspace services need attention."
    : "Workspace data is synchronized with ZyrionOS.";

  /* =======================================================
     HANDLERS
     ======================================================= */

  const handleRefresh = useCallback(() => {
    return loadDashboard({ refresh: true });
  }, [loadDashboard]);

  const handleProjectOpen = (project) => {
    const projectId = getProjectId(project);

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
              HERO
          ================================================= */}

          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>
                <span
                  className={styles.eyebrowDot}
                  aria-hidden="true"
                />

                ZYRIONOS WORKSPACE
              </div>

              <h1 className={styles.title}>
                Welcome back,{" "}
                <span>{userName}</span>
              </h1>

              <p className={styles.subtitle}>
                Manage your projects, deployments,
                subscription and workspace operations
                from one centralized environment.
              </p>
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <span
                  className={
                    refreshing
                      ? styles.refreshIconSpinning
                      : styles.buttonIcon
                  }
                  aria-hidden="true"
                >
                  ↻
                </span>

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => navigate("/workspace")}
              >
                <span aria-hidden="true">＋</span>
                New Project
              </button>
            </div>
          </section>

          {/* =================================================
              DATA NOTICE
          ================================================= */}

          {hasAnyError && (
            <section
              className={styles.alert}
              role="status"
              aria-live="polite"
            >
              <div
                className={styles.alertIcon}
                aria-hidden="true"
              >
                !
              </div>

              <div className={styles.alertContent}>
                <strong>
                  Workspace data notice
                </strong>

                {projectsError && (
                  <p>{projectsError}</p>
                )}

                {subscriptionError && (
                  <p>{subscriptionError}</p>
                )}
              </div>

              <button
                type="button"
                className={styles.alertAction}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Retry
              </button>
            </section>
          )}

          {/* =================================================
              REAL DATA CONNECTION STATUS
          ================================================= */}

          <section
            className={
              hasAnyError
                ? `${styles.connectionBar} ${styles.connectionPartial}`
                : styles.connectionBar
            }
          >
            <div className={styles.connectionMain}>
              <span
                className={styles.connectionIndicator}
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

            <div className={styles.connectionMeta}>
              <span>Projects</span>
              <strong>
                {hasProjectError
                  ? "Unavailable"
                  : "Connected"}
              </strong>
            </div>

            <div className={styles.connectionMeta}>
              <span>Billing</span>
              <strong>
                {hasSubscriptionError
                  ? "Unavailable"
                  : "Connected"}
              </strong>
            </div>

            <div className={styles.connectionMeta}>
              <span>Account</span>
              <strong>
                {user ? "Authenticated" : "—"}
              </strong>
            </div>
          </section>

          {/* =================================================
              KPI CARDS
          ================================================= */}

          <section
            className={styles.statsGrid}
            aria-label="Workspace overview"
          >
            {/* PROJECTS */}

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <span>WORKSPACE</span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ◈
                </div>
              </div>

              <div className={styles.statValue}>
                {loading
                  ? "—"
                  : hasProjectError
                    ? "—"
                    : projectCount}
              </div>

              <div className={styles.statName}>
                Active Projects
              </div>

              <div className={styles.statFooter}>
                <span className={styles.info}>
                  Workspace
                </span>

                <span>
                  {hasProjectError
                    ? "data unavailable"
                    : "projects managed"}
                </span>
              </div>
            </article>

            {/* DEPLOYMENTS */}

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <span>DEPLOYMENTS</span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ↑
                </div>
              </div>

              <div className={styles.statValue}>
                {deploymentsUsed === null
                  ? "—"
                  : deploymentsUsed}
              </div>

              <div className={styles.statName}>
                Deployments Used
              </div>

              <div className={styles.statFooter}>
                <span className={styles.info}>
                  Account
                </span>

                <span>
                  {deploymentsUsed === null
                    ? "data unavailable"
                    : "recorded usage"}
                </span>
              </div>
            </article>

            {/* SUBSCRIPTION */}

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <span>SUBSCRIPTION</span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ◆
                </div>
              </div>

              <div className={styles.planValue}>
                {loading
                  ? "—"
                  : planLabel}
              </div>

              <div className={styles.statName}>
                Current Plan
              </div>

              <div className={styles.statFooter}>
                <span className={styles.info}>
                  Billing
                </span>

                <button
                  type="button"
                  className={styles.inlineButton}
                  onClick={() =>
                    navigate("/billing")
                  }
                >
                  Manage →
                </button>
              </div>
            </article>

            {/* ACCESS */}

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <span>ACCESS</span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ◉
                </div>
              </div>

              <div className={styles.planValue}>
                {userRole}
              </div>

              <div className={styles.statName}>
                Account Role
              </div>

              <div className={styles.statFooter}>
                <span className={styles.info}>
                  Account
                </span>

                <span>
                  authenticated access
                </span>
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
                    Your latest workspace projects
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() =>
                    navigate("/workspace")
                  }
                >
                  View Workspace →
                </button>
              </div>

              <div className={styles.projectList}>
                {loading ? (
                  <div className={styles.loadingState}>
                    <div
                      className={styles.loadingSpinner}
                      aria-hidden="true"
                    />

                    <span>
                      Loading workspace data...
                    </span>
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
                      your project data.
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
                      ◇
                    </div>

                    <h3>
                      No projects yet
                    </h3>

                    <p>
                      Create your first project and
                      start building inside ZyrionOS.
                    </p>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() =>
                        navigate("/workspace")
                      }
                    >
                      Create First Project
                    </button>
                  </div>
                ) : (
                  recentProjects.map((project) => {
                    const projectName =
                      getProjectName(project);

                    const projectId =
                      getProjectId(project);

                    const projectStatus =
                      getProjectStatus(project);

                    return (
                      <button
                        type="button"
                        key={
                          projectId ||
                          projectName
                        }
                        className={styles.projectRow}
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
                            <div
                              className={
                                styles.projectName
                              }
                            >
                              {projectName}
                            </div>

                            <div
                              className={
                                styles.projectMeta
                              }
                            >
                              {project?.framework ||
                                project?.description ||
                                "ZyrionOS Workspace"}
                            </div>
                          </div>
                        </div>

                        <div
                          className={
                            projectStatus
                              ? styles.projectStatus
                              : styles.projectStatusMuted
                          }
                        >
                          {projectStatus || "—"}
                        </div>

                        <div
                          className={
                            styles.projectArrow
                          }
                          aria-hidden="true"
                        >
                          →
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </article>

            {/* =================================================
                WORKSPACE SUMMARY
            ================================================= */}

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelEyebrow}>
                    PLATFORM
                  </div>

                  <h2 className={styles.panelTitle}>
                    Workspace Summary
                  </h2>

                  <p className={styles.panelSubtitle}>
                    Live account data available to
                    this workspace
                  </p>
                </div>

                <div
                  className={
                    hasAnyError
                      ? styles.stateBadgePartial
                      : styles.stateBadge
                  }
                >
                  <span />
                  {hasAnyError
                    ? "PARTIAL"
                    : "SYNCED"}
                </div>
              </div>

              <div className={styles.summaryList}>

                <div className={styles.summaryRow}>
                  <div
                    className={styles.summaryIcon}
                    aria-hidden="true"
                  >
                    PR
                  </div>

                  <div
                    className={styles.summaryInfo}
                  >
                    <strong>
                      Projects
                    </strong>

                    <span>
                      Workspace project records
                    </span>
                  </div>

                  <b>
                    {hasProjectError
                      ? "—"
                      : projectCount}
                  </b>
                </div>

                <div className={styles.summaryRow}>
                  <div
                    className={styles.summaryIcon}
                    aria-hidden="true"
                  >
                    AI
                  </div>

                  <div
                    className={styles.summaryInfo}
                  >
                    <strong>
                      AI Workspace
                    </strong>

                    <span>
                      AI building environment
                    </span>
                  </div>

                  <b>
                    {user
                      ? "Ready"
                      : "—"}
                  </b>
                </div>

                <div className={styles.summaryRow}>
                  <div
                    className={styles.summaryIcon}
                    aria-hidden="true"
                  >
                    DB
                  </div>

                  <div
                    className={styles.summaryInfo}
                  >
                    <strong>
                      Account Data
                    </strong>

                    <span>
                      Authenticated workspace
                      context
                    </span>
                  </div>

                  <b>
                    {user
                      ? "Available"
                      : "—"}
                  </b>
                </div>

                <div className={styles.summaryRow}>
                  <div
                    className={styles.summaryIcon}
                    aria-hidden="true"
                  >
                    API
                  </div>

                  <div
                    className={styles.summaryInfo}
                  >
                    <strong>
                      Workspace API
                    </strong>

                    <span>
                      Dashboard data connection
                    </span>
                  </div>

                  <b
                    className={
                      hasAnyError
                        ? styles.summaryWarning
                        : styles.summarySuccess
                    }
                  >
                    {hasAnyError
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

            {/* QUICK ACTIONS */}

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelEyebrow}>
                    OPERATIONS
                  </div>

                  <h2 className={styles.panelTitle}>
                    Quick Actions
                  </h2>

                  <p className={styles.panelSubtitle}>
                    Jump directly into workspace
                    operations.
                  </p>
                </div>
              </div>

              <div className={styles.quickActions}>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/workspace")
                  }
                  className={styles.quickAction}
                >
                  <div
                    className={styles.quickIcon}
                    aria-hidden="true"
                  >
                    ＋
                  </div>

                  <div>
                    <strong>
                      Create Project
                    </strong>

                    <span>
                      Start a new workspace
                    </span>
                  </div>

                  <b aria-hidden="true">
                    →
                  </b>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/deployments")
                  }
                  className={styles.quickAction}
                >
                  <div
                    className={styles.quickIcon}
                    aria-hidden="true"
                  >
                    ↑
                  </div>

                  <div>
                    <strong>
                      Deployments
                    </strong>

                    <span>
                      Manage production releases
                    </span>
                  </div>

                  <b aria-hidden="true">
                    →
                  </b>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/billing")
                  }
                  className={styles.quickAction}
                >
                  <div
                    className={styles.quickIcon}
                    aria-hidden="true"
                  >
                    $
                  </div>

                  <div>
                    <strong>
                      Billing
                    </strong>

                    <span>
                      Manage your subscription
                    </span>
                  </div>

                  <b aria-hidden="true">
                    →
                  </b>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/settings")
                  }
                  className={styles.quickAction}
                >
                  <div
                    className={styles.quickIcon}
                    aria-hidden="true"
                  >
                    ⚙
                  </div>

                  <div>
                    <strong>
                      Settings
                    </strong>

                    <span>
                      Configure your account
                    </span>
                  </div>

                  <b aria-hidden="true">
                    →
                  </b>
                </button>
              </div>
            </article>

            {/* ACCOUNT */}

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
                  {getInitial(userName)}
                </div>

                <div className={styles.accountMain}>
                  <h3>{userName}</h3>

                  <p>{userEmail}</p>
                </div>
              </div>

              <div className={styles.accountDetails}>
                <div>
                  <span>Role</span>
                  <strong>
                    {userRole}
                  </strong>
                </div>

                <div>
                  <span>Plan</span>
                  <strong>
                    {planLabel}
                  </strong>
                </div>

                <div>
                  <span>Projects</span>
                  <strong>
                    {hasProjectError
                      ? "—"
                      : projectCount}
                  </strong>
                </div>

                <div>
                  <span>Deployments</span>
                  <strong>
                    {deploymentsUsed === null
                      ? "—"
                      : deploymentsUsed}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className={styles.manageAccount}
                onClick={() =>
                  navigate("/settings")
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
