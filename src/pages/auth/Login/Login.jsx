import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";
import styles from "./Login.module.css";

import {
  login,
  saveAuth,
  loginWithGoogle,
  loginWithGithub,
} from "../../../services/authService";

import { useAuth } from "../../../context/AuthContext";
import { APP_NAME } from "../../../config/constants";

/* =========================================================
   ICON SYSTEM
========================================================= */

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ariaHidden: true,
    focusable: "false",
  };

  switch (name) {
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "eyeOff":
      return (
        <svg {...common}>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17.7 17.7 0 0 1-3.1 3.9" />
          <path d="M6.6 6.6C4.1 8.3 2.5 12 2.5 12s3.5 7 9.5 7c1.1 0 2.1-.2 3-.5" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 20 6v5c0 5.2-3.3 8.6-8 10-4.7-1.4-8-4.8-8-10V6l8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "layers":
      return (
        <svg {...common}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 16 9 5 9-5" />
        </svg>
      );

    case "cloud":
      return (
        <svg {...common}>
          <path d="M17.5 19H8a5 5 0 1 1 1.1-9.88A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8Z" />
        </svg>
      );

    case "terminal":
      return (
        <svg {...common}>
          <path d="m5 7 4 5-4 5" />
          <path d="M12 17h7" />
        </svg>
      );

    case "google":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M21.35 12.27c0-.72-.06-1.25-.2-1.8H12v3.41h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.74-4.28 2.74-7.13Z"
          />
          <path
            fill="currentColor"
            d="M12 21.75c2.7 0 4.97-.89 6.61-2.35l-3.22-2.5c-.9.61-2.05.98-3.39.98-2.61 0-4.82-1.76-5.61-4.13H3.06v2.58A9.99 9.99 0 0 0 12 21.75Z"
          />
          <path
            fill="currentColor"
            d="M6.39 13.75A6.01 6.01 0 0 1 6.08 12c0-.61.11-1.2.31-1.75V7.67H3.06A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.06 4.33l3.33-2.58Z"
          />
          <path
            fill="currentColor"
            d="M12 6.12c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.96 3.18 14.7 2.25 12 2.25a9.99 9.99 0 0 0-8.94 5.42l3.33 2.58C7.18 7.88 9.39 6.12 12 6.12Z"
          />
        </svg>
      );

    case "github":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
        </svg>
      );

    default:
      return null;
  }
}


