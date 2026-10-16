
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";
import styles from "./Register.module.css";
import {
  register,
  getCurrentUser,
  loginWithGoogle,
  loginWithGitHub,
  saveAuth,
} from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import { APP_NAME } from "../../../config/constants";

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
    focusable: "false",
  };

  const paths = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17.7 17.7 0 0 1-3.1 3.9" />
        <path d="M6.6 6.6C4.1 8.3 2.5 12 2.5 12s3.5 7 9.5 7c1.1 0 2.1-.2 3-.5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5.2-3.3 8.6-8 10-4.7-1.4-8-4.8-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    spark: (
      <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
    ),
    cloud: (
      <path d="M17.5 19H8a5 5 0 1 1 1.1-9.88A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8Z" />
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </>
    ),
    network: (
      <>
        <circle cx="12" cy="5" r="2.2" />
        <circle cx="5" cy="18" r="2.2" />
        <circle cx="19" cy="18" r="2.2" />
        <path d="M10.8 6.9 6.2 16M13.2 6.9 17.8 16M7.3 18h9.4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    userPlus: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.6-3.3 2.4-5 5.5-5s4.9 1.7 5.5 5M18 8v6M15 11h6" />
      </>
    ),
  };

  if (name === "google") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.25-.2-1.8H12v3.41h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.74-4.28 2.74-7.13Z" />
        <path fill="#34A853" d="M12 21.75c2.7 0 4.97-.89 6.61-2.35l-3.22-2.5c-.9.61-2.05.98-3.39.98-2.61 0-4.82-1.76-5.61-4.13H3.06v2.58A9.99 9.99 0 0 0 12 21.75Z" />
        <path fill="#FBBC05" d="M6.39 13.75A6.01 6.01 0 0 1 6.08 12c0-.61.11-1.2.31-1.75V7.67H3.06A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.06 4.33l3.33-2.58Z" />
        <path fill="#EA4335" d="M12 6.12c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.96 3.18 14.7 2.25 12 2.25a9.99 9.99 0 0 0-8.94 5.42l3.33 2.58C7.18 7.88 9.39 6.12 12 6.12Z" />
      </svg>
    );
  }

  if (name === "github") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
      </svg>
    );
  }

  return paths[name] ? <svg {...common}>{paths[name]}</svg> : null;
}

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function Register() {
  const navigate = useNavigate();
  const { setUser, setAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [error, setError] = useState("");

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;

  const strengthLabel = useMemo(() => {
    if (!password) return "";
    if (strengthScore <= 1) return "Weak";
    if (strengthScore <= 2) return "Fair";
    if (strengthScore === 3) return "Good";
    return "Strong";
  }, [password, strengthScore]);

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const busy = loading || Boolean(oauthLoading);

  function validateForm() {
    if (!name.trim()) {
      return "Please enter your full name.";
    }

    if (name.trim().length < 2) {
      return "Your name must contain at least 2 characters.";
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return "Please enter your email address.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "Please enter a valid email address.";
    }

    if (!password) {
      return "Please create a password.";
    }

    if (password.length < 8) {
      return "Your password must contain at least 8 characters.";
    }

    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (password !== confirmPassword) {
      return "Your passwords do not match.";
    }

    if (!acceptedTerms) {
      return "Please accept the Terms of Service and Privacy Policy.";
    }

    return "";
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (busy) return;

    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const responseData = response?.data ?? response;

      if (responseData?.success === false) {
        throw new Error(
          responseData?.message || "Unable to create your account."
        );
      }

      let user =
        responseData?.user ||
        responseData?.data?.user ||
        null;

      /*
       * Registration may create a session immediately, or the backend
       * may require the current-session endpoint to return the user.
       */
      if (!user) {
        try {
          const session = await getCurrentUser();
          const sessionData = session?.data ?? session;

          user =
            sessionData?.user ||
            sessionData?.data?.user ||
            null;
        } catch {
          user = null;
        }
      }

      if (!user) {
        /*
         * Do not mark the client as authenticated without a user profile.
         * Some backends require a separate sign-in after registration.
         */
        setError(
          "Your account may have been created, but we could not establish your session. Please sign in to continue."
        );
        return;
      }

      saveAuth(user);
      setUser(user);
      setAuthenticated(true);
      navigate("/dashboard", { replace: true });
    } catch (registrationError) {
      setError(
        registrationError?.response?.data?.message ||
          registrationError?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleRegister() {
    if (busy) return;
    setError("");
    setOauthLoading("google");
    loginWithGoogle();
  }

  function handleGitHubRegister() {
    if (busy) return;
    setError("");
    setOauthLoading("github");
    loginWithGitHub();
  }

  return (
    <AuthLayout>
      <main className={styles.page}>
        <div className={styles.ambient} aria-hidden="true" />

        <header className={styles.topbar}>
          <Link to="/" className={styles.brand} aria-label={`${APP_NAME} home`}>
            <BrandMark />
            <span className={styles.brandCopy}>
              <strong>{APP_NAME}</strong>
              <small>AI Cloud Operating System</small>
            </span>
          </Link>

          <div className={styles.topbarRight}>
            <span className={styles.secureBadge}>
              <Icon name="shield" size={15} />
              <span>Secure workspace</span>
            </span>
            <span className={styles.topbarPrompt}>Already have an account?</span>
            <Link to="/login" className={styles.topbarLink}>
              Sign in <Icon name="arrow" size={14} />
            </Link>
          </div>
        </header>

        <div className={styles.workspace}>
          <section
            className={styles.presentation}
            aria-labelledby="register-hero-title"
          >
            <div className={styles.presentationContent}>
              <div className={styles.overline}>
                <span className={styles.liveDot} />
                AI-POWERED DEVELOPMENT WORKSPACE
              </div>

              <h1 id="register-hero-title" className={styles.heroTitle}>
                Build smarter.
                <br />
                <span>Ship with clarity.</span>
              </h1>

              <p className={styles.heroDescription}>
                Bring AI-assisted development, code analysis and project
                operations together in one connected workspace — from your
                first idea to deployment.
              </p>

              <div className={styles.sectionHeading}>
                <span>YOUR DEVELOPMENT TOOLKIT</span>
                <span className={styles.sectionRule} />
              </div>

              <div className={styles.capabilities}>
                <article className={styles.capability}>
                  <span className={styles.capabilityIcon}>
                    <Icon name="spark" size={18} />
                  </span>
                  <div>
                    <h3>AI-assisted development</h3>
                    <p>Turn project requirements into code and files.</p>
                  </div>
                </article>

                <article className={styles.capability}>
                  <span className={styles.capabilityIcon}>
                    <Icon name="layers" size={18} />
                  </span>
                  <div>
                    <h3>Code intelligence</h3>
                    <p>Understand project structure and investigate issues.</p>
                  </div>
                </article>

                <article className={styles.capability}>
                  <span className={styles.capabilityIcon}>
                    <Icon name="network" size={18} />
                  </span>
                  <div>
                    <h3>Review and debugging</h3>
                    <p>Support code review and debugging workflows.</p>
                  </div>
                </article>

                <article className={styles.capability}>
                  <span className={styles.capabilityIcon}>
                    <Icon name="cloud" size={18} />
                  </span>
                  <div>
                    <h3>Build and deployment</h3>
                    <p>Keep deployments and project operations connected.</p>
                  </div>
                </article>
              </div>

              <section className={styles.workflow} aria-labelledby="workflow-title">
                <div className={styles.workflowHeader}>
                  <span className={styles.workflowIcon}>
                    <Icon name="layers" size={18} />
                  </span>
                  <div className={styles.workflowHeading}>
                    <span className={styles.sectionEyebrow}>A CONNECTED PROCESS</span>
                    <h2 id="workflow-title">From idea to deployment</h2>
                  </div>
                  <span className={styles.workflowLabel}>WORKFLOW</span>
                </div>

                <div className={styles.steps}>
                  {[
                    ["01", "Plan"],
                    ["02", "Build"],
                    ["03", "Review"],
                    ["04", "Deploy"],
                  ].map(([number, label]) => (
                    <div className={styles.step} key={number}>
                      <span className={styles.stepNumber}>{number}</span>
                      <span className={styles.stepName}>{label}</span>
                    </div>
                  ))}
                </div>

                <p className={styles.workflowNote}>
                  Keep your development process organized with connected
                  tools for building, reviewing and operating projects.
                </p>
              </section>

              <div className={styles.trustNote}>
                <span className={styles.trustIcon}>
                  <Icon name="shield" size={17} />
                </span>
                <div>
                  <strong>Built for focused development</strong>
                  <p>
                    A unified workspace for software development and project
                    operations.
                  </p>
                </div>
              </div>
            </div>

            <footer className={styles.presentationFooter}>
              <span>AI-assisted development</span>
              <span>Project operations</span>
              <span>Cloud workflows</span>
            </footer>
          </section>

          <section
            className={styles.formPanel}
            aria-labelledby="register-title"
          >
            <div className={styles.formCard}>
              <div className={styles.formTop}>
                <span className={styles.formIcon}>
                  <Icon name="userPlus" size={21} />
                </span>
                <span className={styles.stepPill}>
                  <span className={styles.stepPillDot} />
                  FREE ACCOUNT SETUP
                </span>
              </div>

              <div className={styles.formHeading}>
                <span className={styles.sectionEyebrow}>GET STARTED</span>
                <h2 id="register-title">Create your account</h2>
                <p>
                  Set up your {APP_NAME} account to access your development
                  workspace.
                </p>
              </div>

              {error && (
                <div className={styles.error} role="alert" aria-live="polite">
                  <span className={styles.errorIcon}>!</span>
                  <p>{error}</p>
                </div>
              )}

              <form className={styles.form} onSubmit={handleRegister} noValidate>
                <div className={styles.field}>
                  <label htmlFor="register-name">Full name</label>
                  <div className={styles.inputShell}>
                    <span className={styles.inputIcon}>
                      <Icon name="user" size={17} />
                    </span>
                    <input
                      id="register-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={busy}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="register-email">Work email</label>
                  <div className={styles.inputShell}>
                    <span className={styles.inputIcon}>
                      <Icon name="mail" size={17} />
                    </span>
                    <input
                      id="register-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={busy}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label htmlFor="register-password">Password</label>
                    {password && (
                      <span
                        className={`${styles.strength} ${
                          styles[strengthLabel.toLowerCase()]
                        }`}
                      >
                        {strengthLabel}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputShell}>
                    <span className={styles.inputIcon}>
                      <Icon name="lock" size={17} />
                    </span>
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={busy}
                      required
                      minLength={8}
                      aria-describedby="password-hints"
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={busy}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                    </button>
                  </div>

                  <div className={styles.passwordHints} id="password-hints">
                    <span className={passwordChecks.length ? styles.hintPassed : ""}>
                      <Icon name="check" size={12} /> 8+ characters
                    </span>
                    <span className={passwordChecks.uppercase ? styles.hintPassed : ""}>
                      <Icon name="check" size={12} /> Uppercase
                    </span>
                    <span className={passwordChecks.number ? styles.hintPassed : ""}>
                      <Icon name="check" size={12} /> Number
                    </span>
                    <span className={passwordChecks.special ? styles.hintPassed : ""}>
                      <Icon name="check" size={12} /> Symbol
                    </span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="register-confirm-password">
                    Confirm password
                  </label>
                  <div
                    className={`${styles.inputShell} ${
                      passwordsMatch ? styles.inputSuccess : ""
                    }`}
                  >
                    <span className={styles.inputIcon}>
                      <Icon name="lock" size={17} />
                    </span>
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      disabled={busy}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      disabled={busy}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirmation password"
                          : "Show confirmation password"
                      }
                      aria-pressed={showConfirmPassword}
                    >
                      <Icon
                        name={showConfirmPassword ? "eyeOff" : "eye"}
                        size={18}
                      />
                    </button>
                  </div>

                  {confirmPassword && (
                    <span
                      className={
                        passwordsMatch
                          ? styles.matchSuccess
                          : styles.matchError
                      }
                    >
                      <Icon
                        name={passwordsMatch ? "check" : "lock"}
                        size={13}
                      />
                      {passwordsMatch
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </span>
                  )}
                </div>

                <label className={styles.terms}>
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) =>
                      setAcceptedTerms(event.target.checked)
                    }
                    disabled={busy}
                    required
                  />
                  <span className={styles.customCheckbox}>
                    <Icon name="check" size={12} />
                  </span>
                  <span className={styles.termsText}>
                    I agree to the <Link to="/terms" className={styles.inlineLink}>Terms of Service</Link>
                    {" "}and <Link to="/privacy" className={styles.inlineLink}>Privacy Policy</Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={busy}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner} />
                      Creating your account…
                    </>
                  ) : (
                    <>
                      Create account
                      <Icon name="arrow" size={17} />
                    </>
                  )}
                </button>
              </form>

              <div className={styles.divider}>
                <span />
                <small>OR SIGN UP WITH</small>
                <span />
              </div>

              <div className={styles.oauthGrid}>
                <button
                  type="button"
                  className={styles.oauthButton}
                  onClick={handleGoogleRegister}
                  disabled={busy}
                >
                  {oauthLoading === "google" ? (
                    <span className={styles.oauthSpinner} />
                  ) : (
                    <Icon name="google" size={18} />
                  )}
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  className={styles.oauthButton}
                  onClick={handleGitHubRegister}
                  disabled={busy}
                >
                  {oauthLoading === "github" ? (
                    <span className={styles.oauthSpinner} />
                  ) : (
                    <Icon name="github" size={18} />
                  )}
                  <span>GitHub</span>
                </button>
              </div>

              <p className={styles.signinPrompt}>
                Already have an account?
                <Link to="/login" className={styles.signinLink}>
                  Sign in <Icon name="arrow" size={13} />
                </Link>
              </p>

              <div className={styles.securityNote}>
                <Icon name="shield" size={15} />
                <span>
                  Your session is managed securely by the {APP_NAME} authentication service.
                </span>
              </div>
            </div>
          </section>
        </div>

        <footer className={styles.pageFooter}>
          <span>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </span>
          <div className={styles.footerLinks}>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </footer>
      </main>
    </AuthLayout>
  );
}

export default Register;
