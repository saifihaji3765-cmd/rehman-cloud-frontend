import styles from "./Topbar.module.css";

function Topbar() {
  return (
    <header className={styles.topbar}>

      {/* LEFT */}

      <div className={styles.left}>

        <h2 className={styles.title}>
          Enterprise Console
        </h2>

      </div>

      {/* RIGHT */}

      <div className={styles.right}>

        <button className={styles.actionButton}>
          Notifications
        </button>

        <button className={styles.actionButton}>
          Profile
        </button>

      </div>

    </header>
  );
}

export default Topbar;
