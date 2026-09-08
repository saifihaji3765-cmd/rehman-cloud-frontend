import {
  Navigate,
  useLocation
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


/*
|--------------------------------------------------------------------------
| ZYRIONOS — PROTECTED ROUTE
|--------------------------------------------------------------------------
|
| Purpose:
| Protect authenticated application routes.
|
| Architecture:
|
| AuthProvider
|      ↓
| ProtectedRoute
|      ↓
| Protected Page
|
| Responsibilities:
| - Wait for authentication initialization.
| - Prevent protected content from rendering before auth is known.
| - Redirect unauthenticated users to /login.
| - Preserve the attempted location.
|
| IMPORTANT:
| - This is NOT the final security boundary.
| - Backend authorization remains authoritative.
| - No JWT is read from localStorage.
| - No project ownership is checked here.
| - No business permissions are invented here.
|--------------------------------------------------------------------------
*/


function ProtectedRoute({
  children
}) {
  const {
    authenticated,
    loading
  } = useAuth();

  const location =
    useLocation();


  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATION INITIALIZATION
  |--------------------------------------------------------------------------
  |
  | While AuthProvider is checking the real backend session,
  | do not render protected application content.
  |
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main
        aria-busy="true"
        aria-live="polite"
      >
        <p>
          Checking your session...
        </p>
      </main>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | UNAUTHENTICATED
  |--------------------------------------------------------------------------
  |
  | Authentication has finished loading and the user does not
  | have a valid authenticated session.
  |
  | Preserve the complete location so the authentication flow
  | can know which protected destination was requested.
  |
  |--------------------------------------------------------------------------
  */

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location
        }}
      />
    );
  }


  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATED
  |--------------------------------------------------------------------------
  */

  return children;
}


export default ProtectedRoute;
