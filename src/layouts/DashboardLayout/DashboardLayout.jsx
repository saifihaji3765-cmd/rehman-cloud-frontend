import styles from "./DashboardLayout.module.css";

import Sidebar from "../../components/Sidebar/Sidebar.jsx";
import Topbar from "../../components/Topbar/Topbar.jsx";

function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>

      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>

      <div className={styles.mainArea}>

        <Topbar />

        <main className={styles.content}>
          {children}
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;
