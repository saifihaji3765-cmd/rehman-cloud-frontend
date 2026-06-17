import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import styles from "./Dashboard.module.css";

function Dashboard() {
  return (
    <DashboardLayout>

      <div className={styles.page}>

        {/* HEADER */}

        <div className={styles.header}>

          <div>

            <h1 className={styles.title}>
              Dashboard
            </h1>

            <p className={styles.subtitle}>
              Monitor infrastructure, AI agents,
              deployments and workspace activity.
            </p>

          </div>

          <button
            className={styles.createButton}
          >
            New Project
          </button>

        </div>

        {/* KPI CARDS */}

        <div className={styles.statsGrid}>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Active Projects
            </div>

            <div className={styles.statValue}>
              12
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              AI Agents
            </div>

            <div className={styles.statValue}>
              28
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Deployments
            </div>

            <div className={styles.statValue}>
              143
            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Team Members
            </div>

            <div className={styles.statValue}>
              8
            </div>

          </div>

        </div>

        {/* OVERVIEW */}

        <div className={styles.section}>

          <h2 className={styles.sectionTitle}>
            Workspace Overview
          </h2>

          <p className={styles.sectionText}>
            Manage AI applications, cloud deployments,
            monitoring systems, infrastructure,
            automation pipelines and enterprise workloads
            from one unified platform.
          </p>

        </div>

        {/* DEPLOYMENTS */}

        <div className={styles.section}>

          <h2 className={styles.sectionTitle}>
            Recent Deployments
          </h2>

          <p className={styles.sectionText}>
            Latest production deployments,
            build history and environment status
            will appear here.
          </p>

        </div>

        {/* AI AGENTS */}

        <div className={styles.section}>

          <h2 className={styles.sectionTitle}>
            AI Agents
          </h2>

          <p className={styles.sectionText}>
            Monitor autonomous agents,
            workflows, automations and AI operations.
          </p>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Dashboard;
