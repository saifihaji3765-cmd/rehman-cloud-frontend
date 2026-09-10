import { useMemo, useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";

import styles from "./Register.module.css";

import {
  register,
  saveAuth,
  loginWithGoogle,
  loginWithGithub,
} from "../../../services/authService";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  APP_NAME,
} from "../../../config/constants";


/* =========================================================
   ICON SYSTEM
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
    "aria-hidden": "true",
    focusable: "false",
  };

  switch (name) {

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5" />
        </svg>
      );

    case "mail":
      return (
        <svg {...common}>
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
          />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="2"
          />
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
          <path d="M3 3l18 18" />
          <path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.8" />
          <path d="M6.7 6.7C4 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.1-.2 3-.5" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "alert":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
        </svg>
      );

    case "google":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M21.35 12.27c0-.78-.07-1.53-.22-2.25H12v4.26h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.4Z"
          />
          <path
            fill="currentColor"
            d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.72-1.72-5.5-4.04H3.25v2.53A9.75 9.75 0 0 0 12 21.75Z"
          />
          <path
            fill="currentColor"
            d="M6.5 13.83A5.86 5.86 0 0 1 6.19 12c0-.64.11-1.26.31-1.83V7.64H3.25A9.76 9.76 0 0 0 2.25 12c0 1.57.38 3.05 1 4.36l3.25-2.53Z"
          />
          <path
            fill="currentColor"
            d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.22 14.62 2.25 12 2.25a9.75 9.75 0 0 0-8.75 5.39L6.5 10.17c.78-2.32 2.95-4.04 5.5-4.04Z"
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
          focusable="false"
        >
          <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.34-3.8-1.34-.5-1.27-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.58 1.19 3.21.91.1-.71.38-1.2.7-1.48-2.51-.29-5.15-1.26-5.15-5.6 0-1.24.44-2.25 1.16-3.04-.12-.28-.5-1.44.11-3 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.64 0c2.15-1.46 3.1-1.16 3.1-1.16.61 1.56.23 2.72.11 3 .72.79 1.16 1.8 1.16 3.04 0 4.35-2.65 5.3-5.17 5.59.39.34.74 1 .74 2.02v2.99c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
        </svg>
      );

    default:
      return null;
  }
}


/* =========================================================
   REGISTER
========================================================= */

