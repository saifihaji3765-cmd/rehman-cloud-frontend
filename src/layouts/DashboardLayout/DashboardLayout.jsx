import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Topbar from "../../components/Topbar/Topbar.jsx";

function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <div className={styles.appShell}>
        <div
          className={styles.sidebarSlot}
          aria-label="ZyrionOS navigation region"
        >
          <Sidebar />
        </div>

        <div className={styles.mainArea}>
          <header
            className={styles.topbar}
            aria-label="ZyrionOS application header"
          >
            <Topbar />
          </header>

          <div
            className={styles.workspaceBar}
            aria-label="Current workspace context"
          >
            <div className={styles.workspaceIdentity}>
              <span
                className={styles.statusDot}
                aria-hidden="true"
              />
              <span className={styles.workspaceName}>
                ZyrionOS Workspace
              </span>
            </div>

            <div
              className={styles.workspaceMeta}
              aria-hidden="true"
            >
              <span>Cloud</span>
              <span className={styles.separator}>/</span>
              <span>AI Infrastructure</span>
              <span className={styles.separator}>/</span>
              <span>Operational</span>
            </div>
          </div>

          <main
            id="main-content"
            className={styles.content}
            tabIndex={-1}
          >
            <div className={styles.contentInner}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
