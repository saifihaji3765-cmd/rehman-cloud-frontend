import styles from "./Topbar.module.css";

function Topbar() {
  return (
    <header className={styles.topbar}>

      {/* LEFT */}

      <div className={styles.left}>

        <div
          className={styles.workspaceSwitcher}
        >
          ZyrionOS Workspace
        </div>

        <input
          className={styles.searchBox}
          placeholder="Search projects, deployments, files..."
        />

      </div>

      {/* RIGHT */}

      <div className={styles.right}>

        <div
          className={styles.systemStatus}
        >

          <div
            className={styles.statusDot}
          />

          All Systems Operational

        </div>

        <div
          className={styles.creditBadge}
        >
          AI Credits
        </div>

        <button
          className={styles.actionButton}
        >
          Notifications
        </button>

        <div
          className={styles.profileInfo}
        >

          <div
            className={styles.profile}
          >
            Z
          </div>

          <div
            className={styles.profileName}
          >
            Account
          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;
