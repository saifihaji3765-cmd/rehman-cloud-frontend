import {
  Navigate
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

function PublicRoute({
  children
}) {

  const {
    authenticated,
    loading
  } = useAuth();

  /*
  ================================
  AUTH INITIALIZATION
  ================================
  Backend se authentication check
  hone tak redirect mat karo.
  */

  if (loading) {

    return (
      <div>
        Loading...
      </div>
    );

  }

  /*
  ================================
  ALREADY AUTHENTICATED
  ================================
  */

  if (authenticated) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }

  /*
  ================================
  NOT AUTHENTICATED
  ================================
  */

  return children;

}

export default PublicRoute;
