import { useState } from "react";
import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Topbar from "../../components/Topbar/Topbar.jsx";

/*
|--------------------------------------------------------------------------

DASHBOARD APPLICATION SHELL

|
| Responsibilities
| - Global application shell
| - Sidebar placement and width coordination
| - Topbar placement
| - Workspace context placement
| - Main content scrolling
| - Responsive layout
| - Accessibility foundation
|
| Existing authentication, routing, API calls and business logic

remain outside this component.
*/

function DashboardLayout({ children }) {
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

return (
<div
className={styles.layout}
data-sidebar-collapsed={
sidebarCollapsed ? "true" : "false"
}
>
{/* Accessibility: skip navigation */}

  <a
    href="#main-content"
    className={styles.skipLink}
  >
    Skip to main content
  </a>

  {/* Application shell */}

  <div className={styles.appShell}>

    {/* Primary navigation */}

    <div
      className={styles.sidebarSlot}
      aria-label="ZyrionOS navigation region"
    >
      <Sidebar
        onCollapsedChange={setSidebarCollapsed}
      />
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

      {/* Main content */}

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
