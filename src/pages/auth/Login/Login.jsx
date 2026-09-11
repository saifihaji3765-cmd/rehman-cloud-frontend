import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";
import styles from "./Login.module.css";

import {
  loginUser,
  loginWithGoogle,
  loginWithGitHub,
  saveAuth,
} from "../../../services/authService";

import { useAuth } from "../../../context/AuthContext";
import { APP_NAME } from "../../../config/constants";

/* =========================================================
   ICONS
========================================================= */

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
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

    case "cloud":
      return (
        <svg {...common}>
          <path d="M17.5 19H8a5 5 0 1 1 1.1-9.88A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8Z" />
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

    case "network":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2.2" />
          <circle cx="5" cy="18" r="2.2" />
          <circle cx="19" cy="18" r="2.2" />
          <path d="M10.8 6.9 6.2 16" />
          <path d="M13.2 6.9 17.8 16" />
          <path d="M7.3 18h9.4" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
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
   LOGIN PAGE
========================================================= */

function Login() {
  const navigate = useNavigate();

  const { setUser, setAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [error, setError] = useState("");

  /* =======================================================
     EMAIL / PASSWORD LOGIN
  ======================================================= */

  async function handleLogin(event) {
    event.preventDefault();

    if (loading || oauthLoading) {
      return;
    }

    setError("");

    const cleanEmail = email.trim().toLowerCase();

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

      const response = await loginUser({
        email: cleanEmail,
        password,
      });

      const data = response?.data ?? response;

      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to sign in."
        );
      }

      if (!data?.user) {
        throw new Error(
          "Authentication succeeded, but your account could not be loaded."
        );
      }

      /*
       * The backend HttpOnly cookie is the real
       * authentication mechanism.
       *
       * The token is NOT persisted by this frontend.
       */
      saveAuth(data.user, data.token);

      setUser(data.user);
      setAuthenticated(true);

      navigate("/dashboard", {
        replace: true,
      });
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
    if (loading || oauthLoading) {
      return;
    }

    setError("");
    setOauthLoading("google");

    loginWithGoogle();
  }

  /* =======================================================
     GITHUB
  ======================================================= */

  function handleGitHubLogin() {
    if (loading || oauthLoading) {
      return;
    }

    setError("");
    setOauthLoading("github");

    loginWithGitHub();
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AuthLayout>
      <main className={styles.page}>
        {/* =================================================
            FULL PAGE 3D EARTH
        ================================================= */}

        <div
          className={styles.earthScene}
          aria-hidden="true"
        >
          <div className={styles.earthGlow} />

          <div
            className={styles.earthOrbit}
            aria-hidden="true"
          >
            <span className={styles.orbitOne} />
          </div>

          <div
            className={styles.earthOrbit}
            aria-hidden="true"
          >
            <span className={styles.orbitTwo} />
          </div>

          <div
            className={styles.earthOrbit}
            aria-hidden="true"
          >
            <span className={styles.orbitThree} />
          </div>

          <div className={styles.earth}>
            <div className={styles.earthSurface} />
            <div className={styles.latitudeGrid} />
            <div className={styles.longitudeGrid} />
            <div className={styles.earthHighlight} />
            <div className={styles.earthShadow} />
          </div>

          <div className={styles.earthAtmosphere} />
        </div>

        {/* =================================================
            BACKGROUND
        ================================================= */}

        <div
          className={styles.background}
          aria-hidden="true"
        >
          <div className={styles.backgroundGrid} />
          <div className={styles.backgroundNoise} />
          <div className={styles.backgroundGlowOne} />
          <div className={styles.backgroundGlowTwo} />
        </div>

        {/* =================================================
            TOP BAR
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
              <strong>{APP_NAME}</strong>

              <small>
                AI Cloud Operating System
              </small>
            </span>
          </Link>

          <div className={styles.topbarRight}>
            <div className={styles.secureBadge}>
              <Icon
                name="shield"
                size={13}
              />

              <span>
                Secure workspace
              </span>
            </div>

            {/* =============================================
                SHORT TOP SIGN-UP BUTTON
            ============================================= */}

            <Link
              to="/register"
              className={styles.signupButton}
            >
              Sign up
            </Link>
          </div>
        </header>

        {/* =================================================
            AUTH FRAME
        ================================================= */}

        <section className={styles.authFrame}>
          {/* =================================================
              PRODUCT PANEL
          ================================================= */}

          <section className={styles.productPanel}>
            <div className={styles.productContent}>
              <div className={styles.productEyebrow}>
                <span className={styles.liveDot} />

                THE {APP_NAME.toUpperCase()} PLATFORM
              </div>

              <h1 className={styles.heroTitle}>
                Build software.
                <br />

                <span>
                  Operate it with AI.
                </span>
              </h1>

              <p className={styles.heroDescription}>
                {APP_NAME} brings AI-assisted
                application building, cloud
                deployment, project operations
                and intelligent workflows into
                one workspace.
              </p>

              {/* =========================================
                  CAPABILITIES
              ========================================= */}

              <div className={styles.capabilityGrid}>
                <article
                  className={styles.capabilityCard}
                >
                  <span
                    className={
                      styles.capabilityIcon
                    }
                  >
                    <Icon
                      name="spark"
                      size={16}
                    />
                  </span>

                  <div>
                    <strong>
                      Build with AI
                    </strong>

                    <span>
                      Turn ideas and outcomes into
                      working software.
                    </span>
                  </div>
                </article>

                <article
                  className={styles.capabilityCard}
                >
                  <span
                    className={
                      styles.capabilityIcon
                    }
                  >
                    <Icon
                      name="cloud"
                      size={16}
                    />
                  </span>

                  <div>
                    <strong>
                      Deploy to Cloud
                    </strong>

                    <span>
                      Move validated projects toward
                      real deployment.
                    </span>
                  </div>
                </article>

                <article
                  className={styles.capabilityCard}
                >
                  <span
                    className={
                      styles.capabilityIcon
                    }
                  >
                    <Icon
                      name="layers"
                      size={16}
                    />
                  </span>

                  <div>
                    <strong>
                      Unified Workspace
                    </strong>

                    <span>
                      Projects, code and operations
                      stay together.
                    </span>
                  </div>
                </article>

                <article
                  className={styles.capabilityCard}
                >
                  <span
                    className={
                      styles.capabilityIcon
                    }
                  >
                    <Icon
                      name="network"
                      size={16}
                    />
                  </span>

                  <div>
                    <strong>
                      Operate & Iterate
                    </strong>

                    <span>
                      Improve, test and ship from
                      one environment.
                    </span>
                  </div>
                </article>
              </div>

              {/* =========================================
                  CORE PRINCIPLE
              ========================================= */}

              <div
                className={
                  styles.productPrinciple
                }
              >
                <span
                  className={
                    styles.principleIcon
                  }
                >
                  <Icon
                    name="spark"
                    size={14}
                  />
                </span>

                <div>
                  <small>
                    THE CORE IDEA
                  </small>

                  <p>
                    Give {APP_NAME} the outcome.
                    <br />
                    Work happens inside the
                    workspace.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              LOGIN PANEL
          ================================================= */}

          <section className={styles.loginPanel}>
            <div className={styles.loginContainer}>
              {/* =============================================
                  LOGIN HEADER
              ============================================= */}

              <div className={styles.loginHeader}>
                <span
                  className={
                    styles.mobileIcon
                  }
                >
                  <Icon
                    name="spark"
                    size={16}
                  />
                </span>

                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    WELCOME BACK
                  </span>

                  <h2>
                    Sign in to {APP_NAME}
                  </h2>

                  <p>
                    Continue to your workspace,
                    projects and AI tools.
                  </p>
                </div>
              </div>

              {/* =============================================
                  ERROR
              ============================================= */}

              {error && (
                <div
                  className={styles.error}
                  role="alert"
                >
                  <span>!</span>

                  <p>{error}</p>
                </div>
              )}

              {/* =============================================
                  LOGIN FORM
              ============================================= */}

              <form
                className={styles.form}
                onSubmit={handleLogin}
              >
                {/* EMAIL */}

                <div className={styles.field}>
                  <label htmlFor="login-email">
                    Email address
                  </label>

                  <div
                    className={
                      styles.inputShell
                    }
                  >
                    <span
                      className={
                        styles.inputIcon
                      }
                    >
                      <Icon
                        name="mail"
                        size={16}
                      />
                    </span>

                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      disabled={
                        loading ||
                        Boolean(
                          oauthLoading
                        )
                      }
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div className={styles.field}>
                  <div
                    className={
                      styles.labelRow
                    }
                  >
                    <label htmlFor="login-password">
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className={styles.forgot}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div
                    className={
                      styles.inputShell
                    }
                  >
                    <span
                      className={
                        styles.inputIcon
                      }
                    >
                      <Icon
                        name="lock"
                        size={16}
                      />
                    </span>

                    <input
                      id="login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      disabled={
                        loading ||
                        Boolean(
                          oauthLoading
                        )
                      }
                    />

                    <button
                      type="button"
                      className={
                        styles.passwordButton
                      }
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                      disabled={
                        loading ||
                        Boolean(
                          oauthLoading
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      <Icon
                        name={
                          showPassword
                            ? "eyeOff"
                            : "eye"
                        }
                        size={16}
                      />
                    </button>
                  </div>
                </div>

                {/* REMEMBER */}

                <label
                  className={
                    styles.remember
                  }
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target
                          .checked
                      )
                    }
                  />

                  <span>
                    <Icon
                      name="check"
                      size={10}
                    />
                  </span>

                  Keep me signed in
                </label>

                {/* SIGN IN */}

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                  disabled={
                    loading ||
                    Boolean(oauthLoading)
                  }
                >
                  {loading ? (
                    <>
                      <span
                        className={
                          styles.spinner
                        }
                      />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in

                      <Icon
                        name="arrow"
                        size={16}
                      />
                    </>
                  )}
                </button>
              </form>

              {/* =============================================
                  DIVIDER
              ============================================= */}

              <div
                className={
                  styles.divider
                }
              >
                <span />

                <small>
                  OR CONTINUE WITH
                </small>

                <span />
              </div>

              {/* =============================================
                  OAUTH
              ============================================= */}

              <div
                className={
                  styles.oauthGrid
                }
              >
                <button
                  type="button"
                  className={
                    styles.oauthButton
                  }
                  onClick={
                    handleGoogleLogin
                  }
                  disabled={
                    loading ||
                    Boolean(
                      oauthLoading
                    )
                  }
                >
                  {oauthLoading ===
                  "google" ? (
                    <span
                      className={
                        styles.spinner
                      }
                    />
                  ) : (
                    <Icon
                      name="google"
                      size={17}
                    />
                  )}

                  Google
                </button>

                <button
                  type="button"
                  className={
                    styles.oauthButton
                  }
                  onClick={
                    handleGitHubLogin
                  }
                  disabled={
                    loading ||
                    Boolean(
                      oauthLoading
                    )
                  }
                >
                  {oauthLoading ===
                  "github" ? (
                    <span
                      className={
                        styles.spinner
                      }
                    />
                  ) : (
                    <Icon
                      name="github"
                      size={17}
                    />
                  )}

                  GitHub
                </button>
              </div>

              {/* =============================================
                  REGISTER PROMPT
              ============================================= */}

              <div
                className={
                  styles.registerPrompt
                }
              >
                <span>
                  Don't have a {APP_NAME}{" "}
                  account?
                </span>

                <Link to="/register">
                  Create an account

                  <Icon
                    name="arrow"
                    size={13}
                  />
                </Link>
              </div>

              {/* =============================================
                  SECURITY
              ============================================= */}

              <div
                className={
                  styles.securityNotice
                }
              >
                <Icon
                  name="shield"
                  size={12}
                />

                <span>
                  Authentication is handled
                  securely by the {APP_NAME}{" "}
                  backend.
                </span>
              </div>
            </div>
          </section>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer
          className={styles.pageFooter}
        >
          <span>
            © {new Date().getFullYear()}{" "}
            {APP_NAME}
          </span>

          <span>
            Privacy&nbsp;&nbsp; · &nbsp;&nbsp;
            Terms
          </span>
        </footer>
      </main>
    </AuthLayout>
  );
}

export default Login;
