import styles from "./DashboardLayout.module.css";

function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>

      {/* SIDEBAR */}

      <aside className={styles.sidebar}>

        <div className={styles.sidebarHeader}>

          <h2 className={styles.sidebarTitle}>
            Cloud Platform
          </h2>

        </div>

        <nav className={styles.sidebarMenu}>

          <div className={styles.menuItem}>
            Dashboard
          </div>

          <div className={styles.menuItem}>
            Workspace
          </div>

          <div className={styles.menuItem}>
            Deployments
          </div>

          <div className={styles.menuItem}>
            Billing
          </div>

          <div className={styles.menuItem}>
            Settings
          </div>

        </nav>

      </aside>

      {/* MAIN AREA */}

      <div className={styles.mainArea}>

        {/* TOPBAR */}

        <header className={styles.topbar}>

          <h1 className={styles.topbarTitle}>
            Enterprise Console
          </h1>

        </header>

        {/* PAGE CONTENT */}

        <main className={styles.content}>

          {children}

        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;
