import { Link } from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";

import styles from "./Register.module.css";

function Register() {
  return (
    <AuthLayout>

      <div className={styles.container}>

        {/* LEFT */}

        <div className={styles.left}>

          <div className={styles.brand}>
            ZyrionOS
          </div>

          <h1 className={styles.heading}>
            Create Your AI Cloud Workspace
          </h1>

          <p className={styles.description}>
            Join ZyrionOS and build SaaS products,
            AI applications, automation systems and
            cloud infrastructure from a single prompt.
          </p>

        </div>

        {/* RIGHT */}

        <div className={styles.card}>

          <h2 className={styles.title}>
            Create Account
          </h2>

          <p className={styles.subtitle}>
            Start building with ZyrionOS
          </p>

          <input
            type="text"
            placeholder="Full Name"
            className={styles.input}
          />

          <input
            type="email"
            placeholder="Email Address"
            className={styles.input}
          />

          <div className={styles.passwordWrapper}>

            <input
              type="password"
              placeholder="Password"
              className={styles.input}
            />

            <button
              type="button"
              className={styles.eyeButton}
            >
              👁
            </button>

          </div>

          <div className={styles.passwordWrapper}>

            <input
              type="password"
              placeholder="Confirm Password"
              className={styles.input}
            />

            <button
              type="button"
              className={styles.eyeButton}
            >
              👁
            </button>

          </div>

          <label className={styles.checkboxLabel}>

            <input type="checkbox" />

            I agree to the Terms and Privacy Policy

          </label>

          <button
            className={styles.primaryButton}
          >
            Create Account
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

            <span>
              Already have an account?
            </span>

            <Link
              to="/login"
              className={styles.link}
            >
              Sign In
            </Link>

          </div>

        </div>

      </div>

    </AuthLayout>
  );
}

export default Register;
