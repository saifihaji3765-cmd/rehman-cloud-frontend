import styles from "./Topbar.module.css";

import {

  APP_NAME

} from "../../config/constants";

import {

  useAuth

} from "../../context/AuthContext";

function Topbar() {

  const {

    user

  } = useAuth();

  const initials =

    user?.name

      ? user.name
          .charAt(0)
          .toUpperCase()

      : APP_NAME
          .charAt(0)
          .toUpperCase();

  return (

    <header className={styles.topbar}>

      {/* LEFT */}

      <div className={styles.left}>

        <div
          className={styles.workspaceSwitcher}
        >

          {APP_NAME} Workspace

        </div>

        <input
          className={styles.searchBox}
          placeholder="Search projects, deployments, files..."
        />

      </div>

      {/* RIGHT */}

      <div className={styles.right}>

        <div
          className={styles.systemStatus}
        >

          <div
            className={styles.statusDot}
          />

          All Systems Operational

        </div>

        <div
          className={styles.creditBadge}
        >

          {user?.credits ??

            "AI Credits"}

        </div>

        <button
          className={styles.actionButton}
        >
          Notifications
        </button>

        <div
          className={styles.profileInfo}
        >

          <div
            className={styles.profile}
          >

            {initials}

          </div>

          <div
            className={styles.profileName}
          >

            {user?.name ||

              "Account"}

          </div>

        </div>

      </div>

    </header>

  );

}

export default Topbar;
