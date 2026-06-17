import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";

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

        <Sidebar />

      </aside>

      {/* MAIN AREA */}

      <div className={styles.mainArea}>

        {/* TOPBAR */}

        <header className={styles.topbar}>

          <h1 className={styles.topbarTitle}>
            Enterprise Console
          </h1>

        </header>

        {/* CONTENT */}

        <main className={styles.content}>

          {children}

        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;
