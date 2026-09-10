import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Topbar from "../../components/Topbar/Topbar.jsx";

/*
|--------------------------------------------------------------------------
| DASHBOARD APPLICATION SHELL
|--------------------------------------------------------------------------
|
| Architecture
|
| DashboardLayout
|   ├── Skip Link
|   └── Application Shell
|        ├── Sidebar
|        └── Main Area
|             ├── Topbar
|             ├── Workspace Context
|             └── Main Content
|
| Responsibilities
| ----------------
| - Global application shell
| - Navigation placement
| - Topbar placement
| - Workspace context placement
| - Main content scrolling
| - Accessibility foundation
|
| This component does NOT own:
| - Authentication
| - Routing
| - API calls
| - Business logic
| - Page-specific UI
|
|--------------------------------------------------------------------------
*/

function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>
      {/* =====================================================
          ACCESSIBILITY — SKIP NAVIGATION
      ====================================================== */}

      <a
        href="#main-content"
        className={styles.skipLink}
      >
        Skip to main content
      </a>

      {/* =====================================================
          APPLICATION SHELL
      ====================================================== */}

      <div className={styles.appShell}>

        {/* ===================================================
            PRIMARY NAVIGATION
            Sidebar already provides its own <aside>.
            Do NOT wrap it inside another <aside>.
        ==================================================== */}

        <div
          className={styles.sidebarSlot}
          aria-label="ZyrionOS navigation region"
        >
          <Sidebar />
        </div>

        {/* ===================================================
            MAIN APPLICATION AREA
        ==================================================== */}

        <div className={styles.mainArea}>

          {/* =================================================
              GLOBAL APPLICATION HEADER
          ================================================== */}

          <header
            className={styles.topbar}
            aria-label="ZyrionOS application header"
          >
            <Topbar />
          </header>

          {/* =================================================
              WORKSPACE CONTEXT
              
              Presentation-only shell context.
              No backend state is fabricated here.
          ================================================== */}

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

              <span className={styles.separator}>
                /
              </span>

              <span>AI Infrastructure</span>

              <span className={styles.separator}>
                /
              </span>

              <span>Operational</span>
            </div>
          </div>

          {/* =================================================
              SCROLLABLE APPLICATION CONTENT
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

        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
