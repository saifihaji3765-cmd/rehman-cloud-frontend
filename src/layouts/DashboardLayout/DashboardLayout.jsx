import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Topbar from "../../components/Topbar/Topbar.jsx";

/*
|--------------------------------------------------------------------------
| ZYRIONOS — DASHBOARD APPLICATION SHELL
|--------------------------------------------------------------------------
|
| Responsibilities:
| - Application shell and layout
| - Sidebar and Topbar placement
| - Workspace context
| - Main content scrolling
| - Accessibility
| - Responsive shell structure
|
| Existing routing, navigation, authentication and API behavior
| remain owned by their existing components and services.
|
|--------------------------------------------------------------------------
*/

function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>
      {/* Accessibility: skip navigation */}

      <a
        href="#main-content"
        className={styles.skipLink}
      >
        Skip to main content
      </a>

      {/* Main application shell */}

      <div className={styles.appShell}>

        {/* Primary navigation */}

        <div
          className={styles.sidebarSlot}
          aria-label="ZyrionOS navigation region"
        >
          <Sidebar />
        </div>

        {/* Main application area */}

        <div className={styles.mainArea}>

          {/* Global application header */}

          <header
            className={styles.topbar}
            aria-label="ZyrionOS application header"
          >
            <Topbar />
          </header>

          {/* Workspace context */}

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

          {/* Scrollable page content */}

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
