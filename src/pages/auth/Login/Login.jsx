import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";
import styles from "./Login.module.css";

function Login() {
  return (
    <AuthLayout>

      <div className={styles.container}>

        {/* HEADER */}

        <div className={styles.header}>

          <h1 className={styles.title}>
            Welcome Back
          </h1>

          <p className={styles.subtitle}>
            Sign in to access your cloud workspace,
            AI agents, deployments and enterprise tools.
          </p>

        </div>

        {/* FORM */}

        <form className={styles.form}>

          <div className={styles.field}>

            <label className={styles.label}>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className={styles.input}
            />

          </div>

          <div className={styles.field}>

            <label className={styles.label}>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className={styles.input}
            />

          </div>

          <button
            type="submit"
            className={styles.button}
          >
            Sign In
          </button>

        </form>

        {/* FOOTER */}

        <div className={styles.footer}>

          Don't have an account?

          <span className={styles.link}>
            Create Account
          </span>

        </div>

      </div>

    </AuthLayout>
  );
}

export default Login;
