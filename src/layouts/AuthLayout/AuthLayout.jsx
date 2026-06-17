import styles from "./AuthLayout.module.css";

function AuthLayout({ children }) {
  return (
    <div className={styles.layout}>

      {/* LEFT PANEL */}

      <div className={styles.leftPanel}>

        <div className={styles.brand}>

          <h1 className={styles.brandTitle}>
            Build AI Products Faster
          </h1>

          <p className={styles.brandDescription}>
            Create SaaS applications, AI agents,
            cloud deployments and enterprise systems
            from a single platform.
          </p>

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className={styles.rightPanel}>

        <div className={styles.authCard}>

          {children}

        </div>

      </div>

    </div>
  );
}

export default AuthLayout;
