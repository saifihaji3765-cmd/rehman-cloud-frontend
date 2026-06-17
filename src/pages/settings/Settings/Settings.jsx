import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import styles from "./Settings.module.css";

function Settings() {
  return (
    <DashboardLayout>

      <div className={styles.page}>

        {/* HEADER */}

        <div className={styles.header}>

          <div>

            <h1 className={styles.title}>
              Settings
            </h1>

            <p className={styles.subtitle}>
              Manage profile, security,
              subscription and infrastructure settings.
            </p>

          </div>

          <button
            className={styles.saveButton}
          >
            Save Changes
          </button>

        </div>

        {/* GRID */}

        <div className={styles.grid}>

          {/* PROFILE */}

          <div className={styles.card}>

            <h2 className={styles.cardTitle}>
              Profile
            </h2>

            <div className={styles.row}>
              <span className={styles.label}>
                Account
              </span>

              <span className={styles.value}>
                Connected
              </span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>
                Workspace
              </span>

              <span className={styles.value}>
                Active
              </span>
            </div>

          </div>

          {/* SECURITY */}

          <div className={styles.card}>

            <h2 className={styles.cardTitle}>
              Security
            </h2>

            <div className={styles.row}>
              <span className={styles.label}>
                Two Factor Auth
              </span>

              <span className={styles.value}>
                Enabled
              </span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>
                Session Status
              </span>

              <span className={styles.value}>
                Active
              </span>
            </div>

          </div>

          {/* SUBSCRIPTION */}

          <div className={styles.card}>

            <h2 className={styles.cardTitle}>
              Subscription
            </h2>

            <div className={styles.row}>
              <span className={styles.label}>
                Plan
              </span>

              <span className={styles.value}>
                API Connected Later
              </span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>
                Billing Cycle
              </span>

              <span className={styles.value}>
                API Connected Later
              </span>
            </div>

          </div>

          {/* INFRASTRUCTURE */}

          <div className={styles.card}>

            <h2 className={styles.cardTitle}>
              Infrastructure
            </h2>

            <div className={styles.row}>
              <span className={styles.label}>
                CPU
              </span>

              <span className={styles.value}>
                API Connected Later
              </span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>
                RAM
              </span>

              <span className={styles.value}>
                API Connected Later
              </span>
            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Settings;
