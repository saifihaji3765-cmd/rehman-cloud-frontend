import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const {
    authenticated,
    loading
  } = useAuth();

  const location = useLocation();

  /* =========================
     AUTH INITIALIZATION
  ========================= */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        Loading...
      </div>
    );
  }

  /* =========================
     NOT AUTHENTICATED
  ========================= */

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    );
  }

  /* =========================
     AUTHENTICATED
  ========================= */

  return children;
}

export default ProtectedRoute;
