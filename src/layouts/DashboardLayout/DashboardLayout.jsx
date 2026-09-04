import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Topbar from "../../components/Topbar/Topbar.jsx";

function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>
      {/* =====================================================
          ACCESSIBILITY
      ====================================================== */}

      <a
        href="#main-content"
        className={styles.skipLink}
      >
        Skip to main content
      </a>

      {/* =====================================================
          ENTERPRISE APPLICATION SHELL
      ====================================================== */}

      <div className={styles.appShell}>
        {/* ===================================================
            GLOBAL NAVIGATION
        ==================================================== */}

        <aside
          className={styles.sidebar}
          aria-label="ZyrionOS primary navigation"
        >
          <Sidebar />
        </aside>

        {/* ===================================================
            MAIN APPLICATION AREA
        ==================================================== */}

        <section className={styles.mainArea}>
          {/* =================================================
              GLOBAL TOPBAR
          ================================================== */}

          <header
            className={styles.topbar}
            aria-label="ZyrionOS application header"
          >
            <Topbar />
          </header>

          {/* =================================================
              WORKSPACE STATUS
          ================================================== */}

          <div
            className={styles.workspaceBar}
            role="status"
            aria-label="Workspace status"
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

            <div className={styles.workspaceMeta}>
              <span>Cloud</span>

              <span
                className={styles.separator}
                aria-hidden="true"
              >
                /
              </span>

              <span>AI Infrastructure</span>

              <span
                className={styles.separator}
                aria-hidden="true"
              >
                /
              </span>

              <span>Operational</span>
            </div>
          </div>

          {/* =================================================
              MAIN CONTENT
          ================================================== */}

          <main
            id="main-content"
            className={styles.content}
            tabIndex={-1}
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