/* =========================================================
   LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();

  const {
    setUser,
    setAuthenticated,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [oauthLoading, setOauthLoading] =
    useState("");

  const [error, setError] =
    useState("");


  /* =======================================================
     EMAIL LOGIN
  ======================================================= */

  async function handleLogin(event) {
    event.preventDefault();

    if (loading || oauthLoading) return;

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await login(
        cleanEmail,
        password
      );

      /*
       * Existing auth service contract:
       * saveAuth(user, token)
       *
       * The token must not be persisted
       * by the frontend. Backend authentication
       * remains the source of truth.
       */
      saveAuth(
        response?.user,
        response?.token
      );

      if (!response?.user) {
        throw new Error(
          "Authentication succeeded, but the account could not be loaded."
        );
      }

      setUser(response.user);
      setAuthenticated(true);

      navigate(
        "/dashboard",
        { replace: true }
      );

    } catch (loginError) {
      setError(
        loginError?.response?.data?.message ||
        loginError?.message ||
        "Unable to sign in. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  }


  /* =======================================================
     GOOGLE
  ======================================================= */

  function handleGoogleLogin() {
    if (loading || oauthLoading) return;

    setError("");
    setOauthLoading("google");

    loginWithGoogle();
  }


  /* =======================================================
     GITHUB
  ======================================================= */

  function handleGithubLogin() {
    if (loading || oauthLoading) return;

    setError("");
    setOauthLoading("github");

    loginWithGithub();
  }


  return (
    <AuthLayout>

      <main className={styles.page}>

        {/* =================================================
            3D BACKGROUND
        ================================================= */}

        <div
          className={styles.background}
          aria-hidden="true"
        >

          <div className={styles.grid} />

          <div className={styles.glowPrimary} />
          <div className={styles.glowSecondary} />

          <div className={styles.orbit orbitOne}>
            <span className={styles.orbitNode} />
          </div>

          <div className={styles.orbit orbitTwo}>
            <span className={styles.orbitNode} />
          </div>

          <div className={styles.orbit orbitThree}>
            <span className={styles.orbitNode} />
          </div>

          <div className={styles.depthRing ringOne} />
          <div className={styles.depthRing ringTwo} />

          <div className={styles.backgroundNoise} />

        </div>


        {/* =================================================
            TOP NAV
        ================================================= */}

        <header className={styles.topbar}>

          <Link
            to="/"
            className={styles.brand}
            aria-label={`${APP_NAME} home`}
          >

            <span className={styles.brandMark}>
              <span />
              <span />
              <span />
              <span />
            </span>

            <span className={styles.brandText}>

              <strong>
                {APP_NAME}
              </strong>

              <small>
                AI Cloud Operating System
              </small>

            </span>

          </Link>


          <div className={styles.topbarRight}>

            <span className={styles.secureBadge}>

              <Icon
                name="shield"
                size={13}
              />

              Secure workspace

            </span>

          </div>

        </header>


        {/* =================================================
            MAIN AUTH FRAME
        ================================================= */}

        <section
          className={styles.authFrame}
          aria-label="ZyrionOS authentication"
        >

          {/* =================================================
              PRODUCT SIDE
          ================================================= */}

          <aside className={styles.productPanel}>

            <div className={styles.productInner}>

              <div className={styles.productEyebrow}>

                <span className={styles.liveDot} />

                THE ZYRIONOS PLATFORM

              </div>


              <h1 className={styles.heroTitle}>

                Build software.
                <br />

                <span>
                  Operate it with AI.
                </span>

              </h1>


              <p className={styles.heroDescription}>

                ZyrionOS brings application building,
                AI assistance, cloud deployment and
                project operations into one intelligent
                workspace.

              </p>


              {/* =================================================
                  CAPABILITY CARDS
              ================================================= */}

              <div className={styles.capabilityGrid}>

                <article className={styles.capabilityCard}>

                  <span className={styles.capabilityIcon}>
                    <Icon
                      name="spark"
                      size={17}
                    />
                  </span>

                  <div>
                    <strong>
                      Build with AI
                    </strong>

                    <span>
                      Turn goals into working software.
                    </span>
                  </div>

                </article>


                <article className={styles.capabilityCard}>

                  <span className={styles.capabilityIcon}>
                    <Icon
                      name="cloud"
                      size={17}
                    />
                  </span>

                  <div>
                    <strong>
                      Deploy to Cloud
                    </strong>

                    <span>
                      Move projects from workspace to deployment.
                    </span>
                  </div>

                </article>


                <article className={styles.capabilityCard}>

                  <span className={styles.capabilityIcon}>
                    <Icon
                      name="layers"
                      size={17}
                    />
                  </span>

                  <div>
                    <strong>
                      One Project Workspace
                    </strong>

                    <span>
                      Keep code, configuration and operations together.
                    </span>
                  </div>

                </article>


                <article className={styles.capabilityCard}>

                  <span className={styles.capabilityIcon}>
                    <Icon
                      name="terminal"
                      size={17}
                    />
                  </span>

                  <div>
                    <strong>
                      Operate & Iterate
                    </strong>

                    <span>
                      Build, improve and ship from one place.
                    </span>
                  </div>

                </article>

              </div>


              {/* =================================================
                  PRODUCT PRINCIPLE
              ================================================= */}

              <div className={styles.productPrinciple}>

                <div className={styles.principleIcon}>
                  <Icon
                    name="spark"
                    size={15}
                  />
                </div>

                <div>

                  <span>
                    THE CORE IDEA
                  </span>

                  <p>
                    Give ZyrionOS the outcome.
                    Work happens inside the workspace.
                  </p>

                </div>

              </div>

            </div>


            <div className={styles.productFooter}>

              <span>
                {APP_NAME}
              </span>

              <span className={styles.footerSeparator}>
                /
              </span>

              <span>
                Build · Deploy · Operate
              </span>

            </div>

          </aside>


          {/* =================================================
              LOGIN SIDE
          ================================================= */}

          <section className={styles.loginPanel}>

            <div className={styles.loginContainer}>

              {/* =================================================
                  LOGIN INTRO
              ================================================= */}

              <div className={styles.loginHeader}>

                <div className={styles.mobileProductMark}>

                  <Icon
                    name="spark"
                    size={17}
                  />

                </div>


                <div>

                  <span className={styles.eyebrow}>
                    WELCOME BACK
                  </span>

                  <h2 className={styles.title}>
                    Sign in to {APP_NAME}
                  </h2>

                  <p className={styles.subtitle}>
                    Continue to your workspace and projects.
                  </p>

                </div>

              </div>


              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (

                <div
                  className={styles.error}
                  role="alert"
                >

                  <span className={styles.errorIcon}>
                    !
                  </span>

                  <span>
                    {error}
                  </span>

                </div>

              )}


              {/* =================================================
                  LOGIN FORM
              ================================================= */}

              <form
                className={styles.form}
                onSubmit={handleLogin}
                noValidate
              >

                {/* EMAIL */}

                <div className={styles.field}>

                  <label
                    htmlFor="login-email"
                    className={styles.label}
                  >
                    Email address
                  </label>

                  <div className={styles.inputShell}>

                    <span className={styles.inputIcon}>
                      <Icon
                        name="mail"
                        size={17}
                      />
                    </span>

                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      className={styles.input}
                      disabled={
                        loading ||
                        Boolean(oauthLoading)
                      }
                      aria-invalid={Boolean(error)}
                    />

                  </div>

                </div>


                {/* PASSWORD */}

                <div className={styles.field}>

                  <div className={styles.labelRow}>

                    <label
                      htmlFor="login-password"
                      className={styles.label}
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className={styles.forgotLink}
                    >
                      Forgot password?
                    </Link>

                  </div>


                  <div className={styles.inputShell}>

                    <span className={styles.inputIcon}>
                      <Icon
                        name="lock"
                        size={17}
                      />
                    </span>

                    <input
                      id="login-password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      className={styles.input}
                      disabled={
                        loading ||
                        Boolean(oauthLoading)
                      }
                    />

                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      aria-pressed={showPassword}
                      disabled={
                        loading ||
                        Boolean(oauthLoading)
                      }
                    >
                      <Icon
                        name={
                          showPassword
                            ? "eyeOff"
                            : "eye"
                        }
                        size={17}
                      />
                    </button>

                  </div>

                </div>


                {/* REMEMBER */}

                <label className={styles.remember}>

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                    disabled={
                      loading ||
                      Boolean(oauthLoading)
                    }
                  />

                  <span className={styles.checkbox}>
                    <Icon
                      name="check"
                      size={11}
                    />
                  </span>

                  <span>
                    Keep me signed in
                  </span>

                </label>


                {/* SUBMIT */}

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={
                    loading ||
                    Boolean(oauthLoading)
                  }
                >

                  {loading ? (
                    <>
                      <span
                        className={styles.spinner}
                        aria-hidden="true"
                      />

                      Signing in...
                    </>
                  ) : (
                    <>
                      <span>
                        Sign in
                      </span>

                      <Icon
                        name="arrow"
                        size={17}
                      />
                    </>
                  )}

                </button>

              </form>


              {/* =================================================
                  OAUTH DIVIDER
              ================================================= */}

              <div className={styles.divider}>

                <span />

                <span>
                  OR CONTINUE WITH
                </span>

                <span />

              </div>


              {/* =================================================
                  OAUTH
              ================================================= */}

              <div className={styles.oauthGrid}>

                <button
                  type="button"
                  className={styles.oauthButton}
                  onClick={handleGoogleLogin}
                  disabled={
                    loading ||
                    Boolean(oauthLoading)
                  }
                >

                  {oauthLoading === "google" ? (
                    <span className={styles.oauthSpinner} />
                  ) : (
                    <Icon
                      name="google"
                      size={18}
                    />
                  )}

                  <span>
                    Google
                  </span>

                </button>


                <button
                  type="button"
                  className={styles.oauthButton}
                  onClick={handleGithubLogin}
                  disabled={
                    loading ||
                    Boolean(oauthLoading)
                  }
                >

                  {oauthLoading === "github" ? (
                    <span className={styles.oauthSpinner} />
                  ) : (
                    <Icon
                      name="github"
                      size={18}
                    />
                  )}

                  <span>
                    GitHub
                  </span>

                </button>

              </div>


              {/* =================================================
                  REGISTER
              ================================================= */}

              <div className={styles.registerPrompt}>

                <span>
                  Don't have a {APP_NAME} account?
                </span>

                <Link
                  to="/register"
                  className={styles.registerLink}
                >

                  <span>
                    Create an account
                  </span>

                  <Icon
                    name="arrow"
                    size={14}
                  />

                </Link>

              </div>


              {/* =================================================
                  SECURITY
              ================================================= */}

              <div className={styles.securityNotice}>

                <span className={styles.securityIcon}>

                  <Icon
                    name="shield"
                    size={13}
                  />

                </span>

                <span>
                  Authentication is handled through
                  the ZyrionOS backend.
                </span>

              </div>

            </div>

          </section>

        </section>


        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className={styles.pageFooter}>

          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>

          <span className={styles.footerLinks}>

            <Link to="/privacy">
              Privacy
            </Link>

            <Link to="/terms">
              Terms
            </Link>

          </span>

        </footer>

      </main>

    </AuthLayout>
  );
}

export default Login;
