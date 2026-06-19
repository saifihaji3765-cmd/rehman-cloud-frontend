import { NavLink } from "react-router-dom";

import styles from "./Sidebar.module.css";

import navigation from "../../config/navigation";

import {

  APP_NAME,

  APP_TAGLINE

} from "../../config/constants";

function Sidebar() {

  return (

    <aside className={styles.sidebar}>

      {/* BRAND */}

      <div className={styles.brand}>

        <div className={styles.logo}>
          {APP_NAME}
        </div>

        <div className={styles.tagline}>
          {APP_TAGLINE}
        </div>

      </div>

      {/* MENU */}

      <div className={styles.menu}>

        {navigation.map((item)=>(

          <NavLink

            key={item.id}

            to={item.path}

            className={({ isActive }) =>

              isActive

                ? `${styles.link} ${styles.active}`

                : styles.link

            }

          >

            {item.label}

          </NavLink>

        ))}

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