function Register() {

  const navigate = useNavigate();

  const {
    setUser,
    setAuthenticated,
  } = useAuth();


  /* -------------------------------------------------------
     FORM STATE
  ------------------------------------------------------- */

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [accepted, setAccepted] = useState(false);


  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    oauthLoading,
    setOauthLoading,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  /* -------------------------------------------------------
     PASSWORD STRENGTH
  ------------------------------------------------------- */

  const passwordStrength = useMemo(() => {

    if (!password) {
      return {
        score: 0,
        label: "",
      };
    }

    let score = 0;

    if (password.length >= 8) {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    let label = "Weak";

    if (score >= 4) {
      label = "Strong";
    } else if (score >= 2) {
      label = "Good";
    }

    return {
      score,
      label,
    };

  }, [password]);


  /* -------------------------------------------------------
     PASSWORD MATCH
  ------------------------------------------------------- */

  const passwordMatches =
    confirmPassword.length > 0 &&
    password === confirmPassword;


  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  function validateForm() {

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim();

    if (!cleanName) {
      return "Please enter your full name.";
    }

    if (!cleanEmail) {
      return "Please enter your email address.";
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return "Please enter a valid email address.";
    }

    if (!password) {
      return "Please create a password.";
    }

    if (password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    if (!accepted) {
      return "Please accept the Terms and Privacy Policy.";
    }

    return "";

  }


  /* -------------------------------------------------------
     REGISTER
  ------------------------------------------------------- */

  async function handleRegister(event) {

    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {

      setLoading(true);

      const response =
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });


      /*
       * Auth tokens are intentionally not
       * persisted by the frontend.
       *
       * saveAuth receives the authenticated
       * user first, matching authService.
       */

      saveAuth(
        response.user,
        response.token
      );

      setUser(
        response.user
      );

      setAuthenticated(true);

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );

    } catch (requestError) {

      setError(
        requestError?.message ||
        requestError?.response?.data?.message ||
        "Registration failed. Please try again."
      );

    } finally {

      setLoading(false);

    }

  }


  /* -------------------------------------------------------
     GOOGLE
  ------------------------------------------------------- */

  function handleGoogleLogin() {

    if (loading || oauthLoading) {
      return;
    }

    setError("");

    setOauthLoading("google");

    loginWithGoogle();

  }


  /* -------------------------------------------------------
     GITHUB
  ------------------------------------------------------- */

  function handleGithubLogin() {

    if (loading || oauthLoading) {
      return;
    }

    setError("");

    setOauthLoading("github");

    loginWithGithub();

  }


  return (

    <AuthLayout>

      <div className={styles.container}>

        {/* =================================================
            LEFT PRODUCT EXPERIENCE
        ================================================== */}

        <section
          className={styles.left}
          aria-label={`${APP_NAME} platform`}
        >

          <div className={styles.brand}>
            {APP_NAME}
          </div>


          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeIcon}>
              <Icon
                name="spark"
                size={15}
              />
            </span>

            <span>
              AI CLOUD PLATFORM
            </span>
          </div>


          <h1 className={styles.heading}>
            Create your
            <br />
            AI cloud workspace.
          </h1>


          <p className={styles.description}>
            Join {APP_NAME} and build SaaS
            products, AI applications,
            automation systems and cloud
            infrastructure from one intelligent
            workspace.
          </p>


          <div className={styles.featureList}>

            <div className={styles.featureItem}>

              <span className={styles.featureIcon}>
                <Icon
                  name="check"
                  size={14}
                />
              </span>

              <span>
                Build and operate applications
                from one workspace
              </span>

            </div>


            <div className={styles.featureItem}>

              <span className={styles.featureIcon}>
                <Icon
                  name="check"
                  size={14}
                />
              </span>

              <span>
                Connect AI, cloud infrastructure
                and deployment workflows
              </span>

            </div>


            <div className={styles.featureItem}>

              <span className={styles.featureIcon}>
                <Icon
                  name="check"
                  size={14}
                />
              </span>

              <span>
                Move from idea to production
                with an enterprise workflow
              </span>

            </div>

          </div>


          <div className={styles.productMeta}>

            <span className={styles.statusDot} />

            <span>
              Secure workspace infrastructure
            </span>

          </div>

        </section>


        {/* =================================================
            REGISTER PANEL
        ================================================== */}

        <section
          className={styles.card}
          aria-label="Create your account"
        >

          <div className={styles.cardTop}>

            <div className={styles.mobileBrandMark}>
              <span />
              <span />
              <span />
            </div>


            <div className={styles.headerIcon}>
              <Icon
                name="spark"
                size={19}
              />
            </div>

          </div>


          <div className={styles.titleBlock}>

            <span className={styles.eyebrow}>
              GET STARTED
            </span>

            <h2 className={styles.title}>
              Create your account
            </h2>

            <p className={styles.subtitle}>
              Set up your {APP_NAME} workspace
              and start building.
            </p>

          </div>


          {/* =================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              className={styles.error}
              role="alert"
              aria-live="polite"
            >

              <span className={styles.errorIcon}>
                <Icon
                  name="alert"
                  size={14}
                />
              </span>

              <span>
                {error}
              </span>

            </div>

          )}


          {/* =================================================
              FORM
          ================================================== */}

          <form
            className={styles.form}
            onSubmit={handleRegister}
            noValidate
          >

            {/* NAME */}

            <div className={styles.field}>

              <label
                className={styles.label}
                htmlFor="register-name"
              >
                Full name
              </label>

              <div className={styles.inputShell}>

                <span className={styles.inputIcon}>
                  <Icon
                    name="user"
                    size={18}
                  />
                </span>

                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  className={styles.input}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* EMAIL */}

            <div className={styles.field}>

              <label
                className={styles.label}
                htmlFor="register-email"
              >
                Work email
              </label>

              <div className={styles.inputShell}>

                <span className={styles.inputIcon}>
                  <Icon
                    name="mail"
                    size={18}
                  />
                </span>

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@company.com"
                  className={styles.input}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className={styles.field}>

              <div className={styles.labelRow}>

                <label
                  className={styles.label}
                  htmlFor="register-password"
                >
                  Password
                </label>

                {password && (
                  <span
                    className={`${styles.passwordStrength} ${
                      passwordStrength.score >= 4
                        ? styles.passwordStrong
                        : passwordStrength.score >= 2
                          ? styles.passwordGood
                          : styles.passwordWeak
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                )}

              </div>


              <div className={styles.inputShell}>

                <span className={styles.inputIcon}>
                  <Icon
                    name="lock"
                    size={18}
                  />
                </span>

                <input
                  id="register-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  className={styles.inputWithAction}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className={styles.eyeButton}
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
                  disabled={loading}
                >
                  <Icon
                    name={
                      showPassword
                        ? "eyeOff"
                        : "eye"
                    }
                    size={18}
                  />
                </button>

              </div>


              <div className={styles.passwordHint}>

                <span
                  className={
                    password.length >= 8
                      ? styles.hintPassed
                      : ""
                  }
                >
                  <Icon
                    name="check"
                    size={12}
                  />
                  8+ characters
                </span>

                <span
                  className={
                    /[A-Z]/.test(password) &&
                    /[0-9]/.test(password)
                      ? styles.hintPassed
                      : ""
                  }
                >
                  <Icon
                    name="check"
                    size={12}
                  />
                  Number + uppercase
                </span>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className={styles.field}>

              <label
                className={styles.label}
                htmlFor="register-confirm-password"
              >
                Confirm password
              </label>

              <div
                className={`${styles.inputShell} ${
                  passwordMatches
                    ? styles.inputShellSuccess
                    : ""
                }`}
              >

                <span className={styles.inputIcon}>
                  <Icon
                    name="lock"
                    size={18}
                  />
                </span>

                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={styles.inputWithAction}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value
                    );
                    setError("");
                  }}
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={
                    showConfirmPassword
                  }
                  disabled={loading}
                >
                  <Icon
                    name={
                      showConfirmPassword
                        ? "eyeOff"
                        : "eye"
                    }
                    size={18}
                  />
                </button>

              </div>


              {confirmPassword && (
                <div
                  className={
                    passwordMatches
                      ? styles.matchSuccess
                      : styles.matchError
                  }
                >

                  <Icon
                    name={
                      passwordMatches
                        ? "check"
                        : "alert"
                    }
                    size={12}
                  />

                  {passwordMatches
                    ? "Passwords match"
                    : "Passwords do not match"}

                </div>
              )}

            </div>


            {/* TERMS */}

            <label className={styles.checkboxLabel}>

              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => {
                  setAccepted(
                    event.target.checked
                  );
                  setError("");
                }}
                disabled={loading}
                required
              />

              <span className={styles.checkboxVisual}>
                <Icon
                  name="check"
                  size={12}
                />
              </span>

              <span className={styles.termsText}>
                I agree to the Terms and Privacy Policy
              </span>

            </label>


            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >

              {loading ? (

                <>
                  <span className={styles.spinner} />

                  Creating workspace...
                </>

              ) : (

                <>
                  Create Account

                  <Icon
                    name="arrow"
                    size={18}
                  />
                </>

              )}

            </button>

          </form>


          {/* =================================================
              SOCIAL LOGIN
          ================================================== */}

          <div className={styles.divider}>
            <span />
            <span>
              OR CONTINUE WITH
            </span>
            <span />
          </div>


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
              LOGIN LINK
          ================================================== */}

          <div className={styles.footer}>

            <span>
              Already have an account?
            </span>

            <Link
              to="/login"
              className={styles.link}
            >
              Sign In
              <Icon
                name="arrow"
                size={14}
              />
            </Link>

          </div>


          {/* =================================================
              SECURITY
          ================================================== */}

          <div className={styles.securityFooter}>

            <span className={styles.securityIcon}>
              <Icon
                name="check"
                size={12}
              />
            </span>

            <span>
              Your account credentials are
              protected by secure authentication.
            </span>

          </div>

        </section>

      </div>

    </AuthLayout>

  );
}

export default Register;
