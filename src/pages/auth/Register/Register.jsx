
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import styles from "./Register.module.css";

import {
  register,
  saveAuth,
  getCurrentUser,
  loginWithGoogle,
  loginWithGithub,
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
    focusable: false,
  };

  const paths = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.8" /><path d="M6.7 6.7C4 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.1-.2 3-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
    spark: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /></>,
    google: <path fill="currentColor" stroke="none" d="M21.35 12.27c0-.78-.07-1.53-.22-2.25H12v4.26h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.4ZM12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.72-1.72-5.5-4.04H3.25v2.53A9.75 9.75 0 0 0 12 21.75ZM6.5 13.83A5.86 5.86 0 0 1 6.19 12c0-.64.11-1.26.31-1.83V7.64H3.25A9.76 9.76 0 0 0 2.25 12c0 1.57.38 3.05 1 4.36l3.25-2.53ZM12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.22 14.62 2.25 12 2.25a9.75 9.75 0 0 0-8.75 5.39L6.5 10.17c.78-2.32 2.95-4.04 5.5-4.04Z" />,
    github: <path fill="currentColor" stroke="none" d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.34-3.8-1.34-.5-1.27-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.58 1.19 3.21.91.1-.71.38-1.2.7-1.48-2.51-.29-5.15-1.26-5.15-5.6 0-1.24.44-2.25 1.16-3.04-.12-.28-.5-1.44.11-3 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.64 0c2.15-1.46 3.1-1.16 3.1-1.16.61 1.56.23 2.72.11 3 .72.79 1.16 1.8 1.16 3.04 0 4.35-2.65 5.3-5.17 5.59.39.34.74 1 .74 2.02v2.99c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />,
  };

  return <svg {...common}>{paths[name] || null}</svg>;
}

