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
              Projects
            </h2>

          </div>

          <div className={styles.history}>

            <div className={styles.historyItem}>
              Company Analysis Platform
            </div>

            <div className={styles.historyItem}>
              AI CRM System
            </div>

            <div className={styles.historyItem}>
              Marketing Automation Suite
            </div>

            <div className={styles.historyItem}>
              Global SaaS Builder
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

                You are one prompt away from
                building the next generation
                software company.

                <br /><br />

                Describe your SaaS idea,
                business platform,
                automation system,
                AI product or startup vision.

                <br /><br />

                ZyrionOS can transform
                a simple idea into
                production-ready architecture,
                source code,
                cloud infrastructure,
                deployment pipelines
                and scalable digital products.

                <br /><br />

                From concept to deployment.
                Powered by ZyrionOS.

              </div>

            </div>

            <div className={styles.inputArea}>

              <textarea
                className={styles.textarea}
                placeholder="Describe what you want to build..."
              />

              <div className={styles.actions}>

                <button
                  className={styles.generateButton}
                >
                  Generate Project
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <h2 className={styles.panelTitle}>
              Project Overview
            </h2>

          </div>

          <div className={styles.sidebar}>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Generated Files
              </div>

              <div className={styles.cardText}>
                Waiting for generation...
              </div>

            </div>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Deployment Status
              </div>

              <div className={styles.cardText}>
                Not deployed
              </div>

            </div>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Framework
              </div>

              <div className={styles.cardText}>
                Not selected
              </div>

            </div>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Live URL
              </div>

              <div className={styles.cardText}>
                Available after deployment
              </div>

            </div>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Subscription Plan
              </div>

              <div className={styles.cardText}>
                Connected from backend
              </div>

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Workspace;
