
import styles from "./AuthLayout.module.css";

function AuthLayout({ children }) {
  return (
    <div className={styles.layout}>
      {children}
    </div>
  );
}

export default AuthLayout;
