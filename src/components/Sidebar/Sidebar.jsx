import { NavLink } from "react-router-dom";

import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <aside className={styles.sidebar}>

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

    </aside>
  );
}

export default Sidebar;