function Register() {
  const navigate = useNavigate();
  const { setUser, setAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return {
      score,
      label: score >= 4 ? "Strong" : score >= 2 ? "Good" : "Weak",
    };
  }, [password]);

  const passwordMatches =
    confirmPassword.length > 0 && password === confirmPassword;

  function validateForm() {
    if (!name.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (!password) return "Please create a password.";
    if (password.length < 8) return "Password must contain at least 8 characters.";
    if (!confirmPassword) return "Please confirm your password.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!accepted) return "Please accept the Terms and Privacy Policy.";
    return "";
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (loading || oauthLoading) return;

    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      let user =
        response?.user ||
        response?.data?.user ||
        null;

      // Some backends establish a cookie but omit the user
      // from the registration response. Verify that session
      // with the existing authoritative /me endpoint.
      if (!user) {
        try {
          const session = await getCurrentUser();
          user =
            session?.data?.user ||
            session?.data?.data?.user ||
            null;
        } catch {
          user = null;
        }
      }

      if (!user) {
        setError(
          "Your registration request completed, but we could not verify an active session. Please sign in."
        );
        return;
      }

      saveAuth(user);
      setUser(user);
      setAuthenticated(true);

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider) {
    if (loading || oauthLoading) return;

    setError("");
    setOauthLoading(provider);

    try {
      if (provider === "google") {
        loginWithGoogle();
      } else {
        loginWithGithub();
      }
    } catch {
      setOauthLoading("");
      setError(`Unable to start ${provider} authentication. Please try again.`);
    }
  }

  const disabled = loading || Boolean(oauthLoading);

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <header className={styles.topbar}>
        <Link to="/" className={styles.brand} aria-label={`${APP_NAME} home`}>
          <span className={styles.brandMark}>
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className={styles.brandCopy}>
            <strong>{APP_NAME}</strong>
            <small>AI Cloud Operating System</small>
          </span>
        </Link>

        <div className={styles.topbarRight}>
          <span className={styles.secureBadge}>
            <Icon name="check" size={13} />
            Secure workspace
          </span>
          <span className={styles.topbarPrompt}>
            Already registered?
          </span>
          <Link to="/login" className={styles.topbarLink}>
            Sign in <Icon name="arrow" size={14} />
          </Link>
        </div>
      </header>

      <section className={styles.workspace}>
        <aside className={styles.presentation}>
          <div className={styles.presentationContent}>
            <div className={styles.overline}>
              <span className={styles.liveDot} />
              YOUR AI-POWERED DEVELOPMENT WORKSPACE
            </div>

            <h1 className={styles.heroTitle}>
              Turn ideas into
              <br />
              <span>working software.</span>
            </h1>

            <p className={styles.heroDescription}>
              Create an account to bring AI-assisted development,
              code intelligence and deployment workflows into
              one connected workspace.
            </p>

            <div className={styles.capabilities}>
              <article className={styles.capability}>
                <span className={styles.capabilityIcon}>
                  <Icon name="spark" size={19} />
                </span>
                <div>
                  <h3>AI-assisted development</h3>
                  <p>Move from project requirements to implementation.</p>
                </div>
              </article>

              <article className={styles.capability}>
                <span className={styles.capabilityIcon}>
                  <Icon name="check" size={19} />
                </span>
                <div>
                  <h3>Code intelligence</h3>
                  <p>Review code, investigate issues and improve reliability.</p>
                </div>
              </article>

              <article className={styles.capability}>
                <span className={styles.capabilityIcon}>
                  <Icon name="arrow" size={19} />
                </span>
                <div>
                  <h3>Build and deployment workflows</h3>
                  <p>Keep project execution and deployment activity connected.</p>
                </div>
              </article>
            </div>

            <div className={styles.workflow}>
              <div className={styles.workflowHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>A CONNECTED WORKFLOW</span>
                  <h2>From idea to deployment</h2>
                </div>
                <span className={styles.workflowLabel}>OVERVIEW</span>
              </div>

              <div className={styles.steps}>
                {["Plan", "Build", "Review", "Deploy"].map((step, index) => (
                  <div className={styles.step} key={step}>
                    <span className={styles.stepNumber}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.stepName}>{step}</span>
                  </div>
                ))}
              </div>

              <p className={styles.workflowNote}>
                Follow the stages of your development process in one workspace.
              </p>
            </div>

            <div className={styles.trustNote}>
              <span className={styles.trustIcon}>
                <Icon name="lock" size={15} />
              </span>
              <div>
                <strong>Built for focused development</strong>
                <p>One workspace for building, reviewing and operating projects.</p>
              </div>
            </div>
          </div>

          <footer className={styles.presentationFooter}>
            <span>AI-assisted development</span>
            <span>Project operations</span>
            <span>Cloud workflows</span>
          </footer>
        </aside>

        <section className={styles.formPanel} aria-labelledby="register-title">
          <div className={styles.formCard}>
            <div className={styles.formTop}>
              <span className={styles.formIcon}>
                <Icon name="spark" size={20} />
              </span>
              <span className={styles.stepPill}>ACCOUNT SETUP</span>
            </div>

            <div className={styles.formHeading}>
              <span className={styles.sectionEyebrow}>GET STARTED</span>
              <h2 id="register-title">Create your account</h2>
              <p>Set up your workspace and start building.</p>
            </div>

            {error && (
              <div className={styles.error} role="alert" aria-live="polite">
                <Icon name="alert" size={17} />
                <span>{error}</span>
              </div>
            )}

            <form className={styles.form} onSubmit={handleRegister} noValidate>
              <div className={styles.field}>
                <label htmlFor="register-name">Full name</label>
                <div className={styles.inputShell}>
                  <Icon name="user" size={18} />
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    disabled={disabled}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="register-email">Email address</label>
                <div className={styles.inputShell}>
                  <Icon name="mail" size={18} />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    disabled={disabled}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label htmlFor="register-password">Password</label>
                  {password && (
                    <span className={`${styles.strength} ${
                      passwordStrength.score >= 4
                        ? styles.strong
                        : passwordStrength.score >= 2
                          ? styles.good
                          : styles.weak
                    }`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>

                <div className={styles.inputShell}>
                  <Icon name="lock" size={18} />
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    disabled={disabled}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={disabled}
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                  </button>
                </div>

                <div className={styles.passwordHints}>
                  <span className={password.length >= 8 ? styles.hintPassed : ""}>
                    <Icon name="check" size={12} /> At least 8 characters
                  </span>
                  <span className={/[A-Z]/.test(password) && /[0-9]/.test(password) ? styles.hintPassed : ""}>
                    <Icon name="check" size={12} /> Uppercase and number
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="register-confirm-password">Confirm password</label>
                <div className={`${styles.inputShell} ${passwordMatches ? styles.inputSuccess : ""}`}>
                  <Icon name="lock" size={18} />
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    disabled={disabled}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    disabled={disabled}
                  >
                    <Icon name={showConfirmPassword ? "eyeOff" : "eye"} size={18} />
                  </button>
                </div>

                {confirmPassword && (
                  <span className={passwordMatches ? styles.matchSuccess : styles.matchError}>
                    <Icon name={passwordMatches ? "check" : "alert"} size={13} />
                    {passwordMatches ? "Passwords match" : "Passwords do not match"}
                  </span>
                )}
              </div>

              <label className={styles.terms}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => {
                    setAccepted(event.target.checked);
                    setError("");
                  }}
                  disabled={disabled}
                  required
                />
                <span className={styles.customCheckbox}>
                  <Icon name="check" size={12} />
                </span>
                <span>
                  I agree to the{" "}
                  <Link to="/terms" className={styles.inlineLink}>Terms</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className={styles.inlineLink}>Privacy Policy</Link>.
                </span>
              </label>

              <button type="submit" className={styles.primaryButton} disabled={disabled}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Creating your account...
                  </>
                ) : (
                  <>
                    Create account
                    <Icon name="arrow" size={18} />
                  </>
                )}
              </button>
            </form>

            <div className={styles.divider}>
              <span />
              <span>OR CONTINUE WITH</span>
              <span />
            </div>

            <div className={styles.oauthGrid}>
              <button
                type="button"
                className={styles.oauthButton}
                onClick={() => handleOAuth("google")}
                disabled={disabled}
              >
                {oauthLoading === "google"
                  ? <span className={styles.spinner} />
                  : <Icon name="google" size={18} />}
                Google
              </button>

              <button
                type="button"
                className={styles.oauthButton}
                onClick={() => handleOAuth("github")}
                disabled={disabled}
              >
                {oauthLoading === "github"
                  ? <span className={styles.spinner} />
                  : <Icon name="github" size={18} />}
                GitHub
              </button>
            </div>

            <div className={styles.signinPrompt}>
              Already have an account?
              <Link to="/login" className={styles.signinLink}>
                Sign in <Icon name="arrow" size={14} />
              </Link>
            </div>

            <div className={styles.securityNote}>
              <Icon name="lock" size={13} />
              Authentication is handled by the ZyrionOS authentication service.
            </div>
          </div>
        </section>
      </section>

      <footer className={styles.pageFooter}>
        <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
        <div>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
      </footer>
    </main>
  );
}

export default Register;
