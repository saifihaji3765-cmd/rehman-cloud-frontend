import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Topbar from "../../components/Topbar/Topbar.jsx";

function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>
      {/* Accessibility */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Enterprise Application Shell */}
      <div className={styles.appShell}>

        {/* Global Navigation */}
        <aside
          className={styles.sidebar}
          aria-label="ZyrionOS primary navigation"
        >
          <Sidebar />
        </aside>

        {/* Application Area */}
        <section className={styles.mainArea}>

          {/* Global Topbar */}
          <header className={styles.topbar}>
            <Topbar />
          </header>

          {/* Workspace Status Bar */}
          <div className={styles.workspaceBar}>
            <div className={styles.workspaceIdentity}>
              <span className={styles.statusDot} />
              <span className={styles.workspaceName}>
                ZyrionOS Workspace
              </span>
            </div>

            <div className={styles.workspaceMeta}>
              <span>Cloud</span>
              <span className={styles.separator}>•</span>
              <span>AI Infrastructure</span>
              <span className={styles.separator}>•</span>
              <span>Operational</span>
            </div>
          </div>

          {/* Main Content */}
          <main
            id="main-content"
            className={styles.content}
            tabIndex="-1"
          >
            <div className={styles.contentInner}>
              {children}
            </div>
          </main>

        </section>
      </div>
    </div>
  );
}

export default DashboardLayout;
