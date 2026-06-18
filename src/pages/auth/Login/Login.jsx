import { Link } from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";

import styles from "./Login.module.css";

function Login() {
  return (
    <AuthLayout>

      <div className={styles.container}>

        {/* LEFT SIDE */}

        <div className={styles.left}>

          <div className={styles.brand}>
            ZyrionOS
          </div>

          <h1 className={styles.heading}>
            Build, Deploy & Scale
            Software With AI
          </h1>

          <p className={styles.description}>
            Create SaaS platforms, AI products,
            cloud applications and business
            systems from a single prompt.
          </p>

        </div>

        {/* RIGHT SIDE */}

        <div className={styles.card}>

          <h2 className={styles.title}>
            Sign In
          </h2>

          <p className={styles.subtitle}>
            Access your workspace
          </p>

          <input
            type="email"
            placeholder="Email Address"
            className={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            className={styles.input}
          />

          <button
            className={styles.primaryButton}
          >
            Sign In
          </button>

          <div className={styles.divider}>
            OR
          </div>

          <button
            className={styles.oauthButton}
          >
            Continue with Google
          </button>

          <button
            className={styles.oauthButton}
          >
            Continue with GitHub
          </button>

          <div className={styles.footer}>

            <Link
              to="/register"
              className={styles.link}
            >
              Create Account
            </Link>

            <Link
              to="/forgot-password"
              className={styles.link}
            >
              Forgot Password
            </Link>

          </div>

        </div>

      </div>

    </AuthLayout>
  );
}

export default Login;
