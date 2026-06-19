import { useState } from "react";

import {

  Link,

  useNavigate

} from "react-router-dom";

import AuthLayout from "../../../layouts/AuthLayout/AuthLayout.jsx";

import styles from "./Login.module.css";

import {

  login,

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

function Login() {

  const navigate =
  useNavigate();

  const { setUser } =
  useAuth();

  const [email,setEmail] =
  useState("");

  const [password,setPassword] =
  useState("");

  const [showPassword,
  setShowPassword] =
  useState(false);

  const [loading,
  setLoading] =
  useState(false);

  const [error,
  setError] =
  useState("");

  async function handleLogin(){

    try{

      setLoading(true);

      setError("");

      const response =

      await login(

        email,

        password

      );

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

        "Login Failed"

      );

    }

    finally{

      setLoading(false);

    }

  }

  return (

    <AuthLayout>

      <div className={styles.container}>

        <div className={styles.left}>

          <div className={styles.brand}>
            {APP_NAME}
          </div>

          <h1 className={styles.heading}>
            Build, Deploy & Scale
            Software With AI
          </h1>

          <p className={styles.description}>
            Create SaaS platforms,
            AI products,
            cloud applications
            and business systems
            from a single prompt.
          </p>

        </div>

        <div className={styles.card}>

          <h2 className={styles.title}>
            Sign In
          </h2>

          <p className={styles.subtitle}>
            Access your workspace
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

          <div
            className={
              styles.passwordWrapper
            }
          >

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
              className={
                styles.eyeButton
              }
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

          <div
            className={
              styles.rememberRow
            }
          >

            <label
              className={
                styles.checkboxLabel
              }
            >

              <input
                type="checkbox"
              />

              Remember Me

            </label>

          </div>

          <button
            className={
              styles.primaryButton
            }
            onClick={handleLogin}
            disabled={loading}
          >

            {loading

              ? "Signing In..."

              : "Sign In"}

          </button>

          <div
            className={
              styles.divider
            }
          >

            OR

          </div>

          <button
            className={
              styles.oauthButton
            }
            onClick={
              loginWithGoogle
            }
          >

            Continue with Google

          </button>

          <button
            className={
              styles.oauthButton
            }
            onClick={
              loginWithGithub
            }
          >

            Continue with GitHub

          </button>

          <div
            className={
              styles.footer
            }
          >

            <Link
              to="/register"
              className={
                styles.link
              }
            >

              Create Account

            </Link>

            <Link
              to="/forgot-password"
              className={
                styles.link
              }
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
