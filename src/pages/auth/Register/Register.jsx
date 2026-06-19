import { useState } from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";

import styles from "./Register.module.css";

import {
  register,
  saveAuth,
  loginWithGoogle,
  loginWithGithub
} from "../../../services/authService";

import {
  useAuth
} from "../../../context/AuthContext";

import {
  APP_NAME
} from "../../../config/constants";

function Register() {

  const navigate =
  useNavigate();

  const { setUser } =
  useAuth();

  const [name,setName] =
  useState("");

  const [email,setEmail] =
  useState("");

  const [password,setPassword] =
  useState("");

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");

  const [accepted,
  setAccepted] =
  useState(false);

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword
  ] = useState(false);

  const [loading,
  setLoading] =
  useState(false);

  const [error,
  setError] =
  useState("");

  async function handleRegister(){

    try{

      setError("");

      if(
        !name ||
        !email ||
        !password
      ){
        return setError(
          "All fields are required"
        );
      }

      if(
        password !==
        confirmPassword
      ){
        return setError(
          "Passwords do not match"
        );
      }

      if(!accepted){
        return setError(
          "Please accept Terms and Privacy Policy"
        );
      }

      setLoading(true);

      const response =
      await register({

        name,
        email,
        password

      });

      saveAuth(

        response.token,

        response.user

      );

      setUser(
        response.user
      );

      navigate(
        "/dashboard"
      );

    }

    catch(error){

      setError(

        error.message ||

        "Registration failed"

      );

    }

    finally{

      setLoading(false);

    }

  }

  return (

    <AuthLayout>

      <div className={styles.container}>

        {/* LEFT */}

        <div className={styles.left}>

          <div className={styles.brand}>
            {APP_NAME}
          </div>

          <h1 className={styles.heading}>
            Create Your AI Cloud Workspace
          </h1>

          <p className={styles.description}>
            Join {APP_NAME} and build SaaS
            products, AI applications,
            automation systems and cloud
            infrastructure from a single prompt.
          </p>

        </div>

        {/* RIGHT */}

        <div className={styles.card}>

          <h2 className={styles.title}>
            Create Account
          </h2>

          <p className={styles.subtitle}>
            Start building with {APP_NAME}
          </p>

          {error && (

            <p
              style={{
                color:"#ef4444",
                marginBottom:"12px"
              }}
            >
              {error}
            </p>

          )}

          <input
            type="text"
            placeholder="Full Name"
            className={styles.input}
            value={name}
            onChange={(e)=>
              setName(
                e.target.value
              )
            }
          />

          <input
            type="email"
            placeholder="Email Address"
            className={styles.input}
            value={email}
            onChange={(e)=>
              setEmail(
                e.target.value
              )
            }
          />

          <div className={styles.passwordWrapper}>

            <input
              type={
                showPassword
                ? "text"
                : "password"
              }
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e)=>
                setPassword(
                  e.target.value
                )
              }
            />

            <button
              type="button"
              className={styles.eyeButton}
              onClick={()=>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword
                ? "🙈"
                : "👁"}
            </button>

          </div>

          <div className={styles.passwordWrapper}>

            <input
              type={
                showConfirmPassword
                ? "text"
                : "password"
              }
              placeholder="Confirm Password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e)=>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

            <button
              type="button"
              className={styles.eyeButton}
              onClick={()=>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
              {showConfirmPassword
                ? "🙈"
                : "👁"}
            </button>

          </div>

          <label className={styles.checkboxLabel}>

            <input
              type="checkbox"
              checked={accepted}
              onChange={(e)=>
                setAccepted(
                  e.target.checked
                )
              }
            />

            I agree to the Terms and Privacy Policy

          </label>

          <button
            className={styles.primaryButton}
            onClick={handleRegister}
            disabled={loading}
          >

            {loading

              ? "Creating Account..."

              : "Create Account"}

          </button>

          <div className={styles.divider}>
            OR
          </div>

          <button
            className={styles.oauthButton}
            onClick={loginWithGoogle}
          >
            Continue with Google
          </button>

          <button
            className={styles.oauthButton}
            onClick={loginWithGithub}
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
