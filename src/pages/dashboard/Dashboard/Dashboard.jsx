import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import { useAuth } from "../../../context/AuthContext";

import { getProjects } from "../../../services/workspaceService";
import { getSubscription } from "../../../services/billingService";

import styles from "./Dashboard.module.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setError("");

        const [projectsResponse, subscriptionResponse] =
          await Promise.all([
            getProjects(),
            getSubscription()
          ]);

        if (!mounted) return;

        /*
        ========================================
        PROJECT RESPONSE NORMALIZATION
        ========================================
        */

        const projectsData = projectsResponse?.data;

        let normalizedProjects = [];

        if (Array.isArray(projectsData)) {
          normalizedProjects = projectsData;
        } else if (Array.isArray(projectsData?.projects)) {
          normalizedProjects = projectsData.projects;
        } else if (Array.isArray(projectsData?.data)) {
          normalizedProjects = projectsData.data;
        }

        /*
        ========================================
        SUBSCRIPTION RESPONSE NORMALIZATION
        ========================================
        */

        const subscriptionData = subscriptionResponse?.data;

        let normalizedSubscriptions = [];

        if (Array.isArray(subscriptionData)) {
          normalizedSubscriptions = subscriptionData;
        } else if (
          Array.isArray(subscriptionData?.subscriptions)
        ) {
          normalizedSubscriptions =
            subscriptionData.subscriptions;
        } else if (
          Array.isArray(subscriptionData?.data)
        ) {
          normalizedSubscriptions =
            subscriptionData.data;
        }

        setProjects(normalizedProjects);
        setSubscriptions(normalizedSubscriptions);
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (mounted) {
          setProjects([]);
          setSubscriptions([]);
          setError(
            "Some workspace data could not be loaded."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  ========================================
  SAFE USER DATA
  ========================================
  */

  const userName = user?.name || "User";
  const userEmail = user?.email || "Loading...";
  const userRole = user?.role || "User";

  const deploymentsUsed =
    Number(user?.deploymentsUsed) || 0;

  /*
  ========================================
  CURRENT PLAN
  ========================================
  */

  const currentPlan =
    subscriptions[0]?.planName ||
    subscriptions[0]?.plan ||
    user?.subscriptionPlan ||
    "Free";

  /*
  ========================================
  PLAN DISPLAY
  ========================================
  */

  const normalizedPlan = String(currentPlan).toLowerCase();

  const planLabel =
    normalizedPlan === "free"
      ? "Free"
      : String(currentPlan);

  /*
  ========================================
  PROJECT STATS
  ========================================
  */

  const projectCount = projects.length;

  const recentProjects = useMemo(() => {
    return projects.slice(0, 5);
  }, [projects]);

  /*
  ========================================
  REFRESH
  ========================================
  */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const [projectsResponse, subscriptionResponse] =
        await Promise.all([
          getProjects(),
          getSubscription()
        ]);

      const projectsData = projectsResponse?.data;
      const subscriptionData = subscriptionResponse?.data;

      let nextProjects = [];

      if (Array.isArray(projectsData)) {
        nextProjects = projectsData;
      } else if (Array.isArray(projectsData?.projects)) {
        nextProjects = projectsData.projects;
      } else if (Array.isArray(projectsData?.data)) {
        nextProjects = projectsData.data;
      }

      let nextSubscriptions = [];

      if (Array.isArray(subscriptionData)) {
        nextSubscriptions = subscriptionData;
      } else if (
        Array.isArray(subscriptionData?.subscriptions)
      ) {
        nextSubscriptions =
          subscriptionData.subscriptions;
      } else if (
        Array.isArray(subscriptionData?.data)
      ) {
        nextSubscriptions =
          subscriptionData.data;
      }

      setProjects(nextProjects);
      setSubscriptions(nextSubscriptions);
      setError("");
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      setError(
        "Unable to refresh workspace data right now."
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DashboardLayout>
      <main className={styles.page}>

        {/* ========================================
            TOP HEADER
        ======================================== */}

        <section className={styles.hero}>

          <div className={styles.heroLeft}>

            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              ZYRIONOS WORKSPACE
            </div>

            <h1 className={styles.title}>
              Welcome back,{" "}
              <span>{userName}</span>
            </h1>

            <p className={styles.subtitle}>
              Manage your AI infrastructure, projects,
              deployments and cloud operations from one
              centralized workspace.
            </p>

          </div>

          <div className={styles.heroActions}>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <span className={styles.buttonIcon}>
                ↻
              </span>

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate("/workspace")}
            >
              <span>＋</span>
              New Project
            </button>

          </div>

        </section>

        {/* ========================================
            ERROR NOTICE
        ======================================== */}

        {error && (
          <div className={styles.alert}>
            <div className={styles.alertIcon}>!</div>

            <div>
              <strong>Workspace data notice</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ========================================
            PLATFORM STATUS
        ======================================== */}

        <section className={styles.statusBar}>

          <div className={styles.statusMain}>

            <div className={styles.statusPulse}>
              <span />
            </div>

            <div>
              <div className={styles.statusTitle}>
                All Systems Operational
              </div>

              <div className={styles.statusDescription}>
                ZyrionOS cloud platform is operating normally
              </div>
            </div>

          </div>

          <div className={styles.statusMeta}>
            <span>Infrastructure</span>
            <strong>Healthy</strong>
          </div>

          <div className={styles.statusMeta}>
            <span>AI Services</span>
            <strong>Active</strong>
          </div>

          <div className={styles.statusMeta}>
            <span>Deployments</span>
            <strong>Stable</strong>
          </div>

        </section>

        {/* ========================================
            KPI CARDS
        ======================================== */}

        <section className={styles.statsGrid}>

          <article className={styles.statCard}>

            <div className={styles.statTop}>
              <span>WORKSPACE</span>

              <div className={styles.statIcon}>
                ◈
              </div>
            </div>

            <div className={styles.statValue}>
              {loading ? "—" : projectCount}
            </div>

            <div className={styles.statName}>
              Active Projects
            </div>

            <div className={styles.statFooter}>
              <span className={styles.positive}>
                Workspace
              </span>

              <span>
                projects managed
              </span>
            </div>

          </article>

          <article className={styles.statCard}>

            <div className={styles.statTop}>
              <span>DEPLOYMENTS</span>

              <div className={styles.statIcon}>
                ↑
              </div>
            </div>

            <div className={styles.statValue}>
              {deploymentsUsed}
            </div>

            <div className={styles.statName}>
              Deployments Used
            </div>

            <div className={styles.statFooter}>
              <span className={styles.positive}>
                Stable
              </span>

              <span>
                deployment activity
              </span>
            </div>

          </article>

          <article className={styles.statCard}>

            <div className={styles.statTop}>
              <span>SUBSCRIPTION</span>

              <div className={styles.statIcon}>
                ◆
              </div>
            </div>

            <div className={styles.planValue}>
              {planLabel}
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
                onClick={() => navigate("/billing")}
              >
                Manage →
              </button>
            </div>

          </article>

          <article className={styles.statCard}>

            <div className={styles.statTop}>
              <span>ACCESS</span>

              <div className={styles.statIcon}>
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
              <span className={styles.positive}>
                Verified
              </span>

              <span>
                workspace access
              </span>
            </div>

          </article>

        </section>

        {/* ========================================
            MAIN GRID
        ======================================== */}

        <section className={styles.mainGrid}>

          {/* PROJECTS */}

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
                  Your latest workspace activity
                </p>
              </div>

              <button
                type="button"
                className={styles.textButton}
                onClick={() => navigate("/workspace")}
              >
                View Workspace →
              </button>

            </div>

            <div className={styles.projectList}>

              {loading ? (
                <>
                  <div className={styles.loadingRow}>
                    Loading workspace data...
                  </div>

                  <div className={styles.loadingRow}>
                    Preparing projects...
                  </div>
                </>
              ) : recentProjects.length === 0 ? (
                <div className={styles.emptyState}>

                  <div className={styles.emptyIcon}>
                    ◇
                  </div>

                  <h3>
                    No projects yet
                  </h3>

                  <p>
                    Create your first project and
                    start building with ZyrionOS.
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
                recentProjects.map((project, index) => {

                  const projectName =
                    project?.projectName ||
                    project?.name ||
                    "Unnamed Project";

                  const projectId =
                    project?._id ||
                    project?.id ||
                    index;

                  return (
                    <div
                      key={projectId}
                      className={styles.projectRow}
                    >

                      <div className={styles.projectIdentity}>

                        <div className={styles.projectAvatar}>
                          {projectName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div className={styles.projectName}>
                            {projectName}
                          </div>

                          <div className={styles.projectMeta}>
                            ZyrionOS Workspace
                          </div>
                        </div>

                      </div>

                      <div className={styles.projectStatus}>
                        <span />
                        Active
                      </div>

                      <div className={styles.projectArrow}>
                        →
                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </article>

          {/* PLATFORM */}

          <article className={styles.panel}>

            <div className={styles.panelHeader}>

              <div>
                <div className={styles.panelEyebrow}>
                  PLATFORM
                </div>

                <h2 className={styles.panelTitle}>
                  Infrastructure
                </h2>

                <p className={styles.panelSubtitle}>
                  Core ZyrionOS services
                </p>
              </div>

              <div className={styles.liveBadge}>
                <span />
                LIVE
              </div>

            </div>

            <div className={styles.infrastructureList}>

              <div className={styles.infrastructureRow}>

                <div className={styles.infrastructureInfo}>
                  <div className={styles.serviceIcon}>
                    CPU
                  </div>

                  <div>
                    <strong>
                      Compute Infrastructure
                    </strong>

                    <span>
                      Cloud compute services
                    </span>
                  </div>
                </div>

                <div className={styles.healthy}>
                  Healthy
                </div>

              </div>

              <div className={styles.infrastructureRow}>

                <div className={styles.infrastructureInfo}>
                  <div className={styles.serviceIcon}>
                    AI
                  </div>

                  <div>
                    <strong>
                      AI Services
                    </strong>

                    <span>
                      AI processing infrastructure
                    </span>
                  </div>
                </div>

                <div className={styles.healthy}>
                  Active
                </div>

              </div>

              <div className={styles.infrastructureRow}>

                <div className={styles.infrastructureInfo}>
                  <div className={styles.serviceIcon}>
                    DB
                  </div>

                  <div>
                    <strong>
                      Data Services
                    </strong>

                    <span>
                      Workspace data systems
                    </span>
                  </div>
                </div>

                <div className={styles.healthy}>
                  Healthy
                </div>

              </div>

              <div className={styles.infrastructureRow}>

                <div className={styles.infrastructureInfo}>
                  <div className={styles.serviceIcon}>
                    API
                  </div>

                  <div>
                    <strong>
                      API Gateway
                    </strong>

                    <span>
                      Platform connectivity
                    </span>
                  </div>
                </div>

                <div className={styles.healthy}>
                  Operational
                </div>

              </div>

            </div>

          </article>

        </section>

        {/* ========================================
            LOWER GRID
        ======================================== */}

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

              </div>
            </div>

            <div className={styles.quickActions}>

              <button
                type="button"
                onClick={() => navigate("/workspace")}
                className={styles.quickAction}
              >
                <div className={styles.quickIcon}>
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

                <b>→</b>
              </button>

              <button
                type="button"
                onClick={() => navigate("/deployments")}
                className={styles.quickAction}
              >
                <div className={styles.quickIcon}>
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

                <b>→</b>
              </button>

              <button
                type="button"
                onClick={() => navigate("/billing")}
                className={styles.quickAction}
              >
                <div className={styles.quickIcon}>
                  $
                </div>

                <div>
                  <strong>
                    Billing
                  </strong>

                  <span>
                    Manage subscription
                  </span>
                </div>

                <b>→</b>
              </button>

              <button
                type="button"
                onClick={() => navigate("/settings")}
                className={styles.quickAction}
              >
                <div className={styles.quickIcon}>
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

                <b>→</b>
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

              <div className={styles.accountAvatar}>
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className={styles.accountMain}>

                <h3>
                  {userName}
                </h3>

                <p>
                  {userEmail}
                </p>

              </div>

            </div>

            <div className={styles.accountDetails}>

              <div>
                <span>Role</span>
                <strong>{userRole}</strong>
              </div>

              <div>
                <span>Plan</span>
                <strong>{planLabel}</strong>
              </div>

              <div>
                <span>Projects</span>
                <strong>{projectCount}</strong>
              </div>

              <div>
                <span>Deployments</span>
                <strong>{deploymentsUsed}</strong>
              </div>

            </div>

            <button
              type="button"
              className={styles.manageAccount}
              onClick={() => navigate("/settings")}
            >
              Manage Account
              <span>→</span>
            </button>

          </article>

        </section>

        {/* ========================================
            FOOTER STATUS
        ======================================== */}

        <footer className={styles.footer}>

          <div>
            <span className={styles.footerDot} />
            ZyrionOS Platform Operational
          </div>

          <span>
            Secure workspace environment
          </span>

        </footer>

      </main>
    </DashboardLayout>
  );
}

export default Dashboard;
