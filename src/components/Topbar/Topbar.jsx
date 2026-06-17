import styles from "./Topbar.module.css";

function Topbar() {
  return (
    <header className={styles.topbar}>

      <div className={styles.left}>

        <input
          className={styles.searchBox}
          placeholder="Search projects, deployments, files..."
        />

      </div>

      <div className={styles.right}>

        <button
          className={styles.actionButton}
        >
          Notifications
        </button>

        <button
          className={styles.actionButton}
        >
          Upgrade
        </button>

        <div className={styles.profile}>
          Z
        </div>

      </div>

    </header>
  );
}

export default Topbar;
