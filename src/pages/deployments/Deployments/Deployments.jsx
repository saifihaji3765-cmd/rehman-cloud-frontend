import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import { getProjects } from "../../../services/workspaceService";

import styles from "./Deployments.module.css";

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

/* =========================================================
   SAFE HELPERS
   ========================================================= */

function getProjectId(project) {
  return project?._id || project?.id || null;
}

function getProjectName(project) {
  return (
    project?.projectName ||
    project?.name ||
    "Unnamed Project"
  );
}

function getDeploymentStatus(project) {
  return (
    project?.deploymentStatus ||
    project?.deployment?.status ||
    project?.deploymentState ||
    null
  );
}

function normalizeStatus(status) {
  if (!status) return null;

  return String(status)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getStatusClass(status, styles) {
  if (!status) {
    return styles.statusUnknown;
  }

  const normalized = String(status).toLowerCase();

  if (
    normalized.includes("success") ||
    normalized.includes("deployed") ||
    normalized.includes("active") ||
    normalized.includes("live") ||
    normalized.includes("complete")
  ) {
    return styles.statusSuccess;
  }

  if (
    normalized.includes("building") ||
    normalized.includes("pending") ||
    normalized.includes("deploying") ||
    normalized.includes("queued") ||
    normalized.includes("progress")
  ) {
    return styles.statusPending;
  }

  if (
    normalized.includes("failed") ||
    normalized.includes("error") ||
    normalized.includes("cancel")
  ) {
    return styles.statusFailed;
  }

  return styles.statusUnknown;
}

function getEnvironment(project) {
  return (
    project?.environment ||
    project?.deploymentEnvironment ||
    project?.deployment?.environment ||
    null
  );
}

function getRegion(project) {
  return (
    project?.region ||
    project?.deploymentRegion ||
    project?.deployment?.region ||
    null
  );
}

function getDeploymentUrl(project) {
  return (
    project?.liveUrl ||
    project?.deploymentUrl ||
    project?.deployment?.liveUrl ||
    project?.deployment?.url ||
    null
  );
}

function getDeploymentHistory(project) {
  if (Array.isArray(project?.deploymentHistory)) {
    return project.deploymentHistory;
  }

  if (
    Array.isArray(project?.deployments)
  ) {
    return project.deployments;
  }

  if (
    Array.isArray(project?.deployment?.history)
  ) {
    return project.deployment.history;
  }

  return [];
}

function getDeploymentCount(project) {
  const explicitCount =
    project?.deploymentCount ??
    project?.deploymentsCount ??
    project?.deployment?.count;

  if (
    explicitCount !== undefined &&
    explicitCount !== null &&
    Number.isFinite(Number(explicitCount))
  ) {
    return Number(explicitCount);
  }

  const history = getDeploymentHistory(project);

  if (history.length > 0) {
    return history.length;
  }

  return null;
}

/* =========================================================
   DEPLOYMENT RECORD BUILDER
   ========================================================= */

function buildDeploymentRows(projects) {
  const rows = [];

  projects.forEach((project) => {
    const history = getDeploymentHistory(project);

    /*
     * Prefer real deployment history whenever the backend
     * includes it in the project response.
     */
    if (history.length > 0) {
      history.forEach((deployment, index) => {
        rows.push({
          id:
            deployment?._id ||
            deployment?.id ||
            `${getProjectId(project) || getProjectName(project)}-${index}`,

          projectId: getProjectId(project),

          projectName:
            deployment?.projectName ||
            getProjectName(project),

          status:
            deployment?.status ||
            deployment?.deploymentStatus ||
            deployment?.state ||
            getDeploymentStatus(project),

          environment:
            deployment?.environment ||
            deployment?.deploymentEnvironment ||
            getEnvironment(project),

          region:
            deployment?.region ||
            deployment?.deploymentRegion ||
            getRegion(project),

          url:
            deployment?.liveUrl ||
            deployment?.deploymentUrl ||
            deployment?.url ||
            getDeploymentUrl(project),

          createdAt:
            deployment?.createdAt ||
            deployment?.deployedAt ||
            deployment?.updatedAt ||
            null,
        });
      });

      return;
    }

    /*
     * If deployment history is not part of the project
     * response, expose the real project-level deployment
     * state instead of inventing deployment records.
     */
    const status = getDeploymentStatus(project);

    if (status) {
      rows.push({
        id:
          getProjectId(project) ||
          getProjectName(project),

        projectId: getProjectId(project),

        projectName: getProjectName(project),

        status,

        environment: getEnvironment(project),

        region: getRegion(project),

        url: getDeploymentUrl(project),

        createdAt:
          project?.updatedAt ||
          project?.createdAt ||
          null,
      });
    }
  });

  return rows;
}

/* =========================================================
   COMPONENT
   ========================================================= */

function Deployments() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD
     ======================================================= */

  const loadDeployments = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await getProjects();

        const normalized =
          normalizeProjects(response);

        setProjects(normalized);
      } catch (err) {
        console.error(
          "Deployments loading error:",
          err
        );

        setProjects([]);

        setError(
          "Deployment data could not be loaded from the workspace."
        );
      } finally {
        if (refresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadDeployments();
  }, [loadDeployments]);

  /* =======================================================
     REAL DEPLOYMENT ROWS
     ======================================================= */

  const deploymentRows = useMemo(() => {
    return buildDeploymentRows(projects);
  }, [projects]);

  /* =======================================================
     REAL METRICS
     ======================================================= */

  const metrics = useMemo(() => {
    let totalDeployments = 0;
    let deployedProjects = 0;
    let inProgress = 0;
    let failed = 0;

    const regions = new Set();

    projects.forEach((project) => {
      const count = getDeploymentCount(project);

      if (count !== null) {
        totalDeployments += count;
      }

      const status =
        getDeploymentStatus(project);

      if (status) {
        const normalized =
          String(status).toLowerCase();

        if (
          normalized.includes("success") ||
          normalized.includes("deployed") ||
          normalized.includes("active") ||
          normalized.includes("live") ||
          normalized.includes("complete")
        ) {
          deployedProjects += 1;
        }

        if (
          normalized.includes("building") ||
          normalized.includes("pending") ||
          normalized.includes("deploying") ||
          normalized.includes("queued") ||
          normalized.includes("progress")
        ) {
          inProgress += 1;
        }

        if (
          normalized.includes("failed") ||
          normalized.includes("error") ||
          normalized.includes("cancel")
        ) {
          failed += 1;
        }
      }

      const region = getRegion(project);

      if (region) {
        regions.add(String(region));
      }
    });

    /*
     * If no deployment count exists but actual deployment
     * history was returned, count the real records.
     */
    if (
      totalDeployments === 0 &&
      deploymentRows.length > 0
    ) {
      totalDeployments =
        deploymentRows.length;
    }

    /*
     * Do not manufacture a success rate.
     * It is only shown when the available backend data
     * contains enough real status information.
     */
    const statusCount =
      deployedProjects +
      inProgress +
      failed;

    let successRate = null;

    if (statusCount > 0) {
      successRate =
        Math.round(
          (deployedProjects / statusCount) * 1000
        ) / 10;
    }

    return {
      totalDeployments,
      deployedProjects,
      inProgress,
      failed,
      activeRegions: regions.size,
      successRate,
    };
  }, [projects, deploymentRows]);

  /* =======================================================
     HANDLERS
     ======================================================= */

  const handleRefresh = () => {
    loadDeployments({ refresh: true });
  };

  const handleProjectOpen = (projectId) => {
    if (!projectId) {
      navigate("/workspace");
      return;
    }

    navigate(
      `/workspace?project=${encodeURIComponent(
        projectId
      )}`
    );
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

          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.eyebrow}>
                <span
                  className={styles.eyebrowDot}
                  aria-hidden="true"
                />

                ZYRIONOS OPERATIONS
              </div>

              <h1 className={styles.title}>
                Deployments
              </h1>

              <p className={styles.subtitle}>
                Monitor project deployment state and
                manage releases from your ZyrionOS
                workspace.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.refreshButton}
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
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <button
                type="button"
                className={styles.deployButton}
                onClick={() =>
                  navigate("/workspace")
                }
              >
                <span aria-hidden="true">
                  ＋
                </span>

                New Deployment
              </button>
            </div>
          </header>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <section
              className={styles.alert}
              role="alert"
            >
              <div
                className={styles.alertIcon}
                aria-hidden="true"
              >
                !
              </div>

              <div className={styles.alertContent}>
                <strong>
                  Deployment data unavailable
                </strong>

                <p>{error}</p>
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
              METRICS
          ================================================= */}

          <section
            className={styles.statsGrid}
            aria-label="Deployment metrics"
          >
            <article className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>
                  DEPLOYMENTS
                </span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ↑
                </div>
              </div>

              <strong className={styles.statValue}>
                {loading || error
                  ? "—"
                  : metrics.totalDeployments}
              </strong>

              <span className={styles.statName}>
                Recorded Deployments
              </span>

              <span className={styles.statMeta}>
                Backend deployment records
              </span>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>
                  PROJECTS
                </span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ◈
                </div>
              </div>

              <strong className={styles.statValue}>
                {loading || error
                  ? "—"
                  : metrics.deployedProjects}
              </strong>

              <span className={styles.statName}>
                Deployed Projects
              </span>

              <span className={styles.statMeta}>
                Projects with deployed state
              </span>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>
                  RELEASES
                </span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ◌
                </div>
              </div>

              <strong className={styles.statValue}>
                {loading || error
                  ? "—"
                  : metrics.inProgress}
              </strong>

              <span className={styles.statName}>
                In Progress
              </span>

              <span className={styles.statMeta}>
                Active deployment states
              </span>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>
                  SUCCESS
                </span>

                <div
                  className={styles.statIcon}
                  aria-hidden="true"
                >
                  ✓
                </div>
              </div>

              <strong className={styles.statValue}>
                {loading ||
                error ||
                metrics.successRate === null
                  ? "—"
                  : `${metrics.successRate}%`}
              </strong>

              <span className={styles.statName}>
                Observed Success Rate
              </span>

              <span className={styles.statMeta}>
                Calculated from available status data
              </span>
            </article>
          </section>

          {/* =================================================
              DEPLOYMENT TABLE
          ================================================= */}

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelEyebrow}>
                  RELEASE MANAGEMENT
                </div>

                <h2 className={styles.panelTitle}>
                  Deployment Activity
                </h2>

                <p className={styles.panelSubtitle}>
                  Deployment state returned by your
                  workspace backend.
                </p>
              </div>

              <div className={styles.recordCount}>
                {loading
                  ? "Loading"
                  : `${deploymentRows.length} record${
                      deploymentRows.length === 1
                        ? ""
                        : "s"
                    }`}
              </div>
            </div>

            {/* DESKTOP TABLE */}

            <div className={styles.tableWrapper}>
              <div
                className={`${styles.tableRow} ${styles.tableHeader}`}
              >
                <div>PROJECT</div>
                <div>STATUS</div>
                <div>ENVIRONMENT</div>
                <div>REGION</div>
                <div>ACTION</div>
              </div>

              {loading ? (
                <div className={styles.loadingState}>
                  <div
                    className={styles.loadingSpinner}
                    aria-hidden="true"
                  />

                  <span>
                    Loading deployment data...
                  </span>
                </div>
              ) : error ? (
                <div className={styles.emptyState}>
                  <div
                    className={styles.emptyIcon}
                    aria-hidden="true"
                  >
                    !
                  </div>

                  <h3>
                    Deployment data unavailable
                  </h3>

                  <p>
                    The workspace API did not return
                    deployment information.
                  </p>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleRefresh}
                  >
                    Retry
                  </button>
                </div>
              ) : deploymentRows.length === 0 ? (
                <div className={styles.emptyState}>
                  <div
                    className={styles.emptyIcon}
                    aria-hidden="true"
                  >
                    ↑
                  </div>

                  <h3>
                    No deployment activity
                  </h3>

                  <p>
                    There are currently no deployment
                    records available for your projects.
                  </p>

                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() =>
                      navigate("/workspace")
                    }
                  >
                    Open Workspace
                  </button>
                </div>
              ) : (
                deploymentRows.map((deployment) => {
                  const statusLabel =
                    normalizeStatus(
                      deployment.status
                    );

                  return (
                    <div
                      key={deployment.id}
                      className={styles.tableRow}
                    >
                      <button
                        type="button"
                        className={styles.projectCell}
                        onClick={() =>
                          handleProjectOpen(
                            deployment.projectId
                          )
                        }
                      >
                        <span
                          className={styles.projectMark}
                          aria-hidden="true"
                        >
                          {getProjectName(
                            deployment
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span
                          className={
                            styles.projectCellText
                          }
                        >
                          <strong>
                            {
                              deployment.projectName
                            }
                          </strong>

                          <small>
                            {deployment.url
                              ? "Live deployment available"
                              : "Workspace project"}
                          </small>
                        </span>
                      </button>

                      <div
                        className={
                          getStatusClass(
                            deployment.status,
                            styles
                          )
                        }
                      >
                        <span />

                        {statusLabel || "Unknown"}
                      </div>

                      <div className={styles.dataCell}>
                        {deployment.environment ||
                          "—"}
                      </div>

                      <div className={styles.dataCell}>
                        {deployment.region ||
                          "—"}
                      </div>

                      <div className={styles.actionCell}>
                        {deployment.url ? (
                          <a
                            href={deployment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.openLink}
                          >
                            Open
                            <span aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            className={styles.openProject}
                            onClick={() =>
                              handleProjectOpen(
                                deployment.projectId
                              )
                            }
                          >
                            Project
                            <span aria-hidden="true">
                              →
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* =================================================
              OPERATION NOTE
          ================================================= */}

          <section className={styles.operationNote}>
            <div
              className={styles.noteIcon}
              aria-hidden="true"
            >
              i
            </div>

            <div>
              <strong>
                Deployment state is backend-driven
              </strong>

              <p>
                ZyrionOS only displays deployment
                information returned by the authenticated
                workspace. Missing environment, region,
                URL or status values are shown as
                unavailable instead of being fabricated.
              </p>
            </div>
          </section>

        </div>
      </main>
    </DashboardLayout>
  );
}

export default Deployments;
