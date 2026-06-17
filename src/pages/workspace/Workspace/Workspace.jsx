import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import styles from "./Workspace.module.css";

function Workspace() {
  return (
    <DashboardLayout>

      <div className={styles.page}>

        {/* LEFT PANEL */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <h2 className={styles.panelTitle}>
              Conversations
            </h2>

          </div>

          <div className={styles.history}>

            <div className={styles.historyItem}>
              SaaS Platform Generator
            </div>

            <div className={styles.historyItem}>
              AI CRM Builder
            </div>

            <div className={styles.historyItem}>
              Mobile App Project
            </div>

            <div className={styles.historyItem}>
              Deployment Assistant
            </div>

          </div>

        </div>

        {/* CENTER PANEL */}

        <div className={styles.panel}>

          <div className={styles.chatArea}>

            <div className={styles.messages}>

              <div
                className={`${styles.message} ${styles.ai}`}
              >
                Welcome to ZyrionOS AI Workspace.

                Describe what you want to build.
              </div>

              <div
                className={`${styles.message} ${styles.user}`}
              >
                Build a global AI SaaS platform.
              </div>

            </div>

            <div className={styles.inputArea}>

              <textarea
                className={styles.textarea}
                placeholder="Describe your project..."
              />

              <button
                className={styles.sendButton}
              >
                Generate With AI
              </button>

            </div>

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <h2 className={styles.panelTitle}>
              AI Tools
            </h2>

          </div>

          <div className={styles.tools}>

            <div className={styles.toolCard}>
              Full Stack Generator
            </div>

            <div className={styles.toolCard}>
              API Builder
            </div>

            <div className={styles.toolCard}>
              Database Designer
            </div>

            <div className={styles.toolCard}>
              Deployment Agent
            </div>

            <div className={styles.toolCard}>
              Security Scanner
            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Workspace;
