import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import styles from "./Dashboard.module.css";

function Dashboard() {
  return (
    <DashboardLayout>

      <div className={styles.page}>

        <div className={styles.header}>

          <div>

            <h1 className={styles.title}>
              ZyrionOS Control Center
            </h1>

            <p className={styles.subtitle}>
              Manage projects, deployments,
              infrastructure and subscriptions.
            </p>

          </div>

          <button
            className={styles.createButton}
          >
            New Project
          </button>

        </div>

        <div className={styles.statsGrid}>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Active Projects
            </div>

            <div className={styles.statValue}>
              --
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Deployments
            </div>

            <div className={styles.statValue}>
              --
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Current Plan
            </div>

            <div className={styles.statValue}>
              --
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              AI Credits
            </div>

            <div className={styles.statValue}>
              --
            </div>

          </div>

        </div>

        <div className={styles.highlightCard}>

  <div className={styles.highlightTitle}>
    ZyrionOS Platform Status
  </div>

  <div className={styles.highlightValue}>
    Operational
  </div>

  <div className={styles.highlightText}>
    AI infrastructure, deployments,
    monitoring and cloud services
    are running normally.
  </div>

</div>

<div className={styles.healthGrid}>

  <div className={styles.healthCard}>

    <div className={styles.healthTitle}>
      Infrastructure
    </div>

    <div className={styles.healthValue}>
      Healthy
    </div>

  </div>

  <div className={styles.healthCard}>

    <div className={styles.healthTitle}>
      Deployments
    </div>

    <div className={styles.healthValue}>
      Stable
    </div>

  </div>

  <div className={styles.healthCard}>

    <div className={styles.healthTitle}>
      AI Services
    </div>

    <div className={styles.healthValue}>
      Active
    </div>

  </div>

</div>
        <div className={styles.contentGrid}>

          <div className={styles.section}>

            <h2 className={styles.sectionTitle}>
              Recent Activity
            </h2>

            <div className={styles.activityItem}>
              Activity will appear here
            </div>

            <div className={styles.activityItem}>
              Deployment history
            </div>

            <div className={styles.activityItem}>
              Generated projects
            </div>

          </div>

          <div className={styles.section}>

            <h2 className={styles.sectionTitle}>
              Infrastructure
            </h2>

            <div className={styles.activityItem}>
              CPU: --
            </div>

            <div className={styles.activityItem}>
              RAM: --
            </div>

            <div className={styles.activityItem}>
              Storage: --
            </div>

            <div className={styles.activityItem}>
              Bandwidth: --
            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Dashboard;
