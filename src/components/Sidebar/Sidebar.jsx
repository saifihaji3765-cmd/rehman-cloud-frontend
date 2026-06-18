import { NavLink } from "react-router-dom";

import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <aside className={styles.sidebar}>

      {/* BRAND */}

      <div className={styles.brand}>

        <div className={styles.logo}>
          ZyrionOS
        </div>

        <div className={styles.tagline}>
          AI Cloud Operating System
        </div>

      </div>

      {/* MENU */}

      <div className={styles.menu}>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/workspace"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          Workspace
        </NavLink>

        <NavLink
          to="/deployments"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          Deployments
        </NavLink>

        <NavLink
          to="/billing"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          Billing
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          Settings
        </NavLink>

      </div>

      {/* FOOTER */}

      <div className={styles.footer}>

        <div className={styles.planCard}>

          <div className={styles.planTitle}>
            Subscription
          </div>

          <div className={styles.planText}>
            Plan information will be
            loaded from backend.
          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
