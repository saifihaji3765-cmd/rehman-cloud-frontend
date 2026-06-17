import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";
import styles from "./Register.module.css";

function Register() {
  return (
    <AuthLayout>

      <div className={styles.container}>

        {/* HEADER */}

        <div className={styles.header}>

          <h1 className={styles.title}>
            Create Account
          </h1>

          <p className={styles.subtitle}>
            Create your workspace and start building
            AI products, SaaS applications and cloud systems.
          </p>

        </div>

        {/* FORM */}

        <form className={styles.form}>

          <div className={styles.field}>

            <label className={styles.label}>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              className={styles.input}
            />

          </div>

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
              placeholder="Create a password"
              className={styles.input}
            />

          </div>

          <div className={styles.field}>

            <label className={styles.label}>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              className={styles.input}
            />

          </div>

          <button
            type="submit"
            className={styles.button}
          >
            Create Account
          </button>

        </form>

        {/* FOOTER */}

        <div className={styles.footer}>

          Already have an account?

          <span className={styles.link}>
            Sign In
          </span>

        </div>

      </div>

    </AuthLayout>
  );
}

export default Register;
