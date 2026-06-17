import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import styles from "./Deployments.module.css";

function Deployments() {
  return (
    <DashboardLayout>

      <div className={styles.page}>

        {/* HEADER */}

        <div className={styles.header}>

          <div>

            <h1 className={styles.title}>
              Deployments
            </h1>

            <p className={styles.subtitle}>
              Manage production deployments,
              infrastructure and release pipelines.
            </p>

          </div>

          <button
            className={styles.deployButton}
          >
            New Deployment
          </button>

        </div>

        {/* STATS */}

        <div className={styles.statsGrid}>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Total Deployments
            </div>

            <div className={styles.statValue}>
              143
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Production Apps
            </div>

            <div className={styles.statValue}>
              12
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Success Rate
            </div>

            <div className={styles.statValue}>
              99.9%
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Active Regions
            </div>

            <div className={styles.statValue}>
              8
            </div>

          </div>

        </div>

        {/* DEPLOYMENT TABLE */}

        <div className={styles.table}>

          <div
            className={`${styles.row} ${styles.headerRow}`}
          >

            <div>Project</div>

            <div>Status</div>

            <div>Environment</div>

            <div>Region</div>

          </div>

          <div className={styles.row}>

            <div className={styles.cell}>
              AI SaaS Platform
            </div>

            <div
              className={`${styles.cell} ${styles.success}`}
            >
              Success
            </div>

            <div className={styles.cell}>
              Production
            </div>

            <div className={styles.cell}>
              Mumbai
            </div>

          </div>

          <div className={styles.row}>

            <div className={styles.cell}>
              CRM Enterprise
            </div>

            <div
              className={`${styles.cell} ${styles.pending}`}
            >
              Building
            </div>

            <div className={styles.cell}>
              Staging
            </div>

            <div className={styles.cell}>
              Singapore
            </div>

          </div>

          <div className={styles.row}>

            <div className={styles.cell}>
              Agent Platform
            </div>

            <div
              className={`${styles.cell} ${styles.success}`}
            >
              Success
            </div>

            <div className={styles.cell}>
              Production
            </div>

            <div className={styles.cell}>
              Frankfurt
            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Deployments;
